-- ============================================================
-- NKAMA — Migration 0009 : Alertes intelligentes (Phase 6)
-- ============================================================
-- Chaque alerte devient actionnable :
--   • table `alert_states`  : « marquer traité » (par owner, partagé) —
--     l'alerte disparaît du dashboard ET des notifications tant que la
--     condition persiste ; purge automatique quand elle est résolue ;
--   • table `reminders`     : rappels programmés (par utilisateur). Un
--     rappel dû apparaît comme une notification `rappel` jusqu'à ce qu'il
--     soit marqué traité ;
--   • vue `v_alertes_brutes` : ancienne v_alertes + colonnes `alert_key`
--     (clé stable, même format que la phase 5) et `meta` (jsonb contextuel :
--     téléphone du locataire, statut du ticket / de la dépense…) ;
--   • vue `v_alertes`        : v_alertes_brutes − alertes traitées
--     (consommée telle quelle par get_dashboard et get_notifications) ;
--   • RPC `mark_alert_treated(key)`, `create_alert_reminder(...)` ;
--   • `get_notifications()` renvoie désormais aussi `meta`.
-- Idempotent. À exécuter après 0008. (Aussi intégré à schema.sql.)
-- ============================================================

-- ------------------------------------------------------------
-- A. TABLES
-- ------------------------------------------------------------
create table if not exists alert_states (
  owner_id   uuid not null references owners(id) on delete cascade,
  alert_key  text not null,
  traite_par uuid references app_users(id) on delete set null,
  traite_le  timestamptz not null default now(),
  primary key (owner_id, alert_key)
);

alter table alert_states enable row level security;
drop policy if exists alert_states_all on alert_states;
create policy alert_states_all on alert_states
  for all
  using (is_active_user() and owner_id = current_owner_id())
  with check (
    is_active_user()
    and owner_id = current_owner_id()
    and traite_par = current_app_user_id()
  );

create table if not exists reminders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references owners(id)    on delete cascade,
  app_user_id uuid not null references app_users(id) on delete cascade,
  alert_key   text,                -- alerte d'origine (facultatif)
  entity_type text,                -- navigation au clic (facultatif)
  entity_id   uuid,
  titre       text not null,
  detail      text,
  remind_at   timestamptz not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_reminders_due
  on reminders(app_user_id, remind_at) where not done;

alter table reminders enable row level security;
drop policy if exists reminders_all on reminders;
create policy reminders_all on reminders
  for all
  using (is_active_user() and app_user_id = current_app_user_id())
  with check (
    is_active_user()
    and app_user_id = current_app_user_id()
    and owner_id = current_owner_id()
  );

-- ------------------------------------------------------------
-- B. VUES : v_alertes_brutes (+ alert_key, meta) puis v_alertes filtrée
-- ------------------------------------------------------------
-- `drop ... cascade` : évite l'erreur 42P16 (changement de colonnes d'une
-- vue existante). get_dashboard/get_notifications ne sont pas affectées
-- (corps SQL non lié), elles utiliseront la nouvelle définition.
drop view if exists v_alertes, v_alertes_brutes cascade;

create view v_alertes_brutes
with (security_invoker = on) as
-- Loyer en retard (agrégé par contrat : 1 alerte, tous les mois cumulés)
select
  'loyer_retard'::text as type, 'haute'::text as gravite,
  'Loyer en retard' as titre,
  t.nom || ' — ' || pr.nom || ' (' || count(*) || ' mois, '
    || to_char(sum(pay.montant), 'FM999G999') || ' FCFA)' as detail,
  'contract'::text as entity_type, c.id as entity_id,
  'loyer_retard:' || c.id as alert_key,
  jsonb_build_object(
    'locataire', t.nom,
    'telephone', coalesce(t.whatsapp, t.telephone),
    'montant',   sum(pay.montant),
    'bien',      pr.nom
  ) as meta
from payments pay
join contracts c on c.id = pay.contract_id
join tenants  t  on t.id = c.tenant_id
join properties pr on pr.id = c.property_id
where pay.statut = 'en_retard'
group by c.id, t.nom, t.telephone, t.whatsapp, pr.nom

union all
-- Contrat bientôt expiré
select
  'contrat_echeance', 'moyenne',
  'Contrat bientôt expiré',
  t.nom || ' — ' || pr.nom || ' (fin le ' || to_char(c.date_fin, 'DD/MM/YYYY') || ')',
  'contract', c.id,
  'contrat_echeance:' || c.id,
  jsonb_build_object(
    'locataire', t.nom,
    'telephone', coalesce(t.whatsapp, t.telephone),
    'date_fin',  to_char(c.date_fin, 'DD/MM/YYYY'),
    'bien',      pr.nom
  )
from contracts c
join tenants t on t.id = c.tenant_id
join properties pr on pr.id = c.property_id
where c.actif = true and c.date_fin is not null
  and c.date_fin <= (now() + (cfg_int('bail_echeance_jours') || ' days')::interval)::date

union all
-- Bien vacant depuis plus de N jours
select
  'bien_vacant', 'moyenne',
  'Bien vacant',
  pr.nom || ' — vacant depuis plus de ' || cfg_int('vacance_jours') || ' jours',
  'property', pr.id,
  'bien_vacant:' || pr.id,
  jsonb_build_object('bien', pr.nom)
from properties pr
where not exists (select 1 from contracts c where c.property_id = pr.id and c.actif = true)
  and coalesce(
        (select max(c2.date_fin) from contracts c2 where c2.property_id = pr.id),
        pr.created_at::date
      ) < (now() - (cfg_int('vacance_jours') || ' days')::interval)::date

union all
-- Ticket non traité depuis plus de N jours
select
  'ticket_ancien', 'haute',
  'Ticket non traité',
  mt.titre || ' — ' || pr.nom,
  'maintenance_ticket', mt.id,
  'ticket_ancien:' || mt.id,
  jsonb_build_object(
    'statut',      mt.statut,
    'bien',        pr.nom,
    'photo_avant', mt.photo_avant_doc_id is not null,
    'photo_apres', mt.photo_apres_doc_id is not null,
    'facture',     mt.facture_doc_id is not null
  )
from maintenance_tickets mt
join properties pr on pr.id = mt.property_id
where mt.statut <> 'cloture'
  and mt.created_at < now() - (cfg_int('ticket_sla_jours') || ' days')::interval

union all
-- Dépense sans justificatif (en attente)
select
  'depense_sans_justificatif', 'moyenne',
  'Dépense sans justificatif',
  coalesce(pr.nom, 'Dépense globale') || ' — ' || to_char(e.montant, 'FM999G999') || ' FCFA',
  'expense', e.id,
  'depense_sans_justificatif:' || e.id,
  jsonb_build_object('statut', e.statut, 'montant', e.montant)
from expenses e
left join properties pr on pr.id = e.property_id
where e.statut = 'en_attente' and e.justificatif_doc_id is null

union all
-- Dépense dépassant le seuil configurable
select
  'depense_seuil', 'haute',
  'Dépense au-dessus du seuil',
  coalesce(pr.nom, 'Dépense globale') || ' — ' || to_char(e.montant, 'FM999G999')
    || ' FCFA (> ' || to_char(cfg_int('seuil_depense_montant'), 'FM999G999') || ')',
  'expense', e.id,
  'depense_seuil:' || e.id,
  jsonb_build_object('statut', e.statut, 'montant', e.montant)
from expenses e
left join properties pr on pr.id = e.property_id
where e.montant > cfg_int('seuil_depense_montant')

union all
-- Rappels programmés arrivés à échéance (par utilisateur)
select
  'rappel', 'moyenne',
  'Rappel',
  r.titre || coalesce(' — ' || nullif(r.detail, ''), ''),
  r.entity_type, r.entity_id,
  'rappel:' || r.id,
  jsonb_build_object('note', r.detail, 'alert_key', r.alert_key)
from reminders r
where r.app_user_id = current_app_user_id()
  and not r.done
  and r.remind_at <= now();

-- Vue publique : alertes non « traitées » (dashboard + notifications)
create view v_alertes
with (security_invoker = on) as
select b.*
from v_alertes_brutes b
where not exists (
  select 1 from alert_states s
  where s.owner_id = current_owner_id()
    and s.alert_key = b.alert_key
);

-- ------------------------------------------------------------
-- C. RPC : get_notifications() renvoie aussi alert_key/meta
-- ------------------------------------------------------------
create or replace function get_notifications()
returns jsonb
language sql
stable
security invoker
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(x)
      order by x.lu asc, (x.gravite = 'haute') desc, x.titre asc
    ),
    '[]'::jsonb
  )
  from (
    select
      a.type, a.gravite, a.titre, a.detail, a.entity_type, a.entity_id,
      a.meta,
      a.alert_key as key,
      (nr.alert_key is not null) as lu
    from v_alertes a
    left join notification_reads nr
      on  nr.alert_key   = a.alert_key
      and nr.app_user_id = current_app_user_id()
  ) x;
$$;

grant execute on function get_notifications() to authenticated;

-- Purge de mark_notifications_read : comparer aux alertes BRUTES (une
-- alerte traitée mais non résolue garde sa trace de lecture).
create or replace function mark_notifications_read(p_keys text[])
returns void
language plpgsql
security invoker
as $$
declare
  v_user  uuid := current_app_user_id();
  v_owner uuid := current_owner_id();
begin
  if v_user is null or v_owner is null then
    return; -- utilisateur non relié : no-op
  end if;

  insert into notification_reads (app_user_id, owner_id, alert_key)
  select v_user, v_owner, k
  from unnest(p_keys) as k
  where k is not null and length(k) > 0
  on conflict (app_user_id, alert_key) do nothing;

  delete from notification_reads nr
  where nr.app_user_id = v_user
    and nr.alert_key not in (select b.alert_key from v_alertes_brutes b);
end;
$$;

grant execute on function mark_notifications_read(text[]) to authenticated;

-- ------------------------------------------------------------
-- D. RPC : marquer traité / programmer un rappel
-- ------------------------------------------------------------
create or replace function mark_alert_treated(p_key text)
returns void
language plpgsql
security invoker
as $$
declare
  v_user  uuid := current_app_user_id();
  v_owner uuid := current_owner_id();
begin
  if v_user is null or v_owner is null or p_key is null or length(p_key) = 0 then
    return;
  end if;

  if p_key like 'rappel:%' then
    -- Un rappel traité = terminé (par utilisateur).
    update reminders
       set done = true
     where id = substring(p_key from 8)::uuid
       and app_user_id = v_user;
  else
    insert into alert_states (owner_id, alert_key, traite_par)
    values (v_owner, p_key, v_user)
    on conflict (owner_id, alert_key) do nothing;
  end if;

  -- Purge : les états dont l'alerte est résolue ne servent plus.
  delete from alert_states s
  where s.owner_id = v_owner
    and s.alert_key not in (select b.alert_key from v_alertes_brutes b);
end;
$$;

grant execute on function mark_alert_treated(text) to authenticated;

create or replace function create_alert_reminder(
  p_titre       text,
  p_remind_at   timestamptz,
  p_detail      text default null,
  p_alert_key   text default null,
  p_entity_type text default null,
  p_entity_id   uuid default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_user  uuid := current_app_user_id();
  v_owner uuid := current_owner_id();
  v_id    uuid;
begin
  if v_user is null or v_owner is null then
    raise exception 'Utilisateur non relié à un compte NKAMA';
  end if;

  insert into reminders (owner_id, app_user_id, alert_key, entity_type, entity_id, titre, detail, remind_at)
  values (v_owner, v_user, p_alert_key, p_entity_type, p_entity_id, p_titre, p_detail, p_remind_at)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function create_alert_reminder(text, timestamptz, text, text, text, uuid) to authenticated;

-- ============================================================
-- Fin migration 0009.
-- ============================================================
