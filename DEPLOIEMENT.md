# NKAMA — Guide de déploiement

Build vérifié ✅ (`vite build` → `dist/`, ~148 kB gzip).
Les configs `vercel.json` et `netlify.toml` sont déjà dans le projet (rewrites SPA pour react-router).

## Variables d'environnement (obligatoires sur les 2 plateformes)

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique **anon** |

⚠️ Ce sont des variables de **build** : après tout changement, il faut redéployer.
Ne jamais mettre la clé `service_role` côté front.

## Option A — Vercel

**Via Git (recommandé)**
1. Pousser le projet sur GitHub/GitLab.
2. vercel.com → *Add New Project* → importer le repo. Framework détecté : Vite.
3. *Environment Variables* : ajouter les 2 variables ci-dessus → *Deploy*.

**Via CLI**
```bash
npm i -g vercel
vercel            # premier déploiement (preview)
vercel --prod     # production
```

## Option B — Netlify

**Via Git**
1. app.netlify.com → *Add new site* → *Import an existing project*.
2. Build command et publish dir sont lus depuis `netlify.toml`.
3. *Site settings → Environment variables* : ajouter les 2 variables → déployer.

**Via CLI**
```bash
npm i -g netlify-cli
netlify deploy --build          # preview
netlify deploy --build --prod   # production
```

## Côté Supabase (avant la mise en ligne)

1. Appliquer `supabase/schema.sql` puis les migrations (`supabase/migrations/`) et éventuellement `seed.sql`.
2. Vérifier que la **RLS** est activée sur les tables.
3. Si l'app utilise l'auth : Supabase → *Authentication → URL Configuration* → ajouter l'URL du site déployé (Site URL + Redirect URLs).

## Vérification post-déploiement

- Ouvrir une route profonde directement (ex. `/biens`) et rafraîchir → pas de 404 (rewrites OK).
- Console navigateur : aucune erreur Supabase (env vars OK).

## Optionnel (plus tard)

- Le bundle JS fait ~542 kB (warning Vite) : du code-splitting via `React.lazy` sur les pages réduirait le chargement initial. Non bloquant pour déployer.
