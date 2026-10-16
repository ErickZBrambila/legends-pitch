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
type Mode = "match" | "freeform";

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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b: Record<string, unknown>) => b._type === "block")
    .map((b: Record<string, unknown>) =>
      Array.isArray(b.children)
        ? (b.children as Record<string, unknown>[]).map((c) => c.text ?? "").join("")
        : ""
    )
    .filter(Boolean)
    .join("\n\n");
}

interface DraftPreview {
  id: string;
  sourceMatchId?: string;
  sourceFreeFormContext?: string;
  slug: string;
  title: string;
  title_es: string;
  excerpt: string;
  excerpt_es: string;
  body_en: string;
  body_es: string;
}

interface EditState {
  postId: string;
  title: string;
  title_es: string;
  excerpt: string;
  excerpt_es: string;
  body_en: string;
  body_es: string;
}

export default function ArticlesAdmin({ team, matches, posts: initialPosts }: Props) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("match");
  const [freeFormContext, setFreeFormContext] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftPreview | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone>("friendly");
  const [author, setAuthor] = useState("Coach");
  const [coachNotes, setCoachNotes] = useState("");
  const [coverImageAssetId, setCoverImageAssetId] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftPosts = posts.filter((p) => p.status === "draft");

  async function generate(matchId?: string, overrideFreeFormContext?: string) {
    const ctx = overrideFreeFormContext ?? freeFormContext;
    if (!matchId && !ctx.trim()) {
      setError("Fill in the Free Form context at the top, then click Regen.");
      return;
    }
    const key = matchId ?? "freeform";
    setGenerating(key);
    setError(null);
    setDraft(null);
    setShowPreview(false);

    try {
      const res = await fetch("/api/admin/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          ...(matchId ? { matchId } : { freeFormContext: ctx }),
          tone: selectedTone,
          author,
          ...(coachNotes.trim() ? { coachNotes: coachNotes.trim() } : {}),
          ...(coverImageAssetId ? { coverImageAssetId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setDraft({ id: data.id, sourceMatchId: matchId, sourceFreeFormContext: data.sourceFreeFormContext ?? undefined, ...data });
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
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: "published" as const } : p));
      if (draft?.id === postId) setShowPreview(false);
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(null);
    }
  }

  async function saveEdit() {
    if (!editState) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/update-article", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPosts((prev) => prev.map((p) =>
        p.id === editState.postId
          ? { ...p, title: editState.title, title_es: editState.title_es, excerpt: editState.excerpt, excerpt_es: editState.excerpt_es }
          : p
      ));
      if (draft?.id === editState.postId) {
        setDraft((d) => d ? { ...d, title: editState.title, title_es: editState.title_es, excerpt: editState.excerpt, excerpt_es: editState.excerpt_es, body_en: editState.body_en, body_es: editState.body_es } : d);
      }
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(post: NewsPost | DraftPreview) {
    const isDraft = "body_en" in post;
    setEditState({
      postId: post.id,
      title: post.title,
      title_es: post.title_es ?? "",
      excerpt: post.excerpt ?? "",
      excerpt_es: post.excerpt_es ?? "",
      body_en: isDraft
        ? (post as DraftPreview).body_en
        : blocksToText((post as NewsPost).body),
      body_es: isDraft
        ? (post as DraftPreview).body_es
        : blocksToText((post as NewsPost).body_es),
    });
  }

  async function deleteDraft(postId: string) {
    setConfirmDeleteId(null);
    setDeleting(postId);
    setError(null);
    try {
      const res = await fetch("/api/admin/delete-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (draft?.id === postId) { setDraft(null); setShowPreview(false); }
      if (editState?.postId === postId) setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  function discard() {
    setDraft(null);
    setShowPreview(false);
    setEditState(null);
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
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">AI Match Articles</h1>
            <p className="text-sm text-gray-500 mt-0.5">Generate bilingual articles with Claude. Save as draft, edit, then publish.</p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm shrink-0">
            {([["u11", "U11"], ["u12", "U12"]] as [string, string][]).map(([t, label]) => (
              <a
                key={t}
                href={`?team=${t}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  team === t
                    ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm mb-6">
          {([["match", "Link to Match"], ["freeform", "Free Form"]] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
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

            {mode === "freeform" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  What&apos;s the article about? <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={freeFormContext}
                  onChange={(e) => setFreeFormContext(e.target.value)}
                  placeholder="e.g. Preview of Saturday's match against FC Dallas — we've been training hard on set pieces and the team is ready. Carlos has been outstanding in practice this week."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Coach Notes <span className="text-gray-300 font-normal normal-case">(optional — player shoutouts, key moments)</span>
              </label>
              <textarea
                rows={2}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="e.g. Alex scored twice, Marco had an outstanding game in goal, great team effort in the second half."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
              />
            </div>

            <AdminImageUploader
              onUploaded={(assetId, previewUrl) => { setCoverImageAssetId(assetId); setCoverImagePreview(previewUrl); }}
              onCleared={() => { setCoverImageAssetId(null); setCoverImagePreview(null); }}
            />

            {mode === "freeform" && (
              <button
                onClick={() => generate(undefined)}
                disabled={!freeFormContext.trim() || generating !== null}
                className="w-full py-2.5 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating === "freeform" ? "Generating…" : "✨ Generate Article"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Draft preview */}
        {showPreview && draft && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            {editState?.postId === draft.id ? (
              /* Edit mode */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Editing Draft</span>
                  <button onClick={() => setEditState(null)} className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title (EN)</label>
                    <input value={editState.title} onChange={(e) => setEditState((s) => s ? { ...s, title: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título (ES)</label>
                    <input value={editState.title_es} onChange={(e) => setEditState((s) => s ? { ...s, title_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Excerpt (EN)</label>
                    <textarea rows={2} value={editState.excerpt} onChange={(e) => setEditState((s) => s ? { ...s, excerpt: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resumen (ES)</label>
                    <textarea rows={2} value={editState.excerpt_es} onChange={(e) => setEditState((s) => s ? { ...s, excerpt_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Body (EN)</label>
                    <textarea rows={6} value={editState.body_en} onChange={(e) => setEditState((s) => s ? { ...s, body_en: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cuerpo (ES)</label>
                    <textarea rows={6} value={editState.body_es} onChange={(e) => setEditState((s) => s ? { ...s, body_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                  <button onClick={() => setEditState(null)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold hover:opacity-90 disabled:opacity-50">
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => { setEditState(null); generate(draft.sourceMatchId, draft.sourceFreeFormContext); }}
                    disabled={generating !== null}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ✨ Regenerate with AI
                  </button>
                  <button onClick={() => publish(draft.id)} disabled={publishing === draft.id} className="ml-auto px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50">
                    {publishing === draft.id ? "Publishing…" : "Publish"}
                  </button>
                </div>
              </div>
            ) : (
              /* Preview mode */
              <>
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
                  <button onClick={discard} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Discard</button>
                  <button onClick={() => startEdit(draft)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => generate(draft.sourceMatchId, draft.sourceFreeFormContext)} disabled={generating !== null} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">Regenerate</button>
                  <button onClick={() => publish(draft.id)} disabled={publishing === draft.id} className="ml-auto px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                    {publishing === draft.id ? "Publishing…" : "Publish Article"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Completed matches (match mode only) */}
        {mode === "match" && (
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">All Matches</h2>
            {matches.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No matches yet — add them in Sanity Studio.</p>
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
                        return (
                          <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.date)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">vs {m.opponent}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700">
                              {m.result ? `${m.goalsFor} – ${m.goalsAgainst}` : <span className="text-gray-300 font-normal text-xs">Upcoming</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {m.result ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_BADGE[m.result]}`}>{m.result}</span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => generate(m.id)}
                                disabled={isGenerating || generating !== null}
                                className="text-xs px-3 py-1.5 bg-[var(--color-accent)] text-[#1c1c1e] rounded-full font-bold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isGenerating ? "Generating…" : "✨ Generate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Draft articles */}
        {draftPosts.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Saved Drafts</h2>
            <div className="flex flex-col gap-3">
              {draftPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
                  {editState?.postId === post.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title (EN)</label>
                          <input value={editState.title} onChange={(e) => setEditState((s) => s ? { ...s, title: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título (ES)</label>
                          <input value={editState.title_es} onChange={(e) => setEditState((s) => s ? { ...s, title_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Excerpt (EN)</label>
                          <textarea rows={2} value={editState.excerpt} onChange={(e) => setEditState((s) => s ? { ...s, excerpt: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resumen (ES)</label>
                          <textarea rows={2} value={editState.excerpt_es} onChange={(e) => setEditState((s) => s ? { ...s, excerpt_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Body (EN)</label>
                          <textarea rows={5} value={editState.body_en} onChange={(e) => setEditState((s) => s ? { ...s, body_en: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cuerpo (ES)</label>
                          <textarea rows={5} value={editState.body_es} onChange={(e) => setEditState((s) => s ? { ...s, body_es: e.target.value } : s)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                        </div>
                      </div>
                      {/* Tone row inside edit form */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tone:</span>
                        {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTone(t)}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-all ${
                              selectedTone === t
                                ? "bg-[var(--color-accent)] text-[#1c1c1e] border-transparent"
                                : "text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {TONE_LABELS[t].label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => setEditState(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold hover:opacity-90 disabled:opacity-50">
                          {saving ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                          onClick={() => { setEditState(null); generate(post.sourceMatchId, post.sourceFreeFormContext ?? `${post.title}. ${post.excerpt}`); }}
                          disabled={generating !== null}
                          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ✨ Regenerate with AI
                        </button>
                        {confirmDeleteId === post.id ? (
                          <span className="flex gap-2 items-center">
                            <span className="text-sm text-red-500 font-semibold">Sure?</span>
                            <button onClick={() => deleteDraft(post.id)} disabled={deleting === post.id} className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50">
                              {deleting === post.id ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(post.id)}
                            disabled={deleting === post.id}
                            className="px-4 py-2 rounded-lg border border-red-100 text-red-400 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete Draft
                          </button>
                        )}
                        <button onClick={() => publish(post.id)} disabled={publishing === post.id} className="ml-auto px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50">
                          {publishing === post.id ? "Publishing…" : "Publish"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-1">
                            {formatDate(post.publishedAt)} · {post.author}
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">Draft</span>
                          </p>
                          <h3 className="font-bold text-gray-800 text-sm leading-snug">{post.title}</h3>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{post.excerpt}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEdit(post)} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors">Edit</button>
                          <button
                            onClick={() => generate(post.sourceMatchId, post.sourceFreeFormContext ?? `${post.title}. ${post.excerpt}`)}
                            disabled={generating !== null}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {generating === post.id ? "…" : "✨ Regen"}
                          </button>
                          <button onClick={() => publish(post.id)} disabled={publishing === post.id} className="text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full font-bold hover:opacity-80 transition-opacity disabled:opacity-50">
                            {publishing === post.id ? "Publishing…" : "Publish"}
                          </button>
                          {confirmDeleteId === post.id ? (
                            <>
                              <button onClick={() => deleteDraft(post.id)} disabled={deleting === post.id} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 disabled:opacity-50">
                                {deleting === post.id ? "…" : "Sure?"}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50">
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(post.id)}
                              disabled={deleting === post.id}
                              className="text-xs px-3 py-1.5 border border-red-100 text-red-400 rounded-full font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Inline tone + regen controls — always visible */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tone:</span>
                        {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTone(t)}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-all ${
                              selectedTone === t
                                ? "bg-[var(--color-accent)] text-[#1c1c1e] border-transparent"
                                : "text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {TONE_LABELS[t].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
