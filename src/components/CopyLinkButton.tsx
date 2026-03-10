'use client';

import { useState } from 'react';

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-text-dark text-sm hover:bg-warm-white transition-colors"
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}
