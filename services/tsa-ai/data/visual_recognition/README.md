# Données de reconnaissance visuelle

## Structure

```
data/visual_recognition/
├── catalog.json          # Catalogue des pièces
├── images/              # Images des pièces (à créer)
│   ├── filtre_huile_001.jpg
│   ├── plaquettes_frein_002.jpg
│   ├── phare_led_003.jpg
│   ├── courroie_004.jpg
│   └── radiateur_005.jpg
└── parts_index.pkl      # Index généré (créé par indexation)
```

## Format du catalogue

Le fichier `catalog.json` contient une liste de pièces avec les champs suivants:

- `id`: Identifiant unique de la pièce
- `nom`: Nom de la pièce
- `reference_oem`: Référence OEM
- `marque`: Marque du fabricant
- `categorie`: Catégorie de la pièce
- `modeles_camion_compatibles`: Liste des modèles de camion compatibles
- `prix`: Prix en FCFA
- `stock`: Quantité en stock
- `image_path`: Chemin relatif vers l'image
- `description`: Description optionnelle

## Ajout de pièces

1. Ajouter l'entrée dans `catalog.json`
2. Placer l'image dans le dossier `images/`
3. Ré-indexer le catalogue avec `python cli.py index`

## Images

Pour ce MVP, vous devez fournir vos propres images de pièces de camion.
Placez-les dans le dossier `images/` en respectant les noms définis dans `catalog.json`.

Format recommandé:
- Format: JPG ou PNG
- Résolution: 512x512 pixels minimum
- Fond: Neutre de préférence
- Éclairage: Uniforme
