# 🌐 Frontend Web - TSA-Logistique

> Application web moderne pour la plateforme logistique TSA - Interface utilisateur principale

[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-38B2AC.svg)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000.svg)](https://ui.shadcn.com/)

## 🎯 Vue d'Ensemble

L'application web frontend de TSA-Logistique est l'interface principale pour les transporteurs, affréteurs et clients. Construite avec les dernières technologies React, elle offre une expérience utilisateur moderne, rapide et responsive.

## ✨ Fonctionnalités Principales

### 🏠 **Dashboard Intelligent**

- Vue d'ensemble missions actives
- Analytics temps réel et KPIs
- Notifications et alertes importantes
- Widgets personnalisables par rôle

### 🚚 **Marketplace Logistique**

- Création et gestion de missions
- Système d'enchères en temps réel
- Matching intelligent transporteurs/affréteurs
- Tracking GPS temps réel des livraisons

### 🛒 **E-commerce Intégré**

- Catalogue produits avec recherche avancée
- Panier intelligent avec calcul frais transport
- Checkout optimisé et paiements sécurisés
- Historique commandes et factures

### 👤 **Gestion de Profil**

- Profils utilisateurs détaillés
- Processus KYC avec upload documents
- Vérification biométrique via Smile Identity
- Gestion permissions et préférences

### 💬 **Communication Temps Réel**

- Chat intégré entre acteurs
- Support client avec tickets
- Notifications push web
- Centre d'aide et FAQ

## 🏗️ Architecture Frontend

```
apps/frontend-web/
├── public/                          # Assets statiques
│   ├── favicon.ico
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # Icônes PWA diverses tailles
├── src/
│   ├── components/                 # Composants réutilisables
│   │   ├── ui/                    # Composants shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── forms/                 # Composants formulaires
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── KYCForm.tsx
│   │   ├── layout/                # Composants layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── charts/                # Graphiques analytics
│   │   │   ├── AnalyticsChart.tsx
│   │   │   └── RevenueChart.tsx
│   │   └── maps/                  # Composants cartes
│   │       ├── TrackingMap.tsx
│   │       └── RoutePlanner.tsx
│   ├── pages/                     # Pages application
│   │   ├── auth/                  # Authentification
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/             # Tableaux de bord
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── TransporteurDashboard.tsx
│   │   │   └── AffreteurDashboard.tsx
│   │   ├── missions/              # Gestion missions
│   │   │   ├── MissionsList.tsx
│   │   │   ├── CreateMission.tsx
│   │   │   └── MissionTracking.tsx
│   │   ├── shop/                  # E-commerce
│   │   │   ├── ProductCatalog.tsx
│   │   │   ├── ShoppingCart.tsx
│   │   │   └── Checkout.tsx
│   │   ├── kyc/                   # Vérification KYC
│   │   │   ├── KYCFlow.tsx
│   │   │   └── DocumentUpload.tsx
│   │   └── profile/               # Gestion profil
│   │       ├── UserProfile.tsx
│   │       └── Settings.tsx
│   ├── hooks/                     # Hooks React personnalisés
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useWebSocket.ts
│   │   └── useKYC.ts
│   ├── services/                  # Services API
│   │   ├── api.ts                 # Configuration API
│   │   ├── auth.service.ts
│   │   ├── missions.service.ts
│   │   └── websocket.service.ts
│   ├── stores/                    # Gestion état (Zustand)
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── missionStore.ts
│   │   └── cartStore.ts
│   ├── utils/                     # Utilitaires
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── types/                     # Types TypeScript
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── mission.types.ts
│   │   └── api.types.ts
│   ├── lib/                       # Bibliothèques et configurations
│   │   └── utils.ts               # Utilitaires shadcn/ui
│   ├── styles/                    # Styles
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.tsx                    # Composant racine
│   ├── main.tsx                   # Point d'entrée
│   └── index.css                  # Styles globaux avec shadcn/ui
├── tests/                         # Tests
│   ├── __mocks__/                # Mocks pour tests
│   ├── components/               # Tests composants
│   ├── pages/                    # Tests pages
│   ├── hooks/                    # Tests hooks
│   ├── services/                 # Tests services
│   ├── setup.ts                  # Configuration tests
│   └── test-utils.tsx            # Utilitaires tests
├── e2e/                          # Tests E2E (Playwright)
│   ├── auth.spec.ts
│   ├── missions.spec.ts
│   ├── shop.spec.ts
│   └── playwright.config.ts
├── components.json               # Configuration shadcn/ui
├── tailwind.config.js           # Configuration Tailwind CSS
├── vite.config.ts               # Configuration Vite
├── tsconfig.json                # Configuration TypeScript
├── package.json                 # Dépendances et scripts
├── .env.example                 # Variables d'environnement exemple
└── README.md                    # Ce fichier
```

## 🚀 Quick Start

### Prérequis

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Yarn** 1.22+ (`npm install -g yarn`)
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# 1. Naviguer vers l'application frontend
cd apps/frontend-web

# 2. Installer les dépendances
yarn install

# 3. Copier les variables d'environnement
cp .env.example .env.local

# 4. Démarrer en mode développement
yarn dev
```

L'application sera disponible sur **http://localhost:3000**

## 🛠️ Scripts Disponibles

### Développement

```bash
yarn dev              # Serveur de développement avec HMR
yarn dev:host         # Serveur accessible depuis le réseau
yarn preview          # Aperçu du build de production
```

### Build & Test

```bash
yarn build            # Build optimisé pour production
yarn test             # Tests unitaires (Jest + Testing Library)
yarn test:watch       # Tests en mode watch
yarn test:coverage    # Tests avec couverture de code
yarn test:e2e         # Tests E2E avec Playwright
```

### Qualité du Code

```bash
yarn lint             # ESLint + Prettier
yarn lint:fix         # Auto-fix des erreurs ESLint/Prettier
yarn type-check       # Vérification TypeScript
yarn type-check:watch # Vérification TypeScript en mode watch
```

### shadcn/ui Components

```bash
yarn ui:add <component>    # Ajouter un composant shadcn/ui
yarn ui:list              # Lister tous les composants disponibles
yarn ui:update            # Mettre à jour tous les composants
```

## 🎨 Design System - shadcn/ui

### Configuration shadcn/ui

L'application utilise **shadcn/ui** pour un design system moderne et accessible.

#### Installation initiale (déjà fait)

```bash
# Déjà exécuté dans le projet
yarn add shadcn@latest
yarn shadcn init
```

#### Ajouter des composants

```bash
# Composants de base
yarn ui:add button
yarn ui:add input
yarn ui:add card
yarn ui:add dialog

# Composants de formulaires
yarn ui:add form
yarn ui:add label
yarn ui:add textarea
yarn ui:add select
yarn ui:add checkbox
yarn ui:add radio-group

# Composants de navigation
yarn ui:add navigation-menu
yarn ui:add breadcrumb
yarn ui:add tabs
yarn ui:add sheet

# Composants de données
yarn ui:add table
yarn ui:add badge
yarn ui:add avatar
yarn ui:add progress

# Composants de feedback
yarn ui:add toast
yarn ui:add alert
yarn ui:add skeleton
yarn ui:add spinner

# Composants de layout
yarn ui:add separator
yarn ui:add accordion
yarn ui:add collapsible
yarn ui:add dropdown-menu

# Pack complet pour TSA-Logistique
yarn ui:add button input card dialog form label textarea select badge table toast alert avatar progress tabs
```

#### Utilisation des composants

```typescript
// Exemple : Carte de mission
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function MissionCard({ mission }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {mission.title}
          <Badge variant={mission.status === 'open' ? 'default' : 'secondary'}>
            {mission.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          📍 {mission.pickup} → {mission.delivery}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary">
            {mission.price.toLocaleString()} FCFA
          </span>
          <Button className="bg-primary hover:bg-primary/90">
            Faire une offre
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Personnalisation des couleurs TSA

```css
/* src/index.css - Variables CSS personnalisées */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Couleurs TSA-Logistique */
    --primary: 221 83% 53%; /* Bleu TSA #3B82F6 */
    --primary-foreground: 210 40% 98%;
    --secondary: 160 84% 39%; /* Vert transport #10B981 */
    --secondary-foreground: 0 0% 9%;
    --accent: 38 92% 50%; /* Orange accent #F59E0B */
    --accent-foreground: 0 0% 9%;

    /* Couleurs système */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221 83% 53%;
  }

  .dark {
    /* Mode sombre TSA */
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... autres variables mode sombre */
  }
}
```

## ⚙️ Configuration

### Variables d'Environnement

Créez `.env.local` avec :

```env
# API Backend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Services externes
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_SMILE_IDENTITY_PUBLIC_KEY=your_smile_key

# Analytics (optionnel)
VITE_PLAUSIBLE_DOMAIN=localhost

# Mode développement
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### Configuration Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tsa/shared-types': path.resolve(__dirname, '../../packages/shared-types'),
      '@tsa/shared-utils': path.resolve(__dirname, '../../packages/shared-utils'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

## 🎯 Structure des Composants

### Composants UI de Base (shadcn/ui)

```typescript
// Importation standardisée
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Utilisation avec variants
<Button variant="default" size="lg">Action</Button>
<Button variant="outline" size="sm">Secondaire</Button>
<Button variant="ghost" size="icon">👤</Button>
```

### Composants Métier TSA

```typescript
// components/forms/MissionForm.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { missionSchema } from "@/utils/validators"

export function MissionForm() {
  const form = useForm({
    resolver: zodResolver(missionSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de la mission</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Transport Douala → Yaoundé" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Créer la mission</Button>
      </form>
    </Form>
  )
}
```

## 🔄 Gestion d'État

### Zustand Stores

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const response = await authService.login(email, password);
        set({ user: response.user, token: response.token });
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Custom Hooks

```typescript
// hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, token, login, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };
}
```

## 🌐 Routing & Navigation

```typescript
// App.tsx avec React Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/missions" element={
          <ProtectedRoute>
            <MissionsList />
          </ProtectedRoute>
        } />

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

## 🔌 Communication API

### Configuration Axios

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Services API

```typescript
// services/missions.service.ts
import api from './api';
import type { Mission, CreateMissionDto } from '@/types/mission.types';

export const missionsService = {
  getAll: (filters?: object): Promise<Mission[]> =>
    api.get('/missions', { params: filters }).then((res) => res.data),

  create: (mission: CreateMissionDto): Promise<Mission> =>
    api.post('/missions', mission).then((res) => res.data),

  getById: (id: string): Promise<Mission> => api.get(`/missions/${id}`).then((res) => res.data),

  update: (id: string, updates: Partial<Mission>): Promise<Mission> =>
    api.put(`/missions/${id}`, updates).then((res) => res.data),
};
```

## 🧪 Tests

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/main.tsx'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Tests de Composants

```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-input')
  })
})
```

## 🚀 Build & Déploiement

### Build de Production

```bash
# Build optimisé
yarn build

# Analyser le bundle
yarn build --analyze

# Tester le build localement
yarn preview
```

### Déploiement Vercel

```bash
# Installation Vercel CLI
npm i -g vercel

# Premier déploiement
vercel

# Déploiements suivants
vercel --prod
```

### Variables d'Environnement Vercel

```bash
# Configurer les variables sur Vercel
vercel env add VITE_API_URL
vercel env add VITE_CLOUDINARY_CLOUD_NAME
vercel env add VITE_GOOGLE_MAPS_API_KEY
```

## 📊 Performance

### Optimisations Incluses

- **Code Splitting** : Lazy loading des routes
- **Tree Shaking** : Élimination du code mort
- **Bundle Optimization** : Chunks optimisés par Vite
- **Image Optimization** : Formats WebP, lazy loading
- **PWA Ready** : Service worker et cache intelligent

### Métriques Objectifs

- **Lighthouse Score** : 95+ (Performance, Accessibilité, SEO)
- **Core Web Vitals** :
  - LCP (Largest Contentful Paint) : < 2.5s
  - FID (First Input Delay) : < 100ms
  - CLS (Cumulative Layout Shift) : < 0.1

## 🔐 Sécurité

### Mesures Implémentées

- **Content Security Policy** : Headers sécurisés
- **Input Validation** : Validation côté client avec Zod
- **XSS Protection** : Sanitisation des données
- **HTTPS Only** : Redirection automatique en production
- **Environment Variables** : Secrets sécurisés

### Authentification

```typescript
// Protection des routes sensibles
function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div>Accès non autorisé</div>
  }

  return children
}
```

## 🆘 Troubleshooting

### Problèmes Courants

#### shadcn/ui components ne s'affichent pas correctement

```bash
# Vérifier que Tailwind CSS est bien configuré
yarn dev
# Vérifier les imports dans index.css
```

#### Erreurs TypeScript avec shadcn/ui

```bash
# Mettre à jour les types
yarn type-check
# Vérifier les alias dans tsconfig.json
```

#### Build échoue

```bash
# Nettoyer et rebuilder
rm -rf node_modules dist
yarn install
yarn build
```

#### Variables d'environnement non reconnues

```bash
# Vérifier que les variables commencent par VITE_
# et redémarrer le serveur de développement
```

## 📚 Ressources

### Documentation

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools & Extensions VSCode

- **ES7+ React/Redux/React-Native snippets**
- **Auto Rename Tag**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **Prettier - Code formatter**

## 🤝 Contribution

### Guidelines Frontend

1. **Suivre les conventions** React et TypeScript
2. **Utiliser shadcn/ui** pour les composants UI
3. **Écrire des tests** pour les nouvelles fonctionnalités
4. **Optimiser les performances** (lazy loading, memo)
5. **Respecter l'accessibilité** (a11y)

### Workflow Git

```bash
# Créer une branche feature
git checkout integration
git checkout -b feature/frontend-nouvelle-fonctionnalite

# Développer et tester
yarn dev
yarn test
yarn lint

# Push sécurisé
tools/safe-push-integration.sh

# Créer PR vers integration
```

---

**🌐 Frontend moderne, performant et accessible pour TSA-Logistique !**

Pour des questions spécifiques au frontend, consultez l'équipe frontend ou créez une issue GitHub.
