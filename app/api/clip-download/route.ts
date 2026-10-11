import { NextRequest } from "next/server";

const ALLOWED_HOST = "pub-ec6efd6486724c999de33694e15dd4dc.r2.dev";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "clip.mp4";

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (parsed.host !== ALLOWED_HOST) {
    return new Response("Forbidden", { status: 403 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch clip", { status: 502 });
  }

  const safe = filename.replace(/[^a-z0-9._\- ]/gi, "_");

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "video/mp4",
      "Content-Length": upstream.headers.get("Content-Length") ?? "",
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
