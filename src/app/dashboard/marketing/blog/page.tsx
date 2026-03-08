'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/blog');
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function togglePublish(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/dashboard/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchPosts();
    } catch {
      setError('Failed to update post status');
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/dashboard/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchPosts();
    } catch {
      setError('Failed to delete post');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Blog Management</h1>
          <p className="text-sm text-text-muted mt-1">Create and manage blog posts</p>
        </div>
        <Link
          href="/dashboard/marketing/blog/new"
          className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
        >
          New Post
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-sm">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-muted mb-4">No blog posts yet</p>
            <Link
              href="/dashboard/marketing/blog/new"
              className="text-gold hover:underline text-sm font-medium"
            >
              Create your first post
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-warm-white">
                <th className="text-left px-4 py-3 font-medium text-text-muted">Title</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted w-28">Category</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted w-28">Author</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted w-24">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted w-28">Date</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted w-20">Views</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border-light hover:bg-warm-white/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-dark truncate max-w-[300px]">
                      {post.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{post.category}</td>
                  <td className="px-4 py-3 text-text-muted">{post.author}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublish(post.id, post.published)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase ${
                        post.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-text-muted">--</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/marketing/blog/new?edit=${post.id}`}
                        className="text-xs text-gold hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
