"use client";

import { useEffect, useState } from "react";

interface Post {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

/* ---------- Instagram SVG icon ---------- */
function InstagramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- Play icon overlay for videos ---------- */
function PlayIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
        <svg
          className="ml-0.5 h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

/* ---------- Heart icon ---------- */
function HeartIcon() {
  return (
    <svg
      className="h-4 w-4 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/* ---------- Placeholder card (no API) ---------- */
function PlaceholderCard({ index }: { index: number }) {
  const gradients = [
    "from-gold/20 to-gold/5",
    "from-gold/10 to-warm-white",
    "from-gold/15 to-gold/5",
    "from-gold/5 to-gold/15",
    "from-gold/10 to-gold/20",
    "from-gold/5 to-warm-white",
  ];
  return (
    <div
      className={`group relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} border border-gold-light/40`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <InstagramIcon className="h-8 w-8 text-gold/40" />
        <div className="h-2 w-16 rounded-full bg-gold/15" />
        <div className="h-2 w-12 rounded-full bg-gold/10" />
      </div>
    </div>
  );
}

/* ---------- Post card ---------- */
function PostCard({ post }: { post: Post }) {
  const imgSrc =
    post.media_type === "VIDEO" && post.thumbnail_url
      ? post.thumbnail_url
      : post.media_url;

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square overflow-hidden rounded-xl border border-gold-light/40 bg-warm-white"
    >
      {/* Image */}
      <img
        src={imgSrc}
        alt={post.caption?.slice(0, 80) || "Instagram post"}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      {/* Video play icon */}
      {post.media_type === "VIDEO" && <PlayIcon />}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <HeartIcon />
        {post.caption && (
          <p className="line-clamp-3 text-center text-xs leading-relaxed text-white/90">
            {post.caption.slice(0, 120)}
            {post.caption.length > 120 ? "..." : ""}
          </p>
        )}
      </div>
    </a>
  );
}

/* ========== Main component ========== */
export default function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/instagram?limit=6")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <section className="relative bg-white py-20 lg:py-36">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(184,146,74,0.06)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-[1320px] px-5 md:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Follow Us
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            On <em className="italic text-gold">Instagram</em>
          </h2>
          <a
            href="https://instagram.com/aestheticloungeofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base text-text-light transition-colors hover:text-gold"
          >
            <InstagramIcon className="h-5 w-5" />
            @aestheticloungeofficial
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {posts.length > 0
            ? posts.map((post) => <PostCard key={post.id} post={post} />)
            : Array.from({ length: 6 }).map((_, i) => (
                <PlaceholderCard key={i} index={i} />
              ))}
        </div>

        {/* Always show CTA to follow */}
        <div className="mt-12 text-center">
          <a
            href="https://instagram.com/aestheticloungeofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full border border-gold-light bg-warm-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.06em] text-gold-dark transition-all duration-400 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_8px_30px_rgba(184,146,74,0.15)]"
          >
            <InstagramIcon className="h-5 w-5" />
            Follow @aestheticloungeofficial
          </a>
        </div>
      </div>
    </section>
  );
}
