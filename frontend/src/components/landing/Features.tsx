import { Map, Layers, Clock, Users, Globe, Bell, Database, Cpu } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Carte interactive',
    description: 'Suivi en temps réel de tous les drones sur une carte Leaflet avec couches personnalisables.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Layers,
    title: 'Gestion des zones',
    description: 'Création, modification et suppression de zones de géofencing avec visualisation polygonale.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: Clock,
    title: 'Journal des événements',
    description: 'Logs en temps réel de tous les événements : vols, alertes, déconnexions, violations.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Users,
    title: 'Authentification 3 rôles',
    description: 'Système d\'authentification avec accès différenciés : opérateur, admin ANAC, police.',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    icon: Globe,
    title: 'MQTT temps réel',
    description: 'Architecture publish-subscribe pour la réception instantanée des données de vol via MQTT.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    icon: Bell,
    title: 'Système d\'alertes',
    description: 'Notifications automatiques en cas de violation de zone, batterie faible ou vol non autorisé.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    icon: Database,
    title: 'Supabase PostgreSQL',
    description: 'Base de données fiable avec authentification intégrée, API REST et temps réel.',
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: Cpu,
    title: 'Simulation ESP32',
    description: 'Module de simulation IoT reproduisant le comportement d\'un drone ESP32 avec GPS.',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="relative py-24 lg:py-32">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-utm-blue/3 rounded-full blur-3xl -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-utm-blue/10 border border-utm-blue/20 text-utm-blue text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-utm-blue animate-pulse" />
            FONCTIONNALITÉS
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Tout ce dont vous avez{' '}
            <span className="gradient-text">besoin</span>
          </h2>
          <p className="text-lg text-utm-text-muted leading-relaxed">
            Un arsenal complet d'outils pour assurer la sécurité et la conformité 
            de chaque vol de drone sur le territoire tunisien.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-6 group cursor-default relative overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-utm-bg/50 border border-utm-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-utm-blue group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display font-semibold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-utm-text-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
