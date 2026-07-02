import { AlertTriangle, Shield, Map, FileCheck, TrendingUp } from 'lucide-react';

const challenges = [
  {
    icon: AlertTriangle,
    title: 'Sécurité des vols',
    description: 'Risque croissant de collisions entre drones et aéronefs dans l\'espace aérien tunisien non supervisé.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    icon: Map,
    title: 'Zones interdites',
    description: 'Absence de système automatisé pour identifier et empêcher les survols de zones sensibles (aéroports, zones militaires).',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Shield,
    title: 'Régulation',
    description: 'Cadre réglementaire en développement — l\'ANAC nécessite des outils numériques pour imposer les normes.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: FileCheck,
    title: 'Traçabilité',
    description: 'Gestion manuelle des immatriculations et plans de vol, source d\'erreurs et de délais importants.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
];

const stats = [
  { value: '100+', label: 'Drones supervisés', sublabel: 'en temps réel' },
  { value: '50+', label: 'Zones géofencing', sublabel: 'protection active' },
  { value: '200+', label: 'Plans de vol', sublabel: 'validés par l\'ANAC' },
  { value: '99.9%', label: 'Disponibilité', sublabel: 'système 24/7' },
];

export default function ProblemSection() {
  return (
    <section id="problematique" className="relative py-24 lg:py-32">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-utm-blue/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          {/* Quote */}
          <div className="glass-card rounded-2xl p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-utm-blue to-utm-green" />
            <div className="absolute -top-2 -left-2 text-6xl text-utm-blue/20 font-display font-bold">"</div>
            <p className="text-xl sm:text-2xl text-white font-display font-medium leading-relaxed pl-4">
              D'ici 2035, plus de <span className="gradient-text">70% des vols de drones professionnels</span> seront autonomes
            </p>
            <div className="flex items-center gap-3 mt-4 pl-4">
              <div className="w-8 h-8 rounded-full bg-utm-blue/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-utm-blue" />
              </div>
              <span className="text-utm-text-muted text-sm font-mono">SESAR Joint Undertaking — European ATM Master Plan</span>
            </div>
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Un espace aérien{' '}
            <span className="gradient-text">en mutation</span>
          </h2>
          <p className="text-lg text-utm-text-muted leading-relaxed">
            L'essor rapide des drones professionnels en Tunisie pose des défis majeurs en matière de sécurité, 
            de régulation et de gestion de l'espace aérien. Sans supervision centralisée, les risques se multiplient.
          </p>
        </div>

        {/* Challenges grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {challenges.map((challenge, i) => (
            <div
              key={challenge.title}
              className="glass-card rounded-2xl p-6 group cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${challenge.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <challenge.icon className={`w-6 h-6 ${challenge.color}`} />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">{challenge.title}</h3>
              <p className="text-utm-text-muted text-sm leading-relaxed">{challenge.description}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="glass-card rounded-2xl p-8 lg:p-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display font-bold text-3xl sm:text-4xl gradient-text mb-1">{stat.value}</div>
                <div className="font-display font-medium text-white text-sm">{stat.label}</div>
                <div className="text-utm-text-muted text-xs mt-1">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
