/**
 * Run once to get a YouTube OAuth refresh token.
 * Usage: node scripts/youtube-auth.mjs
 * Writes scripts/.youtube-token.json (gitignored).
 */
import { google } from "googleapis";
import { createServer } from "http";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createInterface } from "readline";

const __dir = dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = join(__dir, "../.youtube-client-secret.json");
const TOKEN_FILE = join(__dir, ".youtube-token.json");

const { client_id, client_secret, redirect_uris } = JSON.parse(
  readFileSync(SECRET_FILE, "utf8")
).installed;

const oauth2 = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3333/callback");

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/youtube"],
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for redirect on http://localhost:3333/callback ...\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3333");
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("Missing code.");
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    res.end("<h2>Auth complete! You can close this tab.</h2>");
    console.log(`\nTokens saved to ${TOKEN_FILE}`);
    server.close();
    process.exit(0);
  } catch (err) {
    res.end("Error: " + err.message);
    console.error(err);
    server.close();
    process.exit(1);
  }
}).listen(3333);
