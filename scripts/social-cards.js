#!/usr/bin/env node
'use strict';

/**
 * Renders a 1200x630 share card for every published post:
 *   images/blog/<slug>/card.png
 *
 * build.js uses the card as the post's og:image / twitter:image when it
 * exists, so links on X, LinkedIn and iMessage show the title in brand type.
 *
 *   node scripts/social-cards.js           render new or changed cards
 *   node scripts/social-cards.js --force   re-render every card
 *
 * Needs Playwright (headless Chromium). It is not a dependency of the site:
 * the "Build blog" GitHub Action installs it, and locally it's
 *   npx -y playwright@1.58 install chromium && npm i --no-save playwright@1.58
 *
 * A card is re-rendered when its post's title or date changes. card.json next
 * to the image records what it was rendered from.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const FORCE = process.argv.includes('--force');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A fixed starfield per post, seeded from the slug so re-renders match. */
function stars(slug) {
  let h = 2166136261;
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  let out = '';
  for (let i = 0; i < 90; i++) {
    const r = (0.4 + rnd() * (i % 11 === 0 ? 1.6 : 0.8)).toFixed(2);
    out += `<circle cx="${(rnd() * 1200).toFixed(1)}" cy="${(rnd() * 630).toFixed(1)}" r="${r}" fill="#fff" opacity="${(0.15 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  return out;
}

async function main() {
  const feed = path.join(ROOT, 'blog', 'posts.json');
  if (!fs.existsSync(feed)) throw new Error('blog/posts.json is missing: run `node build.js` first');
  const { posts } = JSON.parse(fs.readFileSync(feed, 'utf8'));

  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'social-card.html'), 'utf8');
  const wordmark = 'data:image/png;base64,' +
    fs.readFileSync(path.join(ROOT, 'images', 'wordmark-white.png')).toString('base64');

  const todo = posts.filter((p) => {
    const meta = path.join(ROOT, 'images', 'blog', p.slug, 'card.json');
    if (FORCE || !fs.existsSync(meta)) return true;
    const { hash } = JSON.parse(fs.readFileSync(meta, 'utf8'));
    return hash !== cardHash(p);
  });
  if (!todo.length) { console.log('social cards: all current'); return; }

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of todo) {
    const [y, m, d] = p.date.split('-').map(Number);
    const html = tpl
      .replace('{{stars}}', stars(p.slug))
      .replace('{{wordmark}}', wordmark)
      .replace('{{title}}', esc(p.title))
      .replace('{{date}}', `${MONTHS[m - 1]} ${d}, ${y}`);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const dir = path.join(ROOT, 'images', 'blog', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'card.png') });
    fs.writeFileSync(path.join(dir, 'card.json'), JSON.stringify({ hash: cardHash(p) }) + '\n');
    console.log('  card  images/blog/' + p.slug + '/card.png');
  }
  await browser.close();
}

function cardHash(p) {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'social-card.html'), 'utf8');
  return crypto.createHash('sha1').update(p.title + '|' + p.date + '|' + tpl).digest('hex').slice(0, 12);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
