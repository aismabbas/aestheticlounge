'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import { BLOG_CATEGORIES } from '@/data/blog-posts';

export default function BlogEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [category, setCategory] = useState(BLOG_CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Dr. Huma');
  const [featuredImage, setFeaturedImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 80),
      );
    }
  }, [title, slugManual]);

  // Load post for editing
  const loadPost = useCallback(async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/dashboard/blog/${editId}`);
      if (!res.ok) throw new Error('Failed to load post');
      const data = await res.json();
      const post = data.post;
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setSlugManual(true);
      setCategory(post.category || BLOG_CATEGORIES[0]);
      setTags(Array.isArray(post.tags) ? post.tags.join(', ') : '');
      setContent(post.content || '');
      setAuthor(post.author || 'Dr. Huma');
      setFeaturedImage(post.featured_image || '');
      setSeoTitle(post.seo_title || '');
      setSeoDescription(post.seo_description || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [editId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function handleSave(publish: boolean) {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError('');

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const excerpt =
      content
        .replace(/^#.+$/gm, '')
        .replace(/\*{1,3}/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim()
        .slice(0, 200) + '...';

    const body = {
      title,
      slug,
      category,
      tags: tagsArray,
      content,
      author,
      excerpt,
      featured_image: featuredImage || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
      read_time: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
    };

    try {
      const url = editId ? `/api/dashboard/blog/${editId}` : '/api/dashboard/blog';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.push('/dashboard/marketing/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = renderMarkdown(content);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">
            {editId ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {editId ? 'Update your blog post' : 'Write and publish a new article'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-warm-white transition-colors"
          >
            {showPreview ? 'Editor' : 'Preview'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-warm-white transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="bg-white rounded-xl border border-border p-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your post title..."
              className="w-full text-lg font-serif text-text-dark border-0 focus:ring-0 outline-none bg-transparent"
            />
          </div>

          {/* Slug */}
          <div className="bg-white rounded-xl border border-border p-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              URL Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManual(true);
                }}
                className="flex-1 text-sm text-text-dark border-0 focus:ring-0 outline-none bg-transparent font-mono"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-border p-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Content (Markdown)
            </label>
            {showPreview ? (
              <div className="min-h-[400px] p-4 bg-warm-white rounded-lg">
                <div
                  className="prose-custom"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in markdown..."
                rows={20}
                className="w-full text-sm text-text-dark border-0 focus:ring-0 outline-none bg-transparent resize-y font-mono leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Category & Author */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-border-light rounded-lg px-3 py-2 bg-white"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Author</label>
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full text-sm border border-border-light rounded-lg px-3 py-2 bg-white"
              >
                <option value="Dr. Huma">Dr. Huma</option>
                <option value="Dr. Zulfiqar">Dr. Zulfiqar</option>
                <option value="Dr. Zonera">Dr. Zonera</option>
                <option value="Aesthetic Lounge Team">Aesthetic Lounge Team</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="skincare, treatments, guide"
                className="w-full text-sm border border-border-light rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-border p-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Featured Image URL
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border border-border-light rounded-lg px-3 py-2"
            />
            {featuredImage && (
              <div className="mt-2 aspect-video bg-warm-white rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-text-dark">SEO Settings</h3>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                SEO Title
                <span
                  className={`ml-2 ${
                    seoTitle.length >= 50 && seoTitle.length <= 60
                      ? 'text-green-600'
                      : seoTitle.length > 0
                        ? 'text-amber-600'
                        : 'text-text-muted'
                  }`}
                >
                  ({seoTitle.length}/60)
                </span>
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title || 'Custom SEO title...'}
                className="w-full text-sm border border-border-light rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                SEO Description
                <span
                  className={`ml-2 ${
                    seoDescription.length >= 150 && seoDescription.length <= 160
                      ? 'text-green-600'
                      : seoDescription.length > 0
                        ? 'text-amber-600'
                        : 'text-text-muted'
                  }`}
                >
                  ({seoDescription.length}/160)
                </span>
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Custom meta description..."
                rows={3}
                className="w-full text-sm border border-border-light rounded-lg px-3 py-2 resize-none"
              />
            </div>

            {/* Google Preview */}
            <div className="bg-warm-white rounded-lg p-3">
              <p className="text-[10px] text-text-muted mb-1 uppercase tracking-wide font-medium">
                Google Preview
              </p>
              <p className="text-[#1a0dab] text-sm font-medium truncate">
                {seoTitle || title || 'Post Title'}
              </p>
              <p className="text-[#006621] text-xs">
                aestheticloungeofficial.com/blog/{slug || '...'}
              </p>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                {seoDescription || 'Your meta description will appear here...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
