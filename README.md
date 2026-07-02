# NKAMA

Application de gestion locative (Libreville / Gabon). Migration du prototype
vers une base **Vite + React** propre, modulaire et prête pour Supabase.

Le design (palette terracotta/papier, navigation mobile) est **strictement
identique au prototype** : styles inline centralisés, aucune dérive visuelle.

## Démarrage

```bash
npm install
npm run dev      # serveur de développement (http://localhost:5173)
npm run build    # build de production
npm run preview  # prévisualiser le build
```

> Langage : **JavaScript + JSDoc**. Les types métier sont décrits dans
> `src/types/domain.js` (typedefs JSDoc), prêts à devenir des types
> TypeScript / Supabase plus tard.

## Structure

```
src/
├── App.jsx                  # Définition des routes (react-router)
├── main.jsx                 # Point d'entrée
├── assets/                  # Ressources statiques
├── styles/
│   ├── global.css           # Variables CSS (couleurs) + base
│   ├── theme.js             # Jetons couleurs / typo (référence JS)
│   └── sharedStyles.js      # Objets de style inline partagés (S)
├── lib/
│   ├── constants.js         # ROUTES, NAV_ITEMS, statuts, métadonnées
│   ├── utils.js             # formatFCFA, rentabilite, scoreColor, etc.
│   └── supabase.js          # Client Supabase (NON connecté, prêt à brancher)
├── types/
│   ├── domain.js            # Typedefs métier (miroir du schéma SQL)
│   └── database.types.js    # Placeholder des types générés par Supabase
├── data/
│   └── mockData.js          # Données de démonstration (source unique)
├── services/                # Couche d'accès aux données (prête pour Supabase)
│   ├── _helpers.js          # mockResult(), notImplemented()
│   ├── propertiesService.js · tenantsService.js · leadsService.js
│   ├── contractorsService.js · contractsService.js · maintenanceService.js
│   ├── expensesService.js · paymentsService.js · activityLogsService.js
│   └── index.js             # Barrel export
├── hooks/                   # Hooks de domaine (useAsync + un hook par entité)
├── layouts/
│   └── MobileLayout.jsx     # Conteneur mobile + navigation basse
├── components/
│   ├── ui/                  # Primitives réutilisables (Icon, KpiCard, Modal,
│   │                        #   PipelineSteps, ProofBox, Charts, Toast…)
│   ├── layout/              # Header, TopHeader, BottomNav
│   ├── dashboard/ crm/ properties/ finances/ maintenance/ plus/
│   │                        # Composants par domaine
└── pages/                   # 12 écrans (un fichier par route)
```

## Architecture des données

```
Page → hook (useXxx) → service (xxxService) → [ mock | Supabase ]
```

Aujourd'hui les services renvoient les données de `src/data/mockData.js`.
Lors du branchement Supabase, **seuls les services changent** : l'UI, les
hooks et les pages restent identiques.

## Supabase (déjà branché, bascule automatique)

L'intégration Supabase est **codée et active** : sans `.env`, l'app tourne en
mode démo (mock) ; dès que `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` sont
renseignés, les services interrogent la base réelle et l'écran de connexion
(lien magique e-mail) s'active.

- **Authentification** : `signInWithOtp` (lien magique), session + rôle lu dans
  `app_users` (`owner`/`admin`/`agent`), routes protégées (`ProtectedRoute`).
  Voir `src/hooks/useAuth.jsx`, `src/services/authService.js`, `src/pages/LoginPage.jsx`.
- **Données** : chaque service tente Supabase si configuré, sinon mock. Les vues
  SQL (`properties_view`, `tickets_view`, `expenses_view`…) fournissent
  directement les modèles attendus par l'UI ; `src/lib/mappers.js` finalise.
- **SQL** : `supabase/schema.sql` (tables, vues, fonctions, RLS) puis
  `supabase/seed.sql` (données de démo).

👉 Marche à suivre détaillée : **`supabase/README.md`**.

### Migration des types vers Supabase (optionnel)

```bash
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```
```
