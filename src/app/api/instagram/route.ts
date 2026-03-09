import { NextRequest, NextResponse } from "next/server";
import { fetchRecentPosts, type InstagramPost } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "6", 10) || 6, 1),
    20,
  );
  const typeFilter = searchParams.get("type") as
    | InstagramPost["media_type"]
    | null;

  const configured = !!(
    (process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN) &&
    process.env.INSTAGRAM_ACCOUNT_ID
  );

  let posts = await fetchRecentPosts(20);

  if (typeFilter) {
    posts = posts.filter((p) => p.media_type === typeFilter);
  }

  return NextResponse.json(
    {
      configured,
      posts: posts.slice(0, limit),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
