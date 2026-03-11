import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-serif text-gold">404</p>
        <h1 className="mt-4 font-serif text-2xl text-text-dark">
          Page Not Found
        </h1>
        <p className="mt-3 text-text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-dark"
          >
            Go Home
          </Link>
          <Link
            href="/services"
            className="rounded-full border border-gold px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white"
          >
            View Services
          </Link>
        </div>
      </div>
    </div>
  );
}
