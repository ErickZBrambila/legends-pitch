import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";

export interface SearchResult {
  type: "news" | "announcement" | "match" | "player";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  team: "u11" | "u12";
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const term = `*${q}*`;

  const [posts, announcements, matches, players] = await Promise.all([
    sanityClient.fetch<Array<{ _id: string; title: string; title_es?: string; slug: { current: string }; publishedAt: string; team: { ageGroup: string } }>>(
      `*[_type == "post" && (status == "published" || !defined(status)) && (title match $term || title_es match $term || excerpt match $term || excerpt_es match $term)][0..9]{
        _id, title, title_es, slug, publishedAt, team->{ ageGroup }
      }`,
      { term }
    ),
    sanityClient.fetch<Array<{ _id: string; message: string; message_es?: string; publishedAt: string; team: { ageGroup: string } }>>(
      `*[_type == "announcement" && (message match $term || message_es match $term)][0..9]{
        _id, message, message_es, publishedAt, team->{ ageGroup }
      } | order(publishedAt desc)`,
      { term }
    ),
    sanityClient.fetch<Array<{ _id: string; opponent: string; location: string; date: string; result: string | null; team: { ageGroup: string } }>>(
      `*[_type == "match" && (opponent match $term || location match $term)][0..9]{
        _id, opponent, location, date, result, team->{ ageGroup }
      } | order(date desc)`,
      { term }
    ),
    sanityClient.fetch<Array<{ _id: string; name: string; position: string; number: number; team: { ageGroup: string } }>>(
      `*[_type == "player" && name match $term][0..9]{
        _id, name, position, number, team->{ ageGroup }
      } | order(name asc)`,
      { term }
    ),
  ]);

  const results: SearchResult[] = [
    ...posts.map((p) => ({
      type: "news" as const,
      id: p._id,
      title: p.title,
      subtitle: new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      href: `/news/${p.slug.current}`,
      team: (p.team?.ageGroup ?? "u11") as "u11" | "u12",
    })),
    ...announcements.map((a) => ({
      type: "announcement" as const,
      id: a._id,
      title: a.message.length > 80 ? a.message.slice(0, 80) + "…" : a.message,
      subtitle: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      href: `/announcements`,
      team: (a.team?.ageGroup ?? "u11") as "u11" | "u12",
    })),
    ...matches.map((m) => ({
      type: "match" as const,
      id: m._id,
      title: `vs ${m.opponent}`,
      subtitle: `${m.location} · ${new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${m.result ? ` · ${m.result}` : ""}`,
      href: `/schedule`,
      team: (m.team?.ageGroup ?? "u11") as "u11" | "u12",
    })),
    ...players.map((p) => ({
      type: "player" as const,
      id: p._id,
      title: p.name,
      subtitle: `#${p.number} · ${p.position}`,
      href: `/roster`,
      team: (p.team?.ageGroup ?? "u11") as "u11" | "u12",
    })),
  ];

  return NextResponse.json({ results });
}
