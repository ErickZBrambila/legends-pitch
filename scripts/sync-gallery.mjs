/**
 * Syncs Google Drive photo folders → Sanity galleryEvents.
 *
 * For each configured folder, lists dated subfolders (YYYY-MM-DD),
 * compares against existing Sanity events, and creates new ones.
 *
 * Requires env vars:
 *   GOOGLE_DRIVE_API_KEY   — Drive API key (public folder access)
 *   SANITY_WRITE_TOKEN     — Sanity write token
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 */

import { createClient } from "@sanity/client";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const SANITY_TOKEN = process.env.SANITY_WRITE_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

// Add U12 folder + team ref when ready
const FOLDER_CONFIGS = [
  {
    folderId: "1urOVHDcafH5-u9VRDMNAp5zNakD9qeZF", // Benn's U11 folder
    teamRef: "6610532d-6781-49e0-85f6-c8a8eacc9b80",
    teamSlug: "u11",
    credit: "Benn",
  },
  // {
  //   folderId: "PASTE_U12_FOLDER_ID_HERE",
  //   teamRef: "84a34057-88a4-4b27-9818-ad1883637115",
  //   teamSlug: "u12",
  //   credit: "",
  // },
];

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: SANITY_TOKEN,
});

async function driveList(parentId, mimeType = null) {
  let q = `'${parentId}' in parents and trashed = false`;
  if (mimeType) q += ` and mimeType = '${mimeType}'`;
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=1000&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drive API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.files ?? [];
}

async function getExistingDates(teamRef) {
  const events = await sanity.fetch(
    `*[_type == "galleryEvent" && team._ref == $ref]{date}`,
    { ref: teamRef }
  );
  return new Set(events.map((e) => e.date.slice(0, 10)));
}

function matchTitle(dateStr, teamSlug) {
  // Try to label by known schedule dates — expand as needed
  const schedule = {
    u11: {
      "2026-09-12": "vs Elgin United (Ramirez)",
      "2026-09-19": "vs Elgin United (Hernandez)",
      "2026-09-26": "vs Storm Black",
      "2026-09-27": "vs T&C Soccer Inter Milan",
      "2026-10-10": "vs Elgin United (Ramirez)",
      "2026-10-17": "vs Storm Black",
      "2026-10-18": "vs Elgin United (Hernandez)",
      "2026-10-24": "vs T&C Soccer Inter Milan",
      "2026-10-31": "vs WBSA United",
    },
    u12: {
      "2026-09-12": "vs Leander FC Rattlers",
      "2026-09-19": "vs Elgin United (Castro)",
      "2026-09-26": "vs FC Westlake Hooligans",
      "2026-10-10": "vs Liberty United",
      "2026-10-17": "vs LC United",
      "2026-10-24": "vs Leander FC Rattlers",
      "2026-10-25": "vs BYSO Inferno",
      "2026-11-08": "vs BYSO Inferno",
    },
  };
  const label = schedule[teamSlug]?.[dateStr];
  const team = teamSlug.toUpperCase();
  const [, mm, dd] = dateStr.split("-");
  const shortDate = `${mm}/${dd}`;
  return label
    ? { en: `${team} ${label} — ${shortDate}`, es: `${team} ${label} — ${shortDate}` }
    : { en: `${team} — ${shortDate}`, es: `${team} — ${shortDate}` };
}

async function syncFolder(config) {
  console.log(`\n📁 Checking ${config.teamSlug.toUpperCase()} folder...`);

  const existingDates = await getExistingDates(config.teamRef);
  console.log(`  Existing album dates: ${[...existingDates].join(", ") || "none"}`);

  const subfolders = await driveList(config.folderId, "application/vnd.google-apps.folder");
  const dated = subfolders.filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.name));
  console.log(`  Drive subfolders: ${dated.map((f) => f.name).join(", ") || "none"}`);

  const newFolders = dated.filter((f) => !existingDates.has(f.name));
  if (newFolders.length === 0) {
    console.log(`  ✅ All up to date.`);
    return;
  }

  for (const folder of newFolders) {
    console.log(`  📸 Processing ${folder.name}...`);
    const files = await driveList(folder.id);
    const photos = files.filter(
      (f) => f.mimeType?.startsWith("image/") || f.mimeType === "application/octet-stream"
    );

    if (photos.length === 0) {
      console.log(`     No photos found, skipping.`);
      continue;
    }

    const titles = matchTitle(folder.name, config.teamSlug);
    const slug = folder.name.replace(/-/g, "");

    const doc = {
      _type: "galleryEvent",
      title: titles.en,
      title_es: titles.es,
      date: folder.name,
      team: { _type: "reference", _ref: config.teamRef },
      images: photos.map((f, i) => ({
        _key: `img-${slug}-${i}`,
        alt: `Game photo ${i + 1}`,
        image: {
          _type: "externalImage",
          url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1200`,
        },
      })),
    };

    const created = await sanity.create(doc);
    console.log(`     ✅ Created "${titles.en}" with ${photos.length} photos (${created._id})`);
  }
}

async function main() {
  if (!API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY is not set");
  if (!SANITY_TOKEN) throw new Error("SANITY_WRITE_TOKEN is not set");

  for (const config of FOLDER_CONFIGS) {
    await syncFolder(config);
  }

  console.log("\n✅ Gallery sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
