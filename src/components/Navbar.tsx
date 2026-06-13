import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isDarkBg = location.pathname.includes('/contact') || location.pathname.includes('/about');
  
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 transition-all duration-300">
      <div className="flex justify-between items-center h-20 px-4 md:px-16 max-w-[1280px] mx-auto">
        <Link to="/" className="font-display font-display-lg text-headline-sm tracking-tighter text-primary">
          MCRh
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/properties" className={`text-label-caps ${location.pathname === '/properties' ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}>
            Properties
          </Link>
          <Link to="/design-services" className={`text-label-caps ${location.pathname === '/design-services' ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}>
            Design Services
          </Link>
          <Link to="/management-services" className={`text-label-caps ${location.pathname === '/management-services' ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}>
            Management Services
          </Link>
          <Link to="/about" className={`text-label-caps ${location.pathname === '/about' ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}>
            About
          </Link>
          <Link to="/contact" className={`text-label-caps ${location.pathname === '/contact' ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'} transition-all`}>
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/properties" className="hidden md:block px-6 py-3 border border-primary text-primary font-display text-label-caps tracking-widest hover:bg-primary/5 transition-colors uppercase">
            Book Now
          </Link>
          <button className="md:hidden text-primary">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
