# Mémo Rapide - Questions Techniques

## 1. useEffect
- **Sert à** : Effets de bord, synchronisation, cycles de vie
- **vs useState** : useState = état, useEffect = exécution de code
- **Risques** : Boucles infinies, oublier deps, oublier cleanup, trop de re-renders
- **Exemple projet** : Timer (lignes 345-375 GamePlay.tsx) avec cleanup

## 2. State vs Props
- **Props** : Données du parent (read-only), communication parent → enfant
- **State** : Données locales (mutable), changent et déclenchent re-render
- **Quand Props** : Configuration, données partagées, données du parent
- **Quand State** : Données locales, input user, timers, changements fréquents
- **Règle** : Props down, Events up
- **Projet** : gameId = props, game/timeLeft/guess = state

## 3. Custom Hook
- **Sert à** : Réutiliser logique, extraire complexité, séparer logique/UI
- **Règle** : Commence par "use"
- **Exemple projet** : `useTimerSound` (src/hooks/useTimerSound.ts)
- **Avantages** : Réutilisabilité, testabilité, lisibilité, maintenabilité
- **Autres exemples** : useAuth, useSocket, useDebounce, useFetch

## 4. Re-render dans le Jeu
- **Fichiers** : GamePlay.tsx (lignes 279-329, 134-190)
- **Déclencheurs** :
  1. Changement state local (setShowResult, setTimeLeft, setGame)
  2. Événements Socket.io → fetch API → setGame → re-render
  3. Changement props (rare)
  4. Rechargement manuel (fetchGame)
- **Flow** : Action → setState → re-render OU Socket event → fetch → setState → re-render

## 5. Gestion Concurrence (2 joueurs cliquent en même temps)
- **Fichiers** : api/games/[id]/turn/route.ts (lignes 72-102), GamePlay.tsx (lignes 217-254)
- **Protection serveur** :
  1. BDD = source de vérité (currentTurn dans table Game)
  2. Mise à jour atomique via Prisma
  3. Vérification avant action (isMyTurn)
  4. Rechargement après action
- **Protection client** :
  1. Vérification isMyTurn avant soumission
  2. State synchronisé depuis serveur
  3. Socket.io force rechargement
- **Scénario** : 2 clics → 1er arrive → update BDD → 2ème voit état mis à jour → Socket sync tous
- **Points clés** : Source vérité = BDD, vérifs serveur, sync Socket.io, rechargement régulier

## Points Clés Rapides
- ✅ useEffect : cleanup, deps, éviter boucles
- ✅ Props = parent, State = local
- ✅ Custom hooks : réutiliser logique
- ✅ Re-render : state/props changent
- ✅ Concurrence : BDD source vérité, vérifs serveur

