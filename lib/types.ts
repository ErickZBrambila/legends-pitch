export interface Announcement {
  id: string;
  message: string;
  message_es?: string;
  author: string;
  publishedAt: string;
  location?: string;
  eventTime?: string;
  locationLat?: number;
  locationLng?: number;
  imageUrl?: string;
  expiresAt?: string;
  publishesAt?: string;
}

export type MatchResult = "W" | "L" | "D" | null;

export interface Match {
  id: string;
  date: string;         // kickoff ISO string
  arrivalDate?: string; // be-there time ISO (30 min before kickoff, from SportsYou)
  opponent: string;
  location: string;
  locationAddress?: string;
  homeAway: "home" | "away";
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: MatchResult;
  coachNotes?: string;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  photoUrl?: string;
}

export interface PhotoSubmission {
  id: string;
  playerId: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export interface PostVideo {
  title: string;
  url: string;
  description?: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  title_es?: string;
  excerpt: string;
  excerpt_es?: string;
  body: unknown[] | string;
  body_es?: unknown[];
  publishedAt: string;
  author: string;
  status?: "draft" | "published";
  coverImageUrl?: string;
  videos?: PostVideo[];
  sourceMatchId?: string;
  sourceFreeFormContext?: string;
}

export interface GalleryEvent {
  id: string;
  title: string;
  title_es?: string;
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
  clipType?: "highlight" | "goal" | "rival_goal" | "celebration";
  saveCount: number;
  archived: boolean;
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
  secondHalfOnly?: boolean;          // true when only 2nd-half footage was recorded
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
  driveUrl?: string;
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

export type TrackerEventType =
  | "goal"
  | "rival_goal"
  | "shot_on"
  | "shot_off"
  | "save"
  | "yellow_card"
  | "red_card"
  | "substitution";

export interface TrackerEvent {
  id: string;
  type: TrackerEventType;
  half: 1 | 2;
  minute: number;
  wallTimestamp: string;       // ISO — maps to KickReel video timeline
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  subInPlayerId?: string;
  subInPlayerName?: string;
}

export interface TrackerGame {
  gameId: string;
  teamAgeGroup: "u11" | "u12";
  matchId: string;
  opponent: string;
  homeAway: "home" | "away";
  date: string;
  submittedAt: string;
  events: TrackerEvent[];
  finalScore: {
    home: number;
    away: number;
  };
}
