# Wealth Tracker Frontend (TypeScript)

Interface web TypeScript pour visualiser les données de wealth tracking.

## 🚀 Démarrage

### Build et démarrage

```bash
# Depuis la racine du projet
pnpm frontend
```

Cela compile le TypeScript et démarre le serveur sur `http://localhost:8080`.

### Build uniquement

```bash
pnpm frontend:build
```

### Watch mode (développement)

```bash
pnpm dev:frontend
```

Cela compile en mode watch et démarre le serveur.

## 📋 Prérequis

1. **Backend démarré** : L'application NestJS doit tourner sur `http://localhost:3000`
   ```bash
   pnpm dev
   ```

2. **Worker démarré** : Le worker doit traiter les jobs
   ```bash
   pnpm worker
   ```

## 🎨 Fonctionnalités

### Dashboard principal

- **Résumé de Wealth** : Affiche les balances par devise, positions crypto, et statut de valorisation
- **Comptes** : Liste tous les comptes avec leurs balances et positions crypto
- **Timeline** : Affiche l'historique des événements avec pagination

### Envoi de webhooks

- Bouton "Envoyer un webhook" pour tester l'ingestion
- Formulaire dynamique selon le provider sélectionné
- Validation et feedback en temps réel

## 🔧 Structure

```
frontend/
├── index.html          # Page principale
├── src-ts/             # Sources TypeScript
│   ├── api.ts          # Service API
│   ├── ui.ts           # Fonctions de rendu
│   ├── app.ts          # Logique principale
│   └── webhook-forms.ts # Gestion des formulaires
├── dist/               # Fichiers compilés (JS)
│   ├── api.js
│   ├── ui.js
│   ├── app.js
│   └── webhook-forms.js
├── src/
│   └── styles.css      # Styles CSS
├── tsconfig.json       # Configuration TypeScript
└── server.js           # Serveur HTTP Node.js
```

## 🔧 Configuration

L'URL de l'API est configurée dans `src-ts/api.ts` :

```typescript
const API_BASE_URL = 'http://localhost:3000';
```

Modifiez cette valeur si votre backend tourne sur un autre port.

## 📱 Responsive

L'interface est responsive et s'adapte aux écrans mobiles et desktop.

## 🎯 Utilisation

1. Entrez un `userId` dans le champ en haut
2. Cliquez sur "Charger les données"
3. Les données se rechargent automatiquement toutes les 10 secondes
4. Utilisez "Envoyer un webhook" pour tester l'ingestion

## 🐛 Dépannage

### CORS errors

Si vous voyez des erreurs CORS, vérifiez que :
- Le backend a CORS activé (déjà fait dans `main.ts`)
- Vous accédez au frontend via `http://localhost:8080` (pas `file://`)

### Données vides

- Vérifiez que le backend tourne : `http://localhost:3000/health`
- Vérifiez que le worker traite les jobs : `pnpm debug:jobs`
- Vérifiez la console du navigateur pour les erreurs

### Erreurs de compilation TypeScript

```bash
# Nettoyer et recompiler
rm -rf frontend/dist
pnpm frontend:build
```

## 📝 Notes

- Le frontend utilise TypeScript compilé en JavaScript ES2020
- Compatible avec tous les navigateurs modernes
- Les fichiers compilés sont dans `dist/` et servis par le serveur HTTP
