"use client";

import { useState } from "react";
import Image from "next/image";
import type { Match, NewsPost } from "@/lib/types";
import type { TeamSlug } from "@/lib/sanity/queries";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminImageUploader from "@/components/AdminImageUploader";

interface Props {
  team: TeamSlug;
  matches: Match[];
  posts: NewsPost[];
}

type Tone = "friendly" | "formal" | "hype";

const TONE_LABELS: Record<Tone, { label: string; desc: string }> = {
  friendly: { label: "Friendly", desc: "Warm & encouraging for families" },
  formal:   { label: "Formal",   desc: "Professional club communication" },
  hype:     { label: "Hype",     desc: "High energy, pump-up the team" },
};

const RESULT_BADGE: Record<string, string> = {
  W: "bg-green-100 text-green-800",
  L: "bg-red-100 text-red-800",
  D: "bg-yellow-100 text-yellow-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

interface DraftPreview {
  id: string;
  matchId: string;
  slug: string;
  title: string;
  title_es: string;
  excerpt: string;
  excerpt_es: string;
  body_en: string;
  body_es: string;
}

export default function ArticlesAdmin({ team, matches, posts: initialPosts }: Props) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts);
  const [generating, setGenerating] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPreview | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone>("friendly");
  const [author, setAuthor] = useState("Coach");
  const [coachNotes, setCoachNotes] = useState("");
  const [coverImageAssetId, setCoverImageAssetId] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishedSlugs = new Set(posts.filter((p) => p.status === "published" || !p.status).map((p) => p.slug));
  const draftPosts = posts.filter((p) => p.status === "draft");

  async function generate(matchId: string) {
    setGenerating(matchId);
    setError(null);
    setDraft(null);
    setShowPreview(false);

    try {
      const res = await fetch("/api/admin/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          matchId,
          tone: selectedTone,
          author,
          ...(coachNotes.trim() ? { coachNotes: coachNotes.trim() } : {}),
          ...(coverImageAssetId ? { coverImageAssetId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setDraft({ id: data.id, matchId, ...data });
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate article");
    } finally {
      setGenerating(null);
    }
  }

  async function publish(postId: string) {
    setPublishing(postId);
    setError(null);
    try {
      const res = await fetch("/api/admin/publish-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, status: "published" as const } : p)
      );
      if (draft?.id === postId) setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(null);
    }
  }

  function discard() {
    setDraft(null);
    setShowPreview(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb crumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Match Articles" }]} />
          </div>
          <div className="flex items-center gap-3">
            <a href={`/news?team=${team}`} target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
              View news ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">AI Match Articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate bilingual match recaps using Claude. Articles are saved as drafts — you approve before publishing.</p>
        </div>

        {/* Generation settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Generation Settings</p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tone</label>
                <div className="flex gap-2">
                  {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        selectedTone === t
                          ? "bg-[var(--color-accent)] text-[#1c1c1e] border-transparent shadow-sm"
                          : "text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {TONE_LABELS[t].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{TONE_LABELS[selectedTone].desc}</p>
              </div>
              <div className="sm:w-48">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Coach"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Coach Notes <span className="text-gray-300 font-normal normal-case">(optional — player shoutouts, key moments, anything to highlight)</span>
              </label>
              <textarea
                rows={3}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="e.g. Great team effort — Alex scored twice, Marco had an outstanding game in goal. The second half comeback was incredible."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
              />
              <p className="text-xs text-gray-400 mt-0.5">Claude will weave these into the article. Applies to the next match you generate.</p>
            </div>

            <AdminImageUploader
              onUploaded={(assetId, previewUrl) => { setCoverImageAssetId(assetId); setCoverImagePreview(previewUrl); }}
              onCleared={() => { setCoverImageAssetId(null); setCoverImagePreview(null); }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Draft preview modal */}
        {showPreview && draft && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Draft Preview</span>
                <h2 className="text-lg font-black text-gray-900 mt-2">{draft.title}</h2>
                <p className="text-sm text-gray-500 italic">{draft.title_es}</p>
              </div>
              {coverImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImagePreview} alt="Cover" className="w-24 h-16 object-cover rounded-xl border border-amber-200 flex-shrink-0" />
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">English</p>
                <p className="text-xs text-gray-500 italic mb-2">{draft.excerpt}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{draft.body_en}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Español</p>
                <p className="text-xs text-gray-500 italic mb-2">{draft.excerpt_es}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{draft.body_es}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-amber-200">
              <button
                onClick={discard}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => generate(draft.matchId)}
                disabled={generating !== null}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={() => publish(draft.id)}
                disabled={publishing === draft.id}
                className="ml-auto px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {publishing === draft.id ? "Publishing…" : "Publish Article"}
              </button>
            </div>
          </div>
        )}

        {/* Completed matches */}
        <div className="mb-8">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Completed Matches</h2>
          {matches.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No completed matches yet.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Opponent</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Result</th>
                    <th className="px-4 py-3 text-right">Article</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...matches]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((m) => {
                      const isGenerating = generating === m.id;
                      const hasPublished = publishedSlugs.size > 0 &&
                        posts.some((p) => p.status === "published" && p.title.toLowerCase().includes(m.opponent.toLowerCase()));
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.date)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">vs {m.opponent}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">
                            {m.goalsFor} – {m.goalsAgainst}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_BADGE[m.result!]}`}>
                              {m.result}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {hasPublished ? (
                              <span className="text-xs font-bold text-green-600">Published ✓</span>
                            ) : (
                              <button
                                onClick={() => generate(m.id)}
                                disabled={isGenerating || generating !== null}
                                className="text-xs px-3 py-1.5 bg-[var(--color-accent)] text-[#1c1c1e] rounded-full font-bold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isGenerating ? "Generating…" : "✨ Generate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Draft articles */}
        {draftPosts.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Saved Drafts</h2>
            <div className="flex flex-col gap-3">
              {draftPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {formatDate(post.publishedAt)} · {post.author}
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">Draft</span>
                    </p>
                    <h3 className="font-bold text-gray-800 text-sm leading-snug">{post.title}</h3>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{post.excerpt}</p>
                  </div>
                  <button
                    onClick={() => publish(post.id)}
                    disabled={publishing === post.id}
                    className="shrink-0 text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {publishing === post.id ? "Publishing…" : "Publish"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
