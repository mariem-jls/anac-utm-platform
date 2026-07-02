import { useState, useEffect } from 'react';
import { Menu, X, Satellite, LogIn } from 'lucide-react';

const navLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Solution', href: '#solution' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Démo', href: '#demo' },
  { label: 'Contact', href: '#contact' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-utm-bg/90 backdrop-blur-xl border-b border-utm-border shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto section-padding">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-utm-blue to-utm-green flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Satellite className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-utm-blue/20 to-utm-green/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-utm-text-muted hover:text-white font-display font-medium transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-utm-blue to-utm-green group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Bouton Accès plateforme */}
            <a
              href="/login"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-utm-blue to-utm-green text-white rounded-lg text-sm font-display font-medium hover:shadow-lg hover:shadow-utm-blue/25 transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span>Accès plateforme</span>
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-utm-text-muted hover:text-white transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-utm-bg/95 backdrop-blur-xl border-t border-utm-border px-6 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 text-utm-text-muted hover:text-white font-display font-medium transition-colors border-b border-utm-border/50 last:border-0"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/platform"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 mt-4 px-5 py-3 bg-gradient-to-r from-utm-blue to-utm-green text-white rounded-lg font-display font-medium"
          >
            <LogIn className="w-4 h-4" />
            Accès plateforme
          </a>
        </div>
      </div>
    </header>
  );
}