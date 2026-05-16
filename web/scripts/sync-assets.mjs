// Copies marketing-site assets from the repo root into web/public/ so the
// admin Next.js project serves the same favicon/scripts/styles as elenos.ai.
// Runs before `next dev` and `next build`; not committed to git.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const repoRoot = resolve(webRoot, "..");
const publicDir = resolve(webRoot, "public");

const assets = ["images", "js", "script.js", "styles.css", "styles-pages.css"];

mkdirSync(publicDir, { recursive: true });

for (const name of assets) {
  const src = resolve(repoRoot, name);
  const dst = resolve(publicDir, name);
  if (!existsSync(src)) {
    console.warn(`[sync-assets] missing source: ${src} — skipping`);
    continue;
  }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}

console.log(`[sync-assets] copied ${assets.length} asset paths from repo root → web/public/`);
