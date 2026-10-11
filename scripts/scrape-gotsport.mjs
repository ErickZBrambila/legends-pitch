/**
 * Scrapes GotSport U11 + U12 standings and North Legends match schedule,
 * then regenerates lib/data/gotsport.ts in place.
 *
 * Run manually:   node scripts/scrape-gotsport.mjs
 * Run in CI:      same command, after `npx playwright install chromium`
 */

import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT  = join(ROOT, "lib/data/gotsport.ts");

const URLS = {
  u11: {
    results:  "https://system.gotsport.com/org_event/events/55587/results?group=510042",
    schedule: "https://system.gotsport.com/org_event/events/55587/schedules?date=All&group=510042",
  },
  u12: {
    results:  "https://system.gotsport.com/org_event/events/55587/results?group=510048",
    schedule: "https://system.gotsport.com/org_event/events/55587/schedules?date=All&group=510048",
  },
};

const NL_NAME = "JYSA North Legends FC";

// ── helpers ─────────────────────────────────────────────────────────────────

function shortTeam(name) {
  return name
    .replace("JYSA North Legends FC - Castellanos", "JYSA North Legends FC")
    .replace("JYSA North Legends FC - Rosado",      "JYSA North Legends FC")
    .replace("Elgin United- Ramirez 2016 B",        "Elgin United (Ramirez)")
    .replace("Elgin United-Ramirez 2016 B",         "Elgin United (Ramirez)")
    .replace("Elgin United-Hernandez 2016 B",       "Elgin United (Hernandez)")
    .replace("Elgin United-Castro 2015 B",          "Elgin United (Castro)")
    .replace("T&C Soccer BU11 Inter Milan",         "T&C Soccer Inter Milan")
    .replace("Storm 16B Black",                     "Storm Black")
    .replace("WBSA UNITED PHINOMENON",              "WBSA United")
    .replace("FC Westlake North Hooligans BU12",    "FC Westlake Hooligans")
    .replace("BYSO 14-15 Inferno",                  "BYSO Inferno")
    .replace("LC United 14B",                       "LC United")
    .replace(/Leander FC.*Gray/,                    "Leander FC Rattlers")
    .replace("Liberty United 14/15B Black",         "Liberty United")
    .trim();
}

// Parse "Sep 12, 2026\n 3:00PM CDT CDT" → ISO string
function parseDateTime(raw) {
  const cleaned = raw.replace(/\n\n.*$/s, "").replace(/CDT CDT|CST CST/g, "").trim();
  // e.g. "Sep 12, 2026  3:00PM CDT"  or "Sep 12, 2026 3:00PM CDT"
  const match = cleaned.match(/(\w+ \d+,\s*\d{4})\s+(\d+:\d{2}[AP]M)\s*(CDT|CST)?/);
  if (!match) return null;
  const [, datePart, timePart, tz] = match;
  const offset = tz === "CST" ? "-06:00" : "-05:00";
  const d = new Date(`${datePart} ${timePart}`);
  if (isNaN(d)) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${offset}`;
}

function shortLocation(loc) {
  return loc
    .replace("Shenandoah Soccer Park - Field 2 ( U11 - U12 )", "Shenandoah Field 2")
    .replace("WCRP - WCRP 2 North", "WCRP North")
    .replace("WCRP - WCRP 2 South", "WCRP South")
    .replace("Crossroads Park - den Harder Field 61", "Crossroads Park")
    .replace("Town & Country - Field 23W", "Town & Country Field 23W")
    .replace("Riverwalk - Riverwalk #3", "Riverwalk #3")
    .replace("Serna Athletic Fields - Field M1", "Serna Athletic Fields")
    .replace("Wells Branch Soccer Association - WBSC 2", "Wells Branch Soccer")
    .replace("Bastrop Youth Soccer Fields - Field #8 (12U)", "Bastrop Youth Soccer")
    .replace("LHYSA - FIELD 1", "LHYSA Field 1")
    .trim();
}

// ── scrape ──────────────────────────────────────────────────────────────────

async function scrapePage(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  return page.evaluate(() =>
    [...document.querySelectorAll("table tbody tr")].map((r) =>
      [...r.querySelectorAll("td")].map((td) => td.textContent.trim())
    )
  );
}

async function scrapeTeam(page, team) {
  // --- standings ---
  const standingRows = await scrapePage(page, URLS[team].results);
  const standings = standingRows
    .filter((c) => c.length >= 8 && /^\d+$/.test(c[0]))
    .map((c) => ({
      rank: parseInt(c[0]),
      team: shortTeam(c[1]),
      gp:   parseInt(c[2]) || 0,
      w:    parseInt(c[3]) || 0,
      l:    parseInt(c[4]) || 0,
      t:    parseInt(c[5]) || 0,
      gf:   parseInt(c[6]) || 0,
      ga:   parseInt(c[7]) || 0,
      pts:  parseInt(c[c.length - 1]) || 0,
      isNorthLegends: c[1].includes(NL_NAME),
    }));

  // --- schedule (NL matches only) ---
  const scheduleRows = await scrapePage(page, URLS[team].schedule);
  const matches = [];
  let idCounter = 0;

  for (const c of scheduleRows) {
    if (c.length < 5) continue;
    // schedule rows: [id, dateTime, home, score, away, location, ...]
    const [, dateRaw, homeTeam, scoreRaw, awayTeam, locationRaw] = c;
    const isNLHome = homeTeam.includes(NL_NAME);
    const isNLAway = awayTeam.includes(NL_NAME);
    if (!isNLHome && !isNLAway) continue;

    const date = parseDateTime(dateRaw);
    if (!date) continue;

    const opponent = shortTeam(isNLHome ? awayTeam : homeTeam);
    const location = shortLocation(locationRaw ?? "");
    const homeAway = isNLHome ? "home" : "away";

    // parse score "7 - 2" or "-"
    const scoreMatch = scoreRaw?.match(/(\d+)\s*-\s*(\d+)/);
    let goalsFor = null, goalsAgainst = null, result = null;
    if (scoreMatch) {
      const [, a, b] = scoreMatch.map(Number);
      goalsFor     = isNLHome ? a : b;
      goalsAgainst = isNLHome ? b : a;
      result = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
    }

    matches.push({
      id: `gs-${team}-${++idCounter}`,
      date,
      opponent,
      location,
      homeAway,
      goalsFor,
      goalsAgainst,
      result,
    });
  }

  return { standings, matches };
}

// ── codegen ─────────────────────────────────────────────────────────────────

function renderStandings(rows) {
  const lines = rows.map((r) => {
    const team    = JSON.stringify(r.team).padEnd(40);
    const isNL    = r.isNorthLegends;
    return `  { rank: ${String(r.rank).padEnd(2)}, team: ${team}, gp: ${String(r.gp).padEnd(2)}, w: ${String(r.w).padEnd(2)}, l: ${String(r.l).padEnd(2)}, t: ${String(r.t).padEnd(2)}, gf: ${String(r.gf).padEnd(3)}, ga: ${String(r.ga).padEnd(3)}, pts: ${String(r.pts).padEnd(3)}, isNorthLegends: ${isNL} },`;
  });
  return lines.join("\n");
}

function renderMatches(matches, team) {
  const lines = matches.map((m) => {
    const opp  = JSON.stringify(m.opponent).padEnd(38);
    const loc  = JSON.stringify(m.location).padEnd(34);
    const ha   = `"${m.homeAway}"`;
    const gf   = m.goalsFor  === null ? "null" : String(m.goalsFor);
    const ga   = m.goalsAgainst === null ? "null" : String(m.goalsAgainst);
    const res  = m.result === null ? "null" : `"${m.result}"`;
    return `  { id: "${m.id}", date: "${m.date}", opponent: ${opp}, location: ${loc}, homeAway: ${ha}, goalsFor: ${gf}, goalsAgainst: ${ga}, result: ${res} },`;
  });
  return lines.join("\n");
}

// ── main ────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const page    = await browser.newPage();

console.log("Scraping U11…");
const u11 = await scrapeTeam(page, "u11");
console.log(`  ${u11.standings.length} standings rows, ${u11.matches.length} NL matches`);

console.log("Scraping U12…");
const u12 = await scrapeTeam(page, "u12");
console.log(`  ${u12.standings.length} standings rows, ${u12.matches.length} NL matches`);

await browser.close();

const ts = `import type { TeamSlug } from "@/lib/sanity/queries";
import type { Match } from "@/lib/types";

// AUTO-GENERATED by scripts/scrape-gotsport.mjs — do not edit by hand.
// Last updated: ${new Date().toISOString()}

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

const U11_STANDINGS: StandingRow[] = [
${renderStandings(u11.standings)}
];

const U12_STANDINGS: StandingRow[] = [
${renderStandings(u12.standings)}
];

const U11_MATCHES: Match[] = [
${renderMatches(u11.matches, "u11")}
];

const U12_MATCHES: Match[] = [
${renderMatches(u12.matches, "u12")}
];

export function getGotSportData(team: TeamSlug): GotSportData {
  return team === "u12"
    ? { standings: U12_STANDINGS, matches: U12_MATCHES }
    : { standings: U11_STANDINGS, matches: U11_MATCHES };
}
`;

writeFileSync(OUT, ts);
console.log(`✓ Written to ${OUT}`);
