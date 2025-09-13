#!/usr/bin/env python3
"""
Script de test pour l'API FastAPI TSA Contest
Teste les endpoints principaux
"""
import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/ai"


def test_health_endpoints():
    """Test les endpoints de health check"""
    print("🏥 Testing Health Endpoints...")

    # Basic health
    response = requests.get(f"{API_BASE}/health/")
    print(f"Basic Health: {response.status_code} - {response.json()}")

    # Detailed health
    response = requests.get(f"{API_BASE}/health/detailed")
    print(f"Detailed Health: {response.status_code}")
    if response.status_code == 200:
        health_data = response.json()
        print(f"  - Status: {health_data['status']}")
        print(f"  - Database: {health_data.get('database', {}).get('status', 'unknown')}")
        print(f"  - ML Models: {health_data.get('ml_models', {}).get('status', 'unknown')}")

    print()


def test_eta_prediction():
    """Test l'endpoint de prédiction ETA"""
    print("🚛 Testing ETA Prediction...")

    # Test data - Douala to Yaoundé
    eta_request = {
        "origin_lat": 4.0483,
        "origin_lng": 9.7043,
        "origin_address": "Douala, Cameroun",
        "destination_lat": 3.8480,
        "destination_lng": 11.5021,
        "destination_address": "Yaoundé, Cameroun",
        "vehicle_type": "truck",
        "cargo_weight_kg": 2000,
        "cargo_volume_m3": 15,
        "departure_time": (datetime.now() + timedelta(hours=2)).isoformat(),
        "priority": "normal",
        "driver_experience_years": 8
    }

    response = requests.post(f"{API_BASE}/eta/predict", json=eta_request)
    print(f"ETA Prediction: {response.status_code}")

    if response.status_code == 200:
        eta_data = response.json()
        print(f"  - Duration: {eta_data['estimated_duration_minutes']} minutes")
        print(f"  - Distance: {eta_data['distance_km']} km")
        print(f"  - Confidence: {eta_data['confidence_score']}")
        print(f"  - Risk factors: {eta_data['risk_factors']}")
        print(f"  - Range: {eta_data['min_duration_minutes']}-{eta_data['max_duration_minutes']} minutes")
    else:
        print(f"  - Error: {response.text}")

    print()


def test_eta_quick():
    """Test l'endpoint ETA rapide"""
    print("⚡ Testing Quick ETA...")

    # Douala to Bafoussam coordinates
    origin_lat, origin_lng = 4.0483, 9.7043
    dest_lat, dest_lng = 5.4781, 10.4176

    response = requests.get(
        f"{API_BASE}/eta/quick/{origin_lat}/{origin_lng}/{dest_lat}/{dest_lng}",
        params={"vehicle_type": "van", "cargo_weight": 800}
    )

    print(f"Quick ETA: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - Duration: {data['duration_minutes']} minutes")
        print(f"  - Distance: {data['distance_km']} km")
        print(f"  - Confidence: {data['confidence']}")
    else:
        print(f"  - Error: {response.text}")

    print()


def test_eta_batch():
    """Test la prédiction ETA en batch"""
    print("📦 Testing Batch ETA Prediction...")

    batch_request = {
        "predictions": [
            {
                "origin_lat": 4.0483,
                "origin_lng": 9.7043,
                "destination_lat": 3.8480,
                "destination_lng": 11.5021,
                "vehicle_type": "truck",
                "cargo_weight_kg": 1500
            },
            {
                "origin_lat": 3.8480,
                "origin_lng": 11.5021,
                "destination_lat": 5.4781,
                "destination_lng": 10.4176,
                "vehicle_type": "van",
                "cargo_weight_kg": 800
            },
            {
                "origin_lat": 5.4781,
                "origin_lng": 10.4176,
                "destination_lat": 7.3697,
                "destination_lng": 12.3547,
                "vehicle_type": "moto",
                "cargo_weight_kg": 50
            }
        ]
    }

    response = requests.post(f"{API_BASE}/eta/predict/batch", json=batch_request)
    print(f"Batch ETA: {response.status_code}")

    if response.status_code == 200:
        batch_data = response.json()
        print(f"  - Total predictions: {len(batch_data['predictions'])}")
        print(f"  - Successful: {batch_data['successful_predictions']}")
        print(f"  - Failed: {batch_data['failed_predictions']}")
        print(f"  - Processing time: {batch_data['processing_time_ms']}ms")

        for i, pred in enumerate(batch_data['predictions'][:3]):  # Show first 3
            print(f"    Prediction {i + 1}: {pred['estimated_duration_minutes']} min")
    else:
        print(f"  - Error: {response.text}")

    print()


def test_eta_model_stats():
    """Test les statistiques du modèle"""
    print("📊 Testing Model Stats...")

    response = requests.get(f"{API_BASE}/eta/model/stats")
    print(f"Model Stats: {response.status_code}")

    if response.status_code == 200:
        stats = response.json()
        print(f"  - Model version: {stats['model_version']}")
        print(f"  - Total predictions: {stats['total_predictions']}")
        print(f"  - Average accuracy: {stats['average_accuracy_percent']}%")
        print(f"  - Features used: {len(stats['features_used'])}")

    print()


def test_validation_errors():
    """Test la validation des erreurs"""
    print("❌ Testing Validation Errors...")

    # Invalid coordinates
    invalid_request = {
        "origin_lat": 200,  # Invalid latitude
        "origin_lng": 9.7043,
        "destination_lat": 3.8480,
        "destination_lng": 300,  # Invalid longitude
        "vehicle_type": "invalid_vehicle"  # Invalid vehicle type
    }

    response = requests.post(f"{API_BASE}/eta/predict", json=invalid_request)
    print(f"Invalid Request: {response.status_code}")
    if response.status_code == 422:
        error_data = response.json()
        print(f"  - Validation errors found: {len(error_data.get('errors', []))}")
        for error in error_data.get('errors', [])[:3]:  # Show first 3 errors
            print(f"    • {error.get('loc', [])} - {error.get('msg', '')}")

    print()


def test_performance():
    """Test les performances de l'API"""
    print("⏱️  Testing Performance...")

    # Simple ETA request
    eta_request = {
        "origin_lat": 4.0483,
        "origin_lng": 9.7043,
        "destination_lat": 3.8480,
        "destination_lng": 11.5021,
        "vehicle_type": "van"
    }

    # Measure response time
    start_time = time.time()
    response = requests.post(f"{API_BASE}/eta/predict", json=eta_request)
    end_time = time.time()

    response_time_ms = (end_time - start_time) * 1000
    print(f"Single prediction response time: {response_time_ms:.2f}ms")

    # Test multiple requests
    times = []
    for i in range(5):
        start = time.time()
        requests.post(f"{API_BASE}/eta/predict", json=eta_request)
        end = time.time()
        times.append((end - start) * 1000)

    avg_time = sum(times) / len(times)
    print(f"Average response time (5 requests): {avg_time:.2f}ms")
    print(f"Min: {min(times):.2f}ms, Max: {max(times):.2f}ms")

    print()


def run_comprehensive_test():
    """Lance tous les tests"""
    print("🚀 Starting TSA Contest FastAPI Tests")
    print("=" * 50)

    try:
        # Test connection
        response = requests.get(BASE_URL)
        if response.status_code != 200:
            print(f"❌ Cannot connect to API at {BASE_URL}")
            return

        print(f"✅ Connected to {BASE_URL}")
        root_data = response.json()
        print(f"Service: {root_data.get('service')} v{root_data.get('version')}")
        print(f"Environment: {root_data.get('environment')}")
        print()

        # Run all tests
        test_health_endpoints()
        test_eta_prediction()
        test_eta_quick()
        test_eta_batch()
        test_eta_model_stats()
        test_validation_errors()
        test_performance()

        print("✅ All tests completed!")

    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API. Make sure FastAPI is running on {BASE_URL}")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")


def test_specific_cameroon_routes():
    """Test des routes spécifiques au Cameroun"""
    print("🇨🇲 Testing Cameroon-specific routes...")

    cameroon_routes = [
        {
            "name": "Douala → Yaoundé",
            "origin": (4.0483, 9.7043),
            "destination": (3.8480, 11.5021),
            "expected_distance_km": 240
        },
        {
            "name": "Yaoundé → Bafoussam",
            "origin": (3.8480, 11.5021),
            "destination": (5.4781, 10.4176),
            "expected_distance_km": 280
        },
        {
            "name": "Douala → Ngaoundéré",
            "origin": (4.0483, 9.7043),
            "destination": (7.3697, 12.3547),
            "expected_distance_km": 630
        }
    ]

    for route in cameroon_routes:
        lat1, lng1 = route["origin"]
        lat2, lng2 = route["destination"]

        response = requests.get(
            f"{API_BASE}/eta/quick/{lat1}/{lng1}/{lat2}/{lng2}",
            params={"vehicle_type": "truck"}
        )

        if response.status_code == 200:
            data = response.json()
            distance_diff = abs(data["distance_km"] - route["expected_distance_km"])
            accuracy = (1 - distance_diff / route["expected_distance_km"]) * 100

            print(f"  {route['name']}:")
            print(f"    Distance: {data['distance_km']}km (Expected: {route['expected_distance_km']}km)")
            print(f"    Accuracy: {accuracy:.1f}%")
            print(f"    Duration: {data['duration_minutes']} minutes")
        else:
            print(f"  {route['name']}: ❌ Error {response.status_code}")

    print()


if __name__ == "__main__":
    # Run specific test or comprehensive test
    import sys

    if len(sys.argv) > 1:
        test_name = sys.argv[1]

        if test_name == "health":
            test_health_endpoints()
        elif test_name == "eta":
            test_eta_prediction()
        elif test_name == "quick":
            test_eta_quick()
        elif test_name == "batch":
            test_eta_batch()
        elif test_name == "cameroon":
            test_specific_cameroon_routes()
        elif test_name == "performance":
            test_performance()
        else:
            print(f"Unknown test: {test_name}")
            print("Available tests: health, eta, quick, batch, cameroon, performance")
    else:
        # Run comprehensive test
        run_comprehensive_test()
        test_specific_cameroon_routes()