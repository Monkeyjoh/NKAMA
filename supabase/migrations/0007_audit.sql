-- ============================================================
-- NKAMA — Migration 0007 : Journal des décisions (audit enrichi)
-- ============================================================
-- Enregistre les actions sensibles dans activity_logs (append-only déjà
-- garanti en 0001 : UPDATE/DELETE révoqués pour authenticated).
--   • colonne ip_adresse (best-effort, depuis l'en-tête de la requête)
--   • RPC log_action() — auteur + IP renseignés CÔTÉ SERVEUR (non falsifiables)
--   • activity_logs_view enrichie (auteur, libellé, montant, motif, IP)
-- Idempotent. À exécuter après 0006. (Aussi intégré à schema.sql.)
-- ============================================================

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
