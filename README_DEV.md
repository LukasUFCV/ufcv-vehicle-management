# README_DEV

## Arbitrages MVP

- Authentification locale sécurisée prioritaire ; intégration Microsoft prévue mais non implémentée.
- Les scopes métier sont appliqués côté backend à partir des localisations, de l'attache et du lien hiérarchique.
- Le module de droits combine permissions de rôle et permissions directes utilisateur.
- Les pièces jointes sont stockées localement en développement via une abstraction réutilisable.
- Les impressions QR utilisent une page dédiée optimisée navigateur plutôt qu'un moteur PDF serveur.

## Règles de sécurité retenues

- Requêtes d'authentification limitées par IP.
- Session opaque avec expiration et révocation.
- Fichiers limités en taille et en MIME.
- Journalisation des connexions, résolutions de conflit, validations et changements sensibles.

## Périmètre priorisé

### P1

- authentification ;
- dashboard ;
- utilisateurs ;
- localisations ;
- véhicules ;
- réservations ;
- conflits ;
- permissions ;
- responsive ;
- thèmes.

### P2

- demandes ;
- informations ;
- commentaires ;
- QR codes ;
- kilométrage.

### P3

- notifications enrichies ;
- préparation Microsoft ;
- optimisations complémentaires.

## Stratégie de montée en charge

- pagination et index Prisma sur les listes structurantes ;
- invalidation de cache par TanStack Query côté front ;
- calculs de dashboard bornés et requêtes agrégées simples ;
- architecture compatible extraction future de workers et mails.

## Extensions prévues

- fournisseur d'identité Microsoft / Entra ;
- envoi d'e-mails transactionnels ;
- stockage objet externe ;
- workflow d'approbation plus fin par périmètre ;
- import automatisé des utilisateurs et localisations.

