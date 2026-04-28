# Kapetanova Kuca Waitlist — V3 (Claude Code home)

Restaurant waitlist app for **Kapetanova Kuća** ("Captain's House"), a Croatian coastal restaurant. Originally forked from the shipped **Ostrea** waitlist pattern, then evolved with a Firestore backend, Excel export, and a staff PIN gate. Continuing development from Claude Code.

## Origin

- Copied 2026-04-27 from `D:\Antigravity Ostrea Table Management` (the **latest** Antigravity working folder, last touched 2026-04-16).
- That source folder is the live working copy in Antigravity — leave it as a fallback but consider it stale once V3 work begins.
- Earlier Mar 29 backup at `D:\Antigravity Ostrea Table Management - 29.3. Backup` is an older single-file snapshot; ignore it for current work.

## Tech

- **Multi-file vanilla JS app** — no build step, no bundler, no framework.
  - `index.html` (~21 KB) — markup + script tags
  - `styles.css` (~50 KB) — all styling
  - `app.js` (~55 KB) — all behavior
  - `firebase-config.js` — Firebase SDK init (project `kapetanova-kuca-waitlist`)
- **Firestore** (Firebase compat SDK v10.12.5, loaded via gstatic CDN) — replaces the old localStorage persistence; data is now multi-device + real-time.
- **xlsx-js-style** v1.2.0 (jsdelivr CDN) — powers an end-of-shift Excel export from admin.
- **No npm install** — open `index.html` in a browser, that's it.

## Architecture

- **Two views** in one HTML file: `#guest-view` (customer-facing) and `#admin-view` (staff dashboard).
- **Mode switcher** in guest view with tabs (`waitlist`, plus others — see `.mode-btn` elements).
- **Staff access gate** — 6-digit PIN screen guards admin entry. Strings indicate auth UI, but PIN value lives in `app.js`.
- **Cloud state** — waitlist + booking data persisted to Firestore. `firestore.rules` is the security boundary.

## Branding & locale

- Title (Croatian): `Kapetanova Kuća — Popis čekanja`. UI is Croatian (`<html lang="hr">`).
- Palette: ocean/sky in CSS vars (see `styles.css`).
- Fonts: Nunito (body), Cinzel (display), JetBrains Mono (mono) — Google Fonts.
- Logos: `Kapetan Logo.png` (primary), `Kralj Logo.webp` (secondary "Kralj"/king mark).

## Firebase project

- **Project ID**: `kapetanova-kuca-waitlist`
- **Hosting authDomain**: `kapetanova-kuca-waitlist.firebaseapp.com`
- API key + appId live in `firebase-config.js` (client-side, fine for Firebase web SDK; security enforced via `firestore.rules`).
- `.firebaserc` aliases `default → kapetanova-kuca-waitlist`. `firebase.json` holds hosting/Firestore CLI config.

## Status

- Code is current (last source change 2026-04-16). No code changes pending from migration itself.
- **No git** in this folder (skipped on copy — Antigravity copy still points to wrong remote `Monotomoo/Ostrea-Waiting-list`).
- **No GitHub repo** for Kapetanova Kuca yet.
- **Hosting**: not deployed via Firebase Hosting from this folder yet (although `firebase.json` is wired). Production target unclear — confirm with Tomo.

## Open / next

- When ready: `git init` → create `Monotomoo/Kapetanova-Kuca-Waitlist` GitHub repo → first commit → push.
- Decide deploy target: Firebase Hosting (already wired) vs. Vercel.
- Verify `firestore.rules` is restrictive enough for production.
- Confirm both logos still desired; confirm Kralj branding belongs alongside Kapetanova.
