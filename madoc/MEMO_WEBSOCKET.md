# Mémo Rapide - Questions WebSocket & Socket.io

## 1. HTTP vs WebSocket
- **HTTP** : Requête/Réponse, stateless, unidirectionnel, connexion fermée après
- **WebSocket** : Connexion persistante, bidirectionnel, stateful, reste ouvert
- **Pourquoi WebSocket pr jeu** : Latence réduite, communication bidirectionnelle, efficacité, état connexion
- **Projet** : HTTP = API REST, WebSocket = sync temps réel

## 2. Événements Socket.io
- **Événement** = Message nommé entre client et serveur
- **Créer** : `socket.emit('nom-event', data)` pour envoyer, `socket.on('nom-event', handler)` pour écouter
- **Structure** : Nom événement + données (objet)
- **Projet** : `answer-submitted`, `turn-changed`, `game-updated`, etc.
- **Bonnes pratiques** : Noms clairs, objets pour données, nettoyer listeners

## 3. Rooms
- **Room** = Groupe de connexions Socket.io
- **Utilité** : Envoyer messages à un groupe spécifique (pas à tous)
- **Cas multi-joueurs** : Chaque partie = room séparée, isolation totale
- **Projet** : `socket.join('game:${gameId}')` → room par partie
- **Avantages** : Isolation, performance, sécurité, scalabilité

## 4. emit vs broadcast vs emit.to
- **socket.emit()** : À soi-même (réponse)
- **socket.broadcast.emit()** : À tous sauf soi
- **io.to(room).emit()** : À un groupe spécifique (UTILISÉ dans projet)
- **io.emit()** : À tous les clients
- **Projet** : Principalement `io.to('game:${gameId}').emit()`

## 5. Synchronisation Changement Tour
- **Fichiers** : GamePlay.tsx (lignes 217-254), api/turn/route.ts, gameSocket.js (lignes 32-36)
- **Flow** :
  1. Client : Update BDD + emit `turn-changed`
  2. Serveur : Reçoit + diffuse `turn-updated` à room
  3. Clients : Reçoivent + rechargent depuis API
  4. BDD : Source de vérité
- **Pourquoi** : BDD = vérité, Socket = notification, API = sync finale

## 6. Salon par Partie
- **Fichiers** : gameSocket.js (lignes 9-12), SocketContext.tsx (lignes 24-29), GamePlay.tsx (lignes 268-276)
- **Mécanisme** : Room = `game:${gameId}` (unique par partie)
- **Rejoindre** : `socket.join('game:${gameId}')` au chargement composant
- **Quitter** : `socket.leave()` au démontage
- **Isolation** : Chaque partie = room séparée, pas d'interférence

## 7. Flow Joueur Joue Tour
- **Fichiers** : GamePlay.tsx (lignes 398-439), api/score/route.ts, gameSocket.js (lignes 26-30)
- **Flow** :
  1. Joueur soumet → Vérif client → API score (si correct) → emit `answer-submitted`
  2. Serveur reçoit → emit `game-updated` à room
  3. Tous clients reçoivent → rechargent API → scores à jour
  4. Après 3s → changement tour (même flow)
- **Événements** : `answer-submitted` (client→serveur), `game-updated` (serveur→tous)

## 8. Gestion Concurrence (2 joueurs en même temps)
- **Fichiers** : api/score/route.ts, api/turn/route.ts, GamePlay.tsx (lignes 350-356)
- **Protection** :
  1. Client : Vérif `isMyTurn` (première barrière)
  2. Serveur : Vérif token + joueur dans partie
  3. BDD : Mise à jour atomique (Prisma garantit ordre)
  4. Sync : Socket.io force rechargement pour tous
- **Limitation** : 2 réponses peuvent être acceptées si très rapides
- **Amélioration** : Vérifier tour côté serveur avant accepter réponse

## 9. Identification Utilisateur
- **Fichiers** : lib/auth.ts (lignes 36-77), AuthContext.tsx, api/score/route.ts (lignes 10-13)
- **Mécanisme** : JWT Token avec userId
- **Flow** :
  1. Login → Token généré (userId, email, username)
  2. Token stocké : Cookie (httpOnly) + localStorage
  3. Requête API → Token dans header Authorization ou cookie
  4. Serveur : `verifyTokenFromRequest()` → décode token → récupère user
  5. Action : Utilise `user.id` pour identifier
- **Sécurité** : Token signé, expiration 7j, httpOnly, vérif serveur obligatoire
- **Client** : `useAuth()` → `user` depuis AuthContext

## Points Clés Rapides
- ✅ HTTP = requête/réponse, WebSocket = connexion persistante
- ✅ Événement = message nommé, emit pour envoyer, on pour écouter
- ✅ Room = groupe clients, isolation par partie
- ✅ `io.to(room).emit()` = envoyer au groupe
- ✅ Sync = BDD source vérité + Socket notification + API rechargement
- ✅ Room = `game:${gameId}` unique par partie
- ✅ Flow = submit → API → Socket → tous rechargent
- ✅ Concurrence = vérif client + serveur + BDD atomique
- ✅ Identification = JWT token avec userId, vérif serveur

