import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostsByCategory, sampleBlogPosts } from '@/data/blog-posts';
import { renderMarkdown } from '@/lib/markdown';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import CopyLinkButton from '@/components/CopyLinkButton';

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return sampleBlogPosts
    .filter((p) => p.published)
    .map((p) => ({ slug: p.slug }));
}

// ─── Metadata ───────────────────────────────────────────────────────────────
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author],
      images: post.featured_image ? [post.featured_image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
    },
    alternates: {
      canonical: `https://aestheticloungeofficial.com/blog/${slug}`,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const contentHtml = renderMarkdown(post.content);

  const related = getPostsByCategory(post.category).filter(
    (p) => p.slug !== post.slug,
  );

  const articleSchema = generateArticleSchema(post);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://aestheticloungeofficial.com' },
    { name: 'Blog', url: 'https://aestheticloungeofficial.com/blog' },
    { name: post.title, url: `https://aestheticloungeofficial.com/blog/${post.slug}` },
  ]);

  const shareUrl = `https://aestheticloungeofficial.com/blog/${post.slug}`;
  const shareText = encodeURIComponent(post.title);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/blog"
              className="text-sm text-text-muted hover:text-gold transition-colors"
            >
              &larr; All Posts
            </Link>
            <span className="text-text-muted">|</span>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-wide">
              {post.category}
            </span>
          </div>
          <h1 className="font-serif text-3xl text-white md:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>
          <div className="mt-5 flex items-center justify-center gap-4 text-sm text-text-muted">
            <span>{post.author}</span>
            <span>&#183;</span>
            <span>
              {post.published_at &&
                new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </span>
            <span>&#183;</span>
            <span>{post.read_time} min read</span>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="mx-auto max-w-4xl px-4 -mt-8 mb-8 sm:px-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Tags */}
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gold-pale px-3 py-1 text-xs text-text-dark"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Share */}
        <div className="mt-8 pt-8 border-t border-gold-pale">
          <p className="text-sm font-medium text-text-dark mb-3">Share this article</p>
          <div className="flex gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-300 text-green-700 text-sm hover:bg-green-50 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 transition-colors"
            >
              Facebook
            </a>
            <CopyLinkButton url={shareUrl} />
          </div>
        </div>

        {/* Author Card */}
        <div className="mt-10 rounded-2xl border border-gold-pale bg-white p-6 flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold/15 text-gold font-serif text-lg font-bold shrink-0">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-text-dark">{post.author}</p>
            <p className="text-sm text-text-muted mt-1">
              Expert aesthetic physician at Aesthetic Lounge, DHA Phase 8, Lahore.
              Passionate about helping patients achieve their best skin.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-text-dark p-8 text-center">
          <h3 className="font-serif text-xl text-white">Ready to Transform Your Skin?</h3>
          <p className="mt-2 text-sm text-text-muted">
            Book a consultation with our expert doctors at Aesthetic Lounge
          </p>
          <Link
            href="/book"
            className="inline-block mt-5 rounded-full bg-gold px-8 py-3 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
          >
            Book a Consultation
          </Link>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="border-t border-gold-pale bg-warm-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-2xl text-text-dark mb-8">Related Posts</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-gold-pale bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gold"
                >
                  <span className="rounded-full bg-gold-pale px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-wide">
                    {p.category}
                  </span>
                  <h3 className="mt-3 font-serif text-lg text-text-dark group-hover:text-gold transition-colors line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-light line-clamp-2">{p.excerpt}</p>
                  <div className="mt-3 text-xs text-text-muted">
                    {p.author} &middot; {p.read_time} min read
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
