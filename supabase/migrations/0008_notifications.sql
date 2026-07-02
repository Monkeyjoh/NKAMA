-- ============================================================
-- NKAMA — Migration 0008 : Centre de notifications (Phase 5)
-- ============================================================
-- Les notifications sont les alertes automatiques de `v_alertes`, enrichies
-- d'un état lu / non-lu PAR UTILISATEUR :
--   • table `notification_reads` : marque une alerte comme lue pour un
--     app_user (clé stable = type || ':' || entity_id) ;
--   • RPC `get_notifications()` : alertes + drapeau `lu` (1 round-trip) ;
--   • RPC `mark_notifications_read(text[])` : marque une liste de clés
--     comme lues (idempotent, on conflict do nothing) ;
--   • purge automatique des clés obsolètes (alerte résolue → ligne inutile).
-- Idempotent. À exécuter après 0007. (Aussi intégré à schema.sql.)
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
