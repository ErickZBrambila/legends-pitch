import { sanityClient, sanityWriteClient } from "./client";
import { urlForImage } from "./image";
import type { Announcement, Match, Player, NewsPost, GalleryEvent, HighlightVideo, SeasonStats, PracticeSession, VideoClip } from "@/lib/types";

export type TeamSlug = "u11" | "u12";

type RawAnnouncement = {
  _id: string;
  message: string;
  message_es?: string;
  author: string;
  publishedAt: string;
  location?: string;
  eventTime?: string;
  locationLat?: number;
  locationLng?: number;
  expiresAt?: string;
  publishesAt?: string;
};

function mapAnnouncement(r: RawAnnouncement): Announcement {
  return {
    id: r._id,
    message: r.message,
    message_es: r.message_es,
    author: r.author,
    publishedAt: r.publishedAt,
    location: r.location,
    eventTime: r.eventTime,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    expiresAt: r.expiresAt,
    publishesAt: r.publishesAt,
  };
}

const ANNOUNCEMENT_FIELDS = `_id, message, message_es, author, publishedAt, location, eventTime, locationLat, locationLng, expiresAt, publishesAt`;

// Admin sees everything; public queries filter by publish window
export async function getAllAnnouncements(team: TeamSlug): Promise<Announcement[]> {
  const raw = await sanityClient.fetch<RawAnnouncement[]>(
    `*[_type == "announcement" && team->ageGroup == $team] | order(coalesce(publishesAt, publishedAt) desc){ ${ANNOUNCEMENT_FIELDS} }`,
    { team },
    { next: { revalidate: 60 } }
  );
  return raw.map(mapAnnouncement);
}

export async function getLatestAnnouncement(team: TeamSlug): Promise<Announcement | null> {
  const raw = await sanityClient.fetch<RawAnnouncement | null>(
    `*[
      _type == "announcement" &&
      team->ageGroup == $team &&
      (!defined(publishesAt) || publishesAt <= now()) &&
      (!defined(expiresAt) || expiresAt > now())
    ] | order(publishedAt desc) [0]{ ${ANNOUNCEMENT_FIELDS} }`,
    { team },
    { next: { revalidate: 60 } }
  );
  if (!raw) return null;
  return mapAnnouncement(raw);
}

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
      coachNotes?: string;
    }>
  >(
    `*[_type == "match" && team->ageGroup == $team]{
      _id, date, opponent, location, homeAway, goalsFor, goalsAgainst, result, coachNotes
    } | order(date asc)`,
    { team }
  );
  return raw.map((m) => ({ ...m, id: m._id, coachNotes: m.coachNotes }));
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
  return raw.map((p) => ({
    id: p._id,
    name: p.name,
    number: p.number,
    position: p.position,
    photoUrl: p.photo ? urlForImage(p.photo) : undefined,
  }));
}

export async function getPendingSubmissionPlayerIds(): Promise<string[]> {
  const raw = await sanityClient.fetch<Array<{ playerId: string }>>(
    `*[_type == "playerPhotoSubmission" && status == "pending"]{
      "playerId": player._ref
    }`,
    {},
    { cache: "no-store" }
  );
  return raw.map((r) => r.playerId);
}

export async function getPendingSubmissionByPlayer(playerId: string): Promise<import("@/lib/types").PhotoSubmission | null> {
  const raw = await sanityClient.fetch<{
    _id: string;
    image: { asset: { _ref: string } };
    submittedAt: string;
  } | null>(
    `*[_type == "playerPhotoSubmission" && player._ref == $playerId && status == "pending"][0]{
      _id, image, submittedAt
    }`,
    { playerId },
    { cache: "no-store" }
  );
  if (!raw) return null;
  return {
    id: raw._id,
    playerId,
    imageUrl: urlForImage(raw.image),
    status: "pending",
    submittedAt: raw.submittedAt,
  };
}

export async function getAllPendingSubmissions(): Promise<Array<import("@/lib/types").PhotoSubmission & { playerName: string; playerNumber: number }>> {
  const raw = await sanityClient.fetch<Array<{
    _id: string;
    image: { asset: { _ref: string } };
    submittedAt: string;
    player: { _id: string; name: string; number: number };
  }>>(
    `*[_type == "playerPhotoSubmission" && status == "pending"] | order(submittedAt asc){
      _id, image, submittedAt,
      player->{ _id, name, number }
    }`,
    {},
    { cache: "no-store" }
  );
  return raw.map((r) => ({
    id: r._id,
    playerId: r.player._id,
    imageUrl: urlForImage(r.image),
    status: "pending" as const,
    submittedAt: r.submittedAt,
    playerName: r.player.name,
    playerNumber: r.player.number,
  }));
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
      status?: string;
    }>
  >(
    `*[_type == "post" && team->ageGroup == $team && (status == "published" || !defined(status))]{
      _id, title, title_es, slug, excerpt, excerpt_es, body, body_es, publishedAt, author, status
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
    status: (p.status as "draft" | "published") ?? "published",
  }));
}

export async function getPostsByTeamAdmin(team: TeamSlug): Promise<NewsPost[]> {
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
      status?: string;
      sourceMatchId?: string;
      sourceFreeFormContext?: string;
    }>
  >(
    `*[_type == "post" && team->ageGroup == $team]{
      _id, title, title_es, slug, excerpt, excerpt_es, body, body_es, publishedAt, author, status, sourceMatchId, sourceFreeFormContext
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
    status: (p.status as "draft" | "published") ?? "published",
    sourceMatchId: p.sourceMatchId,
    sourceFreeFormContext: p.sourceFreeFormContext,
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
      youtubeId?: string;
      r2Url?: string;
      event: string;
      order: number | null;
    }>
  >(
    `*[_type == "highlightVideo" && team->ageGroup == $team]{
      _id, title, youtubeId, r2Url, event, order
    } | order(order asc, _createdAt asc)`,
    { team }
  );
  return raw.map((v) => ({ id: v._id, title: v.title, youtubeId: v.youtubeId, r2Url: v.r2Url, event: v.event }));
}

export async function getLatestSessionWithReel(team: TeamSlug): Promise<{ id: string; sessionName: string; compilationTitle: string } | null> {
  const raw = await sanityClient.fetch<{ _id: string; sessionName: string; compilationTitle?: string } | null>(
    `*[_type in ["practiceSession","gameSession"] && team->ageGroup == $team && defined(compilationUrl)]{
      _id, sessionName, compilationTitle
    } | order(sessionDate desc) [0]`,
    { team },
    { next: { revalidate: 300 } }
  );
  if (!raw) return null;
  return {
    id: raw._id,
    sessionName: raw.sessionName,
    compilationTitle: raw.compilationTitle ?? raw.sessionName,
  };
}

export async function getLatestMatchReel(team: TeamSlug): Promise<HighlightVideo | null> {
  const raw = await sanityClient.fetch<{
    _id: string;
    title: string;
    r2Url: string;
    event: string;
  } | null>(
    `*[_type == "highlightVideo" && team->ageGroup == $team && defined(r2Url)]{
      _id, title, r2Url, event
    } | order(order asc, _createdAt desc) [0]`,
    { team },
    { next: { revalidate: 300 } }
  );
  if (!raw) return null;
  return { id: raw._id, title: raw.title, r2Url: raw.r2Url, event: raw.event };
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
  shotsOnTarget?: number;
  saves?: number;
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
  compilationUrl?: string;
  compilationTitle?: string;
  videos: RawSessionVideo[];
};

const SESSION_PROJECTION = `
  _id, sessionName, sessionType, sessionDate, compilationUrl, compilationTitle,
  videos[]{
    _key, fileName, r2Url, driveUrl, thumbnailUrl, durationSeconds, resolution,
    markers[]{ _key, timeSeconds, label },
    clips[]{ _key, r2Url, startSeconds, endSeconds, label, clipType, saveCount, archived },
    analytics{
      fieldZones, fieldZonesFirstHalf, fieldZonesSecondHalf,
      goalPressureLeft, goalPressureRight,
      goalPressureLeftH1, goalPressureRightH1, goalPressureLeftH2, goalPressureRightH2,
      totalFrames, dominantZone, shotsOnTarget, saves,
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
    compilationUrl: s.compilationUrl,
    compilationTitle: s.compilationTitle,
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
        shotsOnTarget: v.analytics.shotsOnTarget,
        saves: v.analytics.saves,
      } : null,
    })),
  };
}

export async function getSessionsByTeam(team: TeamSlug): Promise<PracticeSession[]> {
  const raw = await sanityClient.fetch<RawSession[]>(
    `*[_type in ["practiceSession", "gameSession"] && team->ageGroup == $team]{ ${SESSION_PROJECTION} } | order(sessionDate desc)`,
    { team }
  );
  return (raw ?? []).map(mapSession);
}

export async function getSessionById(id: string): Promise<PracticeSession | null> {
  const raw = await sanityClient.fetch<RawSession | null>(
    `*[_type in ["practiceSession", "gameSession"] && _id == $id][0]{ ${SESSION_PROJECTION} }`,
    { id }
  );
  return raw ? mapSession(raw) : null;
}

export interface CoachSubmission {
  headCoachName: string;
  headCoachEmail: string;
  assistants: { name: string; role: string }[];
  practiceSlots: { day: string; time: string; location: string }[];
}

export async function purgeOldDrafts(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const ids = await sanityClient.fetch<string[]>(
    `*[_type == "post" && status == "draft" && _createdAt < $cutoff]._id`,
    { cutoff },
    { cache: "no-store" }
  );
  if (ids.length === 0) return 0;
  await Promise.all(ids.map((id) => sanityWriteClient.delete(id)));
  return ids.length;
}

export async function getCoachSubmission(team: TeamSlug): Promise<CoachSubmission | null> {
  return sanityClient.fetch<CoachSubmission | null>(
    `*[_id == $id][0]{
      headCoachName, headCoachEmail,
      assistants, practiceSlots
    }`,
    { id: `coach-submission-${team}` },
    { cache: "no-store" }
  );
}
