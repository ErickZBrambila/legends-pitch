import type { TeamSlug } from "@/lib/sanity/queries";
import type { Match } from "@/lib/types";
import { fetchSportsYouGames } from "./sportsyou";
import cache from "./gotsport-cache.json";

export interface StandingRow {
  rank: number;
  team: string;
  gp: number;
  w: number;
  l: number;
  t: number;
  gf: number;
  ga: number;
  pts: number;
  isNorthLegends: boolean;
}

interface GotSportData {
  standings: StandingRow[];
  matches: Match[];
}

interface MatrixScore {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "L" | "D";
}

// --- Opponent name normalisation ---

const GOTSPORT_OPPONENT_MAP: Record<string, string> = {
  "Elgin United- Ramirez 2016 B":       "Elgin United (Ramirez)",
  "Elgin United-Ramirez 2016 B":        "Elgin United (Ramirez)",
  "Elgin United-Hernandez 2016 B":      "Elgin United (Hernandez)",
  "T&C Soccer BU11 Inter Milan":        "T&C Soccer Inter Milan",
  "WBSA UNITED PHINOMENON":             "WBSA United",
  "Storm 16B Black":                    "Storm 16B Black",
  "Leander FC 2014/15 B Rattlers Gray": "Leander FC Rattlers",
  "Elgin United-Castro 2015 B":         "Elgin United (Castro)",
  "FC Westlake North Hooligans BU12":   "FC Westlake Hooligans",
  "BYSO 14-15 Inferno":                 "BYSO Inferno",
  "LC United 14B":                      "LC United",
  "Liberty United 14/15B Black":        "Liberty United",
};

function canonicalOpponent(raw: string): string {
  const t = raw.trim();
  if (GOTSPORT_OPPONENT_MAP[t]) return GOTSPORT_OPPONENT_MAP[t];
  for (const [key, val] of Object.entries(GOTSPORT_OPPONENT_MAP)) {
    if (t.includes(key) || key.includes(t)) return val;
  }
  return t;
}

// --- Fallback static data (used when cache is empty or SportsYou is unavailable) ---

const U11_STANDINGS: StandingRow[] = [
  { rank: 1, team: "Elgin United (Ramirez)",   gp: 9, w: 7, l: 1, t: 1, gf: 26, ga: 11, pts: 22, isNorthLegends: false },
  { rank: 2, team: "JYSA North Legends FC",    gp: 8, w: 7, l: 1, t: 0, gf: 22, ga: 8,  pts: 21, isNorthLegends: true  },
  { rank: 3, team: "T&C Soccer Inter Milan",   gp: 7, w: 4, l: 2, t: 1, gf: 17, ga: 11, pts: 13, isNorthLegends: false },
  { rank: 4, team: "WBSA United",              gp: 7, w: 3, l: 4, t: 0, gf: 12, ga: 18, pts: 9,  isNorthLegends: false },
  { rank: 5, team: "Elgin United (Hernandez)", gp: 6, w: 0, l: 6, t: 0, gf: 4,  ga: 18, pts: 0,  isNorthLegends: false },
  { rank: 6, team: "Storm 16B Black",          gp: 7, w: 0, l: 7, t: 0, gf: 6,  ga: 21, pts: 0,  isNorthLegends: false },
];

const U12_STANDINGS: StandingRow[] = [
  { rank: 1, team: "JYSA North Legends FC",       gp: 7, w: 7, l: 0, t: 0, gf: 21, ga: 9,  pts: 21, isNorthLegends: true  },
  { rank: 2, team: "FC Westlake North Hooligans", gp: 8, w: 6, l: 2, t: 0, gf: 23, ga: 17, pts: 18, isNorthLegends: false },
  { rank: 3, team: "BYSO Inferno",                gp: 6, w: 4, l: 2, t: 0, gf: 16, ga: 12, pts: 12, isNorthLegends: false },
  { rank: 4, team: "Elgin United (Castro)",       gp: 7, w: 3, l: 3, t: 1, gf: 13, ga: 14, pts: 10, isNorthLegends: false },
  { rank: 5, team: "Leander FC Rattlers",         gp: 8, w: 3, l: 4, t: 1, gf: 19, ga: 20, pts: 10, isNorthLegends: false },
  { rank: 6, team: "LC United",                   gp: 7, w: 1, l: 6, t: 0, gf: 15, ga: 21, pts: 3,  isNorthLegends: false },
  { rank: 7, team: "Liberty United",              gp: 7, w: 0, l: 7, t: 0, gf: 7,  ga: 21, pts: 0,  isNorthLegends: false },
];

// UID-keyed fallback results — used only when matrixScores is empty and SportsYou is available
const U11_RESULTS: Record<string, { goalsFor: number; goalsAgainst: number; result: "W" | "L" | "D" }> = {
  "3bd5311d": { goalsFor: 1,  goalsAgainst: 2, result: "L" }, // Sep 12 vs Elgin United (Ramirez)
  "9183d02e": { goalsFor: 15, goalsAgainst: 0, result: "W" }, // Sep 19 vs Elgin United (Hernandez)
  "e11c25d1": { goalsFor: 7,  goalsAgainst: 0, result: "W" }, // Sep 26 vs Storm 16B Black
  "bc0eae72": { goalsFor: 4,  goalsAgainst: 2, result: "W" }, // Sep 27 vs T&C Soccer Inter Milan
  "3ed13cc0": { goalsFor: 4,  goalsAgainst: 3, result: "W" }, // Oct 10 vs Elgin United (Ramirez)
  "6e6fb4f1": { goalsFor: 10, goalsAgainst: 1, result: "W" }, // Oct 17 vs Storm 16B Black
  "3c773b63": { goalsFor: 8,  goalsAgainst: 0, result: "W" }, // Oct 18 vs Elgin United (Hernandez)
  "62f317dc": { goalsFor: 3,  goalsAgainst: 0, result: "W" }, // Oct 24 vs T&C Soccer Inter Milan
};

const U11_OPPONENT_OVERRIDES: Record<string, string> = {
  "3bd5311d": "Elgin United (Ramirez)",
  "9183d02e": "Elgin United (Hernandez)",
};

const U12_RESULTS: Record<string, { goalsFor: number; goalsAgainst: number; result: "W" | "L" | "D" }> = {
  "87eef744": { goalsFor: 7,  goalsAgainst: 2, result: "W" }, // Sep 12 vs Leander FC Rattlers
  "0350dff9": { goalsFor: 13, goalsAgainst: 1, result: "W" }, // Sep 19 vs Elgin United (Castro)
  "1eb066e3": { goalsFor: 5,  goalsAgainst: 2, result: "W" }, // Sep 26 vs FC Westlake Hooligans
  "fc775168": { goalsFor: 15, goalsAgainst: 0, result: "W" }, // Oct 10 vs Liberty United
  "6747a6ad": { goalsFor: 4,  goalsAgainst: 1, result: "W" }, // Oct 17 vs LC United
  "a2e2a1fd": { goalsFor: 7,  goalsAgainst: 2, result: "W" }, // Oct 24 vs Leander FC Rattlers
  "05b2c84f": { goalsFor: 6,  goalsAgainst: 1, result: "W" }, // Oct 25 vs BYSO Inferno
};

let u12Id = 0;

const U12_MATCHES: Match[] = [
  { id: `gs-u12-${++u12Id}`, date: "2026-09-12T11:30:00-05:00", opponent: "Leander FC Rattlers",   location: "WCRP South",            homeAway: "home", goalsFor: 7,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-19T10:00:00-05:00", opponent: "Elgin United (Castro)", location: "WCRP North",            homeAway: "home", goalsFor: 13, goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-26T08:30:00-05:00", opponent: "FC Westlake Hooligans", location: "Riverwalk #3",          homeAway: "away", goalsFor: 5,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-10T10:00:00-05:00", opponent: "Liberty United",        location: "WCRP South",            homeAway: "home", goalsFor: 15, goalsAgainst: 0,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-17T15:00:00-05:00", opponent: "LC United",             location: "Shenandoah Field 2",    homeAway: "away", goalsFor: 4,  goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-24T09:30:00-05:00", opponent: "Leander FC Rattlers",   location: "Serna Athletic Fields", homeAway: "away", goalsFor: 7,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-25T10:00:00-05:00", opponent: "BYSO Inferno",          location: "WCRP South",            homeAway: "home", goalsFor: 6,  goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-11-08T10:30:00-06:00", opponent: "BYSO Inferno",          location: "Bastrop Youth Soccer",  homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
];

export const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  "WCRP":                      { lat: 30.5407, lng: -97.8742 },
  "WCRP North":                { lat: 30.5407, lng: -97.8742 },
  "WCRP South":                { lat: 30.5407, lng: -97.8742 },
  "Shenandoah Field 2":        { lat: 30.3490, lng: -97.3690 },
  "Crossroads Park":           { lat: 31.0982, lng: -97.3428 },
  "Heritage Park":             { lat: 31.0956, lng: -97.4665 },
  "Town & Country Field 23W":  { lat: 30.4414, lng: -97.7553 },
  "Wells Branch Soccer":       { lat: 30.4380, lng: -97.6760 },
  "Serna Athletic Fields":     { lat: 30.5775, lng: -97.8530 },
  "Bastrop Youth Soccer":      { lat: 30.1119, lng: -97.3160 },
  "Riverwalk #3":              { lat: 30.5440, lng: -97.5490 },
  "Jarrell Elementary School": { lat: 30.8195, lng: -97.6040 },
};

const LOCATION_ADDRESSES: Record<string, string> = {
  "WCRP North":               "3005 Co Rd 175, Leander, TX 78641",
  "WCRP South":               "3005 Co Rd 175, Leander, TX 78641",
  "Shenandoah Field 2":       "1490 N Avenue C, Elgin, TX 78621",
  "Crossroads Park":          "1020 Research Pkwy, Temple, TX 76502",
  "Town & Country Field 23W": "9100 Meadowheath Dr, Austin, TX 78729",
  "Wells Branch Soccer":      "3908 Shoreline Dr, Austin, TX 78728",
  "Serna Athletic Fields":    "601 S Bagdad Rd, Leander, TX 78641",
  "Bastrop Youth Soccer":     "1603 Pine St, Bastrop, TX 78602",
  "Riverwalk #3":             "1 Riverwalk Dr, Hutto, TX 78634",
  "Jarrell Elementary School":"1615 CR 313, Jarrell, TX 76537",
};

function withAddress(matches: Match[]): Match[] {
  return matches.map((m) => ({
    ...m,
    locationAddress: m.locationAddress ?? LOCATION_ADDRESSES[m.location],
  }));
}

// --- Main export ---

export async function getGotSportData(team: TeamSlug): Promise<GotSportData> {
  const teamCache = cache[team as keyof typeof cache] as
    | { standings: StandingRow[]; matrixScores: MatrixScore[] }
    | undefined;

  const matrixScores: MatrixScore[] = teamCache?.matrixScores ?? [];
  const cachedStandings: StandingRow[] = teamCache?.standings ?? [];
  const fallbackStandings = team === "u12" ? U12_STANDINGS : U11_STANDINGS;
  const overrides = team === "u11" ? U11_OPPONENT_OVERRIDES : ({} as Record<string, string>);

  const sportsyouGames = await fetchSportsYouGames(team);

  let matches: Match[];

  if (matrixScores.length > 0 && sportsyouGames.length > 0) {
    // Merge cached scores (by opponent, chronological) with SportsYou schedule
    const byOpponent = new Map<string, MatrixScore[]>();
    for (const s of matrixScores) {
      const list = byOpponent.get(s.opponent) ?? [];
      list.push(s);
      byOpponent.set(s.opponent, list);
    }
    const usedCount = new Map<string, number>();

    matches = [...sportsyouGames]
      .sort((a, b) => a.iso.localeCompare(b.iso))
      .map((g) => {
        const opponent = canonicalOpponent(overrides[g.uid] ?? g.opponent);
        const scores = byOpponent.get(opponent) ?? [];
        const idx = usedCount.get(opponent) ?? 0;
        const score = scores[idx];
        if (score) usedCount.set(opponent, idx + 1);
        return {
          id: `sy-${team}-${g.uid}`,
          date: g.iso,
          arrivalDate: g.arrivalIso,
          opponent,
          location: g.locationName,
          locationAddress: g.locationAddress,
          homeAway: g.homeAway,
          goalsFor: score?.goalsFor ?? null,
          goalsAgainst: score?.goalsAgainst ?? null,
          result: score?.result ?? null,
        };
      });
  } else if (sportsyouGames.length > 0) {
    // No matrix cache — fall back to UID-keyed static results
    const resultsMap = team === "u11" ? U11_RESULTS : U12_RESULTS;
    matches = sportsyouGames.map((g) => ({
      id: `sy-${team}-${g.uid}`,
      date: g.iso,
      arrivalDate: g.arrivalIso,
      opponent: overrides[g.uid] ?? g.opponent,
      location: g.locationName,
      locationAddress: g.locationAddress,
      homeAway: g.homeAway,
      ...(resultsMap[g.uid] ?? { goalsFor: null, goalsAgainst: null, result: null }),
    }));
  } else {
    matches = team === "u12" ? withAddress(U12_MATCHES) : [];
  }

  const standings = cachedStandings.length > 0 ? cachedStandings : fallbackStandings;
  return { standings, matches };
}
