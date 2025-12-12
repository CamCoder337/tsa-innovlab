# Guide Utilisateur - TSA InnovLab
## Plateforme Logistique Unifiée

---

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Auteur** : TSA InnovLab Team  
**Public** : Administrateurs, Transporteurs, Affreteurs

---

## Table des Matières

1. [Introduction](#introduction)
2. [Authentification et Sécurité](#authentification)
3. [Guide Administrateur](#admin)
4. [Guide Affreteur (Expéditeur)](#affreteur)
5. [Guide Transporteur (Chauffeur)](#transporteur)
6. [Fonctionnalités Communes](#communes)
7. [Suivi et Localisation GPS](#suivi)
8. [Système de Tarification Dynamique](#tarification)
9. [Chatbot IA et Assistance](#chatbot)
10. [Notifications et Alertes](#notifications)
11. [Questions Fréquentes (FAQ)](#faq)
12. [Support et Contact](#support)
13. [Glossaire](#glossaire)
14. [Annexes](#annexes)

---

<a name="introduction"></a>
## 1. Introduction

### Présentation de TSA InnovLab

TSA InnovLab est une **plateforme logistique unifiée** qui connecte les expéditeurs (affreteurs) avec les transporteurs pour faciliter la gestion des missions de transport de marchandises. La plateforme intègre également une **boutique e-commerce** de pièces reconditionnées et des outils avancés de suivi GPS en temps réel.

### Architecture de la Plateforme

La plateforme TSA InnovLab est composée de :

- **Backend API** : AdonisJS + TypeScript + PostgreSQL
- **Frontend Web** : React + TypeScript + Vite + TailwindCSS
- **Service IA** : Python + FastAPI (chatbot, reconnaissance visuelle, recommandations)
- **Temps Réel** : WebSocket pour notifications instantanées
- **Paiements** : Intégration MTN Mobile Money
- **Cartographie** : Google Maps API pour suivi GPS


### Rôles et Permissions

| Rôle | Description | Permissions Principales |
|------|-------------|------------------------|
| **ADMIN** | Administrateur système | Gestion complète : utilisateurs, produits, missions, commandes, statistiques |
| **AFFRETEUR** | Expéditeur/Client logistique | Créer missions, suivre expéditions, évaluer transporteurs, acheter produits |
| **TRANSPORTEUR** | Chauffeur/Livreur | Gérer flotte, accepter missions, livrer marchandises, acheter produits |
| **CLIENT** | Client e-commerce uniquement | Acheter produits, gérer commandes, passer paiements |

> **NOTE** : Les rôles AFFRETEUR, TRANSPORTEUR et CLIENT ont tous accès à la boutique e-commerce. Seul l'ADMIN ne peut pas passer de commandes.

---

<a name="authentification"></a>
## 2. Authentification et Sécurité

### 2.1 Connexion et Inscription

#### Inscription d'un Nouvel Utilisateur

**Endpoint** : `POST /api/auth/register`

**Étapes** :

1. Accédez à la page d'inscription
2. Remplissez le formulaire :

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Email | Adresse email valide | Oui |
| Mot de passe | Min. 8 caractères | Oui |
| Prénom | Prénom de l'utilisateur | Oui |
| Nom | Nom de famille | Oui |
| Téléphone | Numéro de téléphone | Oui |
| Rôle | AFFRETEUR, TRANSPORTEUR ou CLIENT | Oui |

3. Cliquez sur **"S'inscrire"**
4. Un email de vérification est envoyé automatiquement
5. Cliquez sur le lien dans l'email pour activer votre compte

> **ATTENTION** : Vous devez vérifier votre email avant de pouvoir vous connecter.


#### Connexion

**Endpoint** : `POST /api/auth/login`

**Étapes** :

1. Accédez à la page de connexion
2. Saisissez votre **email** et **mot de passe**
3. Si MFA est activé, entrez le **code à 6 chiffres** de votre application d'authentification
4. Cliquez sur **"Se connecter"**

**Résultat Attendu** :

✓ Connexion réussie  
✓ Redirection vers le dashboard approprié selon votre rôle  
✓ Tokens d'authentification stockés (Access Token + Refresh Token)

> **ASTUCE** : Les tokens d'accès expirent après 15 minutes. Le système les renouvelle automatiquement via le Refresh Token.

#### Récupération de Mot de Passe

**Endpoint** : `POST /api/auth/forgot-password`

**Étapes** :

1. Cliquez sur **"Mot de passe oublié ?"**
2. Saisissez votre **adresse email**
3. Cliquez sur **"Envoyer le lien de réinitialisation"**
4. Consultez votre boîte email
5. Cliquez sur le lien reçu (valide 1 heure)
6. Saisissez votre **nouveau mot de passe**
7. Confirmez le nouveau mot de passe

**Endpoint de réinitialisation** : `POST /api/auth/reset-password`

---

### 2.2 Authentification Multi-Facteurs (MFA)

> **SECURITE** : L'authentification multi-facteurs (MFA) est **OBLIGATOIRE** pour tous les comptes ADMIN.

#### Activer MFA

**Endpoint** : `POST /api/auth/mfa/initialize`

**Étapes** :

1. Accédez à **Paramètres > Sécurité**
2. Cliquez sur **"Activer MFA"**
3. Scannez le **QR Code** avec votre application d'authentification :
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
4. Entrez le **code à 6 chiffres** généré
5. Sauvegardez les **codes de récupération** (10 codes à usage unique)

**Endpoint de confirmation** : `POST /api/auth/mfa/enable`

>  **IMPORTANT** : Conservez vos codes de récupération dans un endroit sûr. Ils vous permettront de vous connecter si vous perdez accès à votre application d'authentification.


#### Désactiver MFA

**Endpoint** : `POST /api/auth/mfa/disable`

**Étapes** :

1. Accédez à **Paramètres > Sécurité**
2. Cliquez sur **"Désactiver MFA"**
3. Entrez votre **mot de passe actuel**
4. Entrez un **code MFA** ou un **code de récupération**
5. Confirmez la désactivation

> **ATTENTION** : Les administrateurs ne peuvent PAS désactiver MFA. C'est une mesure de sécurité obligatoire.

#### Régénérer les Codes de Récupération

**Endpoint** : `POST /api/auth/mfa/regenerate-codes`

Si vous avez utilisé tous vos codes de récupération ou si vous les avez perdus :

1. Accédez à **Paramètres > Sécurité**
2. Cliquez sur **"Régénérer les codes de récupération"**
3. Entrez un **code MFA valide**
4. Sauvegardez les **nouveaux codes** (les anciens sont invalidés)

---

### 2.3 Vérification Email

**Endpoint** : `POST /api/auth/verify-email`

Après inscription, vous recevez un email contenant un lien de vérification.

**Étapes** :

1. Ouvrez l'email de vérification
2. Cliquez sur le lien **"Vérifier mon email"**
3. Vous êtes redirigé vers la page de connexion
4. Connectez-vous avec vos identifiants

> **ASTUCE** : Si vous n'avez pas reçu l'email, vérifiez votre dossier spam ou demandez un nouvel envoi depuis la page de connexion.

---

<a name="admin"></a>
## 3.  Guide Administrateur

Les administrateurs ont un accès complet à toutes les fonctionnalités de la plateforme.

### 3.1 Dashboard Administrateur

**Route** : `/admin/dashboard`  
**Endpoint** : `GET /api/admin/dashboard`

Le dashboard administrateur affiche une vue d'ensemble complète de la plateforme :


**Écran : Dashboard Administrateur**

```
+----------------------------------------------------------+
|  Dashboard Admin                           Admin    |
+----------------------------------------------------------+
|  Statistiques Globales                                 |
|                                                          |
| Utilisateurs : 1,245    Missions : 342    Produits : 89 |
| Commandes : 567         CA Total : 45M FCFA             |
+----------------------------------------------------------+
|  Graphiques                                            |
| - Évolution des missions (7 derniers jours)             |
| - Répartition des utilisateurs par rôle                 |
| - Top 10 produits les plus vendus                       |
| - Revenus mensuels                                       |
+----------------------------------------------------------+
|  Alertes Système                                        |
| - 12 produits en rupture de stock                       |
| - 3 missions en retard                                   |
| - 5 utilisateurs en attente de validation               |
+----------------------------------------------------------+
```

**Statistiques Disponibles** :

- **Utilisateurs** : Total, nouveaux (7j), par rôle, actifs/suspendus
- **Missions** : Total, en cours, complétées, taux de réussite
- **Produits** : Total, en stock, ruptures, valeur inventaire
- **Commandes** : Total, en attente, livrées, CA généré
- **Revenus** : Chiffre d'affaires, évolution mensuelle, prévisions

---

### 3.2 Gestion des Utilisateurs

**Route** : `/admin/users`  
**Endpoint** : `GET /api/admin/users`

#### Lister les Utilisateurs

**Filtres Disponibles** :

| Filtre | Description | Valeurs |
|--------|-------------|---------|
| Rôle | Filtrer par rôle | admin, transporteur, affreteur, client |
| Statut | Filtrer par statut | pending, active, suspended |
| Recherche | Recherche par nom/email | Texte libre |
| Date | Période d'inscription | Date range |

**Actions Disponibles** :

- ✓ **Voir le profil** : Détails complets de l'utilisateur
-  **Modifier** : Mettre à jour les informations
-  **Suspendre** : Bloquer temporairement l'accès
- ✓ **Activer** : Réactiver un compte suspendu
-  **Supprimer** : Supprimer définitivement (avec confirmation)


#### Suspendre un Utilisateur

**Endpoint** : `POST /api/admin/users/:id/suspend`

**Étapes** :

1. Accédez à **Gestion des utilisateurs**
2. Trouvez l'utilisateur à suspendre
3. Cliquez sur **"Actions" > "Suspendre"**
4. Saisissez la **raison de la suspension**
5. Confirmez l'action

**Résultat** :

✓ L'utilisateur ne peut plus se connecter  
✓ Ses sessions actives sont révoquées  
✓ Une notification est envoyée par email  
✓ Un log d'audit est créé

> **ASTUCE** : La suspension est réversible. Vous pouvez réactiver le compte à tout moment.

#### Modifier un Utilisateur

**Endpoint** : `PUT /api/admin/users/:id`

**Champs Modifiables** :

- Prénom / Nom
- Email (avec re-vérification)
- Téléphone
- Rôle (avec confirmation)
- Statut

> **ATTENTION** : Changer le rôle d'un utilisateur modifie ses permissions. Cette action nécessite une confirmation.

---

### 3.3 Gestion des Produits

**Route** : `/admin/products`  
**Endpoint** : `GET /api/admin/products`

#### Créer un Produit

**Endpoint** : `POST /api/admin/products`

**Étapes** :

1. Accédez à **Gestion des produits**
2. Cliquez sur **"Ajouter un produit"**
3. Remplissez le formulaire :

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Nom | Nom du produit | ✓ |
| Description | Description détaillée | ✓ |
| Prix | Prix en FCFA | ✓ |
| Catégorie | Catégorie du produit | ✓ |
| Stock | Quantité disponible | ✓ |
| SKU | Code produit unique | ✓ |
| Images | Photos du produit (max 5) | ✗ |
| Poids | Poids en kg | ✗ |
| Dimensions | L x l x H en cm | ✗ |
| Type véhicule | Véhicule recommandé pour livraison | ✗ |

4. Cliquez sur **"Créer le produit"**


**Résultat Attendu** :

✓ Produit créé et visible dans le catalogue  
✓ Disponible pour tous les utilisateurs (sauf ADMIN)  
✓ Indexé pour la recherche  
✓ Éligible aux recommandations IA

#### Gestion du Stock

**Endpoint** : `GET /api/admin/products/low-stock`

**Alertes de Stock** :

- ⚠ **Rupture** : Stock = 0
- ▲ **Stock faible** : Stock < 10
- ○ **Stock normal** : Stock ≥ 10

**Actions** :

1. Accédez à **Produits > Stock faible**
2. Visualisez les produits nécessitant un réapprovisionnement
3. Cliquez sur **"Modifier"** pour ajuster le stock
4. Saisissez la nouvelle quantité
5. Sauvegardez

> **ASTUCE** : Configurez des notifications automatiques pour être alerté quand un produit atteint le seuil critique.

#### Import en Masse

**Endpoint** : `POST /api/admin/products/bulk`

Pour ajouter plusieurs produits simultanément :

1. Téléchargez le **modèle CSV**
2. Remplissez le fichier avec vos produits
3. Importez le fichier via **"Actions" > "Import en masse"**
4. Vérifiez les erreurs éventuelles
5. Confirmez l'import

**Format CSV** :

```csv
name,description,price,category_id,stock,sku
"Pièce A","Description A",15000,cat-123,50,SKU-001
"Pièce B","Description B",25000,cat-456,30,SKU-002
```

---

### 3.4 Gestion des Missions

**Route** : `/admin/missions`  
**Endpoint** : `GET /api/admin/missions`

Les administrateurs peuvent voir **toutes les missions** de la plateforme et intervenir si nécessaire.

#### Voir Toutes les Missions

**Filtres Disponibles** :

- **Statut** : draft, published, assigned, in_progress, delivered, paid, completed, cancelled
- **Affreteur** : Filtrer par expéditeur
- **Transporteur** : Filtrer par livreur
- **Date** : Période de création
- **Budget** : Plage de prix


#### Workflow des Statuts de Mission

```
DRAFT → PUBLISHED → ASSIGNED → READY_TO_START → IN_PROGRESS → DELIVERED → PAID → COMPLETED
                                                                                    ↓
                                                                               CANCELLED
```

**Description des Statuts** :

| Statut | Description | Qui peut modifier |
|--------|-------------|-------------------|
| `DRAFT` | Mission en brouillon | Affreteur |
| `PUBLISHED` | Mission publiée, visible aux transporteurs | Affreteur |
| `ASSIGNED` | Mission attribuée à un transporteur | Transporteur (claim) |
| `READY_TO_START` | Prêt à démarrer | Transporteur |
| `IN_PROGRESS` | En cours de livraison | Transporteur |
| `DELIVERED` | Marchandise livrée | Transporteur |
| `PAID` | Paiement effectué | Affreteur |
| `COMPLETED` | Mission terminée | Affreteur |
| `CANCELLED` | Mission annulée | Affreteur/Admin |

#### Modifier le Statut d'une Mission

**Endpoint** : `PUT /api/admin/missions/:id/status`

En tant qu'administrateur, vous pouvez forcer le changement de statut :

1. Accédez à **Missions > Détails de la mission**
2. Cliquez sur **"Modifier le statut"**
3. Sélectionnez le nouveau statut
4. Saisissez une **raison** (obligatoire pour audit)
5. Confirmez

> **ATTENTION** : Cette action est tracée dans les logs d'audit. Utilisez-la uniquement en cas de problème nécessitant une intervention manuelle.

---

### 3.5 Gestion des Commandes

**Route** : `/admin/orders`  
**Endpoint** : `GET /api/admin/orders`

#### Voir Toutes les Commandes

**Statistiques Affichées** :

- **Total des commandes** : Nombre total
- **Commandes en attente** : Nécessitant une action
- **Chiffre d'affaires** : CA total et mensuel
- **Taux de conversion** : Paniers → Commandes

**Actions Disponibles** :

-  **Voir les détails** : Informations complètes
-  **Mettre à jour le statut** : Changer l'état de la commande
- ✗ **Annuler** : Annuler une commande (avec remboursement)
-  **Générer facture** : Télécharger la facture PDF


#### Workflow des Statuts de Commande

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
            ↓                      ↓
        FAILED              CANCELLED → REFUNDED
```

**Description des Statuts** :

| Statut | Description | Action Suivante |
|--------|-------------|-----------------|
| `PENDING` | En attente de paiement | Attendre paiement client |
| `PAID` | Paiement confirmé | Préparer la commande |
| `PROCESSING` | En préparation | Emballer et préparer expédition |
| `SHIPPED` | Expédiée | Attendre livraison |
| `DELIVERED` | Livrée au client | Clôturer |
| `CANCELLED` | Annulée | Rembourser si payée |
| `FAILED` | Paiement échoué | Relancer paiement |
| `REFUNDED` | Remboursée | Archiver |

---

### 3.6 Journaux d'Audit et Sécurité

**Route** : `/admin/audit-logs`  
**Endpoint** : `GET /api/admin/audit-logs`

Les logs d'audit enregistrent **toutes les actions critiques** effectuées sur la plateforme.

**Actions Tracées** :

- ✓ Connexions/Déconnexions
- ✓ Modifications d'utilisateurs
- ✓ Changements de rôle
- ✓ Suspensions/Activations
- ✓ Modifications de missions
- ✓ Modifications de produits
- ✓ Annulations de commandes
- ✓ Remboursements

**Informations Enregistrées** :

| Champ | Description |
|-------|-------------|
| Utilisateur | Qui a effectué l'action |
| Action | Type d'action (CREATE, UPDATE, DELETE) |
| Ressource | Entité modifiée (User, Mission, Product, Order) |
| Détails | Données avant/après modification |
| IP | Adresse IP de l'utilisateur |
| Date/Heure | Timestamp précis |

**Filtres** :

- Par utilisateur
- Par type d'action
- Par ressource
- Par période

> **SECURITE** : Les logs d'audit sont immuables et ne peuvent pas être supprimés. Ils sont conservés indéfiniment pour conformité.

---

### 3.7 Statistiques et Analytiques

**Route** : `/admin/stats`  
**Endpoint** : `GET /api/admin/stats/overview`


#### Statistiques Utilisateurs

**Endpoint** : `GET /api/admin/stats/users`

- **Répartition par rôle** : Graphique circulaire
- **Évolution des inscriptions** : Graphique linéaire (30 derniers jours)
- **Taux d'activation** : % d'emails vérifiés
- **Utilisateurs actifs** : Connexions dans les 7 derniers jours
- **Taux de rétention** : % d'utilisateurs revenant après 30 jours

#### Statistiques Missions

**Endpoint** : `GET /api/admin/stats/missions`

- **Missions par statut** : Répartition actuelle
- **Taux de complétion** : % de missions terminées avec succès
- **Délai moyen de livraison** : Temps moyen entre création et livraison
- **Budget moyen** : Budget moyen par mission
- **Top transporteurs** : Classement par nombre de missions complétées

#### Statistiques Produits

**Endpoint** : `GET /api/admin/stats/products`

- **Produits les plus vendus** : Top 10
- **Valeur de l'inventaire** : Valeur totale du stock
- **Taux de rotation** : Vitesse de vente des produits
- **Produits en rupture** : Liste des produits à réapprovisionner
- **CA par catégorie** : Revenus par catégorie de produits

---

<a name="affreteur"></a>
## 4.  Guide Affreteur (Expéditeur)

Les affreteurs sont les **expéditeurs** qui créent des missions de transport pour leurs marchandises.

### 4.1 Dashboard Affreteur

**Route** : `/affreteur/dashboard`

**Écran : Dashboard Affreteur**

```
+----------------------------------------------------------+
|  Dashboard                                   Jean   |
+----------------------------------------------------------+
| Missions actives : 8                                     |
| Coût moyen : 35 000 FCFA                                |
| Économies ce mois : 12%                                  |
+----------------------------------------------------------+
| [+ Créer mission] [ Mes statistiques] [ Suivi GPS]  |
+----------------------------------------------------------+
|  Mes Missions Récentes                                |
| - Mission #M-001 | EN COURS | Yaoundé → Douala          |
| - Mission #M-002 | LIVRÉE | Douala → Bafoussam          |
| - Mission #M-003 | PUBLIÉE | Yaoundé → Garoua           |
+----------------------------------------------------------+
```

**Indicateurs Clés** :

- **Missions actives** : Nombre de missions en cours
- **Missions complétées** : Total des missions terminées
- **Coût moyen** : Budget moyen par mission
- **Économies** : Comparaison avec tarifs standards


---

### 4.2 Création de Missions

**Route** : `/affreteur/missions/create`  
**Endpoint** : `POST /api/affreteur/missions`

#### Étapes de Création

**1. Accéder au formulaire**

- Depuis le dashboard, cliquez sur **"+ Créer une mission"**
- Ou naviguez vers `Missions > Créer une mission`

**2. Remplir les détails de la mission**

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Titre | Nom de la mission | ✓ |
| Description | Détails de la marchandise | ✓ |
| Type de marchandise | Catégorie du cargo | ✓ |
| Poids (tonnes) | Poids total | ✓ |
| Volume (m³) | Volume total | ✓ |
| Adresse de départ | Point de collecte | ✓ |
| Adresse d'arrivée | Destination | ✓ |
| Date de départ estimée | Date/heure de collecte | ✓ |
| Date d'arrivée prévue | Date/heure de livraison | ✓ |
| Budget min (FCFA) | Budget minimum | ✓ |
| Budget max (FCFA) | Budget maximum | ✓ |
| Type de véhicule requis | Camion, Van, Moto, Voiture | ✓ |
| Dates flexibles | Autoriser ajustements | ✗ |
| Itinéraire flexible | Autoriser variations | ✗ |

**3. Utiliser le Calculateur de Prix Dynamique**

**Endpoint** : `POST /api/affreteur/pricing/calculate`

Avant de définir votre budget, utilisez le calculateur :

1. Cliquez sur **"Estimer le prix"**
2. Le système calcule automatiquement en fonction de :
   - **Distance** : Calculée via Google Maps
   - **Poids** : Facteur de charge
   - **Volume** : Espace nécessaire
   - **Type de véhicule** : Coût par type
   - **Urgence** : Délai de livraison
   - **Conditions routières** : État des routes

**Formule de Tarification** :

```
Prix = (Distance × Coef_Distance) + (Poids × Coef_Poids) + (Volume × Coef_Volume) 
       + Coef_Véhicule + Coef_Urgence + Coef_Route
```

**Exemple de Calcul** :

```
Mission : Yaoundé → Douala (250 km)
Poids : 2 tonnes
Volume : 5 m³
Véhicule : Camion
Délai : 2 jours

Prix estimé : 45 000 - 55 000 FCFA
```


**4. Sauvegarder en brouillon**

- Cliquez sur **"Sauvegarder comme brouillon"**
- La mission est créée avec le statut `DRAFT`
- Vous pouvez la modifier ultérieurement

**5. Publier la mission** (optionnel)

**Endpoint** : `POST /api/affreteur/missions/:id/publish`

Pour rendre la mission visible aux transporteurs :

1. Depuis la liste des missions, trouvez votre brouillon
2. Cliquez sur **"Publier"**
3. Le statut passe à `PUBLISHED`
4. La mission devient visible aux transporteurs
5. Un **code QR de livraison** est généré automatiquement
6. Un **lien de tracking GPS** est créé

> **ASTUCE** : Utilisez le calculateur de prix dynamique pour estimer un budget réaliste avant de créer la mission.

> **ATTENTION** : Une fois publiée, certains champs ne peuvent plus être modifiés (adresses, dates). Vérifiez bien les détails avant publication.

**Résultat Attendu** :

✓ Mission créée et sauvegardée  
✓ Visible dans "Mes missions"  
✓ Code QR généré (si publiée)  
✓ Lien de tracking créé (si publiée)  
✓ Notifications envoyées aux transporteurs (si publiée)

---

### 4.3 Gestion de Mes Missions

**Route** : `/affreteur/missions`  
**Endpoint** : `GET /api/affreteur/missions`

#### Voir Mes Missions

**Filtres Disponibles** :

- **Statut** : Tous, Brouillon, Publiée, Assignée, En cours, Livrée, Payée, Complétée
- **Date** : Période de création
- **Budget** : Plage de prix
- **Transporteur** : Filtrer par livreur assigné

**Actions Disponibles** :

| Action | Statuts Autorisés | Endpoint |
|--------|-------------------|----------|
|  Voir détails | Tous | `GET /api/affreteur/missions/:id` |
|  Modifier | DRAFT | `PUT /api/affreteur/missions/:id` |
|  Publier | DRAFT | `POST /api/affreteur/missions/:id/publish` |
|  Dépublier | PUBLISHED | `POST /api/affreteur/missions/:id/unpublish` |
|  Marquer comme payé | DELIVERED | `POST /api/affreteur/missions/:id/mark-as-paid` |
| ✓ Compléter | PAID | `POST /api/affreteur/missions/:id/complete` |
|  Supprimer | DRAFT | `DELETE /api/affreteur/missions/:id` |


#### Modifier une Mission

**Endpoint** : `PUT /api/affreteur/missions/:id`

>  **RESTRICTION** : Seules les missions en statut `DRAFT` peuvent être modifiées.

**Étapes** :

1. Accédez à **Mes missions**
2. Trouvez la mission en brouillon
3. Cliquez sur **"Modifier"**
4. Mettez à jour les champs souhaités
5. Cliquez sur **"Sauvegarder"**

#### Dépublier une Mission

**Endpoint** : `POST /api/affreteur/missions/:id/unpublish`

Si vous souhaitez retirer une mission publiée :

1. Accédez à **Mes missions**
2. Trouvez la mission publiée (statut `PUBLISHED`)
3. Cliquez sur **"Dépublier"**
4. Confirmez l'action
5. Le statut repasse à `DRAFT`

>  **NOTE** : Vous ne pouvez dépublier que les missions non encore assignées à un transporteur.

---

### 4.4 Suivi des Expéditions

#### Code QR de Livraison

**Endpoint** : `GET /api/affreteur/missions/:id/qr-code`

Chaque mission publiée génère automatiquement un **code QR unique** pour la validation de livraison.

**Utilisation** :

1. Accédez aux **détails de la mission**
2. Téléchargez le **code QR**
3. Imprimez-le ou envoyez-le au destinataire
4. À la livraison, le transporteur scanne le code QR
5. La livraison est automatiquement validée

**Régénérer le Code QR** :

**Endpoint** : `POST /api/affreteur/missions/:id/regenerate-qr`

Si le code QR est compromis :

1. Cliquez sur **"Régénérer le code QR"**
2. Un nouveau code est généré
3. L'ancien code est invalidé

> **SECURITE** : Le code QR contient un token unique crypté. Il ne peut être utilisé qu'une seule fois.

#### Historique de Localisation

**Endpoint** : `GET /api/affreteur/missions/:id/locations`

Visualisez l'historique complet des positions GPS du transporteur :

1. Accédez aux **détails de la mission**
2. Cliquez sur **"Historique GPS"**
3. Visualisez la carte avec le trajet complet
4. Consultez les timestamps de chaque position

**Informations Affichées** :

-  Position GPS (latitude, longitude)
-  Timestamp précis
-  Vitesse instantanée
-  Distance parcourue
- ⏱ ETA (temps d'arrivée estimé)


#### Suivi GPS Temps Réel

**Route** : `/affreteur/tracking`  
**Endpoint** : `GET /api/affreteur/missions/active-locations`

Suivez toutes vos missions actives en temps réel sur une carte interactive :

1. Accédez à **Suivi GPS**
2. Visualisez toutes vos missions en cours sur la carte
3. Cliquez sur un marqueur pour voir les détails
4. Les positions se mettent à jour automatiquement (toutes les 30 secondes)

**Carte Interactive** :

```
+----------------------------------------------------------+
|  Suivi GPS Temps Réel                                 |
+----------------------------------------------------------+
|                                                          |
|     Mission #M-001 (Yaoundé → Douala)                 |
|       Position actuelle : Édéa                           |
|       Vitesse : 65 km/h                                  |
|       ETA : 45 minutes                                   |
|                                                          |
|     Mission #M-003 (Douala → Bafoussam)               |
|       Position actuelle : Nkongsamba                     |
|       Vitesse : 50 km/h                                  |
|       ETA : 2h 15min                                     |
|                                                          |
+----------------------------------------------------------+
```

> **ASTUCE** : Activez les notifications push pour être alerté en temps réel des changements de statut et des problèmes signalés.

---

### 4.5 Feedback et Évaluations

#### Évaluer un Transporteur

**Endpoint** : `POST /api/affreteur/missions/:id/feedback`

Après la livraison, évaluez la performance du transporteur :

**Étapes** :

1. Accédez à **Mes missions > Mission livrée**
2. Cliquez sur **"Évaluer le transporteur"**
3. Remplissez le formulaire :

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Note globale | 1 à 5 étoiles | ✓ |
| Ponctualité | 1 à 5 étoiles | ✓ |
| Communication | 1 à 5 étoiles | ✓ |
| État de la marchandise | 1 à 5 étoiles | ✓ |
| Commentaire | Texte libre | ✗ |
| Recommanderiez-vous ? | Oui/Non | ✓ |

4. Cliquez sur **"Soumettre l'évaluation"**

**Résultat** :

✓ Feedback enregistré  
✓ Note du transporteur mise à jour  
✓ Visible dans le profil du transporteur  
✓ Utilisé pour les recommandations futures

> **ASTUCE** : Les évaluations honnêtes aident à améliorer la qualité du service et à identifier les meilleurs transporteurs.


#### Signaler des Problèmes

**Endpoint** : `GET /api/affreteur/missions/:id/issues`

Si vous constatez un problème pendant la mission :

1. Accédez aux **détails de la mission**
2. Consultez la section **"Problèmes signalés"**
3. Visualisez les incidents rapportés par le transporteur
4. Accusez réception : `POST /api/affreteur/missions/:id/issues/:issueId/acknowledge`
5. Marquez comme résolu : `POST /api/affreteur/missions/:id/issues/:issueId/resolve`

**Types de Problèmes** :

-  Problème routier (accident, barrage, route bloquée)
-  Problème véhicule (panne, crevaison)
-  Problème marchandise (dommage, perte)
-  Problème adresse (adresse incorrecte, destinataire absent)
- ⏰ Retard (délai non respecté)
-  Autre (à préciser)

---

### 4.6 Gestion Budgétaire et Paiements

#### Marquer une Mission comme Payée

**Endpoint** : `POST /api/affreteur/missions/:id/mark-as-paid`

Après la livraison, confirmez le paiement au transporteur :

**Étapes** :

1. Accédez à **Mes missions > Mission livrée**
2. Vérifiez que la marchandise est bien livrée
3. Cliquez sur **"Marquer comme payé"**
4. Saisissez les détails du paiement :
   - Montant payé (FCFA)
   - Méthode de paiement (Espèces, Mobile Money, Virement)
   - Référence de transaction (optionnel)
5. Confirmez le paiement

**Résultat** :

✓ Statut passe à `PAID`  
✓ Notification envoyée au transporteur  
✓ Mission prête à être complétée  
✓ Enregistrement dans l'historique financier

#### Compléter une Mission

**Endpoint** : `POST /api/affreteur/missions/:id/complete`

Une fois le paiement effectué et tout vérifié :

1. Cliquez sur **"Compléter la mission"**
2. Confirmez la clôture
3. Le statut passe à `COMPLETED`
4. La mission est archivée

>  **NOTE** : Une mission complétée ne peut plus être modifiée. Assurez-vous que tout est en ordre avant de la clôturer.

---

### 4.7 Fonctionnalités E-commerce

> **REFERENCE** : Les affreteurs ont accès à toutes les fonctionnalités e-commerce. Voir [Section 6 : Fonctionnalités Communes](#communes) pour :
> - Boutique et catalogue produits
> - Panier d'achat
> - Gestion des commandes
> - Paiements MTN Mobile Money
> - Messagerie instantanée
> - Notifications temps réel


---

<a name="transporteur"></a>
## 5.  Guide Transporteur (Chauffeur)

Les transporteurs sont les **livreurs** qui acceptent et exécutent les missions de transport.

### 5.1 Dashboard Transporteur

**Route** : `/transporteur/dashboard`

**Écran : Dashboard Transporteur**

```
+----------------------------------------------------------+
|  Dashboard                                 Pierre   |
+----------------------------------------------------------+
| Missions actives : 3                                     |
| Missions complétées : 47                                 |
| Revenus ce mois : 850 000 FCFA                          |
| Note moyenne : ***** (4.8/5)                          |
+----------------------------------------------------------+
| [ Missions disponibles] [ Ma flotte] [ Revenus]   |
+----------------------------------------------------------+
|  Mes Missions en Cours                                |
| - Mission #M-015 | EN COURS | Yaoundé → Douala          |
| - Mission #M-018 | ASSIGNÉE | Douala → Limbé            |
| - Mission #M-021 | PRÊTE | Yaoundé → Bafoussam          |
+----------------------------------------------------------+
```

**Indicateurs Clés** :

- **Missions actives** : Nombre de missions en cours
- **Missions complétées** : Total des missions terminées
- **Revenus** : Gains du mois en cours
- **Note moyenne** : Évaluation par les affreteurs
- **Taux de réussite** : % de missions complétées sans incident

---

### 5.2 Gestion de la Flotte

**Route** : `/transporteur/vehicles`  
**Endpoint** : `GET /api/transporteur/vehicles`

#### Ajouter un Véhicule

**Endpoint** : `POST /api/transporteur/vehicles`

**Étapes** :

1. Accédez à **Ma flotte**
2. Cliquez sur **"+ Ajouter un véhicule"**
3. Remplissez le formulaire :

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Type | Camion, Camionnette, Moto, Voiture | ✓ |
| Immatriculation | Numéro de plaque | ✓ |
| Description | Détails du véhicule | ✗ |
| Statut | Disponible, En mission, Maintenance, Inactif | ✓ |

4. Cliquez sur **"Ajouter"**

**Types de Véhicules** :

| Type | Icône | Capacité Typique | Usage |
|------|-------|------------------|-------|
| Camion | `TRUCK` | 5-20 tonnes | Gros volumes, longues distances |
| Camionnette | `VAN` | 1-3 tonnes | Volumes moyens, livraisons urbaines |
| Moto | `MOTORCYCLE` | < 100 kg | Petits colis, livraisons rapides |
| Voiture | `CAR` | < 500 kg | Documents, petits colis |


#### Statuts des Véhicules

| Statut | Description | Peut Accepter Missions |
|--------|-------------|:----------------------:|
| ✓ `AVAILABLE` | Disponible pour missions | ✓ |
|  `IN_MISSION` | Actuellement en mission | ✗ |
|  `MAINTENANCE` | En maintenance | ✗ |
| ⏸ `INACTIVE` | Inactif temporairement | ✗ |

**Mettre à Jour le Statut** :

**Endpoint** : `PUT /api/transporteur/vehicles/:id/status`

1. Accédez à **Ma flotte**
2. Sélectionnez un véhicule
3. Cliquez sur **"Changer le statut"**
4. Sélectionnez le nouveau statut
5. Sauvegardez

> **ASTUCE** : Mettez vos véhicules en maintenance pour éviter qu'ils soient proposés pour de nouvelles missions.

---

### 5.3 Découverte et Acceptation de Missions

#### Parcourir les Missions Disponibles

**Route** : `/transporteur/missions/available`  
**Endpoint** : `GET /api/transporteur/missions/available`

**Filtres Disponibles** :

- **Type de véhicule** : Filtrer par type requis
- **Localisation** : Missions près de vous
- **Budget** : Plage de rémunération
- **Date** : Période de départ
- **Distance** : Rayon de recherche

**Informations Affichées** :

```
+----------------------------------------------------------+
|  Mission #M-025                                        |
+----------------------------------------------------------+
| Titre : Transport de matériel électronique              |
| Affreteur : Jean Dupont ***** (4.9/5)                |
|                                                          |
|  Départ : Yaoundé, Quartier Bastos                    |
|  Arrivée : Douala, Akwa                               |
|  Distance : 250 km                                     |
|                                                          |
|  Marchandise : Électronique                           |
|  Poids : 1.5 tonnes                                   |
|  Volume : 3 m³                                         |
|                                                          |
|  Véhicule requis : Camionnette (VAN)                  |
|  Départ : 15/12/2024 à 08:00                          |
|  Arrivée : 15/12/2024 à 14:00                         |
|                                                          |
|  Budget : 40 000 - 50 000 FCFA                        |
|                                                          |
| [ Voir détails] [✓ Réclamer cette mission]           |
+----------------------------------------------------------+
```


#### Réclamer une Mission

**Endpoint** : `POST /api/transporteur/missions/:id/claim`

**Étapes** :

1. Parcourez les **missions disponibles**
2. Sélectionnez une mission qui vous intéresse
3. Cliquez sur **"Voir détails"** pour plus d'informations
4. Vérifiez que vous avez un véhicule disponible du bon type
5. Cliquez sur **"Réclamer cette mission"**
6. **Sélectionnez le véhicule** que vous utiliserez (obligatoire)
7. Confirmez l'acceptation

**Résultat Attendu** :

✓ Mission assignée à vous  
✓ Statut passe à `ASSIGNED`  
✓ Véhicule passe en statut `IN_MISSION`  
✓ Notification envoyée à l'affreteur  
✓ Lien de tracking GPS activé  
✓ Code PIN de tracking généré

> **ATTENTION** : Une fois une mission réclamée, vous vous engagez à la réaliser. L'annulation impacte votre note.

> **ASTUCE** : Utilisez le calculateur de prix pour vérifier que le budget proposé est rentable pour vous.

---

### 5.4 Exécution de Missions

#### Mettre à Jour le Statut

**Endpoint** : `PUT /api/transporteur/missions/:id/status`

**Workflow d'Exécution** :

```
ASSIGNED → READY_TO_START → IN_PROGRESS → DELIVERED
```

**1. Prêt à Démarrer** (`READY_TO_START`)

Quand vous êtes prêt à commencer :

1. Accédez à **Mes missions**
2. Sélectionnez la mission assignée
3. Cliquez sur **"Prêt à démarrer"**
4. Confirmez

**2. Démarrer la Mission** (`IN_PROGRESS`)

Quand vous commencez le transport :

1. Cliquez sur **"Démarrer la mission"**
2. Le chronomètre démarre
3. Le suivi GPS s'active automatiquement
4. Commencez à envoyer votre position

**3. Marquer comme Livrée** (`DELIVERED`)

À l'arrivée :

1. Cliquez sur **"Marquer comme livrée"**
2. Scannez le **code QR de livraison** (si disponible)
3. Téléchargez les **preuves de livraison** (photos, signature)
4. Confirmez la livraison


#### Envoyer la Localisation GPS

**Endpoint** : `POST /api/transporteur/missions/:id/location`

**Méthodes d'Envoi** :

**A. Via l'Application Web** (Automatique)

1. Autorisez l'accès à votre localisation dans le navigateur
2. L'application envoie automatiquement votre position toutes les 30 secondes
3. Vous pouvez voir votre position sur la carte

**B. Via le Lien de Tracking** (Pour chauffeurs sans compte)

**Endpoint** : `POST /track/:token/location`

1. L'affreteur vous envoie un **lien de tracking unique**
2. Cliquez sur le lien : `https://tsa-innovlab.com/track/ABC123XYZ`
3. Entrez le **code PIN** fourni (6 chiffres)
4. Autorisez l'accès à votre localisation
5. Votre position est envoyée automatiquement

**Données Envoyées** :

```json
{
  "latitude": 3.8480,
  "longitude": 11.5021,
  "speed": 65.5,
  "heading": 180,
  "accuracy": 10,
  "timestamp": "2024-12-15T10:30:00Z"
}
```

> **ASTUCE** : Gardez votre GPS activé pendant toute la mission pour un suivi optimal.

#### Télécharger les Preuves de Livraison

**Endpoint** : `POST /api/transporteur/missions/:id/proof`

**Types de Preuves Acceptées** :

-  **Photos** : Marchandise livrée, lieu de livraison
-  **Signature** : Signature du destinataire (capture d'écran ou photo)
-  **Documents** : Bon de livraison signé (PDF, image)

**Étapes** :

1. À la livraison, prenez des photos de la marchandise
2. Demandez la signature du destinataire
3. Dans l'application, cliquez sur **"Ajouter une preuve"**
4. Téléchargez les fichiers (max 5 fichiers, 10 MB chacun)
5. Ajoutez un commentaire (optionnel)
6. Validez

**Résultat** :

✓ Preuves enregistrées  
✓ Visibles par l'affreteur  
✓ Archivées pour référence future  
✓ Protection en cas de litige

> **SECURITE** : Les preuves de livraison sont horodatées et géolocalisées automatiquement.

---

### 5.5 Suivi et Codes QR

#### Authentification par Code QR

**Endpoint** : `GET /delivery-proof`

Le code QR fourni par l'affreteur permet de valider la livraison instantanément.

**Utilisation** :

1. À l'arrivée, demandez le **code QR** au destinataire
2. Scannez le code avec votre smartphone
3. La livraison est automatiquement validée
4. Le statut passe à `DELIVERED`

**Avantages** :

✓ Validation instantanée  
✓ Pas de saisie manuelle  
✓ Sécurisé (token unique)  
✓ Horodatage automatique


#### Signaler des Problèmes

**Endpoint** : `POST /track/:token/report-issue`

Si vous rencontrez un problème pendant la mission :

**Étapes** :

1. Accédez aux **détails de la mission**
2. Cliquez sur **"Signaler un problème"**
3. Sélectionnez le **type de problème** :
   -  Problème routier
   -  Problème véhicule
   -  Problème marchandise
   -  Problème adresse
   - ⏰ Retard
   -  Autre
4. Décrivez le problème en détail
5. Ajoutez des photos si nécessaire
6. Envoyez le rapport

**Résultat** :

✓ Problème enregistré  
✓ Notification envoyée à l'affreteur  
✓ Visible dans l'historique de la mission  
✓ Protection en cas de litige

> **ASTUCE** : Signalez les problèmes dès qu'ils surviennent pour maintenir une communication transparente avec l'affreteur.

---

### 5.6 Calcul de Revenus

**Route** : `/transporteur/earnings`

**Écran : Mes Revenus**

```
+----------------------------------------------------------+
|  Mes Revenus                                           |
+----------------------------------------------------------+
| Ce mois : 850 000 FCFA                                   |
| Mois dernier : 720 000 FCFA                              |
| Évolution : +18%                                        |
+----------------------------------------------------------+
|  Répartition                                           |
| - Missions complétées : 23                               |
| - Revenu moyen/mission : 36 956 FCFA                     |
| - Distance totale : 3 450 km                             |
| - Revenu/km : 246 FCFA                                   |
+----------------------------------------------------------+
|  Graphique des Revenus (12 derniers mois)             |
| [Graphique linéaire]                                     |
+----------------------------------------------------------+
|  Objectifs                                             |
| Objectif mensuel : 1 000 000 FCFA                       |
| Progression : 85%                              |
| Reste à faire : 150 000 FCFA (4 missions)               |
+----------------------------------------------------------+
```

**Statistiques Disponibles** :

- **Revenus mensuels** : Total et évolution
- **Revenus par mission** : Moyenne et détails
- **Revenus par kilomètre** : Rentabilité
- **Missions complétées** : Nombre et taux de réussite
- **Prévisions** : Estimation fin de mois

---

### 5.7 Fonctionnalités E-commerce

> **REFERENCE** : Les transporteurs ont accès à toutes les fonctionnalités e-commerce. Voir [Section 6 : Fonctionnalités Communes](#communes) pour :
> - Boutique et catalogue produits
> - Panier d'achat
> - Gestion des commandes
> - Paiements MTN Mobile Money
> - Messagerie instantanée
> - Notifications temps réel


---

<a name="communes"></a>
## 6.  Fonctionnalités Communes

Cette section documente les fonctionnalités accessibles à **tous les rôles** (sauf mention contraire).

>  **NOTE** : Ces fonctionnalités sont identiques pour les rôles AFFRETEUR, TRANSPORTEUR et CLIENT. Les ADMIN n'ont pas accès à la boutique e-commerce.

---

### 6.1 Boutique E-commerce

**Route** : `/shop`  
**Endpoint** : `GET /api/shop/products`

#### Parcourir le Catalogue

**Écran : Boutique**

```
+----------------------------------------------------------+
|  Boutique TSA InnovLab                     [Recherche] |
+----------------------------------------------------------+
| Catégories : [Toutes] [Moteur] [Freinage] [Électrique]  |
| Filtres : Prix | Stock | Nouveautés | Promotions        |
+----------------------------------------------------------+
|  Alternateur Reconditionné                            |
| ***** (4.8/5) - 127 avis                            |
| Prix : 45 000 FCFA                                       |
| Stock : 12 disponibles                                   |
| [ Ajouter au panier] [ Détails]                    |
+----------------------------------------------------------+
|  Kit de Freinage Complet                              |
| ***** (4.2/5) - 89 avis                             |
| Prix : 65 000 FCFA                                       |
| Stock : 5 disponibles                                    |
| [ Ajouter au panier] [ Détails]                    |
+----------------------------------------------------------+
```

**Filtres Disponibles** :

| Filtre | Options |
|--------|---------|
| Catégorie | Toutes, Moteur, Freinage, Électrique, Carrosserie, etc. |
| Prix | Min - Max (FCFA) |
| Stock | En stock uniquement |
| Tri | Pertinence, Prix croissant, Prix décroissant, Nouveautés, Meilleures ventes |

#### Catégories et Filtres

**Endpoint** : `GET /api/shop/categories`

**Arbre des Catégories** :

```
 Boutique
  Moteur
    Alternateurs
    Démarreurs
    Filtres
  Freinage
    Plaquettes
    Disques
    Kits complets
  Électrique
    Batteries
    Câblage
    Capteurs
  Carrosserie
     Pare-chocs
     Rétroviseurs
     Phares
```


#### Recherche de Produits

**Endpoint** : `GET /api/shop/search`

**Types de Recherche** :

**A. Recherche Textuelle**

1. Saisissez des mots-clés dans la barre de recherche
2. Exemples : "alternateur", "kit freinage", "batterie 12V"
3. Les résultats s'affichent instantanément

**B. Recherche Visuelle par IA**

**Endpoint** : `POST /api/shop/visual-recognition/search`

> **IA** : Recherchez un produit en téléchargeant une photo !

**Étapes** :

1. Cliquez sur l'icône ** Recherche par image**
2. Téléchargez une photo de la pièce recherchée
3. L'IA analyse l'image et identifie le produit
4. Les produits similaires s'affichent avec un score de correspondance

**Exemple** :

```
Photo téléchargée : [Image d'un alternateur]

Résultats :
1. Alternateur Bosch 12V - 95% de correspondance
2. Alternateur Valeo 12V - 87% de correspondance
3. Alternateur Denso 12V - 82% de correspondance
```

> **ASTUCE** : Prenez une photo claire sur fond neutre pour de meilleurs résultats.

#### Recommandations de Produits

**Endpoint** : `GET /api/shop/product-recommendations`

**Types de Recommandations** :

**A. Recommandations Personnalisées**

Basées sur votre historique d'achats et de navigation :

1. Accédez à **Boutique > Recommandations**
2. Visualisez les produits suggérés pour vous
3. L'algorithme ML apprend de vos préférences

**B. Produits Similaires**

**Endpoint** : `GET /api/shop/product-recommendations/similar/:id`

Sur la page d'un produit :

1. Consultez la section **"Produits similaires"**
2. Découvrez des alternatives et compléments
3. Comparez les prix et caractéristiques

**C. Produits Populaires**

**Endpoint** : `GET /api/shop/product-recommendations/popular`

1. Accédez à **Boutique > Meilleures ventes**
2. Découvrez les produits les plus achetés
3. Profitez des choix de la communauté

---

### 6.2 Panier d'Achat

**Route** : `/shop/cart`  
**Endpoint** : `GET /api/client/cart`

#### Ajouter au Panier

**Endpoint** : `POST /api/client/cart/items`

**Étapes** :

1. Sur la page d'un produit, cliquez sur **" Ajouter au panier"**
2. Sélectionnez la **quantité** (si applicable)
3. Le produit est ajouté instantanément
4. Une notification confirme l'ajout


#### Gérer le Panier

**Écran : Mon Panier**

```
+----------------------------------------------------------+
|  Mon Panier (3 articles)                              |
+----------------------------------------------------------+
|  Alternateur Bosch 12V                                |
| Prix unitaire : 45 000 FCFA                             |
| Quantité : [1] [+] [-]                                  |
| Sous-total : 45 000 FCFA                                |
| [ Retirer]                                            |
+----------------------------------------------------------+
|  Kit de Freinage Complet                              |
| Prix unitaire : 65 000 FCFA                             |
| Quantité : [2] [+] [-]                                  |
| Sous-total : 130 000 FCFA                               |
| [ Retirer]                                            |
+----------------------------------------------------------+
|  Batterie 12V 70Ah                                    |
| Prix unitaire : 85 000 FCFA                             |
| Quantité : [1] [+] [-]                                  |
| Sous-total : 85 000 FCFA                                |
| [ Retirer]                                            |
+----------------------------------------------------------+
| Sous-total : 260 000 FCFA                               |
| Frais de livraison : 5 000 FCFA                         |
| TVA (19.25%) : 51 012 FCFA                              |
| TOTAL : 316 012 FCFA                                    |
+----------------------------------------------------------+
| [ Vider le panier] [✓ Passer commande]              |
+----------------------------------------------------------+
```

**Actions Disponibles** :

- **Modifier la quantité** : `PUT /api/client/cart/items/:id`
- **Retirer un article** : `DELETE /api/client/cart/items/:id`
- **Vider le panier** : `DELETE /api/client/cart`

> **ASTUCE** : Votre panier est sauvegardé automatiquement. Vous pouvez revenir plus tard pour finaliser votre commande.

---

### 6.3 Gestion des Commandes

#### Passer une Commande

**Endpoint** : `POST /api/client/orders`

**Étapes** :

1. Depuis votre panier, cliquez sur **"✓ Passer commande"**
2. Vérifiez les articles et quantités
3. Sélectionnez ou ajoutez une **adresse de livraison**
4. Sélectionnez ou ajoutez une **adresse de facturation**
5. Choisissez le **mode de paiement** :
   -  MTN Mobile Money
   -  Orange Money (à venir)
   -  Paiement à la livraison (si disponible)
6. Vérifiez le récapitulatif
7. Cliquez sur **"Confirmer la commande"**

**Résultat** :

✓ Commande créée avec un numéro unique (ex: ORD-202412-0001)  
✓ Statut initial : `PENDING`  
✓ Redirection vers la page de paiement  
✓ Email de confirmation envoyé


#### Suivre une Commande

**Route** : `/shop/orders`  
**Endpoint** : `GET /api/client/orders`

**Écran : Mes Commandes**

```
+----------------------------------------------------------+
|  Mes Commandes                                         |
+----------------------------------------------------------+
| Commande #ORD-202412-0001                               |
| Date : 15/12/2024                                        |
| Statut :  SHIPPED (Expédiée)                          |
| Total : 316 012 FCFA                                     |
| Suivi : TRK-ABC123                                       |
| [ Détails] [ Suivre]                               |
+----------------------------------------------------------+
| Commande #ORD-202412-0002                               |
| Date : 10/12/2024                                        |
| Statut : ✓ DELIVERED (Livrée)                          |
| Total : 125 000 FCFA                                     |
| [ Détails] [ Facture]                              |
+----------------------------------------------------------+
```

**Statuts de Commande** :

| Statut | Icône | Description |
|--------|-------|-------------|
| `PENDING` | ⏳ | En attente de paiement |
| `PAID` |  | Paiement confirmé |
| `PROCESSING` |  | En préparation |
| `SHIPPED` |  | Expédiée |
| `DELIVERED` | ✓ | Livrée |
| `CANCELLED` | ✗ | Annulée |
| `REFUNDED` |  | Remboursée |

#### Annuler une Commande

**Endpoint** : `POST /api/client/orders/:id/cancel`

>  **RESTRICTION** : Vous ne pouvez annuler que les commandes en statut `PENDING` ou `PAID`.

**Étapes** :

1. Accédez à **Mes commandes**
2. Sélectionnez la commande à annuler
3. Cliquez sur **"Annuler la commande"**
4. Saisissez la **raison de l'annulation**
5. Confirmez

**Résultat** :

✓ Commande annulée  
✓ Remboursement initié (si déjà payée)  
✓ Email de confirmation envoyé  
✓ Stock des produits restauré

---

### 6.4 Paiements MTN Mobile Money

**Endpoint** : `POST /api/client/payments/initiate`

#### Initier un Paiement

**Étapes** :

1. Après avoir confirmé votre commande, vous êtes redirigé vers la page de paiement
2. Sélectionnez **"MTN Mobile Money"**
3. Saisissez votre **numéro de téléphone MTN** (format : 237XXXXXXXXX)
4. Cliquez sur **"Payer maintenant"**
5. Vous recevez une **notification USSD** sur votre téléphone
6. Entrez votre **code PIN MTN** pour confirmer
7. Le paiement est traité en temps réel


**Résultat** :

✓ Paiement confirmé  
✓ Statut de la commande passe à `PAID`  
✓ Email de confirmation envoyé  
✓ Préparation de la commande démarrée

**Vérifier le Statut du Paiement** :

**Endpoint** : `GET /api/client/payments/:id/status`

Si le paiement prend du temps :

1. Accédez à **Mes commandes > Détails de la commande**
2. Consultez la section **"Paiement"**
3. Le statut s'affiche : `PENDING`, `COMPLETED`, `FAILED`

> **ASTUCE** : En cas d'échec, vous pouvez réessayer le paiement depuis la page de la commande.

---

### 6.5 Messagerie Instantanée

**Route** : `/chat`  
**Endpoint** : `GET /api/common/conversations`

#### Types de Conversations

**A. Conversations Directes**

**Endpoint** : `POST /api/common/conversations/direct`

Pour discuter avec un autre utilisateur :

1. Accédez à **Messagerie**
2. Cliquez sur **"+ Nouvelle conversation"**
3. Recherchez l'utilisateur : `GET /api/common/conversations/search-users`
4. Sélectionnez le destinataire
5. Commencez à discuter

**B. Conversations de Mission**

**Endpoint** : `POST /api/common/conversations/mission`

Chaque mission crée automatiquement une conversation entre l'affreteur et le transporteur :

1. Accédez aux **détails de la mission**
2. Cliquez sur **" Discuter"**
3. La conversation s'ouvre automatiquement
4. Échangez sur les détails de la mission

**Écran : Messagerie**

```
+----------------------------------------------------------+
|  Messagerie                                            |
+----------------------------------------------------------+
| Conversations                    | Chat avec Jean       |
|                                  |                       |
|  Mission #M-025               | Jean Dupont           |
|    Jean Dupont                   | En ligne              |
|    Il y a 2 min                  |                       |
|                                  | Bonjour, je suis     |
|  Pierre Martin                | prêt à démarrer      |
|    Nouveau message               | la mission.          |
|    Il y a 1h                     |                       |
|                                  | Vous: Parfait !      |
|  Marie Kouam                  | Bonne route.         |
|    Merci pour la livraison       |                       |
|    Il y a 3h                     | [Envoyer un message] |
+----------------------------------------------------------+
```


#### Envoyer un Message

**Endpoint** : `POST /api/common/conversations/:conversationId/messages`

**Étapes** :

1. Ouvrez une conversation
2. Saisissez votre message dans le champ de texte
3. Appuyez sur **Entrée** ou cliquez sur **"Envoyer"**
4. Le message est envoyé instantanément

**Fonctionnalités** :

- ✓ Messages en temps réel (WebSocket)
- ✓ Indicateur de saisie ("Jean est en train d'écrire...")
- ✓ Statut de lecture (lu/non lu)
- ✓ Horodatage des messages
- ✓ Historique complet

#### Marquer comme Lu

**Endpoint** : `PUT /api/common/messages/:id/read`

Les messages sont automatiquement marqués comme lus quand vous ouvrez la conversation.

**Marquer tous les messages comme lus** :

**Endpoint** : `PUT /api/common/conversations/:conversationId/messages/read-all`

1. Ouvrez la conversation
2. Cliquez sur **"Tout marquer comme lu"**
3. Tous les messages non lus sont marqués

**Compteur de Messages Non Lus** :

**Endpoint** : `GET /api/common/messages/unread-count`

Le badge de notification affiche le nombre total de messages non lus.

---

### 6.6 Notifications Temps Réel

**Route** : `/notifications`  
**Endpoint** : `GET /api/common/notifications`

#### Types de Notifications

| Type | Icône | Exemple |
|------|-------|---------|
| Mission |  | "Votre mission #M-025 a été acceptée" |
| Commande |  | "Votre commande #ORD-001 a été expédiée" |
| Paiement |  | "Paiement de 50 000 FCFA reçu" |
| Message |  | "Nouveau message de Jean Dupont" |
| Système |  | "Mise à jour de sécurité disponible" |
| Alerte |  | "Problème signalé sur mission #M-025" |

#### Niveaux de Priorité

| Priorité | Badge | Description |
|----------|-------|-------------|
| `LOW` | ℹ | Information générale |
| `MEDIUM` | ● | Action recommandée |
| `HIGH` | ▲ | Action requise |
| `URGENT` | ⚠ | Action immédiate |


#### Gérer les Notifications

**Écran : Centre de Notifications**

```
+----------------------------------------------------------+
|  Notifications (12 non lues)                          |
+----------------------------------------------------------+
| [Tout marquer comme lu] [Paramètres]                    |
+----------------------------------------------------------+
| ⚠ URGENT - Il y a 5 min                                |
|  Problème signalé sur Mission #M-025                  |
| Le transporteur a signalé un retard de 30 minutes       |
| [Voir détails] [Marquer comme lu]                       |
+----------------------------------------------------------+
| ● MEDIUM - Il y a 15 min                               |
|  Nouveau message de Pierre Martin                     |
| "Bonjour, j'ai une question sur la mission..."          |
| [Répondre] [Marquer comme lu]                           |
+----------------------------------------------------------+
| ℹ LOW - Il y a 1h                                      |
|  Votre commande #ORD-001 a été expédiée              |
| Numéro de suivi : TRK-XYZ789                            |
| [Suivre] [Marquer comme lu]                             |
+----------------------------------------------------------+
```

**Actions** :

- **Marquer comme lu** : `PUT /api/common/notifications/:id/read`
- **Tout marquer comme lu** : `PUT /api/common/notifications/read-all`
- **Filtrer** : Par type, priorité, date
- **Rechercher** : Recherche textuelle

**Statistiques** :

**Endpoint** : `GET /api/common/notifications/stats`

- Total de notifications
- Non lues
- Par type
- Par priorité

> **ASTUCE** : Configurez vos préférences de notifications dans **Paramètres > Notifications** pour choisir quels types d'alertes vous souhaitez recevoir.

---

### 6.7 Gestion d'Adresses

**Endpoint** : `GET /api/common/addresses`

#### Ajouter une Adresse

**Endpoint** : `POST /api/common/addresses`

**Étapes** :

1. Accédez à **Paramètres > Mes adresses**
2. Cliquez sur **"+ Ajouter une adresse"**
3. Remplissez le formulaire :

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Nom | Libellé (ex: "Bureau", "Domicile") | ✓ |
| Rue | Adresse complète | ✓ |
| Ville | Ville | ✓ |
| Code postal | Code postal | ✗ |
| Pays | Pays (défaut : Cameroun) | ✓ |
| Téléphone | Numéro de contact | ✓ |
| Instructions | Indications supplémentaires | ✗ |
| Par défaut | Adresse par défaut | ✗ |

4. Cliquez sur **"Sauvegarder"**

**Résultat** :

✓ Adresse enregistrée  
✓ Disponible pour missions et commandes  
✓ Géocodée automatiquement (latitude/longitude)


#### Modifier/Supprimer une Adresse

**Modifier** : `PUT /api/common/addresses/:id`  
**Supprimer** : `DELETE /api/common/addresses/:id`

1. Accédez à **Mes adresses**
2. Sélectionnez l'adresse à modifier
3. Cliquez sur **"Modifier"** ou **"Supprimer"**
4. Effectuez les modifications
5. Sauvegardez

> **ATTENTION** : Vous ne pouvez pas supprimer une adresse utilisée dans une mission ou commande active.

---

### 6.8 Profil Utilisateur

**Route** : `/profile`  
**Endpoint** : `GET /api/auth/me`

#### Voir Mon Profil

**Informations Affichées** :

- **Informations personnelles** : Nom, prénom, email, téléphone
- **Rôle** : Votre rôle sur la plateforme
- **Statut du compte** : Actif, En attente, Suspendu
- **Date d'inscription** : Date de création du compte
- **Email vérifié** : Statut de vérification
- **MFA activé** : Statut de l'authentification multi-facteurs
- **Dernière connexion** : Date et heure

#### Modifier Mon Profil

**Endpoint** : `PUT /api/auth/profile`

**Champs Modifiables** :

- Prénom
- Nom
- Téléphone
- Photo de profil (à venir)

**Étapes** :

1. Accédez à **Mon profil**
2. Cliquez sur **"Modifier"**
3. Mettez à jour les champs souhaités
4. Cliquez sur **"Sauvegarder"**

>  **NOTE** : Vous ne pouvez pas modifier votre email ou votre rôle. Contactez un administrateur si nécessaire.

#### Changer de Mot de Passe

**Endpoint** : `PUT /api/auth/change-password`

**Étapes** :

1. Accédez à **Paramètres > Sécurité**
2. Cliquez sur **"Changer le mot de passe"**
3. Saisissez votre **mot de passe actuel**
4. Saisissez le **nouveau mot de passe** (min. 8 caractères)
5. Confirmez le nouveau mot de passe
6. Cliquez sur **"Mettre à jour"**

**Résultat** :

✓ Mot de passe mis à jour  
✓ Toutes les sessions actives sont révoquées (sauf la session actuelle)  
✓ Email de confirmation envoyé

> **SECURITE** : Utilisez un mot de passe fort avec majuscules, minuscules, chiffres et caractères spéciaux.

---

<a name="suivi"></a>
## 7.  Suivi et Localisation GPS

### 7.1 Suivi Temps Réel des Missions

Le système de suivi GPS permet de suivre les missions en temps réel avec une précision de quelques mètres.

#### Pour les Affreteurs

**Endpoint** : `GET /api/affreteur/missions/active-locations`

1. Accédez à **Suivi GPS**
2. Visualisez toutes vos missions actives sur une carte Google Maps
3. Les marqueurs se mettent à jour automatiquement
4. Cliquez sur un marqueur pour voir les détails


#### Pour les Transporteurs

**Endpoint** : `GET /api/transporteur/missions/active-locations`

1. Accédez à **Mes missions > Suivi**
2. Visualisez vos missions en cours
3. Votre position est envoyée automatiquement
4. Suivez votre progression sur la carte

#### Pour les Administrateurs

**Route** : `/admin/tracking`

1. Accédez à **Suivi GPS Global**
2. Visualisez **toutes les missions actives** de la plateforme
3. Filtrez par affreteur, transporteur, statut
4. Intervenez en cas de problème

---

### 7.2 Mises à Jour de Localisation

#### Fréquence d'Envoi

- **Automatique** : Toutes les 30 secondes (si GPS activé)
- **Manuel** : Bouton "Envoyer ma position"
- **Événements** : Changement de statut, signalement de problème

#### Données Transmises

```json
{
  "latitude": 3.8480,
  "longitude": 11.5021,
  "speed": 65.5,
  "heading": 180,
  "accuracy": 10,
  "altitude": 750,
  "timestamp": "2024-12-15T10:30:00Z"
}
```

**Informations Calculées** :

- **Distance parcourue** : Calculée entre chaque point
- **Vitesse moyenne** : Moyenne sur les 10 dernières positions
- **ETA** : Temps d'arrivée estimé basé sur la vitesse et la distance restante
- **Trajet** : Ligne reliant toutes les positions

---

### 7.3 Cartes Interactives (Google Maps)

#### Fonctionnalités de la Carte

**Contrôles Disponibles** :

-  **Zoom** : Molette de la souris ou boutons +/-
-  **Déplacement** : Cliquer-glisser
-  **Type de carte** : Route, Satellite, Hybride
-  **Centrer** : Centrer sur une mission spécifique
-  **Ma position** : Centrer sur votre position actuelle

**Marqueurs** :

- ○ **Départ** : Point de collecte
- ⚠ **Arrivée** : Point de livraison
- ℹ **Position actuelle** : Position du transporteur
- ● **Problème** : Incident signalé

**Ligne de Trajet** :

- **Trajet prévu** : Ligne pointillée grise
- **Trajet parcouru** : Ligne continue bleue
- **Trajet restant** : Ligne pointillée rouge


---

### 7.4 Historique de Trajet

**Endpoint** : `GET /api/affreteur/missions/:id/locations`

#### Consulter l'Historique Complet

Après la livraison, vous pouvez consulter l'historique complet du trajet :

**Étapes** :

1. Accédez aux **détails de la mission**
2. Cliquez sur **"Historique GPS"**
3. La carte affiche le trajet complet avec tous les points GPS
4. Consultez le tableau des positions avec timestamps

**Écran : Historique de Trajet**

```
+----------------------------------------------------------+
|  Historique GPS - Mission #M-025                      |
+----------------------------------------------------------+
| [Carte avec trajet complet]                              |
|                                                          |
| ○ Départ : Yaoundé, Bastos (08:00)                     |
|  Édéa (09:45)                                          |
|  Nkongsamba (11:30)                                    |
| ⚠ Arrivée : Douala, Akwa (13:15)                       |
+----------------------------------------------------------+
|  Statistiques du Trajet                               |
| Distance totale : 247 km                                 |
| Durée totale : 5h 15min                                  |
| Vitesse moyenne : 47 km/h                                |
| Vitesse maximale : 85 km/h                               |
| Arrêts : 2 (durée totale : 35 min)                      |
+----------------------------------------------------------+
```


**Données Disponibles** :

| Information | Description |
|-------------|-------------|
| Position GPS | Latitude, longitude de chaque point |
| Timestamp | Date et heure précise |
| Vitesse | Vitesse instantanée en km/h |
| Direction | Cap en degrés (0-360°) |
| Précision | Précision GPS en mètres |
| Altitude | Altitude en mètres |

**Export des Données** :

**Endpoint** : `GET /api/affreteur/missions/:id/locations/export`

1. Cliquez sur **"Exporter"**
2. Choisissez le format : CSV, JSON, KML (Google Earth)
3. Téléchargez le fichier

> **ASTUCE** : Le format KML permet de visualiser le trajet dans Google Earth pour une analyse détaillée.


---

### 7.5 Calcul d'ETA (Temps d'Arrivée Estimé)

**Endpoint** : `GET /api/affreteur/missions/:id/eta`

#### Comment l'ETA est Calculé

L'ETA (Estimated Time of Arrival) est calculé en temps réel en fonction de plusieurs facteurs :

**Facteurs Pris en Compte** :

1. **Distance restante** : Calculée via Google Maps Distance Matrix API
2. **Vitesse actuelle** : Vitesse moyenne sur les 10 dernières minutes
3. **Conditions de trafic** : Données en temps réel de Google Maps
4. **Historique** : Vitesse moyenne sur des trajets similaires
5. **Arrêts** : Temps d'arrêt moyen observé

**Formule de Calcul** :

```
ETA = Position_Actuelle + (Distance_Restante / Vitesse_Moyenne) + Temps_Arrêts_Estimé + Marge_Trafic
```

**Exemple de Calcul** :

```
Position actuelle : Édéa
Destination : Douala (120 km restants)
Vitesse moyenne : 60 km/h
Trafic : Modéré (+15 min)
Arrêts estimés : 1 arrêt (10 min)

ETA = Maintenant + (120/60)h + 15min + 10min
    = Maintenant + 2h 25min
    = 13:45
```


**Précision de l'ETA** :

| Situation | Précision |
|-----------|-----------|
| Autoroute, trafic fluide | ±5 minutes |
| Route nationale, trafic modéré | ±15 minutes |
| Zone urbaine, trafic dense | ±30 minutes |
| Conditions météo difficiles | ±45 minutes |

**Mises à Jour de l'ETA** :

- L'ETA est recalculé automatiquement toutes les 2 minutes
- Une notification est envoyée si l'ETA change de plus de 30 minutes
- L'affreteur peut voir l'évolution de l'ETA dans l'historique

> **ASTUCE** : L'ETA devient plus précis au fur et à mesure que le transporteur se rapproche de la destination.

---

<a name="tarification"></a>
## 8.  Système de Tarification Dynamique

Le système de tarification dynamique calcule automatiquement le prix optimal d'une mission en fonction de multiples facteurs.

### 8.1 Facteurs de Tarification

**Endpoint** : `POST /api/affreteur/pricing/calculate`


#### Facteurs Principaux

| Facteur | Poids | Description |
|---------|-------|-------------|
| **Distance** | 40% | Distance entre départ et arrivée (via Google Maps) |
| **Poids** | 20% | Poids total de la marchandise en tonnes |
| **Volume** | 15% | Volume total en m³ |
|  **Type de véhicule** | 15% | Coût d'exploitation par type |
| **Urgence** | 5% | Délai de livraison (express, standard, économique) |
| **Etat des routes** | 5% | Qualité des routes sur le trajet |

#### Coefficients par Type de Véhicule

| Type | Coût de Base | Coût/km | Coût/tonne | Coût/m³ |
|------|--------------|---------|------------|---------|
| Moto | 5 000 FCFA | 50 FCFA | 1 000 FCFA | 500 FCFA |
| Voiture | 10 000 FCFA | 100 FCFA | 2 000 FCFA | 1 000 FCFA |
| Camionnette | 20 000 FCFA | 150 FCFA | 3 000 FCFA | 1 500 FCFA |
| Camion | 40 000 FCFA | 200 FCFA | 4 000 FCFA | 2 000 FCFA |


#### Coefficients d'Urgence

| Délai | Multiplicateur | Description |
|-------|----------------|-------------|
| ⚠ Express (< 24h) | ×1.5 | Livraison urgente |
| ● Standard (1-3 jours) | ×1.0 | Délai normal |
| ○ Économique (> 3 jours) | ×0.8 | Pas de contrainte de temps |

---

### 8.2 Calculateur de Prix

#### Utiliser le Calculateur

**Étapes** :

1. Lors de la création d'une mission, cliquez sur **"Estimer le prix"**
2. Le système récupère automatiquement les données de votre formulaire
3. Le calcul s'effectue en temps réel
4. Le résultat affiche une fourchette de prix

**Écran : Calculateur de Prix**

```
+----------------------------------------------------------+
|  Estimation de Prix                                    |
+----------------------------------------------------------+
| Trajet : Yaoundé → Douala                               |
| Distance : 250 km                                        |
| Poids : 2 tonnes                                         |
| Volume : 5 m³                                            |
| Véhicule : Camionnette                                   |
| Urgence : Standard                                       |
+----------------------------------------------------------+
|  Détail du Calcul                                     |
| Base véhicule : 20 000 FCFA                             |
| Distance (250 km × 150) : 37 500 FCFA                   |
| Poids (2 t × 3 000) : 6 000 FCFA                        |
| Volume (5 m³ × 1 500) : 7 500 FCFA                      |
| Urgence (×1.0) : 0 FCFA                                 |
| État routes (+5%) : 3 550 FCFA                          |
+----------------------------------------------------------+
| TOTAL ESTIMÉ : 74 550 FCFA                              |
| Fourchette recommandée : 70 000 - 80 000 FCFA          |
+----------------------------------------------------------+
| [Appliquer au formulaire] [Recalculer]                  |
+----------------------------------------------------------+
```


**Résultat du Calcul** :

- **Prix estimé** : Prix calculé selon la formule
- **Fourchette recommandée** : ±10% pour attirer les transporteurs
- **Budget min suggéré** : Prix estimé - 10%
- **Budget max suggéré** : Prix estimé + 10%

> **ASTUCE** : Une fourchette trop étroite peut limiter le nombre de transporteurs intéressés. Une fourchette de 15-20% est optimale.

---

### 8.3 Configuration Tarifaire (Admin)

**Route** : `/admin/pricing-config`  
**Endpoint** : `GET /api/admin/pricing/config`

Les administrateurs peuvent ajuster les coefficients de tarification.

#### Modifier les Coefficients

**Endpoint** : `PUT /api/admin/pricing/config`

**Paramètres Configurables** :

- Coût de base par type de véhicule
- Coût par kilomètre
- Coût par tonne
- Coût par m³
- Multiplicateurs d'urgence
- Coefficient d'état des routes
- Marge de la plateforme (%)


**Étapes** :

1. Accédez à **Administration > Configuration tarifaire**
2. Modifiez les coefficients souhaités
3. Testez avec le simulateur intégré
4. Cliquez sur **"Sauvegarder"**
5. Les nouveaux tarifs s'appliquent immédiatement

> **ATTENTION** : Les modifications de tarification affectent uniquement les nouvelles missions. Les missions existantes conservent leur budget initial.

**Historique des Modifications** :

**Endpoint** : `GET /api/admin/pricing/history`

Toutes les modifications de configuration sont tracées :

- Date et heure de modification
- Utilisateur ayant effectué la modification
- Anciens et nouveaux coefficients
- Raison de la modification

---

<a name="chatbot"></a>
## 9. 🤖 Chatbot IA et Assistance

Le chatbot IA intégré offre une assistance contextuelle 24/7 pour tous les utilisateurs.

> **NOTE** : Le chatbot utilise l'IA pour comprendre vos questions en langage naturel et fournir des réponses personnalisées selon votre rôle.


### 9.1 Utilisation du Chatbot

**Route** : `/chatbot`  
**Endpoint** : `POST /api/chatbot/chat`

#### Accéder au Chatbot

**Méthodes d'Accès** :

1. **Icône flottante** : Cliquez sur l'icône 🤖 en bas à droite de chaque page
2. **Menu** : Accédez à **Assistance > Chatbot IA**
3. **Raccourci clavier** : `Ctrl + Shift + C` (Windows) ou `Cmd + Shift + C` (Mac)

**Écran : Chatbot IA**

```
+----------------------------------------------------------+
| 🤖 Assistant IA TSA InnovLab                            |
+----------------------------------------------------------+
| Bonjour Jean ! Comment puis-je vous aider aujourd'hui ? |
|                                                          |
| Suggestions :                                            |
| • Comment créer une mission ?                           |
| • Où sont mes missions en cours ?                       |
| • Comment suivre une livraison ?                        |
| • Quel est le prix estimé pour Yaoundé-Douala ?        |
+----------------------------------------------------------+
| [Tapez votre question...]                    [Envoyer]  |
+----------------------------------------------------------+
```


#### Poser une Question

**Étapes** :

1. Ouvrez le chatbot
2. Tapez votre question en langage naturel
3. Appuyez sur **Entrée** ou cliquez sur **"Envoyer"**
4. Le chatbot analyse votre question et répond en quelques secondes

**Exemples de Questions** :

**Pour les Affreteurs** :
- "Comment créer une nouvelle mission ?"
- "Quel est le prix pour transporter 3 tonnes de Yaoundé à Douala ?"
- "Où est mon transporteur actuellement ?"
- "Comment évaluer un transporteur ?"

**Pour les Transporteurs** :
- "Quelles missions sont disponibles près de moi ?"
- "Comment ajouter un nouveau véhicule ?"
- "Comment signaler un problème sur une mission ?"
- "Combien j'ai gagné ce mois ?"

**Pour les Clients** :
- "Comment passer une commande ?"
- "Où est ma commande #ORD-001 ?"
- "Comment payer avec Mobile Money ?"
- "Comment annuler une commande ?"


#### Fonctionnalités Avancées

**A. Actions Directes**

Le chatbot peut effectuer des actions pour vous :

- **Créer une mission** : "Crée une mission de Yaoundé à Douala"
- **Rechercher des produits** : "Trouve-moi des alternateurs"
- **Vérifier le statut** : "Quel est le statut de ma mission #M-025 ?"
- **Calculer un prix** : "Estime le prix pour 2 tonnes sur 300 km"

**B. Réponses Contextuelles**

Le chatbot adapte ses réponses selon :

- **Votre rôle** : Admin, Affreteur, Transporteur, Client
- **Votre historique** : Missions récentes, commandes en cours
- **La page actuelle** : Contexte de navigation
- **Vos préférences** : Langue, unités de mesure

**C. Suggestions Intelligentes**

Le chatbot propose des suggestions basées sur :

- Questions fréquentes de votre rôle
- Actions courantes à cette étape
- Problèmes potentiels détectés
- Opportunités (missions disponibles, promotions)


---

### 9.2 Historique de Conversations

**Endpoint** : `GET /api/chatbot/history`

#### Consulter l'Historique

Toutes vos conversations avec le chatbot sont sauvegardées :

**Étapes** :

1. Ouvrez le chatbot
2. Cliquez sur **"Historique"** (icône )
3. Parcourez vos conversations passées
4. Cliquez sur une conversation pour la rouvrir

**Fonctionnalités** :

- ✓ Recherche dans l'historique
- ✓ Filtrage par date
- ✓ Export des conversations (PDF, TXT)
- ✓ Suppression de conversations

> **ASTUCE** : L'historique est utile pour retrouver des informations ou des instructions données précédemment par le chatbot.

---

### 9.3 Requêtes Contextuelles

Le chatbot comprend le contexte de votre navigation et peut répondre à des questions relatives à la page actuelle.


**Exemples de Contexte** :

**Sur la page d'une mission** :
- "Quel est le statut de cette mission ?"
- "Où est le transporteur ?"
- "Combien de temps reste-t-il ?"

**Sur la page d'un produit** :
- "Ce produit est-il en stock ?"
- "Quels sont les produits similaires ?"
- "Quel est le délai de livraison ?"

**Sur le dashboard** :
- "Combien de missions actives j'ai ?"
- "Quel est mon chiffre d'affaires ce mois ?"
- "Quelles sont mes missions en retard ?"

**Avantages** :

✓ Pas besoin de préciser le contexte  
✓ Réponses instantanées  
✓ Navigation guidée  
✓ Aide contextuelle

> **IA** : Le chatbot utilise l'apprentissage automatique pour améliorer ses réponses au fil du temps.

---

<a name="notifications"></a>
## 10.  Notifications et Alertes

> **NOTE** : Cette section complète la section 6.6 avec des détails supplémentaires sur la configuration et la gestion avancée des notifications.


### 10.1 Configuration des Notifications

**Route** : `/settings/notifications`  
**Endpoint** : `GET /api/common/notification-preferences`

#### Préférences de Notifications

**Étapes** :

1. Accédez à **Paramètres > Notifications**
2. Configurez vos préférences par type de notification
3. Choisissez les canaux de réception
4. Définissez les horaires de réception
5. Sauvegardez vos préférences

**Écran : Préférences de Notifications**

```
+----------------------------------------------------------+
|  Préférences de Notifications                         |
+----------------------------------------------------------+
| Type de Notification    | Web | Email | SMS | Push     |
|-------------------------|-----|-------|-----|----------|
|  Missions             | ✓  | ✓    | ✗  | ✓       |
|  Commandes            | ✓  | ✓    | ✗  | ✓       |
|  Paiements            | ✓  | ✓    | ✓  | ✓       |
|  Messages             | ✓  | ✗    | ✗  | ✓       |
|  Système              | ✓  | ✓    | ✗  | ✗       |
|  Alertes urgentes     | ✓  | ✓    | ✓  | ✓       |
+----------------------------------------------------------+
| Horaires de Réception                                    |
| Ne pas déranger : 22:00 - 07:00                         |
| [Modifier]                                               |
+----------------------------------------------------------+
| [Sauvegarder] [Réinitialiser]                           |
+----------------------------------------------------------+
```


**Canaux de Notification** :

| Canal | Description | Disponibilité |
|-------|-------------|---------------|
|  **Web** | Notifications dans l'application | Toujours actif |
|  **Email** | Notifications par email | Configurable |
|  **SMS** | Notifications par SMS (payant) | Sur demande |
|  **Push** | Notifications push navigateur | Configurable |

**Modifier les Préférences** :

**Endpoint** : `PUT /api/common/notification-preferences`

1. Cochez/décochez les canaux souhaités
2. Ajustez les horaires de réception
3. Cliquez sur **"Sauvegarder"**

> **ASTUCE** : Activez les notifications SMS uniquement pour les alertes urgentes pour éviter les frais.

---

### 10.2 Notifications de Mission

**Types de Notifications Mission** :

| Événement | Affreteur | Transporteur | Priorité |
|-----------|:---------:|:------------:|:--------:|
| Mission publiée | ✓ | ✓ (si correspond) | ● MEDIUM |
| Mission réclamée | ✓ | ✓ | ● MEDIUM |
| Mission démarrée | ✓ | ✓ | ● MEDIUM |
| Problème signalé | ✓ | ✓ | ⚠ URGENT |
| Mission livrée | ✓ | ✓ | ● MEDIUM |
| Paiement reçu | ✗ | ✓ | ○ LOW |
| Mission complétée | ✓ | ✓ | ○ LOW |
| ETA modifié (>30min) | ✓ | ✗ | ▲ HIGH |


---

### 10.3 Notifications de Paiement

**Types de Notifications Paiement** :

| Événement | Destinataire | Priorité |
|-----------|--------------|:--------:|
| Paiement initié | Client | ● MEDIUM |
| Paiement réussi | Client, Vendeur | ○ LOW |
| Paiement échoué | Client | ⚠ URGENT |
| Remboursement initié | Client | ● MEDIUM |
| Remboursement effectué | Client | ○ LOW |

**Exemple de Notification** :

```
 Paiement Réussi

Votre paiement de 316 012 FCFA pour la commande #ORD-202412-0001 
a été confirmé avec succès.

Référence : PAY-XYZ789
Méthode : MTN Mobile Money
Date : 15/12/2024 à 14:30

Votre commande est maintenant en préparation.

[Voir la commande] [Télécharger le reçu]
```

---

### 10.4 Alertes Système

**Types d'Alertes Système** :

-  **Sécurité** : Connexion depuis un nouvel appareil, tentative de connexion échouée
-  **Mises à jour** : Nouvelles fonctionnalités, maintenance planifiée
-  **Problèmes** : Service temporairement indisponible, erreurs système
-  **Rapports** : Rapports mensuels, statistiques hebdomadaires


**Alertes de Sécurité** :

```
 Nouvelle Connexion Détectée

Une connexion à votre compte a été détectée depuis un nouvel appareil :

Appareil : Chrome sur Windows
Localisation : Yaoundé, Cameroun
Adresse IP : 197.xxx.xxx.xxx
Date : 15/12/2024 à 10:30

Si ce n'est pas vous, changez immédiatement votre mot de passe.

[C'était moi] [Sécuriser mon compte]
```

> **SECURITE** : Les alertes de sécurité sont toujours envoyées par email, même si vous avez désactivé les notifications email.

---

<a name="faq"></a>
## 11.  Questions Fréquentes (FAQ)

### 11.1 Questions Générales

**Q1 : Comment créer un compte sur TSA InnovLab ?**

R : Accédez à la page d'inscription, remplissez le formulaire avec vos informations (email, mot de passe, nom, téléphone, rôle), puis vérifiez votre email en cliquant sur le lien reçu.

**Q2 : J'ai oublié mon mot de passe, que faire ?**

R : Cliquez sur "Mot de passe oublié ?" sur la page de connexion, saisissez votre email, et suivez les instructions reçues par email pour réinitialiser votre mot de passe.


**Q3 : Comment activer l'authentification multi-facteurs (MFA) ?**

R : Accédez à Paramètres > Sécurité, cliquez sur "Activer MFA", scannez le QR code avec votre application d'authentification (Google Authenticator, Microsoft Authenticator, Authy), et sauvegardez les codes de récupération.

**Q4 : Puis-je changer mon rôle après inscription ?**

R : Non, vous ne pouvez pas changer votre rôle vous-même. Contactez un administrateur si vous avez besoin de modifier votre rôle.

**Q5 : Comment contacter le support ?**

R : Utilisez le chatbot IA (icône 🤖 en bas à droite), envoyez un email à support@tsa-innovlab.com, ou appelez le +237 XXX XXX XXX.

---

### 11.2 Questions Affreteurs

**Q6 : Comment créer une mission de transport ?**

R : Accédez à "Créer une mission", remplissez tous les champs obligatoires (départ, arrivée, poids, volume, budget, etc.), sauvegardez en brouillon ou publiez directement.

**Q7 : Comment estimer le prix d'une mission ?**

R : Utilisez le calculateur de prix intégré lors de la création de mission. Il calcule automatiquement le prix en fonction de la distance, du poids, du volume et du type de véhicule.


**Q8 : Puis-je modifier une mission après publication ?**

R : Non, une fois publiée, une mission ne peut plus être modifiée. Vous pouvez la dépublier (si non assignée) pour la repasser en brouillon et la modifier.

**Q9 : Comment suivre ma mission en temps réel ?**

R : Accédez à "Suivi GPS" pour voir toutes vos missions actives sur une carte. La position du transporteur se met à jour automatiquement toutes les 30 secondes.

**Q10 : Que faire si le transporteur signale un problème ?**

R : Vous recevrez une notification. Accédez aux détails de la mission, consultez le problème signalé, et contactez le transporteur via la messagerie pour trouver une solution.

**Q11 : Comment évaluer un transporteur ?**

R : Après la livraison, cliquez sur "Évaluer le transporteur", attribuez des notes (1-5 étoiles) pour la ponctualité, la communication et l'état de la marchandise, et ajoutez un commentaire optionnel.

---

### 11.3 Questions Transporteurs

**Q12 : Comment trouver des missions disponibles ?**

R : Accédez à "Missions disponibles", utilisez les filtres (type de véhicule, localisation, budget, date) pour trouver des missions qui vous conviennent.


**Q13 : Comment accepter une mission ?**

R : Trouvez une mission qui vous intéresse, cliquez sur "Voir détails", vérifiez que vous avez un véhicule disponible du bon type, puis cliquez sur "Réclamer cette mission" et sélectionnez le véhicule à utiliser.

**Q14 : Comment envoyer ma position GPS ?**

R : Autorisez l'accès à votre localisation dans le navigateur. L'application enverra automatiquement votre position toutes les 30 secondes pendant la mission.

**Q15 : Comment signaler un problème pendant une mission ?**

R : Accédez aux détails de la mission, cliquez sur "Signaler un problème", sélectionnez le type (routier, véhicule, marchandise, adresse, retard, autre), décrivez le problème et ajoutez des photos si nécessaire.

**Q16 : Comment télécharger les preuves de livraison ?**

R : À la livraison, cliquez sur "Ajouter une preuve", téléchargez des photos de la marchandise livrée et la signature du destinataire (max 5 fichiers, 10 MB chacun).

**Q17 : Comment ajouter un véhicule à ma flotte ?**

R : Accédez à "Ma flotte", cliquez sur "+ Ajouter un véhicule", remplissez le formulaire (type, immatriculation, description, statut) et sauvegardez.


---

### 11.4 Questions E-commerce

**Q18 : Comment passer une commande ?**

R : Parcourez le catalogue, ajoutez des produits à votre panier, cliquez sur "Passer commande", sélectionnez vos adresses de livraison et facturation, choisissez le mode de paiement et confirmez.

**Q19 : Quels modes de paiement sont acceptés ?**

R : Actuellement, nous acceptons MTN Mobile Money. Orange Money et le paiement à la livraison seront bientôt disponibles.

**Q20 : Comment payer avec MTN Mobile Money ?**

R : Sélectionnez "MTN Mobile Money", saisissez votre numéro de téléphone MTN, cliquez sur "Payer maintenant", et confirmez le paiement avec votre code PIN MTN sur votre téléphone.

**Q21 : Puis-je annuler une commande ?**

R : Oui, vous pouvez annuler une commande en statut PENDING ou PAID. Accédez à "Mes commandes", sélectionnez la commande, cliquez sur "Annuler" et indiquez la raison.

**Q22 : Comment utiliser la recherche visuelle par IA ?**

R : Cliquez sur l'icône  "Recherche par image", téléchargez une photo de la pièce recherchée, et l'IA affichera les produits similaires avec un score de correspondance.


---

### 11.5 Problèmes Courants et Solutions

**Problème 1 : Je ne reçois pas l'email de vérification**

**Solutions** :
- Vérifiez votre dossier spam/courrier indésirable
- Vérifiez que l'adresse email est correcte
- Demandez un nouvel envoi depuis la page de connexion
- Contactez le support si le problème persiste

**Problème 2 : Le paiement Mobile Money échoue**

**Solutions** :
- Vérifiez que votre solde est suffisant
- Vérifiez que votre numéro MTN est correct (format : 237XXXXXXXXX)
- Assurez-vous d'avoir entré le bon code PIN
- Réessayez après quelques minutes
- Contactez MTN si le problème persiste

**Problème 3 : Ma position GPS ne s'envoie pas**

**Solutions** :
- Autorisez l'accès à la localisation dans votre navigateur
- Vérifiez que le GPS est activé sur votre appareil
- Assurez-vous d'avoir une connexion Internet stable
- Rechargez la page et réautorisez l'accès
- Utilisez le lien de tracking alternatif si nécessaire


**Problème 4 : Je ne peux pas publier ma mission**

**Solutions** :
- Vérifiez que tous les champs obligatoires sont remplis
- Assurez-vous que le budget min < budget max
- Vérifiez que la date d'arrivée est après la date de départ
- Vérifiez que les adresses sont valides
- Consultez les messages d'erreur affichés

**Problème 5 : Le chatbot ne répond pas**

**Solutions** :
- Vérifiez votre connexion Internet
- Rechargez la page
- Essayez de reformuler votre question
- Contactez le support si le problème persiste

---

<a name="support"></a>
## 12.  Support et Contact

### 12.1 Contacter le Support

**Méthodes de Contact** :

| Canal | Disponibilité | Temps de Réponse |
|-------|---------------|------------------|
| 🤖 Chatbot IA | 24/7 | Instantané |
|  Email | 24/7 | < 24h |
|  Téléphone | Lun-Ven 8h-18h | Immédiat |
|  Messagerie | 24/7 | < 2h |


**Coordonnées** :

- **Email** : support@tsa-innovlab.com
- **Téléphone** : +237 XXX XXX XXX
- **Adresse** : Yaoundé, Cameroun
- **Site Web** : https://tsa-innovlab.com
- **Réseaux Sociaux** :
  - Facebook : @TSAInnovLab
  - Twitter : @TSAInnovLab
  - LinkedIn : TSA InnovLab

---

### 12.2 Signaler un Bug

**Route** : `/support/report-bug`  
**Endpoint** : `POST /api/support/bug-report`

**Étapes** :

1. Accédez à **Support > Signaler un bug**
2. Remplissez le formulaire :
   - Titre du bug
   - Description détaillée
   - Étapes pour reproduire
   - Comportement attendu vs observé
   - Captures d'écran (optionnel)
   - Navigateur et système d'exploitation
3. Cliquez sur **"Envoyer"**

**Résultat** :

✓ Ticket créé avec un numéro unique  
✓ Email de confirmation envoyé  
✓ Suivi du ticket dans votre espace  
✓ Notification lors de la résolution


---

### 12.3 Demander une Fonctionnalité

**Route** : `/support/feature-request`  
**Endpoint** : `POST /api/support/feature-request`

Vous avez une idée pour améliorer TSA InnovLab ?

**Étapes** :

1. Accédez à **Support > Demander une fonctionnalité**
2. Remplissez le formulaire :
   - Titre de la fonctionnalité
   - Description détaillée
   - Cas d'usage
   - Bénéfices attendus
   - Priorité (basse, moyenne, haute)
3. Cliquez sur **"Soumettre"**

**Processus** :

1. Votre demande est évaluée par l'équipe produit
2. Vous recevez un retour sous 7 jours
3. Si approuvée, la fonctionnalité est ajoutée à la roadmap
4. Vous êtes notifié lors de l'implémentation

> **ASTUCE** : Votez pour les demandes de fonctionnalités existantes pour augmenter leur priorité.

---

<a name="glossaire"></a>
## 13.  Glossaire

### Termes Généraux

**Affreteur** : Expéditeur ou client logistique qui crée des missions de transport pour expédier ses marchandises.


**Transporteur** : Chauffeur ou livreur qui accepte et exécute des missions de transport.

**Mission** : Tâche de transport de marchandises d'un point A à un point B.

**QR Code** : Code-barres 2D utilisé pour valider les livraisons de manière sécurisée.

**ETA** : Estimated Time of Arrival - Temps d'arrivée estimé.

**GPS** : Global Positioning System - Système de positionnement par satellite.

**MFA** : Multi-Factor Authentication - Authentification multi-facteurs pour sécuriser les comptes.

**API** : Application Programming Interface - Interface de programmation permettant la communication entre systèmes.

**WebSocket** : Protocole de communication bidirectionnelle en temps réel.

**IA** : Intelligence Artificielle - Technologie utilisée pour le chatbot et les recommandations.

**ML** : Machine Learning - Apprentissage automatique pour améliorer les recommandations produits.

---

### Statuts de Mission

**DRAFT** : Mission en brouillon, non visible aux transporteurs.

**PUBLISHED** : Mission publiée et visible aux transporteurs.

**ASSIGNED** : Mission attribuée à un transporteur spécifique.


**READY_TO_START** : Transporteur prêt à démarrer la mission.

**IN_PROGRESS** : Mission en cours d'exécution, transport en route.

**DELIVERED** : Marchandise livrée au destinataire.

**PAID** : Paiement effectué par l'affreteur au transporteur.

**COMPLETED** : Mission terminée et clôturée.

**CANCELLED** : Mission annulée avant ou pendant l'exécution.

---

### Statuts de Commande

**PENDING** : Commande créée, en attente de paiement.

**PAID** : Paiement confirmé, commande en préparation.

**PROCESSING** : Commande en cours de préparation.

**SHIPPED** : Commande expédiée, en transit.

**DELIVERED** : Commande livrée au client.

**CANCELLED** : Commande annulée par le client ou le système.

**FAILED** : Paiement échoué, commande non traitée.

**REFUNDED** : Commande remboursée au client.

---

### Types de Véhicules

**TRUCK** : Camion - Pour gros volumes et longues distances (5-20 tonnes).

**VAN** : Camionnette - Pour volumes moyens et livraisons urbaines (1-3 tonnes).


**MOTORCYCLE** : Moto - Pour petits colis et livraisons rapides (< 100 kg).

**CAR** : Voiture - Pour documents et petits colis (< 500 kg).

---

### Termes Techniques

**Token** : Jeton d'authentification permettant l'accès sécurisé aux ressources.

**Access Token** : Token de courte durée (15 min) pour authentifier les requêtes.

**Refresh Token** : Token de longue durée (7 jours) pour renouveler l'Access Token.

**Endpoint** : Point d'accès API pour effectuer une action spécifique.

**Payload** : Données envoyées dans une requête API.

**Response** : Réponse renvoyée par le serveur après une requête.

**Cache** : Mémoire temporaire pour accélérer l'accès aux données fréquentes.

**Webhook** : Notification automatique envoyée lors d'un événement.

**CORS** : Cross-Origin Resource Sharing - Mécanisme de sécurité pour les requêtes cross-domain.

**JWT** : JSON Web Token - Format de token d'authentification.

---

<a name="annexes"></a>
## 14.  Annexes

### 14.1 Référence API

**Base URL** : `https://api.tsa-innovlab.com`


#### Endpoints Principaux

**Authentification** :
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Renouveler le token
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialiser le mot de passe
- `POST /api/auth/verify-email` - Vérifier l'email
- `GET /api/auth/me` - Profil utilisateur

**MFA** :
- `POST /api/auth/mfa/initialize` - Initialiser MFA
- `POST /api/auth/mfa/enable` - Activer MFA
- `POST /api/auth/mfa/disable` - Désactiver MFA
- `POST /api/auth/mfa/regenerate-codes` - Régénérer codes de récupération

**Missions (Affreteur)** :
- `GET /api/affreteur/missions` - Lister mes missions
- `POST /api/affreteur/missions` - Créer une mission
- `GET /api/affreteur/missions/:id` - Détails d'une mission
- `PUT /api/affreteur/missions/:id` - Modifier une mission
- `DELETE /api/affreteur/missions/:id` - Supprimer une mission
- `POST /api/affreteur/missions/:id/publish` - Publier une mission
- `POST /api/affreteur/missions/:id/unpublish` - Dépublier une mission
- `POST /api/affreteur/missions/:id/mark-as-paid` - Marquer comme payé
- `POST /api/affreteur/missions/:id/complete` - Compléter une mission
- `GET /api/affreteur/missions/:id/qr-code` - Code QR de livraison
- `GET /api/affreteur/missions/:id/locations` - Historique GPS
- `POST /api/affreteur/missions/:id/feedback` - Évaluer le transporteur


**Missions (Transporteur)** :
- `GET /api/transporteur/missions/available` - Missions disponibles
- `GET /api/transporteur/missions` - Mes missions
- `POST /api/transporteur/missions/:id/claim` - Réclamer une mission
- `PUT /api/transporteur/missions/:id/status` - Mettre à jour le statut
- `POST /api/transporteur/missions/:id/location` - Envoyer la position GPS
- `POST /api/transporteur/missions/:id/proof` - Télécharger preuve de livraison
- `GET /api/transporteur/earnings` - Mes revenus

**Véhicules** :
- `GET /api/transporteur/vehicles` - Lister mes véhicules
- `POST /api/transporteur/vehicles` - Ajouter un véhicule
- `PUT /api/transporteur/vehicles/:id` - Modifier un véhicule
- `DELETE /api/transporteur/vehicles/:id` - Supprimer un véhicule
- `PUT /api/transporteur/vehicles/:id/status` - Changer le statut

**Boutique** :
- `GET /api/shop/products` - Lister les produits
- `GET /api/shop/products/:id` - Détails d'un produit
- `GET /api/shop/search` - Rechercher des produits
- `POST /api/shop/visual-recognition/search` - Recherche visuelle par IA
- `GET /api/shop/categories` - Lister les catégories
- `GET /api/shop/product-recommendations` - Recommandations personnalisées
- `GET /api/shop/product-recommendations/similar/:id` - Produits similaires
- `GET /api/shop/product-recommendations/popular` - Produits populaires


**Panier** :
- `GET /api/client/cart` - Voir mon panier
- `POST /api/client/cart/items` - Ajouter au panier
- `PUT /api/client/cart/items/:id` - Modifier la quantité
- `DELETE /api/client/cart/items/:id` - Retirer du panier
- `DELETE /api/client/cart` - Vider le panier

**Commandes** :
- `GET /api/client/orders` - Mes commandes
- `POST /api/client/orders` - Passer une commande
- `GET /api/client/orders/:id` - Détails d'une commande
- `POST /api/client/orders/:id/cancel` - Annuler une commande

**Paiements** :
- `POST /api/client/payments/initiate` - Initier un paiement
- `GET /api/client/payments/:id/status` - Statut du paiement

**Messagerie** :
- `GET /api/common/conversations` - Mes conversations
- `POST /api/common/conversations/direct` - Créer conversation directe
- `POST /api/common/conversations/mission` - Créer conversation de mission
- `GET /api/common/conversations/search-users` - Rechercher des utilisateurs
- `POST /api/common/conversations/:id/messages` - Envoyer un message
- `PUT /api/common/messages/:id/read` - Marquer comme lu
- `PUT /api/common/conversations/:id/messages/read-all` - Tout marquer comme lu
- `GET /api/common/messages/unread-count` - Nombre de messages non lus


**Notifications** :
- `GET /api/common/notifications` - Mes notifications
- `PUT /api/common/notifications/:id/read` - Marquer comme lu
- `PUT /api/common/notifications/read-all` - Tout marquer comme lu
- `GET /api/common/notifications/stats` - Statistiques
- `GET /api/common/notification-preferences` - Mes préférences
- `PUT /api/common/notification-preferences` - Modifier les préférences

**Adresses** :
- `GET /api/common/addresses` - Mes adresses
- `POST /api/common/addresses` - Ajouter une adresse
- `PUT /api/common/addresses/:id` - Modifier une adresse
- `DELETE /api/common/addresses/:id` - Supprimer une adresse

**Administration** :
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/users` - Lister les utilisateurs
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `POST /api/admin/users/:id/suspend` - Suspendre un utilisateur
- `POST /api/admin/users/:id/activate` - Activer un utilisateur
- `GET /api/admin/products` - Lister les produits
- `POST /api/admin/products` - Créer un produit
- `PUT /api/admin/products/:id` - Modifier un produit
- `DELETE /api/admin/products/:id` - Supprimer un produit
- `GET /api/admin/missions` - Toutes les missions
- `GET /api/admin/orders` - Toutes les commandes
- `GET /api/admin/audit-logs` - Journaux d'audit
- `GET /api/admin/stats/overview` - Statistiques globales


**Chatbot** :
- `POST /api/chatbot/chat` - Envoyer un message au chatbot
- `GET /api/chatbot/history` - Historique des conversations

**Tarification** :
- `POST /api/affreteur/pricing/calculate` - Calculer le prix d'une mission
- `GET /api/admin/pricing/config` - Configuration tarifaire
- `PUT /api/admin/pricing/config` - Modifier la configuration
- `GET /api/admin/pricing/history` - Historique des modifications

**Tracking** :
- `POST /track/:token/location` - Envoyer position (tracking public)
- `POST /track/:token/report-issue` - Signaler un problème (tracking public)
- `GET /delivery-proof` - Validation par QR code

---

### 14.2 Structure des Données

#### Modèle User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+237XXXXXXXXX",
  "role": "affreteur",
  "status": "active",
  "emailVerified": true,
  "mfaEnabled": false,
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-15T14:30:00Z"
}
```


#### Modèle Mission

```json
{
  "id": "uuid",
  "title": "Transport de matériel électronique",
  "description": "Livraison urgente de matériel informatique",
  "cargoType": "Électronique",
  "weight": 2.5,
  "volume": 5.0,
  "departureAddress": "Yaoundé, Bastos",
  "arrivalAddress": "Douala, Akwa",
  "estimatedDepartureDate": "2024-12-20T08:00:00Z",
  "estimatedArrivalDate": "2024-12-20T14:00:00Z",
  "minBudget": 70000,
  "maxBudget": 80000,
  "requiredVehicleType": "van",
  "flexibleDates": false,
  "flexibleRoute": false,
  "status": "published",
  "qrCode": "data:image/png;base64,...",
  "trackingToken": "ABC123XYZ",
  "trackingPin": "123456",
  "affreteurId": "uuid",
  "transporteurId": null,
  "vehicleId": null,
  "createdAt": "2024-12-15T10:00:00Z",
  "updatedAt": "2024-12-15T10:00:00Z"
}
```


#### Modèle Product

```json
{
  "id": "uuid",
  "name": "Alternateur Bosch 12V",
  "description": "Alternateur reconditionné compatible avec...",
  "price": 45000,
  "stock": 12,
  "sku": "ALT-BOSCH-12V-001",
  "categoryId": "uuid",
  "images": [
    "https://cdn.tsa-innovlab.com/products/alt-001-1.jpg",
    "https://cdn.tsa-innovlab.com/products/alt-001-2.jpg"
  ],
  "weight": 5.2,
  "dimensions": {
    "length": 20,
    "width": 15,
    "height": 10
  },
  "recommendedVehicleType": "car",
  "rating": 4.8,
  "reviewCount": 127,
  "createdAt": "2024-11-01T10:00:00Z",
  "updatedAt": "2024-12-15T14:30:00Z"
}
```

#### Modèle Order

```json
{
  "id": "uuid",
  "orderNumber": "ORD-202412-0001",
  "userId": "uuid",
  "status": "shipped",
  "subtotal": 260000,
  "shippingCost": 5000,
  "tax": 51012,
  "total": 316012,
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethod": "mtn_mobile_money",
  "paymentStatus": "completed",
  "trackingNumber": "TRK-ABC123",
  "items": [...],
  "createdAt": "2024-12-15T10:00:00Z",
  "updatedAt": "2024-12-15T14:30:00Z"
}
```


#### Modèle LocationUpdate

```json
{
  "id": "uuid",
  "missionId": "uuid",
  "latitude": 3.8480,
  "longitude": 11.5021,
  "speed": 65.5,
  "heading": 180,
  "accuracy": 10,
  "altitude": 750,
  "timestamp": "2024-12-15T10:30:00Z",
  "createdAt": "2024-12-15T10:30:05Z"
}
```

#### Modèle Notification

```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "mission",
  "priority": "medium",
  "title": "Mission acceptée",
  "message": "Votre mission #M-025 a été acceptée par Pierre Martin",
  "data": {
    "missionId": "uuid",
    "transporteurId": "uuid"
  },
  "read": false,
  "readAt": null,
  "createdAt": "2024-12-15T10:30:00Z"
}
```

---

### 14.3 Codes d'Erreur Communs

| Code | Message | Description | Solution |
|------|---------|-------------|----------|
| 400 | Bad Request | Requête mal formée | Vérifiez les paramètres envoyés |
| 401 | Unauthorized | Non authentifié | Connectez-vous ou renouvelez votre token |
| 403 | Forbidden | Accès refusé | Vous n'avez pas les permissions nécessaires |
| 404 | Not Found | Ressource introuvable | Vérifiez l'ID ou l'URL |
| 409 | Conflict | Conflit de données | La ressource existe déjà ou est en conflit |
| 422 | Unprocessable Entity | Validation échouée | Corrigez les erreurs de validation |
| 429 | Too Many Requests | Trop de requêtes | Attendez avant de réessayer |
| 500 | Internal Server Error | Erreur serveur | Contactez le support |
| 503 | Service Unavailable | Service indisponible | Réessayez plus tard |


---

### 14.4 Limites et Quotas

**Limites de Requêtes API** :

| Endpoint | Limite | Période |
|----------|--------|---------|
| Authentification | 5 tentatives | 15 minutes |
| Recherche produits | 100 requêtes | 1 heure |
| Envoi de messages | 50 messages | 1 heure |
| Upload de fichiers | 10 fichiers | 1 heure |
| Calcul de prix | 20 requêtes | 1 heure |
| Autres endpoints | 1000 requêtes | 1 heure |

**Limites de Fichiers** :

| Type | Taille Max | Formats Acceptés |
|------|------------|------------------|
| Images produits | 5 MB | JPG, PNG, WEBP |
| Preuves de livraison | 10 MB | JPG, PNG, PDF |
| Documents | 10 MB | PDF, DOC, DOCX |
| Photos recherche visuelle | 5 MB | JPG, PNG |

**Limites de Données** :

- **Missions** : 100 missions actives simultanées par affreteur
- **Véhicules** : 50 véhicules par transporteur
- **Adresses** : 20 adresses par utilisateur
- **Panier** : 50 articles maximum
- **Messages** : 500 caractères par message
- **Historique GPS** : Conservation 90 jours


---

### 14.5 Bonnes Pratiques

#### Pour les Affreteurs

✓ **Utilisez le calculateur de prix** pour définir un budget réaliste  
✓ **Publiez vos missions à l'avance** pour attirer plus de transporteurs  
✓ **Fournissez des descriptions détaillées** de vos marchandises  
✓ **Vérifiez les évaluations** des transporteurs avant d'accepter  
✓ **Communiquez clairement** via la messagerie  
✓ **Évaluez honnêtement** les transporteurs après livraison  
✓ **Suivez vos missions en temps réel** pour anticiper les problèmes  

#### Pour les Transporteurs

✓ **Maintenez votre flotte à jour** avec les bons statuts  
✓ **Répondez rapidement** aux missions qui vous intéressent  
✓ **Activez le GPS** pendant toute la mission  
✓ **Signalez immédiatement** tout problème rencontré  
✓ **Prenez des photos** de qualité pour les preuves de livraison  
✓ **Communiquez proactivement** avec les affreteurs  
✓ **Respectez les délais** pour maintenir une bonne note  

#### Pour Tous les Utilisateurs

✓ **Activez MFA** pour sécuriser votre compte  
✓ **Utilisez des mots de passe forts** et uniques  
✓ **Vérifiez régulièrement** vos notifications  
✓ **Mettez à jour** vos informations de profil  
✓ **Sauvegardez** vos codes de récupération MFA  
✓ **Signalez** les bugs et problèmes rencontrés  
✓ **Explorez** les nouvelles fonctionnalités régulièrement  


---

### 14.6 Sécurité et Confidentialité

#### Politique de Sécurité

**Protection des Données** :

- ✓ Chiffrement SSL/TLS pour toutes les communications
- ✓ Chiffrement des mots de passe avec bcrypt
- ✓ Tokens JWT avec expiration courte
- ✓ Authentification multi-facteurs disponible
- ✓ Logs d'audit pour toutes les actions critiques
- ✓ Conformité RGPD (protection des données personnelles)

**Vos Droits** :

-  **Droit d'accès** : Consulter vos données personnelles
-  **Droit de rectification** : Corriger vos données
-  **Droit à l'effacement** : Supprimer votre compte et vos données
-  **Droit à la portabilité** : Exporter vos données
-  **Droit d'opposition** : Refuser certains traitements
-  **Droit à la limitation** : Limiter l'utilisation de vos données

**Exercer Vos Droits** :

Contactez privacy@tsa-innovlab.com avec votre demande. Nous répondrons sous 30 jours.


---

### 14.7 Roadmap et Fonctionnalités à Venir

**Q1 2025** :

-  Intégration Orange Money
-  Application mobile native (iOS et Android)
-  Support multilingue (Français, Anglais, Arabe)
-  Tableaux de bord avancés avec analytics
- 🤝 Programme de fidélité pour transporteurs

**Q2 2025** :

-  Paiement par carte bancaire
-  Suivi par drone pour zones difficiles
-  Enchères inversées pour missions
-  Reconnaissance automatique de documents
-  Notifications push mobile

**Q3 2025** :

-  Expansion régionale (Afrique de l'Ouest)
- 🤖 Chatbot vocal avec IA
-  Gestion d'entrepôts
-  Optimisation de tournées multi-livraisons
-  Portail entreprise B2B

**Q4 2025** :

-  Intégration avec ERP externes
-  Prédictions IA pour demande de transport
-  Système de badges et gamification
-  Formation en ligne pour transporteurs
-  Concours et récompenses mensuels

>  **SUGGESTION** : Votez pour les fonctionnalités que vous souhaitez voir en priorité dans **Support > Demander une fonctionnalité**.


---

### 14.8 Changelog (Historique des Versions)

#### Version 1.0.0 (Décembre 2024) - Version Initiale

**Fonctionnalités Principales** :

✓ Authentification complète (inscription, connexion, MFA)  
✓ Gestion des missions (création, publication, suivi)  
✓ Suivi GPS en temps réel  
✓ Boutique e-commerce avec recherche visuelle IA  
✓ Système de paiement MTN Mobile Money  
✓ Messagerie instantanée  
✓ Notifications temps réel  
✓ Chatbot IA contextuel  
✓ Calculateur de prix dynamique  
✓ Dashboard pour chaque rôle  
✓ Gestion de flotte de véhicules  
✓ Preuves de livraison avec QR code  
✓ Évaluations et feedback  
✓ Administration complète  
✓ Journaux d'audit  

**Améliorations Prévues** :

- Optimisation des performances
- Amélioration de l'UX mobile
- Ajout de nouveaux modes de paiement
- Extension des fonctionnalités IA

---

## Conclusion

Félicitations ! Vous avez maintenant toutes les connaissances nécessaires pour utiliser efficacement la plateforme TSA InnovLab.


**Récapitulatif par Rôle** :

** Administrateurs** : Vous pouvez gérer l'ensemble de la plateforme, superviser les utilisateurs, produits, missions et commandes, consulter les statistiques et configurer les paramètres système.

** Affreteurs** : Vous pouvez créer et publier des missions, suivre vos expéditions en temps réel, évaluer les transporteurs, et acheter des produits dans la boutique.

** Transporteurs** : Vous pouvez découvrir et accepter des missions, gérer votre flotte, envoyer votre position GPS, télécharger des preuves de livraison, et suivre vos revenus.

** Clients** : Vous pouvez parcourir le catalogue, passer des commandes, effectuer des paiements sécurisés, et suivre vos livraisons.

**Ressources Utiles** :

- 🤖 **Chatbot IA** : Assistance 24/7 pour toutes vos questions
-  **Support Email** : support@tsa-innovlab.com
-  **Téléphone** : +237 XXX XXX XXX
-  **Site Web** : https://tsa-innovlab.com
-  **Documentation API** : https://docs.tsa-innovlab.com

**Restez Connectés** :

Suivez-nous sur les réseaux sociaux pour les dernières actualités, mises à jour et conseils :

- Facebook : @TSAInnovLab
- Twitter : @TSAInnovLab
- LinkedIn : TSA InnovLab
- Instagram : @TSAInnovLab


---

**Merci d'utiliser TSA InnovLab !** 

Nous sommes ravis de vous accompagner dans votre transformation logistique. Notre équipe travaille constamment pour améliorer la plateforme et vous offrir la meilleure expérience possible.

N'hésitez pas à nous faire part de vos suggestions, questions ou problèmes. Votre feedback est précieux pour nous aider à évoluer.

**Bonne utilisation et bon transport !** 

---

**Document créé par** : TSA InnovLab Team  
**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0  
**Licence** : © 2024 TSA InnovLab. Tous droits réservés.

---

**Note** : Ce guide est un document vivant qui sera régulièrement mis à jour avec les nouvelles fonctionnalités et améliorations de la plateforme. Consultez régulièrement cette page pour rester informé des dernières évolutions.

Pour toute question ou suggestion concernant ce guide, contactez documentation@tsa-innovlab.com.

---

** Marque-pages Rapides** :

- [Créer une mission](#affreteur) → Section 4.2
- [Accepter une mission](#transporteur) → Section 5.3
- [Suivre en temps réel](#suivi) → Section 7
- [Passer une commande](#communes) → Section 6.3
- [Utiliser le chatbot](#chatbot) → Section 9
- [FAQ](#faq) → Section 11
- [Support](#support) → Section 12

---

**FIN DU GUIDE UTILISATEUR**
