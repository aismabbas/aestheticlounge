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

type FilterTab = "ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Photos", value: "IMAGE" },
  { label: "Videos", value: "VIDEO" },
  { label: "Reels", value: "CAROUSEL_ALBUM" },
];

/* ---------- Icons ---------- */
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

function PlayIcon() {
  return (
    <div className="absolute top-3 right-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
        <svg className="ml-0.5 h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

/* ---------- Format date ---------- */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- Post card (larger, with caption) ---------- */
function SocialCard({ post }: { post: Post }) {
  const imgSrc =
    post.media_type === "VIDEO" && post.thumbnail_url
      ? post.thumbnail_url
      : post.media_url;

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-gold-light/40 bg-white shadow-[0_2px_20px_rgba(184,146,74,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(184,146,74,0.14)]"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imgSrc}
          alt={post.caption?.slice(0, 80) || "Instagram post"}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {post.media_type === "VIDEO" && <PlayIcon />}
      </div>

      {/* Caption & meta */}
      <div className="flex flex-1 flex-col p-5">
        {post.caption && (
          <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-text-light">
            {post.caption}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 text-xs text-text-muted">
          <InstagramIcon className="h-3.5 w-3.5" />
          {formatDate(post.timestamp)}
        </div>
      </div>
    </a>
  );
}

/* ---------- Placeholder card ---------- */
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gold-light/40 bg-white">
      <div
        className={`aspect-square bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}
      >
        <InstagramIcon className="h-10 w-10 text-gold/30" />
      </div>
      <div className="space-y-2 p-5">
        <div className="h-2.5 w-3/4 rounded-full bg-gold/10" />
        <div className="h-2.5 w-1/2 rounded-full bg-gold/8" />
        <div className="h-2 w-1/3 rounded-full bg-gold/5" />
      </div>
    </div>
  );
}

/* ========== Page component ========== */
export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [configured, setConfigured] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/instagram?limit=20")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? []);
        setConfigured(data.configured ?? false);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filtered =
    activeTab === "ALL"
      ? posts
      : posts.filter((p) => p.media_type === activeTab);

  return (
    <>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-warm-white pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,146,74,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-[1320px] px-5 text-center md:px-8">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Social Gallery
          </div>
          <h1 className="mb-4 font-serif text-[clamp(36px,5vw,56px)] leading-[1.1] font-semibold tracking-tight">
            Our Social <em className="italic text-gold">Gallery</em>
          </h1>
          <a
            href="https://instagram.com/aestheticloungeofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-lg text-text-light transition-colors hover:text-gold"
          >
            <InstagramIcon className="h-5 w-5" />
            @aestheticloungeofficial
          </a>
        </div>
      </section>

      {/* Filter tabs + grid */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          {/* Tabs */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-all duration-300 ${
                  activeTab === tab.value
                    ? "gold-shimmer-bg text-white shadow-[0_4px_20px_rgba(184,146,74,0.25)]"
                    : "border border-gold-light bg-warm-white text-gold-dark hover:border-gold hover:bg-gold/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((post) => (
                <SocialCard key={post.id} post={post} />
              ))}
            </div>
          ) : !configured || (!loaded && posts.length === 0) ? (
            <>
              {/* Placeholder grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <PlaceholderCard key={i} index={i} />
                ))}
              </div>
              <div className="mt-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                  <InstagramIcon className="h-10 w-10 text-gold" />
                </div>
                <p className="mb-6 text-lg text-text-light">
                  Connect your Instagram to see your feed here
                </p>
                <a
                  href="https://instagram.com/aestheticloungeofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full border border-gold-light bg-warm-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.06em] text-gold-dark transition-all duration-400 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_8px_30px_rgba(184,146,74,0.15)]"
                >
                  <InstagramIcon className="h-5 w-5" />
                  Visit @aestheticloungeofficial
                </a>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-text-muted">
              No posts found for this filter.
            </div>
          )}

          {/* Follow CTA */}
          {filtered.length > 0 && (
            <div className="mt-16 text-center">
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
          )}
        </div>
      </section>

    </>
  );
}
