import type { TeamSlug } from "@/lib/sanity/queries";
import type { Match } from "@/lib/types";

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
  { rank: 1, team: "Elgin United (Ramirez)",     gp: 6, w: 4, l: 1, t: 1, gf: 17, ga: 9,  pts: 13, isNorthLegends: false },
  { rank: 2, team: "JYSA North Legends FC",       gp: 5, w: 4, l: 1, t: 0, gf: 13, ga: 7,  pts: 12, isNorthLegends: true  },
  { rank: 3, team: "T&C Soccer Inter Milan",      gp: 4, w: 2, l: 1, t: 1, gf: 11, ga: 8,  pts: 7,  isNorthLegends: false },
  { rank: 4, team: "Storm Black",                 gp: 4, w: 1, l: 3, t: 0, gf: 3,  ga: 9,  pts: 3,  isNorthLegends: false },
  { rank: 5, team: "WBSA United",                 gp: 4, w: 1, l: 3, t: 0, gf: 5,  ga: 8,  pts: 3,  isNorthLegends: false },
  { rank: 6, team: "Elgin United (Hernandez)",    gp: 3, w: 0, l: 3, t: 0, gf: 1,  ga: 9,  pts: 0,  isNorthLegends: false },
];

const U12_STANDINGS: StandingRow[] = [
  { rank: 1, team: "JYSA North Legends FC",       gp: 4, w: 4, l: 0, t: 0, gf: 12, ga: 5,  pts: 12, isNorthLegends: true  },
  { rank: 2, team: "FC Westlake North Hooligans", gp: 5, w: 4, l: 1, t: 0, gf: 14, ga: 11, pts: 12, isNorthLegends: false },
  { rank: 3, team: "Elgin United (Castro)",       gp: 5, w: 2, l: 2, t: 1, gf: 8,  ga: 9,  pts: 7,  isNorthLegends: false },
  { rank: 4, team: "BYSO Inferno",                gp: 3, w: 2, l: 1, t: 0, gf: 9,  ga: 6,  pts: 6,  isNorthLegends: false },
  { rank: 5, team: "LC United",                   gp: 3, w: 1, l: 2, t: 0, gf: 6,  ga: 9,  pts: 3,  isNorthLegends: false },
  { rank: 6, team: "Leander FC Rattlers",         gp: 4, w: 0, l: 3, t: 1, gf: 8,  ga: 10, pts: 1,  isNorthLegends: false },
  { rank: 7, team: "Liberty United",              gp: 4, w: 0, l: 4, t: 0, gf: 5,  ga: 12, pts: 0,  isNorthLegends: false },
];

let u11Id = 0;
let u12Id = 0;

const U11_MATCHES: Match[] = [
  { id: `gs-u11-${++u11Id}`, date: "2026-09-12T15:00:00-05:00", opponent: "Elgin United (Ramirez)", location: "Shenandoah Field 2",       homeAway: "away", goalsFor: 1,  goalsAgainst: 2, result: "L" },
  { id: `gs-u11-${++u11Id}`, date: "2026-09-19T11:30:00-05:00", opponent: "Elgin United (Hernandez)", location: "WCRP North",             homeAway: "home", goalsFor: 15, goalsAgainst: 0, result: "W" },
  { id: `gs-u11-${++u11Id}`, date: "2026-09-26T13:00:00-05:00", opponent: "Storm Black",              location: "Crossroads Park",         homeAway: "away", goalsFor: 7,  goalsAgainst: 0, result: "W" },
  { id: `gs-u11-${++u11Id}`, date: "2026-09-27T11:30:00-05:00", opponent: "T&C Soccer Inter Milan",   location: "Town & Country Field 23W",homeAway: "away", goalsFor: 4,  goalsAgainst: 2, result: "W" },
  { id: `gs-u11-${++u11Id}`, date: "2026-10-10T08:30:00-05:00", opponent: "Elgin United (Ramirez)", location: "WCRP South",               homeAway: "home", goalsFor: 4,  goalsAgainst: 3, result: "W" },
  { id: `gs-u11-${++u11Id}`, date: "2026-10-17T11:30:00-05:00", opponent: "Storm Black",              location: "WCRP North",              homeAway: "home", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u11-${++u11Id}`, date: "2026-10-18T11:00:00-05:00", opponent: "Elgin United (Hernandez)", location: "Shenandoah Field 2",     homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u11-${++u11Id}`, date: "2026-10-24T11:30:00-05:00", opponent: "T&C Soccer Inter Milan",   location: "WCRP South",             homeAway: "home", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u11-${++u11Id}`, date: "2026-10-31T11:00:00-05:00", opponent: "WBSA United",              location: "Wells Branch Soccer",     homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
];

const U12_MATCHES: Match[] = [
  { id: `gs-u12-${++u12Id}`, date: "2026-09-12T11:30:00-05:00", opponent: "Leander FC Rattlers",      location: "WCRP South",              homeAway: "home", goalsFor: 7,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-19T10:00:00-05:00", opponent: "Elgin United (Castro)",    location: "WCRP North",              homeAway: "home", goalsFor: 13, goalsAgainst: 1,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-09-26T08:30:00-05:00", opponent: "FC Westlake Hooligans",    location: "Riverwalk #3",            homeAway: "away", goalsFor: 5,  goalsAgainst: 2,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-10T10:00:00-05:00", opponent: "Liberty United",           location: "WCRP South",              homeAway: "home", goalsFor: 15, goalsAgainst: 0,  result: "W" },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-17T15:00:00-05:00", opponent: "LC United",                location: "Shenandoah Field 2",      homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-24T09:30:00-05:00", opponent: "Leander FC Rattlers",      location: "Serna Athletic Fields",   homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-10-25T10:00:00-05:00", opponent: "BYSO Inferno",             location: "WCRP South",              homeAway: "home", goalsFor: null, goalsAgainst: null, result: null },
  { id: `gs-u12-${++u12Id}`, date: "2026-11-08T10:30:00-06:00", opponent: "BYSO Inferno",             location: "Bastrop Youth Soccer",    homeAway: "away", goalsFor: null, goalsAgainst: null, result: null },
];

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
    locationAddress: LOCATION_ADDRESSES[m.location],
  }));
}

export function getGotSportData(team: TeamSlug): GotSportData {
  return team === "u12"
    ? { standings: U12_STANDINGS, matches: withAddress(U12_MATCHES) }
    : { standings: U11_STANDINGS, matches: withAddress(U11_MATCHES) };
}
