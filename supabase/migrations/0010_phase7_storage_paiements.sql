-- ============================================================
-- NKAMA — Migration 0010 : Phase 7
--   1. Supabase Storage : buckets + policies (photos avant/après,
--      factures de tickets, photos de profil) ;
--   2. RPC `attach_ticket_proof` / `ticket_proof_path` : upload réel
--      des preuves (remplace les preuves simulées) ;
--   3. Paiements enrichis : mode de paiement, paiement partiel
--      (montant_paye), note, RPC `record_rent_payment` ;
--   4. Vues mises à jour : l'encaissé tient compte des paiements
--      partiels ; les retards affichent le reste dû.
-- Idempotent. À exécuter après 0009. (Aussi intégré à schema.sql.)
-- ============================================================

-- ------------------------------------------------------------
-- A. PAYMENTS — colonnes phase 7
-- ------------------------------------------------------------
alter table payments add column if not exists montant_paye int not null default 0;
alter table payments add column if not exists mode_paiement text;
alter table payments add column if not exists note text;
alter table payments add column if not exists enregistre_par uuid references app_users(id) on delete set null;

do $$ begin
  alter table payments add constraint chk_payments_mode
    check (mode_paiement is null
           or mode_paiement in ('especes','mobile_money','virement','cheque','autre'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table payments add constraint chk_payments_montant_paye
    check (montant_paye >= 0 and montant_paye <= montant);
exception when duplicate_object then null; end $$;

-- Reprise des données existantes : un mois « payé » l'est intégralement.
update payments set montant_paye = montant where statut = 'paye' and montant_paye = 0;

-- ------------------------------------------------------------
-- B. RPC record_rent_payment — enregistrement d'un loyer
--    (total ou partiel), owner/admin uniquement.
-- ------------------------------------------------------------
create or replace function record_rent_payment(
  p_contract_id uuid,
  p_mois        date,
  p_montant     int,
  p_mode        text default 'especes',
  p_date        date default current_date,
  p_note        text default null
) returns payments
language plpgsql security definer
as $$
declare
  v_contract contracts%rowtype;
  v_row      payments%rowtype;
  v_mois     date := date_trunc('month', p_mois)::date;
begin
  if not is_active_user() or not is_owner_or_admin() then
    raise exception 'Accès refusé';
  end if;
  if p_montant is null or p_montant <= 0 then
    raise exception 'Montant invalide';
  end if;
  if p_mode is not null
     and p_mode not in ('especes','mobile_money','virement','cheque','autre') then
    raise exception 'Mode de paiement inconnu : %', p_mode;
  end if;

  select c.* into v_contract
  from contracts c
  join properties p on p.id = c.property_id
  where c.id = p_contract_id and p.owner_id = current_owner_id();
  if not found then
    raise exception 'Contrat introuvable';
  end if;

  select * into v_row from payments
  where contract_id = p_contract_id and mois = v_mois
  for update;
  if not found then
    insert into payments (contract_id, mois, montant, statut)
    values (p_contract_id, v_mois, v_contract.loyer_mensuel, 'attendu')
    returning * into v_row;
  end if;

  if v_row.statut = 'paye' then
    raise exception 'Ce mois est déjà intégralement réglé';
  end if;
  if v_row.montant_paye + p_montant > v_row.montant then
    raise exception 'Le paiement dépasse le reste dû (% FCFA)',
      v_row.montant - v_row.montant_paye;
  end if;

  update payments set
    montant_paye   = montant_paye + p_montant,
    mode_paiement  = coalesce(p_mode, mode_paiement),
    note           = case when p_note is null or p_note = '' then note
                          else coalesce(note || E'\n', '') || p_note end,
    date_paiement  = coalesce(p_date, current_date),
    statut         = case when montant_paye + p_montant >= montant
                          then 'paye'::payment_statut else statut end,
    enregistre_par = current_app_user_id()
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function record_rent_payment(uuid, date, int, text, date, text) from public, anon;
grant execute on function record_rent_payment(uuid, date, int, text, date, text) to authenticated;

-- ------------------------------------------------------------
-- C. STORAGE — buckets + policies
--    · nkama-docs (privé)     : chemins <owner_id>/…  (preuves tickets)
--    · nkama-avatars (public) : chemins <auth_uid>/…  (photos de profil)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('nkama-docs', 'nkama-docs', false),
       ('nkama-avatars', 'nkama-avatars', true)
on conflict (id) do nothing;

-- Documents privés : lecture/ajout pour tout utilisateur actif du compte,
-- suppression réservée owner/admin. Le 1er dossier du chemin = owner_id.
drop policy if exists p_storage_docs_select on storage.objects;
create policy p_storage_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'nkama-docs'
         and is_active_user()
         and (storage.foldername(name))[1] = current_owner_id()::text);

drop policy if exists p_storage_docs_insert on storage.objects;
create policy p_storage_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'nkama-docs'
              and is_active_user()
              and (storage.foldername(name))[1] = current_owner_id()::text);

drop policy if exists p_storage_docs_delete on storage.objects;
create policy p_storage_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'nkama-docs'
         and is_active_user() and is_owner_or_admin()
         and (storage.foldername(name))[1] = current_owner_id()::text);

-- Avatars publics : lecture libre, écriture dans son propre dossier.
drop policy if exists p_storage_avatars_select on storage.objects;
create policy p_storage_avatars_select on storage.objects for select
  using (bucket_id = 'nkama-avatars');

drop policy if exists p_storage_avatars_insert on storage.objects;
create policy p_storage_avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'nkama-avatars'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists p_storage_avatars_update on storage.objects;
create policy p_storage_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'nkama-avatars'
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'nkama-avatars'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists p_storage_avatars_delete on storage.objects;
create policy p_storage_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'nkama-avatars'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- D. RPC attach_ticket_proof — enregistre le document uploadé
--    et le lie au ticket (photo_avant / photo_apres / facture).
-- ------------------------------------------------------------
create or replace function attach_ticket_proof(
  p_ticket_id uuid,
  p_kind      text,
  p_nom       text,
  p_path      text,
  p_type      text   default null,
  p_taille    bigint default null,
  p_montant   int    default null
) returns uuid
language plpgsql security definer
as $$
declare
  v_ticket maintenance_tickets%rowtype;
  v_doc_id uuid;
begin
  if not is_active_user() then
    raise exception 'Accès refusé';
  end if;
  if p_kind not in ('photo_avant','photo_apres','facture') then
    raise exception 'Type de preuve inconnu : %', p_kind;
  end if;

  select * into v_ticket from maintenance_tickets
  where id = p_ticket_id and can_see_property(property_id);
  if not found then
    raise exception 'Ticket introuvable';
  end if;

  insert into documents (owner_id, entity_type, entity_id, nom_fichier,
                         storage_path, type_fichier, taille_octets, uploaded_by)
  values (current_owner_id(), 'ticket', p_ticket_id, p_nom,
          p_path, p_type, p_taille, current_app_user_id())
  returning id into v_doc_id;

  if p_kind = 'photo_avant' then
    update maintenance_tickets set photo_avant_doc_id = v_doc_id where id = p_ticket_id;
  elsif p_kind = 'photo_apres' then
    update maintenance_tickets set photo_apres_doc_id = v_doc_id where id = p_ticket_id;
  else
    update maintenance_tickets
    set facture_doc_id = v_doc_id,
        montant_facture = coalesce(p_montant, montant_facture)
    where id = p_ticket_id;
  end if;

  return v_doc_id;
end;
$$;
revoke all on function attach_ticket_proof(uuid, text, text, text, text, bigint, int) from public, anon;
grant execute on function attach_ticket_proof(uuid, text, text, text, text, bigint, int) to authenticated;

-- Chemin storage d'une preuve (pour créer une URL signée côté client).
create or replace function ticket_proof_path(p_ticket_id uuid, p_kind text)
returns text
language sql stable security definer
as $$
  select d.storage_path
  from maintenance_tickets mt
  join documents d on d.id = case p_kind
                               when 'photo_avant' then mt.photo_avant_doc_id
                               when 'photo_apres' then mt.photo_apres_doc_id
                               when 'facture'     then mt.facture_doc_id
                             end
  where mt.id = p_ticket_id
    and is_active_user()
    and can_see_property(mt.property_id);
$$;
revoke all on function ticket_proof_path(uuid, text) from public, anon;
grant execute on function ticket_proof_path(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- E. VUES — l'encaissé tient compte des paiements partiels
--    (mêmes noms/types de colonnes : create or replace suffit).
-- ------------------------------------------------------------

-- Loyers du mois courant
create or replace view v_loyers_mois
with (security_invoker = on) as
select
  coalesce(sum(p.montant), 0)                                        as attendu,
  coalesce(sum(case when p.statut = 'paye' then p.montant
                    else p.montant_paye end), 0)                     as encaisse,
  coalesce(sum(p.montant - p.montant_paye)
             filter (where p.statut = 'en_retard'), 0)               as retard,
  count(*) filter (where p.statut = 'en_retard')                     as retard_count,
  case when coalesce(sum(p.montant), 0) > 0
       then round(coalesce(sum(case when p.statut = 'paye' then p.montant
                                    else p.montant_paye end), 0)::numeric
                  / sum(p.montant) * 100)
       else 0 end                                                    as taux_recouvrement
from payments p
where p.mois = date_trunc('month', now())::date;

-- Retards par locataire (reste dû)
create or replace view v_retards_par_locataire
with (security_invoker = on) as
select
  t.id as tenant_id, t.nom, pr.nom as bien,
  sum(pay.montant - pay.montant_paye)::int as montant,
  count(*)::int                            as mois_retard
from payments pay
join contracts c  on c.id = pay.contract_id
join tenants  t   on t.id = c.tenant_id
join properties pr on pr.id = c.property_id
where pay.statut = 'en_retard'
group by t.id, t.nom, pr.nom
order by sum(pay.montant - pay.montant_paye) desc;

-- Cash-flow mensuel (6 derniers mois)
create or replace view v_cashflow_mensuel
with (security_invoker = on) as
with months as (
  select (date_trunc('month', now()) - (g || ' months')::interval)::date as mois
  from generate_series(0, 5) g
)
select
  m.mois,
  to_char(m.mois, 'TMMon') as mois_label,
  coalesce((select sum(pay.montant) from payments pay
            where date_trunc('month', pay.mois) = m.mois), 0)::int as attendu,
  coalesce((select sum(case when pay.statut = 'paye' then pay.montant
                            else pay.montant_paye end) from payments pay
            where date_trunc('month', pay.mois) = m.mois), 0)::int as encaisse,
  coalesce((select sum(e.montant) from expenses e
            where e.statut = 'validee'
              and date_trunc('month', e.created_at) = m.mois), 0)::int as depenses,
  (coalesce((select sum(case when pay.statut = 'paye' then pay.montant
                             else pay.montant_paye end) from payments pay
             where date_trunc('month', pay.mois) = m.mois), 0)
   - coalesce((select sum(e.montant) from expenses e
               where e.statut = 'validee'
                 and date_trunc('month', e.created_at) = m.mois), 0))::int as cashflow
from months m;

-- Rentabilité par bien (encaissé 12 mois avec partiels)
create or replace view property_profitability
with (security_invoker = on) as
select
  p.id as property_id,
  coalesce(sum(case when pay.statut = 'paye' then pay.montant
                    else pay.montant_paye end)
             filter (where pay.mois >= now() - interval '12 months'), 0) as encaisse_12m,
  coalesce(sum(e.montant)
             filter (where e.statut = 'validee'
                     and e.created_at >= now() - interval '12 months'), 0) as depenses_12m
from properties p
left join contracts c on c.property_id = p.id
left join payments  pay on pay.contract_id = c.id
left join expenses  e on e.property_id = p.id
group by p.id;

-- ------------------------------------------------------------
-- F. ALERTES — le détail « loyer en retard » affiche le reste dû
--    (v_alertes_brutes/v_alertes de la phase 6, seule la branche
--    loyer_retard change : montant → reste dû).
-- ------------------------------------------------------------
drop view if exists v_alertes, v_alertes_brutes cascade;

create view v_alertes_brutes
with (security_invoker = on) as
-- Loyer en retard (agrégé par contrat : 1 alerte, tous les mois cumulés)
select
  'loyer_retard'::text as type, 'haute'::text as gravite,
  'Loyer en retard' as titre,
  t.nom || ' — ' || pr.nom || ' (' || count(*) || ' mois, '
    || to_char(sum(pay.montant - pay.montant_paye), 'FM999G999') || ' FCFA)' as detail,
  'contract'::text as entity_type, c.id as entity_id,
  'loyer_retard:' || c.id as alert_key,
  jsonb_build_object(
    'locataire', t.nom,
    'telephone', coalesce(t.whatsapp, t.telephone),
    'montant',   sum(pay.montant - pay.montant_paye),
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

-- ============================================================
-- Fin migration 0010
-- ============================================================
