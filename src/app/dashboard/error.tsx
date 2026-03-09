'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold text-red-700 mb-2">Dashboard Error</h2>
      <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-800 whitespace-pre-wrap mb-4">
        {error.message}
        {error.digest && `\nDigest: ${error.digest}`}
        {error.stack && `\n\n${error.stack}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-gold text-white rounded-lg text-sm"
      >
        Try Again
      </button>
    </div>
  );
}
