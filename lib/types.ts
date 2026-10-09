export type MatchResult = "W" | "L" | "D" | null;

export interface Match {
  id: string;
  date: string; // ISO string
  opponent: string;
  location: string;
  homeAway: "home" | "away";
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: MatchResult;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: unknown[];
  publishedAt: string;
  author: string;
}

export interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  images: GalleryImage[];
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface HighlightVideo {
  id: string;
  youtubeId: string;
  title: string;
  event: string;
}

export interface SeasonStats {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface VideoMarker {
  id: string;
  timeSeconds: number;
  label: string;
}

export interface VideoClip {
  id: string;
  r2Url: string;
  startSeconds: number;
  endSeconds: number;
  label: string;
}

export interface SessionVideo {
  id: string;
  fileName: string;
  r2Url: string;
  thumbnailUrl: string;
  durationSeconds: number;
  resolution: string;
  markers: VideoMarker[];
  clips: VideoClip[];
}

export interface PracticeSession {
  id: string;
  sessionName: string;
  sessionType: "PRACTICE" | "GAME";
  sessionDate: string;
  videos: SessionVideo[];
}
