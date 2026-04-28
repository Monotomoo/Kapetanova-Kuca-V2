# Wine Cellar — Vinski Podrum (Module 1)

> First new module on Kapetanova Kuca V3 post-architecture-plan.
> Approved 2026-04-27. Sequencing in `C:\Users\Tomo\.claude\plans\hey-run-a-full-glimmering-dolphin.md`.

---

## TASK
Add a Wine Cellar module to the Kapetanova Kuca Waitlist app — a browseable catalog with mood-and-filter discovery, 5-axis radar taste profiles, and a Vinski Kovčeg box-order system (3 / 6 / 12 bottle tiers, curated or free-fill, smart suggestions, inline comparison) for 10-minute takeaway pickup at the bar.

## CONTEXT
- **Why**: extends the restaurant app from "wait for your table" into a brand-defining gift-shop experience. Box orders are a new revenue stream and a souvenir mechanic that takes the restaurant home with the guest.
- **Who**:
  - Guests in the waitlist or with a booking — browse-while-waiting + souvenir orders
  - Walk-ins ordering a souvenir box without a reservation
  - Restaurant staff — admin tab for catalog + order management
- **Where**: `D:\CLAUDE PROJECTS\Kapetanova Kuca V3` (existing waitlist app). New module file `modules/wine.js` after the architecture-plan refactor.
- **Connects to**:
  - Existing Firestore (`waitlist`, `bookings`); new collections `wines`, `wineOrders`, doc `config/wines`
  - Existing UI primitives — mode-tab pattern, `.conf-hero` confirmation, design tokens, hash router
  - Future Ostrea Club module — schema fields `memberExclusive`, `memberDiscountPct` reserved on each wine, UI hidden V1
  - Excel shift export — adds a 4th sheet "Narudžbe vina"

## CONSTRAINTS
- **Tech**: vanilla HTML + CSS + JS, no build step. Firebase compat SDK Firestore. xlsx-js-style. Refactor-first to multi-script-tag layout (`core.js`, `data/firestore.js`, `modules/shared-ui.js`, `modules/<name>.js`, `i18n/hr.js`).
- **Out-of-scope V1**:
  - In-app payment (pay at pickup, cash/card)
  - Bottle images / asset pipeline (typography-driven cards)
  - Stock decrement / inventory enforcement (`souvenirStock` exists but not enforced)
  - English UI (i18n layer extracted, EN deferred)
  - Member-exclusive UI (schema fields land V1, surfaces in Ostrea Club module)
  - Stripe / online checkout
  - Push notifications when box is ready
- **Non-negotiables**:
  - Croatian UI throughout; Croatian copy strings in this spec are illustrative — Tomo reviews tone before ship
  - Works on iPhone Safari + Android Chrome (real-device smoke test before each session marked done)
  - Reuses existing CSS tokens (ocean/sky palette, radii, typography); adds only one warm accent per wine style
  - Reuses existing patterns: hash router, mode tabs, `.conf-hero`, 20s auto-dismiss countdown
  - Firestore rules become real before any new collection is writable in production (architecture-plan R1 + R2 — currently parked per user direction)
- **Budget**: 10 working sessions to V1 ship — S1 refactor → S10 polish + smoke test. Honest ceiling, not aspirational.

## OUTPUT

### Files

**Refactor (S1):**
- `core.js` — App namespace, event bus, `h()` tagged-template helper, lifted `esc()` from `app.js:438`
- `data/firestore.js` — low-level CRUD + listener registry + error wrapper
- `modules/shared-ui.js` — party stepper, contact icons, `.conf-hero` template, form helpers
- `modules/waitlist.js` — migrated from `app.js`
- `modules/bookings.js` — migrated from `app.js`
- `i18n/hr.js` — Croatian strings + `t()` helper
- `app.js` — slimmed to boot + router only
- `index.html` — script-tag order updated

**Wine module (S2–S10):**
- `modules/wine.js` (catalog, browse, detail, box, suggestions, comparison)
- `modules/wine-orders.js` (order flow + admin orders panel) — split from `wine.js` if it grows past ~600 lines
- `i18n/hr.js` extended
- `firestore.rules` extended for `wines`, `wineOrders`, `config/wines`
- `index.html` — third guest mode tab, new admin tab + sub-tabs, mount points
- `styles.css` — wine-style warm accents, Vinski Kovčeg illustration, radar chart, slot grid

### Views

**Guest view — third mode tab "Vinski podrum":**
1. **Browse** — mood preset row → filter chip row (style/region/grape) → wine list (cards: name, producer, year, style chip, taste mini-bars, price, "Dodaj u kovčeg")
2. **Wine detail** — 5-axis radar (sweetness, freshness, dryness, fruitiness, body — each 0–100), tasting notes, prices (restoran + u aplikaciji), "Dodaj u kovčeg" + "Usporedi"
3. **Box** — two tabs: "Kurirano" | "Slobodan odabir"
4. **Box editor** (shared) — Vinski Kovčeg illustration with N slots, swap/empty slot UX, "Dovrši kovčeg" suggestions tray, "Usporedi" overlay when 2+, subtotal + tier discount + total, "Naruči kovčeg" CTA
5. **Checkout** — contact form (auto-filled if linked), notes, "Potvrdi narudžbu"
6. **Confirmation** — `.conf-hero` reuse, "Tvoj kovčeg bit će spreman za 10 minuta na šanku", 20s auto-dismiss

**Booking pre-order extension:**
- Existing booking confirmation gets a "Dodaj vino za rezervaciju" CTA → cellar opens in pre-order mode (à-la-carte at restaurant price, no box)

**Admin view — new top-level tab "Vinski podrum":**
- Sub-tabs: **Katalog** (wine CRUD with profile sliders + `pairsWith` picker), **Narudžbe** (today's orders by status with advance-status actions), **Postavke** (souvenirDiscountPct, boxTierDiscounts, curated-box authoring)

### Data

**`wines/{id}`**: name, producer, year, style, grapeVariety, region, country, barrel{type,months}, profile{sweetness,freshness,dryness,fruitiness,body}, tastingNotes, restaurantPrice, souvenirAvailable, souvenirStock, inStock, featured, pairsWith[], memberExclusive, memberDiscountPct, imageUrl?, createdAt, updatedAt

**`config/wines`**: souvenirDiscountPct, boxTierDiscounts{3,6,12}, curatedBoxes[{id,name,tier,theme,wineIds[]}], pickupEtaMinutes

**`wineOrders/{id}`**: boxTier, curatedBoxId?, bottles[{wineId,qty}], bottleSubtotal, boxTierDiscount, totalPrice, linkedTo{type,id?}, contact{name,phone,whatsapp?,email?}, status, pickupETA, pickedUpAt, notes, createdAt, updatedAt

## DONE-WHEN

**Refactor (S1):**
- [ ] `App.state` owns all module state; `window` audit shows only `App`, `firebase`, `XLSX` as non-standard globals
- [ ] Existing waitlist + bookings work identically on real iPhone Safari + Android Chrome
- [ ] PIN gate, hash router, Excel export, real-time sync still pass

**Catalog (S2):**
- [ ] Admin Katalog can add/edit/delete a wine including all profile sliders
- [ ] `wines` seeded with the 50 wines selected from Tomo's full list (Croatian-coastal lean, full sort range)
- [ ] `config/wines` exists with defaults and the 5 V1 curated boxes (see DECISIONS)

**Browse + detail + radar (S3–S4):**
- [ ] Third mode tab "Vinski podrum" appears in guest view
- [ ] Mood presets and filter chips compose correctly
- [ ] Wine detail shows 5-axis radar (CSS-only) and full info

**Box mechanic (S5–S6):**
- [ ] Free-fill mode: pick tier, fill slots, swap bottles
- [ ] Curated mode: list of curated boxes, tap opens editor pre-filled, swap works
- [ ] Subtotal + tier discount calculate per the locked formula

**Suggestions + comparison (S7):**
- [ ] Smart-blend suggestion engine ranks pairsWith > style balance > taste similarity
- [ ] "Usporedi" overlays 2–3 wines' radars side-by-side

**Order flow + admin (S8–S9):**
- [ ] Box submits to `wineOrders`, links to active waitlist/booking when available, standalone otherwise
- [ ] Confirmation reuses `.conf-hero`
- [ ] Admin Narudžbe lists today's orders by status, real-time, advance-status works
- [ ] Excel export adds "Narudžbe vina" sheet with today's orders only

**Booking pre-order + polish (S10):**
- [ ] Pre-order CTA on booking confirmation opens cellar in pre-order mode
- [ ] Pre-orders show on the booking record in admin
- [ ] Smoke test passes on real iPhone Safari + Android Chrome
- [ ] No console errors on load

## RESOLVED DECISIONS

- **Curated box themes** (Q1): V1 ships with five — *Klasici Dalmacije* (6), *Bijela kolekcija* (6), *Premium* (12), *Pjenušavi trenutci* (3), *Slatki završeci* (3). Compositions filled from Tomo's wine list at S2.
- **souvenirDiscountPct** (Q2): Tomo sets after seeing margins. Build defaults to **25%** for V1; lives in `config/wines.souvenirDiscountPct`, editable from admin Postavke without code changes.
- **Box tier discount %** (Q3): **+3% / +7% / +12%** for 3 / 6 / 12 box tiers (gentle quantity reward). Stored in `config/wines.boxTierDiscounts`, admin-editable.
- **Pickup ETA** (Q4): **Fixed at 10 minutes** for V1. Expose to admin in V1.5.
- **Wine list** (Q5): Tomo delivers inline; 50 wines selected from full list at S2 to cover variety (Croatian-coastal lean expected).

## ARCHITECTURE PARK LIST (per user direction "Firebase / Vercel / GitHub on the side")

These remain real but deferred during the wine cellar build. Re-engaged after V1 ships:
- R1 + R2: Firestore rules lockdown + Firebase Auth (staff magic-link, custom claim `role: 'staff'`)
- Production deploy (Firebase Hosting per architecture plan §6)
- git init + push to `Monotomoo/Kapetanova-Kuca-Waitlist`

R3 (timezone fix on `app.js:480`) is JS-only and rolls into S1 alongside the refactor.
