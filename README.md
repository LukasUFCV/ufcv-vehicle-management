# RSVéhicule

RSVéhicule est un MVP applicatif complet de gestion de flotte automobile pour l'UFCV. Le projet remplace la réservation sur Excel par une application web sécurisée, multi-utilisateur, responsive et structurée pour évoluer vers une intégration Microsoft Entra ID / Graph plus tard.

## Architecture retenue

- `frontend/` : React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS.
- `backend/` : Node.js, Express, TypeScript, Prisma, Zod, cookies de session HttpOnly, QR codes côté serveur.
- `MariaDB/MySQL` : schéma relationnel normalisé, compatible exploitation HeidiSQL.
- `npm workspaces` : scripts centralisés, séparation claire front/back, exécution simple en local.

## Principes d'architecture

- Authentification locale sécurisée via sessions opaques stockées en base.
- Couche d'identité isolée pour accueillir plus tard un fournisseur Microsoft sans refonte.
- RBAC + scopes métier pilotés depuis la base.
- Filtrage backend systématique sur les utilisateurs, véhicules, réservations et workflows.
- Gestion de fichiers abstraite avec stockage local en développement.
- Interface entièrement en français, thème clair/sombre/auto, responsive mobile.

## Modules livrés

- Authentification, mot de passe oublié, session, profil personnel.
- Tableau de bord métier.
- Utilisateurs, localisations hiérarchiques, véhicules.
- Réservations, demandes de réservation, conflits.
- Informations utilisateur et véhicule.
- Commentaires véhicule.
- Historique kilométrique.
- Permissions et matrice de droits.
- Notifications in-app.
- QR codes véhicule et écran d'impression.

## Arborescence

```text
.
|-- backend
|   |-- prisma
|   |-- src
|   |-- tests
|-- frontend
|   |-- public
|   |-- src
|   |-- tests
|-- .env.example
|-- README.md
|-- README_DEV.md
|-- docker-compose.yml
`-- package.json
```

## Prérequis

- Node.js 22+ ou 24+
- npm 10+
- MariaDB 11+ ou MySQL 8+

## Démarrage local

1. Copier les variables d'environnement :
   - copier la section backend de `.env.example` vers `backend/.env`
   - copier la section frontend de `.env.example` vers `frontend/.env.local`
2. Installer les dépendances :

```bash
npm install
```

3. Générer Prisma, migrer et injecter les données de démonstration :

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Démarrer le front et l'API :

```bash
npm run dev
```

5. Ouvrir :
   - application : [http://localhost:5173](http://localhost:5173)
   - API : [http://localhost:4000/api/health](http://localhost:4000/api/health)

## Comptes de démonstration

Les identifiants exacts sont injectés par le seed via les variables d'environnement.

- Administrateur : `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- Comptes de démonstration : mot de passe `SEED_DEMO_PASSWORD`

## Docker

Le projet peut être lancé avec Docker Compose :

```bash
docker compose up --build
```

Services exposés :

- `frontend` : `http://localhost:5173`
- `backend` : `http://localhost:4000`
- `db` : `localhost:3306`

## Sécurité

- cookie technique HttpOnly `SameSite=Lax`, sans tracking ;
- mots de passe hachés avec Argon2 ;
- rate limiting sur les routes sensibles ;
- validation Zod sur les entrées ;
- headers de sécurité via Helmet ;
- contrôle d'accès backend par permissions et scopes ;
- journal d'audit pour actions sensibles ;
- téléchargements et pièces jointes protégés.

## Tests

```bash
npm run test
npm run test:api
npm run test:e2e
```

## Choix de conception

- Sessions opaques en base plutôt qu'un JWT persistant : révocation simple, meilleure maîtrise métier, compatibilité future avec plusieurs fournisseurs d'identité.
- Prisma + MariaDB : lisibilité, robustesse et cohérence avec un usage HeidiSQL.
- Front séparé de l'API : maintenabilité, tests facilités, future ouverture à d'autres clients.

## Intégration Microsoft future

Le projet est préparé pour :

- stocker un identifiant externe ;
- gérer plusieurs `authProvider` ;
- brancher un provider d'identité Microsoft dans `backend/src/auth/providers/` ;
- enrichir ultérieurement la synchronisation utilisateur via Graph.

Les arbitrages détaillés du MVP sont documentés dans `README_DEV.md`.

