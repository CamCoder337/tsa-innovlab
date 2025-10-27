"""
Tests unitaires pour le service de pricing.
"""

import pytest
from app.services.pricing_service import PricingService, get_pricing_service


class TestPricingService:
    """Tests pour PricingService"""
    
    def setup_method(self):
        """Setup avant chaque test"""
        self.service = PricingService()
    
    def test_calculate_price_simple(self):
        """Test calcul de prix simple"""
        result = self.service.calculate_price(236.1, 5.0)
        
        assert result['prix_calcule'] == 59025.0
        assert result['devise'] == 'FCFA'
        assert result['details']['distance_km'] == 236.1
        assert result['details']['poids_tonnes'] == 5.0
        assert result['details']['prix_par_km_par_tonne'] == 50
    
    def test_calculate_price_with_metadata(self):
        """Test calcul avec métadonnées"""
        metadata = {
            'ville_depart': 'Yaoundé',
            'ville_arrivee': 'Douala'
        }
        result = self.service.calculate_price(236.1, 5.0, metadata)
        
        assert 'metadata' in result
        assert result['metadata']['ville_depart'] == 'Yaoundé'
    
    def test_calculate_price_invalid_distance(self):
        """Test avec distance invalide"""
        with pytest.raises(ValueError, match="distance doit être positive"):
            self.service.calculate_price(-100, 5.0)
        
        with pytest.raises(ValueError, match="distance doit être positive"):
            self.service.calculate_price(0, 5.0)
    
    def test_calculate_price_invalid_poids(self):
        """Test avec poids invalide"""
        with pytest.raises(ValueError, match="poids doit être positif"):
            self.service.calculate_price(236.1, -5.0)
        
        with pytest.raises(ValueError, match="poids doit être positif"):
            self.service.calculate_price(236.1, 0)
    
    def test_calculate_price_batch_success(self):
        """Test calcul batch avec succès"""
        missions = [
            {"distance_km": 236.1, "poids_tonnes": 5.0},
            {"distance_km": 1109.0, "poids_tonnes": 10.0}
        ]
        
        results = self.service.calculate_price_batch(missions)
        
        assert len(results) == 2
        assert results[0]['success'] is True
        assert results[0]['prix_calcule'] == 59025.0
        assert results[1]['success'] is True
        assert results[1]['prix_calcule'] == 554500.0
    
    def test_calculate_price_batch_with_errors(self):
        """Test calcul batch avec erreurs"""
        missions = [
            {"distance_km": 236.1, "poids_tonnes": 5.0},
            {"distance_km": -100, "poids_tonnes": 5.0},  # Distance invalide
            {"poids_tonnes": 5.0},  # Distance manquante
        ]
        
        results = self.service.calculate_price_batch(missions)
        
        assert len(results) == 3
        assert results[0]['success'] is True
        assert results[1]['success'] is False
        assert 'error' in results[1]
        assert results[2]['success'] is False
        assert 'error' in results[2]
    
    def test_get_price_estimate_range(self):
        """Test fourchette de prix"""
        result = self.service.get_price_estimate_range(236.1, 5.0, variation_percent=5.0)
        
        assert 'prix_min' in result
        assert 'prix_moyen' in result
        assert 'prix_max' in result
        assert result['prix_moyen'] == 59025.0
        assert result['prix_min'] < result['prix_moyen']
        assert result['prix_max'] > result['prix_moyen']
    
    def test_get_pricing_service_singleton(self):
        """Test que get_pricing_service retourne une instance valide"""
        service1 = get_pricing_service()
        service2 = get_pricing_service()
        
        # Both should be valid instances
        assert service1 is not None
        assert service2 is not None
        assert isinstance(service1, PricingService)
        assert isinstance(service2, PricingService)
    
    def test_real_world_examples(self):
        """Test avec exemples réels du Cameroun"""
        # Yaoundé → Douala (5 tonnes)
        result1 = self.service.calculate_price(236.1, 5.0)
        assert result1['prix_calcule'] == 59025.0
        
        # Yaoundé → Garoua (10 tonnes) - distance corrigée
        result2 = self.service.calculate_price(1109.0, 10.0)
        assert result2['prix_calcule'] == 554500.0
        
        # Yaoundé → Ebolowa (2.5 tonnes)
        result3 = self.service.calculate_price(157.6, 2.5)
        assert result3['prix_calcule'] == 19700.0


if __name__ == "__main__":
    # Exécution rapide des tests
    pytest.main([__file__, "-v"])
