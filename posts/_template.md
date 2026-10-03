---
# HOW TO PUBLISH
# 1. Copy this file to posts/<slug>.md. The filename is the URL:
#    posts/cloudflare-cpu-cap.md -> elenos.ai/blog/cloudflare-cpu-cap/
#    Files starting with _ never publish.
# 2. Fill in the fields, write the post, delete the draft line.
# 3. Push to main. The "Build blog" GitHub Action builds it and Vercel ships it.
#    To preview first: `node build.js`, then open blog/<slug>/index.html.
#
# Required: title, summary, date. The rest is optional.
#
# SEO. The build checks these and refuses to publish a post that fails:
#   title     60 characters max (Google cuts it off). Too clever to also say
#             what it's about? Keep it, and add a plain `seo-title` with the
#             words someone would actually search.
#   summary   50-160 characters. It's the snippet under the link in Google.
#   headings  Start at "## ". The title is the page's only H1. Don't skip
#             levels (## then ####).
#   images    Every image needs alt text describing what it shows, and the
#             file has to exist.
# It also warns (without blocking) under 300 words, when the post links to
# no other elenos.ai page, and when the share image isn't 1200x630.
# What compounds: link each new post to an older one and to /services/ or
# /work/, and when you refresh an old post, set `updated` so Google
# re-crawls it.

title: "Sentence case. Name the constraint, not the topic."
summary: "One line. Shows on the blog list, in search results and on social cards."
date: 2026-10-03
# seo-title: "Plain words people search, 60 characters max"   # optional, the search result title
# updated: 2026-10-10      # optional, set when you materially revise the post

# Internal. Not shown on the page, but kept in blog/posts.json for whatever
# cuts the post into carousels and threads later.
rung: functional          # surface | functional | financial | identity | future
pillar: expertise         # authority | relatability | expertise | credibility | urgency

# The receipt: a link to the real thing this post documents. A repo, a live
# URL, a screenshot. Shown under the headline as "The artifact".
artifact: https://github.com/edwardjones7/your-repo
# artifact-label: github.com/edwardjones7/your-repo   # optional display text

# slug: custom-url         # optional, overrides the filename
# image: /images/blog/card.png   # optional, the image on the blog list. The share
#                                  card is rendered by scripts/social-cards.js.
# image-alt: "What the share image shows"   # optional, defaults to the title
draft: true
---

Open with the constraint. A number if there is one.

## Section headings are H2s

Body copy is first person. The byline is Elenos, the prose is you.

```js
// Fenced code blocks get syntax highlighting.
const cpuCapMs = 10;
```

![Alt text](/images/blog/screenshot.png "A caption sits under the image")

![Alt text](/images/blog/wide.png "wide: Prefix the caption with wide: and the image breaks out wider than the text")

> A plain blockquote is a pull quote. Use one, at most.
