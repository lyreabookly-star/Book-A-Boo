# Audit Supabase — 22 novembre 2026

Projet inspecté : `jkczojrtmgahxbaacbeg` (BooklyStar).
Nature du contrôle : lecture seule. Aucune donnée, politique, table ou migration n'a été modifiée pendant cet audit.

## État observé

- 24 tables dans le schéma `public`.
- RLS activé sur les 24 tables.
- 63 politiques RLS dans `public`.
- 5 déclencheurs applicatifs dans `public`.
- 72 index dans `public`.
- Deux buckets Storage publics : `avatars` et `book-covers`.
- Les deux buckets acceptent JPEG, PNG et WebP, avec une limite de 5 Mio par fichier.
- Les politiques Storage permettent la lecture publique des avatars/couvertures et limitent les écritures, mises à jour et suppressions au dossier utilisateur correspondant à `auth.uid()`.

## Contrôles positifs observés

- Les profils privés (`profile_private`) ont des politiques limitées au propriétaire.
- Les paramètres, préférences de lecture et progression de lecture sont limités au propriétaire.
- Les notifications sont lisibles et modifiables par leur destinataire.
- Les auteurs ne gèrent que leurs propres histoires et chapitres.
- Les signalements et actions de modération sont réservés aux administrateurs de plateforme.
- La fonction `private.is_platform_admin()` est SECURITY DEFINER et fixe un `search_path` vide ; elle vérifie l'identifiant courant avec `auth.uid()`.
- Les fonctions de notification observées sont SECURITY DEFINER et fixent également un `search_path` vide.

## Points à vérifier avant toute correction

1. L'historique Supabase contient 23 versions de migration, tandis que le dépôt contient actuellement 14 fichiers SQL. Les noms/versions ne correspondent pas un à un ; certains fichiers du dépôt regroupent plusieurs évolutions. Ne pas rejouer ces migrations sur la base existante.
2. Les deux buckets sont publics : cela convient à l'affichage public des couvertures et avatars, mais implique que les fichiers téléversés ne sont pas privés. Confirmer que c'est bien le comportement voulu.
3. Les règles de lecture publique des profils reposent sur `profiles.is_public`; les données privées séparées dans `profile_private` ne sont pas publiquement lisibles selon les politiques inspectées.
4. Les règles RLS ont été examinées statiquement. Les parcours réels avec des comptes anonymes, utilisateurs, auteurs, membres éditoriaux et administrateurs n'ont pas encore été testés de bout en bout.
5. Les fonctions, privilèges SQL, extensions, contraintes et sauvegardes doivent encore faire l'objet d'un contrôle complémentaire avant de déclarer l'audit complet.

## Prochaine étape sûre

Créer une référence de schéma à partir de l'état réel de la base et réconcilier l'historique Git avec les 23 versions déjà appliquées, sans modifier la base de production. Toute correction SQL devra être une nouvelle migration, limitée, relue et testée avant application.
