import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSiteContent, list, text } from '../hooks/useSiteContent';

const DEFAULT_NAV_LINKS = [
  { to: '/properties', label: 'Properties' },
  { to: '/design-services', label: 'Design Services' },
  { to: '/management-services', label: 'Management Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const location = useLocation();
  const site = useSiteContent();
  const [menuOpen, setMenuOpen] = useState(false);

  const brand = text(site.content, 'brand.name', 'MCRh');
  const navLinks = list<{ to: string; label: string }>(site.content, 'nav.links', DEFAULT_NAV_LINKS)
    .filter((l) => l && l.to && l.label);
  const ctaLabel = text(site.content, 'nav.cta.label', 'Book Now');
  const ctaHref = text(site.content, 'nav.cta.href', '/properties');

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant/30 transition-all duration-300">
      <div className="flex justify-between items-center h-20 px-4 md:px-16 max-w-[1280px] mx-auto">
        <Link to="/" onClick={closeMenu} className="font-display font-display-lg text-headline-sm tracking-tighter text-primary">
          {brand}
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={location.pathname === to ? 'page' : undefined}
              className={`text-label-caps ${location.pathname === to ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link to={ctaHref} className="hidden md:block px-6 py-3 border border-primary text-primary font-display text-label-caps tracking-widest hover:bg-primary/5 transition-colors uppercase">
            {ctaLabel}
          </Link>
          <button
            className="md:hidden text-primary"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="md:hidden bg-surface border-t border-outline-variant/30 px-6 py-8 flex flex-col gap-6"
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              aria-current={location.pathname === to ? 'page' : undefined}
              className={`text-label-caps ${location.pathname === to ? 'text-primary' : 'text-on-surface-variant'} transition-all`}
            >
              {label}
            </Link>
          ))}
          <Link
            to={ctaHref}
            onClick={closeMenu}
            className="border border-primary text-primary px-6 py-3 text-label-caps tracking-widest uppercase text-center hover:bg-primary/5 transition-colors mt-2"
          >
            {ctaLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
