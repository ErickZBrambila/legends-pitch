import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { getGotSportData } from "@/lib/data/gotsport";

export interface SearchResult {
  type: "news" | "announcement" | "match" | "player" | "page";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  team: "u11" | "u12" | "all";
}

// Static nav pages — shown when query matches a page name
const NAV_PAGES = [
  { id: "page-schedule",     title: "Schedule",       subtitle: "Upcoming & past matches",         href: "/schedule",      keywords: ["schedule", "calendar", "games", "matches", "game", "match"] },
  { id: "page-roster",       title: "Roster",         subtitle: "Players and positions",           href: "/roster",        keywords: ["roster", "players", "team", "lineup"] },
  { id: "page-news",         title: "News",           subtitle: "Articles and match recaps",       href: "/news",          keywords: ["news", "articles", "recaps", "article"] },
  { id: "page-gallery",      title: "Gallery",        subtitle: "Photos from games and practices", href: "/gallery",       keywords: ["gallery", "photos", "pictures", "photo"] },
  { id: "page-videos",       title: "Videos",         subtitle: "KickReel match highlights",       href: "/videos",        keywords: ["videos", "highlights", "clips", "video", "kickreel"] },
  { id: "page-announcements",title: "Announcements",  subtitle: "Coach messages to families",      href: "/announcements", keywords: ["announcements", "announcement", "messages"] },
  { id: "page-contact",      title: "Contact",        subtitle: "Coach info and location",         href: "/contact",       keywords: ["contact", "coach", "email", "hugo"] },
  { id: "page-roadmap",      title: "What's Coming",  subtitle: "Upcoming features and wishlist",  href: "/roadmap",       keywords: ["roadmap", "wishlist", "features", "coming"] },
];

// Month name → YYYY-MM prefix for date range search
const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const lower = q.toLowerCase();
  // GROQ match only supports suffix wildcards — no leading *
  const term = `${q}*`;

  // Static nav matches
  const pageMatches = NAV_PAGES
    .filter((p) => p.keywords.some((k) => k.startsWith(lower)))
    .map((p) => ({
      type: "page" as const,
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      href: p.href,
      team: "all" as const,
    }));

  // Month-based match date filter
  const monthNum = MONTH_MAP[lower];
  const datePrefix = monthNum ? `2026-${monthNum}` : null;

  const [posts, announcements, u11Data, u12Data, players] = await Promise.all([
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
    getGotSportData("u11"),
    getGotSportData("u12"),
    sanityClient.fetch<Array<{ _id: string; name: string; position: string; number: number; team: { ageGroup: string } }>>(
      `*[_type == "player" && name match $term][0..9]{
        _id, name, position, number, team->{ ageGroup }
      } | order(name asc)`,
      { term }
    ),
  ]);

  // Search GotSport matches (real schedule) — opponent, location, or month
  const allMatches = [
    ...u11Data.matches.map((m) => ({ ...m, teamSlug: "u11" as const })),
    ...u12Data.matches.map((m) => ({ ...m, teamSlug: "u12" as const })),
  ];
  const matchResults = allMatches.filter((m) => {
    const opp = m.opponent.toLowerCase();
    const loc = m.location.toLowerCase();
    const dateStr = m.date; // ISO string like "2026-10-17T..."
    if (datePrefix && dateStr.startsWith(datePrefix)) return true;
    return opp.includes(lower) || loc.includes(lower);
  }).slice(0, 9);

  const results: SearchResult[] = [
    ...pageMatches,
    ...players.map((p) => ({
      type: "player" as const,
      id: p._id,
      title: p.name,
      subtitle: `#${p.number} · ${p.position}`,
      href: `/roster`,
      team: (p.team?.ageGroup ?? "u11") as "u11" | "u12",
    })),
    ...matchResults.map((m) => ({
      type: "match" as const,
      id: m.id,
      title: `vs ${m.opponent}`,
      subtitle: `${m.location} · ${new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })}${m.result ? ` · ${m.result}` : ""}`,
      href: `/schedule`,
      team: m.teamSlug,
    })),
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
  ];

  return NextResponse.json({ results });
}
