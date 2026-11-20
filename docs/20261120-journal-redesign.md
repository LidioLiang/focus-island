# Journal redesign — 2026-11-20

- Rebuilt `/blog` as a compact image-and-text article list, following the Stakks blog structure and the approved Focus Isle homepage palette, font weights, navigation and footer.
- Reused existing café, forest and library artwork. No new article text or stock imagery was added.
- Restyled all three article pages with a narrow reading column, smaller headings, a back-to-Journal link and related articles excluding the current article.
- Preserved article URLs, content, canonical metadata, BlogPosting data, sitemap entries and same-origin `/app` entry links.
- Source: `marketing/journal.mjs` and `marketing/src/journal.css`; regenerated static pages are committed with their source.

Validation before release: `npm run check` passed (lint, types, 145 tests and production build); repository guard and diff whitespace checks passed. Desktop and 390px mobile layouts reviewed in Chrome; images loaded, article navigation worked, mobile menu opened and closed with Escape, and no horizontal overflow was observed. GitHub CI and Vercel production deployment are the release gates.
