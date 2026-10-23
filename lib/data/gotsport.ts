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

// --- Standings parser ---

function parseStandings(html: string): StandingRow[] {
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

    if (cells.length < 9) continue;

    const firstNum = parseInt(cells[0], 10);
    if (isNaN(firstNum) || firstNum < 1 || firstNum > 30 || cells.length < 10) continue;

    const teamName = cells[1];
    if (!teamName || /^\d+$/.test(teamName)) continue;

    const o = 2; // statOffset
    const gp  = parseInt(cells[o],     10);
    const w   = parseInt(cells[o + 1], 10);
    const l   = parseInt(cells[o + 2], 10);
    const t   = parseInt(cells[o + 3], 10);
    const gf  = parseInt(cells[o + 4], 10);
    const ga  = parseInt(cells[o + 5], 10);
    const pts = parseInt(cells[o + 7], 10); // o+6 is GD

    if ([gp, w, l, t, gf, ga, pts].some(isNaN)) continue;

    rows.push({
      rank: firstNum,
      team: teamName,
      gp, w, l, t, gf, ga, pts,
      isNorthLegends: teamName.includes("North Legends") || teamName.includes("Legends"),
    });
  }

  return rows;
}

// --- Schedule parser ---

// Maps GotSport full team names → canonical display names used in the app
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

const MONTHS_IDX: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// Parses GotSport cell text like "Oct 24, 2026 11:30AM CDT CDT" → ISO string
function parseCentralToISO(cell: string): string {
  const dm = cell.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/);
  const tm = cell.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*(CDT|CST)/i);
  if (!dm || !tm) return "";

  const [, mon, dayStr, year] = dm;
  const [, hStr, min, ampm, tz] = tm;

  let h = parseInt(hStr);
  if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
  if (ampm.toUpperCase() === "AM" && h === 12) h = 0;

  const mo = MONTHS_IDX[mon];
  const day = dayStr.padStart(2, "0");
  const hh = h.toString().padStart(2, "0");
  const offset = tz.toUpperCase() === "CDT" ? "-05:00" : "-06:00";

  return `${year}-${mo}-${day}T${hh}:${min}:00${offset}`;
}

function gotsportLocationName(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes("WCRP") || u.includes("BORHO")) {
    return u.includes("SOUTH") ? "WCRP South" : "WCRP North";
  }
  if (u.includes("SHENANDOAH") || u.includes("N AVENUE C")) return "Shenandoah Field 2";
  if (u.includes("KOROMPAI") || u.includes("RESEARCH LOOP") || u.includes("CROSSROADS")) return "Crossroads Park";
  if (u.includes("HERITAGE") || u.includes("1502 PARK")) return "Heritage Park";
  if (u.includes("MEADOWHEATH")) return "Town & Country Field 23W";
  if (u.includes("SHORELINE") || u.includes("WELLS BRANCH")) return "Wells Branch Soccer";
  if (u.includes("BAGDAD") || u.includes("SERNA")) return "Serna Athletic Fields";
  if (u.includes("BASTROP")) return "Bastrop Youth Soccer";
  if (u.includes("RIVERWALK")) return "Riverwalk #3";
  if (u.includes("JARRELL")) return "Jarrell Elementary School";
  return raw.replace(/\s*-\s*.+$/, "").trim();
}

function parseSchedule(html: string, team: string): Match[] {
  const LEGENDS_RE = /JYSA.*Legends/i;
  const matches: Match[] = [];

  const trPattern = /<tr[\s\S]*?<\/tr>/g;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trPattern.exec(html)) !== null) {
    const cells: string[] = [];
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdPattern.exec(trMatch[0])) !== null) {
      cells.push(cellText(tdMatch[1]));
    }

    if (cells.length < 6) continue;

    // Cell 0 must be a bare match number
    if (!/^\d+$/.test(cells[0].trim())) continue;

    const kickoffIso = parseCentralToISO(cells[1]);
    if (!kickoffIso) continue;

    const homeTeam = cells[2];
    const scoreStr = cells[3].trim();
    const awayTeam = cells[4];
    const locationRaw = cells[5];

    const isHome = LEGENDS_RE.test(homeTeam);
    const isAway = LEGENDS_RE.test(awayTeam);
    if (!isHome && !isAway) continue;

    const homeAway = isHome ? ("home" as const) : ("away" as const);
    const opponentRaw = isHome ? awayTeam : homeTeam;

    // Default arrival = kickoff − 30 min (SportsYou may override below)
    const kickoffMs = new Date(kickoffIso).getTime();
    const arrivalIso = new Date(kickoffMs - 30 * 60 * 1000).toISOString();

    let goalsFor: number | null = null;
    let goalsAgainst: number | null = null;
    let result: "W" | "L" | "D" | null = null;

    const scoreParsed = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
    if (scoreParsed) {
      const a = parseInt(scoreParsed[1]);
      const b = parseInt(scoreParsed[2]);
      goalsFor = isHome ? a : b;
      goalsAgainst = isHome ? b : a;
      result = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
    }

    const location = gotsportLocationName(locationRaw);

    matches.push({
      id: `gs-${team}-${cells[0].trim()}`,
      date: kickoffIso,
      arrivalDate: arrivalIso,
      opponent: canonicalOpponent(opponentRaw),
      location,
      locationAddress: LOCATION_ADDRESSES[location],
      homeAway,
      goalsFor,
      goalsAgainst,
      result,
    });
  }

  return matches.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Fallback static data ---

const U11_STANDINGS: StandingRow[] = [
  { rank: 1, team: "JYSA North Legends FC",        gp: 7, w: 6, l: 1, t: 0, gf: 19, ga: 8,  pts: 18, isNorthLegends: true  },
  { rank: 2, team: "Elgin United (Ramirez)",       gp: 7, w: 5, l: 1, t: 1, gf: 20, ga: 10, pts: 16, isNorthLegends: false },
  { rank: 3, team: "T&C Soccer Inter Milan",       gp: 4, w: 2, l: 1, t: 1, gf: 11, ga: 8,  pts: 7,  isNorthLegends: false },
  { rank: 4, team: "WBSA United",                  gp: 5, w: 2, l: 3, t: 0, gf: 9,  ga: 12, pts: 6,  isNorthLegends: false },
  { rank: 5, team: "Elgin United (Hernandez)",     gp: 4, w: 0, l: 4, t: 0, gf: 1,  ga: 12, pts: 0,  isNorthLegends: false },
  { rank: 6, team: "Storm 16B Black",              gp: 5, w: 0, l: 5, t: 0, gf: 5,  ga: 15, pts: 0,  isNorthLegends: false },
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

// Fallback results keyed by SportsYou UID — used only when GotSport scraping fails
const U11_RESULTS: Record<string, { goalsFor: number; goalsAgainst: number; result: "W" | "L" | "D" }> = {
  "3bd5311d": { goalsFor: 1,  goalsAgainst: 2, result: "L" }, // Sep 12 vs Elgin United (Ramirez)
  "9183d02e": { goalsFor: 15, goalsAgainst: 0, result: "W" }, // Sep 19 vs Elgin United (Hernandez)
  "e11c25d1": { goalsFor: 7,  goalsAgainst: 0, result: "W" }, // Sep 26 vs Storm 16B Black
  "bc0eae72": { goalsFor: 4,  goalsAgainst: 2, result: "W" }, // Sep 27 vs T&C Soccer Inter Milan
  "3ed13cc0": { goalsFor: 4,  goalsAgainst: 3, result: "W" }, // Oct 10 vs Elgin United (Ramirez)
  "6e6fb4f1": { goalsFor: 10, goalsAgainst: 1, result: "W" }, // Oct 17 vs Storm 16B Black
  "3c773b63": { goalsFor: 8,  goalsAgainst: 0, result: "W" }, // Oct 18 vs Elgin United (Hernandez)
};

// SportsYou has Ramirez/Hernandez swapped for the first two games — override with GotSport-verified names.
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
};

let u12Id = 0;

const U12_MATCHES: Match[] = [
  { id: `gs-u12-${++u12Id}`, date: "2026-09-12T11:30:00-05:00", opponent: "Leander FC Rattlers",   location: "WCRP South",           homeAway: "home", goalsFor: 7,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-19T10:00:00-05:00", opponent: "Elgin United (Castro)", location: "WCRP North",           homeAway: "home", goalsFor: 13, goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-26T08:30:00-05:00", opponent: "FC Westlake Hooligans", location: "Riverwalk #3",         homeAway: "away", goalsFor: 5,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-10T10:00:00-05:00", opponent: "Liberty United",        location: "WCRP South",           homeAway: "home", goalsFor: 15, goalsAgainst: 0,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-17T15:00:00-05:00", opponent: "LC United",             location: "Shenandoah Field 2",   homeAway: "away", goalsFor: 4,  goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-24T09:30:00-05:00", opponent: "Leander FC Rattlers",   location: "Serna Athletic Fields",homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-25T10:00:00-05:00", opponent: "BYSO Inferno",          location: "WCRP South",           homeAway: "home", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-11-08T10:30:00-06:00", opponent: "BYSO Inferno",          location: "Bastrop Youth Soccer", homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
];

export const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  "WCRP":                     { lat: 30.5407, lng: -97.8742 },
  "WCRP North":               { lat: 30.5407, lng: -97.8742 },
  "WCRP South":               { lat: 30.5407, lng: -97.8742 },
  "Shenandoah Field 2":       { lat: 30.3490, lng: -97.3690 },
  "Crossroads Park":          { lat: 31.0982, lng: -97.3428 },
  "Heritage Park":            { lat: 31.0956, lng: -97.4665 },
  "Town & Country Field 23W": { lat: 30.4414, lng: -97.7553 },
  "Wells Branch Soccer":      { lat: 30.4380, lng: -97.6760 },
  "Serna Athletic Fields":    { lat: 30.5775, lng: -97.8530 },
  "Bastrop Youth Soccer":     { lat: 30.1119, lng: -97.3160 },
  "Riverwalk #3":             { lat: 30.5440, lng: -97.5490 },
  "Jarrell Elementary School":{ lat: 30.8195, lng: -97.6040 },
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
  const fallbackStandings = team === "u12" ? U12_STANDINGS : U11_STANDINGS;
  const url = GOTSPORT_SCHEDULE_URLS[team];

  // Fetch GotSport page and SportsYou calendar in parallel (single GotSport request covers both standings + schedule)
  const [html, sportsyouGames] = await Promise.all([
    url
      ? fetch(url, { cache: "no-store" })
          .then((r) => (r.ok ? r.text() : ""))
          .catch(() => "")
      : Promise.resolve(""),
    fetchSportsYouGames(team),
  ]);

  const liveStandings = html ? parseStandings(html) : [];
  const gotsportMatches = html ? parseSchedule(html, team) : [];

  let matches: Match[];

  if (gotsportMatches.length > 0) {
    // GotSport is the source of truth. Enrich with SportsYou arrival times where available.
    matches = gotsportMatches.map((m) => {
      const kickoffMs = new Date(m.date).getTime();
      const sy = sportsyouGames.find(
        (g) => Math.abs(new Date(g.iso).getTime() - kickoffMs) < 2 * 60 * 60 * 1000,
      );
      return sy ? { ...m, arrivalDate: sy.arrivalIso } : m;
    });
  } else if (sportsyouGames.length > 0) {
    // GotSport scraping failed — fall back to SportsYou
    const resultsMap = team === "u11" ? U11_RESULTS : U12_RESULTS;
    const overrides = team === "u11" ? U11_OPPONENT_OVERRIDES : ({} as Record<string, string>);
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
    // Both failed — last resort hardcoded list (u12 only)
    matches = team === "u12" ? withAddress(U12_MATCHES) : [];
  }

  const standings = liveStandings.length > 0 ? liveStandings : fallbackStandings;
  return { standings, matches };
}
