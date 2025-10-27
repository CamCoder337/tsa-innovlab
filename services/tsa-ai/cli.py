#!/usr/bin/env python3
"""
CLI pour le système de reconnaissance visuelle
"""
import argparse
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))


def serve_command(args):
    """Commande pour lancer l'API"""
    import uvicorn
    
    print(f"🚀 Démarrage de l'API sur {args.host}:{args.port}")
    print(f"   Documentation: http://{args.host}:{args.port}/docs")
    print()
    
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


def test_vision_command(args):
    """Teste la configuration Google Cloud Vision"""
    print("🔍 Test de la configuration Google Cloud Vision\n")
    
    import os
    from google.cloud import vision
    
    # Vérifier les credentials
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path:
        print("❌ GOOGLE_APPLICATION_CREDENTIALS non défini")
        print("\nDéfinissez la variable d'environnement:")
        print("  Windows: $env:GOOGLE_APPLICATION_CREDENTIALS='path\\to\\credentials.json'")
        print("  Linux:   export GOOGLE_APPLICATION_CREDENTIALS='path/to/credentials.json'")
        return False
    
    print(f"✅ Credentials: {credentials_path}")
    
    if not Path(credentials_path).exists():
        print(f"❌ Fichier non trouvé: {credentials_path}")
        return False
    
    print(f"✅ Fichier existe")
    
    # Tester le client
    try:
        client = vision.ImageAnnotatorClient()
        print("✅ Client Vision API initialisé")
        
        # Test avec une image simple si fournie
        if args.test_image and Path(args.test_image).exists():
            print(f"\n🖼️  Test avec image: {args.test_image}")
            
            with open(args.test_image, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            response = client.label_detection(image=image, max_results=5)
            
            print("\n📋 Labels détectés:")
            for label in response.label_annotations:
                print(f"   - {label.description} (score: {label.score:.2f})")
        
        print("\n✅ Configuration Google Cloud Vision OK!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="CLI pour le système de reconnaissance visuelle"
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commandes disponibles')
    
    # Commande serve
    serve_parser = subparsers.add_parser('serve', help='Lancer l\'API FastAPI')
    serve_parser.add_argument(
        '--host',
        type=str,
        default='0.0.0.0',
        help='Adresse d\'écoute'
    )
    serve_parser.add_argument(
        '--port',
        type=int,
        default=8000,
        help='Port d\'écoute'
    )
    serve_parser.add_argument(
        '--reload',
        action='store_true',
        help='Activer le rechargement automatique'
    )
    serve_parser.set_defaults(func=serve_command)
    
    # Commande test-vision
    test_parser = subparsers.add_parser('test-vision', help='Tester la configuration Google Cloud Vision')
    test_parser.add_argument(
        '--test-image',
        type=str,
        help='Chemin vers une image de test (optionnel)'
    )
    test_parser.set_defaults(func=test_vision_command)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    args.func(args)


if __name__ == '__main__':
    main()
