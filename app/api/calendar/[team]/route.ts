import { NextRequest } from "next/server";
import { getGotSportData } from "@/lib/data/gotsport";
import type { TeamSlug } from "@/lib/sanity/queries";

function icalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function fold(line: string): string {
  // iCal spec: max 75 octets per line, fold with CRLF + space
  const out: string[] = [];
  while (line.length > 75) {
    out.push(line.slice(0, 75));
    line = " " + line.slice(75);
  }
  out.push(line);
  return out.join("\r\n");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  const { team: raw } = await params;
  const team: TeamSlug = raw === "u12" ? "u12" : "u11";
  const label = team === "u12" ? "U12" : "U11";

  const { matches } = getGotSportData(team);

  const vevents = matches.map((m) => {
    const start = icalDate(m.date);
    const end = icalDate(new Date(new Date(m.date).getTime() + 90 * 60 * 1000).toISOString());
    const homeAway = m.homeAway === "home" ? "🏠 Home" : "✈️ Away";
    const score = m.result ? ` · ${m.goalsFor}–${m.goalsAgainst} (${m.result})` : "";
    const summary = `North Legends FC ${label} vs ${m.opponent}`;
    const fullLocation = m.locationAddress
      ? `${m.location}, ${m.locationAddress}`
      : m.location;
    const description = `${homeAway}${score}\\n${fullLocation}`;

    return [
      "BEGIN:VEVENT",
      fold(`UID:nl-${team}-${m.id}@northlegendsfc`),
      fold(`DTSTAMP:${icalDate(new Date().toISOString())}`),
      fold(`DTSTART:${start}`),
      fold(`DTEND:${end}`),
      fold(`SUMMARY:${esc(summary)}`),
      fold(`LOCATION:${esc(fullLocation)}`),
      fold(`DESCRIPTION:${esc(description)}`),
      "END:VEVENT",
    ].join("\r\n");
  });

  const cal = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//North Legends FC//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:North Legends FC ${label}`),
    "X-WR-CALDESC:North Legends FC match schedule — northlegendsfc",
    "X-WR-TIMEZONE:America/Chicago",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(cal, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="north-legends-${team}.ics"`,
      "Cache-Control": "public, max-age=43200, s-maxage=43200",
    },
  });
}
