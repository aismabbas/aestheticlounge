import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query('SELECT * FROM al_blog_posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post: result.rows[0] });
  } catch (err) {
    console.error('[dashboard/blog/[id]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      'title',
      'slug',
      'excerpt',
      'content',
      'author',
      'category',
      'tags',
      'featured_image',
      'published',
      'published_at',
      'seo_title',
      'seo_description',
      'read_time',
    ];

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const val = field === 'tags' ? JSON.stringify(body[field]) : body[field];
        values.push(val);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    const sql = `UPDATE al_blog_posts SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post: result.rows[0] });
  } catch (err) {
    console.error('[dashboard/blog/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query('DELETE FROM al_blog_posts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[dashboard/blog/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
