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
  body: string;
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

export interface SeasonStats {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
}
