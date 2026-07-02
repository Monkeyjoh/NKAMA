# NKAMA — Plan de validation du MVP

Phase de stabilisation : aucune nouvelle fonctionnalité. Objectif = valider
stabilité, cohérence des données, performances et UX avec une vraie base
Supabase remplie par `supabase/seed.sql`.

## 0. Préparation

1. `supabase/schema.sql` puis `supabase/seed.sql` dans l'éditeur SQL.
2. `.env` renseigné (URL + clé anon), `npm install`, `npm run dev`.
3. Connexion par lien magique, puis **lier le compte** :
   ```sql
   select id, email from auth.users;
   update app_users set auth_user_id = '<auth_uid>' where role = 'owner';
   ```
4. Recharger : le tableau de bord doit se remplir.

> Les alertes basées sur l'**âge** des données (bien vacant > 30 j, ticket
> non traité > 7 j) ne se déclenchent que lorsque les enregistrements ont
> vieilli. Juste après le seed (créés « aujourd'hui »), elles sont vides :
> c'est attendu, pas un bug.

## 1. Valeurs attendues (avec le seed)

| Indicateur | Valeur attendue |
| --- | --- |
| Parc — total / occupés / vacants | 4 / 3 / 1 |
| Taux d'occupation | 75 % |
| Loyers attendus (mois courant) | 1 010 000 FCFA |
| Loyers encaissés | 830 000 FCFA |
| Loyers en retard / nb | 180 000 FCFA / 1 locataire |
| Retards par locataire | Okou Patrick — 360 000 FCFA, 2 mois |
| Locataires actifs | 3 |
| Maintenance — tickets ouverts | 3 |
| Maintenance — coût total | 425 000 FCFA |
| Contrôle — dépenses à valider | 1 |
| Contrôle — factures en attente | 1 |
| Contrôle — paiements en retard | 2 |
| Alertes (fresh seed) | ≥ 2 (loyers en retard) |

> Le contrat « Villa Glass » a une fin au 28/08/2026 : l'alerte « contrat
> bientôt expiré » apparaît si la date du jour est à ≤ 60 jours de cette fin.

## 2. Tests fonctionnels (par écran)

### Authentification
- [ ] Sans `.env` → l'app refuse l'accès et redirige vers `/login` (ou mode
      attendu). Avec `.env` mais sans session → `/login`.
- [ ] Lien magique reçu, clic → retour authentifié, prénom affiché en en-tête.
- [ ] « Changer de profil » (menu Plus) → déconnexion → `/login`.

### Tableau de bord
- [ ] Tous les KPI affichent les valeurs du §1 (aucun chiffre fictif).
- [ ] Onglet « Alertes » : badge = nombre d'alertes, liste cohérente.
- [ ] Un seul appel réseau `rpc/get_dashboard` au chargement (cf. §4).
- [ ] Rechargement de la page < TTL (60 s) → pas de nouvel appel (cache).

### Biens / Fiche bien
- [ ] Liste : 4 biens, statut occupé/vacant correct, loyers exacts.
- [ ] Fiche : onglets Locataire / Travaux / Documents / Finances.
- [ ] Villa Batterie IV → Travaux : 1 intervention clôturée (peinture façade).
- [ ] Studio Akanda (vacant) → onglet Locataire : état vide + lien CRM.

### CRM
- [ ] 5 prospects répartis dans les bonnes colonnes (chips de résumé exacts).
- [ ] Faire avancer un prospect → toast + persistance après rechargement
      (vérifie l'écriture Supabase).
- [ ] « Marquer refusé » → colonne Refusé.

### Maintenance (blocages par preuves)
- [ ] Ticket « signalé » sans photo avant → bouton « Affecter » **désactivé**.
- [ ] Ticket « en cours » sans photo après + facture → « Envoyer en
      validation » **désactivé**.
- [ ] Ticket « validation » → « Valider et clôturer » → passe en clôturé,
      persistant après rechargement.

### Finances
- [ ] Vue d'ensemble : KPI + cash-flow 6 mois + dépenses par catégorie.
- [ ] Onglet Dépenses : valider/rejeter une dépense en attente → persistant +
      le dashboard reflète le changement (cache invalidé).
- [ ] Par bien : rentabilité nette cohérente avec le §1.

### Contrôle / Paramètres
- [ ] Contrôle : anomalies + journal d'audit (3 entrées de seed).
- [ ] Paramètres : 3 utilisateurs (rôles), seuils d'anomalie affichés.

## 3. Cohérence des données

- [ ] Catégories prestataires affichées en clair (« Électricien », « Maçon »…).
- [ ] Dates de contrats au format `JJ/MM/AAAA`.
- [ ] Score locataire : Okou Patrick < 80 (retards), Ndong/Mbina élevés.
- [ ] Somme « rentabilité par bien » cohérente avec « rentabilité globale ».
- [ ] Aucun écran n'affiche de données d'un autre `owner` (cf. §5).

## 4. Performances

- [ ] Onglet réseau : le Dashboard fait **1 seule** requête `get_dashboard`.
- [ ] Les listes (biens, locataires…) font 1 requête chacune, pas de N+1.
- [ ] Vérifier les index (déjà créés) :
  ```sql
  select indexname from pg_indexes
  where schemaname='public' and tablename in
   ('payments','expenses','maintenance_tickets','contracts');
  ```
- [ ] Plans d'exécution sains sur les vues critiques :
  ```sql
  explain analyze select get_dashboard();
  ```

## 5. Sécurité / RLS (multi-propriétaires)

- [ ] Créer un 2e owner + 2e app_user lié à un autre compte auth, puis vérifier
      que chaque compte ne voit **que** ses biens/locataires/dépenses.
- [ ] `app_users`, `owners`, `property_owner_contractors` ont la RLS activée
      (corrigé en migration `0003`) :
  ```sql
  select tablename, rowsecurity from pg_tables
  where schemaname='public'
    and tablename in ('app_users','owners','property_owner_contractors');
  -- rowsecurity doit être true pour les trois
  ```

## 6. États UX (robustesse)

- [ ] Couper le réseau / clé invalide → état **Erreur** + bouton « Réessayer ».
- [ ] Base vide (avant seed) → état **« Aucune donnée disponible »** partout,
      jamais de chiffres fictifs.
- [ ] Pendant le chargement → spinner **Loading** (pas d'écran blanc).

---

### Journal des anomalies trouvées

| # | Écran / requête | Description | Gravité | Statut |
| - | --- | --- | --- | --- |
|   |   |   |   |   |

> Remplir ce tableau pendant les tests ; me transmettre les lignes pour
> correction (bugs, archi, perf uniquement — pas de nouvelles fonctionnalités).

## Phase 5 — Centre de notifications

Pré-requis : exécuter `supabase/migrations/0008_notifications.sql` (ou le
`schema.sql` à jour).

- [ ] Cloche (tableau de bord) : badge = nombre de notifications **non lues**
      (fresh seed : ≥ 2, identique au nombre d'alertes). Un seul appel réseau
      `rpc/get_notifications` partagé entre la cloche et la page (cache 60 s).
- [ ] Clic sur la cloche → `/notifications` : non-lues en premier, gravité
      haute en tête, pastille rouge sur les non-lues.
- [ ] Clic sur une notification → marquée lue (pastille disparaît, carte
      atténuée) + navigation vers l'écran concerné (bien, contrat,
      maintenance, contrôle).
- [ ] « Tout lire » → toutes lues, badge de la cloche disparaît (retour au
      tableau de bord).
- [ ] Rechargement : l'état lu **persiste** (table `notification_reads`,
      par utilisateur — un autre compte garde ses propres non-lues).
- [ ] Alerte résolue (ex. loyer marqué payé) → la notification disparaît de
      la liste ; la ligne de lecture obsolète est purgée au prochain
      `mark_notifications_read`.
- [ ] Agent : ne voit que les notifications de son périmètre (RLS
      `v_alertes`) ; les cibles réservées owner/admin ne sont pas cliquables.

## Phase 6 — Alertes intelligentes (actions contextuelles)

Pré-requis : exécuter `supabase/migrations/0009_alertes_actions.sql` (ou le
`schema.sql` à jour — désormais réexécutable sans erreur 42P16 : les vues
sont supprimées puis recréées).

Chaque alerte (onglet Alertes du dashboard ET page Notifications) affiche
des boutons d'action selon son type :

- [ ] **Loyer en retard** : Appeler (ouvre le composeur), WhatsApp,
      Relance (WhatsApp avec message pré-rempli : nom, bien, montant),
      Rappel, Traité.
- [ ] **Contrat bientôt expiré** : Renouveler (→ fiche contrat,
      owner/admin), Prévenir (WhatsApp pré-rempli avec la date de fin),
      Rappel, Traité.
- [ ] **Bien vacant** : Voir le bien, Chercher un locataire (→ CRM),
      Rappel, Traité.
- [ ] **Ticket non traité** : Ouvrir (→ Maintenance) ; si « signalé » :
      Affecter (choix du prestataire — désactivé sans photo avant, comme
      dans l'écran Maintenance) ; si « validation » : Clôturer (owner/admin).
- [ ] **Dépense (justificatif / seuil)** : Valider et Refuser (avec motif)
      si « en attente » (owner/admin) ; Demander justificatif (WhatsApp,
      choix du destinataire).
- [ ] **Marquer traité** : l'alerte disparaît du dashboard ET des
      notifications, pour TOUS les utilisateurs du compte (table
      `alert_states`). Persiste après rechargement. Quand l'anomalie est
      résolue en base (ex. loyer payé), la ligne d'état est purgée
      automatiquement au prochain « marquer traité ».
- [ ] **Programmer un rappel** : choisir date/heure + note → toast. À
      l'échéance, une notification « Rappel » apparaît (cloche + page),
      pour l'utilisateur qui l'a créé uniquement (table `reminders`).
      Test rapide : programmer un rappel à l'heure courante puis recharger.
- [ ] **Rappel dû** : bouton « Terminé » → il disparaît ; le clic sur la
      carte navigue vers l'entité d'origine si applicable.
- [ ] Actions en écriture (Valider/Refuser/Clôturer/Affecter/Traité) :
      cohérence dashboard ↔ notifications (caches invalidés des deux côtés).
- [ ] Agent : ne voit que les actions de son périmètre (pas de
      Valider/Refuser de dépense, pas de Renouveler, pas de Clôturer).
