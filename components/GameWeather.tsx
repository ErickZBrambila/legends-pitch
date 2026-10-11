"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  available: boolean;
  tempF?: number;
  precipPct?: number;
  windMph?: number;
  weatherCode?: number;
}

interface Props {
  lat: number;
  lng: number;
  gameIso: string;
}

// WMO weather code → emoji + label
function weatherIcon(code: number): { emoji: string; label: string } {
  if (code === 0)                    return { emoji: "☀️",  label: "Clear" };
  if (code <= 2)                     return { emoji: "⛅",  label: "Partly cloudy" };
  if (code === 3)                    return { emoji: "☁️",  label: "Overcast" };
  if (code <= 49)                    return { emoji: "🌫️", label: "Fog" };
  if (code <= 57)                    return { emoji: "🌦️", label: "Drizzle" };
  if (code <= 67)                    return { emoji: "🌧️", label: "Rain" };
  if (code <= 77)                    return { emoji: "❄️",  label: "Snow" };
  if (code <= 82)                    return { emoji: "🌧️", label: "Showers" };
  if (code <= 99)                    return { emoji: "⛈️",  label: "Thunderstorm" };
  return { emoji: "🌡️", label: "Unknown" };
}

export default function GameWeather({ lat, lng, gameIso }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch(`/api/weather?lat=${lat}&lng=${lng}&time=${encodeURIComponent(gameIso)}`)
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => setWeather({ available: false }));
  }, [lat, lng, gameIso]);

  if (!weather || !weather.available) return null;

  const { emoji, label } = weatherIcon(weather.weatherCode ?? 0);
  const rain = weather.precipPct ?? 0;
  const rainColor = rain >= 70 ? "text-blue-600" : rain >= 40 ? "text-blue-400" : "text-gray-400";

  return (
    <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5 text-xs mt-1.5">
      <span className="text-base leading-none">{emoji}</span>
      <span className="font-bold text-gray-800">{weather.tempF}°F</span>
      <span className="text-gray-500">{label}</span>
      {rain > 0 && (
        <span className={`font-semibold ${rainColor}`}>💧{rain}%</span>
      )}
      {(weather.windMph ?? 0) >= 10 && (
        <span className="text-gray-400">💨{weather.windMph}mph</span>
      )}
    </div>
  );
}
