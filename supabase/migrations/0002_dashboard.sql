-- ============================================================
-- NKAMA — Migration 0002 : Dashboard entièrement calculé en base
-- ============================================================
-- Tout le tableau de bord est dérivé de vues SQL agrégées, exposées en un
-- seul appel via la fonction RPC get_dashboard() (1 round-trip, mise en
-- cache côté client). Idempotent : peut être ré-exécuté sans risque.
--
-- À exécuter après schema.sql. (Déjà inclus dans schema.sql pour un déploiement
-- neuf — ce fichier sert aux bases existantes.)
-- ============================================================

-- ------------------------------------------------------------
-- A. SEUILS CONFIGURABLES PAR PROPRIÉTAIRE
-- ------------------------------------------------------------
create table if not exists owner_settings (
  owner_id uuid primary key references owners(id) on delete cascade,
  seuil_depense_montant int not null default 150000, -- alerte si dépense > montant (FCFA)
  seuil_depense_pct     int not null default 150,     -- alerte si dépense > % de la moyenne
  ticket_sla_jours      int not null default 7,        -- ticket non traité au-delà
  bail_echeance_jours   int not null default 60,       -- contrat « à échéance bientôt »
  depart_prevu_jours    int not null default 30,       -- départ locataire imminent
  vacance_jours         int not null default 30,       -- bien vacant « trop longtemps »
  retard_jours          int not null default 5         -- retard de paiement signalé après
);

alter table owner_settings enable row level security;
drop policy if exists p_owner_settings_all on owner_settings;
create policy p_owner_settings_all on owner_settings for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- Helpers de lecture de seuils (valeurs par défaut si pas de ligne)
create or replace function cfg_int(p_key text)
returns int language sql stable as $$
  select coalesce(
    case p_key
      when 'seuil_depense_montant' then (select seuil_depense_montant from owner_settings limit 1)
      when 'seuil_depense_pct'     then (select seuil_depense_pct     from owner_settings limit 1)
      when 'ticket_sla_jours'      then (select ticket_sla_jours      from owner_settings limit 1)
      when 'bail_echeance_jours'   then (select bail_echeance_jours   from owner_settings limit 1)
      when 'depart_prevu_jours'    then (select depart_prevu_jours    from owner_settings limit 1)
      when 'vacance_jours'         then (select vacance_jours         from owner_settings limit 1)
      when 'retard_jours'          then (select retard_jours          from owner_settings limit 1)
    end,
    case p_key
      when 'seuil_depense_montant' then 150000
      when 'seuil_depense_pct'     then 150
      when 'ticket_sla_jours'      then 7
      when 'bail_echeance_jours'   then 60
      when 'depart_prevu_jours'    then 30
      when 'vacance_jours'         then 30
      when 'retard_jours'          then 5
    end
  );
$$;

-- ------------------------------------------------------------
-- B. INDEX D'OPTIMISATION
-- ------------------------------------------------------------
create index if not exists idx_payments_mois        on payments(mois);
create index if not exists idx_payments_statut       on payments(statut);
create index if not exists idx_expenses_statut       on expenses(statut);
create index if not exists idx_expenses_created       on expenses(created_at);
create index if not exists idx_tickets_created        on maintenance_tickets(created_at);
create index if not exists idx_tickets_contractor2    on maintenance_tickets(contractor_id);
create index if not exists idx_contracts_actif        on contracts(actif);
create index if not exists idx_contracts_datefin      on contracts(date_fin);

-- ------------------------------------------------------------
-- C. VUES — PARC IMMOBILIER
-- ------------------------------------------------------------
create or replace view v_parc_summary
with (security_invoker = on) as
select
  count(*)                                              as total,
  count(*) filter (where statut = 'occupé')            as occupes,
  count(*) filter (where statut = 'vacant')            as vacants,
  case when count(*) > 0
       then round(count(*) filter (where statut = 'occupé')::numeric / count(*) * 100)
       else 0 end                                       as taux_occupation
from properties_view;

-- ------------------------------------------------------------
-- D. VUES — LOCATAIRES
-- ------------------------------------------------------------
create or replace view v_locataires_summary
with (security_invoker = on) as
select
  (select count(*) from contracts where actif = true) as actifs,
  (select count(*) from contracts
     where actif = true and date_fin is not null
       and date_fin <= (now() + (cfg_int('depart_prevu_jours') || ' days')::interval)::date) as departs_prevus,
  (select count(*) from contracts
     where actif = true and date_fin is not null
       and date_fin <= (now() + (cfg_int('bail_echeance_jours') || ' days')::interval)::date) as echeances;

-- ------------------------------------------------------------
-- E. VUES — LOYERS (mois courant)
-- ------------------------------------------------------------
create or replace view v_loyers_mois
with (security_invoker = on) as
select
  coalesce(sum(p.montant), 0)                                          as attendu,
  coalesce(sum(p.montant) filter (where p.statut = 'paye'), 0)         as encaisse,
  coalesce(sum(p.montant) filter (where p.statut = 'en_retard'), 0)    as retard,
  count(*) filter (where p.statut = 'en_retard')                       as retard_count,
  case when coalesce(sum(p.montant), 0) > 0
       then round(coalesce(sum(p.montant) filter (where p.statut = 'paye'), 0)::numeric / sum(p.montant) * 100)
       else 0 end                                                      as taux_recouvrement
from payments p
where p.mois = date_trunc('month', now())::date;

create or replace view v_retards_par_locataire
with (security_invoker = on) as
select
  t.id as tenant_id, t.nom, pr.nom as bien,
  sum(pay.montant)::int as montant,
  count(*)::int         as mois_retard
from payments pay
join contracts c  on c.id = pay.contract_id
join tenants  t   on t.id = c.tenant_id
join properties pr on pr.id = c.property_id
where pay.statut = 'en_retard'
group by t.id, t.nom, pr.nom
order by sum(pay.montant) desc;

-- ------------------------------------------------------------
-- F. VUES — FINANCES
-- ------------------------------------------------------------
create or replace view v_depenses_mois
with (security_invoker = on) as
select
  coalesce(sum(montant) filter (where statut = 'validee'), 0)      as total_validee,
  coalesce(sum(montant) filter (where statut = 'en_attente'), 0)   as total_en_attente
from expenses
where date_trunc('month', created_at) = date_trunc('month', now());

create or replace view v_depenses_categorie_mois
with (security_invoker = on) as
select categorie, sum(montant)::int as montant
from expenses
where statut = 'validee'
  and date_trunc('month', created_at) = date_trunc('month', now())
group by categorie
order by sum(montant) desc;

create or replace view v_rentabilite_bien
with (security_invoker = on) as
select
  p.id, p.nom, p.quartier,
  pp.encaisse_12m::int as encaisse12m,
  pp.depenses_12m::int as depenses12m,
  case when pp.encaisse_12m > 0
       then round((pp.encaisse_12m - pp.depenses_12m)::numeric / pp.encaisse_12m * 100)
       else 0 end as net
from properties p
join property_profitability pp on pp.property_id = p.id
order by net desc;

create or replace view v_rentabilite_globale
with (security_invoker = on) as
select
  coalesce(sum(encaisse_12m), 0)::int as encaisse12m,
  coalesce(sum(depenses_12m), 0)::int as depenses12m,
  case when coalesce(sum(encaisse_12m), 0) > 0
       then round((sum(encaisse_12m) - sum(depenses_12m))::numeric / sum(encaisse_12m) * 100)
       else 0 end as net
from property_profitability;

-- Cash-flow mensuel (6 derniers mois) : attendu / encaissé / dépenses / net
create or replace view v_cashflow_mensuel
with (security_invoker = on) as
with months as (
  select (date_trunc('month', now()) - (g || ' months')::interval)::date as mois
  from generate_series(0, 5) g
)
select
  m.mois,
  to_char(m.mois, 'TMMon') as mois_label,
  coalesce((select sum(pay.montant) from payments pay where date_trunc('month', pay.mois) = m.mois), 0)::int as attendu,
  coalesce((select sum(pay.montant) from payments pay where pay.statut = 'paye' and date_trunc('month', pay.mois) = m.mois), 0)::int as encaisse,
  coalesce((select sum(e.montant) from expenses e where e.statut = 'validee' and date_trunc('month', e.created_at) = m.mois), 0)::int as depenses,
  (coalesce((select sum(pay.montant) from payments pay where pay.statut = 'paye' and date_trunc('month', pay.mois) = m.mois), 0)
   - coalesce((select sum(e.montant) from expenses e where e.statut = 'validee' and date_trunc('month', e.created_at) = m.mois), 0))::int as cashflow
from months m;

-- ------------------------------------------------------------
-- G. VUES — MAINTENANCE
-- ------------------------------------------------------------
create or replace view v_maintenance_summary
with (security_invoker = on) as
select
  count(*) filter (where statut <> 'cloture')                                          as ouverts,
  count(*) filter (where statut <> 'cloture'
                   and created_at < now() - (cfg_int('ticket_sla_jours') || ' days')::interval) as en_retard,
  count(*) filter (where statut = 'cloture')                                            as clotures,
  coalesce(round(avg(extract(epoch from (date_cloture - created_at)) / 86400)
           filter (where statut = 'cloture' and date_cloture is not null)), 0)::int     as temps_moyen_jours,
  coalesce(sum(montant_facture), 0)::int                                                as cout_total
from maintenance_tickets;

-- ------------------------------------------------------------
-- H. VUES — PRESTATAIRES
-- ------------------------------------------------------------
create or replace view v_prestataires_top
with (security_invoker = on) as
select
  ct.id, ct.nom,
  count(mt.id)::int as interventions,
  poc.note_moyenne  as note
from contractors ct
left join maintenance_tickets mt on mt.contractor_id = ct.id
left join property_owner_contractors poc on poc.contractor_id = ct.id and poc.owner_id = current_owner_id()
group by ct.id, ct.nom, poc.note_moyenne
order by count(mt.id) desc, ct.nom;

create or replace view v_prestataires_summary
with (security_invoker = on) as
select
  (select count(*) from contractors)                                  as total,
  coalesce((select sum(interventions) from v_prestataires_top), 0)::int as interventions,
  coalesce(round(avg(note_moyenne)::numeric, 1), 0)                   as score_moyen
from property_owner_contractors
where owner_id = current_owner_id();

-- ------------------------------------------------------------
-- I. VUES — CONTRÔLE
-- ------------------------------------------------------------
create or replace view v_controle_summary
with (security_invoker = on) as
select
  (select count(*) from expenses where statut = 'en_attente')                              as depenses_a_valider,
  (select count(*) from expenses where statut = 'en_attente' and justificatif_doc_id is null) as depenses_sans_justificatif,
  (select count(*) from maintenance_tickets where statut = 'validation')                   as factures_en_attente,
  (select count(*) from payments where statut = 'en_retard')                               as paiements_en_retard;

-- ------------------------------------------------------------
-- J. VUE — ALERTES (remontées automatiques)
-- ------------------------------------------------------------
create or replace view v_alertes
with (security_invoker = on) as
-- Loyer en retard (agrégé par locataire / contrat : 1 alerte, tous les mois cumulés)
select
  'loyer_retard'::text as type, 'haute'::text as gravite,
  'Loyer en retard' as titre,
  t.nom || ' — ' || pr.nom || ' (' || count(*) || ' mois, '
    || to_char(sum(pay.montant), 'FM999G999') || ' FCFA)' as detail,
  'contract'::text as entity_type, c.id as entity_id
from payments pay
join contracts c on c.id = pay.contract_id
join tenants  t  on t.id = c.tenant_id
join properties pr on pr.id = c.property_id
where pay.statut = 'en_retard'
group by c.id, t.nom, pr.nom

union all
-- Contrat bientôt expiré
select
  'contrat_echeance', 'moyenne',
  'Contrat bientôt expiré',
  t.nom || ' — ' || pr.nom || ' (fin le ' || to_char(c.date_fin, 'DD/MM/YYYY') || ')',
  'contract', c.id
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
  'property', pr.id
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
  'maintenance_ticket', mt.id
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
  'expense', e.id
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
  'expense', e.id
from expenses e
left join properties pr on pr.id = e.property_id
where e.montant > cfg_int('seuil_depense_montant');

-- ------------------------------------------------------------
-- K. RPC AGRÉGÉE — un seul appel pour tout le tableau de bord
-- ------------------------------------------------------------
create or replace function get_dashboard()
returns jsonb
language plpgsql
stable
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'parc',               (select to_jsonb(x) from v_parc_summary x),
    'locataires',         (select to_jsonb(x) from v_locataires_summary x),
    'loyers',             (select to_jsonb(x) from v_loyers_mois x),
    'retards',            coalesce((select jsonb_agg(to_jsonb(x)) from v_retards_par_locataire x), '[]'::jsonb),
    'depenses_mois',      (select to_jsonb(x) from v_depenses_mois x),
    'depenses_categorie', coalesce((select jsonb_agg(to_jsonb(x)) from v_depenses_categorie_mois x), '[]'::jsonb),
    'rentabilite_bien',   coalesce((select jsonb_agg(to_jsonb(x)) from v_rentabilite_bien x), '[]'::jsonb),
    'rentabilite_globale',(select to_jsonb(x) from v_rentabilite_globale x),
    'cashflow',           coalesce((select jsonb_agg(to_jsonb(x) order by x.mois) from v_cashflow_mensuel x), '[]'::jsonb),
    'maintenance',        (select to_jsonb(x) from v_maintenance_summary x),
    'prestataires',       (select to_jsonb(x) from v_prestataires_summary x),
    'prestataires_top',   coalesce((select jsonb_agg(to_jsonb(x)) from (select * from v_prestataires_top limit 5) x), '[]'::jsonb),
    'controle',           (select to_jsonb(x) from v_controle_summary x),
    'alertes',            coalesce((select jsonb_agg(to_jsonb(x)) from v_alertes x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

grant execute on function get_dashboard() to authenticated;

-- ============================================================
-- Fin migration 0002.
-- ============================================================
