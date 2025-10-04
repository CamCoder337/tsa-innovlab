import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface LegendItem {
  type: 'origin' | 'destination' | 'vehicle' | 'user';
  label: string;
  iconUrl: string;
  description?: string;
}

interface MapLegendProps {
  showUserLocation?: boolean;
  className?: string;
}

export default function MapLegend({ showUserLocation = false, className = '' }: MapLegendProps) {
  const legendItems: LegendItem[] = [
    {
      type: 'origin',
      label: 'Lieu de départ',
      iconUrl: 'https://maps.google.com/mapfiles/kml/paddle/go.png',
      description: 'Point de collecte de la marchandise',
    },
    {
      type: 'destination',
      label: "Lieu d'arrivée",
      iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/flag.png',
      description: 'Point de livraison final',
    },
    {
      type: 'vehicle',
      label: 'Position transporteur',
      iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/truck.png',
      description: 'Position actuelle du véhicule',
    },
  ];

  if (showUserLocation) {
    legendItems.push({
      type: 'user',
      label: 'Votre position',
      iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png',
      description: 'Votre position GPS actuelle',
    });
  }

  return (
    <div className={`absolute bottom-0 left-4 ${className}`}>
      <Card className="bg-white/95 backdrop-blur shadow-lg  py-3">
        <CardContent className="px-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <Package className="w-4 h-4" />
            Légende des Missions
          </h4>

          <div className="space-y-4">
            {/* Types de marqueurs */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Types de marqueurs
              </h5>
              <div className="space-y-2">
                {legendItems.map((item) => (
                  <div key={item.type} className="flex items-center gap-3 group">
                    <div className="relative">
                      <img
                        src={item.iconUrl}
                        alt={item.label}
                        className="w-6 h-6 object-contain"
                        style={{
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                          imageRendering: 'crisp-edges',
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      {/* {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.description}
                        </p>
                      )} */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinéraires */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Itinéraires
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-8 h-1 bg-blue-500 rounded-full shadow-sm"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">Tracé de l'itinéraire</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-8 h-1 bg-orange-500 rounded-full shadow-sm"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">Route alternative</span>
                </div>
              </div>
            </div>

            {/* Statuts */}
            {/* <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Statuts des missions
              </h5>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-xs text-gray-700">Publiée</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                  <span className="text-xs text-gray-700">Assignée</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                  <span className="text-xs text-gray-700">En cours</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-xs text-gray-700">Terminée</span>
                </div>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
