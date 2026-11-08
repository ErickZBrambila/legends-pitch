/**
 * Uploads videos from the R2 bucket to YouTube (unlisted).
 * Tracks uploads in scripts/youtube-manifest.json to skip re-uploads.
 *
 * Usage:
 *   node scripts/r2-to-youtube.mjs                        # upload all new videos in R2
 *   node scripts/r2-to-youtube.mjs --dry-run              # list what would be uploaded
 *   node scripts/r2-to-youtube.mjs --max-size 500         # skip files over 500 MB (default: 800)
 *   node scripts/r2-to-youtube.mjs --limit 10            # upload at most 10 videos per run
 *
 * Requires:
 *   - .youtube-client-secret.json in project root
 *   - scripts/.youtube-token.json (from youtube-auth.mjs)
 *   - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in .env.local
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = join(__dir, "../.youtube-client-secret.json");
const TOKEN_FILE = join(__dir, ".youtube-token.json");
const MANIFEST_FILE = join(__dir, "youtube-manifest.json");

const DRY_RUN = process.argv.includes("--dry-run");

const maxSizeArg = process.argv.indexOf("--max-size");
const MAX_SIZE_MB = maxSizeArg !== -1 ? Number(process.argv[maxSizeArg + 1]) : 800;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity;

// ── Load env from .env.local ──────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(__dir, "../.env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...rest] = line.trim().split("=");
    if (k && rest.length) process.env[k] = rest.join("=");
  }
}
loadEnv();

const REQUIRED_ENV = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
for (const k of REQUIRED_ENV) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
}

// ── R2 client (S3-compatible) ─────────────────────────────────────────────────
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── YouTube OAuth client ──────────────────────────────────────────────────────
const { client_id, client_secret } = JSON.parse(
  readFileSync(SECRET_FILE, "utf8")
).installed;
const oauth2 = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3333/callback");
oauth2.setCredentials(JSON.parse(readFileSync(TOKEN_FILE, "utf8")));

// Persist refreshed tokens automatically
oauth2.on("tokens", (tokens) => {
  const existing = JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
  writeFileSync(TOKEN_FILE, JSON.stringify({ ...existing, ...tokens }, null, 2));
});

const youtube = google.youtube({ version: "v3", auth: oauth2 });

// ── Manifest ──────────────────────────────────────────────────────────────────
function loadManifest() {
  return existsSync(MANIFEST_FILE)
    ? JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
    : {};
}
function saveManifest(manifest) {
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm"]);

function titleFromKey(key) {
  return key
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function listR2Videos() {
  const keys = [];
  let token;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (VIDEO_EXTS.has(extname(obj.Key).toLowerCase()) && obj.Size <= MAX_SIZE_BYTES) {
        keys.push({ key: obj.Key, size: obj.Size });
      }
    }
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

async function uploadToYouTube(key, stream, size) {
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: titleFromKey(key),
        description: "North Legends FC — uploaded automatically from R2.",
        tags: ["North Legends FC", "soccer", "football", "Texas"],
        categoryId: "17", // Sports
      },
      status: {
        privacyStatus: "unlisted",
      },
    },
    media: {
      body: stream,
    },
  });
  return res.data.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const manifest = loadManifest();
const videos = await listR2Videos();

if (videos.length === 0) {
  console.log("No video files found in R2 bucket.");
  process.exit(0);
}

const allPending = videos.filter((v) => !manifest[v.key]);
const pending = allPending.slice(0, LIMIT);

console.log(`R2 bucket: ${process.env.R2_BUCKET}  (skipping files > ${MAX_SIZE_MB} MB)`);
console.log(`Total videos: ${videos.length} | Already uploaded: ${videos.length - allPending.length} | Remaining: ${allPending.length} | This batch: ${pending.length}`);

if (pending.length === 0) {
  console.log("Nothing to upload.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n[dry-run] Would upload:");
  for (const v of pending) {
    console.log(`  ${v.key}  (${(v.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  process.exit(0);
}

for (const { key, size } of pending) {
  console.log(`\nUploading: ${key}  (${(size / 1024 / 1024).toFixed(1)} MB)`);
  try {
    const { Body } = await r2.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
    );
    const videoId = await uploadToYouTube(key, Body, size);
    const url = `https://youtu.be/${videoId}`;
    manifest[key] = { videoId, url, uploadedAt: new Date().toISOString() };
    saveManifest(manifest);
    console.log(`  Done → ${url}`);
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
  }
}

console.log("\nManifest saved to", MANIFEST_FILE);
