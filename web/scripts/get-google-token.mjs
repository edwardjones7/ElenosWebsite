#!/usr/bin/env node
/**
 * One-time helper: mint a Google OAuth refresh token for the /book scheduler.
 *
 * Prereqs (see web/.env.example):
 *   - A Google Cloud project with the Google Calendar API enabled.
 *   - An OAuth client (type: Web application) whose Authorized redirect URIs
 *     include:  http://localhost:53682/oauth2callback
 *   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET available (env or web/.env.local).
 *
 * Run:  node scripts/get-google-token.mjs
 * Then paste the printed GOOGLE_REFRESH_TOKEN into Vercel (and .env.local).
 *
 * Dependency-free: Node built-ins only.
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
// Full calendar scope covers freeBusy reads + event create/update/delete + Meet.
const SCOPE = "https://www.googleapis.com/auth/calendar";

function loadEnvLocal() {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(dir, "..", ".env.local");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no .env.local — rely on process.env */
  }
}

loadEnvLocal();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nMissing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.\n" +
      "Set them in web/.env.local or your shell, then re-run.\n",
  );
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // force a refresh_token every run
  }).toString();

async function exchange(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed (${res.status}): ${await res.text()}`);
  return res.json();
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    res.writeHead(400, { "content-type": "text/plain" }).end(`OAuth error: ${error}`);
    console.error("\nOAuth error:", error);
    server.close();
    process.exit(1);
  }
  try {
    const tokens = await exchange(code);
    res
      .writeHead(200, { "content-type": "text/html" })
      .end("<h2>Done — you can close this tab and return to the terminal.</h2>");
    console.log("\n✅ Success. Add this to Vercel + web/.env.local:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    if (!tokens.refresh_token) {
      console.log(
        "⚠️  No refresh_token returned. Revoke prior access at " +
          "https://myaccount.google.com/permissions and re-run.\n",
      );
    }
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" }).end(String(e));
    console.error(e);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log("\nOpen this URL in your browser, sign in as the calendar owner, and approve:\n");
  console.log(authUrl + "\n");
  console.log(`Waiting for the redirect on ${REDIRECT_URI} …`);
});
