import { Satellite, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';


const footerLinks = {
  platform: [
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Démo', href: '#demo' },
    { label: 'Technologies', href: '#technologies' },
    { label: 'Documentation', href: '#' },
  ],
  legal: [
    { label: 'Mentions légales', href: '#' },
    { label: 'Politique de confidentialité', href: '#' },
    { label: 'CGU', href: '#' },
  ],
  support: [
    { label: 'FAQ', href: '#' },
    { label: 'Contact', href: '#contact' },
    { label: 'Signaler un bug', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-utm-border/50">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-utm-blue/50 to-transparent" />

      <div className="max-w-7xl mx-auto section-padding py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#accueil" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-utm-blue to-utm-green flex items-center justify-center">
                <Satellite className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight">
                  ANAC <span className="text-utm-blue">UTM</span>
                </span>
                <div className="text-[10px] text-utm-text-muted font-mono tracking-widest uppercase">
                  Traffic Management
                </div>
              </div>
            </a>

            <p className="text-utm-text-muted text-sm leading-relaxed mb-6 max-w-sm">
              Plateforme de supervision de drones développée dans le cadre d'un stage à l'Autorité Nationale de l'Aviation Civile de Tunisie.
            </p>

            <div className="space-y-3">
              <a href="mailto:contact@anac-utm.tn" className="flex items-center gap-3 text-sm text-utm-text-muted hover:text-utm-blue transition-colors">
                <Mail className="w-4 h-4" />
                contact@anac-utm.tn
              </a>
              <a href="tel:+21671123456" className="flex items-center gap-3 text-sm text-utm-text-muted hover:text-utm-blue transition-colors">
                <Phone className="w-4 h-4" />
                +216 71 123 456
              </a>
              <div className="flex items-center gap-3 text-sm text-utm-text-muted">
                <MapPin className="w-4 h-4" />
                Tunis, Tunisie
              </div>
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Plateforme</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-utm-text-muted hover:text-utm-blue transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-utm-text-muted hover:text-utm-blue transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-utm-text-muted hover:text-utm-blue transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h4 className="font-display font-semibold text-white text-sm mb-3">GitHub</h4>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-utm-text-muted hover:text-utm-blue transition-colors"
              >
                Voir le code source
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-utm-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-utm-text-muted">
            © 2026 ANAC Tunisie — UTM Platform. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-utm-text-muted font-mono">
              v1.0.0
            </span>
            <div className="flex items-center gap-2 text-xs text-utm-text-muted">
              <span className="w-2 h-2 rounded-full bg-utm-green animate-pulse" />
              Système opérationnel
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
