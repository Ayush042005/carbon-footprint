import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface EmissionMapProps {
  activities: any[];
}

export default function EmissionMap({ activities }: EmissionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then((google) => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.2090 }, // Center around Delhi, India
        zoom: 11,
        styles: [
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#ffffff" }, { "lightness": 17 }]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }, { "lightness": 21 }]
          }
        ]
      });

      // Filter transport logs
      const transportLogs = activities.filter((act) => act.category === 'transport');

      transportLogs.forEach((log, index) => {
        // Color intensity calculation
        let markerColor = '#16a34a'; // green: low < 10kg
        if (log.emission_kg > 30) {
          markerColor = '#ef4444'; // red: high > 30kg
        } else if (log.emission_kg > 10) {
          markerColor = '#f59e0b'; // orange: medium 10-30kg
        }

        if (log.origin && log.destination) {
          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: markerColor,
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          });

          directionsService.route(
            {
              origin: log.origin,
              destination: log.destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
              if (status === 'OK' && result) {
                directionsRenderer.setDirections(result);
              }
            }
          );
        } else {
          // Mock coordinates distributed around center as fallback
          const offsetLat = (index - (transportLogs.length - 1) / 2) * 0.03;
          const offsetLng = (index % 2 === 0 ? 1 : -1) * 0.03;
          const lat = 28.6139 + offsetLat;
          const lng = 77.2090 + offsetLng;

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: `${log.sub_type.replace(/_/g, ' ')} (${log.quantity} km)`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: markerColor,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 12,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="font-family: Inter, sans-serif; padding: 6px; min-width: 160px;">
                <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: capitalize;">
                  🚗 ${log.sub_type.replace(/_/g, ' ')}
                </h4>
                <p style="margin: 0; font-size: 11px; color: #475569;">Distance: <b>${log.quantity} km</b></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 600; color: ${markerColor};">
                  Footprint: ${log.emission_kg.toFixed(1)} kg CO₂e
                </p>
                ${log.notes ? `<div style="margin-top: 6px; padding-top: 4px; border-t: 1px solid #f1f5f9; font-size: 10px; font-style: italic; color: #94a3b8;">"${log.notes}"</div>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });
    });
  }, [activities]);

  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!hasKey) {
    return (
      <div className="bg-white border border-green-100 rounded-2xl p-12 text-center space-y-4">
        <span className="text-5xl block" role="img" aria-label="warning map">🗺️</span>
        <h3 className="font-bold text-slate-800 text-lg">Interactive Map Offline</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Please add a valid `VITE_GOOGLE_MAPS_API_KEY` to your `.env` configuration file to enable route markers and transport visualizer.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-100 overflow-hidden shadow-sm h-[480px]">
      <div ref={mapRef} className="w-full h-full min-h-[450px]" />
    </div>
  );
}
