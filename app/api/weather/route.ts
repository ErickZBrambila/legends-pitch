import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const iso = searchParams.get("time"); // ISO datetime of game

  if (!lat || !lng || !iso) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const gameTime = new Date(iso);
  const diffDays = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays > 7 || diffDays < -1) {
    return NextResponse.json({ available: false });
  }

  // Open-Meteo free API — no key required
  const date = gameTime.toISOString().slice(0, 10);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&start_date=${date}&end_date=${date}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });

  const data = await res.json();
  const hours: string[] = data.hourly.time;
  const gameHour = gameTime.toISOString().slice(0, 13).replace("T", "T");
  // Find the closest hour to game time (in Chicago time)
  const gameHourLocal = new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Chicago" }).slice(0, 13).replace(" ", "T");
  const idx = hours.findIndex((h) => h >= gameHourLocal);
  const i = idx === -1 ? 0 : idx;

  return NextResponse.json({
    available: true,
    tempF: Math.round(data.hourly.temperature_2m[i]),
    precipPct: data.hourly.precipitation_probability[i],
    windMph: Math.round(data.hourly.windspeed_10m[i]),
    weatherCode: data.hourly.weathercode[i],
  });
}
