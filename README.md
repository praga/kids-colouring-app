# Kids Colouring Book 🎨

A fun, kid-friendly web application colouring book designed for a 5-year-old on an **Android Lenovo Xiaoxin GT 2025 tablet** using the **Lenovo Original Xiaoxin Stylus Pen** (Bluetooth connection, 4096 levels of pressure sensitivity).

Built with the digitizer coalesced pointer and palm rejection technology proven in the Kumon `kid-learning` project.

---

## Features

- **Kumon-Proven Palm Rejection**:
  - Automatically identifies hardware stylus (`pointerType === 'pen'`) vs touch/palm (`pointerType === 'touch'`).
  - Ignores resting palm touches on the tablet screen when drawing.
  - Tactile kid-friendly toggle ("✍️ Pen Guard ON" vs "👆 Touch & Pen Mode") for finger-painting.
- **Lenovo Xiaoxin Stylus Pen 4096 Levels of Pressure Sensitivity**:
  - High-frequency sampling via `nativeEvent.getCoalescedEvents()` (supports 120Hz-240Hz screen digitizers).
  - Lift-off hooklet damping: cancels false flick artifacts when lifting pen tip.
  - Tailored pressure dynamics:
    - 🖍️ **Crayon**: soft wax texture with pressure-responsive opacity & line width.
    - 🖌️ **Paintbrush**: wide dynamic range for expressive brush strokes.
    - 🖊️ **Marker**: uniform vibrant rounded ink with soft build-up.
    - ✨ **Magic Sparkle Pen**: twinkling star bursts with magical sound effects.
    - 🪣 **Paint Bucket**: smart flood fill to black outline boundaries.
    - 🧼 **Eraser**: clean erasing with multiple brush sizes.
- **Dual-Layer Line Art (`mix-blend-mode: multiply`)**:
  - The black line art is layered crisply over the child's colouring, so she never accidentally erases the character's face or outlines.
- **100% Offline PWA & Auto-Save**:
  - Service Worker (`sw.js`) caches all assets, icons, sounds, and pages.
  - IndexedDB (`kids_colouring_db`) auto-saves her artwork so she never loses progress.
- **Offline Web Audio Synthesizer**:
  - Playful sound effects (bubble pops, splashes, chimes, celebration fanfare) generated dynamically without external MP3 files.
- **Antigravity-Managed Pages (No in-app clutter)**:
  - No complex file pickers or upload menus for the child.
  - Pre-created pages (`.png`, `.jpg`, `.svg`) are placed directly in `public/colouring-pages/`.

---

## Adding Colouring Pages from Antigravity

In future Antigravity sessions, to add new colouring pages:
1. Save your `.png`, `.jpg`, or `.svg` colouring images into `public/colouring-pages/`.
2. Run the sync script:
   ```bash
   npm run sync-pages
   ```
3. The app automatically updates `pages.json` with titles, categories, and thumbnail cards on the bookshelf!

---

## Development & Testing

```bash
# Start local development server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```

---

## Docker & Portainer Deployment

Deploy on your local server (or NAS) via Portainer or Docker Compose on port `8086`:

```bash
docker compose up -d --build
```

Access at `http://<your-server-ip>:8086`. On the Lenovo tablet, tap **Add to Home screen** in Chrome to run as a full-screen standalone tablet app!
