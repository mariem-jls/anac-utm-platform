import { QrCode, Radar, MapPin, FileCheck, ShieldCheck, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: QrCode,
    title: 'Immatriculation des drones',
    description: 'Génération automatique d\'identifiant unique avec QR Code pour chaque drone enregistré. Identification instantanée sur le terrain.',
    features: ['QR Code unique', 'Base centralisée', 'Validation instantanée'],
    color: '#4f8ef7',
  },
  {
    icon: Radar,
    title: 'Suivi temps réel',
    description: 'Position GPS, altitude, vitesse et niveau de batterie de chaque drone visualisés sur une carte interactive en temps réel.',
    features: ['GPS en temps réel', 'Altitude & vitesse', 'État batterie'],
    color: '#00d4aa',
  },
  {
    icon: MapPin,
    title: 'Géofencing intelligent',
    description: 'Définition de zones interdites avec alertes automatiques. Les drones sont automatiquement bloqués avant de pénétrer les zones protégées.',
    features: ['Zones dynamiques', 'Alertes automatiques', 'Blocage préventif'],
    color: '#f59e0b',
  },
  {
    icon: FileCheck,
    title: 'Plans de vol',
    description: 'Soumission, validation et suivi des plans de vol directement depuis la plateforme. Workflow complet de demande à approbation.',
    features: ['Soumission digitale', 'Validation ANAC', 'Historique complet'],
    color: '#8b5cf6',
  },
  {
    icon: ShieldCheck,
    title: 'Vérification police',
    description: 'Scan du QR code par les forces de l\'ordre pour vérification instantanée du statut du drone, de l\'opérateur et du plan de vol.',
    features: ['Scan terrain', 'Vérification instantanée', 'Rapport automatique'],
    color: '#ef4444',
  },
];

export default function Solution() {
  return (
    <section id="solution" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-utm-green/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-utm-green/10 border border-utm-green/20 text-utm-green text-xs font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-utm-green animate-pulse" />
              SOLUTION
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
              Une plateforme{' '}
              <span className="gradient-text">complète</span>
            </h2>
            <p className="text-lg text-utm-text-muted leading-relaxed">
              L'écosystème UTM de l'ANAC couvre l'ensemble du cycle de vie d'un vol de drone, 
              de l'immatriculation à la vérification terrain.
            </p>
          </div>
          <a href="#demo" className="flex items-center gap-2 text-utm-blue hover:text-utm-green font-display font-medium transition-colors group shrink-0">
            Voir la démo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Solutions */}
        <div className="space-y-6">
          {solutions.map((solution, i) => (
            <div
              key={solution.title}
              className="glass-card rounded-2xl p-8 lg:p-10 group hover:border-utm-blue/30 transition-all duration-500"
            >
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${solution.color}15` }}
                >
                  <solution.icon className="w-8 h-8" style={{ color: solution.color }} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-xl text-white mb-2">{solution.title}</h3>
                      <p className="text-utm-text-muted leading-relaxed max-w-2xl">{solution.description}</p>
                    </div>
                    <span className="font-mono text-xs text-utm-text-muted shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {solution.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono"
                        style={{
                          backgroundColor: `${solution.color}10`,
                          color: solution.color,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
