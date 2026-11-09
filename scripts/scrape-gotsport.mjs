#!/usr/bin/env node
/**
 * Fetches the GotSport group results pages for U11 and U12, parses standings
 * and the round-robin score matrix, then writes lib/data/gotsport-cache.json.
 *
 * Run: node scripts/scrape-gotsport.mjs
 * Requires: Node 18+ (uses built-in fetch)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const URLS = {
  u11: "https://system.gotsport.com/org_event/events/55587/results?group=510042",
  u12: "https://system.gotsport.com/org_event/events/55587/results?group=510048",
};

const CHAMPIONSHIP_URLS = {
  u11: "https://system.gotsport.com/org_event/events/59502/schedules?group=546263",
  u12: "https://system.gotsport.com/org_event/events/59502/schedules?group=546267",
};

// Maps GotSport's raw team names to the canonical names used throughout the app
const OPPONENT_MAP = {
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

function cellText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalOpponent(raw) {
  const t = raw.trim();
  if (OPPONENT_MAP[t]) return OPPONENT_MAP[t];
  for (const [key, val] of Object.entries(OPPONENT_MAP)) {
    if (t.includes(key) || key.includes(t)) return val;
  }
  return t;
}

function parseStandings(html) {
  // Try multiple section headers — championship pages may use "Group A", "Pool A", etc.
  const SECTION_HEADERS = ["Bracket A", "Group A", "Pool A", "Bracket B", "Group B", "Bracket 1", "Group 1", "Standings"];
  let start = -1;
  for (const h of SECTION_HEADERS) {
    const idx = html.indexOf(h);
    if (idx !== -1) { start = idx; break; }
  }
  if (start === -1) return [];

  const END_MARKERS = ["tiebreaker", "Tiebreaker", "Schedule", "Game Schedule", "Upcoming Games"];
  let endIdx = -1;
  for (const marker of END_MARKERS) {
    const idx = html.indexOf(marker, start);
    if (idx !== -1) { endIdx = idx; break; }
  }
  const section = html.slice(start, endIdx > start ? endIdx : start + 15000);

  const rows = [];
  const trPattern = /<tr[\s\S]*?<\/tr>/g;
  let trMatch;

  while ((trMatch = trPattern.exec(section)) !== null) {
    const cells = [];
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch;
    while ((tdMatch = tdPattern.exec(trMatch[0])) !== null) {
      cells.push(cellText(tdMatch[1]));
    }

    if (cells.length < 10) continue;
    const firstNum = parseInt(cells[0], 10);
    if (isNaN(firstNum) || firstNum < 1 || firstNum > 30) continue;
    const teamName = cells[1];
    if (!teamName || /^\d+$/.test(teamName)) continue;

    const o = 2;
    const gp  = parseInt(cells[o],     10);
    const w   = parseInt(cells[o + 1], 10);
    const l   = parseInt(cells[o + 2], 10);
    const t   = parseInt(cells[o + 3], 10);
    const gf  = parseInt(cells[o + 4], 10);
    const ga  = parseInt(cells[o + 5], 10);
    const pts = parseInt(cells[o + 7], 10);

    if ([gp, w, l, t, gf, ga, pts].some(isNaN)) continue;

    const canonical = canonicalOpponent(teamName);
    rows.push({
      rank: firstNum,
      team: canonical,
      gp, w, l, t, gf, ga, pts,
      isNorthLegends: teamName.includes("North Legends") || teamName.includes("Legends"),
    });
  }

  return rows;
}

function parseResultsMatrix(html) {
  const trPattern = /<tr[\s\S]*?<\/tr>/g;
  let trMatch;
  const matrixRows = [];

  while ((trMatch = trPattern.exec(html)) !== null) {
    const cells = [];
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch;
    while ((tdMatch = tdPattern.exec(trMatch[0])) !== null) {
      cells.push(cellText(tdMatch[1]));
    }

    if (cells.length < 4) continue;
    const first = cells[0].trim();
    if (!first || /^\d+$/.test(first) || first.length < 3) continue;

    const hasScore = cells.slice(1).some((c) => /\d+-\d+/.test(c) || c === "- -");
    if (!hasScore) continue;

    matrixRows.push({ teamName: first, cells });
  }

  const legendsIdx = matrixRows.findIndex((r) => /North Legends/i.test(r.teamName));
  if (legendsIdx === -1) {
    console.warn("  WARNING: could not find JYSA North Legends row in matrix");
    return [];
  }

  const legendsRow = matrixRows[legendsIdx];
  const scores = [];

  for (let i = 0; i < matrixRows.length; i++) {
    if (i === legendsIdx) continue;
    const opponent = canonicalOpponent(matrixRows[i].teamName);
    const cell = legendsRow.cells[i + 1] ?? "";

    for (const part of cell.split(/\s+/)) {
      if (part === "-" || part === "") continue;
      const m = part.match(/^(\d+)-(\d+)$/);
      if (!m) continue;
      const gf = parseInt(m[1], 10);
      const ga = parseInt(m[2], 10);
      scores.push({
        opponent,
        goalsFor: gf,
        goalsAgainst: ga,
        result: gf > ga ? "W" : gf < ga ? "L" : "D",
      });
    }
  }

  return scores;
}

async function scrapeTeam(team, url) {
  console.log(`Fetching ${team}: ${url}`);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const standings = parseStandings(html);
  const matrixScores = parseResultsMatrix(html);

  console.log(`  standings: ${standings.length} rows`);
  console.log(`  matrixScores: ${matrixScores.length} games`);
  for (const s of matrixScores) {
    console.log(`    ${s.goalsFor}-${s.goalsAgainst} ${s.result}  vs ${s.opponent}`);
  }

  return { standings, matrixScores };
}

async function scrapeChampionship(team, url) {
  console.log(`Fetching championship ${team}: ${url}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.warn(`  WARNING: HTTP ${res.status} for ${url}`);
      return { standings: [] };
    }
    const html = await res.text();
    const standings = parseStandings(html);
    console.log(`  championship standings: ${standings.length} rows`);
    return { standings };
  } catch (err) {
    console.warn(`  WARNING: failed to fetch championship ${team}: ${err.message}`);
    return { standings: [] };
  }
}

const outPath = join(__dirname, "../lib/data/gotsport-cache.json");

// Read existing cache to compare — only write if scores actually changed
const existing = existsSync(outPath)
  ? JSON.parse(readFileSync(outPath, "utf8"))
  : {};

const result = {};
let changed = false;

for (const [team, url] of Object.entries(URLS)) {
  const fresh = await scrapeTeam(team, url);
  result[team] = fresh;

  const oldScores = JSON.stringify(existing[team]?.matrixScores ?? []);
  const newScores = JSON.stringify(fresh.matrixScores);
  const oldStandings = JSON.stringify(existing[team]?.standings ?? []);
  const newStandings = JSON.stringify(fresh.standings);

  if (oldScores !== newScores || oldStandings !== newStandings) {
    changed = true;
    console.log(`  -> ${team} changed`);
  } else {
    console.log(`  -> ${team} unchanged`);
  }
}

// Scrape championship group stage standings
console.log("\n--- Championship group stage ---");
const championship = {};
for (const [team, url] of Object.entries(CHAMPIONSHIP_URLS)) {
  const fresh = await scrapeChampionship(team, url);
  championship[team] = fresh;

  const oldChamp = JSON.stringify(existing.championship?.[team]?.standings ?? []);
  const newChamp = JSON.stringify(fresh.standings);
  if (oldChamp !== newChamp) {
    changed = true;
    console.log(`  -> championship ${team} changed`);
  } else {
    console.log(`  -> championship ${team} unchanged`);
  }
}
result.championship = championship;

if (!changed) {
  console.log("\nNo score or standings changes — skipping file write.");
  process.exit(0);
}

result.updatedAt = new Date().toISOString();
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(`\nWrote ${outPath}`);
