#!/usr/bin/env python3
"""
Script de test rapide pour le système de recommandation de produits
TSA InnovLab - Contest 2025

Usage:
    python test_recommendations_quick.py
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000/api/ai/product-recommendations"
COLORS = {
    'green': '\033[92m',
    'red': '\033[91m',
    'blue': '\033[94m',
    'yellow': '\033[93m',
    'reset': '\033[0m'
}


def print_header(text: str):
    """Afficher un en-tête stylisé"""
    print(f"\n{COLORS['blue']}{'=' * 70}{COLORS['reset']}")
    print(f"{COLORS['blue']}{text}{COLORS['reset']}")
    print(f"{COLORS['blue']}{'=' * 70}{COLORS['reset']}\n")


def print_success(text: str):
    """Afficher un message de succès"""
    print(f"{COLORS['green']}✅ {text}{COLORS['reset']}")


def print_error(text: str):
    """Afficher un message d'erreur"""
    print(f"{COLORS['red']}❌ {text}{COLORS['reset']}")


def print_info(text: str):
    """Afficher une information"""
    print(f"{COLORS['yellow']}ℹ️  {text}{COLORS['reset']}")


def test_health_check() -> bool:
    """Test 1: Health check du service"""
    print_header("Test 1: Health Check")

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print_success(f"Service healthy: {data.get('service', 'N/A')}")
            print_info(f"Version: {data.get('version', 'N/A')}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print_error(f"Cannot connect to service: {e}")
        print_info("Make sure FastAPI service is running on port 8000")
        return False


def test_popular_products() -> bool:
    """Test 2: Produits populaires"""
    print_header("Test 2: Popular Products")

    try:
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/popular",
            params={"limit": 5, "time_window_days": 30},
            timeout=10
        )
        elapsed_time = (time.time() - start_time) * 1000

        if response.status_code == 200:
            data = response.json()

            print_success("Popular products retrieved")
            print_info(f"Strategy: {data.get('strategy_used', 'N/A')}")
            print_info(f"Total: {data.get('total', 0)}")
            print_info(f"Processing time: {data.get('processing_time_ms', 0):.2f}ms")
            print_info(f"Response time: {elapsed_time:.2f}ms")

            if data.get('recommendations'):
                print("\nSample recommendation:")
                rec = data['recommendations'][0]
                print(f"  - Product ID: {rec.get('product_id', 'N/A')}")
                print(f"  - Score: {rec.get('score', 0):.3f}")
                print(f"  - Reason: {rec.get('reason', 'N/A')}")

            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def test_personalized_new_user() -> bool:
    """Test 3: Recommandations personnalisées pour nouvel utilisateur"""
    print_header("Test 3: Personalized Recommendations (New User)")

    payload = {
        "user_id": "00000000-0000-0000-0000-000000000001",
        "limit": 5,
        "context": "homepage"
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/personalized",
            json=payload,
            timeout=10
        )
        elapsed_time = (time.time() - start_time) * 1000

        if response.status_code == 200:
            data = response.json()
            strategy = data.get('strategy_used', 'unknown')

            print_success("Recommendations retrieved")
            print_info(f"Strategy: {strategy}")
            print_info(f"Total: {data.get('total', 0)}")
            print_info(f"Processing time: {data.get('processing_time_ms', 0):.2f}ms")

            # Vérifier la stratégie attendue
            if strategy == 'popularity_based':
                print_success("Correct strategy for new user (popularity_based)")
            else:
                print_error(f"Expected 'popularity_based' but got '{strategy}'")

            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def test_personalized_existing_user() -> bool:
    """Test 4: Recommandations personnalisées pour utilisateur existant"""
    print_header("Test 4: Personalized Recommendations (Existing User)")

    # Utiliser un UUID existant dans votre base de données
    payload = {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "limit": 10,
        "context": "homepage",
        "exclude_product_ids": []
    }

    try:
        response = requests.post(
            f"{BASE_URL}/personalized",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            strategy = data.get('strategy_used', 'unknown')

            print_success("Recommendations retrieved")
            print_info(f"Strategy: {strategy}")
            print_info(f"Total: {data.get('total', 0)}")
            print_info(f"Processing time: {data.get('processing_time_ms', 0):.2f}ms")

            # Afficher les stratégies possibles
            if strategy == 'collaborative_filtering':
                print_success("User has ≥3 purchases → collaborative filtering")
            elif strategy == 'content_based':
                print_success("User has 1-2 purchases → content-based")
            elif strategy == 'popularity_based':
                print_info("User has no purchase history → popularity-based")

            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def test_similar_products() -> bool:
    """Test 5: Produits similaires"""
    print_header("Test 5: Similar Products")

    # Utiliser un product_id existant
    payload = {
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "limit": 5,
        "exclude_product_ids": []
    }

    try:
        response = requests.post(
            f"{BASE_URL}/similar",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()

            print_success("Similar products retrieved")
            print_info(f"Strategy: {data.get('strategy_used', 'N/A')}")
            print_info(f"Success: {data.get('success', False)}")
            print_info(f"Total: {data.get('total', 0)}")

            if data.get('recommendations'):
                print("\nSample similar product:")
                rec = data['recommendations'][0]
                print(f"  - Product ID: {rec.get('product_id', 'N/A')}")
                print(f"  - Score: {rec.get('score', 0):.3f}")
                print(f"  - Reason: {rec.get('reason', 'N/A')}")

            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            print_info("This may fail if the product_id doesn't exist in the database")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def test_validation() -> bool:
    """Test 6: Validation des paramètres"""
    print_header("Test 6: Request Validation")

    # Test avec limite invalide (> 50)
    payload = {
        "user_id": "test-user",
        "limit": 100  # Devrait échouer
    }

    try:
        response = requests.post(
            f"{BASE_URL}/personalized",
            json=payload,
            timeout=10
        )

        if response.status_code == 422:
            print_success("Validation correctly rejected invalid limit (> 50)")
            return True
        else:
            print_error(f"Expected 422 but got {response.status_code}")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def test_performance() -> bool:
    """Test 7: Performance et temps de réponse"""
    print_header("Test 7: Performance Test")

    print_info("Running 10 requests to measure performance...\n")

    times = []
    successes = 0

    for i in range(10):
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/personalized",
                json={"user_id": f"perf-test-user-{i}", "limit": 5},
                timeout=10
            )
            elapsed_time = (time.time() - start_time) * 1000
            times.append(elapsed_time)

            if response.status_code == 200:
                successes += 1

            print(f"  Request {i+1}/10: {elapsed_time:.2f}ms", end="\r")

        except Exception as e:
            print_error(f"Request {i+1} failed: {e}")

    print()  # Newline

    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)

        print_success(f"Performance test completed: {successes}/10 requests successful")
        print_info(f"Average response time: {avg_time:.2f}ms")
        print_info(f"Min: {min_time:.2f}ms")
        print_info(f"Max: {max_time:.2f}ms")

        # Vérifier les performances
        if avg_time < 200:
            print_success("Performance is good (avg < 200ms)")
            return True
        else:
            print_error(f"Performance issue: average time {avg_time:.2f}ms > 200ms")
            return False
    else:
        print_error("No successful requests")
        return False


def test_feedback() -> bool:
    """Test 8: Système de feedback"""
    print_header("Test 8: Feedback System")

    payload = {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "action": "click",
        "context": "homepage"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/feedback",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Feedback submitted successfully")
            print_info(f"Status: {data.get('status', 'N/A')}")
            print_info(f"Message: {data.get('message', 'N/A')}")
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            return False

    except Exception as e:
        print_error(f"Test failed: {e}")
        return False


def run_all_tests():
    """Exécuter tous les tests"""
    print(f"\n{COLORS['blue']}{'*' * 70}{COLORS['reset']}")
    print(f"{COLORS['blue']}  🚀 TSA InnovLab - Product Recommendation System Tests{COLORS['reset']}")
    print(f"{COLORS['blue']}{'*' * 70}{COLORS['reset']}\n")

    results = {
        "Health Check": test_health_check(),
        "Popular Products": test_popular_products(),
        "Personalized (New User)": test_personalized_new_user(),
        "Personalized (Existing User)": test_personalized_existing_user(),
        "Similar Products": test_similar_products(),
        "Request Validation": test_validation(),
        "Performance": test_performance(),
        "Feedback System": test_feedback(),
    }

    # Résumé
    print_header("Test Summary")

    passed = sum(1 for result in results.values() if result)
    total = len(results)

    for test_name, result in results.items():
        status = f"{COLORS['green']}✅ PASSED" if result else f"{COLORS['red']}❌ FAILED"
        print(f"{status}{COLORS['reset']} - {test_name}")

    print(f"\n{COLORS['blue']}{'=' * 70}{COLORS['reset']}")

    if passed == total:
        print(f"{COLORS['green']}🎉 All tests passed! ({passed}/{total}){COLORS['reset']}")
    else:
        print(f"{COLORS['yellow']}⚠️  {passed}/{total} tests passed{COLORS['reset']}")

    print(f"{COLORS['blue']}{'=' * 70}{COLORS['reset']}\n")

    return passed == total


if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print_error("\n\nTests interrupted by user")
        exit(1)
    except Exception as e:
        print_error(f"\n\nUnexpected error: {e}")
        exit(1)
