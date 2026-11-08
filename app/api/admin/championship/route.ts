import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getRedis } from "@/lib/redis";

export const runtime = "edge";

export type SplashVideo = "goal" | "reel";
export const SPLASH_ENABLED_KEY = "championship:splash_enabled";
export const SPLASH_VIDEO_KEY = "championship:splash_video";

export async function GET() {
  const redis = getRedis();
  const [enabled, video] = redis
    ? await Promise.all([
        redis.get<string>(SPLASH_ENABLED_KEY),
        redis.get<SplashVideo>(SPLASH_VIDEO_KEY),
      ])
    : [null, null];

  return NextResponse.json({
    splashEnabled: enabled === "true",
    splashVideo: video ?? "goal",
  });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<{ splashEnabled: boolean; splashVideo: SplashVideo }>;
  const redis = getRedis();

  if (typeof body.splashEnabled === "boolean" && redis) {
    await redis.set(SPLASH_ENABLED_KEY, body.splashEnabled ? "true" : "false");
  }
  if ((body.splashVideo === "goal" || body.splashVideo === "reel") && redis) {
    await redis.set(SPLASH_VIDEO_KEY, body.splashVideo);
  }

  return NextResponse.json({ ok: true });
}
