-- ============================================================
-- NKAMA — Migration 0005 : RBAC (rôles, permissions, scoping agent)
-- ============================================================
-- Phase 2 / Étape 0 — socle sécurité.
--   • app_users enrichi (statut, email, dernière connexion, langue, photo…)
--   • table property_assignments (agent ↔ bien)
--   • fonctions d'identité/rôle (SECURITY DEFINER → pas de récursion RLS)
--   • RLS RÉÉCRITE en mode rôle :
--       - owner/admin : périmètre complet de leur propriétaire
--       - agent       : lecture limitée aux biens AFFECTÉS ; peut créer des
--                       tickets et ajouter des documents sur ces biens
--   • triggers de garde (auto-protection rôle, clôture ticket)
-- Idempotent. À exécuter après 0002/0003/0004. (Aussi intégré à schema.sql.)
-- ============================================================

-- ------------------------------------------------------------
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
