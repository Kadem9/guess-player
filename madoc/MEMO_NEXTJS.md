# Mémo Rapide - Questions Next.js

## 1. Server vs Client Components
- **Server** : Par défaut, pas de hooks, accès BDD direct, meilleur SEO
- **Client** : `'use client'`, hooks OK, interactivité, APIs navigateur
- **Projet** : Pages = Server, Composants interactifs = Client
- **Exemple** : `GamePlay.tsx` = Client (useState, useEffect, Socket.io)

## 2. Routing Automatique
- **File-based routing** : Structure dossiers = routes
- `app/page.tsx` → `/`
- `app/game/[id]/page.tsx` → `/game/123`
- `app/api/games/route.ts` → `/api/games`
- **Pas besoin React Router** : Next.js gère automatiquement
- **Projet** : `app/game/[id]/play/page.tsx` → `/game/123/play`

## 3. Routes Dynamiques avec ID
- **Syntaxe** : Dossier `[param]` → route dynamique
- `app/mon-profil/[id]/page.tsx` → `/mon-profil/MONID`
- **Accès** : `params.id` dans le composant
- **Projet** : `app/game/[id]/page.tsx`, `params.id` = gameId
- **Routes API** : `app/api/games/[id]/route.ts`, `params.id` dans handler

## 4. SSR vs SSG
- **SSR** : Généré à chaque requête, données fraîches, plus lent
- **SSG** : Généré au build, très rapide, données au build
- **ISR** : SSG avec régénération périodique
- **Quand SSR** : Données dynamiques, contenu personnalisé, auth
- **Quand SSG** : Contenu statique, blog, docs, performance max
- **Projet** : Pages jeu = SSR (données dynamiques, auth)

## 5. Next.js sans Backend pour WebSocket
- **Réponse** : Non, pas recommandé
- **Pourquoi** : Next.js = HTTP, WebSocket = connexion persistante
- **Problèmes** : Serverless = stateless, WebSocket = stateful
- **Solution projet** : Serveur Node.js + Express séparé (port 3001)
- **Communication** : Next.js appelle backend Express via HTTP
- **Avantages** : Scalabilité, séparation responsabilités

## 6. Structure Dossiers Projet
- **Routes groupées** : `app/game/` = toutes routes jeu
- **Routes dynamiques** : `app/game/[id]/` = routes par ID partie
- **Composants séparés** : `components/game/` = logique réutilisable
- **Organisation** : Par fonctionnalité (game, auth, dashboard)
- **Structure** :
  ```
  app/game/[id]/
    ├── page.tsx (lobby)
    ├── play/page.tsx (jouer)
    └── results/page.tsx (résultats)
  ```

## 7. Socket.io sans Rechargement
- **Composant Client** : `'use client'` → s'exécute navigateur
- **State React** : `setGame(data.game)` → met à jour state
- **Re-render React** : React met à jour DOM uniquement
- **Pas de navigation** : Pas de `router.push()` → pas de rechargement
- **Flow** : Socket event → fetch API → setState → re-render React
- **Projet** : `GamePlay.tsx` lignes 279-329, `setGame()` sans navigation

## Points Clés Rapides
- ✅ Server = pas hooks, Client = `'use client'` + hooks
- ✅ Routing = structure fichiers automatique
- ✅ `[param]` = route dynamique
- ✅ SSR = dynamique, SSG = statique
- ✅ WebSocket = serveur dédié recommandé
- ✅ Structure = groupée par fonctionnalité
- ✅ Socket.io = setState → re-render React (pas rechargement)

