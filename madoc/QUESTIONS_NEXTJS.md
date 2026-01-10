# Questions Next.js - Réponses Détaillées

## 1. Composant Server vs Client - Théorique

**Question :** Différence entre un composant server et un composant client dans Next.js, et qu'est-ce que ça change dans la façon de coder ?

### Réponse :

**Composant Server (par défaut dans Next.js 13+) :**
- S'exécute **uniquement côté serveur**
- Pas d'accès aux APIs du navigateur (localStorage, window, document, etc.)
- Pas de hooks React comme `useState`, `useEffect`
- Peut accéder directement à la base de données, fichiers, etc.
- Meilleur pour le SEO et les performances
- Pas de JavaScript envoyé au client (bundle plus petit)

**Composant Client :**
- S'exécute **côté client** (dans le navigateur)
- Accès aux APIs du navigateur
- Peut utiliser tous les hooks React (`useState`, `useEffect`, etc.)
- Nécessite la directive `'use client'` en haut du fichier
- JavaScript envoyé au client (bundle plus gros)
- Nécessaire pour l'interactivité

**Différences dans le code :**

```typescript
// ❌ COMPOSANT SERVER - Ne peut pas utiliser useState
export default function ServerComponent() {
  // ❌ Erreur : useState n'existe pas côté serveur
  const [count, setCount] = useState(0);
  
  // ✅ OK : Accès direct à la BDD
  const data = await prisma.game.findMany();
  
  return <div>{data.length}</div>;
}

// ✅ COMPOSANT CLIENT - Peut utiliser useState
'use client';

export default function ClientComponent() {
  // ✅ OK : useState fonctionne
  const [count, setCount] = useState(0);
  
  // ✅ OK : useEffect fonctionne
  useEffect(() => {
    console.log('Mounted');
  }, []);
  
  // ❌ Erreur : Pas d'accès direct à la BDD
  const data = await prisma.game.findMany(); // ❌
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Dans le projet :**
- **Composants Server** : Pages par défaut, routes API (`/api/*`)
- **Composants Client** : `GamePlay.tsx`, `GameLobby.tsx`, `LoginForm.tsx` (tous avec `'use client'`)

**Stratégie hybride :**
- Utiliser Server Components pour le rendu initial (SEO, performance)
- Utiliser Client Components pour l'interactivité (clics, formulaires, Socket.io)

**Exemple dans le projet :**
```typescript
// src/app/game/[id]/page.tsx (Server Component par défaut)
export default function GamePage({ params }: { params: { id: string } }) {
  // Peut faire des appels serveur ici
  return <GamePlay gameId={params.id} />; // Client Component
}

// src/components/game/GamePlay.tsx (Client Component)
'use client';
export function GamePlay({ gameId }: GamePlayProps) {
  // Peut utiliser useState, useEffect, Socket.io
  const [game, setGame] = useState<Game | null>(null);
}
```

---

## 2. Routing Automatique Next.js - Théorique

**Question :** Comment Next gère le routing automatiquement sans React Router ?

### Réponse :

**File-based Routing (Routing basé sur les fichiers) :**

Next.js utilise la structure de dossiers dans `app/` (Next.js 13+) ou `pages/` (ancienne version) pour créer automatiquement les routes.

**Règles de routing :**

1. **Fichier = Route** :
   - `app/page.tsx` → `/`
   - `app/about/page.tsx` → `/about`
   - `app/dashboard/page.tsx` → `/dashboard`

2. **Dossiers imbriqués = Routes imbriquées** :
   - `app/game/create/page.tsx` → `/game/create`
   - `app/game/join/page.tsx` → `/game/join`

3. **Routes dynamiques avec `[param]`** :
   - `app/game/[id]/page.tsx` → `/game/123`, `/game/abc`, etc.
   - Le paramètre est accessible via `params.id`

4. **Routes catch-all avec `[...param]`** :
   - `app/docs/[...slug]/page.tsx` → `/docs/a`, `/docs/a/b`, `/docs/a/b/c`

5. **Routes optionnelles avec `[[...param]]`** :
   - `app/shop/[[...slug]]/page.tsx` → `/shop` ET `/shop/category/product`

**Dans le projet :**
```
src/app/
  ├── page.tsx                    → /
  ├── login/page.tsx              → /login
  ├── register/page.tsx           → /register
  ├── dashboard/page.tsx          → /dashboard
  ├── game/
  │   ├── create/page.tsx        → /game/create
  │   ├── join/page.tsx          → /game/join
  │   └── [id]/
  │       ├── page.tsx           → /game/123 (lobby)
  │       ├── play/page.tsx      → /game/123/play
  │       └── results/page.tsx    → /game/123/results
```

**Avantages vs React Router :**
- ✅ Pas besoin de configurer les routes manuellement
- ✅ Structure claire et intuitive
- ✅ Code splitting automatique par route
- ✅ SEO-friendly (pré-rendu)
- ✅ Moins de code boilerplate

**Accès aux paramètres :**
```typescript
// app/game/[id]/page.tsx
export default function GamePage({ params }: { params: { id: string } }) {
  const gameId = params.id; // Récupère l'ID de l'URL
  return <GameLobby gameId={gameId} />;
}
```

**Routes API :**
- `app/api/games/route.ts` → `/api/games`
- `app/api/games/[id]/route.ts` → `/api/games/123`

---

## 3. Routes Dynamiques avec ID - Théorique

**Question :** Comment tu gères la gestion des pages avec un id, exemple mon-profil/MONID ?

### Réponse :

**Syntaxe : `[param]` dans le nom du dossier**

1. **Créer un dossier avec crochets** :
   ```
   app/mon-profil/[id]/page.tsx
   ```
   → Crée la route `/mon-profil/MONID`

2. **Accéder au paramètre dans le composant** :
   ```typescript
   // app/mon-profil/[id]/page.tsx
   export default function MonProfilPage({ 
     params 
   }: { 
     params: { id: string } 
   }) {
     const userId = params.id; // "MONID"
     
     // Utiliser l'ID pour charger les données
     const user = await fetchUser(userId);
     
     return <div>Profil de {user.name}</div>;
   }
   ```

3. **Routes imbriquées avec plusieurs paramètres** :
   ```
   app/user/[userId]/posts/[postId]/page.tsx
   ```
   → Route : `/user/123/posts/456`
   ```typescript
   export default function PostPage({ 
     params 
   }: { 
     params: { userId: string; postId: string } 
   }) {
     const { userId, postId } = params;
   }
   ```

**Dans le projet :**
```typescript
// src/app/game/[id]/page.tsx
export default function GamePage({ params }: { params: { id: string } }) {
  const gameId = params.id; // Récupère l'ID depuis l'URL
  
  return <GameLobby gameId={gameId} />;
}

// src/app/game/[id]/play/page.tsx
export default function GamePlayPage({ params }: { params: { id: string } }) {
  const gameId = params.id;
  
  return <GamePlay gameId={gameId} />;
}
```

**Routes API avec paramètres :**
```typescript
// src/app/api/games/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const gameId = params.id;
  // Utiliser gameId pour récupérer la partie
}
```

**Génération statique (SSG) avec paramètres :**
```typescript
// Générer les pages statiquement pour certains IDs
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
  ];
}
```

**Important :** Les paramètres sont toujours des strings. Si tu as besoin d'un nombre, il faut convertir : `parseInt(params.id)`

---

## 4. SSR vs SSG - Théorique

**Question :** Différence entre le rendu côté serveur (SSR) et le rendu statique (SSG) et dans quel cas on choisit l'un ou l'autre ?

### Réponse :

**SSR (Server-Side Rendering) :**
- Page générée **à chaque requête** côté serveur
- Contenu frais à chaque chargement
- Plus lent (génération à chaque requête)
- Utilise `getServerSideProps` (Pages Router) ou pas de cache (App Router)

**SSG (Static Site Generation) :**
- Page générée **au build time** (une seule fois)
- HTML statique pré-généré
- Très rapide (fichier statique)
- Utilise `getStaticProps` (Pages Router) ou `generateStaticParams` (App Router)

**ISR (Incremental Static Regeneration) :**
- SSG avec régénération périodique
- Meilleur des deux mondes : rapide + contenu frais

**Quand utiliser SSR :**
- ✅ Données qui changent très souvent (actualités, scores en direct)
- ✅ Contenu personnalisé par utilisateur (dashboard, profil)
- ✅ Données qui nécessitent authentification
- ✅ SEO moins critique (pages privées)

**Quand utiliser SSG :**
- ✅ Contenu qui change rarement (blog, documentation)
- ✅ Performance maximale requise
- ✅ SEO très important
- ✅ Pages publiques

**Dans Next.js 13+ (App Router) :**

**SSR (par défaut) :**
```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // Exécuté à chaque requête
  const products = await fetch('https://api.com/products');
  return <div>{products.map(...)}</div>;
}
```

**SSG :**
```typescript
// app/products/page.tsx
export const revalidate = 3600; // Régénère toutes les heures (ISR)

export default async function ProductsPage() {
  const products = await fetch('https://api.com/products', {
    cache: 'force-cache' // Cache statique
  });
  return <div>{products.map(...)}</div>;
}
```

**Dans le projet :**
- **SSR** : Pages de jeu (`/game/[id]`) car données dynamiques, authentification requise
- **SSG potentiel** : Page d'accueil (`/`) si contenu statique
- **Routes API** : Toujours exécutées à la demande (pas de pré-rendu)

**Résumé :**
| Critère | SSR | SSG |
|---------|-----|-----|
| Quand généré | À chaque requête | Au build |
| Performance | Plus lent | Plus rapide |
| Données fraîches | Toujours | Au build |
| SEO | Bon | Excellent |
| Utilisation | Données dynamiques | Contenu statique |

---

## 5. Next.js sans Backend pour WebSocket - Lié au Projet

**Question :** Est-ce qu'on peut utiliser Next.js sans backend pour les WebSocket ? Justifier.

### Réponse :

**Fichiers à montrer :**
- `backend/server.js` (serveur Node.js + Express pour Socket.io)
- `src/contexts/SocketContext.tsx` (connexion Socket.io côté client)

**Réponse courte :** **Non, pas vraiment.** Next.js peut techniquement gérer Socket.io, mais ce n'est **pas recommandé** pour plusieurs raisons.

**Pourquoi Next.js seul n'est pas idéal :**

1. **Next.js = Framework HTTP :**
   - Next.js est optimisé pour HTTP/HTTPS (requêtes/requêtes)
   - WebSocket nécessite une connexion **persistante** et **bidirectionnelle**
   - Next.js peut le faire, mais ce n'est pas son point fort

2. **Problèmes avec Socket.io dans Next.js API Routes :**
   ```typescript
   // ❌ Problématique dans app/api/socket/route.ts
   // - Connexions WebSocket ne se gèrent pas bien dans les API Routes
   // - Pas de persistance entre requêtes
   // - Difficile à scaler
   ```

3. **Architecture Serverless :**
   - Next.js peut être déployé en mode serverless (Vercel, etc.)
   - Les fonctions serverless sont **stateless** et **éphémères**
   - WebSocket nécessite un serveur **stateful** et **persistant**
   - Incompatibilité fondamentale

4. **Scalabilité :**
   - Avec un serveur dédié, on peut scaler Socket.io indépendamment
   - Avec Next.js seul, difficile de gérer plusieurs instances

**Solution dans le projet :**

On utilise **deux serveurs séparés** :

1. **Next.js (port 3000)** :
   - Gère les pages et routes API REST
   - Peut être déployé en serverless
   - Optimisé pour HTTP

2. **Node.js + Express (port 3001)** :
   - Serveur dédié pour Socket.io
   - Connexions WebSocket persistantes
   - Peut scaler indépendamment

**Communication entre les deux :**
```typescript
// Next.js appelle le backend Express pour émettre des événements
// src/app/api/games/[id]/start/route.ts
const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
await fetch(`${socketUrl}/emit/game-started`, {
  method: 'POST',
  body: JSON.stringify({ gameId: game.id }),
});
```

**Alternatives possibles (mais moins optimales) :**

1. **Socket.io dans Next.js API Route** :
   - Techniquement possible mais complexe
   - Problèmes de scalabilité
   - Pas recommandé

2. **Services externes** :
   - Pusher, Ably, etc. (payants)
   - Plus simple mais coût supplémentaire

3. **Next.js avec serveur personnalisé** :
   - Possible mais perd les avantages serverless
   - Complexité accrue

**Conclusion :** Pour WebSocket en production, mieux vaut un serveur dédié (comme dans le projet) ou un service externe. Next.js seul n'est pas adapté.

---

## 6. Structure Dossiers Next.js - Lié au Projet

**Question :** Comment tu as utilisé la structure en dossiers de Next.js pour séparer les pages du jeu en gardant le projet lisible ?

### Réponse :

**Fichiers à montrer :**
- Structure `src/app/game/`
- Structure `src/components/game/`

**Structure du projet :**

```
src/app/
  ├── page.tsx                    # Page d'accueil (/)
  ├── login/page.tsx              # Connexion (/login)
  ├── register/page.tsx           # Inscription (/register)
  ├── dashboard/page.tsx         # Tableau de bord (/dashboard)
  ├── game/                       # Routes du jeu
  │   ├── create/page.tsx        # Créer partie (/game/create)
  │   ├── join/page.tsx          # Rejoindre partie (/game/join)
  │   └── [id]/                   # Routes dynamiques par ID
  │       ├── page.tsx           # Lobby (/game/123)
  │       ├── play/page.tsx      # Jouer (/game/123/play)
  │       └── results/page.tsx    # Résultats (/game/123/results)
  └── api/                        # Routes API
      ├── games/
      │   ├── create/route.ts
      │   ├── join/route.ts
      │   └── [id]/
      │       ├── route.ts
      │       ├── start/route.ts
      │       ├── turn/route.ts
      │       └── score/route.ts

src/components/
  ├── game/                       # Composants liés au jeu
  │   ├── GameLobby.tsx          # Composant lobby
  │   ├── GamePlay.tsx            # Composant gameplay
  │   ├── GameResults.tsx         # Composant résultats
  │   ├── CreateGame.tsx          # Composant création
  │   └── JoinGame.tsx            # Composant rejoindre
  ├── auth/                       # Composants authentification
  ├── dashboard/                  # Composants dashboard
  └── ui/                         # Composants UI réutilisables
```

**Organisation par fonctionnalité :**

1. **Routes groupées par domaine** :
   - Toutes les routes du jeu dans `app/game/`
   - Routes API dans `app/api/games/`
   - Cohérence dans la structure

2. **Routes dynamiques avec `[id]`** :
   - `app/game/[id]/` regroupe toutes les pages d'une partie
   - `/game/123` → lobby
   - `/game/123/play` → jouer
   - `/game/123/results` → résultats
   - Logique et clarté

3. **Composants séparés des pages** :
   - Pages dans `app/` (routing)
   - Composants dans `components/` (logique réutilisable)
   - Séparation des responsabilités

4. **Composants groupés par fonctionnalité** :
   - `components/game/` : tous les composants du jeu
   - `components/auth/` : composants d'authentification
   - Facile à trouver et maintenir

**Avantages de cette structure :**

✅ **Lisibilité** : Structure claire et intuitive
✅ **Maintenabilité** : Facile de trouver les fichiers
✅ **Scalabilité** : Facile d'ajouter de nouvelles routes/composants
✅ **Cohérence** : Même pattern pour toutes les fonctionnalités
✅ **Séparation** : Pages (routing) vs Composants (logique)

**Exemple d'utilisation :**
```typescript
// app/game/[id]/play/page.tsx (Page - routing)
export default function GamePlayPage({ params }: { params: { id: string } }) {
  return <GamePlay gameId={params.id} />; // Composant réutilisable
}

// components/game/GamePlay.tsx (Composant - logique)
'use client';
export function GamePlay({ gameId }: GamePlayProps) {
  // Toute la logique du jeu
}
```

**Convention de nommage :**
- Pages : `page.tsx` (obligatoire pour Next.js)
- Composants : `PascalCase.tsx`
- Routes API : `route.ts`

---

## 7. Socket.io sans Rechargement Page - Lié au Projet

**Question :** Quand tu mets à jour l'état d'une partie avec Socket.io, comment tu fais pour que Next.js ne recharge pas toute la page ?

### Réponse :

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 279-329)
- `src/contexts/SocketContext.tsx`

**Réponse :**

Next.js **ne recharge pas la page** automatiquement. C'est React qui gère les mises à jour via le state.

**Comment ça fonctionne :**

1. **Composant Client avec `'use client'`** :
   ```typescript
   'use client'; // Indique que c'est un composant client
   export function GamePlay({ gameId }: GamePlayProps) {
     const [game, setGame] = useState<Game | null>(null);
   }
   ```
   - Le composant s'exécute côté client
   - React gère les mises à jour du DOM
   - Pas de rechargement de page

2. **Écoute des événements Socket.io** (lignes 279-329) :
   ```typescript
   useEffect(() => {
     if (!socket || !game) return;
     
     const handleGameUpdated = ({ gameId: updatedGameId }: { gameId: string }) => {
       if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
         // Recharger les données depuis l'API
         fetch(`/api/games/${gameId}`, { credentials: 'include' })
           .then(res => res.json())
           .then(data => {
             if (data.game) {
               setGame(data.game); // ← Mise à jour du state
             }
           });
       }
     };
     
     socket.on('game-updated', handleGameUpdated);
     
     return () => {
       socket.off('game-updated', handleGameUpdated); // Cleanup
     };
   }, [socket, game?.id, gameId]);
   ```

3. **Mise à jour du state, pas de rechargement** :
   - `setGame(data.game)` met à jour le state React
   - React détecte le changement de state
   - React **re-rend uniquement les composants affectés**
   - **Pas de rechargement de page HTML**

**Flow complet :**

```
1. Événement Socket.io reçu
   ↓
2. fetch('/api/games/${gameId}') → Récupère nouvelles données
   ↓
3. setGame(data.game) → Met à jour le state React
   ↓
4. React détecte changement de state
   ↓
5. React re-rend uniquement les composants qui utilisent `game`
   ↓
6. DOM mis à jour (pas de rechargement page)
```

**Pourquoi pas de rechargement ?**

- ✅ **Composant Client** : S'exécute dans le navigateur, pas de navigation
- ✅ **State React** : Mise à jour locale du state, pas de navigation
- ✅ **Pas de `router.push()`** : On ne change pas de route, on met juste à jour les données
- ✅ **Re-render React** : React met à jour uniquement ce qui a changé

**Comparaison :**

```typescript
// ❌ Rechargerait la page (navigation)
router.push(`/game/${gameId}`); // Change de route → rechargement

// ✅ Ne recharge pas (mise à jour state)
setGame(newGameData); // Met à jour state → re-render React uniquement
```

**Dans le projet :**

- **Mise à jour normale** : `setGame(data.game)` → Re-render React uniquement
- **Changement de route** : `router.push('/game/123/results')` → Navigation (rechargement)
- **Socket.io** : Émet événements → fetch API → setState → Re-render React

**Optimisations possibles :**

1. **useMemo** : Mémoriser les calculs coûteux
2. **useCallback** : Mémoriser les fonctions
3. **React.memo** : Éviter les re-renders inutiles

**Important :** Next.js ne fait rien de spécial ici. C'est React qui gère les mises à jour. Next.js fournit juste le routing et le framework. Les composants clients fonctionnent comme n'importe quelle app React.

---

## Points Clés à Retenir

### Server vs Client Components
- Server = par défaut, pas de hooks, accès BDD
- Client = `'use client'`, hooks OK, interactivité

### Routing Next.js
- File-based routing automatique
- `[param]` pour routes dynamiques
- Structure = Routes

### SSR vs SSG
- SSR = à chaque requête (données fraîches)
- SSG = au build (performance max)
- Choisir selon besoins

### WebSocket avec Next.js
- Next.js seul = pas idéal
- Serveur dédié = meilleure solution
- Architecture séparée recommandée

### Structure Projet
- Routes groupées par fonctionnalité
- Composants séparés des pages
- Organisation claire et maintenable

### Socket.io sans Rechargement
- Composant Client + State React
- setState → Re-render React uniquement
- Pas de navigation = pas de rechargement

