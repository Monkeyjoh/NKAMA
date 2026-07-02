# src/data — (vidé)

Les données de démonstration ne vivent **plus** dans le code React.

L'application est entièrement pilotée par Supabase. Les données de
développement sont fournies uniquement par le script de seed :

```
supabase/seed.sql
```

Pour repartir d'une base propre : exécuter `supabase/schema.sql` puis
`supabase/seed.sql` dans l'éditeur SQL Supabase.
