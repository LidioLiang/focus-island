# Ocean-blue Focus Isle icon

The website now uses the user-approved blue island and countdown-ring icon, matching the iPhone/iPad app. Updated homepage and Journal header/footer marks, shared secondary-page branding, Next.js metadata icons, favicon, Apple touch icon, and home-screen manifest icons. Versioned image paths avoid stale icon URLs. The manifest opens the existing `/app` entry; it adds no service worker or offline claims.

Source artwork: the final image_gen master approved in the Focus Isle project; all web PNGs are resized exports of the same app icon, not redrawn substitutes. Homepage and Journal layouts, article content, scene images, account APIs and billing remain as in production commit `74d1e17dbaf5b3603d64b2a2d6cda280b712bb0e`.

Validation: lint, typecheck, 145 Node tests and production build passed; repository guard and whitespace checks passed. Local HTTP checks verified icon metadata across all 12 marketing pages and `/app`, `/privacy`, `/terms`, plus successful responses for the favicon, touch icon, manifest and referenced assets. Chrome verified the new header/footer marks on the homepage and Journal. Production deployment and live-domain checks follow the PR merge.
