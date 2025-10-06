# ⚽ Guess Player

Jeu de devinettes de footballeurs en mode tour par tour.

## Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Pour le typage statique
- **TailwindCSS** - Pour le styling
- **DaisyUI** - Composants UI (à venir)
- **MySQL** - Base de données relationnelle
- **WebSockets** - Pour le jeu en temps réel

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Configuration Base de données

Créer un fichier `.env.local` avec :

```
DATABASE_URL="mysql://root:root@127.0.0.1:8889/guess_player?serverVersion=8.0.32&charset=utf8mb4"
```

## Fonctionnalités

- ✅ Connexion / Inscription
- ✅ Validation par email
- ✅ Création de partie avec UUID
- ✅ Rejoindre une partie
- ✅ Jeu tour par tour
- ✅ Tableau des scores
- ✅ Dark mode
- ✅ WebSockets temps réel

