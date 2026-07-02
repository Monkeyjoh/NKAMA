-- ============================================================
-- NKAMA — Données de démonstration (à exécuter APRÈS schema.sql)
-- ============================================================
-- Exécuté depuis l'éditeur SQL Supabase (rôle service → RLS ignorée).
-- IDs fixes pour pouvoir relier les tables entre elles.
-- ============================================================

-- 1. Owner + utilisateurs applicatifs ------------------------
insert into owners (id, nom) values
  ('00000000-0000-0000-0000-000000000001', 'Famille Mve')
on conflict (id) do nothing;

-- auth_user_id reste NULL : à renseigner après la 1re connexion
-- (voir supabase/README.md, étape « Lier votre compte »).
insert into app_users (id, owner_id, nom, telephone, email, role) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Yannick', '+241 06 00 00 01', 'yannick@nkama.demo', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Maman',   '+241 06 00 00 02', 'maman@nkama.demo', 'admin'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Petit frère', '+241 06 00 00 03', 'frere@nkama.demo', 'agent')
on conflict (id) do nothing;

-- 2. Biens ---------------------------------------------------
insert into properties (id, owner_id, nom, adresse, quartier, type, chambres, surface_m2, loyer_mensuel) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Villa Glass', 'Bord de mer, Glass', 'Glass, Libreville', 'villa', 5, 220, 450000),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Appt Nzeng-Ayong A2', 'Carrefour SNI, bât. A2', 'Nzeng-Ayong, Libreville', 'appartement', 3, 95, 180000),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Studio Akanda', 'Cap Estérias, résidence Palme', 'Akanda, Libreville', 'studio', 1, 38, 120000),
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Villa Batterie IV', 'Lotissement Batterie IV, derrière l''école primaire', 'Batterie IV, Libreville', 'villa', 4, 180, 380000)
on conflict (id) do nothing;

-- 3. Locataires ----------------------------------------------
insert into tenants (id, owner_id, nom, telephone, whatsapp) values
  ('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Mbina Florence', '+241 06 71 45 90', '+241 06 71 45 90'),
  ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Okou Patrick',   '+241 06 22 88 14', '+241 06 22 88 14'),
  ('22222222-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ndong Sylvie',   '+241 06 88 22 11', '+241 06 88 22 11')
on conflict (id) do nothing;

-- 4. Prospects (CRM) -----------------------------------------
insert into leads (id, owner_id, nom, telephone, whatsapp, email, budget_max, type_recherche, zone_recherchee, statut, source, prochaine_action, dossier_complet) values
  ('33333333-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Koumba Eric', '+241 06 55 21 09', '+241 06 55 21 09', 'eric.koumba@gmail.com', 200000, 'appartement', 'Nzeng-Ayong', 'nouveau', 'recommandation', 'Premier contact', false),
  ('33333333-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Mba Sandrine', '+241 07 12 34 88', '+241 07 12 34 88', 'sandrine.mba@yahoo.fr', 130000, 'studio', 'Akanda', 'visite_prevue', 'annonce', 'Visite le 28/06', false),
  ('33333333-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ondo Jean-Marc', '+241 06 78 90 12', '+241 06 78 90 12', 'jm.ondo@gmail.com', 400000, 'villa', 'Batterie IV', 'dossier_recu', 'agent', 'Relancer pour pièce d''identité', false),
  ('33333333-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Nguema Patricia', '+241 06 33 44 55', '+241 06 33 44 55', 'patricia.nguema@gmail.com', 460000, 'villa', 'Glass', 'signe', 'recommandation', null, true),
  ('33333333-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Boukandou Marc', '+241 07 22 11 00', '+241 07 22 11 00', 'marc.boukandou@gmail.com', 90000, 'studio', 'Akanda', 'refuse', 'annonce', null, false)
on conflict (id) do nothing;

-- 5. Prestataires (annuaire partagé) -------------------------
insert into contractors (id, nom, telephone, zone_intervention, categories) values
  ('44444444-0000-0000-0000-000000000001', 'Mba Électricité', '+241 06 40 12 33', 'Libreville', '{electricien}'),
  ('44444444-0000-0000-0000-000000000002', 'Okandze BTP', '+241 07 55 90 21', 'Estuaire', '{macon}'),
  ('44444444-0000-0000-0000-000000000003', 'Plomberie Express', '+241 06 11 47 80', 'Libreville', '{plombier}'),
  ('44444444-0000-0000-0000-000000000004', 'Sécuri-Gardiennage', '+241 07 33 22 10', 'Akanda', '{gardien}'),
  ('44444444-0000-0000-0000-000000000005', 'Agence Évasion', '+241 06 90 00 55', 'Libreville', '{agent_immobilier}')
on conflict (id) do nothing;

insert into property_owner_contractors (owner_id, contractor_id, note_moyenne) values
  ('00000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 4.6),
  ('00000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 4.8),
  ('00000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 4.1),
  ('00000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 4.4),
  ('00000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 4.2)
on conflict do nothing;

-- 6. Contrats (3 actifs ; Studio Akanda reste vacant) --------
insert into contracts (id, property_id, tenant_id, date_debut, date_fin, loyer_mensuel, actif) values
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '2024-03-01', '2026-08-28', 450000, true),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '2023-09-01', null, 180000, true),
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', '2024-01-01', null, 380000, true)
on conflict (id) do nothing;

-- 7. Paiements : 12 derniers mois payés pour chaque contrat --
insert into payments (contract_id, mois, montant, statut, date_paiement)
select c.id,
       (date_trunc('month', now()) - (g || ' months')::interval)::date,
       c.loyer_mensuel,
       'paye',
       (date_trunc('month', now()) - (g || ' months')::interval)::date
from contracts c
cross join generate_series(0, 11) as g
on conflict (contract_id, mois) do nothing;

-- Okou Patrick : 2 derniers mois en retard (impacte le score)
update payments
set statut = 'en_retard', date_paiement = null
where contract_id = '55555555-0000-0000-0000-000000000002'
  and mois >= (date_trunc('month', now()) - interval '1 month')::date;

-- Phase 7 : un mois « payé » l'est intégralement (montant_paye = montant)
update payments set montant_paye = montant, mode_paiement = 'especes'
where statut = 'paye' and montant_paye = 0;

-- 8. Documents (preuves de tickets + justificatif dépense) ---
insert into documents (id, owner_id, entity_type, entity_id, nom_fichier, storage_path, type_fichier) values
  ('66666666-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000001', 'avant_clim.jpg', 'demo/avant_clim.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000003', 'avant_fissure.jpg', 'demo/avant_fissure.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000003', 'apres_fissure.jpg', 'demo/apres_fissure.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000003', 'facture_btp.pdf', 'demo/facture_btp.pdf', 'pdf'),
  ('66666666-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000004', 'avant_peinture.jpg', 'demo/avant_peinture.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000004', 'apres_peinture.jpg', 'demo/apres_peinture.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001', 'ticket', '77777777-0000-0000-0000-000000000004', 'facture_peinture.jpg', 'demo/facture_peinture.jpg', 'image'),
  ('66666666-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000001', 'property', '11111111-0000-0000-0000-000000000004', 'facture_clim_justif.jpg', 'demo/justif_clim.jpg', 'image')
on conflict (id) do nothing;

-- 9. Tickets de maintenance ----------------------------------
insert into maintenance_tickets
  (id, property_id, tenant_id, contractor_id, titre, categorie, priorite, statut,
   photo_avant_doc_id, photo_apres_doc_id, facture_doc_id, montant_facture, imputable_locataire)
values
  ('77777777-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001',
   'Climatisation salon en panne', 'electricite', 'urgent', 'en_cours',
   '66666666-0000-0000-0000-0000000000a1', null, null, null, null),
  ('77777777-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', null,
   'Fuite robinet cuisine', 'plomberie', 'normal', 'signale',
   null, null, null, null, null),
  ('77777777-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002',
   'Fissure mur extérieur', 'maconnerie', 'preventif', 'validation',
   '66666666-0000-0000-0000-0000000000b1', '66666666-0000-0000-0000-0000000000b2', '66666666-0000-0000-0000-0000000000b3', 145000, null),
  ('77777777-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000002',
   'Peinture façade extérieure', 'maconnerie', 'preventif', 'cloture',
   '66666666-0000-0000-0000-0000000000c1', '66666666-0000-0000-0000-0000000000c2', '66666666-0000-0000-0000-0000000000c3', 280000, false)
on conflict (id) do nothing;

-- 10. Dépenses ----------------------------------------------
insert into expenses (id, owner_id, property_id, categorie, montant, justificatif_doc_id, statut, motif_rejet) values
  ('88888888-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'maintenance', 95000, '66666666-0000-0000-0000-0000000000d1', 'en_attente', null),
  ('88888888-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'taxes', 60000, null, 'validee', null),
  ('88888888-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', null, 'gestion', 40000, null, 'validee', null),
  ('88888888-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'assurance', 25000, null, 'rejetee', 'Montant à reconfirmer avec le contrat')
on conflict (id) do nothing;

-- 11. Journal d'audit (quelques entrées) ---------------------
insert into activity_logs (owner_id, auteur_id, action_type, entity_type, entity_id, horodatage) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'validation', 'expense', '88888888-0000-0000-0000-000000000002', now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'changement_statut', 'maintenance_ticket', '77777777-0000-0000-0000-000000000003', now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'rejet', 'expense', '88888888-0000-0000-0000-000000000004', now() - interval '21 days')
on conflict do nothing;

-- ============================================================
-- Fin du seed.
-- ============================================================

-- 12. Seuils configurables (alertes / anomalies) -------------
insert into owner_settings (owner_id, seuil_depense_montant, seuil_depense_pct, ticket_sla_jours, bail_echeance_jours, depart_prevu_jours, vacance_jours, retard_jours)
values ('00000000-0000-0000-0000-000000000001', 150000, 150, 7, 60, 30, 30, 5)
on conflict (owner_id) do nothing;

-- 13. Affectations agent ↔ biens (l'agent ne voit que ceux-ci) ----
insert into property_assignments (app_user_id, property_id, owner_id) values
  ('00000000-0000-0000-0000-0000000000a3', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a3', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001')
on conflict do nothing;
