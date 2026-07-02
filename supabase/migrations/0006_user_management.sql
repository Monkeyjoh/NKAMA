-- ============================================================
-- NKAMA — Migration 0006 : Gestion des utilisateurs (invitation par e-mail)
-- ============================================================
-- Permet de créer des utilisateurs (admin/agent) sans clé service_role :
--   1) un owner/admin insère une ligne app_users (auth_user_id = NULL) avec
--      l'e-mail de l'invité (RLS gère qui peut créer quel rôle) ;
--   2) l'invité se connecte par lien magique avec ce même e-mail ;
--   3) au login, l'app appelle claim_app_user() qui relie automatiquement la
--      ligne app_users (e-mail correspondant, non encore reliée) à son compte.
-- Idempotent. À exécuter après 0005. (Aussi intégré à schema.sql.)
-- ============================================================

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
