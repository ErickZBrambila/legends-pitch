/**
 * Seeds Zach Pickard's Oct 13 2026 announcement into Sanity.
 * Run once: npx tsx scripts/seed-announcement.ts
 * Requires SANITY_WRITE_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET in .env.local
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually without dotenv dependency
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^['"]|['"]$/g, "");
  }
} catch { /* .env.local missing — rely on shell env */ }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  // Find the U11 team document
  const team = await client.fetch<{ _id: string } | null>(
    `*[_type == "team" && ageGroup == "u11"][0]{ _id }`
  );

  if (!team) {
    console.error("U11 team document not found in Sanity. Create it first.");
    process.exit(1);
  }

  const doc = await client.create({
    _type: "announcement",
    team: { _type: "reference", _ref: team._id },
    author: "Zach Pickard",
    publishedAt: "2026-10-13T14:47:00.000Z",
    message:
      "Hey everyone just a reminder that this Friday we need to meet at 6:45p at the southwestern university soccer field. Please have the boys in full uniform other than shinguards. Either running shoes or cleats are ok. We will be all the southwestern team out before kick off!!!",
    message_es:
      "Hola a todos, solo un recordatorio de que este viernes tenemos que reunirnos a las 6:45 p. m. en el campo de fútbol de la universidad suroeste. Por favor, tenga a los chicos en uniforme completo que no sean espinilleras. Las zapatillas para correr o los tacos están bien. ¡Seremos todo el equipo del suroeste antes del inicio!",
  });

  console.log(`✅ Announcement created: ${doc._id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
