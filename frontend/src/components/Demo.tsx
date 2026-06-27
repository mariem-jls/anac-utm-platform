import { useEffect, useRef, useState } from 'react';
import { Play, ExternalLink, Maximize2 } from 'lucide-react';

// Simulated drone data
const simulatedDrones = [
  { id: 'UTM-001', lat: 36.8065, lng: 10.1815, alt: 120, speed: 45, battery: 87, status: 'active' },
  { id: 'UTM-042', lat: 36.8120, lng: 10.1950, alt: 90, speed: 32, battery: 65, status: 'active' },
  { id: 'UTM-017', lat: 36.7980, lng: 10.1700, alt: 150, speed: 55, battery: 42, status: 'warning' },
];

const geofenceZones = [
  { name: 'Aéroport Tunis-Carthage', lat: 36.8510, lng: 10.2270, radius: 3000, type: 'restricted' },
  { name: 'Zone Centre-ville', lat: 36.8065, lng: 10.1815, radius: 1500, type: 'controlled' },
];

function DroneMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of leaflet
    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [36.8065, 10.1815],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | ANAC UTM',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add geofence zones
      geofenceZones.forEach((zone) => {
        const color = zone.type === 'restricted' ? '#ef4444' : '#f59e0b';
        L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          dashArray: zone.type === 'restricted' ? '5, 10' : undefined,
        }).addTo(map).bindPopup(`<div style="font-family: 'Space Grotesk', sans-serif;"><b>${zone.name}</b><br/>Zone ${zone.type === 'restricted' ? 'interdite' : 'contrôlée'}</div>`);
      });

      // Add drones
      const droneIcon = L.divIcon({
        className: 'drone-marker',
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#4f8ef7,#00d4aa);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 0 20px rgba(79,142,247,0.5);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L8 8h8l-4-6z"/><rect x="8" y="10" width="8" height="4" rx="1"/><circle cx="6" cy="8" r="2"/><circle cx="18" cy="8" r="2"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      simulatedDrones.forEach((drone) => {
        L.marker([drone.lat, drone.lng], { icon: droneIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'Space Grotesk', sans-serif; min-width: 150px;">
              <div style="font-weight: 700; color: #4f8ef7; margin-bottom: 4px;">${drone.id}</div>
              <div style="font-size: 12px; color: #94a3b8;">
                Altitude: ${drone.alt}m<br/>
                Vitesse: ${drone.speed} km/h<br/>
                Batterie: ${drone.battery}%<br/>
                Statut: <span style="color: ${drone.status === 'active' ? '#00d4aa' : '#f59e0b'};">${drone.status === 'active' ? 'Actif' : 'Alerte'}</span>
              </div>
            </div>
          `);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}

export default function Demo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="relative py-24 lg:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-utm-blue/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-utm-blue/10 border border-utm-blue/20 text-utm-blue text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-utm-green animate-pulse" />
            DÉMO INTERACTIVE
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Découvrez la{' '}
            <span className="gradient-text">plateforme</span>
          </h2>
          <p className="text-lg text-utm-text-muted leading-relaxed">
            Explorez la carte interactive avec des drones simulés. 
            Cliquez sur un drone pour voir ses informations en temps réel.
          </p>
        </div>

        {/* Map container */}
        <div className="glass-card rounded-2xl overflow-hidden border border-utm-border/50">
          {/* Map toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-utm-border/50 bg-utm-card/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all duration-300 ${
                  isPlaying
                    ? 'bg-utm-green/10 text-utm-green border border-utm-green/30'
                    : 'bg-utm-blue/10 text-utm-blue border border-utm-blue/30 hover:bg-utm-blue/20'
                }`}
              >
                <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                {isPlaying ? 'Simulation active' : 'Lancer la simulation'}
              </button>

              <div className="hidden sm:flex items-center gap-3">
                {simulatedDrones.map((drone) => (
                  <div key={drone.id} className="flex items-center gap-2 text-xs font-mono text-utm-text-muted">
                    <div className={`w-2 h-2 rounded-full ${drone.status === 'active' ? 'bg-utm-green' : 'bg-yellow-400'} animate-pulse`} />
                    {drone.id}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-utm-text-muted hover:text-utm-blue hover:bg-utm-blue/10 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Plein écran
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-utm-bg">
            <DroneMap />

            {/* Overlay info panel */}
            <div className="absolute top-4 left-4 z-[1000] glass-card rounded-xl p-4 max-w-[200px]">
              <div className="text-xs font-mono text-utm-text-muted mb-2">Tunisie — Tunis</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-utm-green animate-pulse" />
                <span className="text-sm text-white font-display">3 drones actifs</span>
              </div>
              <div className="text-xs text-utm-text-muted mt-2">
                Dernière mise à jour: à l'instant
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-xl p-3">
              <div className="text-xs font-mono text-utm-text-muted mb-2">Légende</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-500/10" />
                  <span className="text-utm-text-muted">Zone interdite</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full border-2 border-yellow-500 bg-yellow-500/10" />
                  <span className="text-utm-text-muted">Zone contrôlée</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-utm-blue to-utm-green" />
                  <span className="text-utm-text-muted">Drone actif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <a href="#" className="btn-primary group">
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Accéder à la plateforme complète
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
