import type { TeamSlug } from "@/lib/sanity/queries";
import type { Match } from "@/lib/types";
import { fetchSportsYouGames } from "./sportsyou";

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

const GOTSPORT_SCHEDULE_URLS: Record<string, string> = {
  u11: "https://system.gotsport.com/org_event/events/55587/schedules?team=4373770",
  u12: "https://system.gotsport.com/org_event/events/55587/schedules?team=4373769",
};

function cellText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeStandings(team: string): Promise<StandingRow[]> {
  const url = GOTSPORT_SCHEDULE_URLS[team];
  if (!url) return [];

  let html: string;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const start = html.indexOf("Bracket A");
  if (start === -1) return [];
  const endIdx = html.indexOf("tiebreaker", start);
  const section = html.slice(start, endIdx > start ? endIdx : start + 12000);

  const rows: StandingRow[] = [];
  const trPattern = /<tr[\s\S]*?<\/tr>/g;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trPattern.exec(section)) !== null) {
    const cells: string[] = [];
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdPattern.exec(trMatch[0])) !== null) {
      cells.push(cellText(tdMatch[1]));
    }

    // Need at least rank + team + 8 stat columns
    if (cells.length < 9) continue;

    let rank: number;
    let teamName: string;
    let statOffset: number;

    const firstNum = parseInt(cells[0], 10);
    if (!isNaN(firstNum) && firstNum >= 1 && firstNum <= 30 && cells.length >= 10) {
      // 10-cell layout: [rank, team, MP, W, L, D, GF, GA, GD, PTS]
      rank = firstNum;
      teamName = cells[1];
      statOffset = 2;
    } else {
      continue; // skip header rows and non-standings rows
    }

    if (!teamName || /^\d+$/.test(teamName)) continue;

    const gp  = parseInt(cells[statOffset],     10);
    const w   = parseInt(cells[statOffset + 1], 10);
    const l   = parseInt(cells[statOffset + 2], 10);
    const t   = parseInt(cells[statOffset + 3], 10);
    const gf  = parseInt(cells[statOffset + 4], 10);
    const ga  = parseInt(cells[statOffset + 5], 10);
    // cells[statOffset + 6] is GD — skip
    const pts = parseInt(cells[statOffset + 7], 10);

    if ([gp, w, l, t, gf, ga, pts].some(isNaN)) continue;

    rows.push({
      rank,
      team: teamName,
      gp, w, l, t, gf, ga, pts,
      isNorthLegends: teamName.includes("North Legends") || teamName.includes("Legends"),
    });
  }

  return rows;
}

const U11_STANDINGS: StandingRow[] = [
  { rank: 1, team: "JYSA North Legends FC",        gp: 8, w: 7, l: 1, t: 0, gf: 34, ga: 9,  pts: 21, isNorthLegends: true  },
  { rank: 2, team: "Elgin United (Ramirez)",       gp: 7, w: 5, l: 1, t: 1, gf: 20, ga: 10, pts: 16, isNorthLegends: false },
  { rank: 3, team: "T&C Soccer Inter Milan",       gp: 4, w: 2, l: 1, t: 1, gf: 11, ga: 8,  pts: 7,  isNorthLegends: false },
  { rank: 4, team: "WBSA United",                  gp: 5, w: 2, l: 3, t: 0, gf: 9,  ga: 12, pts: 6,  isNorthLegends: false },
  { rank: 5, team: "Elgin United (Hernandez)",     gp: 4, w: 0, l: 4, t: 0, gf: 1,  ga: 17, pts: 0,  isNorthLegends: false },
  { rank: 6, team: "Storm 16B Black",              gp: 6, w: 0, l: 6, t: 0, gf: 5,  ga: 25, pts: 0,  isNorthLegends: false },
];

const U12_STANDINGS: StandingRow[] = [
  { rank: 1, team: "JYSA North Legends FC",       gp: 5, w: 5, l: 0, t: 0, gf: 15, ga: 6,  pts: 15, isNorthLegends: true  },
  { rank: 2, team: "FC Westlake North Hooligans", gp: 6, w: 5, l: 1, t: 0, gf: 17, ga: 11, pts: 15, isNorthLegends: false },
  { rank: 3, team: "Elgin United (Castro)",       gp: 5, w: 2, l: 2, t: 1, gf: 8,  ga: 9,  pts: 7,  isNorthLegends: false },
  { rank: 4, team: "BYSO Inferno",                gp: 3, w: 2, l: 1, t: 0, gf: 9,  ga: 6,  pts: 6,  isNorthLegends: false },
  { rank: 5, team: "Leander FC Rattlers",         gp: 5, w: 1, l: 3, t: 1, gf: 11, ga: 13, pts: 4,  isNorthLegends: false },
  { rank: 6, team: "LC United",                   gp: 5, w: 1, l: 4, t: 0, gf: 10, ga: 15, pts: 3,  isNorthLegends: false },
  { rank: 7, team: "Liberty United",              gp: 5, w: 0, l: 5, t: 0, gf: 5,  ga: 15, pts: 0,  isNorthLegends: false },
];

// U11 match results keyed by SportsYou short UID (last 8 chars before @).
// Add a new entry here after each game to populate the results table.
const U11_RESULTS: Record<string, { goalsFor: number; goalsAgainst: number; result: "W" | "L" | "D" }> = {
  "3bd5311d": { goalsFor: 1,  goalsAgainst: 2, result: "L" }, // Sep 12 vs Elgin United (Ramirez)  — GotSport #340
  "9183d02e": { goalsFor: 15, goalsAgainst: 0, result: "W" }, // Sep 19 vs Elgin United (Hernandez) — GotSport #342
  "e11c25d1": { goalsFor: 7,  goalsAgainst: 0, result: "W" }, // Sep 26 vs Storm 16B Black
  "bc0eae72": { goalsFor: 4,  goalsAgainst: 2, result: "W" }, // Sep 27 vs T&C Soccer Inter Milan
  "3ed13cc0": { goalsFor: 4,  goalsAgainst: 3, result: "W" }, // Oct 10 vs Elgin United (Ramirez)
  "6e6fb4f1": { goalsFor: 10, goalsAgainst: 1, result: "W" }, // Oct 17 vs Storm 16B Black
  "3c773b63": { goalsFor: 8,  goalsAgainst: 0, result: "W" }, // Oct 18 vs Elgin United (Hernandez)
};

// SportsYou has Ramirez/Hernandez swapped for the first two games — override with GotSport-verified names.
const U11_OPPONENT_OVERRIDES: Record<string, string> = {
  "3bd5311d": "Elgin United (Ramirez)",   // GotSport #340: Ramirez beat us 2-1 on Sep 12
  "9183d02e": "Elgin United (Hernandez)", // GotSport #342: we beat Hernandez 15-0 on Sep 19
};

let u12Id = 0;

const U12_MATCHES: Match[] = [
  { id: `gs-u12-${++u12Id}`, date: "2026-09-12T11:30:00-05:00", opponent: "Leander FC Rattlers",      location: "WCRP South",              homeAway: "home", goalsFor: 7,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-19T10:00:00-05:00", opponent: "Elgin United (Castro)",    location: "WCRP North",              homeAway: "home", goalsFor: 13, goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-26T08:30:00-05:00", opponent: "FC Westlake Hooligans",    location: "Riverwalk #3",            homeAway: "away", goalsFor: 5,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-10T10:00:00-05:00", opponent: "Liberty United",           location: "WCRP South",              homeAway: "home", goalsFor: 15, goalsAgainst: 0,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-17T15:00:00-05:00", opponent: "LC United",                location: "Shenandoah Field 2",      homeAway: "away", goalsFor: 4,  goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-24T09:30:00-05:00", opponent: "Leander FC Rattlers",      location: "Serna Athletic Fields",   homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-25T10:00:00-05:00", opponent: "BYSO Inferno",             location: "WCRP South",              homeAway: "home", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-11-08T10:30:00-06:00", opponent: "BYSO Inferno",             location: "Bastrop Youth Soccer",    homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
];

export const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  "WCRP":                     { lat: 30.5407, lng: -97.8742 }, // alias used by SportsYou data
  "WCRP North":               { lat: 30.5407, lng: -97.8742 },
  "WCRP South":               { lat: 30.5407, lng: -97.8742 },
  "Shenandoah Field 2":       { lat: 30.3490, lng: -97.3690 },
  "Crossroads Park":          { lat: 31.0982, lng: -97.3428 },
  "Heritage Park":            { lat: 31.0956, lng: -97.4665 }, // Heritage Park Belton
  "Town & Country Field 23W": { lat: 30.4414, lng: -97.7553 },
  "Wells Branch Soccer":      { lat: 30.4380, lng: -97.6760 },
  "Serna Athletic Fields":    { lat: 30.5775, lng: -97.8530 },
  "Bastrop Youth Soccer":     { lat: 30.1119, lng: -97.3160 },
  "Riverwalk #3":             { lat: 30.5440, lng: -97.5490 },
  "Jarrell Elementary School":{ lat: 30.8195, lng: -97.6040 },
};

const LOCATION_ADDRESSES: Record<string, string> = {
  "WCRP North":              "3005 Co Rd 175, Leander, TX 78641",
  "WCRP South":              "3005 Co Rd 175, Leander, TX 78641",
  "Shenandoah Field 2":      "1490 N Avenue C, Elgin, TX 78621",
  "Crossroads Park":         "1020 Research Pkwy, Temple, TX 76502",
  "Town & Country Field 23W":"9100 Meadowheath Dr, Austin, TX 78729",
  "Wells Branch Soccer":     "3908 Shoreline Dr, Austin, TX 78728",
  "Serna Athletic Fields":   "601 S Bagdad Rd, Leander, TX 78641",
  "Bastrop Youth Soccer":    "1603 Pine St, Bastrop, TX 78602",
  "Riverwalk #3":            "1 Riverwalk Dr, Hutto, TX 78634",
  "Jarrell Elementary School":"1615 CR 313, Jarrell, TX 76537",
};

function withAddress(matches: Match[]): Match[] {
  return matches.map((m) => ({
    ...m,
    locationAddress: m.locationAddress ?? LOCATION_ADDRESSES[m.location],
  }));
}

export async function getGotSportData(team: TeamSlug): Promise<GotSportData> {
  const fallbackStandings = team === "u12" ? U12_STANDINGS : U11_STANDINGS;

  const [liveStandings, matchData] = await Promise.all([
    scrapeStandings(team),
    team === "u11"
      ? fetchSportsYouGames("u11").then((games) =>
          games.length > 0
            ? games.map((g): Match => ({
                id: `sy-u11-${g.uid}`,
                date: g.iso,
                arrivalDate: g.arrivalIso,
                opponent: U11_OPPONENT_OVERRIDES[g.uid] ?? g.opponent,
                location: g.locationName,
                locationAddress: g.locationAddress,
                homeAway: g.homeAway,
                ...(U11_RESULTS[g.uid] ?? { goalsFor: null, goalsAgainst: null, result: null }),
              }))
            : withAddress([] as Match[])
        )
      : Promise.resolve(withAddress(U12_MATCHES)),
  ]);

  const standings = liveStandings.length > 0 ? liveStandings : fallbackStandings;
  return { standings, matches: matchData };
}
