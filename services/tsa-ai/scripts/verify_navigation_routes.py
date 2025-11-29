"""
Script pour vérifier que les navigation hints du chatbot correspondent aux routes frontend réelles
"""
import re
import sys
from pathlib import Path

# Routes définies dans le chatbot
CHATBOT_ROUTES = {
    "track_shipment": "/app/mission/{id}/tracking",
    "get_product_details": "/app/shop/product/{id}",
    "get_order_details": "/app/shop/order/{id}",
    "calculate_price": "/app/missions/create",
    "get_cart": "/app/shop/cart",
    "get_my_orders": "/app/shop/orders",
    "get_user_missions": "/app/missions",
    "get_my_vehicles": "/app/vehicles",
    "get_my_profile": "/app/profile",
    "search_products": "/app/shop",
}

def extract_frontend_routes(app_tsx_path: str) -> dict:
    """Extraire les routes du fichier App.tsx avec leur contexte"""
    with open(app_tsx_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    routes = {}
    current_parent = "/app"
    
    # Parser ligne par ligne pour comprendre la hiérarchie
    lines = content.split('\n')
    parent_stack = ["/app"]
    
    for line in lines:
        # Détecter <Route path="xxx">
        if '<Route path=' in line:
            match = re.search(r'path="([^"]+)"', line)
            if match:
                path = match.group(1)
                
                # Si c'est une route absolue
                if path.startswith('/'):
                    full_path = path
                    if '<Route path=' in line and not '/>' in line:
                        # C'est un parent
                        parent_stack.append(full_path)
                else:
                    # Route relative, combiner avec le parent
                    parent = parent_stack[-1] if parent_stack else ""
                    if path == "":
                        full_path = parent
                    else:
                        full_path = f"{parent}/{path}" if parent else f"/{path}"
                
                routes[full_path] = True
        
        # Détecter fermeture de Route parent
        if '</Route>' in line and len(parent_stack) > 1:
            parent_stack.pop()
    
    return routes

def normalize_route(route: str) -> str:
    """Normaliser une route pour la comparaison"""
    # Remplacer {id} par :id
    return route.replace("{id}", ":id")

def verify_routes():
    """Vérifier que toutes les routes du chatbot existent dans le frontend"""
    # Trouver le fichier App.tsx
    project_root = Path(__file__).parent.parent.parent.parent
    app_tsx = project_root / "apps" / "frontend-web" / "src" / "App.tsx"
    
    if not app_tsx.exists():
        print(f"❌ Fichier App.tsx non trouvé: {app_tsx}")
        return False
    
    print(f"📁 Lecture de {app_tsx}")
    frontend_routes_dict = extract_frontend_routes(str(app_tsx))
    frontend_routes = set(frontend_routes_dict.keys())
    
    print(f"\n✅ {len(frontend_routes)} routes trouvées dans le frontend\n")
    
    # Vérifier chaque route du chatbot
    all_valid = True
    for function_name, chatbot_route in CHATBOT_ROUTES.items():
        normalized = normalize_route(chatbot_route)
        
        # Vérifier si la route existe (exacte ou pattern)
        route_exists = False
        
        # Vérifier route exacte
        if chatbot_route in frontend_routes or normalized in frontend_routes:
            route_exists = True
        else:
            # Vérifier pattern (ex: /app/shop/product/:id)
            parts = normalized.split('/')
            for frontend_route in frontend_routes:
                frontend_parts = frontend_route.split('/')
                if len(parts) == len(frontend_parts):
                    match = True
                    for i, part in enumerate(parts):
                        if part != frontend_parts[i] and part != ':id' and frontend_parts[i] != ':id':
                            match = False
                            break
                    if match:
                        route_exists = True
                        break
        
        if route_exists:
            print(f"✅ {function_name:25} → {chatbot_route}")
        else:
            print(f"❌ {function_name:25} → {chatbot_route} (NON TROUVÉE)")
            all_valid = False
    
    print("\n" + "="*70)
    if all_valid:
        print("✅ SUCCÈS: Toutes les routes du chatbot existent dans le frontend")
        return True
    else:
        print("❌ ÉCHEC: Certaines routes du chatbot n'existent pas dans le frontend")
        print("\nRoutes frontend disponibles:")
        for route in sorted(frontend_routes):
            if route.startswith('/app') or route.startswith('app'):
                print(f"  - {route}")
        return False

if __name__ == "__main__":
    success = verify_routes()
    sys.exit(0 if success else 1)
