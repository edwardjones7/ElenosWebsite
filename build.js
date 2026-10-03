#!/usr/bin/env node
'use strict';

/**
 * Site build: shared nav/footer, plus the blog.
 *
 *   node build.js           build
 *   node build.js --check   build in memory, exit 1 if disk differs
 *
 * Shared chrome: partials/nav.html and partials/footer.html are copied into
 * every page that carries the markers below. A page without markers is left
 * alone, which is how /learn/ and /course/ keep their stripped funnel chrome.
 *
 *   <!-- @chrome:nav -->  …  <!-- /@chrome:nav -->
 *   <!-- @chrome:footer -->  …  <!-- /@chrome:footer -->
 *
 * The blog: markdown in posts/ becomes static pages in blog/.
 *
 * Scope is deliberately small: an index and a post page. No tags, search,
 * related posts, reading time or view counts. See posts/_template.md for how
 * to write a post.
 *
 * Output:
 *   blog/index.html              reverse-chronological list
 *   blog/<slug>/index.html       one page per post
 *   blog/feed.xml                RSS
 *   blog/posts.json              every post as data, for whatever cuts posts
 *                                into carousels and threads later
 *   index.html                   the latest-posts list between @blog:latest markers
 *   sitemap.xml                  blog URLs between @blog:sitemap markers
 *
 * Generated files are committed. Vercel serves the repo as-is with no build
 * step, so a bug here can never break a deploy. The "Build blog" GitHub
 * Action runs this on every push that touches posts/.
 */

const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('./scripts/vendor/marked.js');

const ROOT = __dirname;
const ORIGIN = 'https://elenos.ai';
const CHECK = process.argv.includes('--check');
const LATEST_ON_HOME = 3;

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// ---------------------------------------------------------------------------
// Front matter: `key: value` lines, quotes optional, # comments allowed.
// ---------------------------------------------------------------------------

function parseFrontMatter(source, file) {
  const text = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) throw new Error(`${file}: needs a front matter block between --- lines at the top`);

  const data = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = /^([a-z][\w-]*):\s*(.*)$/i.exec(line);
    if (!kv) throw new Error(`${file}: can't read front matter line "${line}"`);
    let v = kv[2].trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.indexOf(q, 1) > 0) v = v.slice(1, v.indexOf(q, 1));
    else v = v.replace(/\s+#.*$/, '').trim();
    data[kv[1]] = v === 'true' ? true : v === 'false' ? false : v;
  }
  return { data, body: text.slice(m[0].length) };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

function renderMarkdown(body) {
  const seen = new Map();
  const renderer = new marked.Renderer();

  renderer.heading = function ({ tokens, depth }) {
    const inner = this.parser.parseInline(tokens);
    let id = inner.toLowerCase().replace(/<[^>]+>|&[a-z#0-9]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-') || 'section';
    const n = seen.get(id) || 0;
    seen.set(id, n + 1);
    if (n) id += '-' + n;
    return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
  };

  // ![alt](src "caption")       figure in the text column
  // ![alt](src "wide: caption") figure that breaks out wider, for screenshots
  // The first image is usually the largest thing on screen, so it loads
  // eagerly; the rest wait until they're scrolled near.
  let imageCount = 0;
  renderer.image = function ({ href, title, text }) {
    const wide = /^wide:?\s*/i.test(title || '');
    const caption = (title || '').replace(/^wide:?\s*/i, '');
    const size = imageSize(href);
    const dims = size ? ` width="${size.w}" height="${size.h}"` : '';
    const loading = imageCount++ === 0 ? 'eager' : 'lazy';
    return `<figure class="${wide ? 'figure-wide' : 'figure'}"><img src="${esc(href)}" alt="${esc(text)}"${dims} loading="${loading}" decoding="async">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
  };

  let html = marked.parse(body, { renderer, gfm: true });

  // A figure on its own line arrives wrapped in <p>, which is invalid HTML.
  html = html.replace(/<p>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/g, '$1');
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (whole, href) =>
    href.startsWith(ORIGIN) ? whole : `${whole} target="_blank" rel="noopener"`);
  return html;
}

// ---------------------------------------------------------------------------
// Image dimensions, read from the file header. Width and height on every
// <img> stop layout shift, and social cards want og:image dimensions.
// ---------------------------------------------------------------------------

const localPath = (src) => path.join(ROOT, decodeURI(src.split(/[?#]/)[0]));
const sizeCache = new Map();

/** {w, h} for a site-relative /path image on disk, or null. */
function imageSize(src) {
  if (!src || !src.startsWith('/')) return null;
  if (sizeCache.has(src)) return sizeCache.get(src);
  let size = null;
  try {
    const b = fs.readFileSync(localPath(src));
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') {
      size = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    } else if (b.toString('ascii', 0, 3) === 'GIF') {
      size = { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
    } else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8X') size = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      else if (kind === 'VP8L') { const n = b.readUInt32LE(21); size = { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
      else if (kind === 'VP8 ') size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    } else if (b[0] === 0xff && b[1] === 0xd8) {
      // JPEG: walk the segments to the first start-of-frame marker.
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          size = { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
          break;
        }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (_) { /* a missing file is reported by seoCheck */ }
  sizeCache.set(src, size);
  return size;
}

const plain = (html) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const shortDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`; };
const rfc822 = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dow}, ${String(d).padStart(2, '0')} ${MONTHS[m - 1].slice(0, 3)} ${y} 12:00:00 GMT`;
};

// Every timestamp is noon UTC on the post's date: search engines want a
// timezone, and noon keeps the calendar day the same across the US.
const isoTime = (iso) => `${iso}T12:00:00Z`;

const REQUIRED = ['title', 'summary', 'date'];
const problems = [];
const warnings = [];

// ---------------------------------------------------------------------------
// SEO checks. Problems fail the build, so a post that would rank badly or
// render a broken search snippet can't publish. Warnings print and pass.
// ---------------------------------------------------------------------------

const SEO = {
  titleMax: 60,          // Google cuts titles off around 600px, roughly 60 characters
  summaryMin: 50,        // shorter and Google writes its own snippet from the body
  summaryMax: 160,       // longer and the snippet is cut off mid-sentence
  minWords: 300,
  slugMax: 60,
};

function seoCheck(p, data) {
  const fail = (msg) => problems.push(`${p.file}: ${msg}`);
  const warn = (msg) => warnings.push(`${p.file}: ${msg}`);

  if (p.seoTitle.length > SEO.titleMax) {
    fail(`title is ${p.seoTitle.length} characters, search results cut off around ${SEO.titleMax}. Shorten it, or add a shorter "seo-title".`);
  }
  if (p.summary.length < SEO.summaryMin || p.summary.length > SEO.summaryMax) {
    fail(`summary is ${p.summary.length} characters. Keep it between ${SEO.summaryMin} and ${SEO.summaryMax}: it's the snippet under the link in Google.`);
  }
  if (/<h1[\s>]/.test(p.html)) fail('the body has a "# " heading. The title is already the page\'s H1, so start sections at "## ".');

  let prev = 1;
  for (const [, n] of p.html.matchAll(/<h([2-6])[\s>]/g)) {
    const level = Number(n);
    if (level > prev + 1) fail(`heading levels skip from H${prev} to H${level}. Use "${'#'.repeat(prev + 1)} " instead.`);
    prev = level;
  }

  for (const [tag] of p.html.matchAll(/<img\b[^>]*>/g)) {
    const src = (/\ssrc="([^"]*)"/.exec(tag) || [])[1] || '';
    if (/\salt=""/.test(tag)) fail(`image ${src} has no alt text. Write it inside the brackets: ![what the image shows](${src})`);
    if (src.startsWith('/') && !fs.existsSync(localPath(src))) fail(`image ${src} doesn't exist`);
  }
  if (data.image && data.image.startsWith('/') && !fs.existsSync(localPath(data.image))) fail(`image ${data.image} doesn't exist`);
  if (p.updated && p.updated < p.date) fail(`updated (${p.updated}) is before date (${p.date})`);

  if (p.words < SEO.minWords) warn(`only ${p.words} words. Short posts rarely rank. Aim for ${SEO.minWords}+.`);
  if (!/<a href="(\/|https:\/\/elenos\.ai)/.test(p.html)) warn('no links to other elenos.ai pages. Link a related post, /services/ or /work/ so search engines can follow it.');
  if (p.slug.length > SEO.slugMax) warn(`slug is ${p.slug.length} characters. Short URLs read better in search results.`);
  const card = p.imageSize;
  if (!card) warn('share image dimensions unknown. Social cards want 1200x630.');
  else if (card.w < 1200 || Math.abs(card.w / card.h - 1.905) > 0.1) {
    warn(`share image is ${card.w}x${card.h}. Social cards want 1200x630; run scripts/social-cards.js.`);
  }
}

function loadPosts() {
  const dir = path.join(ROOT, 'posts');
  const posts = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || name.startsWith('_')) continue;
    const file = `posts/${name}`;
    let parsed;
    try { parsed = parseFrontMatter(read(file), file); } catch (e) { problems.push(e.message); continue; }
    const { data, body } = parsed;

    for (const k of REQUIRED) if (!data[k]) problems.push(`${file}: missing "${k}"`);
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) problems.push(`${file}: date must be YYYY-MM-DD`);
    const slug = data.slug || name.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) problems.push(`${file}: slug "${slug}" must be lowercase-words-with-dashes`);
    if (data.updated && !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) problems.push(`${file}: updated must be YYYY-MM-DD`);
    if (data.draft === true || REQUIRED.some((k) => !data[k])) continue;

    const html = renderMarkdown(body);
    const text = plain(html);
    // Share image: the rendered card (scripts/social-cards.js) when present,
    // else the post's own image, else the site cover.
    const cardPath = `/images/blog/${slug}/card.png`;
    const imagePath = fs.existsSync(localPath(cardPath)) ? cardPath : data.image || '/images/og-cover.jpg';
    const post = {
      slug,
      file,
      title: data.title,
      seoTitle: data['seo-title'] || data.title,
      summary: data.summary,
      date: data.date,
      updated: data.updated || '',
      rung: data.rung || '',
      pillar: data.pillar || '',
      artifact: data.artifact || '',
      artifactLabel: data['artifact-label'] || '',
      image: new URL(imagePath, ORIGIN).href,
      imageSize: imageSize(imagePath),
      imageAlt: data['image-alt'] || data.title,
      thumb: data.image || '/images/og-cover.jpg',
      url: `${ORIGIN}/blog/${slug}/`,
      html,
      text,
      words: text.split(' ').filter(Boolean).length,
    };
    seoCheck(post, data);
    posts.push(post);
  }
  const dupes = posts.map((p) => p.slug).filter((s, i, a) => a.indexOf(s) !== i);
  for (const d of new Set(dupes)) problems.push(`two posts share the slug "${d}"`);
  return posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** {{key}} substitution. Values are already-safe HTML. Unknown keys fail. */
function fill(tpl, values) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k) => {
    if (!(k in values)) throw new Error(`template token {{${k}}} has no value`);
    return values[k];
  });
}

/** The artifact link is the receipt: the real thing the post documents. */
function artifactBlock(p) {
  if (!p.artifact) return '';
  let host = p.artifact;
  try { host = new URL(p.artifact).host.replace(/^www\./, ''); } catch (_) { /* relative link */ }
  const label = p.artifactLabel || host;
  const external = /^https?:/.test(p.artifact);
  return `<a class="post-artifact" href="${esc(p.artifact)}"${external ? ' target="_blank" rel="noopener"' : ''}><span class="post-artifact-k">The artifact</span><span class="post-artifact-v">${esc(label)} ${external ? '↗' : '→'}</span></a>`;
}

const jsonLd = (data) => JSON.stringify(data, null, 2).replace(/<\//g, '<\\/');

const AUTHOR = { '@type': 'Person', '@id': `${ORIGIN}/about/#edward`, name: 'Edward Jones', url: `${ORIGIN}/about/`, image: `${ORIGIN}/images/ed.jpg`, jobTitle: 'Founder' };
const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${ORIGIN}/#organization`,
  name: 'Elenos',
  url: `${ORIGIN}/`,
  logo: { '@type': 'ImageObject', url: `${ORIGIN}/images/E.png`, width: 1254, height: 1254 },
  sameAs: ['https://www.instagram.com/elenos.ai', 'https://www.facebook.com/profile.php?id=61590983014169', 'https://x.com/elenos_ai'],
};
const BLOG_DESCRIPTION = 'Build logs from a software studio. What we built, what broke, and how we got around it.';

function postJsonLd(p) {
  const image = { '@type': 'ImageObject', url: p.image };
  if (p.imageSize) Object.assign(image, { width: p.imageSize.w, height: p.imageSize.h });
  return jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${p.url}#article`,
        headline: p.title,
        description: p.summary,
        datePublished: isoTime(p.date),
        dateModified: isoTime(p.updated || p.date),
        url: p.url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
        image,
        wordCount: p.words,
        inLanguage: 'en-US',
        author: AUTHOR,
        publisher: PUBLISHER,
        isPartOf: { '@type': 'Blog', '@id': `${ORIGIN}/blog/#blog`, name: 'Elenos Blog', url: `${ORIGIN}/blog/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: p.title, item: p.url },
        ],
      },
    ],
  });
}

function blogJsonLd(posts) {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${ORIGIN}/blog/#blog`,
    name: 'Elenos Blog',
    description: BLOG_DESCRIPTION,
    url: `${ORIGIN}/blog/`,
    inLanguage: 'en-US',
    publisher: PUBLISHER,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${p.url}#article`,
      headline: p.title,
      url: p.url,
      datePublished: isoTime(p.date),
      dateModified: isoTime(p.updated || p.date),
      author: { '@id': AUTHOR['@id'] },
    })),
  });
}

/** Title tag: brand suffix only when it still fits in a search result. */
const titleTag = (p) => (`${p.seoTitle} · Elenos`.length <= SEO.titleMax ? `${p.seoTitle} · Elenos` : p.seoTitle);

const listItem = (p, i) => `            <li class="writing-item reveal" data-delay="${Math.min(i, 5) * 60}">
                <a href="/blog/${p.slug}/">
                    <time datetime="${p.date}">${shortDate(p.date)}</time>
                    <span class="writing-title">${esc(p.title)}</span>
                    <span class="writing-summary">${esc(p.summary)}</span>
                    <span class="writing-arrow" aria-hidden="true">→</span>
                </a>
            </li>`;

/** /blog/ leads with the newest post as a large card; the rest list below it. */
const featuredCard = (p) => `        <section class="blog-feature-wrap" aria-label="Latest post">
            <a class="blog-feature reveal" href="/blog/${p.slug}/">
                <div class="blog-feature-art">
                    <img src="${esc(p.thumb)}" alt="" loading="eager">
                </div>
                <div class="blog-feature-body">
                    <span class="blog-feature-kicker">Latest · <time datetime="${p.date}">${shortDate(p.date)}</time></span>
                    <h2 class="display">${esc(p.title)}</h2>
                    <p>${esc(p.summary)}</p>
                    <span class="blog-feature-go">Read the post <span class="btn-arrow">→</span></span>
                </div>
            </a>
        </section>`;

function feedXml(posts) {
  const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${esc(p.summary)}</description>
      <content:encoded><![CDATA[${p.html.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Elenos · Blog</title>
    <link>${ORIGIN}/blog/</link>
    <atom:link href="${ORIGIN}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>What we built, what broke, and how we got around it.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
}

function postsJson(posts) {
  return JSON.stringify({
    version: 1,
    posts: posts.map(({ slug, url, title, summary, date, rung, pillar, artifact, image, html, text }) =>
      ({ slug, url, title, summary, date, rung, pillar, artifact, image, html, text })),
  }, null, 2) + '\n';
}

/** Replace what sits between <!-- @name --> and <!-- /@name -->. */
function between(file, name, inner, content) {
  const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?([ \\t]*<!-- /@${name} -->)`);
  if (!re.test(content)) throw new Error(`${file} is missing the <!-- @${name} --> markers`);
  return content.replace(re, (_m, open, close) => `${open}\n${inner}\n${close}`);
}

const NAV = read('partials/nav.html').replace(/\r\n/g, '\n').replace(/\s+$/, '');
const FOOTER = read('partials/footer.html').replace(/\r\n/g, '\n').replace(/\s+$/, '');

/** Drop the shared nav and footer into a page, if it opted in with markers. */
function chrome(html) {
  for (const [name, part] of [['nav', NAV], ['footer', FOOTER]]) {
    const re = new RegExp(`([ \\t]*<!-- @chrome:${name} -->)[\\s\\S]*?([ \\t]*<!-- /@chrome:${name} -->)`);
    html = html.replace(re, (_m, open, close) => `${open}\n${part}\n${close}`);
  }
  return html;
}

/** Every hand-written page in the site, skipping generated and app folders. */
function sitePages(dir = '') {
  const skip = new Set(['blog', 'web', 'node_modules', 'templates', 'partials', 'scripts', 'posts', '.git', '.github']);
  const out = [];
  for (const d of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${d.name}` : d.name;
    if (d.isDirectory() && !skip.has(d.name)) out.push(...sitePages(rel));
    else if (d.isFile() && d.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

const drift = [];
let wrote = 0;

function emit(rel, content) {
  const abs = path.join(ROOT, rel);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  // Match the file's existing line endings so git doesn't see a rewrite.
  if (current && current.includes('\r\n')) content = content.replace(/\r?\n/g, '\r\n');
  if (current === content) return;
  if (CHECK) { drift.push(rel); return; }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log('  wrote ' + rel);
  wrote++;
}

const posts = loadPosts();
if (warnings.length) console.warn('SEO warnings (not blocking):\n  ' + warnings.join('\n  '));
if (problems.length) {
  console.error('Post problems:\n  ' + problems.join('\n  ') + '\n\nSee posts/_template.md.');
  process.exit(1);
}

const postTpl = read('templates/blog-post.html');
for (const p of posts) {
  emit(`blog/${p.slug}/index.html`, chrome(fill(postTpl, {
    title: esc(p.title),
    titleTag: esc(titleTag(p)),
    summary: esc(p.summary),
    url: p.url,
    image: esc(p.image),
    imageMeta: p.imageSize
      ? `<meta property="og:image:width" content="${p.imageSize.w}">\n    <meta property="og:image:height" content="${p.imageSize.h}">\n    `
      : '',
    imageAlt: esc(p.imageAlt),
    date: p.date,
    published: isoTime(p.date),
    modified: isoTime(p.updated || p.date),
    dateLong: longDate(p.date),
    updatedLine: p.updated && p.updated !== p.date
      ? `\n                    <span aria-hidden="true">·</span>\n                    <span>Updated <time datetime="${p.updated}">${longDate(p.updated)}</time></span>`
      : '',
    artifact: artifactBlock(p),
    body: p.html,
    jsonLd: postJsonLd(p),
    source: p.file,
  })));
}

// Stale post pages (renamed or unpublished posts) are removed so they 404.
const live = new Set(posts.map((p) => p.slug));
if (fs.existsSync(path.join(ROOT, 'blog'))) {
  for (const d of fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })) {
    if (d.isDirectory() && !live.has(d.name)) {
      if (CHECK) drift.push(`blog/${d.name}/ (stale)`);
      else { fs.rmSync(path.join(ROOT, 'blog', d.name), { recursive: true }); console.log(`  removed blog/${d.name}/`); wrote++; }
    }
  }
}

const empty = `            <li class="writing-empty">The first write-up is on its way. Leave your email below and it'll come to you.</li>`;
const older = posts.slice(1);
const listSection = (head, items) => `        <section class="writing-list-wrap" aria-label="${head}">
            <h2 class="writing-list-head">${head}</h2>
            <ol class="writing-list">
${items}
            </ol>
        </section>`;
emit('blog/index.html', chrome(fill(read('templates/blog-index.html'), {
  description: esc(BLOG_DESCRIPTION),
  jsonLd: blogJsonLd(posts),
  featured: posts.length ? featuredCard(posts[0]) : '',
  list: !posts.length ? listSection('Posts', empty)
    : older.length ? listSection('Earlier posts', older.map(listItem).join('\n'))
    : '',
})));
emit('blog/feed.xml', feedXml(posts));
emit('blog/posts.json', postsJson(posts));

const latest = posts.slice(0, LATEST_ON_HOME);
for (const page of sitePages()) {
  let html = chrome(read(page).replace(/\r\n/g, '\n'));
  if (page === 'index.html') {
    html = between(page, 'blog:latest', latest.length ? latest.map(listItem).join('\n') : empty, html);
  }
  emit(page, html);
}

// An `updated` date bumps lastmod, which is what gets a refreshed post recrawled.
const modified = (p) => p.updated || p.date;
const lastmod = posts.length ? posts.map(modified).sort().pop() : '2026-10-03';
const sitemapEntries = [{ loc: `${ORIGIN}/blog/`, lastmod }, ...posts.map((p) => ({ loc: p.url, lastmod: modified(p) }))]
  .map((e) => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`).join('\n');
emit('sitemap.xml', between('sitemap.xml', 'blog:sitemap', sitemapEntries, read('sitemap.xml').replace(/\r\n/g, '\n')));

if (CHECK) {
  if (drift.length) {
    console.error('Out of date, run `node build.js`:\n  ' + drift.join('\n  '));
    process.exit(1);
  }
  console.log('check: clean');
} else {
  console.log(`${posts.length} post${posts.length === 1 ? '' : 's'} · ${wrote ? wrote + ' file(s) changed' : 'nothing changed'}`);
}
