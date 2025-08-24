# Scripts - Automatisation et Utilitaires

Ce dossier contient les scripts pour l'automatisation des tâches ML, le déploiement des modèles et la maintenance du système TSA Contest.

## 📁 Structure

```
scripts/
├── README.md                       # Ce fichier
├── data_processing/
│   ├── extract_data.py             # Extraction données depuis Adonis DB
│   ├── clean_data.py               # Nettoyage et validation données
│   ├── feature_engineering.py     # Génération features automatisée
│   └── data_validation.py          # Validation qualité données
├── model_training/
│   ├── train_eta_model.py          # Entraînement modèle ETA
│   ├── train_anomaly_model.py      # Entraînement détection anomalies
│   ├── train_recommendation_model.py # Entraînement recommandations
│   └── train_all_models.py         # Entraînement complet automatisé
├── model_evaluation/
│   ├── evaluate_models.py          # Évaluation performance modèles
│   ├── compare_models.py           # Comparaison versions modèles
│   ├── generate_reports.py         # Génération rapports performance
│   └── model_diagnostics.py        # Diagnostics santé modèles
├── deployment/
│   ├── deploy_models.py            # Déploiement modèles en production
│   ├── rollback_models.py          # Rollback vers version précédente
│   ├── health_check.py             # Vérification santé système
│   └── performance_monitor.py      # Monitoring performance continue
├── database/
│   ├── init_database.py            # Initialisation base de données
│   ├── migrate_data.py             # Migrations de données
│   ├── backup_database.py          # Sauvegarde base de données
│   └── generate_test_data.py       # Génération données de test
├── maintenance/
│   ├── cleanup_old_models.py       # Nettoyage anciens modèles
│   ├── update_dependencies.py      # Mise à jour dépendances
│   ├── system_diagnostics.py       # Diagnostics système complets
│   └── log_analysis.py             # Analyse logs application
└── utils/
    ├── config.py                   # Configuration partagée
    ├── logging_config.py           # Configuration logging
    ├── database_utils.py           # Utilitaires base de données
    └── ml_utils.py                 # Utilitaires ML communs
```

## 🎯 Objectifs des Scripts

### **Data Processing**
- Automatiser l'extraction des données depuis Adonis
- Nettoyer et valider la qualité des données
- Générer les features pour l'entraînement ML
- Maintenir la cohérence des datasets

### **Model Training**
- Entraîner les modèles ML de façon reproductible
- Optimiser les hyperparamètres automatiquement
- Gérer les versions des modèles
- Automatiser le pipeline complet d'entraînement

### **Model Evaluation**
- Évaluer les performances des modèles
- Comparer différentes versions
- Générer des rapports automatisés
- Détecter les régressions de performance

### **Deployment**
- Déployer les modèles en production
- Gérer les rollbacks en cas de problème
- Monitorer la santé du système
- Alerter en cas d'anomalie

### **Maintenance**
- Maintenir la propreté du système
- Analyser les logs et performances
- Automatiser les tâches récurrentes
- Diagnostiquer les problèmes

##