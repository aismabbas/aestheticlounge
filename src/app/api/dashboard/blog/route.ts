import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('al_session');
  if (!session?.value) return null;
  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    let sql = 'SELECT * FROM al_blog_posts';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status === 'published') {
      params.push(true);
      conditions.push(`published = $${params.length}`);
    } else if (status === 'draft') {
      params.push(false);
      conditions.push(`published = $${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json({ posts: result.rows });
  } catch (err) {
    console.error('[dashboard/blog] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      category,
      tags,
      featured_image,
      published,
      published_at,
      seo_title,
      seo_description,
      read_time,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 },
      );
    }

    const id = ulid();
    const safeSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

    const result = await query(
      `INSERT INTO al_blog_posts (
        id, title, slug, excerpt, content, author, category, tags,
        featured_image, published, published_at, seo_title, seo_description,
        read_time, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        title,
        safeSlug,
        excerpt || null,
        content,
        author || 'Aesthetic Lounge Team',
        category || 'Skincare',
        JSON.stringify(tags || []),
        featured_image || null,
        published || false,
        published_at || null,
        seo_title || null,
        seo_description || null,
        read_time || 5,
      ],
    );

    return NextResponse.json({ post: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/blog] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
