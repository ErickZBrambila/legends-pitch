/**
 * Patches Zach's Oct 13 announcement with location + coords.
 * Run once: npx tsx scripts/patch-announcement-location.ts
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^['"]|['"]$/g, "");
  }
} catch { /* rely on shell env */ }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  const doc = await client.fetch<{ _id: string } | null>(
    `*[_type == "announcement" && author == "Zach Pickard" && publishedAt == "2026-10-13T14:47:00.000Z"][0]{ _id }`
  );

  if (!doc) {
    console.error("Announcement not found.");
    process.exit(1);
  }

  await client
    .patch(doc._id)
    .set({
      location: "1001 E University Ave, Georgetown, TX 78626",
      // Southwestern University Soccer Field — exact pin from Google Maps
      locationLat: 30.6380112,
      locationLng: -97.6604064,
      // Friday Oct 17 at 6:45 PM CDT = 23:45 UTC
      eventTime: "2026-10-17T23:45:00.000Z",
    })
    .commit();

  console.log(`✅ Patched announcement ${doc._id} with location + coords`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
