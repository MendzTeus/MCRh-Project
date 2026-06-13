import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-16 font-body text-body-md transition-all border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-start px-6 md:px-16 max-w-[1280px] mx-auto gap-12">
        <div className="flex flex-col">
          <div className="font-display font-display-lg text-headline-sm text-primary mb-6">
            MCRh
          </div>
          <p className="text-on-surface-variant opacity-70">
            © 2024 MCRh Luxury Lettings. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Link to="#" className="text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="#" className="text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="#" className="text-on-surface-variant hover:text-primary transition-colors">Sustainability</Link>
          <Link to="#" className="text-on-surface-variant hover:text-primary transition-colors">Careers</Link>
          <Link to="/contact" className="text-on-surface-variant hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
