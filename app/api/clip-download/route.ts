import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { getParentSession } from "@/lib/parent-auth";

const ALLOWED_HOST = "pub-ec6efd6486724c999de33694e15dd4dc.r2.dev";

export async function GET(req: NextRequest) {
  const account = await getParentSession();
  if (!account) return new Response("Parent account required", { status: 401 });

  const limited = await rateLimit(req, "download");
  if (limited) return limited;

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

  // SSRF guard: only allow the exact R2 public bucket over https, and reject
  // any embedded credentials (userinfo) that could be used to confuse the host
  // check or leak into the upstream request.
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== ALLOWED_HOST ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  // Rebuild the request URL from the validated components so nothing beyond the
  // allowlisted origin + path/query can be smuggled through.
  const safeUrl = `https://${ALLOWED_HOST}${parsed.pathname}${parsed.search}`;

  let upstream: Response;
  try {
    upstream = await fetch(safeUrl, { redirect: "error" });
  } catch {
    return new Response("Failed to fetch clip", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch clip", { status: 502 });
  }

  // Strip anything that could break out of the Content-Disposition header
  // (CR/LF, quotes, backslashes) in addition to restricting the charset.
  const safe =
    filename
      .replace(/[\r\n"\\]/g, "")
      .replace(/[^a-z0-9._\- ]/gi, "_")
      .slice(0, 200) || "clip.mp4";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "video/mp4",
      "Content-Length": upstream.headers.get("Content-Length") ?? "",
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
