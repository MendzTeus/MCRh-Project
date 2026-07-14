import { Link } from 'react-router-dom';
import { useSiteContent, list, text } from '../hooks/useSiteContent';

export default function Footer() {
  const site = useSiteContent();
  const links = list<{ label: string; href: string }>(site.content, 'footer.links', [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Sustainability', href: '#' },
    { label: 'Careers', href: '#' },
  ]);
  const social = list<{ label: string; href: string }>(site.content, 'footer.social', []);
  return (
    <footer className="bg-surface-container-low w-full py-16 font-body text-body-md transition-all border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-start px-6 md:px-16 max-w-[1280px] mx-auto gap-12">
        <div className="flex flex-col">
          <div className="font-display font-display-lg text-headline-sm text-primary mb-6">
            {text(site.content, 'brand.name', 'MCRh')}
          </div>
          <p className="text-on-surface-variant opacity-70">
            © {new Date().getFullYear()} {text(site.content, 'footer.copyright', 'MCRh Luxury Lettings. All rights reserved.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {links.map((l, i) => (
            <a key={i} href={l.href || '#'} className="text-on-surface-variant hover:text-primary transition-colors">{l.label}</a>
          ))}
          {social.map((l, i) => (
            <a key={`s-${i}`} href={l.href || '#'} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">{l.label}</a>
          ))}
          <Link to="/contact" className="text-on-surface-variant hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
