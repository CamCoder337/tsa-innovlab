# Guide d'utilisation des Toasts

## Vue d'ensemble

Les toasts remplacent les `Alert.alert()` pour une meilleure expérience utilisateur avec des notifications non-intrusives qui apparaissent en haut de l'écran.

## Installation

Les composants sont déjà créés :
- `src/components/Toast.tsx` - Composant Toast
- `src/hooks/useToast.ts` - Hook pour gérer les toasts

## Utilisation

### 1. Importer le hook et le composant

```tsx
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
```

### 2. Utiliser le hook dans votre composant

```tsx
export default function MyScreen() {
  const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();
  
  // Votre logique...
}
```

### 3. Ajouter le composant Toast au JSX

```tsx
return (
  <SafeAreaView>
    {/* Votre contenu */}
    
    {/* Toast notifications - toujours à la fin */}
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onHide={hideToast}
    />
  </SafeAreaView>
);
```

### 4. Afficher des toasts

```tsx
// Toast de succès (vert)
showSuccess('Mission terminée avec succès');

// Toast d'erreur (rouge)
showError('Une erreur est survenue');

// Toast d'avertissement (orange)
showWarning('Veuillez compléter tous les champs');

// Toast d'information (bleu)
showInfo('Nouvelle mise à jour disponible');
```

## Types de toasts

| Type | Couleur | Icône | Usage |
|------|---------|-------|-------|
| `success` | Vert | ✓ | Actions réussies, confirmations |
| `error` | Rouge | ✗ | Erreurs, échecs |
| `warning` | Orange | ⚠ | Avertissements, validations |
| `info` | Bleu | ℹ | Informations, conseils |

## Remplacement des Alert.alert()

### Avant (Alert)
```tsx
Alert.alert('Succès', 'Mission terminée avec succès');
Alert.alert('Erreur', 'Une erreur est survenue');
```

### Après (Toast)
```tsx
showSuccess('Mission terminée avec succès');
showError('Une erreur est survenue');
```

## Cas spéciaux

### Dialogues de confirmation
Pour les dialogues de confirmation, gardez `Alert.alert()` mais remplacez les messages de résultat :

```tsx
Alert.alert(
  'Confirmer',
  'Êtes-vous sûr ?',
  [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      onPress: () => {
        // Action...
        showSuccess('Action confirmée'); // ← Toast au lieu d'Alert
      }
    }
  ]
);
```

### Navigation après toast
Pour laisser le temps de voir le toast avant de naviguer :

```tsx
showSuccess('Connexion réussie');
setTimeout(() => {
  navigation.navigate('NextScreen');
}, 2000); // 2 secondes
```

## Configuration

### Durée d'affichage
Par défaut : 4 secondes. Modifiable dans le composant Toast :

```tsx
<Toast
  visible={toast.visible}
  message={toast.message}
  type={toast.type}
  duration={3000} // 3 secondes
  onHide={hideToast}
/>
```

### Position
Les toasts apparaissent en haut de l'écran (top: 50px). Modifiable dans `Toast.tsx`.

## Écrans déjà migrés

- ✅ `DeliveryProofScreen.tsx`
- ✅ `DriverMissionAccessScreen.tsx`

## Écrans à migrer

- `SimpleTrackingTestScreen.tsx`
- `ProofOfDeliveryScreen.tsx`
- `MissionDetailsScreen.tsx`
- `LiveTrackingScreen.tsx`
- `DriverReportIssueScreen.tsx`
- Et autres...

## Bonnes pratiques

1. **Messages courts** : Limitez à 2 lignes maximum
2. **Langage simple** : Évitez le jargon technique
3. **Actions claires** : "Mission terminée" plutôt que "Opération réussie"
4. **Cohérence** : Utilisez les mêmes types pour les mêmes situations
5. **Pas de spam** : Évitez les toasts multiples simultanés