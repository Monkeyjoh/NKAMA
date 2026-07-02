-- ============================================================
-- NKAMA — Migration 0004 : alertes "loyer en retard" agrégées
-- ============================================================
-- Avant : 1 alerte par paiement en retard (doublons visibles pour un
-- locataire avec plusieurs mois). Après : 1 alerte par contrat, mois
-- cumulés. Idempotent (create or replace view). À exécuter sur une base
-- déjà déployée ; déjà intégré à schema.sql pour un déploiement neuf.
-- ============================================================

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
