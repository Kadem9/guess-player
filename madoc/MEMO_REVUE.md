# Mémo Rapide - Révision de Code

## 1. Timer
- **Fichiers** : `GamePlay.tsx` (lignes 332-382), `useTimerSound.ts`
- **Comment** : 3 `useEffect` séparés (reset, décompte, son)
- **Sync** : Pas de sync entre joueurs, chaque client gère son timer local
- **Décompte** : `setTimeout` toutes les secondes, décrémente `timeLeft`
- **Alerte** : Son à 10 secondes via `useTimerSound`
- **Expiration** : Affiche résultat "Temps écoulé" et passe au suivant après 3s

## 2. Passage Joueurs
- **Fichiers** : `GamePlay.tsx` (lignes 192-196, 217-254), `api/games/[id]/turn/route.ts`
- **Détermination** : `currentTurn % players.length` (ligne 194)
- **Passage** : `handleNextPlayer()` (ligne 217)
  - Incrémente `currentTurn`
  - Appelle API `/api/games/[id]/turn` pour update BDD
  - Émet `turn-changed` via Socket.io
  - Recharge données partie
- **Auto** : Passage automatique après 3s d'affichage résultat

## 3. Sync Temps Réel
- **Fichiers** : `backend/socket/gameSocket.js`, `GamePlay.tsx` (lignes 268-329), `SocketContext.tsx`, `backend/server.js`
- **Tech** : Socket.io (serveur Node.js + Express séparé port 3001)
- **Rooms** : Chaque partie = room `game:${gameId}`
- **Events** : `turn-updated`, `game-updated`, `game-finished`
- **Flow** : Event Socket → Recharge depuis API REST
- **Pourquoi** : Socket.io pr notifications, API REST = source de vérité

## 4. Réponse Joueur
- **Fichiers** : `GamePlay.tsx` (lignes 398-439), `gameUtils.ts` (checkAnswer), `api/games/[id]/score/route.ts`, `api/players/[name]/photo/route.ts`
- **Vérif** : Côté client avec `checkAnswer()` (insensible casse/accents)
- **Score** : Si correct → API `/api/games/[id]/score` pour update BDD (API ne fait QUE la BDD, pas Socket.io)
- **Event** : APRÈS l'API, côté client émet `answer-submitted` via Socket.io
- **Photo** : Récupère photo joueur après réponse
- **Passage** : Auto après 3s ou bouton manuel

## 5. Architecture
- **Fichiers** : `backend/server.js`, `backend/socket/gameSocket.js`, `backend/routes/emitRoutes.js`, `api/games/[id]/start/route.ts` (exemple)
- **Frontend** : Next.js (port 3000) - Pages + API REST + Prisma
- **Backend** : Node.js + Express (port 3001) - Socket.io uniquement
- **BDD** : PostgreSQL via Prisma
- **Pourquoi séparé** : Socket.io nécessite serveur WebSocket persistant, meilleure scalabilité

## 6. Cas Limites
- **Fichiers** : `GamePlay.tsx` (lignes 73-90, 97-126, 358-365), `api/games/[id]/forfeit/route.ts`, `api/games/[id]/question/route.ts` (lignes 100-114)
- **Forfait** : API `/api/games/[id]/forfeit` → retire joueur → termine partie si dernier
- **Fermeture onglet** : `beforeunload` avec avertissement
- **Timer expire** : Auto résultat "Temps écoulé" → passage auto
- **Plus de joueurs** : Partie se termine auto si tous joueurs utilisés

## Points Clés à Retenir
- ✅ Timer = client uniquement, pas sync
- ✅ Socket.io = notifications, API REST = données
- ✅ Vérif réponse = client, score = serveur
- ✅ Normalisation gameId en minuscules partout
- ✅ Support codes courts (8 premiers caractères)
- ✅ Auth vérifiée sur toutes routes API
- ✅ Modulo pour rotation joueurs

## Fichiers Importants (Récap)
- **Frontend** : `src/components/game/GamePlay.tsx` (logique jeu principale)
- **Socket** : `backend/socket/gameSocket.js` (handlers Socket.io)
- **Routes Socket** : `backend/routes/emitRoutes.js` (routes HTTP pr émettre events)
- **API Routes** : `src/app/api/games/*` (CRUD parties)
- **Utils** : `src/utils/gameUtils.ts` (checkAnswer, filtres joueurs)
- **Context** : `src/contexts/SocketContext.tsx` (connexion Socket.io)

