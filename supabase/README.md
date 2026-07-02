# NKAMA — Mise en place Supabase

Tout le code est déjà branché : dès que les variables d'environnement sont
présentes, l'application bascule automatiquement du mode démo (mock) vers
Supabase. Voici les étapes.

## 1. Créer le projet

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Récupérez, dans **Project Settings → API** :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   > Ne copiez jamais la clé `service_role` dans le front-end.

## 2. Renseigner l'environnement

À la racine du projet :

```bash
cp .env.example .env
```

Puis remplissez `.env` :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 3. Déployer le schéma et les données

Dans **Supabase → SQL Editor**, exécutez dans l'ordre :

1. `supabase/schema.sql` (tables, vues UI, fonctions, RLS)
2. `supabase/seed.sql` (données de démonstration)

## 4. Activer l'authentification par lien magique

Dans **Authentication → Providers → Email**, activez **Email** (lien magique
activé par défaut). Dans **Authentication → URL Configuration**, ajoutez votre
URL locale (`http://localhost:5173`) aux *Redirect URLs*.

## 5. Lier votre compte au profil applicatif

Le `seed.sql` crée trois `app_users` (owner/admin/agent) **sans** `auth_user_id`.
Après votre première connexion (lien magique), reliez votre compte :

```sql
-- Récupérez votre id auth
select id, email from auth.users;

-- Reliez-le au profil "owner" (remplacez <auth_uid>)
update app_users
set auth_user_id = '<auth_uid>'
where role = 'owner';
```

La politique RLS associe `auth.uid()` → `owner_id` via la fonction
`current_owner_id()` : sans cette liaison, l'utilisateur ne verra aucune donnée.

## 6. Lancer l'application

```bash
npm install
npm run dev
```

- **Sans `.env`** : mode démo (données mock), aucune connexion requise.
- **Avec `.env`** : écran de connexion par e-mail, puis données réelles.

---

## Couverture actuelle (live vs à finaliser)

| Écran / donnée | Source quand Supabase est branché |
| --- | --- |
| Biens (liste + fiche) | **Live** — `properties_view`, tickets/documents liés |
| Locataires | **Live** — `tenants_view` (+ score `tenant_score_value`) |
| Prestataires | **Live** — `contractors_view` |
| Contrats | **Live** — `contracts_view` |
| CRM prospects | **Live** — table `leads` (+ maj statut) |
| Maintenance | **Live** — `tickets_view` (+ maj statut) |
| Finances · Dépenses / Par bien | **Live** — `expenses_view`, `properties_view` |
| Contrôle · Journal d'audit + anomalies | **Live** — `activity_logs_view`, `v_alertes` |
| Tableau de bord · tous les KPI (parc, loyers, finances, maintenance, prestataires, contrôle) | **Live** — `get_dashboard()` (vues agrégées) |
| Tableau de bord · alertes automatiques | **Live** — `v_alertes` |
| Notifications (cloche + centre) | **Live** — `get_notifications()`, `notification_reads` |
| Finances · cash-flow + dépenses par catégorie | **Live** — `v_cashflow_mensuel`, `v_depenses_categorie_mois` |

L'intégralité de l'application est désormais pilotée par Supabase : plus
aucune donnée mock dans le code React. Les données de développement sont
fournies uniquement par `supabase/seed.sql`.

## Tableau de bord : tout est calculé en base

Le tableau de bord est servi par **une seule fonction RPC** `get_dashboard()`
qui agrège toutes les vues (1 round-trip). Côté React, `useDashboard()`
met le résultat en cache (TTL 60 s) et expose `refetch()`.

Vues créées (migration `0002_dashboard.sql`, intégrée à `schema.sql`) :
`v_parc_summary`, `v_locataires_summary`, `v_loyers_mois`,
`v_retards_par_locataire`, `v_depenses_mois`, `v_depenses_categorie_mois`,
`v_rentabilite_bien`, `v_rentabilite_globale`, `v_cashflow_mensuel`,
`v_maintenance_summary`, `v_prestataires_summary`, `v_prestataires_top`,
`v_controle_summary`, `v_alertes`.

Seuils d'alerte configurables par propriétaire : table `owner_settings`
(montant de dépense, % moyenne, SLA ticket, échéance bail, vacance, retard).
Index ajoutés sur `payments(mois,statut)`, `expenses(statut,created_at)`,
`maintenance_tickets(created_at)`, `contracts(actif,date_fin)`.
