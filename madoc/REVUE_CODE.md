# Guide de Révision de Code - Guess Player

## Questions et Réponses Détaillées

### 1. Gestion du Timer

**Question :** "Comment as-tu implémenté le timer dans le jeu ? Comment fonctionne-t-il et comment se synchronise-t-il entre les joueurs ?"

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 331-382)
- `src/hooks/useTimerSound.ts` (pour le son d'alerte)

**Réponse à donner :**

Le timer est géré côté client uniquement dans le composant `GamePlay.tsx`. J'utilise plusieurs `useEffect` pour gérer différents aspects :

1. **Reset du timer** (lignes 332-343) : Quand le tour change ou que le statut de la partie change, je réinitialise le timer avec la valeur `timePerTurn` de la partie, mais seulement si c'est le tour du joueur actuel.

2. **Décompte** (lignes 345-375) : Un `useEffect` qui s'exécute toutes les secondes avec un `setTimeout`. Il décrémente `timeLeft` de 1 chaque seconde. Le timer ne s'affiche et ne fonctionne que pour le joueur dont c'est le tour (vérifié via `isMyTurn`).

3. **Son d'alerte** (lignes 378-382) : Un autre `useEffect` qui déclenche un son d'alerte quand il reste exactement 10 secondes.

4. **Gestion du temps écoulé** : Quand `timeLeft` atteint 0, j'affiche automatiquement le résultat (incorrect) et je récupère la photo du joueur.

**Important :** Le timer n'est PAS synchronisé entre les joueurs. Chaque client gère son propre timer localement. C'est voulu car seul le joueur dont c'est le tour voit et utilise le timer.

---

### 2. Alternance des Joueurs

**Question :** "Comment gères-tu le passage d'un joueur à l'autre ? Comment détermines-tu quel joueur doit jouer à chaque tour ?"

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 192-196 pour getCurrentPlayerTurn, lignes 217-254 pour handleNextPlayer)
- `src/app/api/games/[id]/turn/route.ts` (mise à jour en BDD)

**Réponse à donner :**

Le passage entre joueurs se fait via une combinaison de logique côté client et mise à jour en base de données :

1. **Détermination du joueur actuel** (lignes 192-196) : J'utilise un modulo pour déterminer quel joueur doit jouer : `currentTurn % players.length`. Cela permet de faire tourner les joueurs de manière cyclique.

2. **Passage au joueur suivant** (lignes 217-254) : La fonction `handleNextPlayer` :
   - Incrémente `currentTurn` de 1
   - Vérifie si on a atteint `maxTurns` (si oui, termine la partie)
   - Appelle l'API `/api/games/[id]/turn` pour mettre à jour `currentTurn` en base de données
   - Émet un événement Socket.io `turn-changed` pour notifier les autres clients
   - Recharge les données de la partie

3. **Mise à jour en base** (route `/api/games/[id]/turn`) : L'API met à jour le champ `currentTurn` dans la table `Game` via Prisma.

4. **Synchronisation** : Les autres clients reçoivent l'événement `turn-updated` via Socket.io et rechargent les données de la partie pour voir le nouveau tour.

**Important :** Le passage est automatique après 3 secondes d'affichage du résultat, mais le joueur peut aussi cliquer sur "Passer maintenant".

---

### 3. Synchronisation en Temps Réel

**Question :** "Comment fais-tu pour que tous les joueurs voient les mêmes informations en temps réel ? Quelle technologie utilises-tu et pourquoi ?"

**Fichiers à montrer :**
- `backend/socket/gameSocket.js` (gestion des rooms et événements)
- `src/components/game/GamePlay.tsx` (lignes 268-329 pour écoute des événements)
- `src/contexts/SocketContext.tsx` (connexion Socket.io)
- `backend/server.js` (configuration Socket.io)

**Réponse à donner :**

J'utilise **Socket.io** pour la synchronisation en temps réel. Voici comment ça fonctionne :

1. **Architecture** : J'ai un serveur Node.js avec Express séparé (backend) qui gère Socket.io, et le frontend Next.js qui se connecte à ce serveur.

2. **Rooms Socket.io** (lignes 268-276 dans GamePlay.tsx) : Chaque client rejoint une room spécifique à la partie : `game:${gameId}`. Tous les joueurs d'une même partie sont dans la même room.

3. **Émission d'événements** : Quand quelque chose change (tour, score, forfait), j'émet un événement Socket.io :
   - `turn-changed` : changement de tour
   - `answer-submitted` : réponse soumise
   - `player-forfeit` : forfait
   - `game-updated` : mise à jour générale

4. **Réception côté client** (lignes 279-329) : Les clients écoutent ces événements et quand ils reçoivent un événement pour leur partie, ils rechargent les données depuis l'API REST (`/api/games/[id]`).

5. **Pourquoi cette approche** : J'utilise Socket.io pour les notifications en temps réel, mais je garde l'API REST comme source de vérité. Les clients rechargent toujours depuis l'API pour être sûrs d'avoir les bonnes données.

**Important :** Les événements Socket.io servent de "notifications" pour déclencher un rechargement, mais les données viennent toujours de l'API REST.

---

### 4. Gestion des Réponses

**Question :** "Quand un joueur soumet une réponse, que se passe-t-il côté client et côté serveur ? Comment le score est-il mis à jour ?"

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 398-439 pour handleSubmitGuess)
- `src/utils/gameUtils.ts` (fonction checkAnswer)
- `src/app/api/games/[id]/score/route.ts` (mise à jour score en BDD)
- `src/app/api/players/[name]/photo/route.ts` (récupération photo)

**Réponse à donner :**

Quand un joueur soumet une réponse, voici le flow complet :

1. **Vérification côté client** (lignes 398-439) : 
   - La fonction `handleSubmitGuess` vérifie la réponse avec `checkAnswer(guess, currentPlayer)` qui compare la réponse avec le nom du joueur (insensible à la casse, aux accents, accepte correspondances partielles).

2. **Affichage du résultat** : 
   - Je mets `showResult` à `true` et `isCorrect` selon le résultat
   - Je récupère la photo du joueur via l'API `/api/players/[name]/photo`

3. **Mise à jour du score** (si correct) :
   - J'appelle l'API `/api/games/[id]/score` avec `POST` pour mettre à jour le score en base de données
   - Cette API incrémente le score du joueur dans la table `GamePlayer` via Prisma
   - **Important** : L'API elle-même n'utilise PAS Socket.io, elle fait juste la mise à jour en BDD

4. **Notification Socket.io** :
   - **Après** l'appel API, côté client, j'émet l'événement `answer-submitted` via Socket.io (même pour les mauvaises réponses)
   - Cela notifie les autres clients qu'une réponse a été soumise
   - Les autres clients reçoivent l'événement et rechargent les données depuis l'API pour voir le nouveau score

5. **Passage automatique** (lignes 385-396) :
   - Après 3 secondes d'affichage du résultat, `handleNextPlayer` est appelé automatiquement
   - Le joueur peut aussi cliquer sur "Passer maintenant" pour accélérer

**Important :** La vérification se fait côté client pour l'UX (réponse immédiate), mais le score est toujours mis à jour côté serveur pour la sécurité.

---

### 5. Architecture Générale

**Question :** "Peux-tu expliquer l'architecture de ton application ? Pourquoi as-tu séparé le backend Express du frontend Next.js ?"

**Fichiers à montrer :**
- `backend/server.js` (serveur Node.js + Express pour Socket.io)
- `backend/socket/gameSocket.js` (handlers Socket.io)
- `backend/routes/emitRoutes.js` (routes HTTP pour émettre events)
- `src/app/api/games/[id]/start/route.ts` (exemple d'appel au backend Express)
- `package.json` (frontend) et `backend/package.json` (backend)

**Réponse à donner :**

J'ai une architecture hybride avec deux serveurs :

1. **Frontend Next.js** (port 3000) :
   - Gère les pages et composants React
   - Routes API REST (`/api/*`) pour les opérations CRUD
   - Utilise Prisma pour accéder à la base de données PostgreSQL
   - Gère l'authentification (JWT dans les cookies)

2. **Backend Node.js + Express** (port 3001) :
   - Serveur Node.js avec framework Express
   - Serveur dédié pour Socket.io
   - Gère les connexions WebSocket
   - Routes HTTP pour émettre des événements Socket.io depuis Next.js (`/emit/*`)

3. **Pourquoi cette séparation** :
   - Socket.io nécessite un serveur WebSocket persistant
   - Next.js peut gérer Socket.io, mais j'ai choisi de séparer pour :
     - Meilleure scalabilité (on peut mettre Socket.io sur un serveur différent)
     - Séparation des responsabilités
     - Plus facile à débugger

4. **Communication entre les deux** :
   - Next.js appelle le backend Node.js/Express via HTTP (`fetch`) pour émettre des événements Socket.io
   - Les clients se connectent directement au serveur Node.js/Express pour Socket.io

**Important :** Les deux serveurs partagent la même base de données PostgreSQL, mais Next.js est la source de vérité pour les données (via Prisma).

---

### 6. Gestion des Erreurs et Cas Limites

**Question :** "Comment gères-tu les cas où un joueur quitte la partie, ou si le timer expire avant qu'une réponse soit donnée ?"

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 73-90 pour beforeunload, lignes 97-126 pour forfait, lignes 358-365 pour timer expire)
- `src/app/api/games/[id]/forfeit/route.ts` (gestion forfait côté serveur)
- `src/app/api/games/[id]/question/route.ts` (lignes 100-114 pour plus de joueurs disponibles)

**Réponse à donner :**

**Cas 1 : Joueur quitte volontairement** (lignes 97-126) :
- Le joueur clique sur "Quitter la partie"
- Un modal de confirmation s'affiche
- Si confirmé, j'appelle `/api/games/[id]/forfeit`
- L'API retire le joueur de la partie
- Si c'était le dernier joueur, la partie est annulée
- Sinon, la partie se termine et le joueur avec le meilleur score gagne
- J'émet l'événement `player-forfeit` via Socket.io
- Redirection vers les résultats

**Cas 2 : Fermeture de l'onglet** (lignes 73-90) :
- J'utilise l'événement `beforeunload` du navigateur
- Un message d'avertissement s'affiche
- Si l'utilisateur confirme, le navigateur ferme mais le forfait n'est pas automatiquement déclaré (c'est juste un avertissement)

**Cas 3 : Timer expire** (lignes 358-365) :
- Quand `timeLeft` atteint 0, je mets automatiquement `showResult` à `true` et `isCorrect` à `false`
- Je récupère la photo du joueur
- Le résultat s'affiche comme "Temps écoulé !"
- Le passage au joueur suivant se fait automatiquement après 3 secondes (comme pour une mauvaise réponse)

**Cas 4 : Plus de joueurs disponibles** (dans `/api/games/[id]/question`) :
- Si tous les joueurs ont déjà été utilisés dans les questions précédentes, la partie se termine automatiquement
- Le statut passe à `FINISHED`

**Important :** Tous ces cas sont gérés avec des vérifications côté serveur pour éviter la triche.

---

## Points Techniques Importants

### Normalisation des GameId
- Tous les `gameId` sont normalisés en minuscules pour éviter les problèmes de casse
- Fonction `normalizeGameId()` utilisée partout

### Gestion des Codes Courts
- Les parties peuvent être identifiées par les 8 premiers caractères de leur ID
- Support dans toutes les routes API avec vérification de longueur

### Sécurité
- Toutes les routes API vérifient l'authentification via `verifyTokenFromRequest`
- Vérification que l'utilisateur est dans la partie avant toute action
- Vérification que l'utilisateur est l'hôte pour certaines actions (démarrer, retirer joueur)

### Base de Données
- Utilisation de Prisma comme ORM
- Connexion à PostgreSQL
- Gestion des relations (Game, GamePlayer, User, Question)

