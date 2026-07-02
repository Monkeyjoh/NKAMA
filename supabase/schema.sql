-- ============================================================
-- NKAMA — Schéma de base de données (Supabase / Postgres 15+)
-- ============================================================
-- Conventions :
--   - id UUID (gen_random_uuid())
--   - montants en FCFA, stockés en INTEGER (pas de centimes)
--   - created_at / updated_at sur les tables métier
--   - RLS activé ; les vues UI utilisent security_invoker (la RLS des
--     tables de base s'applique donc à travers les vues).
--
-- Ordre d'exécution :
--   1) schema.sql   (ce fichier)
--   2) seed.sql     (données de démonstration)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. OWNERS
-- ------------------------------------------------------------
create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. APP_USERS
-- ------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'owner', 'agent');
exception when duplicate_object then null; end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  nom text not null,
  telephone text,
  role user_role not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_users_owner on app_users(owner_id);
create index if not exists idx_app_users_auth on app_users(auth_user_id);

-- ------------------------------------------------------------
-- 3. PROPERTIES
-- ------------------------------------------------------------
do $$ begin
  create type property_type as enum ('studio', 'appartement', 'villa', 'local_commercial');
exception when duplicate_object then null; end $$;

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  nom text not null,
  adresse text not null,
  quartier text not null,
  type property_type not null,
  chambres int,
  surface_m2 numeric,
  loyer_mensuel int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_properties_owner on properties(owner_id);

-- ------------------------------------------------------------
-- 4. LEADS
-- ------------------------------------------------------------
do $$ begin
  create type lead_statut as enum ('nouveau', 'visite_prevue', 'dossier_recu', 'refuse', 'signe');
exception when duplicate_object then null; end $$;
do $$ begin
  create type lead_source as enum ('recommandation', 'annonce', 'agent', 'autre');
exception when duplicate_object then null; end $$;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  nom text not null,
  telephone text not null,
  whatsapp text,
  email text,
  budget_max int,
  type_recherche property_type,
  zone_recherchee text,
  statut lead_statut not null default 'nouveau',
  source lead_source not null default 'autre',
  prochaine_action text,
  prochaine_action_date date,
  dossier_complet boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leads_owner on leads(owner_id);
create index if not exists idx_leads_statut on leads(statut);

-- ------------------------------------------------------------
-- 5. TENANTS
-- ------------------------------------------------------------
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  lead_origin_id uuid references leads(id),
  nom text not null,
  telephone text not null,
  whatsapp text,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists idx_tenants_owner on tenants(owner_id);

-- ------------------------------------------------------------
-- 6. CONTRACTORS (annuaire partagé)
-- ------------------------------------------------------------
do $$ begin
  create type contractor_categorie as enum ('electricien', 'plombier', 'macon', 'agent_immobilier', 'gardien', 'autre');
exception when duplicate_object then null; end $$;

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text not null,
  whatsapp text,
  zone_intervention text,
  categories contractor_categorie[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists property_owner_contractors (
  owner_id uuid not null references owners(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  note_moyenne numeric,
  primary key (owner_id, contractor_id)
);

-- ------------------------------------------------------------
-- 7. CONTRACTS
-- ------------------------------------------------------------
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  date_debut date not null,
  date_fin date,
  loyer_mensuel int not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_contracts_property on contracts(property_id);
create index if not exists idx_contracts_tenant on contracts(tenant_id);
create unique index if not exists uq_one_active_contract_per_property
  on contracts(property_id) where (actif = true);

-- ------------------------------------------------------------
-- 8. PAYMENTS
-- ------------------------------------------------------------
do $$ begin
  create type payment_statut as enum ('paye', 'en_retard', 'attendu');
exception when duplicate_object then null; end $$;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  mois date not null,
  montant int not null,
  statut payment_statut not null default 'attendu',
  date_paiement date,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_contract on payments(contract_id);
create unique index if not exists uq_payment_per_contract_month on payments(contract_id, mois);

-- ------------------------------------------------------------
-- 9. DOCUMENTS
-- ------------------------------------------------------------
do $$ begin
  create type document_entity_type as enum ('tenant', 'property', 'contract', 'ticket');
exception when duplicate_object then null; end $$;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  entity_type document_entity_type not null,
  entity_id uuid not null,
  nom_fichier text not null,
  storage_path text not null,
  type_fichier text,
  taille_octets bigint,
  uploaded_by uuid references app_users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_documents_entity on documents(entity_type, entity_id);

-- ------------------------------------------------------------
-- 10. MAINTENANCE_TICKETS
-- ------------------------------------------------------------
do $$ begin
  create type ticket_statut as enum ('signale', 'affecte', 'en_cours', 'validation', 'cloture', 'litige');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ticket_categorie as enum ('electricite', 'plomberie', 'maconnerie', 'autre');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ticket_priorite as enum ('urgent', 'normal', 'preventif');
exception when duplicate_object then null; end $$;

create table if not exists maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid references tenants(id),
  contractor_id uuid references contractors(id),
  titre text not null,
  description text,
  categorie ticket_categorie not null,
  priorite ticket_priorite not null default 'normal',
  statut ticket_statut not null default 'signale',
  photo_avant_doc_id uuid references documents(id),
  photo_apres_doc_id uuid references documents(id),
  facture_doc_id uuid references documents(id),
  montant_facture int,
  imputable_locataire boolean,
  created_by uuid references app_users(id),
  validated_by uuid references app_users(id),
  date_affectation timestamptz,
  date_cloture timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tickets_property on maintenance_tickets(property_id);
create index if not exists idx_tickets_statut on maintenance_tickets(statut);
create index if not exists idx_tickets_contractor on maintenance_tickets(contractor_id);

-- Blocages par preuves (renforcés aussi côté application)
do $$ begin
  alter table maintenance_tickets add constraint chk_affecte_requires_photo_avant
    check (statut not in ('affecte','en_cours','validation','cloture','litige') or photo_avant_doc_id is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table maintenance_tickets add constraint chk_validation_requires_proofs
    check (statut not in ('validation','cloture','litige')
           or (photo_apres_doc_id is not null and facture_doc_id is not null));
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 11. EXPENSES
-- ------------------------------------------------------------
do $$ begin
  create type expense_categorie as enum ('maintenance', 'taxes', 'assurance', 'gestion', 'autre');
exception when duplicate_object then null; end $$;
do $$ begin
  create type expense_statut as enum ('en_attente', 'validee', 'rejetee');
exception when duplicate_object then null; end $$;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  property_id uuid references properties(id),
  ticket_id uuid references maintenance_tickets(id),
  categorie expense_categorie not null,
  montant int not null,
  justificatif_doc_id uuid references documents(id),
  statut expense_statut not null default 'en_attente',
  motif_rejet text,
  created_by uuid references app_users(id),
  validated_by uuid references app_users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_expenses_owner on expenses(owner_id);
create index if not exists idx_expenses_property on expenses(property_id);
do $$ begin
  alter table expenses add constraint chk_maintenance_requires_justificatif
    check (categorie != 'maintenance' or justificatif_doc_id is not null);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 12. ACTIVITY_LOGS (append-only)
-- ------------------------------------------------------------
do $$ begin
  create type log_action_type as enum ('creation','modification','suppression_logique','validation','rejet','changement_statut','connexion','recalcul_score');
exception when duplicate_object then null; end $$;
do $$ begin
  create type log_entity_type as enum ('property','tenant','lead','contractor','contract','payment','expense','maintenance_ticket','document','app_user');
exception when duplicate_object then null; end $$;

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  auteur_id uuid references app_users(id),
  action_type log_action_type not null,
  entity_type log_entity_type not null,
  entity_id uuid not null,
  valeur_avant jsonb,
  valeur_apres jsonb,
  motif text,
  horodatage timestamptz not null default now()
);
create index if not exists idx_logs_owner on activity_logs(owner_id);
create index if not exists idx_logs_entity on activity_logs(entity_type, entity_id);
revoke update, delete on activity_logs from authenticated;

-- ============================================================
-- FONCTIONS
-- ============================================================

-- Renvoie l'owner_id de l'utilisateur connecté (utilisé par la RLS)
create or replace function current_owner_id()
returns uuid
language sql stable security definer
as $$
  select owner_id from app_users where auth_user_id = auth.uid() limit 1;
$$;

-- Score de fiabilité SANS journalisation (utilisable dans les vues)
create or replace function tenant_score_value(p_tenant_id uuid)
returns int
language plpgsql stable
as $$
declare
  v_score int := 100;
  v_total int;
  v_retard int;
  v_incidents int;
begin
  select count(*) into v_total
  from payments pay join contracts c on c.id = pay.contract_id
  where c.tenant_id = p_tenant_id;

  select count(*) into v_retard
  from payments pay join contracts c on c.id = pay.contract_id
  where c.tenant_id = p_tenant_id and pay.statut = 'en_retard';

  select count(*) into v_incidents
  from maintenance_tickets
  where tenant_id = p_tenant_id and imputable_locataire = true;

  if v_total > 0 then
    v_score := v_score - round((v_retard::numeric / v_total) * 50);
  end if;
  v_score := v_score - least(v_incidents * 5, 20);
  return greatest(v_score, 0);
end;
$$;

-- Score de fiabilité AVEC journalisation (appel explicite via RPC)
create or replace function calculate_tenant_score(p_tenant_id uuid)
returns int
language plpgsql
as $$
declare
  v_score int;
begin
  v_score := tenant_score_value(p_tenant_id);
  insert into activity_logs (owner_id, action_type, entity_type, entity_id, valeur_apres, horodatage)
  select t.owner_id, 'recalcul_score', 'tenant', p_tenant_id, jsonb_build_object('score', v_score), now()
  from tenants t where t.id = p_tenant_id;
  return v_score;
end;
$$;

-- ============================================================
-- VUES UI (security_invoker → la RLS des tables de base s'applique)
-- ============================================================

-- Réexécution sur une base existante : `create or replace view` refuse de
-- changer le type ou le nombre des colonnes (erreur 42P16, ex. « cannot
-- change data type of view column "total" from bigint to integer »). On
-- supprime donc toutes les vues d'abord ; elles sont TOUTES recréées dans
-- ce fichier. `cascade` gère l'ordre des dépendances ; les fonctions
-- (get_dashboard…) ne sont pas affectées et utiliseront les nouvelles
-- définitions.
drop view if exists
  v_alertes, v_alertes_brutes, v_controle_summary, v_prestataires_summary,
  v_prestataires_top, v_maintenance_summary, v_cashflow_mensuel,
  v_rentabilite_globale, v_rentabilite_bien, v_depenses_categorie_mois,
  v_depenses_mois, v_retards_par_locataire, v_loyers_mois,
  v_locataires_summary, v_parc_summary, activity_logs_view,
  contractors_view, contracts_view, expenses_view, tickets_view,
  tenants_view, properties_view, property_profitability
cascade;

-- Rentabilité 12 mois par bien (dépenses validées uniquement)
create or replace view property_profitability
with (security_invoker = on) as
select
  p.id as property_id,
  coalesce(sum(pay.montant) filter (where pay.statut = 'paye' and pay.mois >= now() - interval '12 months'), 0) as encaisse_12m,
  coalesce(sum(e.montant)   filter (where e.statut = 'validee' and e.created_at >= now() - interval '12 months'), 0) as depenses_12m
from properties p
left join contracts c on c.property_id = p.id
left join payments  pay on pay.contract_id = c.id
left join expenses  e on e.property_id = p.id
group by p.id;

-- Vue principale des biens (tout ce dont l'UI a besoin)
create or replace view properties_view
with (security_invoker = on) as
select
  p.id, p.owner_id, p.nom, p.quartier, p.adresse, p.type, p.chambres,
  p.surface_m2, p.loyer_mensuel,
  case when ac.id is not null then 'occupé' else 'vacant' end as statut,
  (select count(*) from documents d where d.entity_type = 'property' and d.entity_id = p.id) as photos,
  pp.encaisse_12m as "encaisse12m",
  pp.depenses_12m as "depenses12m",
  case when pp.encaisse_12m > 0
       then round(((pp.encaisse_12m - pp.depenses_12m)::numeric / pp.encaisse_12m) * 100)
       else 0 end as net,
  t.id   as tenant_id,
  t.nom  as tenant_nom,
  t.telephone as tenant_tel,
  ac.date_debut::text as tenant_depuis,
  case when t.id is not null then tenant_score_value(t.id) else null end as tenant_score
from properties p
left join property_profitability pp on pp.property_id = p.id
left join contracts ac on ac.property_id = p.id and ac.actif = true
left join tenants t on t.id = ac.tenant_id;

-- Locataires + bien occupé + score
create or replace view tenants_view
with (security_invoker = on) as
select
  t.id, t.owner_id, t.nom, t.telephone,
  p.nom as bien,
  ac.date_debut::text as depuis,
  tenant_score_value(t.id) as score
from tenants t
left join contracts ac on ac.tenant_id = t.id and ac.actif = true
left join properties p on p.id = ac.property_id;

-- Tickets enrichis (noms + booléens de preuves)
create or replace view tickets_view
with (security_invoker = on) as
select
  mt.id, mt.property_id, mt.titre, mt.categorie, mt.priorite, mt.statut,
  mt.montant_facture, mt.imputable_locataire, mt.created_at,
  p.nom as bien,
  t.nom as locataire,
  ct.nom as prestataire,
  (mt.photo_avant_doc_id is not null) as photo_avant,
  (mt.photo_apres_doc_id is not null) as photo_apres,
  (mt.facture_doc_id is not null) as facture
from maintenance_tickets mt
join properties p on p.id = mt.property_id
left join tenants t on t.id = mt.tenant_id
left join contractors ct on ct.id = mt.contractor_id;

-- Dépenses enrichies (nom du bien + booléen justificatif)
create or replace view expenses_view
with (security_invoker = on) as
select
  e.id, e.owner_id, e.categorie, e.montant, e.statut, e.motif_rejet, e.created_at,
  p.nom as bien,
  (e.justificatif_doc_id is not null) as justificatif
from expenses e
left join properties p on p.id = e.property_id;

-- Contrats enrichis (noms + échéance proche < 60 jours)
create or replace view contracts_view
with (security_invoker = on) as
select
  c.id, c.date_debut, c.date_fin, c.loyer_mensuel, c.actif,
  p.nom as bien,
  t.nom as locataire,
  (c.date_fin is not null and c.date_fin <= (now() + interval '60 days')::date) as echeance
from contracts c
join properties p on p.id = c.property_id
join tenants t on t.id = c.tenant_id;

-- Prestataires + note de la relation propriétaire courant
create or replace view contractors_view
with (security_invoker = on) as
select
  ct.id, ct.nom, ct.telephone, ct.zone_intervention, ct.categories,
  (ct.categories)[1] as categorie,
  poc.note_moyenne
from contractors ct
left join property_owner_contractors poc
  on poc.contractor_id = ct.id and poc.owner_id = current_owner_id();

-- Journal d'audit + nom de l'auteur
create or replace view activity_logs_view
with (security_invoker = on) as
select
  l.id, l.owner_id, l.action_type, l.entity_type, l.entity_id, l.horodatage,
  au.nom as auteur_nom,
  null::text as entity_label
from activity_logs l
left join app_users au on au.id = l.auteur_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table properties           enable row level security;
alter table tenants              enable row level security;
alter table leads                enable row level security;
alter table contracts            enable row level security;
alter table payments             enable row level security;
alter table expenses             enable row level security;
alter table maintenance_tickets  enable row level security;
alter table documents            enable row level security;
alter table activity_logs        enable row level security;
alter table contractors          enable row level security;

-- Helper : la ligne appartient à l'owner de l'utilisateur courant
-- (les policies ci-dessous couvrent lecture + écriture pour owner/admin/agent).

-- PROPERTIES
drop policy if exists p_properties_all on properties;
create policy p_properties_all on properties for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- TENANTS
drop policy if exists p_tenants_all on tenants;
create policy p_tenants_all on tenants for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- LEADS
drop policy if exists p_leads_all on leads;
create policy p_leads_all on leads for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- CONTRACTS (via le bien)
drop policy if exists p_contracts_all on contracts;
create policy p_contracts_all on contracts for all
  using (property_id in (select id from properties where owner_id = current_owner_id()))
  with check (property_id in (select id from properties where owner_id = current_owner_id()));

-- PAYMENTS (via le contrat → bien)
drop policy if exists p_payments_all on payments;
create policy p_payments_all on payments for all
  using (contract_id in (
    select c.id from contracts c
    join properties p on p.id = c.property_id
    where p.owner_id = current_owner_id()))
  with check (contract_id in (
    select c.id from contracts c
    join properties p on p.id = c.property_id
    where p.owner_id = current_owner_id()));

-- EXPENSES
drop policy if exists p_expenses_all on expenses;
create policy p_expenses_all on expenses for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- MAINTENANCE_TICKETS (via le bien)
drop policy if exists p_tickets_select on maintenance_tickets;
create policy p_tickets_select on maintenance_tickets for select
  using (property_id in (select id from properties where owner_id = current_owner_id()));
drop policy if exists p_tickets_insert on maintenance_tickets;
create policy p_tickets_insert on maintenance_tickets for insert
  with check (property_id in (select id from properties where owner_id = current_owner_id()));
-- Mise à jour : agent peut faire avancer ; seul owner/admin peut clôturer/valider
drop policy if exists p_tickets_update on maintenance_tickets;
create policy p_tickets_update on maintenance_tickets for update
  using (property_id in (select id from properties where owner_id = current_owner_id()));

-- DOCUMENTS
drop policy if exists p_documents_all on documents;
create policy p_documents_all on documents for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- ACTIVITY_LOGS (lecture owner/admin ; insertion authentifiée)
drop policy if exists p_logs_select on activity_logs;
create policy p_logs_select on activity_logs for select
  using (owner_id in (
    select owner_id from app_users
    where auth_user_id = auth.uid() and role in ('owner','admin')));
drop policy if exists p_logs_insert on activity_logs;
create policy p_logs_insert on activity_logs for insert
  with check (owner_id = current_owner_id());

-- CONTRACTORS (annuaire partagé : lecture pour tout utilisateur authentifié)
drop policy if exists p_contractors_select on contractors;
create policy p_contractors_select on contractors for select
  using (auth.uid() is not null);
drop policy if exists p_contractors_write on contractors;
create policy p_contractors_write on contractors for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================
-- Fin du schéma. Exécuter ensuite seed.sql.
-- ============================================================


-- ====== (intégré depuis migrations/0002_dashboard.sql) ======
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


-- ====== (intégré depuis migrations/0003_hardening.sql) ======
-- A. RLS sur les tables qui en manquaient
-- ------------------------------------------------------------
-- current_owner_id() est SECURITY DEFINER : aucune récursion RLS possible
-- même quand une policy de app_users l'utilise.

-- OWNERS : un utilisateur ne voit que son owner
alter table owners enable row level security;
drop policy if exists p_owners_select on owners;
create policy p_owners_select on owners for select
  using (id = current_owner_id());

-- APP_USERS : un utilisateur ne voit que les comptes de son owner
alter table app_users enable row level security;
drop policy if exists p_app_users_select on app_users;
create policy p_app_users_select on app_users for select
  using (owner_id = current_owner_id());

-- PROPERTY_OWNER_CONTRACTORS : relation propre à l'owner
-- (indispensable : contractors_view joint cette table en security_invoker)
alter table property_owner_contractors enable row level security;
drop policy if exists p_poc_all on property_owner_contractors;
create policy p_poc_all on property_owner_contractors for all
  using (owner_id = current_owner_id())
  with check (owner_id = current_owner_id());

-- ------------------------------------------------------------
-- B. v_prestataires_summary : toujours renvoyer une ligne
-- ------------------------------------------------------------
-- L'ancienne version partait de property_owner_contractors : sans relation,
-- elle ne renvoyait aucune ligne → 'prestataires' = null côté dashboard.
drop view if exists v_prestataires_summary;
create view v_prestataires_summary
with (security_invoker = on) as
select
  (select count(*) from contractors)::int as total,
  coalesce((select sum(interventions) from v_prestataires_top), 0)::int as interventions,
  coalesce((select round(avg(note_moyenne)::numeric, 1)
            from property_owner_contractors
            where owner_id = current_owner_id()), 0) as score_moyen;

-- ============================================================
-- Fin migration 0003.
-- ============================================================


-- ====== (intégré depuis migrations/0005_rbac.sql) ======
-- A. ENRICHISSEMENT app_users
-- ------------------------------------------------------------
do $$ begin
  create type user_statut as enum ('actif', 'suspendu');
exception when duplicate_object then null; end $$;

alter table app_users add column if not exists statut user_statut not null default 'actif';
alter table app_users add column if not exists email text;
alter table app_users add column if not exists derniere_connexion timestamptz;
alter table app_users add column if not exists langue text not null default 'fr';
alter table app_users add column if not exists photo_url text;
alter table app_users add column if not exists notifications_actives boolean not null default true;

-- ------------------------------------------------------------
-- B. AFFECTATION DES AGENTS AUX BIENS
-- ------------------------------------------------------------
create table if not exists property_assignments (
  app_user_id uuid not null references app_users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  owner_id    uuid not null references owners(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (app_user_id, property_id)
);
create index if not exists idx_assign_user on property_assignments(app_user_id);
create index if not exists idx_assign_prop on property_assignments(property_id);

-- ------------------------------------------------------------
-- C. FONCTIONS D'IDENTITÉ / RÔLE  (SECURITY DEFINER)
-- ------------------------------------------------------------
create or replace function current_app_user_id()
returns uuid language sql stable security definer as $$
  select id from app_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function current_user_role()
returns user_role language sql stable security definer as $$
  select role from app_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_owner_or_admin()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select role in ('owner','admin') from app_users where auth_user_id = auth.uid() limit 1),
    false);
$$;

create or replace function is_active_user()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select statut = 'actif' from app_users where auth_user_id = auth.uid() limit 1),
    false);
$$;

-- Un agent ne « voit » qu'un bien qui lui est affecté ; owner/admin voient
-- tous les biens de leur propriétaire.
create or replace function can_see_property(p_property_id uuid)
returns boolean language sql stable security definer as $$
  select case
    when (select role from app_users where auth_user_id = auth.uid() limit 1) in ('owner','admin')
      then exists (select 1 from properties p where p.id = p_property_id and p.owner_id = current_owner_id())
    else exists (
      select 1 from property_assignments pa
      where pa.property_id = p_property_id and pa.app_user_id = current_app_user_id())
  end;
$$;

-- Met à jour la dernière connexion (appelée par l'app après login).
create or replace function touch_last_login()
returns void language sql security definer as $$
  update app_users set derniere_connexion = now() where auth_user_id = auth.uid();
$$;
grant execute on function touch_last_login() to authenticated;

-- ------------------------------------------------------------
-- D. RLS RÉÉCRITE — PÉRIMÈTRE PAR RÔLE
-- ------------------------------------------------------------

-- PROPERTIES ------------------------------------------------
drop policy if exists p_properties_all on properties;
drop policy if exists p_properties_select on properties;
drop policy if exists p_properties_write on properties;
create policy p_properties_select on properties for select
  using (is_active_user() and can_see_property(id));
create policy p_properties_write on properties for all
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id())
  with check (is_owner_or_admin() and owner_id = current_owner_id());

-- TENANTS ---------------------------------------------------
drop policy if exists p_tenants_all on tenants;
drop policy if exists p_tenants_select on tenants;
drop policy if exists p_tenants_write on tenants;
create policy p_tenants_select on tenants for select
  using (is_active_user() and (
    (is_owner_or_admin() and owner_id = current_owner_id())
    or exists (select 1 from contracts c where c.tenant_id = tenants.id and can_see_property(c.property_id))
  ));
create policy p_tenants_write on tenants for all
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id())
  with check (is_owner_or_admin() and owner_id = current_owner_id());

-- LEADS (CRM réservé owner/admin) ---------------------------
drop policy if exists p_leads_all on leads;
drop policy if exists p_leads_rw on leads;
create policy p_leads_rw on leads for all
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id())
  with check (is_owner_or_admin() and owner_id = current_owner_id());

-- CONTRACTS -------------------------------------------------
drop policy if exists p_contracts_all on contracts;
drop policy if exists p_contracts_select on contracts;
drop policy if exists p_contracts_write on contracts;
create policy p_contracts_select on contracts for select
  using (is_active_user() and can_see_property(property_id));
create policy p_contracts_write on contracts for all
  using (is_active_user() and is_owner_or_admin()
         and property_id in (select id from properties where owner_id = current_owner_id()))
  with check (is_owner_or_admin()
         and property_id in (select id from properties where owner_id = current_owner_id()));

-- PAYMENTS --------------------------------------------------
drop policy if exists p_payments_all on payments;
drop policy if exists p_payments_select on payments;
drop policy if exists p_payments_write on payments;
create policy p_payments_select on payments for select
  using (is_active_user() and exists (
    select 1 from contracts c where c.id = payments.contract_id and can_see_property(c.property_id)));
create policy p_payments_write on payments for all
  using (is_active_user() and is_owner_or_admin() and exists (
    select 1 from contracts c join properties p on p.id = c.property_id
    where c.id = payments.contract_id and p.owner_id = current_owner_id()))
  with check (is_owner_or_admin() and exists (
    select 1 from contracts c join properties p on p.id = c.property_id
    where c.id = payments.contract_id and p.owner_id = current_owner_id()));

-- EXPENSES (finances réservées owner/admin) -----------------
drop policy if exists p_expenses_all on expenses;
drop policy if exists p_expenses_rw on expenses;
create policy p_expenses_rw on expenses for all
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id())
  with check (is_owner_or_admin() and owner_id = current_owner_id());

-- MAINTENANCE_TICKETS ---------------------------------------
-- Agent : voit + crée + met à jour les tickets de ses biens affectés.
-- (La clôture reste réservée owner/admin via trigger ci-dessous.)
drop policy if exists p_tickets_select on maintenance_tickets;
drop policy if exists p_tickets_insert on maintenance_tickets;
drop policy if exists p_tickets_update on maintenance_tickets;
drop policy if exists p_tickets_delete on maintenance_tickets;
create policy p_tickets_select on maintenance_tickets for select
  using (is_active_user() and can_see_property(property_id));
create policy p_tickets_insert on maintenance_tickets for insert
  with check (is_active_user() and can_see_property(property_id));
create policy p_tickets_update on maintenance_tickets for update
  using (is_active_user() and can_see_property(property_id))
  with check (can_see_property(property_id));
create policy p_tickets_delete on maintenance_tickets for delete
  using (is_active_user() and is_owner_or_admin()
         and property_id in (select id from properties where owner_id = current_owner_id()));

-- DOCUMENTS -------------------------------------------------
-- Agent : voit/ajoute les documents liés à un ticket ou un bien qu'il voit.
drop policy if exists p_documents_all on documents;
drop policy if exists p_documents_select on documents;
drop policy if exists p_documents_insert on documents;
drop policy if exists p_documents_modify on documents;
create policy p_documents_select on documents for select
  using (is_active_user() and (
    (is_owner_or_admin() and owner_id = current_owner_id())
    or (entity_type = 'property' and can_see_property(entity_id))
    or (entity_type = 'ticket' and exists (
        select 1 from maintenance_tickets mt where mt.id = documents.entity_id and can_see_property(mt.property_id)))
  ));
create policy p_documents_insert on documents for insert
  with check (is_active_user() and owner_id = current_owner_id() and (
    is_owner_or_admin()
    or (entity_type = 'property' and can_see_property(entity_id))
    or (entity_type = 'ticket' and exists (
        select 1 from maintenance_tickets mt where mt.id = documents.entity_id and can_see_property(mt.property_id)))
  ));
create policy p_documents_modify on documents for delete
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id());

-- ACTIVITY_LOGS (append-only ; lecture owner/admin ; insert authentifié) ----
drop policy if exists p_logs_select on activity_logs;
drop policy if exists p_logs_insert on activity_logs;
create policy p_logs_select on activity_logs for select
  using (is_active_user() and is_owner_or_admin() and owner_id = current_owner_id());
create policy p_logs_insert on activity_logs for insert
  with check (is_active_user() and owner_id = current_owner_id());

-- CONTRACTORS (annuaire partagé ; écriture owner/admin) -----
drop policy if exists p_contractors_select on contractors;
drop policy if exists p_contractors_write on contractors;
create policy p_contractors_select on contractors for select
  using (auth.uid() is not null);
create policy p_contractors_write on contractors for all
  using (is_active_user() and is_owner_or_admin())
  with check (is_active_user() and is_owner_or_admin());

drop policy if exists p_poc_all on property_owner_contractors;
create policy p_poc_all on property_owner_contractors for all
  using (owner_id = current_owner_id() and is_owner_or_admin())
  with check (owner_id = current_owner_id() and is_owner_or_admin());

-- OWNER_SETTINGS (seuils : lecture owner/admin ; écriture OWNER seul) --------
drop policy if exists p_owner_settings_all on owner_settings;
drop policy if exists p_owner_settings_select on owner_settings;
drop policy if exists p_owner_settings_write on owner_settings;
create policy p_owner_settings_select on owner_settings for select
  using (owner_id = current_owner_id() and is_owner_or_admin());
create policy p_owner_settings_write on owner_settings for all
  using (owner_id = current_owner_id() and current_user_role() = 'owner')
  with check (owner_id = current_owner_id() and current_user_role() = 'owner');

-- OWNERS ----------------------------------------------------
drop policy if exists p_owners_select on owners;
create policy p_owners_select on owners for select
  using (id = current_owner_id());

-- APP_USERS -------------------------------------------------
drop policy if exists p_app_users_select on app_users;
drop policy if exists p_app_users_insert on app_users;
drop policy if exists p_app_users_update on app_users;
drop policy if exists p_app_users_delete on app_users;
-- Lecture : owner/admin voient tout leur propriétaire ; un agent se voit lui-même
create policy p_app_users_select on app_users for select
  using (owner_id = current_owner_id() and (is_owner_or_admin() or id = current_app_user_id()));
-- Création : owner → admin/agent ; admin → agent
create policy p_app_users_insert on app_users for insert
  with check (owner_id = current_owner_id() and (
    (current_user_role() = 'owner' and role in ('admin','agent'))
    or (current_user_role() = 'admin' and role = 'agent')
  ));
-- Mise à jour : owner (tout), admin (agents), ou soi-même (profil)
create policy p_app_users_update on app_users for update
  using (owner_id = current_owner_id() and (
    current_user_role() = 'owner'
    or (current_user_role() = 'admin' and role = 'agent')
    or id = current_app_user_id()
  ))
  with check (owner_id = current_owner_id());
-- Suppression : jamais le propriétaire ; owner → admin/agent ; admin → agent
create policy p_app_users_delete on app_users for delete
  using (owner_id = current_owner_id() and role <> 'owner' and (
    current_user_role() = 'owner'
    or (current_user_role() = 'admin' and role = 'agent')
  ));

-- PROPERTY_ASSIGNMENTS --------------------------------------
alter table property_assignments enable row level security;
drop policy if exists p_assign_select on property_assignments;
drop policy if exists p_assign_write on property_assignments;
create policy p_assign_select on property_assignments for select
  using (owner_id = current_owner_id() and (is_owner_or_admin() or app_user_id = current_app_user_id()));
create policy p_assign_write on property_assignments for all
  using (owner_id = current_owner_id() and is_owner_or_admin())
  with check (owner_id = current_owner_id() and is_owner_or_admin());

-- ------------------------------------------------------------
-- E. TRIGGERS DE GARDE
-- ------------------------------------------------------------
-- Protège les règles fines que la RLS seule n'exprime pas (niveau colonne).
create or replace function app_users_guard()
returns trigger language plpgsql security definer as $$
declare
  actor_role user_role := current_user_role();
  actor_id   uuid      := current_app_user_id();
begin
  -- Nul ne retire le rôle « owner » d'un propriétaire
  if OLD.role = 'owner' and NEW.role <> 'owner' then
    raise exception 'Le rôle propriétaire ne peut pas être modifié.';
  end if;
  -- On ne modifie pas son propre rôle ni son propre statut
  if NEW.id = actor_id and (NEW.role <> OLD.role or NEW.statut <> OLD.statut) then
    raise exception 'Vous ne pouvez pas modifier votre propre rôle ou statut.';
  end if;
  -- Un admin ne peut agir que sur des agents (hors son propre profil)
  if actor_role = 'admin' and NEW.id <> actor_id then
    if OLD.role <> 'agent' or NEW.role <> 'agent' then
      raise exception 'Un administrateur ne peut gérer que des agents.';
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_app_users_guard on app_users;
create trigger trg_app_users_guard before update on app_users
  for each row execute function app_users_guard();

-- Clôture d'un ticket réservée à owner/admin
create or replace function ticket_close_guard()
returns trigger language plpgsql security definer as $$
begin
  if NEW.statut = 'cloture' and OLD.statut is distinct from 'cloture' and not is_owner_or_admin() then
    raise exception 'Seuls le propriétaire ou un administrateur peuvent clôturer un ticket.';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_ticket_close_guard on maintenance_tickets;
create trigger trg_ticket_close_guard before update on maintenance_tickets
  for each row execute function ticket_close_guard();

-- ============================================================
-- Fin migration 0005.
-- ============================================================


-- ====== (intégré depuis migrations/0006_user_management.sql) ======
create or replace function claim_app_user()
returns void
language plpgsql
security definer
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return;
  end if;
  -- Relie la 1re ligne app_users non reliée dont l'e-mail correspond
  update app_users
  set auth_user_id = auth.uid()
  where auth_user_id is null
    and lower(email) = lower(v_email);
end;
$$;

grant execute on function claim_app_user() to authenticated;

-- ============================================================
-- Fin migration 0006.
-- ============================================================


-- ====== (intégré depuis migrations/0007_audit.sql) ======
alter table activity_logs add column if not exists ip_adresse text;

-- Nouvelle cible d'entité pour les changements de paramètres/seuils
alter type log_entity_type add value if not exists 'parametre';

-- Journalise une action sensible (auteur et IP déterminés côté serveur).
create or replace function log_action(
  p_action      log_action_type,
  p_entity_type log_entity_type,
  p_entity_id   uuid,
  p_apres       jsonb default null,
  p_motif       text  default null
) returns void
language plpgsql
security definer
as $$
declare
  v_owner  uuid := current_owner_id();
  v_auteur uuid := current_app_user_id();
  v_ip     text;
begin
  if v_owner is null then
    return;
  end if;
  begin
    v_ip := split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
      ',', 1);
  exception when others then
    v_ip := null;
  end;
  insert into activity_logs (owner_id, auteur_id, action_type, entity_type, entity_id,
                             valeur_apres, motif, ip_adresse, horodatage)
  values (v_owner, v_auteur, p_action, p_entity_type, p_entity_id,
          p_apres, p_motif, nullif(v_ip, ''), now());
end;
$$;

grant execute on function log_action(log_action_type, log_entity_type, uuid, jsonb, text) to authenticated;

-- Vue enrichie du journal (auteur + libellé + montant + motif + IP)
create or replace view activity_logs_view
with (security_invoker = on) as
select
  l.id, l.owner_id, l.action_type, l.entity_type, l.entity_id, l.horodatage,
  au.nom as auteur_nom,
  coalesce(l.valeur_apres ->> 'label', l.entity_type::text) as entity_label,
  nullif(l.valeur_apres ->> 'montant', '')::int as montant,
  l.motif,
  l.ip_adresse
from activity_logs l
left join app_users au on au.id = l.auteur_id;

-- ============================================================
-- Fin migration 0007.
-- ============================================================

-- ============================================================
-- MIGRATION 0008 — Centre de notifications (Phase 5)
-- ============================================================
-- ------------------------------------------------------------
-- A. TABLE DE SUIVI DE LECTURE
-- ------------------------------------------------------------
create table if not exists notification_reads (
  app_user_id uuid not null references app_users(id) on delete cascade,
  owner_id    uuid not null references owners(id)    on delete cascade,
  alert_key   text not null,
  read_at     timestamptz not null default now(),
  primary key (app_user_id, alert_key)
);
create index if not exists idx_notif_reads_owner on notification_reads(owner_id);

alter table notification_reads enable row level security;

drop policy if exists notif_reads_all on notification_reads;
create policy notif_reads_all on notification_reads
  for all
  using (is_active_user() and app_user_id = current_app_user_id())
  with check (
    is_active_user()
    and app_user_id = current_app_user_id()
    and owner_id = current_owner_id()
  );

-- ------------------------------------------------------------
-- B. RPC : NOTIFICATIONS (alertes + état lu) EN UN APPEL
-- ------------------------------------------------------------
-- security invoker : v_alertes applique déjà la RLS (périmètre owner/agent).
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
      a.type || ':' || coalesce(a.entity_id::text, '') as key,
      (nr.alert_key is not null) as lu
    from v_alertes a
    left join notification_reads nr
      on  nr.alert_key   = a.type || ':' || coalesce(a.entity_id::text, '')
      and nr.app_user_id = current_app_user_id()
  ) x;
$$;

grant execute on function get_notifications() to authenticated;

-- ------------------------------------------------------------
-- C. RPC : MARQUER COMME LU (une liste de clés, ou tout)
-- ------------------------------------------------------------
-- security invoker : les écritures passent par la RLS de notification_reads
-- et la purge ne « voit » que les alertes du périmètre de l'appelant.
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

  -- Purge des clés obsolètes (alertes résolues) : garde la table compacte.
  delete from notification_reads nr
  where nr.app_user_id = v_user
    and nr.alert_key not in (
      select a.type || ':' || coalesce(a.entity_id::text, '') from v_alertes a
    );
end;
$$;

grant execute on function mark_notifications_read(text[]) to authenticated;

-- ============================================================
-- Fin migration 0008.
-- ============================================================


-- ====== (intégré depuis migrations/0009_alertes_actions.sql) ======
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
