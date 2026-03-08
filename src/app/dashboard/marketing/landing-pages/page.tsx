import Link from 'next/link';
import { landingPages } from '@/data/landing-pages';

export default function LandingPagesManagement() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Landing Pages</h1>
          <p className="mt-1 text-sm text-text-light">
            Manage ad landing pages for treatment campaigns.
          </p>
        </div>
        <button
          disabled
          className="rounded-lg bg-text-dark px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          + Create Landing Page
        </button>
      </div>

      {/* Landing pages table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-warm-white">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Treatment
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                URL
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Views
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Conversions
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {landingPages.map((lp) => (
              <tr key={lp.slug} className="transition-colors hover:bg-warm-white/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-text-dark">{lp.treatment}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{lp.price_display}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded bg-warm-white px-2 py-1 text-xs text-gold-dark">
                    /lp/{lp.slug}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-text-muted">--</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-text-muted">--</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/lp/${lp.slug}`}
                      target="_blank"
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-light transition-colors hover:border-gold/30 hover:text-gold"
                    >
                      Preview
                    </Link>
                    <button
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted cursor-not-allowed opacity-50"
                      disabled
                      title="Coming soon"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
          Quick Preview Links
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {landingPages.map((lp) => (
            <Link
              key={lp.slug}
              href={`/lp/${lp.slug}`}
              target="_blank"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-gold/30 hover:bg-gold/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 font-serif text-sm font-bold text-gold">
                {lp.treatment.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-dark">{lp.treatment}</p>
                <p className="text-xs text-text-muted">/lp/{lp.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
