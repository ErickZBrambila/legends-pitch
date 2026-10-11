import { sanityClient } from "./client";
import { urlForImage } from "./image";
import type { Match, Player, NewsPost, GalleryEvent, HighlightVideo, SeasonStats, PracticeSession, VideoClip } from "@/lib/types";

export type TeamSlug = "u11" | "u12";

export async function getMatchesByTeam(team: TeamSlug): Promise<Match[]> {
  const raw = await sanityClient.fetch<
    Array<{
      _id: string;
      date: string;
      opponent: string;
      location: string;
      homeAway: "home" | "away";
      goalsFor: number | null;
      goalsAgainst: number | null;
      result: "W" | "L" | "D" | null;
    }>
  >(
    `*[_type == "match" && team->ageGroup == $team]{
      _id, date, opponent, location, homeAway, goalsFor, goalsAgainst, result
    } | order(date asc)`,
    { team }
  );
  return raw.map((m) => ({ ...m, id: m._id }));
}

export async function getPlayersByTeam(team: TeamSlug): Promise<Player[]> {
  const raw = await sanityClient.fetch<
    Array<{
      _id: string;
      name: string;
      number: number;
      position: "GK" | "DEF" | "MID" | "FWD";
      photo?: { asset: { _ref: string } };
    }>
  >(
    `*[_type == "player" && team->ageGroup == $team]{
      _id, name, number, position, photo
    } | order(number asc)`,
    { team }
  );
  return raw.map((p) => ({ id: p._id, name: p.name, number: p.number, position: p.position }));
}

export async function getPostsByTeam(team: TeamSlug): Promise<NewsPost[]> {
  const raw = await sanityClient.fetch<
    Array<{
      _id: string;
      title: string;
      title_es?: string;
      slug: { current: string };
      excerpt: string;
      excerpt_es?: string;
      body: unknown[];
      body_es?: unknown[];
      publishedAt: string;
      author: string;
    }>
  >(
    `*[_type == "post" && team->ageGroup == $team]{
      _id, title, title_es, slug, excerpt, excerpt_es, body, body_es, publishedAt, author
    } | order(publishedAt desc)`,
    { team }
  );
  return raw.map((p) => ({
    id: p._id,
    title: p.title,
    title_es: p.title_es,
    slug: p.slug.current,
    excerpt: p.excerpt ?? "",
    excerpt_es: p.excerpt_es,
    body: p.body ?? [],
    body_es: p.body_es,
    publishedAt: p.publishedAt,
    author: p.author ?? "",
  }));
}

export async function getPostBySlug(slug: string): Promise<NewsPost | null> {
  const p = await sanityClient.fetch<{
    _id: string;
    title: string;
    title_es?: string;
    slug: { current: string };
    excerpt: string;
    excerpt_es?: string;
    body: unknown[];
    body_es?: unknown[];
    publishedAt: string;
    author: string;
    team: { ageGroup: string };
  } | null>(
    `*[_type == "post" && slug.current == $slug][0]{
      _id, title, title_es, slug, excerpt, excerpt_es, body, body_es, publishedAt, author, team->{ ageGroup }
    }`,
    { slug }
  );
  if (!p) return null;
  return {
    id: p._id,
    title: p.title,
    title_es: p.title_es,
    slug: p.slug.current,
    excerpt: p.excerpt ?? "",
    excerpt_es: p.excerpt_es,
    body: p.body ?? [],
    body_es: p.body_es,
    publishedAt: p.publishedAt,
    author: p.author ?? "",
  };
}

export async function getGalleryEventsByTeam(team: TeamSlug): Promise<GalleryEvent[]> {
  const raw = await sanityClient.fetch<
    Array<{
      _id: string;
      title: string;
      title_es?: string;
      date: string;
      images: Array<{
        _key: string;
        alt: string;
        image: { _type?: string; asset?: { _ref: string }; url?: string } | null;
      }>;
    }>
  >(
    `*[_type == "galleryEvent" && team->ageGroup == $team]{
      _id, title, title_es, date,
      images[]{ _key, image, alt }
    } | order(date desc)`,
    { team }
  );
  return raw.map((e) => ({
    id: e._id,
    title: e.title,
    title_es: e.title_es,
    date: e.date,
    images: (e.images ?? []).flatMap((img) => {
      if (!img.image) return [];
      // Support both Sanity asset references and plain externalImage URLs
      const url = img.image._type === "externalImage" && img.image.url
        ? img.image.url
        : img.image.asset
          ? urlForImage(img.image)
          : null;
      if (!url) return [];
      return [{ id: img._key, url, alt: img.alt ?? "" }];
    }),
  }));
}

export async function getGalleryEventById(id: string): Promise<GalleryEvent | null> {
  const raw = await sanityClient.fetch<{
    _id: string;
    title: string;
    title_es?: string;
    date: string;
    images: Array<{
      _key: string;
      alt: string;
      image: { _type?: string; asset?: { _ref: string }; url?: string } | null;
    }>;
  } | null>(
    `*[_type == "galleryEvent" && _id == $id][0]{
      _id, title, title_es, date,
      images[]{ _key, image, alt }
    }`,
    { id }
  );
  if (!raw) return null;
  return {
    id: raw._id,
    title: raw.title,
    title_es: raw.title_es,
    date: raw.date,
    images: (raw.images ?? []).flatMap((img) => {
      if (!img.image) return [];
      const url = img.image._type === "externalImage" && img.image.url
        ? img.image.url
        : img.image.asset
          ? urlForImage(img.image)
          : null;
      if (!url) return [];
      return [{ id: img._key, url, alt: img.alt ?? "" }];
    }),
  };
}

export async function getHighlightVideosByTeam(team: TeamSlug): Promise<HighlightVideo[]> {
  const raw = await sanityClient.fetch<
    Array<{
      _id: string;
      title: string;
      youtubeId: string;
      event: string;
      order: number | null;
    }>
  >(
    `*[_type == "highlightVideo" && team->ageGroup == $team]{
      _id, title, youtubeId, event, order
    } | order(order asc, _createdAt asc)`,
    { team }
  );
  return raw.map((v) => ({ id: v._id, title: v.title, youtubeId: v.youtubeId, event: v.event }));
}

export async function getSeasonStatsByTeam(team: TeamSlug): Promise<SeasonStats> {
  const matches = await getMatchesByTeam(team);
  const played = matches.filter((m) => m.result !== null);
  return {
    wins: played.filter((m) => m.result === "W").length,
    losses: played.filter((m) => m.result === "L").length,
    draws: played.filter((m) => m.result === "D").length,
    goalsFor: played.reduce((s, m) => s + (m.goalsFor ?? 0), 0),
    goalsAgainst: played.reduce((s, m) => s + (m.goalsAgainst ?? 0), 0),
  };
}

export async function getNextMatchByTeam(team: TeamSlug): Promise<Match | null> {
  const matches = await getMatchesByTeam(team);
  const now = new Date();
  return (
    matches
      .filter((m) => m.result === null && new Date(m.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
  );
}

export async function getTeamLabel(team: TeamSlug): Promise<string> {
  const result = await sanityClient.fetch<{ name: string; season: string } | null>(
    `*[_type == "team" && ageGroup == $team][0]{ name, season }`,
    { team }
  );
  return result ? `${result.name}${result.season ? ` · ${result.season}` : ""}` : team === "u11" ? "Under 11" : "Under 12";
}

type RawActivityBucket = { _key: string; tStart: number; tEnd: number; detections: number; frames: number };
type RawAnalytics = {
  fieldZones: number[];
  fieldZonesFirstHalf?: number[];
  fieldZonesSecondHalf?: number[];
  activityBuckets: RawActivityBucket[];
  goalPressureLeft: number;
  goalPressureRight: number;
  goalPressureLeftH1?: number;
  goalPressureRightH1?: number;
  goalPressureLeftH2?: number;
  goalPressureRightH2?: number;
  totalFrames: number;
  dominantZone: number;
};

type RawSessionVideo = {
  _key: string;
  fileName: string;
  r2Url: string;
  driveUrl?: string;
  thumbnailUrl: string;
  durationSeconds: number;
  resolution: string;
  markers: Array<{ _key: string; timeSeconds: number; label: string }>;
  clips: Array<{ _key: string; r2Url: string; startSeconds: number; endSeconds: number; label: string; clipType?: string; saveCount?: number; archived?: boolean }>;
  analytics?: RawAnalytics;
};

type RawSession = {
  _id: string;
  sessionName: string;
  sessionType: "PRACTICE" | "GAME";
  sessionDate: string;
  videos: RawSessionVideo[];
};

const SESSION_PROJECTION = `
  _id, sessionName, sessionType, sessionDate,
  videos[]{
    _key, fileName, r2Url, driveUrl, thumbnailUrl, durationSeconds, resolution,
    markers[]{ _key, timeSeconds, label },
    clips[]{ _key, r2Url, startSeconds, endSeconds, label, clipType, saveCount, archived },
    analytics{
      fieldZones, fieldZonesFirstHalf, fieldZonesSecondHalf,
      goalPressureLeft, goalPressureRight,
      goalPressureLeftH1, goalPressureRightH1, goalPressureLeftH2, goalPressureRightH2,
      totalFrames, dominantZone,
      activityBuckets[]{ _key, tStart, tEnd, detections, frames }
    }
  }
`;

function mapSession(s: RawSession): PracticeSession {
  return {
    id: s._id,
    sessionName: s.sessionName,
    sessionType: s.sessionType,
    sessionDate: s.sessionDate,
    videos: (s.videos ?? []).map((v) => ({
      id: v._key,
      fileName: v.fileName ?? "",
      r2Url: v.r2Url ?? "",
      driveUrl: v.driveUrl,
      thumbnailUrl: v.thumbnailUrl ?? "",
      durationSeconds: v.durationSeconds ?? 0,
      resolution: v.resolution ?? "",
      markers: (v.markers ?? []).map((m) => ({ id: m._key, timeSeconds: m.timeSeconds, label: m.label })),
      clips: (v.clips ?? []).map((c) => ({
        id: c._key,
        r2Url: c.r2Url,
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
        label: c.label,
        clipType: (c.clipType as VideoClip["clipType"]) ?? "highlight",
        saveCount: c.saveCount ?? 0,
        archived: c.archived ?? false,
      })),
      analytics: v.analytics ? {
        fieldZones: v.analytics.fieldZones ?? [],
        fieldZonesFirstHalf: v.analytics.fieldZonesFirstHalf,
        fieldZonesSecondHalf: v.analytics.fieldZonesSecondHalf,
        activityBuckets: (v.analytics.activityBuckets ?? []).map((b) => ({
          tStart: b.tStart,
          tEnd: b.tEnd,
          detections: b.detections,
          frames: b.frames,
        })),
        goalPressureLeft: v.analytics.goalPressureLeft ?? 0,
        goalPressureRight: v.analytics.goalPressureRight ?? 0,
        goalPressureLeftH1: v.analytics.goalPressureLeftH1,
        goalPressureRightH1: v.analytics.goalPressureRightH1,
        goalPressureLeftH2: v.analytics.goalPressureLeftH2,
        goalPressureRightH2: v.analytics.goalPressureRightH2,
        totalFrames: v.analytics.totalFrames ?? 0,
        dominantZone: v.analytics.dominantZone ?? 0,
      } : null,
    })),
  };
}

export async function getSessionsByTeam(team: TeamSlug): Promise<PracticeSession[]> {
  const raw = await sanityClient.fetch<RawSession[]>(
    `*[_type == "practiceSession" && team->ageGroup == $team]{ ${SESSION_PROJECTION} } | order(sessionDate desc)`,
    { team }
  );
  return (raw ?? []).map(mapSession);
}

export async function getSessionById(id: string): Promise<PracticeSession | null> {
  const raw = await sanityClient.fetch<RawSession | null>(
    `*[_type == "practiceSession" && _id == $id][0]{ ${SESSION_PROJECTION} }`,
    { id }
  );
  return raw ? mapSession(raw) : null;
}
