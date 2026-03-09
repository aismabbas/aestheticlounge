import { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts, BLOG_CATEGORIES } from '@/data/blog-posts';

export const metadata: Metadata = {
  title: 'Blog — Expert Skincare & Treatment Insights',
  description:
    'Expert insights on skincare, treatments, and beauty from the doctors at Aesthetic Lounge Lahore. Tips, guides, and the latest in medical aesthetics.',
  openGraph: {
    title: 'Blog | Aesthetic Lounge',
    description:
      'Expert insights on skincare, treatments, and beauty from Aesthetic Lounge Lahore.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getPublishedPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">
            Our Blog
          </p>
          <h1 className="mt-3 font-serif text-4xl text-white md:text-5xl lg:text-6xl">
            The Aesthetic Lounge Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Expert insights on skincare, treatments, and beauty
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <span className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-white">
            All
          </span>
          {BLOG_CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-gold-pale px-4 py-1.5 text-xs font-medium text-text-dark cursor-pointer hover:bg-gold hover:text-white transition-colors"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-12 rounded-2xl border border-gold-pale bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="grid md:grid-cols-2">
              <div className="aspect-[16/9] md:aspect-auto bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center">
                <span className="text-6xl opacity-30 group-hover:opacity-50 transition-opacity">
                  &#9830;
                </span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-gold-pale px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-wide">
                    {featured.category}
                  </span>
                  <span className="text-xs text-text-muted">Featured</span>
                </div>
                <h2 className="font-serif text-2xl text-text-dark group-hover:text-gold transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm text-text-light leading-relaxed line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs text-text-muted">
                  <span>{featured.author}</span>
                  <span>&#183;</span>
                  <span>
                    {featured.published_at &&
                      new Date(featured.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </span>
                  <span>&#183;</span>
                  <span>{featured.read_time} min read</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Posts grid */}
        {rest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-gold-pale bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-gold transition-all"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center">
                  <span className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    &#9830;
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="rounded-full bg-gold-pale px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-wide">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-text-dark group-hover:text-gold transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-light leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
                    <span>{post.author}</span>
                    <span>&#183;</span>
                    <span>
                      {post.published_at &&
                        new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                    </span>
                    <span>&#183;</span>
                    <span>{post.read_time} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No posts published yet. Check back soon!</p>
          </div>
        )}
      </section>
    </main>
  );
}
