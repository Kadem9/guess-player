# Questions WebSocket & Socket.io - Réponses Détaillées

## 1. HTTP vs WebSocket - Théorique

**Question :** Différence entre HTTP et un WebSocket ? Et en quoi un WebSocket est plus adapté pour un jeu temps réel ?

### Réponse :

**HTTP (HyperText Transfer Protocol) :**
- **Modèle** : Requête/Réponse (Request/Response)
- **Connexion** : **Stateless** - chaque requête = nouvelle connexion
- **Direction** : **Unidirectionnel** - client demande, serveur répond
- **Persistance** : Connexion fermée après chaque requête
- **Overhead** : Headers HTTP à chaque requête (plus lourd)
- **Utilisation** : Pages web, APIs REST, téléchargements

**WebSocket :**
- **Modèle** : Connexion **persistante** et **bidirectionnelle**
- **Connexion** : **Stateful** - connexion maintenue ouverte
- **Direction** : **Bidirectionnel** - client ET serveur peuvent envoyer des messages
- **Persistance** : Connexion reste ouverte tant que nécessaire
- **Overhead** : Headers minimaux après handshake initial
- **Utilisation** : Chat en temps réel, jeux multi-joueurs, notifications push

**Comparaison visuelle :**

```
HTTP (Requête/Réponse) :
Client → [Requête] → Serveur
Client ← [Réponse] ← Serveur
[Connexion fermée]
Client → [Nouvelle requête] → Serveur
...

WebSocket (Connexion persistante) :
Client ←→ [Connexion ouverte] ←→ Serveur
Client → [Message] → Serveur
Serveur → [Message] → Client
Serveur → [Message] → Client
[Connexion reste ouverte]
```

**Pourquoi WebSocket pour jeu temps réel ?**

1. **Latence réduite** :
   - HTTP : Handshake à chaque requête (3 allers-retours)
   - WebSocket : Handshake une seule fois, puis messages directs
   - **Résultat** : Réactivité instantanée

2. **Communication bidirectionnelle** :
   - HTTP : Client doit "poll" (demander régulièrement) pour avoir des updates
   - WebSocket : Serveur peut pousser des updates immédiatement
   - **Résultat** : Pas besoin de rafraîchir constamment

3. **Efficacité** :
   - HTTP : Headers complets à chaque requête (~800 bytes)
   - WebSocket : Messages légers (~2-14 bytes d'overhead)
   - **Résultat** : Moins de bande passante, plus rapide

4. **État de connexion** :
   - HTTP : Pas de mémoire de l'état entre requêtes
   - WebSocket : Connexion maintenue, état partagé possible
   - **Résultat** : Meilleure gestion des sessions

**Exemple concret dans un jeu :**

```
HTTP (Polling) :
- Client demande l'état du jeu toutes les secondes
- Latence : 1-2 secondes minimum
- Bande passante : Énorme (requêtes constantes)
- Expérience : Lag, pas fluide

WebSocket :
- Client connecté une fois
- Serveur envoie updates instantanément quand quelque chose change
- Latence : < 100ms
- Bande passante : Minimale (seulement les changements)
- Expérience : Fluide, temps réel
```

**Dans le projet :**
- **HTTP** : Routes API REST pour CRUD (créer partie, rejoindre, etc.)
- **WebSocket (Socket.io)** : Synchronisation temps réel (changement de tour, scores, etc.)

---

## 2. Événements Socket.io - Théorique

**Question :** C'est quoi un événement dans Socket.io, et comment on en crée un ?

### Réponse :

**Événement Socket.io = Message nommé**

Un événement est un **message avec un nom** qui permet de communiquer entre client et serveur. C'est comme des "canaux" de communication.

**Créer et utiliser un événement :**

**1. Côté Serveur (émettre) :**
```javascript
// backend/socket/gameSocket.js
io.to(`game:${gameId}`).emit('game-updated', { gameId: gameId });
//                    ↑ nom événement    ↑ données
```

**2. Côté Serveur (écouter) :**
```javascript
socket.on('turn-changed', ({ gameId, turn }) => {
  // Code exécuté quand l'événement 'turn-changed' est reçu
  io.to(`game:${gameId}`).emit('turn-updated', { gameId, turn });
});
```

**3. Côté Client (émettre) :**
```typescript
// src/contexts/SocketContext.tsx
socket.emit('answer-submitted', { 
  gameId: normalizedGameId, 
  playerId, 
  isCorrect 
});
```

**4. Côté Client (écouter) :**
```typescript
// src/components/game/GamePlay.tsx
socket.on('game-updated', handleGameUpdated);
socket.on('turn-updated', handleTurnUpdated);
socket.on('game-finished', handleGameFinished);
```

**Structure d'un événement :**

```javascript
socket.emit('nom-evenement', données);
//         ↑                ↑
//      Identifiant    Payload (objet, string, etc.)
```

**Événements dans le projet :**

**Côté serveur (backend/socket/gameSocket.js) :**
- `join-game` : Client rejoint une partie
- `leave-game` : Client quitte une partie
- `start-game` : Démarrer une partie
- `answer-submitted` : Réponse soumise
- `turn-changed` : Changement de tour
- `player-forfeit` : Forfait d'un joueur
- `game-ended` : Partie terminée

**Événements émis par le serveur :**
- `game-started` : Partie démarrée
- `game-updated` : Partie mise à jour
- `turn-updated` : Tour mis à jour
- `game-finished` : Partie terminée

**Bonnes pratiques :**
- ✅ Noms d'événements clairs et descriptifs
- ✅ Utiliser des objets pour les données (pas de primitives multiples)
- ✅ Normaliser les IDs (minuscules, etc.)
- ✅ Nettoyer les listeners (socket.off) dans le cleanup

**Exemple complet dans le projet :**

```javascript
// 1. Client émet un événement
emitTurnChanged(gameId, nextTurn);
// → socket.emit('turn-changed', { gameId, turn })

// 2. Serveur reçoit l'événement
socket.on('turn-changed', ({ gameId, turn }) => {
  // 3. Serveur émet à tous dans la room
  io.to(`game:${gameId}`).emit('turn-updated', { gameId, turn });
});

// 4. Tous les clients dans la room reçoivent l'événement
socket.on('turn-updated', handleTurnUpdated);
```

---

## 3. Rooms Socket.io - Théorique

**Question :** À quoi servent les rooms, et donne un cas où c'est utile dans une application multi-joueurs ?

### Réponse :

**Room = Groupe de connexions Socket.io**

Une room permet de **grouper des clients** et d'envoyer des messages à tous les clients d'un groupe spécifique, sans envoyer à tous les clients connectés.

**Fonctionnement :**

```javascript
// Client rejoint une room
socket.join('room-name');

// Serveur envoie à tous dans la room
io.to('room-name').emit('event', data);

// Client quitte une room
socket.leave('room-name');
```

**Cas d'usage : Application multi-joueurs**

**Sans rooms (broadcast global) :**
```javascript
// ❌ Envoie à TOUS les clients connectés
io.emit('game-updated', data);
// Problème : Tous les joueurs de toutes les parties reçoivent le message
```

**Avec rooms (broadcast ciblé) :**
```javascript
// ✅ Envoie seulement aux clients dans la room
io.to(`game:${gameId}`).emit('game-updated', data);
// Problème résolu : Seulement les joueurs de cette partie reçoivent le message
```

**Exemple concret : Jeu multi-joueurs**

**Scénario :** 100 joueurs, 10 parties de 10 joueurs chacune

**Sans rooms :**
- Joueur A dans partie 1 fait une action
- Tous les 100 joueurs reçoivent l'événement
- 90 joueurs reçoivent un message inutile
- Bande passante gaspillée

**Avec rooms :**
- Joueur A dans partie 1 fait une action
- Seulement les 10 joueurs de la partie 1 reçoivent l'événement
- 90 joueurs ne reçoivent rien (normal)
- Bande passante optimisée

**Dans le projet :**

```javascript
// backend/socket/gameSocket.js

// 1. Client rejoint la room de sa partie
socket.on('join-game', (gameId) => {
  const normalizedGameId = normalizeGameId(gameId);
  socket.join(`game:${normalizedGameId}`); // Rejoint room spécifique
});

// 2. Serveur envoie seulement aux joueurs de cette partie
socket.on('turn-changed', ({ gameId, turn }) => {
  const normalizedGameId = normalizeGameId(gameId);
  io.to(`game:${normalizedGameId}`).emit('turn-updated', { gameId, turn });
  // ↑ Envoie seulement à la room de cette partie
});
```

**Avantages des rooms :**
- ✅ **Isolation** : Chaque partie est isolée
- ✅ **Performance** : Moins de messages inutiles
- ✅ **Sécurité** : Joueurs ne voient que leur partie
- ✅ **Scalabilité** : Facile de gérer plusieurs parties simultanées

**Autres cas d'usage :**
- Chat par salle (Discord, Slack)
- Streaming par canal (Twitch)
- Collaboration par document (Google Docs)
- Notifications par groupe d'utilisateurs

---

## 4. emit vs broadcast vs emit.to - Théorique

**Question :** Quelle différence entre emit, broadcast et emit.to ?

### Réponse :

**1. `socket.emit()` :**
- Envoie un événement **au client qui a émis** (soi-même)
- Utilisé côté serveur pour répondre au client qui a envoyé la requête

```javascript
// Serveur répond au client qui a fait la requête
socket.on('join-game', (gameId) => {
  socket.join(`game:${gameId}`);
  socket.emit('joined', { success: true }); // Répond seulement à ce client
});
```

**2. `socket.broadcast.emit()` :**
- Envoie un événement à **tous les autres clients** (sauf l'émetteur)
- Utilisé pour notifier les autres sans notifier soi-même

```javascript
// Client A envoie un message
socket.on('send-message', (message) => {
  // Envoie à tous SAUF client A
  socket.broadcast.emit('new-message', message);
});
```

**3. `io.to(room).emit()` :**
- Envoie un événement à **tous les clients dans une room spécifique**
- Utilisé pour envoyer à un groupe ciblé

```javascript
// Envoie à tous les clients dans la room 'game:123'
io.to('game:123').emit('game-updated', data);
```

**4. `io.emit()` :**
- Envoie un événement à **tous les clients connectés**
- Utilisé pour les annonces globales

```javascript
// Envoie à TOUS les clients (toutes les parties)
io.emit('server-maintenance', { message: 'Maintenance in 5 minutes' });
```

**Comparaison visuelle :**

```
10 clients connectés, 3 dans room 'game:123', Client A émet un événement

socket.emit() :
  → Client A seulement

socket.broadcast.emit() :
  → Clients B, C, D, E, F, G, H, I, J (tous sauf A)

io.to('game:123').emit() :
  → Clients dans room 'game:123' seulement (A, B, C si dans la room)

io.emit() :
  → Tous les clients (A, B, C, D, E, F, G, H, I, J)
```

**Dans le projet :**

```javascript
// backend/socket/gameSocket.js

// 1. Répondre au client qui a fait la requête (rare dans le projet)
socket.emit('response', data);

// 2. Notifier tous les autres dans la partie (non utilisé dans le projet)
socket.broadcast.to(`game:${gameId}`).emit('player-joined', data);

// 3. Notifier tous dans la room (UTILISÉ dans le projet)
io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId });
// ↑ Utilisé pour synchroniser tous les joueurs d'une partie

// 4. Annonce globale (non utilisé dans le projet)
io.emit('global-announcement', data);
```

**Quand utiliser quoi :**

| Méthode | Quand utiliser |
|---------|----------------|
| `socket.emit()` | Répondre au client qui a fait la requête |
| `socket.broadcast.emit()` | Notifier les autres (pas soi-même) |
| `io.to(room).emit()` | Notifier un groupe spécifique (PARTIES) |
| `io.emit()` | Annonce globale à tous |

**Dans le projet, on utilise principalement `io.to(room).emit()`** pour synchroniser les joueurs d'une même partie.

---

## 5. Synchronisation Changement de Tour - Lié au Projet

**Question :** Comment tu synchronises le changement de tour entre les joueurs ?

### Réponse :

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 217-254 pour handleNextPlayer)
- `src/app/api/games/[id]/turn/route.ts` (mise à jour BDD)
- `backend/socket/gameSocket.js` (lignes 32-36 pour turn-changed)
- `src/components/game/GamePlay.tsx` (lignes 300-312 pour écoute turn-updated)

**Flow complet :**

**1. Joueur termine son tour (Client) :**
```typescript
// src/components/game/GamePlay.tsx - handleNextPlayer()
const handleNextPlayer = async () => {
  const nextTurn = game.currentTurn + 1;
  
  // 1. Mettre à jour en base de données
  await fetch(`/api/games/${gameId}/turn`, {
    method: 'POST',
    body: JSON.stringify({ turn: nextTurn }),
  });
  
  // 2. Émettre événement Socket.io
  emitTurnChanged(gameId, nextTurn);
  // → socket.emit('turn-changed', { gameId, turn: nextTurn })
  
  // 3. Recharger les données localement
  await fetchGame();
};
```

**2. Serveur reçoit l'événement :**
```javascript
// backend/socket/gameSocket.js
socket.on('turn-changed', ({ gameId, turn }) => {
  const normalizedGameId = normalizeGameId(gameId);
  
  // 3. Diffuser à tous les joueurs de la partie
  io.to(`game:${normalizedGameId}`).emit('turn-updated', { 
    gameId: normalizedGameId, 
    turn 
  });
});
```

**3. Tous les clients reçoivent l'événement :**
```typescript
// src/components/game/GamePlay.tsx
socket.on('turn-updated', ({ gameId: updatedGameId }) => {
  if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
    // Recharger les données depuis l'API
    fetch(`/api/games/${gameId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.game) {
          setGame(data.game); // ← Mise à jour du state
          // → Re-render avec nouveau currentTurn
        }
      });
  }
});
```

**4. Mise à jour en base de données :**
```typescript
// src/app/api/games/[id]/turn/route.ts
const updatedGame = await prisma.game.update({
  where: { id: game.id },
  data: { currentTurn: turn }, // ← Source de vérité
});
```

**Synchronisation en 4 étapes :**

1. **Client A** : Met à jour BDD + émet événement Socket
2. **Serveur** : Reçoit événement + diffuse à la room
3. **Tous les clients** : Reçoivent événement + rechargent depuis API
4. **BDD** : Source de vérité, tous synchronisés

**Pourquoi cette approche :**
- ✅ **BDD = Source de vérité** : Garantit la cohérence
- ✅ **Socket.io = Notification** : Alerte les clients rapidement
- ✅ **Rechargement API** : S'assure que tout le monde a les bonnes données
- ✅ **Room spécifique** : Seulement les joueurs de la partie sont notifiés

**Résultat :** Tous les joueurs voient le changement de tour en temps réel (< 100ms de latence).

---

## 6. Salon par Partie - Lié au Projet

**Question :** Comment tu fais pour que chaque partie ait un propre salon ?

### Réponse :

**Fichiers à montrer :**
- `backend/socket/gameSocket.js` (lignes 9-12 pour join-game)
- `src/contexts/SocketContext.tsx` (lignes 24-29 pour joinGame)
- `src/components/game/GamePlay.tsx` (lignes 268-276 pour rejoindre room)

**Mécanisme : Rooms avec ID de partie**

**1. Nom de room = ID de partie :**
```javascript
// backend/socket/gameSocket.js
socket.on('join-game', (gameId) => {
  const normalizedGameId = normalizeGameId(gameId);
  socket.join(`game:${normalizedGameId}`); // ← Room unique par partie
  // Exemple : 'game:abc123def', 'game:xyz789ghi'
});
```

**2. Client rejoint la room au chargement :**
```typescript
// src/components/game/GamePlay.tsx
useEffect(() => {
  if (isConnected && fullGameId) {
    joinGame(fullGameId); // ← Rejoint room `game:${gameId}`
    
    return () => {
      leaveGame(fullGameId); // ← Quitte room au démontage
    };
  }
}, [isConnected, fullGameId, joinGame, leaveGame]);
```

**3. Fonction joinGame :**
```typescript
// src/contexts/SocketContext.tsx
const joinGame = useCallback((gameId: string) => {
  const normalizedGameId = gameId.toLowerCase();
  if (socket) {
    socket.emit('join-game', normalizedGameId);
    // → Serveur fait socket.join(`game:${normalizedGameId}`)
  }
}, [socket]);
```

**4. Envoi ciblé à la room :**
```javascript
// backend/socket/gameSocket.js
socket.on('turn-changed', ({ gameId, turn }) => {
  const normalizedGameId = normalizeGameId(gameId);
  io.to(`game:${normalizedGameId}`).emit('turn-updated', { gameId, turn });
  // ↑ Envoie seulement à la room de cette partie
});
```

**Isolation par partie :**

```
Partie 1 (ID: abc123) :
  Room: 'game:abc123'
  Clients: Joueur A, Joueur B, Joueur C
  → Événements seulement entre A, B, C

Partie 2 (ID: xyz789) :
  Room: 'game:xyz789'
  Clients: Joueur D, Joueur E, Joueur F
  → Événements seulement entre D, E, F

Aucune interférence entre les deux parties !
```

**Normalisation des IDs :**
```javascript
function normalizeGameId(gameId) {
  return gameId.toLowerCase(); // Garantit cohérence
}
// 'ABC123' et 'abc123' → même room 'game:abc123'
```

**Avantages :**
- ✅ **Isolation totale** : Chaque partie est indépendante
- ✅ **Performance** : Messages seulement aux joueurs concernés
- ✅ **Sécurité** : Joueurs ne voient que leur partie
- ✅ **Scalabilité** : Facile d'avoir 100 parties simultanées

**Gestion du cycle de vie :**
- **Rejoindre** : Quand composant monte ou gameId change
- **Quitter** : Quand composant se démonte ou gameId change
- **Cleanup** : Automatique dans le return du useEffect

---

## 7. Flow Complet - Joueur Joue son Tour - Lié au Projet

**Question :** Montre-moi ce qui se passe quand un joueur joue son tour, et quel événement tu envoies au serveur, et qu'est-ce que le serveur renvoie aux autres joueurs ?

### Réponse :

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 398-439 pour handleSubmitGuess)
- `src/app/api/games/[id]/score/route.ts` (mise à jour score)
- `backend/socket/gameSocket.js` (lignes 26-30 pour answer-submitted)
- `src/components/game/GamePlay.tsx` (lignes 282-298 pour écoute game-updated)

**Flow complet étape par étape :**

**ÉTAPE 1 : Joueur soumet sa réponse (Client)**
```typescript
// src/components/game/GamePlay.tsx - handleSubmitGuess()
const handleSubmitGuess = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Vérifier la réponse côté client
  const correct = checkAnswer(guess, currentPlayer);
  setIsCorrect(correct);
  setShowResult(true);
  
  // 2. Si correct, mettre à jour le score en BDD
  if (correct) {
    await fetch(`/api/games/${gameId}/score`, {
      method: 'POST',
      body: JSON.stringify({ playerId: user.id, isCorrect: true }),
    });
    // → API met à jour score dans table GamePlayer
  }
  
  // 3. Émettre événement Socket.io (bonne OU mauvaise réponse)
  const playerInGame = game.players.find(p => p.userId === user.id);
  if (playerInGame) {
    emitAnswerSubmitted(gameId, playerInGame.id, correct);
    // → socket.emit('answer-submitted', { gameId, playerId, isCorrect })
  }
};
```

**ÉTAPE 2 : Serveur reçoit l'événement**
```javascript
// backend/socket/gameSocket.js
socket.on('answer-submitted', ({ gameId, playerId, isCorrect }) => {
  const normalizedGameId = normalizeGameId(gameId);
  
  // Diffuser à tous les joueurs de la partie
  io.to(`game:${normalizedGameId}`).emit('game-updated', { 
    gameId: normalizedGameId 
  });
  // ↑ Notifie tous les joueurs qu'une réponse a été soumise
});
```

**ÉTAPE 3 : Tous les clients reçoivent l'événement**
```typescript
// src/components/game/GamePlay.tsx
socket.on('game-updated', ({ gameId: updatedGameId }) => {
  if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
    // Recharger les données depuis l'API
    fetch(`/api/games/${gameId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.game) {
          setGame(data.game); // ← Mise à jour avec nouveau score
          // → Re-render avec scores à jour
        }
      });
  }
});
```

**ÉTAPE 4 : Passage automatique au joueur suivant (après 3 secondes)**
```typescript
// src/components/game/GamePlay.tsx
useEffect(() => {
  if (!showResult) return;
  
  // Attendre 3 secondes puis passer au suivant
  const autoNextTimer = setTimeout(() => {
    handleNextPlayer(); // ← Déclenche changement de tour
  }, 3000);
  
  return () => clearTimeout(autoNextTimer);
}, [showResult, handleNextPlayer]);
```

**ÉTAPE 5 : Changement de tour (même flow que question 5)**
```typescript
// handleNextPlayer() → API /turn → Socket turn-changed → Tous synchronisés
```

**Résumé des événements :**

| Étape | Événement émis | Par qui | Vers qui |
|-------|----------------|---------|----------|
| 1. Réponse soumise | `answer-submitted` | Client (joueur) | Serveur |
| 2. Notification | `game-updated` | Serveur | Tous dans room |
| 3. Changement tour | `turn-changed` | Client (joueur) | Serveur |
| 4. Sync tour | `turn-updated` | Serveur | Tous dans room |

**Diagramme de séquence :**

```
Joueur A              Serveur              Joueur B              Joueur C
   |                    |                      |                      |
   |--submit answer---->|                      |                      |
   |                    |                      |                      |
   |<--API score OK-----|                      |                      |
   |                    |                      |                      |
   |--answer-submitted->|                      |                      |
   |                    |                      |                      |
   |                    |--game-updated------->|                      |
   |                    |--game-updated----------------------------->|
   |                    |                      |                      |
   |                    |<--fetch /api/games---|                      |
   |                    |                      |                      |
   |                    |--game-updated------->|                      |
   |                    |                      |                      |
   |                    |                      |                      |
   |--turn-changed----->|                      |                      |
   |                    |                      |                      |
   |                    |--turn-updated------->|                      |
   |                    |--turn-updated----------------------------->|
   |                    |                      |                      |
```

**Points clés :**
- ✅ **Événement client → serveur** : `answer-submitted` (avec gameId, playerId, isCorrect)
- ✅ **Événement serveur → tous** : `game-updated` (juste gameId pour déclencher rechargement)
- ✅ **Rechargement API** : Tous les clients rechargent depuis l'API pour avoir les données à jour
- ✅ **Synchronisation** : Tous voient le nouveau score et le changement de tour

---

## 8. Gestion Concurrence - Deux Joueurs en Même Temps

**Question :** Si deux joueurs jouent en même temps, comment tu gères ce cas ?

### Réponse :

**Fichiers à montrer :**
- `src/app/api/games/[id]/score/route.ts` (mise à jour atomique)
- `src/app/api/games/[id]/turn/route.ts` (mise à jour atomique)
- `src/components/game/GamePlay.tsx` (lignes 350-356 pour vérification isMyTurn)

**Protection multi-niveaux :**

**1. Protection côté client (première barrière) :**
```typescript
// src/components/game/GamePlay.tsx
const currentIndex = game.currentTurn % game.players.length;
const currentTurnPlayer = game.players[currentIndex];
const isMyTurn = currentTurnPlayer?.userId === user.id;

// Ne peut pas soumettre si pas son tour
if (!isMyTurn) {
  return; // ← Bloqué côté client
}
```

**2. Protection côté serveur (source de vérité) :**
```typescript
// src/app/api/games/[id]/score/route.ts
// L'API vérifie que la partie existe et que le joueur est dedans
const gamePlayer = await prisma.gamePlayer.findFirst({
  where: {
    gameId: game.id,
    userId: playerId
  }
});

// Si pas dans la partie → erreur 404
if (!gamePlayer) {
  return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
}
```

**3. Mise à jour atomique en base de données :**
```typescript
// src/app/api/games/[id]/turn/route.ts
const updatedGame = await prisma.game.update({
  where: { id: game.id },
  data: { currentTurn: turn }, // ← Mise à jour atomique
});
// Prisma garantit que la mise à jour est atomique
// Si deux requêtes arrivent en même temps, la BDD gère l'ordre
```

**Scénario : Deux joueurs cliquent en même temps**

**Situation initiale :** Tour 0, c'est le tour de Joueur A

**Requête 1 (Joueur A) :**
```
1. Client A vérifie : isMyTurn = true ✅
2. Client A envoie requête API /score
3. API met à jour score de A
4. Client A émet 'answer-submitted'
5. Client A appelle /turn avec turn = 1
6. BDD : currentTurn = 1 ✅
7. Serveur émet 'turn-updated' à tous
```

**Requête 2 (Joueur B, presque en même temps) :**
```
1. Client B vérifie : isMyTurn = false ❌ (mais state local peut être obsolète)
2. Client B envoie quand même requête API /score (race condition)
3. API vérifie : Joueur B est dans la partie ✅
4. API met à jour score de B (même si ce n'est pas son tour)
5. Client B émet 'answer-submitted'
6. Client B appelle /turn avec turn = 1
7. BDD : currentTurn = 1 (déjà à 1, pas de changement)
8. Serveur émet 'turn-updated' à tous
```

**Synchronisation après :**
```
1. Tous les clients reçoivent 'turn-updated'
2. Tous rechargent depuis l'API
3. Tous voient : currentTurn = 1, ce n'est plus le tour de A ou B
4. Tous voient les scores mis à jour (A et B ont peut-être gagné des points)
```

**Limitation actuelle :**
- Si deux joueurs soumettent en même temps, les deux peuvent être acceptées
- Mais le tour change quand même, donc seule la première compte vraiment
- Les deux peuvent gagner des points si les deux ont répondu correctement

**Amélioration possible (verrou) :**
```typescript
// Amélioration : Vérifier que c'est toujours le tour du joueur
const game = await prisma.game.findUnique({ where: { id: gameId } });
const currentIndex = game.currentTurn % game.players.length;
const currentTurnPlayer = game.players[currentIndex];

if (currentTurnPlayer.userId !== playerId) {
  return NextResponse.json({ 
    error: 'Ce n\'est pas votre tour' 
  }, { status: 400 });
}
```

**Points clés :**
- ✅ **Vérification client** : Première barrière (isMyTurn)
- ✅ **Vérification serveur** : Source de vérité (BDD)
- ✅ **Mise à jour atomique** : Prisma garantit l'ordre
- ✅ **Synchronisation** : Socket.io force rechargement pour tous
- ⚠️ **Limitation** : Deux réponses peuvent être acceptées si très rapides

**Dans la pratique :** Le délai de 3 secondes avant changement de tour + la vérification isMyTurn côté client réduisent fortement les risques de conflit.

---

## 9. Identification Utilisateur - Lié au Projet

**Question :** Comment tu sais quel utilisateur est loggé sur quelle action ?

### Réponse :

**Fichiers à montrer :**
- `src/lib/auth.ts` (lignes 36-77 pour verifyTokenFromRequest)
- `src/contexts/AuthContext.tsx` (gestion token)
- `src/app/api/games/[id]/score/route.ts` (lignes 10-13 pour vérification auth)

**Mécanisme : Authentification JWT (JSON Web Token)**

**1. Connexion et génération du token :**
```typescript
// src/app/api/auth/login/route.ts (simplifié)
const user = await verifyPassword(email, password);
const token = generateToken(user); // ← Génère JWT avec userId, email, username

// Token stocké dans :
// - Cookie : 'auth-token' (httpOnly pour sécurité)
// - localStorage : 'auth-token' (pour accès client)
```

**2. Token envoyé avec chaque requête :**
```typescript
// src/lib/api.ts
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`; // ← Token dans header
  }
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // ← Envoie aussi les cookies
  });
}
```

**3. Vérification du token côté serveur :**
```typescript
// src/lib/auth.ts - verifyTokenFromRequest()
export async function verifyTokenFromRequest(request: any): Promise<User | null> {
  // 1. Récupérer le token depuis header ou cookie
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // ← Depuis header Authorization
  } else {
    token = request.cookies.get('auth-token')?.value || null; // ← Depuis cookie
  }
  
  if (!token) {
    return null; // ← Pas de token = pas connecté
  }
  
  // 2. Vérifier et décoder le token
  const decoded = verifyToken(token);
  if (!decoded) {
    return null; // ← Token invalide
  }
  
  // 3. Récupérer l'utilisateur depuis la BDD
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }, // ← userId dans le token
  });
  
  return user; // ← Utilisateur identifié
}
```

**4. Utilisation dans les routes API :**
```typescript
// src/app/api/games/[id]/score/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Vérifier l'authentification
  const user = await verifyTokenFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  // ← user contient maintenant l'utilisateur connecté
  
  // 2. Utiliser user.id pour identifier l'action
  const body = await request.json();
  const { playerId, isCorrect } = body;
  
  // 3. Vérifier que playerId correspond à user.id
  // (sécurité supplémentaire)
  const gamePlayer = await prisma.gamePlayer.findFirst({
    where: {
      gameId: game.id,
      userId: user.id // ← Utilise user.id du token
    }
  });
}
```

**5. Identification côté client :**
```typescript
// src/components/game/GamePlay.tsx
const { user } = useAuth(); // ← Récupère user depuis AuthContext

// Utiliser user.id pour identifier
const isMyTurn = currentTurnPlayer?.userId === user.id;
const playerInGame = game.players.find(p => p.userId === user.id);
```

**Flow complet d'identification :**

```
1. Utilisateur se connecte
   → Token JWT généré avec { userId, email, username }
   → Token stocké dans cookie + localStorage

2. Client fait une action
   → Token envoyé dans header Authorization ou cookie
   → Requête API avec token

3. Serveur reçoit la requête
   → verifyTokenFromRequest() extrait le token
   → Décode le token → récupère userId
   → Charge user depuis BDD avec userId
   → Retourne user (identifié)

4. Action exécutée avec user.id
   → Mise à jour score avec user.id
   → Vérification que user est dans la partie
   → Action autorisée ou refusée
```

**Sécurité :**

1. **Token signé** : Impossible de falsifier (signé avec JWT_SECRET)
2. **Expiration** : Token expire après 7 jours
3. **HttpOnly cookies** : Protection contre XSS
4. **Vérification serveur** : Toujours vérifier côté serveur (jamais faire confiance au client)
5. **Double vérification** : Token + vérification en BDD

**Dans Socket.io :**

**Limitation actuelle :** Le projet n'identifie pas directement l'utilisateur dans Socket.io. On s'appuie sur les événements et les vérifications API.

**Amélioration possible :**
```javascript
// Authentification Socket.io avec middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  if (user) {
    socket.userId = user.id; // ← Attacher userId à la connexion
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

**Points clés :**
- ✅ **JWT Token** : Contient userId, signé et sécurisé
- ✅ **Vérification serveur** : Toujours vérifier le token
- ✅ **Double source** : Header Authorization OU cookie
- ✅ **User dans contexte** : AuthContext pour accès client
- ✅ **Sécurité** : Token signé, expiration, httpOnly

---

## Points Clés à Retenir

### HTTP vs WebSocket
- HTTP = Requête/Réponse, stateless
- WebSocket = Connexion persistante, bidirectionnel
- WebSocket = Meilleur pour temps réel (latence, efficacité)

### Événements Socket.io
- Message nommé entre client et serveur
- `socket.emit()` pour envoyer, `socket.on()` pour écouter
- Noms clairs, données en objets

### Rooms
- Grouper des clients
- `socket.join(room)` pour rejoindre
- `io.to(room).emit()` pour envoyer au groupe
- Isolation et performance

### emit vs broadcast vs to
- `socket.emit()` = à soi-même
- `socket.broadcast.emit()` = à tous sauf soi
- `io.to(room).emit()` = à un groupe spécifique
- `io.emit()` = à tous

### Synchronisation
- BDD = Source de vérité
- Socket.io = Notifications rapides
- Rechargement API = Synchronisation finale

### Identification
- JWT Token avec userId
- Vérification serveur obligatoire
- Token dans header ou cookie
- Sécurité multi-niveaux

