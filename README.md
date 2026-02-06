# ProjectManager Frontend

Frontend pour ProjectManager - Système de gestion de projet simplifié avec Kanban.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# Démarrer en développement
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📋 Scripts Disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Build pour production
- `npm start` - Démarrage en production
- `npm run lint` - Vérifier le code
- `npm run lint:fix` - Corriger automatiquement
- `npm run type-check` - Vérifier les types TypeScript

## 🛠️ Technologies

- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling utility-first
- **shadcn/ui** - Composants UI
- **Zustand** - State management
- **Lucide React** - Icônes

## 📁 Structure

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   ├── login/            # Page de connexion
│   ├── register/         # Page d'inscription
│   ├── dashboard/        # Dashboard
│   ├── users/            # Gestion utilisateurs
│   └── roles/            # Gestion rôles
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants layout
│   └── forms/            # Composants formulaires
├── lib/                   # Utilitaires
│   ├── api.ts            # Client API
│   └── utils.ts          # Helpers
└── store/                # State management (Zustand)
    └── authStore.ts      # Store d'authentification
```

## 🔑 Variables d'Environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_INSTANCE_NAME="ProjectManager Dev"
NEXT_PUBLIC_ENABLE_REGISTRATION=true
```

## 📚 Documentation

Voir le dossier `docs/` à la racine du projet pour la documentation complète.

## 📝 License

MIT
