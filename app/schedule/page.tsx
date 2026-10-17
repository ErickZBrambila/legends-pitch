import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import CalendarSubscribe from "@/components/CalendarSubscribe";
import GameWeather from "@/components/GameWeather";
import { getGotSportData, LOCATION_COORDS } from "@/lib/data/gotsport";
import type { TeamSlug } from "@/lib/sanity/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Schedule");
  return { title: t("metaTitle") };
}

const RESULT_STYLES: Record<string, string> = {
  W: "bg-green-100 text-green-800 border border-green-200",
  L: "bg-red-100 text-red-800 border border-red-200",
  D: "bg-yellow-100 text-yellow-800 border border-yellow-200",
};

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });

const formatTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

const mapsUrl = (address: string) =>
  `https://maps.google.com/?q=${encodeURIComponent(address)}`;

const withinForecastWindow = (iso: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= -0.5 && diff <= 7;
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const t = await getTranslations("Schedule");
  const locale = await getLocale();

  const { standings, matches } = await getGotSportData(team);

  const formatArrivalTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    });

  const now = new Date();
  const upcoming = matches
    .filter((m) => m.result === null && new Date(m.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const played = matches
    .filter((m) => m.result !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {/* League Standings */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          {t("leagueStandings")}
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-navy)] text-[var(--color-accent)] uppercase text-xs tracking-wider">
              <tr>
                <th className="px-3 py-3 text-left w-8">#</th>
                <th className="px-3 py-3 text-left">Team</th>
                <th className="px-3 py-3 text-center">{t("colGP")}</th>
                <th className="px-3 py-3 text-center">{t("colW")}</th>
                <th className="px-3 py-3 text-center">{t("colL")}</th>
                <th className="px-3 py-3 text-center">{t("colT")}</th>
                <th className="px-3 py-3 text-center hidden sm:table-cell">{t("colGF")}</th>
                <th className="px-3 py-3 text-center hidden sm:table-cell">{t("colGA")}</th>
                <th className="px-3 py-3 text-center font-bold">{t("colPts")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {standings.map((row) => (
                <tr
                  key={row.rank}
                  className={row.isNorthLegends ? "bg-green-50 font-semibold" : "hover:bg-gray-50/60 transition-colors"}
                >
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{row.rank}</td>
                  <td className={`px-3 py-2.5 ${row.isNorthLegends ? "text-green-800 font-bold" : "text-gray-800"}`}>
                    {row.isNorthLegends && <span className="mr-1.5">⚽</span>}
                    {row.team}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{row.gp}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{row.w}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{row.l}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{row.t}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400 hidden sm:table-cell">{row.gf}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400 hidden sm:table-cell">{row.ga}</td>
                  <td className={`px-3 py-2.5 text-center font-bold ${row.isNorthLegends ? "text-green-700" : "text-gray-800"}`}>
                    {row.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          {t("upcomingFixtures")}
        </h2>

        <div className="flex flex-col gap-3 md:hidden">
          {upcoming.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {m.homeAway === "home" ? t("home") : t("away")}
                </span>
                <div className="flex flex-col items-end gap-0.5">
                  {m.arrivalDate && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      {t("beThereAt")} {formatArrivalTime(m.arrivalDate)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
                    {t("kickoffAt")} {formatTime(m.date, locale)}
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-800 text-base">{t("versus", { opponent: m.opponent })}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.date, locale)}</p>
              {m.locationAddress ? (
                <a href={mapsUrl(m.locationAddress)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[var(--color-primary)] hover:underline mt-0.5 inline-flex items-center gap-0.5">
                  📍 {m.location}
                </a>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">{m.location}</p>
              )}
              {withinForecastWindow(m.date) && LOCATION_COORDS[m.location] && (
                <GameWeather
                  lat={LOCATION_COORDS[m.location].lat}
                  lng={LOCATION_COORDS[m.location].lng}
                  gameIso={m.date}
                />
              )}
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-gray-400 text-sm">{t("noUpcoming")}</p>}
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-navy)] text-[var(--color-accent)] uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">{t("colDate")}</th>
                <th className="px-4 py-3 text-left">{t("colOpponent")}</th>
                <th className="px-4 py-3 text-left">{t("colLocation")}</th>
                <th className="px-4 py-3 text-center">{t("colHomeAway")}</th>
                <th className="px-4 py-3 text-right">{t("colKickoff")}</th>
                <th className="px-4 py-3 text-left">{t("colWeather")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {upcoming.map((m) => (
                <tr key={m.id} className="hover:bg-green-50/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDate(m.date, locale)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{t("versus", { opponent: m.opponent })}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.locationAddress ? (
                      <a href={mapsUrl(m.locationAddress)} target="_blank" rel="noopener noreferrer"
                        className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-0.5">
                        📍 {m.location}
                      </a>
                    ) : m.location}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {m.homeAway === "home" ? t("home") : t("away")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {m.arrivalDate && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                          {t("beThereAt")} {formatArrivalTime(m.arrivalDate)}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[var(--color-primary)] whitespace-nowrap">
                        {t("kickoffAt")} {formatTime(m.date, locale)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {withinForecastWindow(m.date) && LOCATION_COORDS[m.location] && (
                      <GameWeather
                        lat={LOCATION_COORDS[m.location].lat}
                        lng={LOCATION_COORDS[m.location].lng}
                        gameIso={m.date}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    {t("noUpcoming")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calendar subscribe */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          {t("addToCalendar")}
        </h2>
        <CalendarSubscribe
          team={team}
          labelSubscribe={t("calSubscribeHint")}
          labelDownload={t("calDownload")}
          labelGoogle={t("calGoogle")}
          labelCopied={t("calCopied")}
          labelCopy={t("calCopy")}
        />
      </section>

      {/* Results */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          {t("results")}
        </h2>

        <div className="flex flex-col gap-3 md:hidden">
          {played.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                  {m.homeAway === "home" ? t("home") : t("away")}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLES[m.result!]}`}>
                  {m.result}
                </span>
              </div>
              <p className="font-bold text-gray-800 text-base">{t("versus", { opponent: m.opponent })}</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">
                {m.goalsFor} – {m.goalsAgainst}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.date, locale)}</p>
            </div>
          ))}
          {played.length === 0 && <p className="text-gray-400 text-sm">{t("noResults")}</p>}
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-navy)] text-[var(--color-accent)] uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">{t("colDate")}</th>
                <th className="px-4 py-3 text-left">{t("colOpponent")}</th>
                <th className="px-4 py-3 text-center">{t("colScore")}</th>
                <th className="px-4 py-3 text-center">{t("colResult")}</th>
                <th className="px-4 py-3 text-center">{t("colHomeAway")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {played.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{formatDate(m.date, locale)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{t("versus", { opponent: m.opponent })}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">
                    {m.goalsFor} – {m.goalsAgainst}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${RESULT_STYLES[m.result!]}`}>
                      {m.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {m.homeAway === "home" ? t("home") : t("away")}
                  </td>
                </tr>
              ))}
              {played.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    {t("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
