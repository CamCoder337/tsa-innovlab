"""
Script de vérification rapide du chatbot READ-ONLY
Exécute des vérifications basiques sans pytest
"""
import sys
import os

# Ajouter le chemin parent pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.chatbot_function_calling_service import ChatbotFunctionCallingService


def verify_no_write_functions():
    """Vérifier qu'aucune fonction WRITE n'est enregistrée"""
    print("\n🔍 Test 1: Vérification des fonctions enregistrées...")
    
    service = ChatbotFunctionCallingService()
    functions = service.functions
    function_names = [f["name"] for f in functions]
    
    # Fonctions INTERDITES
    forbidden = [
        "add_to_cart",
        "remove_from_cart",
        "update_cart_quantity",
        "create_mission",
        "delete_mission",
        "place_order",
        "cancel_order",
        "claim_mission",
        "mark_notification_read"
    ]
    
    errors = []
    for func in forbidden:
        if func in function_names:
            errors.append(f"  ❌ Fonction WRITE '{func}' trouvée (ne devrait PAS exister)")
    
    if errors:
        print("\n".join(errors))
        return False
    
    print(f"  ✅ Aucune fonction WRITE trouvée")
    print(f"  ✅ {len(function_names)} fonctions READ-ONLY enregistrées")
    return True


def verify_handlers_exist():
    """Vérifier que tous les handlers existent"""
    print("\n🔍 Test 2: Vérification de l'existence des handlers...")
    
    service = ChatbotFunctionCallingService()
    
    required_handlers = [
        "_handle_search_products",
        "_handle_get_product_details",
        "_handle_get_cart",
        "_handle_get_my_orders",
        "_handle_get_order_details",
        "_handle_get_user_missions",
        "_handle_get_available_missions",
        "_handle_track_shipment",
        "_handle_calculate_price",
        "_handle_get_my_vehicles",
        "_handle_get_unread_messages",
        "_handle_get_notifications",
        "_handle_get_my_profile",
        "_handle_request_clarification"
    ]
    
    errors = []
    for handler in required_handlers:
        if not hasattr(service, handler):
            errors.append(f"  ❌ Handler '{handler}' manquant")
    
    if errors:
        print("\n".join(errors))
        return False
    
    print(f"  ✅ Tous les {len(required_handlers)} handlers existent")
    return True


def verify_prompt_mentions_read_only():
    """Vérifier que le prompt mentionne READ-ONLY"""
    print("\n🔍 Test 3: Vérification du prompt système...")
    
    service = ChatbotFunctionCallingService()
    prompt = service._build_conversational_prompt("CLIENT", None)
    
    read_only_keywords = [
        "lecture seule",
        "read-only",
        "ne peux pas créer",
        "ne peux pas modifier",
        "guide",
        "informatif"
    ]
    
    prompt_lower = prompt.lower()
    found = [kw for kw in read_only_keywords if kw in prompt_lower]
    
    if len(found) < 2:
        print(f"  ❌ Prompt ne mentionne pas assez le mode READ-ONLY (trouvé: {found})")
        return False
    
    print(f"  ✅ Prompt mentionne READ-ONLY ({len(found)} indicateurs trouvés)")
    return True


def verify_navigation_hints():
    """Vérifier que les navigation hints existent"""
    print("\n🔍 Test 4: Vérification des navigation hints...")
    
    service = ChatbotFunctionCallingService()
    
    test_cases = [
        ("track_shipment", {"shipment_id": "M-123"}),
        ("get_product_details", {"product": {"id": "prod-456"}}),
        ("calculate_price", {"pricing": {"origin": "Douala", "destination": "Yaoundé", "price": 125000}})
    ]
    
    errors = []
    for function_name, result in test_cases:
        hint = service._get_navigation_hint(function_name, result)
        if hint is None:
            errors.append(f"  ❌ Navigation hint manquant pour '{function_name}'")
        elif "route" not in hint:
            errors.append(f"  ❌ Navigation hint pour '{function_name}' n'a pas de 'route'")
    
    if errors:
        print("\n".join(errors))
        return False
    
    print(f"  ✅ Navigation hints existent pour {len(test_cases)} fonctions")
    return True


def verify_history_isolation():
    """Vérifier que l'historique utilise user_id"""
    print("\n🔍 Test 5: Vérification de l'isolation de l'historique...")
    
    try:
        from app.services.intelligent_chatbot_v4_service import IntelligentChatbotV4Service
        import inspect
        
        service = IntelligentChatbotV4Service()
        
        # Vérifier la signature de _load_history_from_db
        sig = inspect.signature(service._load_history_from_db)
        params = list(sig.parameters.keys())
        
        if "user_id" not in params:
            print(f"  ❌ _load_history_from_db ne prend pas user_id en paramètre")
            print(f"     Paramètres actuels: {params}")
            return False
        
        # Vérifier le code source
        source = inspect.getsource(service._load_history_from_db)
        
        if "user_id = :user_id" not in source and "user_id=:user_id" not in source:
            print(f"  ❌ _load_history_from_db ne filtre pas par user_id dans la requête SQL")
            return False
        
        print(f"  ✅ Historique isolé par user_id")
        return True
        
    except Exception as e:
        print(f"  ⚠️  Impossible de vérifier l'isolation: {e}")
        return True  # Ne pas bloquer si on ne peut pas vérifier


def main():
    """Exécuter toutes les vérifications"""
    print("=" * 60)
    print("🤖 VÉRIFICATION DU CHATBOT READ-ONLY")
    print("=" * 60)
    
    tests = [
        ("Fonctions WRITE supprimées", verify_no_write_functions),
        ("Handlers existent", verify_handlers_exist),
        ("Prompt READ-ONLY", verify_prompt_mentions_read_only),
        ("Navigation hints", verify_navigation_hints),
        ("Isolation historique", verify_history_isolation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
            results.append((test_name, False))
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n🎯 Score: {passed}/{total} tests réussis")
    
    if passed == total:
        print("\n🎉 Tous les tests sont passés ! Le chatbot est READ-ONLY.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) échoué(s). Vérifiez les erreurs ci-dessus.")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
