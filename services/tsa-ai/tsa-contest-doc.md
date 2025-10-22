# InnovLab TSA Contest 2025

**TSA Logistique**  
+237 651 21 87 97  
infos@tsa-logistique.com

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Objectifs du concours](#2-objectifs-du-concours)
3. [La portée fonctionnelle](#3-la-portée-fonctionnelle)
4. [Architecture et technologies](#4-architecture-et-technologies)
5. [Organisation Agile (Scrum)](#5-organisation-agile-scrum)
6. [Plan de livraison](#6-plan-de-livraison)
7. [Contraintes Projet](#7-contraintes-projet)
8. [Livrables finaux](#8-livrables-finaux)
9. [Avantages du concours](#9-avantages-du-concours)
10. [Grille d'évaluation](#10-grille-dévaluation)

---

## 1. Introduction

Transport et Services d'Afrique, une société de transport et logistique de marchandise à l'échelle nationale et internationale désire étendre et promouvoir ses services par le biais d'applications web et mobile. InnovLab TSA est l'environnement que la structure met en place pour atteindre son objectif et donner par la même, l'occasion à de jeunes talents d'aiguiser leurs compétences.

### Pour ce concours nous entrerons dans un univers où :

1. Les colis ne se perdent plus dans le néant des centres de tri (grâce à un tracking intelligent).
2. Les affréteurs et les transporteurs ont droit à un mini Tinder pour la mise en relation et ou chaque beignet trouve son client (permet de trouver le bon camion au bon moment et au bon prix.)
3. Le client en quelques clics peut savoir ou se trouve son colis
4. Les pièces de transport reconditionnées ne finissent plus sur un tas de ferraille mais dans un panier d'achat en ligne.
5. Les données (data) sont exploitées pour prédire retards, optimiser routes et recommander pièces.
6. L'IA devient copilote des opérations, pas juste un gadget marketing.
7. Objectif final étant d'aboutir à un Uber version logistique

Le concours parcourt un ensemble de fonctionnalités qui se subdivisent en 06 modules différents et indépendants. Les équipes sont libres de débuter par le module de leur choix mais il est à noter qu'ils sont tous obligatoires.

### 1.1 Missions

Votre mission sera de Concevoir une solution complète comprenant Web app responsive ou Application mobile pour les 6 modules :

1. Réseau de fret digital
2. Suivi & Tracking Omniscient
3. Livraison à Domicile Grand Public
4. Boutique en Ligne de Pièces Reconditionnées
5. Chatbot et Support Tactique
6. IA & Data : Le Cerveau Prédictif

### 1.2 Valeurs ajoutées

1. **Pour l'utilisateur final** : gain de temps, plus de transparence, achats simplifiés, meilleure prévision.
2. **Pour l'entreprise** : meilleure gestion de flotte et de stock, réduction des retards, augmentation des ventes.
3. Un challenge technique complet avec exposition des talents devant un jury d'experts et nos différents sponsors. Oui ceci est une aubaine pour vos de mettre votre profil en lumière

### 1.3 Développement de talents

À travers ce concours, nous visons à ce que les candidats comprennent :

1. Le contexte métier (logistique + e-commerce + reconditionné)
2. L'importance d'intégrer la dimension Data/IA dès la conception
3. L'obligation d'aboutir à un produit complet utilisable par des vrais utilisateurs.

---

## 2. Objectifs du concours

### 2.1 Objectifs Techniques

Le concours vise à pousser les équipes à démontrer :

#### 1. Maîtrise du développement full-stack
- **Frontend** : interface web responsive, ergonomique et accessible.
- **Backend** : API sécurisée, performante, documentée, prête à scaler.
- **Mobile** : application native/hybride optimisée pour les usages terrain.

#### 2. Intégration de la Data & de l'IA
- Collecte, stockage et nettoyage de données logistiques et e-commerce.
- Modèles de prédiction (ETA, détection anomalies, recommandations produits).
- Visualisation de données avec Dashboard interactifs.

#### 3. Gestion de projet Agile
- Application concrète du Framework Scrum.
- Rituels, backlog clair, livrables réguliers.
- Capacité à prioriser et s'adapter en cours de route.

#### 4. Mettre les participants en situation réelle
- Contraintes de temps,
- Choix des technologies,
- Gestion des imprévus.

#### 5. Encourager la pluridisciplinarité
- Développeurs,
- Data scientists,
- Designers,
- Gestionnaires de projet…

#### 6. Développer la rigueur
- Clean code,
- Tests automatisés,
- Documentation technique

### 2.2 Objectifs Commerciaux

Sur le plan Business les équipes en course devront apporter les améliorations suivantes :

#### 7. Optimiser la logistique
- Réduire retards et trajets inutiles.
- Améliorer la gestion des chauffeurs et des affréteurs.

#### 8. Dynamiser le e-commerce
- Boutique en ligne attractive et simple à utiliser.
- Gestion intelligente des stocks (alertes, prévisions de rupture).

#### 9. Améliorer la satisfaction utilisateur
- Suivi temps réel des colis.
- Paiements sécurisés et expérience fluide sur mobile et web.

### 2.2.1 En Complément

**Les objectifs cachés (Mais on vous le dit quand même)**

10. Observer la capacité des équipes à collaborer sous pression (oui, même à J-2 de la démo).
11. Évaluer leur créativité dans l'usage de la data et de l'IA.
12. Mesurer leur réactivité face aux feedbacks du jury.

> *"Coder, c'est comme livrer un colis : il faut que ça arrive complet, à l'heure, et que ça donne envie de revenir."*

---

## 3. La portée fonctionnelle

### 3.1 Fonctionnalités Générales

**Bon à savoir :**

1. Un **Affréteur** représente le client et s'enquiert des conditions de transport des produits et s'attache à trouver le meilleur rapport qualité/prix pour leur transport tout en respectant les délais impartis.
2. Un **Transporteur** renseigne tout individu disposant d'un moyen de transport avec une volonté de mettre son véhicule à contribution pour compléter une commande dans les délais moyennant un paiement. Les délais et paiement étant arrêté par les parties concernés en amont.
3. Un **administrateur** renseigne tout membre décisionnaire de TRANSAF. Il fait office de passerelle entre Affréteur et Transporteur.

### 3.1.1 Authentification & rôles

#### 1. Profils
- **Administrateur** : gère toute la plateforme (colis, chauffeurs, produits, stats, etc.).
- **Transporteur** : prend des commandes, suit ses courses, met à jour les statuts colis.
- **Affréteur** : crée des commandes, suit la livraison, consulte factures.

#### 2. Fonctions
- Création et gestion de comptes Affréteur et Transporteur.
- Solution multi langage (FR/EN minimum).
- Sécurité renforcée (mot de passe fort, MFA recommandé).

> *"L'authentification doit être plus solide que le cadenas du garage où on garde les pièces reconditionnées."*

### 3.1.2 Back-office Administrateur

#### 3. Tableau de bord
- Vue d'ensemble : colis en route, en retard, en panne, statistiques produits, alertes stock limité, répartition par catégorie.
- Suivi en temps réel via carte (tracking GPS).

#### 4. Gestion Produits
- CRUD complet (catégories, prix, stock, statut).
- Consultation des stocks et alertes ruptures.

#### 5. Commandes
- Suivi du paiement,
- Validation,
- Livraison,
- Statut en temps réel.

#### 6. Chauffeurs & Affréteurs
- Gestion, ajout, suivi des documents et permis.
- Localisation sur carte (Map Chauffeurs).

#### 7. Devis & Factures
- Création,
- Suivi,
- État payé/impayé.

#### 8. Support
- Chat interne pour communication avec transporteurs et affréteurs.

#### 9. Indexation
- Recherche globale sur toutes les entités (produits, commandes, clients).

---

## 3.2 Modules de l'application

06 Modules obligatoires sont attendus pour clore les besoins

### 3.2.1 Module 1 : Réseau de Fret Digital

#### Problème
Comment marier affréteurs et transporteurs comme un Tinder du fret, sans les mauvaises surprises ?

1. Affréteurs galèrent à trouver des transporteurs fiables pour des trajets nationaux/internationaux
2. Transporteurs roulent à vide 30% du temps par manque de visibilité sur les missions
3. Admin joue les arbitres dans un match sans tableau de score

#### Solutions attendues :
4. **Matching intelligent** : Algorithmes de recommandation transporteur/affréteur basés sur fiabilité, spécialisation géographique et taux de ponctualité
5. **Place de marché** : Interface B2B pour publier/rechercher des missions avec notation en temps réel
6. **Nkouloulou Mood** : les détails des commandes (prix, délai) ne sont pas des versets d'évangiles. Les administrateurs, les affréteurs et les transporteurs peuvent faire des contre-propositions
7. **Paiements flexibles** : Intégration mobile money, virements sécurisés et gestion automatique des factures
8. **KYC dynamique** : Vérification automatisée des documents (permis, assurances)

#### Livrable
Une "Place de Fret" web/mobile où un transporteur peut candidater à une mission en < 3 clics, et où un affréteur voit son taux de remplissage passer de 60% à 95%.

---

### 3.2.2 Module 2 : Suivi & Tracking Omniscient

#### Problème :
Un colis perdu est comme un poisson rouge dans l'océan : plus personne ne le revoit.

1. Les affréteurs ignorent si leur marchandise est à Douala ou sur la Lune
2. Les retards sont découverts à la livraison, jamais anticipés

#### Solutions attendues :
1. **GPS vivant** : Tracking intégrant trafic, contrôles routiers et météo en temps réel
2. **ETA prédictif** : "Votre colis a 85% de risque de retard à cause d'un orage à Yaoundé"
3. **Preuves visuelles** : Scan QR + photo à la livraison par le transporteur
4. **Alertes proactives** : "Votre chauffeur s'est arrêté 1h à Bertoua : problème mécanique ?"

#### Livrable :
Une carte interactive façon "Google Maps du fret" avec curseurs de délais, alertes intelligentes et historique des trajets.

---

### 3.2.3 Module 3 : Livraison à Domicile Grand Public

#### Problème :
Commander un colis devrait être aussi simple qu'acheter des crédits téléphone.

1. Les particuliers paient 2x le tarif pro par manque de mutualisation
2. Aucune visibilité sur le livreur ou l'heure d'arrivée

#### Solutions attendues :
1. **Uberisation** : Calcul de tarifs en temps réel par poids/volume/urgence
2. **Géolocalisation grand public** : "Votre livreur est à 200m, préparez les CFA !"
3. **Groupage de colis** : Optimisation des tournées via IA
4. **Paiement cash-on-delivery** avec reçu digital

#### Livrable :
Une app mobile type "Uber Eats" pour colis, avec estimation de prix instantanée et suivi en direct.

---

### 3.2.4 Module 4 : Boutique en Ligne de Pièces Reconditionnées

#### Problème :
Trouver une pièce pour un camion au Cameroun ? C'est la chasse au trésor... sans carte.

1. 70% des garagistes perdent plusieurs jours voir des mois à chercher des pièces rares
2. Aucune garantie sur la qualité des pièces d'occasion

#### Solutions attendues :
1. **Catalogue intelligent** : Recherche par photo/numéro de série + compatibilité véhicule
2. Catalogue avec filtres par catégorie.
3. Panier, commande, paiement sécurisé.
4. Gestion des retours.
5. Statistiques sur les ventes (web + boutique physique).
6. **Scoring de qualité** : "Cette pièce a 92% de fiabilité (testée 3x, garantie 6 mois)"
7. **Alertes stocks** : "Plus que 2 en stock, commandez avant 17h !"
8. **Livraison express** : Intégration avec le Module 3

#### Livrable :
Un "Amazon des pièces camion" avec fiches techniques enrichies, scores de fiabilité et livraison < 24h.

---

### 3.2.5 Module 5 : Chatbot & Support Tactique

#### Problème :
Un client bloqué à 2h du matin est un client perdu.

1. Les réclamations mettent 72h à être traitées
2. Les transporteurs ne signalent pas les problèmes en route

#### Solutions attendues :
1. **Triple chat** : Canaux dédiés (Admin/Transporteur - Admin/Affréteur - Support clients)
2. **Chatbot 24/7** : Résolution automatique des questions fréquentes (retards, paiements)
3. **Système d'urgence** : "Problème mécanique ? Appuyez ici pour alerter l'assistance"
4. **Analyse de sentiment** : Détection automatique des clients mécontents

#### Livrable :
Un centre d'assistance unifié avec historique des conversations, chatbot et bouton SOS.

---

### 3.2.6 Module 6 : IA & Data : Le Cerveau Prédictif

#### Problème :
Sans data, la logistique est un aveugle au volant d'un 40 tonnes.

1. Les retards sont constatés, jamais prévus
2. Les prix des pièces fluctuent sans logique visible

#### Solutions innovantes attendues :
3. **Oracle des Retards** : Prédiction ETA avec facteurs explicatifs (météo, grèves, historique chauffeur)
4. **Notation auto** : Score de fiabilité transporteurs/affréteurs basé sur ponctualité, annulations
5. **Price Master** : Recommandation de prix dynamique pour les pièces reconditionnées
6. **Optimisation de trajets** : "Évitez la N5 demain : 3 contrôles policiers prévus"
7. **Visionnaire des Stocks** : Précommande auto de pièces avant rupture
8. **Détection de fraude** : Alertes sur paiements suspects ou documents falsifiés
9. **Recommandation des produits** : suggérer des pièces reconditionnées pertinentes aux clients.
10. **Tableaux de bord analytiques** : visualisation interactive des KPI (ventes, livraisons, performance chauffeurs).

#### Livrable :
Un "Tableau de bord Jedi" avec cartes prédictives, scores en temps réel et conseils automatisés.

---

### 3.2.7 Module Bonus - Application mobile

1. **Plateformes** : Android & iOS (stack recommandée : Flutter ou React Native).
2. **Affréteur** : création/suivi commandes, factures, chat.
3. **Transporteur** : candidature, gestion courses, navigation GPS intégrée, mise à jour statuts, preuve photo.
4. **Admin** : vue simplifiée du tableau de bord, suivi chauffeurs, validation commandes.
5. **Fonctionnalités clés** : notifications push, mode offline, scan QR code, authent biométrique, multilingue.

> *"Si le chauffeur peut tout gérer depuis son téléphone, même en plein rond-point, on a gagné." (À ne pas tester en vrai, hein.)*

### 3.2.8 Fonctionnalités non-fonctionnelles intégrées à la portée

1. **Sécurité** : gestion fine des rôles, chiffrement
2. **Performance** : temps de réponse API < 400 ms.
3. **Scalabilité** : architecture prête à encaisser +500 utilisateurs simultanés.

---

## 4. Architecture et technologies

On vous préconisera de partir sur une architecture modulaire, scalable et sécurisée, avec :

- **Frontend Web** : Interface utilisateur responsive et dynamique.
- **Application mobile** : pour usage terrain, intégrée aux mêmes APIs que le web.
- **Backend/API** : cœur applicatif, exposant des services sécurisés.
- **Base de données & Data warehouse** : pour les opérations et l'analytique.
- **Composants Data & IA** : ingestion, traitement, modèles prédictifs, APIs IA.
- **Services tiers** : cartographie, paiement, notifications, stockage fichiers.

Mais Après tout le choix vous revient.

> 💡 *"Une bonne architecture, c'est comme un camion bien chargé : tout est à sa place, bien attaché, et rien ne tombe en route."*

---

## 5. Organisation Agile (Scrum)

### 5.1 Cadre général

Pour Innovlab TSA, nous serions sur :

1. **Durée totale** : 8 semaines
2. **Méthodologie** : Scrum
3. **Nombre d'équipes** : 3 à 5 membres
4. **Profils typiques** :
   - PO/SM (Product Owner / Scrum Master)
   - Développeur Frontend
   - Développeur Backend
   - Data Scientist / Data Engineer
   - QA / DevOps

**Note concours** : Chaque rôle a sa spécialité, mais ici, on aime aussi les profils "couteau suisse" qui peuvent donner un coup de main partout. De plus la configuration proposée est aussi un moyen de vous mettre dans les conditions d'entreprises

**Petit Tips formateurs** : Ce concours n'est pas seulement un moyen de gagner de l'argent mais aussi de monter en compétences donc il est important de mettre en avant les bonnes pratiques

### 5.2 Les rituels Scrum obligatoires

1. **Sprint Planning (4h max)** : définir le contenu du sprint à partir du backlog.
2. **Daily Scrum (15 min)** : point rapide sur l'avancement et les blocages.
3. **Sprint Review (2h)** : démo de l'incrément terminé au jury et aux autres équipes.
4. **Sprint Retrospective (1h)** : retour sur ce qui a bien/mal marché et actions d'amélioration.
5. **Backlog Refinement (1h par semaine)** : ajuster les user stories et priorités.

### 5.3 Durée et rythme des sprints

1. **Sprint 0 (préparatoire)** : 2–3 jours
2. **4 Sprints de 2 semaines** chacun
3. À la fin de chaque sprint livrable complet testable et déployé sur un environnement accessible au jury.

### 5.4 Checkpoints concours

1. **Gate S0 (J+3)**: Vision, backlog initial, architecture validée.
2. **Gate S1 (Fin Semaine 2)** : MVP web + backend minimal.
3. **Gate S2 (Fin Semaine 4)** : Livraison logistique opérationnelle (tracking réel, devis, factures).
4. **Gate S3 (Fin Semaine 6)** : E-commerce complet + stats.
5. **Gate S4 (Fin Semaine 8)** : Version finale + pitch final.

> 💡 *"Si vous arrivez au Gate S4 avec un produit qui marche, c'est du talent. Si vous arrivez avec un produit qui marche ET une IA qui fait des blagues… c'est du génie."*

### 5.5 Definition of Done (DoD)

Pour qu'une User Story soit vraiment finie :

1. Code développé, linté et testé (unit ≥ 70%, e2e sur les parcours critiques).
2. Fonction intégrée dans le produit et testée sur l'environnement de démo.
3. Documentation technique et utilisateur mises à jour.
4. Pipeline CI/CD vert.
5. Respect des standards de sécurité et performance.

### 5.6 Outils recommandés

- **Gestion de projet** : Jira, Trello.
- **Versionning** : GitHub / GitLab.
- **CI/CD** : GitHub Actions, GitLab CI, ou Jenkins.
- **Communication interne** : Slack, Discord, ou google meet.
- **Documentation** : Confluence ou GitHub

Nous mettrons à disposition des accès Jira pour vous.

---

## 6. Plan de livraison

### 6.1 Sprint 0 – Préparation au décollage (2–3 jours)

**Objectif** : Aligner l'équipe et poser les bases techniques et organisationnelles.

#### Livrables :
1. Vision produit et objectifs business clairs.
2. Backlog initial priorisé (P0/P1).
3. Architecture cible
4. Stratégie CI/CD (pipeline minimal prêt).
5. Plan data & IA (identification des sources et des cas d'usage).

> 💡 *"Sprint 0, c'est comme un échauffement avant un marathon… sauf qu'ici, le marathon commence demain."*

---

### 6.2 Sprint 1 – MVP tronc commun (Semaines 1–2)

**Objectif** : Première version utilisable du produit.

#### Livrables :
1. Authentification multi-rôle (Admin, Transporteur, Affréteur).
2. CRUD produits & catégories (back-office).
3. Création commande Affréteur (flux simple) : Demande de transport permettant aux expéditeurs de faire leur demande de transport de manière intuitive. Ce flux inclura la saisie des détails de la marchandise et des points de départ/arrivée.
4. Dashboard Admin v1 (colis en route/retard, stock limité).
5. Interface de réception et visualisation des courses disponibles pour les transporteurs
6. Data : collecte initiale + premier Dashboard statique.
7. Tests : unitaires sur modules Auth & CRUD, e2e "Créer commande".
8. **Gate S1** :
   - Démo complète web ou mobile (flux Auth → Commande → Dashboard).
   - Code en production sur environnement démo.

---

### 6.3 Sprint 2 – Logistique & Transporteurs (Semaines 3–4)

**Objectif** : Gestion complète du transport des colis.

#### Livrables :
1. Espace Transporteur : voir commandes, candidater, gérer "Mes courses".
2. Market Place affréteur pour la mise en relation avec les Transporteurs
3. Tracking temps réel (API GPS intégrée) pour avoir la traçabilité des cargaisons + notification d'arrivée.
4. Gestion devis et factures (Admin).
5. Chat Admin, Transporteur/Affréteur.
6. Version mobile : tracking et chats intégrés.
7. Data/IA : modèle ETA baseline (historique + mock trafic).
8. Tests : intégration API tracking, e2e "Affectation course + Tracking".
9. **Gate S2** :
   - Démo live tracking.
   - Sécurité des endpoints vérifiée (auth par rôle).

---

### 6.4 Sprint 3 – E-commerce pièces reconditionnées (Semaines 5–6)

**Objectif** : Boutique en ligne fonctionnelle avec paiement.

#### Livrables :
1. Catalogue, panier, commande.
2. Gestion des retours.
3. Alertes stock limité.
4. Statistiques ventes (web + physique).
5. Data/IA : moteur de recommandation produits (popularité).
6. Tests : e2e panier → paiement, test mutation prix/stock.
7. **Gate S3** :
   - Intégration recommandations produits dans la boutique.

---

### 6.5 Sprint 4 – Optimisation, IA & Release candidate (Semaines 7–8)

**Objectif** : Finitions, IA avancée, sécurité, UX, préparation finale.

#### Livrables :
1. IA ETA optimisée + détection anomalies trajets. (Point à bonus)
2. Carte "Map Chauffeurs" (localisation en temps réel).
3. Gestion Organisateurs et suppression compte (RGPD).
4. Accessibilité AA, mode sombre, UX améliorée.
5. Version mobile complète avec toutes fonctionnalités.
6. Tests : couverture ≥ 80%, tests performance (p95 < 400 ms), sécurité OWASP.
7. **Gate S4 – Finale** :
   - Release candidate déployée.
   - Dossier complet (architecture, tests, data/IA).
   - Pitch final devant jury.

---

## 7. Contraintes Projet

Vous devrez respecter les notions de :

1. **Clean code** : respect des principes SOLID, DRY, KISS.
2. **Convention de code** : ESLint/Prettier pour JS/TS, Checkstyle pour Java, équivalents pour autres langages.
3. **Revue de code** obligatoire pour chaque pull request.
4. **Couverture tests** : ≥ 70% dès Sprint 1, ≥ 80% à la fin du Sprint 4.
5. **CI/CD** : pipeline automatisé avec build, tests, et déploiement auto sur environnement de démo.

---

## 8. Livrables finaux

Nous attendons de vous :

### 8.1 Code source

*Le code source des 03 premiers lauréats seront remis à TSA-Logistique*

1. Code complet du frontend web, backend, et application mobile.
2. Respect des conventions de nommage, clean code et architecture validée.
3. Branches organisées (main, develop, feature/*) avec historique Git clair.

### 8.2 Application déployée en local

1. Version release candidate et installable (mobile).
2. Environnements de démo fonctionnels pour le jury (login fourni).
3. Documentation pour déploiement local et cloud.

> 💡 *"Un livrable non déployable, c'est comme un colis sans adresse… il ne va nulle part."*

### 8.3 Documentation technique

1. Dossier d'architecture : schémas de séquence, diagramme d'entités.
2. ADR (Architectural Decision Records) : décisions techniques justifiées.
3. Guide développeur : comment cloner, configurer, lancer, et tester le projet.

### 8.4 Documentation fonctionnelle

1. Guide utilisateur pour chaque rôle (Admin, Transporteur, Affréteur).
2. Capture d'écran des parcours clés.
3. FAQ et modes d'emploi mobile & web.

### 8.5 Données

1. Jeux de données anonymisées utilisés pour entraînement et tests.
2. Scripts et notebooks d'entraînement IA.
3. Évaluation des modèles (métriques + interprétation).
4. Plan de mise à jour ou d'amélioration future des modèles.

### 8.6 Qualité & Tests

1. Rapports de tests (unitaires, e2e, performance).
2. Couverture de code (capture ou rapport automatisé).
3. Logs de pipeline CI/CD montrant le succès des builds finaux.

### 8.7 Présentation finale

1. **Pitch deck (10 slides max)** résumant :
   - Vision du projet
   - Démonstration des fonctionnalités clés
   - Architecture et choix techniques
   - Utilisation de la data et de l'IA
   - Retours d'expérience et axes d'amélioration
2. **Vidéo démo (3–5 minutes)** du produit en action (bonus si elle est dynamique et claire).

### 8.8 💡 Rappel concours

*"À la fin, vous devez remettre un projet prêt à être montré à un investisseur, un client… ou à votre grand-mère (et qu'elle comprenne)."*

---

## 9. Avantages du concours

Les éléments suivants sont à prendre en considération concernant le concours :

1. **La cagnotte d'01 millions** sera à partager entre les 03 premières équipes, répartis comme suit :
   - **1ère** : 1 000 000 FCFA
   - **2nde** : 300 000 FCFA
   - **3ème** : 200 000 FCFA

2. Le code source des 03 premiers lauréats deviendront la propriété de TSA-Logistique

3. Possibilité d'obtenir un ticket de stage chez TSA

4. Une scène pleine de sponsors prête à découvrir vos talents

---

## 10. Grille d'évaluation

Trouvez ci-dessous un aperçu du scoring qui vous mènera au million :

| Critère | Pondération | Détails |
|---------|-------------|---------|
| **Fonctionnalités & conformité au cahier des charges** | 30% | Couverture des fonctionnalités listées au Point 3, fluidité du parcours utilisateur, respect des rôles. |
| **Qualité logicielle & tests** | 25% | Clean code, couverture tests, respect conventions, pipeline CI/CD opérationnel. |
| **Data & IA** | 15% | Qualité de l'intégration IA (ETA, recommandations, anomalies), pertinence des analyses et visualisations. |
| **UX & Mobile** | 10% | Expérience utilisateur web et mobile, design responsive |
| **Architecture & Sécurité** | 10% | Robustesse de l'architecture, respect des bonnes pratiques de sécurité |
| **Agilité & livrables réguliers** | 10% | Respect des sprints, livrables complets à chaque Gate, transparence sur l'avancement. |

---

**Bonne chance à tous les participants !** 🚀