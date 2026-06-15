import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-margin-mobile text-center animate-in fade-in duration-500">
      <Helmet>
        <title>Page Not Found | MCRh Manchester</title>
      </Helmet>
      <span className="font-body text-label-caps text-secondary mb-6 block tracking-widest uppercase">404</span>
      <h1 className="font-display text-display-lg-mobile md:text-headline-md text-primary mb-4">Page not found</h1>
      <p className="font-body text-body-lg text-on-surface-variant mb-10 max-w-md">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300"
      >
        Back to Home
      </Link>
    </div>
  );
}
