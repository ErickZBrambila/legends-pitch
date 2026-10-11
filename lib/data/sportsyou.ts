const SPORTSYOU_URLS: Partial<Record<string, string>> = {
  u11: "https://calendar.sportsyou.com/access/us-c7ad2fa6-0942-4ade-a1e8-04b62f6d5c00/372731d1-045d-40b6-801e-960b35deccc6",
};

// Last 8 chars of SportsYou UID → clean opponent name for this season.
// Add new entries here when new opponents appear on the calendar.
const OPPONENT_NAMES: Record<string, string> = {
  "730d67bb": "Centex Storm",
  "4112c752": "Centex SC",
  "d203df12": "T&C Soccer Inter Milan",
  "1ffdb209": "Coyotes FC",
  "3bd5311d": "Elgin United (Hernandez)",
  "9183d02e": "Elgin United (Ramirez)",
  "e11c25d1": "Storm 16B Black",
  "bc0eae72": "T&C Soccer Inter Milan",
  "595db5cc": "WBSA United",
  "3ed13cc0": "Elgin United (Ramirez)",
  "6e6fb4f1": "Storm 16B Black",
  "3c773b63": "Elgin United (Hernandez)",
  "62f317dc": "T&C Soccer Inter Milan",
  "5cd7f150": "WBSA United",
};

function parseIcal(text: string): Record<string, string>[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const events: Record<string, string>[] = [];
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const end = block.indexOf("END:VEVENT");
    if (end === -1) continue;
    const props: Record<string, string> = {};
    for (const line of block.slice(0, end).split(/\r?\n/)) {
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      props[line.slice(0, colon).split(";")[0]] = line
        .slice(colon + 1)
        .replace(/\\,/g, ",")
        .replace(/\\n/g, "\n")
        .replace(/\\;/g, ";");
    }
    events.push(props);
  }
  return events;
}

function shortUid(uid: string): string {
  return uid.replace("@calendar.sportsyou.com", "").slice(-8);
}

function fallbackOpponent(summary: string): string {
  return summary
    .replace(/^U\d+.*?SELECT\s+-\s+/i, "")
    .split(".")[0]
    .replace(/\b(FIELD|field)\b.*/i, "")
    .replace(/\bWCRP\b.*/i, "")
    .replace(/\bWBSC\b.*/i, "")
    .replace(/\d+[A-Z]?\s*(NORTH|SOUTH|EAST|WEST)?\s*$/i, "")
    .trim();
}

// Maps a SportsYou LOCATION address string to a short canonical display name
// that also serves as the key into LOCATION_COORDS for weather lookups.
export function locationNameFromAddress(address: string): string {
  if (/Borho Dr/i.test(address)) return "WCRP";
  if (/N Avenue C/i.test(address)) return "Shenandoah Field 2";
  if (/Curtis B Elliot|6600 Research Loop/i.test(address)) return "Crossroads Park";
  if (/1502 Park Ave/i.test(address)) return "Heritage Park";
  if (/Meadowheath/i.test(address)) return "Town & Country Field 23W";
  if (/Shoreline Dr/i.test(address)) return "Wells Branch Soccer";
  if (/Bagdad Rd|Serna/i.test(address)) return "Serna Athletic Fields";
  if (/Bastrop/i.test(address)) return "Bastrop Youth Soccer";
  return address.split(",")[0].trim();
}

export interface SportsYouGame {
  uid: string;
  iso: string;             // kickoff UTC ISO (DTSTART + 30 min)
  locationName: string;    // short display name, also key into LOCATION_COORDS
  locationAddress: string; // full address string for Maps links
  homeAway: "home" | "away";
  opponent: string;
}

export async function fetchSportsYouGames(team: string): Promise<SportsYouGame[]> {
  const url = SPORTSYOU_URLS[team];
  if (!url) return [];
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const text = await res.text();
    const events = parseIcal(text);
    const games: SportsYouGame[] = [];

    for (const ev of events) {
      const summary = ev["SUMMARY"] ?? "";
      if (/practice/i.test(summary)) continue;

      const dtstart = ev["DTSTART"] ?? "";
      if (!dtstart.endsWith("Z") || dtstart.length !== 16) continue;

      // SportsYou stores arrival time. Add 30 min to get kickoff.
      const y = +dtstart.slice(0, 4), mo = +dtstart.slice(4, 6) - 1;
      const d = +dtstart.slice(6, 8), h = +dtstart.slice(9, 11), m = +dtstart.slice(11, 13);
      const kickoff = new Date(Date.UTC(y, mo, d, h, m + 30));

      const uid = shortUid(ev["UID"] ?? "");
      const address = ev["LOCATION"] ?? "";

      games.push({
        uid,
        iso: kickoff.toISOString(),
        locationName: locationNameFromAddress(address),
        locationAddress: address,
        homeAway: /Leander|Borho/i.test(address) ? "home" : "away",
        opponent: OPPONENT_NAMES[uid] ?? fallbackOpponent(summary),
      });
    }

    return games.sort((a, b) => a.iso.localeCompare(b.iso));
  } catch {
    return [];
  }
}
