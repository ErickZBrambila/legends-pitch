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
  body: unknown[] | string;
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
  clipType?: "highlight" | "goal" | "celebration";
}

export interface ActivityBucket {
  tStart: number;
  tEnd: number;
  detections: number;
  frames: number;
}

export interface VideoAnalytics {
  fieldZones: number[];              // 10 values, normalized full-game
  fieldZonesFirstHalf?: number[];    // 1st half only
  fieldZonesSecondHalf?: number[];   // 2nd half only (same orientation as 1st)
  activityBuckets: ActivityBucket[];
  goalPressureLeft: number;
  goalPressureRight: number;
  goalPressureLeftH1?: number;
  goalPressureRightH1?: number;
  goalPressureLeftH2?: number;
  goalPressureRightH2?: number;
  totalFrames: number;
  dominantZone: number;
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
  analytics: VideoAnalytics | null;
}

export interface PracticeSession {
  id: string;
  sessionName: string;
  sessionType: "PRACTICE" | "GAME";
  sessionDate: string;
  videos: SessionVideo[];
}
