import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import {
  SESSIONS, SERVICES, KICKREEL_RUNS,
  totalHours, totalCommits, totalFeatures,
  totalClaudeCost, monthlyRunningCost, annualRunningCost,
} from "@/lib/data/tracker";

export const metadata = { title: "Project Tracker · North Legends FC Admin" };

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function TrackerPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const months = Math.round(
    (new Date().getTime() - new Date("2026-07-03").getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const totalClips = KICKREEL_RUNS.reduce((s, r) => s + r.clipsExtracted, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin · Internal</p>
          <h1 className="text-3xl font-black text-gray-900">Project Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            North Legends FC website — hours, cost, and features shipped.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Hours" value={`${totalHours()}h`} sub={`across ${SESSIONS.length} sessions`} />
          <StatCard label="Features Shipped" value={`${totalFeatures()}`} sub={`${totalCommits()} commits`} />
          <StatCard label="Monthly Cost" value={`$${monthlyRunningCost().toFixed(2)}`} sub="infra · mostly free tier" />
          <StatCard label="Annual Cost" value={`$${annualRunningCost().toFixed(0)}`} sub={`${months} months running`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <StatCard
            label="Claude Cost · This Project"
            value={`$${totalClaudeCost().toFixed(0)}`}
            sub="estimated from Anthropic billing · update each session"
          />
          <StatCard
            label="Cost per Feature"
            value={`$${(totalClaudeCost() / totalFeatures()).toFixed(2)}`}
            sub={`$${(totalClaudeCost() / totalHours()).toFixed(2)}/hr · ${totalFeatures()} features`}
          />
        </div>

        {/* Running services */}
        <section className="mb-10">
          <h2 className="text-base font-black text-gray-900 mb-4">Running Services</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Purpose</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Plan</th>
                  <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">$/mo</th>
                  <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">$/yr</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((svc, i) => (
                  <tr key={svc.name} className={i < SERVICES.length - 1 ? "border-b border-gray-50" : ""}>
                    <td className="px-4 py-3 font-bold text-gray-900">{svc.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{svc.purpose}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        svc.monthlyCostUSD === 0
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {svc.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {svc.monthlyCostUSD === 0
                        ? <span className="text-green-600 font-bold">Free</span>
                        : <span className="text-gray-900">${svc.monthlyCostUSD.toFixed(2)}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-500 hidden sm:table-cell">
                      {svc.annualCostUSD === 0 ? "—" : `$${svc.annualCostUSD}`}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-black text-gray-900" colSpan={2}>Total</td>
                  <td className="px-4 py-3 hidden sm:table-cell" />
                  <td className="px-4 py-3 text-right font-black font-mono">
                    ${monthlyRunningCost().toFixed(2)}/mo
                  </td>
                  <td className="px-4 py-3 text-right font-black font-mono hidden sm:table-cell">
                    ${annualRunningCost().toFixed(0)}/yr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* KickReel pipeline runs */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-black text-gray-900">KickReel Pipeline Runs</h2>
            <p className="text-xs text-gray-400">{KICKREEL_RUNS.length} sessions · {totalClips} clips total</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Session</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Team</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Clips</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">R2</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Sanity</th>
                </tr>
              </thead>
              <tbody>
                {[...KICKREEL_RUNS].reverse().map((run, i) => (
                  <tr key={run.date + run.label} className={i < KICKREEL_RUNS.length - 1 ? "border-b border-gray-50" : ""}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {new Date(run.date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {run.label}
                      {run.notes && (
                        <p className="text-xs font-normal text-gray-400 mt-0.5">{run.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {run.team}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{run.type}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{run.clipsExtracted}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {run.uploadedToR2
                        ? <span className="text-green-600 font-black">✓</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {run.publishedToSanity
                        ? <span className="text-green-600 font-black">✓</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Work log */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-4">Work Log</h2>
          <div className="flex flex-col gap-5">
            {[...SESSIONS].reverse().map((session) => (
              <div key={session.date} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      {new Date(session.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short", month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                    <h3 className="text-lg font-black text-gray-900 mt-0.5">{session.title}</h3>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">{session.hours}h</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">{session.commits}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">commits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">${session.claudeCostUSD}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">claude</p>
                    </div>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {session.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-black mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
