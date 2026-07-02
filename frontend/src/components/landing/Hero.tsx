import { useEffect, useRef } from 'react';
import { ChevronRight, Play, Shield, Radio, MapPin } from 'lucide-react';

function DroneIllustration() {
  return (
    <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center">
      {/* Outer glow */}
      <div className="absolute w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-utm-blue/5 blur-3xl" />

      {/* Radar rings */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-utm-blue/10"
          style={{
            width: `${120 + i * 80}px`,
            height: `${120 + i * 80}px`,
          }}
        />
      ))}

      {/* Radar sweep */}
      <div className="absolute w-[280px] h-[280px] lg:w-[360px] lg:h-[360px] rounded-full overflow-hidden">
        <div className="absolute inset-0 radar-sweep">
          <div className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left bg-gradient-conic from-transparent via-utm-blue/20 to-transparent" 
               style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(79,142,247,0.15) 30%, transparent 60%)' }} />
        </div>
      </div>

      {/* Central hub */}
      <div className="relative z-10">
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-utm-blue to-utm-green flex items-center justify-center shadow-2xl shadow-utm-blue/30 animate-pulse-slow">
          <Radio className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-2xl border-2 border-utm-blue/30 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute -inset-4 rounded-3xl border border-utm-green/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
      </div>

      {/* Floating drones */}
      {[
        { top: '15%', left: '20%', delay: '0s', label: 'UTM-001' },
        { top: '25%', right: '15%', delay: '1s', label: 'UTM-042' },
        { bottom: '30%', left: '15%', delay: '2s', label: 'UTM-017' },
        { bottom: '20%', right: '20%', delay: '0.5s', label: 'UTM-089' },
      ].map((drone, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            top: drone.top,
            left: drone.left,
            right: drone.right,
            bottom: drone.bottom,
            animationDelay: drone.delay,
          }}
        >
          <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-utm-green animate-pulse" />
            <span className="font-mono text-utm-text-muted">{drone.label}</span>
          </div>
        </div>
      ))}

      {/* Connection lines - SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 500 500">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0" />
            <stop offset="50%" stopColor="#4f8ef7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="100" y1="100" x2="250" y2="250" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="400" y1="130" x2="250" y2="250" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="90" y1="370" x2="250" y2="250" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="380" y1="380" x2="250" y2="250" stroke="url(#lineGrad)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 142, 247, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 142, 247, ${0.1 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function Hero() {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg" />
      <FloatingParticles />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-utm-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-utm-green/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto section-padding pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-utm-blue/10 border border-utm-blue/20 text-utm-blue text-sm font-mono animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-utm-green animate-pulse" />
              ANAC Tunisie — UTM Platform
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] text-balance animate-slide-up">
              Supervision{' '}
              <span className="gradient-text">intelligente</span>
              <br />
              de flotte de drones
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-utm-text-muted max-w-xl leading-relaxed animate-slide-up animate-delay-200">
              Plateforme UTM conforme aux normes ANAC pour la gestion sécurisée des drones en Tunisie. 
              Immatriculation, géofencing, plans de vol et suivi en temps réel.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-slide-up animate-delay-300">
              <a href="#demo" className="btn-primary group">
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Voir la démo
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
              <a href="#solution" className="btn-secondary">
                Découvrir la solution
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex gap-8 pt-4 animate-slide-up animate-delay-400">
              {[
                { icon: Shield, value: '100+', label: 'Drones supervisés' },
                { icon: MapPin, value: '50+', label: 'Zones géofencing' },
                { icon: Radio, value: '200+', label: 'Plans de vol validés' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-utm-blue" />
                  <div>
                    <div className="font-display font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-utm-text-muted">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:block">
            <DroneIllustration />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-utm-bg to-transparent" />
    </section>
  );
}
