# Requirements Document - Chatbot Cleanup & Fix

## Introduction

Nettoyer l'architecture du chatbot TSA en supprimant le code mort (V3, V4) et en fixant le service Function Calling pour qu'il lise vraiment les données et utilise des navigation hints alignés avec les routes frontend réelles.

## Glossary

- **Function Calling Service**: Le service `chatbot_function_calling_service.py` actuellement utilisé en production
- **V3 Service**: `intelligent_chatbot_service.py` - code mort non utilisé
- **V4 Service**: `intelligent_chatbot_v4_service.py` - code mort non utilisé
- **Navigation Hints**: Objets JSON retournés par le chatbot pour guider le frontend vers les bonnes pages
- **READ-ONLY**: Mode où le chatbot consulte des données mais ne crée/modifie/supprime rien
- **Frontend Routes**: Routes React Router définies dans `App.tsx`

## Requirements

### Requirement 1: Supprimer le code mort

**User Story:** En tant que développeur, je veux un codebase propre sans code mort, pour faciliter la maintenance et éviter la confusion.

#### Acceptance Criteria

1. WHEN je liste les services chatbot, THE System SHALL contenir uniquement `chatbot_function_calling_service.py`
2. WHEN je cherche des références à V3 ou V4, THE System SHALL ne retourner aucun import ou appel
3. WHEN je consulte la documentation, THE System SHALL ne contenir aucune référence à V3 ou V4
4. WHEN je lance les tests, THE System SHALL exécuter uniquement les tests pour Function Calling

### Requirement 2: Fixer les fonctions READ-ONLY pour lire vraiment les données

**User Story:** En tant qu'utilisateur, je veux que le chatbot me donne des informations réelles depuis la base de données, pour avoir des réponses précises et utiles.

#### Acceptance Criteria

1. WHEN je demande "où est mon colis #123", THE Chatbot SHALL interroger la table `shipments` et retourner le statut réel
2. WHEN je demande "mes commandes", THE Chatbot SHALL interroger la table `orders` et retourner mes commandes réelles
3. WHEN je demande "mon panier", THE Chatbot SHALL interroger la table `cart_items` et retourner le contenu réel
4. WHEN je demande "mes missions", THE Chatbot SHALL interroger la table `missions` et retourner mes missions réelles
5. WHEN je demande "mes véhicules", THE Chatbot SHALL interroger la table `vehicles` et retourner mes véhicules réels

### Requirement 3: Aligner les navigation hints avec les routes frontend

**User Story:** En tant qu'utilisateur, je veux que les boutons suggérés par le chatbot m'amènent aux bonnes pages, pour une expérience fluide.

#### Acceptance Criteria

1. WHEN le chatbot suggère "Voir le produit", THE Navigation Hint SHALL contenir `route: "/app/shop/product/{id}"`
2. WHEN le chatbot suggère "Voir la commande", THE Navigation Hint SHALL contenir `route: "/app/shop/order/{id}"`
3. WHEN le chatbot suggère "Voir la mission", THE Navigation Hint SHALL contenir `route: "/app/missions/{id}"`
4. WHEN le chatbot suggère "Voir le tracking", THE Navigation Hint SHALL contenir `route: "/app/mission/{id}/tracking"`
5. WHEN le chatbot suggère "Créer une mission", THE Navigation Hint SHALL contenir `route: "/app/missions/create"`
6. WHEN le chatbot suggère "Voir le panier", THE Navigation Hint SHALL contenir `route: "/app/shop/cart"`
7. WHEN le chatbot suggère "Mes commandes", THE Navigation Hint SHALL contenir `route: "/app/shop/orders"`
8. WHEN le chatbot suggère "Mes véhicules", THE Navigation Hint SHALL contenir `route: "/app/vehicles"`
9. WHEN le chatbot suggère "Voir le catalogue", THE Navigation Hint SHALL contenir `route: "/app/shop"`

### Requirement 4: Isoler l'historique de conversation par user_id

**User Story:** En tant qu'utilisateur, je veux que mon historique de conversation soit privé, pour protéger mes données personnelles.

#### Acceptance Criteria

1. WHEN je démarre une conversation, THE System SHALL forcer `conversation_id = user_id`
2. WHEN je charge l'historique, THE System SHALL filtrer par `user_id` uniquement
3. WHEN un utilisateur malveillant tente d'accéder à un autre `conversation_id`, THE System SHALL ignorer le paramètre et utiliser son `user_id`
4. WHEN je sauvegarde un message, THE System SHALL l'associer à mon `user_id`

### Requirement 5: Mettre à jour les tests

**User Story:** En tant que développeur, je veux des tests qui vérifient le code réellement utilisé, pour avoir confiance dans la qualité du système.

#### Acceptance Criteria

1. WHEN je lance les tests READ-ONLY, THE Tests SHALL vérifier `chatbot_function_calling_service.py` uniquement
2. WHEN je teste `track_shipment`, THE Test SHALL vérifier que des données réelles sont retournées
3. WHEN je teste les navigation hints, THE Test SHALL vérifier que les routes correspondent à `App.tsx`
4. WHEN je teste l'isolation, THE Test SHALL vérifier que `conversation_id` est forcé à `user_id`

### Requirement 6: Nettoyer la documentation

**User Story:** En tant que développeur, je veux une documentation à jour, pour comprendre rapidement comment fonctionne le système.

#### Acceptance Criteria

1. WHEN je consulte la documentation, THE Documentation SHALL mentionner uniquement Function Calling Service
2. WHEN je lis les guides de déploiement, THE Guides SHALL ne contenir aucune référence à V3 ou V4
3. WHEN je consulte les exemples, THE Examples SHALL utiliser Function Calling Service
4. WHEN je lis le README, THE README SHALL expliquer l'architecture actuelle (pas V3/V4)
