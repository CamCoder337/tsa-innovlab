# PRESENTATION TSA INNOVLAB
## Pitch Final - InnovLab TSA Contest 2025

---

**Document de support pour presentation PowerPoint (10 slides max)**
**Duree estimee : 10-15 minutes**

---

## SLIDE 1 : TITRE ET EQUIPE

### TSA InnovLab
**L'Uber de la Logistique Africaine**

---

**Equipe de Developpement**

| Role | Responsabilite |
|------|----------------|
| Product Owner | Vision produit, backlog, priorisation |
| Scrum Master | Facilitation Agile, rituels Scrum |
| Dev Frontend | React + TypeScript, interfaces utilisateur |
| Dev Backend | AdonisJS, APIs, logique metier |
| Data Scientist | FastAPI Python, IA, predictions |
| DevOps/QA | Tests, CI/CD, deploiement |

---

**Concours InnovLab TSA 2025**
TSA-Logistique | +237 651 21 87 97 | infos@tsa-logistique.com

---

[PLACEHOLDER IMAGE : Logo TSA InnovLab centre, fond professionnel bleu/blanc avec icones logistique subtiles]

---


## SLIDE 2 : LE PROBLEME

### La Logistique Africaine : Un Secteur Fragmente

---

**Constats Terrain**

| Probleme | Impact |
|----------|--------|
| Colis perdus | Aucune tracabilite, clients mecontents |
| Transporteurs a vide | 30% des trajets sans chargement |
| Mise en relation difficile | Affreteurs et transporteurs ne se trouvent pas |
| Pieces detachees introuvables | Garagistes perdent des jours/semaines |
| Support client inexistant | Reclamations traitees en 72h+ |
| Zero donnees exploitees | Retards constates, jamais prevus |

---

**Chiffres Cles**

- 30% des camions roulent a vide (manque de visibilite)
- 70% des garagistes perdent plusieurs jours a chercher des pieces
- 72h+ pour traiter une reclamation client
- 0 prediction de retard (tout est reactif)

---

**Citation du Cahier des Charges**

> "Un colis perdu est comme un poisson rouge dans l'ocean : plus personne ne le revoit."

---

[PLACEHOLDER IMAGE : Infographie montrant les 6 problemes avec icones : camion vide, point d'interrogation sur carte, horloge cassee, pieces eparpillees, telephone sans reponse, graphique plat]

---


## SLIDE 3 : NOTRE SOLUTION

### TSA InnovLab : Plateforme Logistique Unifiee

---

**Vision**

Creer l'"Uber de la logistique" : une plateforme qui connecte affreteurs, transporteurs et clients dans un ecosysteme digital unifie, augmente par l'Intelligence Artificielle.

---

**Proposition de Valeur**

| Pour l'Utilisateur | Pour l'Entreprise |
|--------------------|-------------------|
| Gain de temps | Meilleure gestion de flotte |
| Transparence totale | Reduction des retards (-40%) |
| Achats simplifies | Augmentation des ventes |
| Previsions fiables | Optimisation des stocks |

---

**Les 6 Modules Obligatoires - Tous Implementes**

1. Reseau de Fret Digital - Matching intelligent
2. Suivi et Tracking Omniscient - GPS temps reel
3. Livraison a Domicile - Uberisation du dernier km
4. Boutique Pieces Reconditionnees - E-commerce complet
5. Chatbot et Support Tactique - IA 24/7
6. IA et Data Predictif - Cerveau de la plateforme

---

**Differenciation**

- Multi-roles : Admin, Transporteur, Affreteur, Client
- Multi-langue : FR/EN
- Multi-paiement : Mobile Money, Especes, Virement
- IA integree des la conception (pas un gadget)

---

[PLACEHOLDER IMAGE : Schema circulaire avec les 6 modules autour d'un hub central "TSA InnovLab", fleches montrant les interactions entre modules]

---


## SLIDE 4 : ARCHITECTURE TECHNIQUE

### Stack Technologique Moderne et Scalable

---

**Architecture 3-Tiers**

```
+------------------+     +------------------+     +------------------+
|   FRONTEND WEB   |     |   BACKEND API    |     |   SERVICES IA    |
|                  |     |                  |     |                  |
| React + TypeScript|<--->|    AdonisJS     |<--->|  FastAPI Python  |
| Vite + TailwindCSS|     |   TypeScript    |     |  Groq LLM        |
|                  |     |                  |     |  ML Models       |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------------------------------------------------------+
|                        BASE DE DONNEES                           |
|              SQLite (dev) / PostgreSQL (prod)                    |
+------------------------------------------------------------------+
```

---

**Technologies Utilisees**

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | React + TypeScript + Vite | Performance, typage fort, DX |
| Backend | AdonisJS (TypeScript) | Framework robuste, ORM integre |
| IA/ML | FastAPI (Python) | Ecosysteme ML, async natif |
| LLM | Groq API | Inference rapide, cout optimise |
| BDD | PostgreSQL | ACID, scalabilite, JSON natif |
| Temps Reel | WebSocket | Notifications instantanees |
| Maps | Google Maps API | Tracking GPS, calcul routes |
| Paiement | MTN Mobile Money | Adapte au marche africain |

---

**Principes d'Architecture**

- API RESTful documentee (OpenAPI/Swagger)
- Separation des responsabilites (Frontend / Backend / IA)
- Microservices pour l'IA (scalabilite independante)
- CI/CD avec GitHub Actions
- Conteneurisation Docker

---

[PLACEHOLDER IMAGE : Diagramme d'architecture avec 3 blocs (Frontend, Backend, IA) connectes, base de donnees en bas, services externes (Maps, Paiement, Notifications) sur le cote]

---


## SLIDE 5 : MODULES 1-2 (FRET DIGITAL + TRACKING GPS)

### Module 1 : Reseau de Fret Digital

**Probleme resolu** : Affreteurs et transporteurs ne se trouvent pas

**Fonctionnalites implementees** :

- Matching intelligent affreteur/transporteur
- Place de marche B2B avec notation temps reel
- Systeme de contre-propositions (prix, delais negociables)
- Workflow complet : DRAFT -> PUBLISHED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> PAID -> COMPLETED
- Calculateur de prix dynamique (distance, poids, volume, urgence)
- KYC : verification documents (permis, assurances)

**Resultat** : Un transporteur peut candidater a une mission en moins de 3 clics

---

### Module 2 : Suivi et Tracking Omniscient

**Probleme resolu** : Colis perdus, zero visibilite

**Fonctionnalites implementees** :

- Tracking GPS temps reel (mise a jour toutes les 30 secondes)
- Carte interactive "Google Maps du fret"
- ETA predictif avec facteurs (meteo, trafic, historique)
- Code QR unique par mission (validation livraison)
- Alertes proactives (arret prolonge, deviation itineraire)
- Historique complet des trajets
- Signalement de problemes (panne, accident, route bloquee)

**Resultat** : Visibilite totale du depart a la livraison

---

[PLACEHOLDER IMAGE : Capture d'ecran splitee - Gauche : liste des missions disponibles avec bouton "Candidater" - Droite : carte GPS avec position du camion en temps reel et ETA affiche]

---


## SLIDE 6 : MODULES 3-4 (LIVRAISON + E-COMMERCE)

### Module 3 : Livraison a Domicile Grand Public

**Probleme resolu** : Particuliers paient trop cher, zero visibilite sur le livreur

**Fonctionnalites implementees** :

- Calcul de tarifs dynamiques (poids, volume, urgence, distance)
- Geolocalisation temps reel du livreur
- Groupage de colis (optimisation tournees via IA)
- Paiement cash-on-delivery avec recu digital
- Notifications push a chaque etape
- Estimation de prix instantanee

**Resultat** : Experience type "Uber Eats" pour les colis

---

### Module 4 : Boutique Pieces Reconditionnees

**Probleme resolu** : Garagistes perdent des jours a chercher des pieces

**Fonctionnalites implementees** :

- Catalogue intelligent avec filtres (categorie, compatibilite vehicule)
- Recherche par numero de serie
- Scoring de qualite des pieces (fiabilite testee, garantie)
- Panier, commande, paiement securise (Mobile Money)
- Gestion des retours et garanties
- Alertes stock faible automatiques
- Statistiques ventes (web + boutique physique)
- Integration livraison express (Module 3)

**Resultat** : "Amazon des pieces camion" avec livraison sous 24h

---

[PLACEHOLDER IMAGE : Capture d'ecran splitee - Gauche : page produit avec score de fiabilite et bouton "Ajouter au panier" - Droite : notification "Votre livreur est a 200m"]

---


## SLIDE 7 : MODULES 5-6 (CHATBOT IA + DATA PREDICTIF)

### Module 5 : Chatbot et Support Tactique

**Probleme resolu** : Reclamations en 72h+, clients bloques la nuit

**Fonctionnalites implementees** :

- Chatbot IA 24/7 (Groq LLM)
- 14 fonctions READ-ONLY adaptees par profil utilisateur
- Triple canal : Admin/Transporteur, Admin/Affreteur, Support clients
- Navigation intelligente vers les pages appropriees
- Analyse de sentiment automatique (detection clients mecontents)
- Bouton SOS pour urgences (panne, accident)
- Historique complet des conversations

**Resultat** : Resolution automatique des questions frequentes, support instantane

---

### Module 6 : IA et Data - Le Cerveau Predictif

**Probleme resolu** : Retards constates, jamais prevus

**Fonctionnalites implementees** :

- Prediction ETA avec facteurs explicatifs (meteo, trafic, historique chauffeur)
- Score de fiabilite transporteurs/affreteurs (ponctualite, annulations)
- Recommandation de prix dynamique pour pieces reconditionnees
- Optimisation de trajets ("Evitez la N5 : 3 controles prevus")
- Detection de fraude (paiements suspects, documents falsifies)
- Recommandation produits intelligente
- Tableaux de bord analytiques interactifs (KPI temps reel)

**Resultat** : "Tableau de bord Jedi" avec predictions et conseils automatises

---

[PLACEHOLDER IMAGE : Capture d'ecran splitee - Gauche : interface chatbot avec conversation et suggestions - Droite : dashboard analytique avec graphiques ETA, scores transporteurs, alertes]

---


## SLIDE 8 : DEMONSTRATION

### Parcours Utilisateur en Action

---

**Scenario Demo : Mission Complete**

```
1. AFFRETEUR cree une mission (Yaounde -> Douala, 2 tonnes)
   -> Calculateur de prix suggere : 45 000 - 55 000 FCFA

2. TRANSPORTEUR voit la mission, candidate en 3 clics
   -> Notification push a l'affreteur

3. AFFRETEUR accepte, mission passe en ASSIGNED
   -> Code QR genere automatiquement

4. TRANSPORTEUR demarre, GPS actif
   -> Affreteur suit en temps reel sur la carte

5. Alerte IA : "Retard probable de 30min (trafic Edea)"
   -> Notification proactive aux deux parties

6. TRANSPORTEUR livre, scanne le QR
   -> Statut passe a DELIVERED automatiquement

7. AFFRETEUR paie via Mobile Money
   -> Mission COMPLETED, feedback demande
```

---

**Points Cles a Montrer**

| Fonctionnalite | Temps Demo |
|----------------|------------|
| Creation mission + calcul prix | 1 min |
| Candidature transporteur | 30 sec |
| Tracking GPS temps reel | 1 min |
| Chatbot IA (question sur mission) | 30 sec |
| Boutique e-commerce (achat piece) | 1 min |
| Dashboard admin (stats) | 30 sec |

---

[PLACEHOLDER IMAGE : Serie de 4-6 captures d'ecran montrant le parcours complet : formulaire creation mission, carte GPS, notification mobile, scan QR, confirmation paiement]

---


## SLIDE 9 : METRIQUES ET QUALITE

### Indicateurs de Performance

---

**Objectifs Techniques Atteints**

| Metrique | Objectif | Resultat |
|----------|----------|----------|
| Couverture tests | >= 80% | [A COMPLETER] |
| Temps reponse API | < 400ms (p95) | [A COMPLETER] |
| Utilisateurs simultanes | 500+ | Architecture prete |
| Disponibilite | 99.9% | Infrastructure Docker |

---

**Qualite Logicielle**

- Clean Code : Principes SOLID, DRY, KISS respectes
- TypeScript : Typage fort frontend et backend
- Linting : ESLint + Prettier (JS/TS), Black (Python)
- Revue de code : Pull Requests obligatoires
- CI/CD : GitHub Actions (build, tests, deploy auto)
- Documentation : API Swagger, guides utilisateur complets

---

**Conformite au Cahier des Charges**

| Critere | Poids | Couverture |
|---------|-------|------------|
| Fonctionnalites (6 modules) | 30% | 100% - Tous implementes |
| Qualite logicielle et tests | 25% | Tests unitaires + e2e |
| Data et IA | 15% | Chatbot LLM, predictions ETA, recommandations |
| UX et Mobile | 10% | Responsive, design moderne |
| Architecture et Securite | 10% | MFA, roles, audit logs |
| Agilite et livrables | 10% | Scrum, sprints respectes |

---

[PLACEHOLDER IMAGE : Dashboard de metriques avec graphiques : couverture tests, temps de reponse API, repartition par module, timeline des sprints]

---


## SLIDE 10 : CONCLUSION ET ROADMAP

### Vision Future

---

**Ce Que Nous Avons Livre**

- 6 modules obligatoires 100% implementes
- Plateforme multi-roles fonctionnelle (Admin, Transporteur, Affreteur, Client)
- IA integree (Chatbot, Predictions, Recommandations)
- Architecture scalable et securisee
- Documentation complete (technique + utilisateur)
- Tests automatises et CI/CD operationnel

---

**Roadmap Post-Concours**

| Phase | Horizon | Objectif |
|-------|---------|----------|
| Phase 1 | 0-3 mois | Application mobile native (Flutter) |
| Phase 2 | 3-6 mois | Integration paiements supplementaires (Orange Money, Visa) |
| Phase 3 | 6-12 mois | Expansion regionale (CEMAC) |
| Phase 4 | 12+ mois | IA avancee (detection fraude, optimisation routes ML) |

---

**Impact Attendu**

- Taux de mise en relation affreteur/transporteur : 60% -> 95%
- Reduction des retards : -40%
- Satisfaction client : > 4.5/5
- Camions a vide : 30% -> 5%

---

**Merci !**

> "Coder, c'est comme livrer un colis : il faut que ca arrive complet, a l'heure, et que ca donne envie de revenir."

---

**Questions ?**

TSA InnovLab | infos@tsa-logistique.com | +237 651 21 87 97

---

[PLACEHOLDER IMAGE : Slide de cloture avec logo TSA InnovLab, QR code vers la demo en ligne, coordonnees de l'equipe]

---


## ANNEXE : NOTES POUR LE PRESENTATEUR

### Timing Suggere (10-15 min)

| Slide | Duree | Notes |
|-------|-------|-------|
| 1. Titre | 30 sec | Presenter l'equipe rapidement |
| 2. Probleme | 1 min | Insister sur les chiffres concrets |
| 3. Solution | 1 min 30 | Montrer la vision globale |
| 4. Architecture | 1 min | Rester haut niveau, pas trop technique |
| 5. Modules 1-2 | 1 min 30 | Focus sur le tracking GPS |
| 6. Modules 3-4 | 1 min 30 | Focus sur l'e-commerce |
| 7. Modules 5-6 | 1 min 30 | Focus sur l'IA |
| 8. Demo | 3 min | Demo live ou video |
| 9. Metriques | 1 min | Chiffres cles uniquement |
| 10. Conclusion | 1 min | Finir sur l'impact |

---

### Points a Preparer

1. Demo live fonctionnelle OU video de backup (3-5 min)
2. Comptes de test pour chaque role (Admin, Transporteur, Affreteur)
3. Donnees de demo realistes (missions, produits, utilisateurs)
4. Reponses aux questions probables du jury :
   - "Comment gerez-vous la scalabilite ?"
   - "Quelle est la precision de vos predictions ETA ?"
   - "Comment monetisez-vous la plateforme ?"
   - "Quels sont les risques techniques ?"

---

### Criteres d'Evaluation (Rappel)

| Critere | Poids |
|---------|-------|
| Fonctionnalites et conformite | 30% |
| Qualite logicielle et tests | 25% |
| Data et IA | 15% |
| UX et Mobile | 10% |
| Architecture et Securite | 10% |
| Agilite et livrables | 10% |

---

**Fin du Document de Presentation**
