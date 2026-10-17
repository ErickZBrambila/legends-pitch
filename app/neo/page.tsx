import { redirect } from "next/navigation";
import { getNeoSession } from "@/lib/neo-auth";
import PushSender from "@/components/PushSender";
import BannerControl from "@/components/BannerControl";
import VotingDashboard from "@/components/VotingDashboard";
import { getBanner } from "@/lib/banner";
import { getAllVotes } from "@/lib/votes";
import {
  SESSIONS, SERVICES, KICKREEL_RUNS, HARDWARE,
  totalHours, totalCommits, totalFeatures,
  totalClaudeCost, totalHardwareCost, monthlyRunningCost, annualRunningCost, tco,
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
  const authed = await getNeoSession();
  if (!authed) redirect("/neo/login");

  const [activeBanner, votes] = await Promise.all([getBanner(), getAllVotes()]);

  const months = Math.round(
    (new Date().getTime() - new Date("2026-07-03").getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const totalClips = KICKREEL_RUNS.reduce((s, r) => s + r.clipsExtracted, 0);
  const t = tco();

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

        {/* Quick nav */}
        <div className="flex gap-3 mb-8">
          <a href="/neo/monitoring" className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:bg-gray-50 transition-colors">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Site</p>
            <p className="text-lg font-black text-gray-900">📊 Monitoring</p>
            <p className="text-xs text-gray-400 mt-0.5">Page views, visitors, push subs</p>
          </a>
        </div>

        <BannerControl active={activeBanner} />

        <PushSender />

        <VotingDashboard initialVotes={votes} />

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

        {/* TCO */}
        <section className="mb-10">
          <h2 className="text-base font-black text-gray-900 mb-4">Total Cost of Ownership</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Build cost vs alternatives */}
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Build Cost — What We Actually Paid vs. Alternatives</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-1">Actual Build Cost</p>
                <p className="text-3xl font-black text-green-700">${t.totalBuildCostUSD.toFixed(0)}</p>
                <p className="text-xs text-green-600 mt-1">
                  Claude ${t.claudeCostUSD.toFixed(0)} + hardware ${t.hardwareCostUSD.toFixed(0)} · {t.devHours}h owner time
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Freelancer Equivalent</p>
                <p className="text-3xl font-black text-gray-700">${t.freelancerEquivalentUSD.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{t.devHours}h × $150/hr market rate</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Agency Quote</p>
                <p className="text-3xl font-black text-gray-700">${t.agencyEquivalentUSD.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Realistic boutique agency estimate</p>
              </div>
            </div>

            {/* Savings callout */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-green-800 text-sm">Saved vs. agency</p>
                <p className="text-2xl font-black text-green-700">${t.savingsVsAgencyUSD.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-black text-green-800 text-sm">Saved vs. freelancer</p>
                <p className="text-2xl font-black text-green-700">${t.savingsVsFreelancerUSD.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-black text-green-800 text-sm">Cost per feature</p>
                <p className="text-2xl font-black text-green-700">${t.costPerFeature.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-black text-green-800 text-sm">Cost per commit</p>
                <p className="text-2xl font-black text-green-700">${t.costPerCommit.toFixed(2)}</p>
              </div>
            </div>

            {/* 3-year TCO */}
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">3-Year Total Cost of Ownership</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Build</p>
                <p className="text-xl font-black text-gray-900">${t.claudeCostUSD.toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">3yr Infra</p>
                <p className="text-xl font-black text-gray-900">${(t.annualRunningCostUSD * 3).toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                <p className="text-xs text-blue-600 font-bold mb-1">3yr TCO</p>
                <p className="text-xl font-black text-blue-700">${t.threeYearTCOUSD.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hardware */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-black text-gray-900">Hardware</h2>
            <p className="text-xs text-gray-400">one-time · ${totalHardwareCost().toFixed(2)} total</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Purpose</th>
                  <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Cost</th>
                </tr>
              </thead>
              <tbody>
                {HARDWARE.map((h, i) => (
                  <tr key={h.name} className={i < HARDWARE.length - 1 ? "border-b border-gray-50" : ""}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{h.purpose}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{h.purpose}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">${h.costUSD.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-black text-gray-900" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right font-black font-mono">${totalHardwareCost().toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

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
            {[...SESSIONS].sort((a, b) => {
              const nA = parseInt(a.title.match(/Session (\d+)/)?.[1] ?? "0");
              const nB = parseInt(b.title.match(/Session (\d+)/)?.[1] ?? "0");
              return nA - nB;
            }).map((session) => (
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
