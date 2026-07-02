import { Server, Globe, Database, Cpu, Wifi, Lock } from 'lucide-react';

const techStack = [
  {
    category: 'Backend',
    icon: Server,
    items: [
      { name: 'Python', desc: 'Langage principal' },
      { name: 'MQTT', desc: 'Protocole temps réel' },
      { name: 'Supabase', desc: 'Backend-as-a-Service' },
    ],
    color: '#4f8ef7',
  },
  {
    category: 'Frontend',
    icon: Globe,
    items: [
      { name: 'React', desc: 'Interface utilisateur' },
      { name: 'Leaflet', desc: 'Carte interactive' },
      { name: 'TailwindCSS', desc: 'Styling' },
    ],
    color: '#00d4aa',
  },
  {
    category: 'Base de données',
    icon: Database,
    items: [
      { name: 'PostgreSQL', desc: 'Base relationnelle' },
      { name: 'Supabase DB', desc: 'Hébergement managé' },
      { name: 'Row Level Security', desc: 'Sécurité au niveau ligne' },
    ],
    color: '#8b5cf6',
  },
  {
    category: 'IoT & Simulation',
    icon: Cpu,
    items: [
      { name: 'ESP32', desc: 'Microcontrôleur' },
      { name: 'GPS Module', desc: 'Géolocalisation' },
      { name: 'MQTT Client', desc: 'Connexion broker' },
    ],
    color: '#f59e0b',
  },
  {
    category: 'Sécurité',
    icon: Lock,
    items: [
      { name: 'JWT Auth', desc: 'Tokens sécurisés' },
      { name: 'RLS', desc: 'Contrôle d\'accès' },
      { name: 'HTTPS', desc: 'Chiffrement TLS' },
    ],
    color: '#ef4444',
  },
  {
    category: 'Connectivité',
    icon: Wifi,
    items: [
      { name: 'WebSocket', desc: 'Données temps réel' },
      { name: 'REST API', desc: 'Endpoints standard' },
      { name: 'MQTT Broker', desc: 'Mosquitto' },
    ],
    color: '#06b6d4',
  },
];

export default function Technologies() {
  return (
    <section id="technologies" className="relative py-24 lg:py-32">
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-utm-green/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-utm-green/10 border border-utm-green/20 text-utm-green text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-utm-green animate-pulse" />
            ARCHITECTURE
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Stack{' '}
            <span className="gradient-text">technologique</span>
          </h2>
          <p className="text-lg text-utm-text-muted leading-relaxed">
            Technologies modernes et éprouvées pour une plateforme fiable, performante et sécurisée.
          </p>
        </div>

        {/* Tech grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((category) => (
            <div key={category.category} className="glass-card rounded-2xl p-6 group">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <category.icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <h3 className="font-display font-semibold text-white">{category.category}</h3>
              </div>

              <div className="space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-utm-bg/40 border border-utm-border/50 group-hover:border-utm-border transition-colors"
                  >
                    <div>
                      <span className="font-mono text-sm text-white">{item.name}</span>
                      <span className="text-xs text-utm-text-muted ml-2">{item.desc}</span>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Architecture diagram hint */}
        <div className="mt-12 glass-card rounded-2xl p-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {['ESP32 (Drone)', '→', 'MQTT Broker', '→', 'Python Backend', '→', 'Supabase', '→', 'React Frontend'].map((step, i) => (
              <span
                key={i}
                className={
                  step === '→'
                    ? 'text-utm-blue text-xl font-mono'
                    : 'px-4 py-2 rounded-lg bg-utm-bg/50 border border-utm-border text-sm font-mono text-white'
                }
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
