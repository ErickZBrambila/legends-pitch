/**
 * Sets all videos in youtube-manifest.json to public.
 * Usage: node scripts/youtube-publish.mjs
 */
import { google } from "googleapis";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = join(__dir, "../.youtube-client-secret.json");
const TOKEN_FILE  = join(__dir, ".youtube-token.json");
const MANIFEST_FILE = join(__dir, "youtube-manifest.json");

const { client_id, client_secret } = JSON.parse(readFileSync(SECRET_FILE, "utf8")).installed;
const oauth2 = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3333/callback");
oauth2.setCredentials(JSON.parse(readFileSync(TOKEN_FILE, "utf8")));
oauth2.on("tokens", (t) => { if (t.refresh_token) oauth2.setCredentials(t); });

const yt = google.youtube({ version: "v3", auth: oauth2 });

const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"));
const entries = Object.entries(manifest);

console.log(`Making ${entries.length} videos public...\n`);

let done = 0, failed = 0;
for (const [key, { videoId }] of entries) {
  try {
    await yt.videos.update({
      part: ["status"],
      requestBody: { id: videoId, status: { privacyStatus: "public" } },
    });
    console.log(`  ✓ ${videoId}  (${key.split("/").pop()})`);
    done++;
  } catch (err) {
    console.log(`  ✗ ${videoId}  FAILED: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${done} public, ${failed} failed.`);
