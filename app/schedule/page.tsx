import type { Metadata } from "next";
import TeamTabs from "@/components/TeamTabs";
import { getMatchesByTeam } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export const metadata: Metadata = { title: "Schedule" };

const RESULT_STYLES: Record<string, string> = {
  W: "bg-green-100 text-green-800 border border-green-200",
  L: "bg-red-100 text-red-800 border border-red-200",
  D: "bg-yellow-100 text-yellow-800 border border-yellow-200",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const matches = await getMatchesByTeam(team);
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
        <h1 className="text-3xl font-black text-gray-900">Schedule & Results</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          Upcoming Fixtures
        </h2>

        <div className="flex flex-col gap-3 md:hidden">
          {upcoming.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {m.homeAway === "home" ? "Home" : "Away"}
                </span>
                <span className="text-xs text-gray-400">{formatTime(m.date)}</span>
              </div>
              <p className="font-bold text-gray-800 text-base">vs {m.opponent}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.date)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.location}</p>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-gray-400 text-sm">No upcoming fixtures.</p>}
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Opponent</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-center">H/A</th>
                <th className="px-4 py-3 text-right">Kick-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {upcoming.map((m) => (
                <tr key={m.id} className="hover:bg-green-50/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDate(m.date)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">vs {m.opponent}</td>
                  <td className="px-4 py-3 text-gray-500">{m.location}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {m.homeAway === "home" ? "Home" : "Away"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatTime(m.date)}</td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No upcoming fixtures.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Results */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          Results
        </h2>

        <div className="flex flex-col gap-3 md:hidden">
          {played.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                  {m.homeAway === "home" ? "Home" : "Away"}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLES[m.result!]}`}>
                  {m.result}
                </span>
              </div>
              <p className="font-bold text-gray-800 text-base">vs {m.opponent}</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">
                {m.goalsFor} – {m.goalsAgainst}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.date)}</p>
            </div>
          ))}
          {played.length === 0 && <p className="text-gray-400 text-sm">No results yet.</p>}
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Opponent</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-center">H/A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {played.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{formatDate(m.date)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">vs {m.opponent}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">
                    {m.goalsFor} – {m.goalsAgainst}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${RESULT_STYLES[m.result!]}`}>
                      {m.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs capitalize">
                    {m.homeAway}
                  </td>
                </tr>
              ))}
              {played.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No results yet.
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
