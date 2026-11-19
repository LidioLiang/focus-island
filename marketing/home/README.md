# Focus Isle approved homepage

Approved midnight-coast design, 2026-11-19. Six owner-supplied reviews are displayed in the original order, with five stars and owner-confirmed Verified status. Stock portraits remain labeled illustrative. Other marketing pages and the same-origin `/app` routing remain unchanged.

`index.html` and `assets/` are the publishable source. `scripts/build-marketing.mjs` copies them after generating the secondary marketing pages. Asset names are content hashes; update HTML references when replacing CSS, JavaScript, images or audio.

The embedded focus widget reuses `formatTime` and `syncTimerFromClock` from app.js, SVG icons from minimal-mvp.js, and MobileSceneRotation from the mobile app, with an isolated website adapter. It never creates account sessions or history. Music is a 60-second excerpt of the existing app track; forest ambience is the original app audio. Both play only during running focus sessions. Images come from existing app assets and app-bundle captures.

Validation: six visible reviews, seven FAQ entries, no expansion control, indexable metadata, public media URLs compatible with production CSP, and preserved app/auth/API routes. Desktop and mobile visual verification and live deployment results are recorded in the task delivery.
