# Questions Techniques - Réponses Détaillées

## 1. useEffect - Théorique

**Question :** À quoi sert le hook useEffect ? Et quelle est la différence avec useState ? Quel est le risque avec une mauvaise utilisation de useEffect ?

### Réponse :

**useEffect sert à :**
- Exécuter du code après le rendu du composant (effets de bord)
- Gérer les cycles de vie : montage, mise à jour, démontage
- Synchroniser avec des systèmes externes (API, timers, subscriptions)
- Nettoyer les ressources (cleanup function)

**Différence avec useState :**
- `useState` : Gère l'état local du composant (données qui changent et déclenchent un re-render)
- `useEffect` : Exécute du code en réaction à des changements (ne gère pas l'état directement)

**Exemple dans le projet :**
```typescript
// useState : stocke une valeur qui change
const [timeLeft, setTimeLeft] = useState(30);

// useEffect : exécute du code quand timeLeft change
useEffect(() => {
  const timer = setTimeout(() => {
    setTimeLeft(prev => prev - 1);
  }, 1000);
  return () => clearTimeout(timer); // cleanup
}, [timeLeft]);
```

**Risques d'une mauvaise utilisation :**
1. **Boucles infinies** : Si useEffect modifie une dépendance qu'il écoute
   ```typescript
   // ❌ MAUVAIS - boucle infinie
   useEffect(() => {
     setCount(count + 1); // modifie count qui est dans les deps
   }, [count]);
   ```

2. **Oublier les dépendances** : Peut causer des bugs (valeurs obsolètes)
   ```typescript
   // ❌ MAUVAIS - manque user dans les deps
   useEffect(() => {
     fetchUserData(user.id);
   }, []); // user.id peut être obsolète
   ```

3. **Oublier le cleanup** : Fuites mémoire (timers, subscriptions non nettoyées)
   ```typescript
   // ❌ MAUVAIS - timer jamais nettoyé
   useEffect(() => {
     setInterval(() => doSomething(), 1000);
   }, []);
   ```

4. **Trop de re-renders** : useEffect qui se déclenche trop souvent
   ```typescript
   // ❌ MAUVAIS - se déclenche à chaque render
   useEffect(() => {
     expensiveOperation();
   }); // pas de tableau de dépendances
   ```

**Dans le projet :** On utilise useEffect correctement avec cleanup (lignes 372-374 dans GamePlay.tsx) et dépendances appropriées.

---

## 2. State vs Props - Théorique

**Question :** C'est quoi la différence entre state et props, lequel choisir dans une situation plutôt que l'autre ?

### Réponse :

**Props (Properties) :**
- Données passées d'un composant parent à un composant enfant
- **Read-only** : l'enfant ne peut pas modifier les props
- Viennent de l'extérieur du composant
- Utilisées pour la communication parent → enfant

**State :**
- Données internes au composant
- **Mutable** : peut être modifié avec setState
- Géré localement dans le composant
- Utilisé pour les données qui changent et affectent le rendu

**Quand utiliser Props :**
- Données qui viennent du parent
- Configuration du composant
- Données partagées entre plusieurs composants
- Données qui ne changent pas souvent

**Quand utiliser State :**
- Données locales au composant
- Données qui changent fréquemment
- Données qui déclenchent des re-renders
- Input utilisateur, timers, toggles

**Exemple dans le projet :**
```typescript
// Props : gameId vient du parent
export function GamePlay({ gameId }: GamePlayProps) {
  // State : données locales qui changent
  const [game, setGame] = useState<Game | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [guess, setGuess] = useState('');
}
```

**Règle d'or :**
- **Props down, Events up** : Les props descendent, les événements remontent
- Si plusieurs composants ont besoin de la même donnée → remonter le state au parent commun ou utiliser un Context

**Dans le projet :** On utilise les deux :
- Props : `gameId` passé au composant GamePlay
- State : `game`, `timeLeft`, `guess` pour gérer l'état local
- Context : `SocketContext` pour partager la connexion Socket.io entre composants

---

## 3. Custom Hook - Théorique

**Question :** À quoi ça sert un custom hook ? Donne un exemple où son utilité serait pertinente.

### Réponse :

**Custom Hook sert à :**
- Réutiliser la logique entre composants
- Extraire la logique complexe d'un composant
- Séparer les préoccupations (séparation logique/UI)
- Partager du code qui utilise des hooks React

**Règle :** Un custom hook doit commencer par "use" (ex: `useTimerSound`, `useAuth`)

**Exemple dans le projet : `useTimerSound`**
```typescript
// src/hooks/useTimerSound.ts
export function useTimerSound() {
  const soundRef = useRef<Howl | null>(null);
  
  useEffect(() => {
    // Initialisation du son
    soundRef.current = new Howl({...});
    return () => soundRef.current?.unload();
  }, []);
  
  const playWarning = () => {
    soundRef.current?.play();
  };
  
  return { playWarning };
}
```

**Utilisation :**
```typescript
// Dans GamePlay.tsx
const { playWarning } = useTimerSound();

useEffect(() => {
  if (timeLeft === 10) {
    playWarning(); // Simple et réutilisable
  }
}, [timeLeft]);
```

**Avantages :**
1. **Réutilisabilité** : Peut être utilisé dans plusieurs composants
2. **Testabilité** : Logique isolée, plus facile à tester
3. **Lisibilité** : Composant plus propre, logique extraite
4. **Maintenabilité** : Modifications centralisées

**Autres exemples pertinents :**
- `useAuth` : Gestion de l'authentification (déjà dans le projet)
- `useSocket` : Connexion Socket.io (déjà dans le projet)
- `useLocalStorage` : Synchronisation avec localStorage
- `useDebounce` : Attendre que l'utilisateur arrête de taper
- `useFetch` : Gestion des appels API avec loading/error

**Dans le projet :** On utilise plusieurs custom hooks :
- `useTimerSound` : Gestion du son d'alerte
- `useAuth` : Authentification
- `useSocket` : Connexion Socket.io
- `useSocketContext` : Accès au contexte Socket

---

## 4. Re-render - Lié au Projet

**Question :** Dans ton interface de jeu, qu'est-ce qui déclenche un re-render quand un joueur fait une action ?

### Réponse :

**Fichiers à montrer :**
- `src/components/game/GamePlay.tsx` (lignes 279-329 pour écoute Socket, lignes 134-190 pour fetchGame)

**Ce qui déclenche un re-render :**

1. **Changement d'état local (useState)** :
   - Quand un joueur soumet une réponse → `setShowResult(true)`, `setIsCorrect(correct)`
   - Quand le timer décrémente → `setTimeLeft(prev => prev - 1)`
   - Quand on charge la partie → `setGame(data.game)`

2. **Événements Socket.io** (lignes 279-329) :
   ```typescript
   socket.on('game-updated', handleGameUpdated);
   socket.on('turn-updated', handleTurnUpdated);
   ```
   - Quand un autre joueur fait une action, on reçoit un événement Socket
   - On recharge les données depuis l'API : `fetch('/api/games/${gameId}')`
   - On met à jour le state : `setGame(data.game)`
   - **→ Re-render automatique**

3. **Changement de props** :
   - Si `gameId` change (peu probable dans ce cas)

4. **Rechargement manuel** :
   - Fonction `fetchGame()` appelée après certaines actions
   - Met à jour `game` state → re-render

**Flow complet quand un joueur soumet une réponse :**
1. `handleSubmitGuess` appelé
2. `setShowResult(true)` → **re-render immédiat**
3. `setIsCorrect(correct)` → **re-render**
4. Appel API `/api/games/[id]/score` (pas de re-render direct)
5. Émission Socket.io `answer-submitted`
6. **Autres clients** reçoivent l'événement
7. Autres clients appellent `fetch('/api/games/${gameId}')`
8. Autres clients font `setGame(data.game)` → **re-render sur leurs machines**

**Important :** Les re-renders sont déclenchés par les changements de state, pas directement par les événements Socket.io. Les événements Socket déclenchent une mise à jour du state, qui elle déclenche le re-render.

---

## 5. Gestion Concurrence - Lié au Projet

**Question :** Si deux joueurs cliquent presque en même temps, comment l'interface gère l'état pour éviter que les deux pensent que c'est leur tour ?

### Réponse :

**Fichiers à montrer :**
- `src/app/api/games/[id]/turn/route.ts` (lignes 72-102)
- `src/app/api/games/[id]/score/route.ts` (mise à jour atomique)
- `src/components/game/GamePlay.tsx` (lignes 217-254 pour handleNextPlayer)

**Protection côté serveur (source de vérité) :**

1. **Base de données comme source de vérité** :
   - Le champ `currentTurn` dans la table `Game` est la référence absolue
   - Toutes les actions vérifient ce champ avant d'agir

2. **Mise à jour atomique** (lignes 72-102 dans turn/route.ts) :
   ```typescript
   const updatedGame = await prisma.game.update({
     where: { id: game.id },
     data: { currentTurn: turn }, // Mise à jour atomique
   });
   ```
   - Prisma garantit que la mise à jour est atomique
   - Si deux requêtes arrivent en même temps, la BDD gère l'ordre

3. **Vérification avant action** :
   - Avant de soumettre une réponse, on vérifie que c'est bien notre tour :
   ```typescript
   const currentIndex = game.currentTurn % game.players.length;
   const currentTurnPlayer = game.players[currentIndex];
   const isMyTurn = currentTurnPlayer?.userId === user.id;
   ```
   - Si `isMyTurn` est false, on ne peut pas soumettre

4. **Rechargement après action** :
   - Après chaque action importante, on recharge les données depuis le serveur
   - `fetchGame()` récupère l'état actuel depuis la BDD
   - On synchronise avec la source de vérité

**Protection côté client :**

1. **Vérification avant soumission** :
   ```typescript
   if (!isMyTurn) return; // Ne peut pas soumettre si pas son tour
   ```

2. **État local synchronisé** :
   - Le state local `game` est mis à jour depuis le serveur
   - Les événements Socket.io forcent un rechargement

3. **Gestion des conflits** :
   - Si deux joueurs cliquent en même temps :
     - Le premier qui arrive au serveur met à jour `currentTurn`
     - Le deuxième reçoit un état où ce n'est plus son tour
     - Le rechargement via Socket.io synchronise tout le monde

**Exemple de scénario :**
1. Joueur A et B cliquent en même temps (tour 0, c'est le tour de A)
2. Requête A arrive au serveur → `currentTurn` passe à 1
3. Requête B arrive au serveur → `currentTurn` est déjà à 1, B voit que ce n'est plus son tour
4. Socket.io émet `turn-updated` → tous les clients rechargent
5. Tout le monde voit que c'est maintenant le tour du joueur suivant

**Points clés :**
- ✅ **Source de vérité = Base de données** (pas le state React)
- ✅ **Mise à jour atomique** via Prisma
- ✅ **Vérifications côté serveur** avant chaque action
- ✅ **Synchronisation via Socket.io** pour tous les clients
- ✅ **Rechargement régulier** depuis le serveur

**Limitation actuelle :** Si deux joueurs soumettent une réponse en même temps, les deux peuvent être acceptées (mais seule la première compte pour le score car le tour change). Pour améliorer, on pourrait ajouter un verrou côté serveur ou une vérification plus stricte.

---

## Points Clés à Retenir

### useEffect
- Pour les effets de bord et la synchronisation
- Toujours inclure les dépendances
- Toujours nettoyer les ressources
- Attention aux boucles infinies

### State vs Props
- Props = données du parent (read-only)
- State = données locales (mutable)
- Règle : Props down, Events up

### Custom Hooks
- Réutiliser la logique
- Commencer par "use"
- Extraire la complexité

### Re-renders
- Déclenchés par changements de state/props
- Socket.io → mise à jour state → re-render
- Optimiser avec useMemo/useCallback si nécessaire

### Gestion Concurrence
- Source de vérité = Base de données
- Vérifications côté serveur
- Synchronisation via Socket.io
- Rechargement régulier depuis serveur

