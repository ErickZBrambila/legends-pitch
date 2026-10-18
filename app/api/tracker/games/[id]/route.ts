import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getRedis } from "@/lib/redis";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await getAdminSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  await Promise.all([
    redis.del(`tracker:game:${id}`),
    redis.lrem("tracker:game:index", 0, id),
  ]);

  return NextResponse.json({ ok: true });
}
