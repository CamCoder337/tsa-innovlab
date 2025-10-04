import { useState } from 'react';
import TrackingDashboard from '../../pages/tracking/TrackingDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGoogleMapsApiKey } from '@/config/env';

/**
 * Composant d'exemple montrant comment utiliser le système de tracking
 * Ce composant peut être utilisé comme référence ou point de départ
 */
export default function TrackingExample() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(
    !!getGoogleMapsApiKey()
  );

  const checkApiKey = () => {
    const hasKey = !!getGoogleMapsApiKey();
    setApiKeyConfigured(hasKey);

    if (!hasKey) {
      alert('Veuillez configurer VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env');
    }
  };

  if (showDashboard) {
    return <TrackingDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚛 TSA Tracking System</h1>
          <p className="text-xl text-gray-600">Système de tracking temps réel pour TSA Logistics</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Google Maps API</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={
                        apiKeyConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }
                    >
                      {apiKeyConfigured ? '✅ Configuré' : '❌ Non configuré'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={checkApiKey} variant="outline" size="sm">
                  Vérifier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Géolocalisation</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={
                        navigator.geolocation
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {navigator.geolocation ? '✅ Supporté' : '❌ Non supporté'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">WebSocket</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800">🔧 Prêt</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Fonctionnalités Implémentées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Frontend</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Intégration Google Maps
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Service de géolocalisation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    WebSocket temps réel
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Dashboard interactif
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Données de test (Cameroun)
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Backend (Documentation)</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📋</span>
                    AdonisJS v6 + PostGIS
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📋</span>
                    WebSocket Server
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📋</span>
                    Service ETA Google Maps
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📋</span>
                    Modèles et migrations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📋</span>
                    Requêtes géospatiales
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Configuration Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Variables d'environnement</h4>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                  <div>VITE_API_URL=http://localhost:3333</div>
                  <div>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Obtenir une clé Google Maps API</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    Aller sur{' '}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Créer un projet ou sélectionner un existant</li>
                  <li>Activer "Maps JavaScript API" et "Distance Matrix API"</li>
                  <li>Créer une clé API avec restrictions de domaine</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowDashboard(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            disabled={!apiKeyConfigured}
          >
            {apiKeyConfigured ? '🚀 Lancer le Dashboard' : "⚠️ Configurer d'abord l'API"}
          </Button>

          {!apiKeyConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Configurez votre clé Google Maps API pour continuer
            </p>
          )}
        </div>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Frontend</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Guide complet d'implémentation et d'intégration
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  FRONTEND_TRACKING_IMPLEMENTATION.md
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Backend</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Documentation AdonisJS + PostGIS + WebSocket
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  BACKEND_TRACKING_IMPLEMENTATION.md
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
