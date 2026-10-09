import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionById } from "@/lib/sanity/queries";
import SessionViewer from "./SessionViewer";

type Props = { params: Promise<{ sessionId: string }>; searchParams: Promise<{ team?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await getSessionById(sessionId);
  return { title: session ? `${session.sessionName} · KickReel` : "Session Not Found" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SessionPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { team } = await searchParams;
  const teamSlug = team === "u12" ? "u12" : "u11";

  const session = await getSessionById(sessionId);
  if (!session) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href={`/videos?team=${teamSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to videos
      </Link>

      {/* Session header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-gray-900">{session.sessionName}</h1>
          <span className={`text-xs font-black px-2 py-1 rounded-full ${
            session.sessionType === "GAME"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-accent)] text-[#1c1c1e]"
          }`}>
            {session.sessionType === "GAME" ? "GAME" : "PRACTICE"}
          </span>
        </div>
        {session.sessionDate && (
          <p className="text-sm text-gray-400">{formatDate(session.sessionDate)}</p>
        )}
      </div>

      {/* Interactive viewer */}
      {session.videos.length > 0 ? (
        <SessionViewer session={session} />
      ) : (
        <p className="text-gray-400 text-center py-16">No videos in this session.</p>
      )}
    </div>
  );
}
