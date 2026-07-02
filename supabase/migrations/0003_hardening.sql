-- ============================================================
-- NKAMA — Migration 0003 : Durcissement (RLS manquantes + vues)
-- ============================================================
-- Phase de validation MVP : corrige des lacunes de cohérence/sécurité des
-- données et fiabilise une vue. Idempotent. À exécuter après 0002 (déjà
-- intégré à schema.sql pour un déploiement neuf).
-- ============================================================

-- ------------------------------------------------------------
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
