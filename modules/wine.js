// ═══════════════════════════════════════════════════
//  modules/wine.js — Wine Cellar (Vinski podrum)
//  V2 — Parchment / Maritime atlas direction
// ═══════════════════════════════════════════════════
//  Ported from `direction-c5-tablet-parchment.html` (Claude Design output).
//  V1 ocean-cards version archived at _archive/wine-v1-ocean-cards/.
//
//  This turn implements:
//   - Topbar (parchment masthead)
//   - Cat-hero (style tabs with glass icons) — PLACEHOLDER, Tomo still
//     iterating on the final top-section design
//   - Filter chips (Tijelo / Cijena / Uz jelo)
//   - Card grid (parchment cards with glyph, meta, pairing, dual price)
//   - Detail drawer (slides up from bottom, full-detail with story,
//     bars, serve specs, pairing menu, related wines)
//   - Chest FAB + wooden-chest drawer (real wooden box visual with
//     bottles in straw, brass corners, engraved nameplate)
//   - Overlaid spider chart for compare (when 2+ wines in chest)
//   - Toast notifications
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => (window.App && window.App.t) ? window.App.t(k, v) : k;

  // ─── Style mapping (from parchment direction) ────────────
  const STYLE_COLORS = {
    red:'#7a2230', white:'#9a7720', rose:'#c47a86',
    sparkling:'#d8a83a', dessert:'#a05428', orange:'#c5772d',
  };
  const STYLE_LABELS = {
    red:'Crveno', white:'Bijelo', rose:'Rosé',
    sparkling:'Pjenušac', dessert:'Desertno', orange:'Macerirano',
  };

  // ─── Body filter ─────────────────────────────────────────
  const BODY = [
    ['lagano',  'Lagano',  (w) => w.profile.body < 60],
    ['srednje', 'Srednje', (w) => w.profile.body >= 60 && w.profile.body < 78],
    ['mocno',   'Moćno',   (w) => w.profile.body >= 78],
  ];

  // ─── Tier filter ─────────────────────────────────────────
  const TIERS = ['€','€€','€€€','€€€€'];

  // ─── Pairing groups (food-pairing filter) ────────────────
  const PAIRING_GROUPS = [
    { id:'fish',    label:'Uz ribu',    match:(w) => /rib|hobotnic|ligan|brancin|orad|tuna|kamen|crni rižoto|skoljk|cevich|brodet|plodov|lignj/i.test((w.pairing || '') + ' ' + (w.dishes || []).join(' ')) },
    { id:'meat',    label:'Uz meso',    match:(w) => /janjet|pašticad|divlja|stek|steak|tagliata|bistecc|janj|tagliatell/i.test((w.pairing || '') + ' ' + (w.dishes || []).join(' ')) },
    { id:'cheese',  label:'Uz sir',     match:(w) => /sir|sirev|pršut|prsut/i.test((w.pairing || '') + ' ' + (w.dishes || []).join(' ')) },
    { id:'dessert', label:'Uz desert',  match:(w) => w.style === 'dessert' || /rožata|badem|tarta|smokv|čokolad/i.test((w.pairing || '') + ' ' + (w.dishes || []).join(' ')) },
    { id:'aper',    label:'Aperitiv',   match:(w) => w.style === 'sparkling' || w.style === 'rose' || /aperiti|carpacc/i.test((w.pairing || '') + ' ' + (w.dishes || []).join(' ')) },
  ];

  // ─── Tabs (style categories) ─────────────────────────────
  const TABS = [
    { id:'all',       label:'Sve' },
    { id:'red',       label:'Crveno' },
    { id:'white',     label:'Bijelo' },
    { id:'rose',      label:'Rosé' },
    { id:'sparkling', label:'Pjenušac' },
    { id:'orange',    label:'Maceriran.' },
    { id:'dessert',   label:'Desertno' },
  ];

  // ─── State ───────────────────────────────────────────────
  const state = {
    initialized: false,
    wines: [],
    config: null,
    activeTab: 'all',
    activeFilters: { tier: null, body: null, pair: null },
    chest: [],            // array of wine ids in the kovčeg
    openWineId: null,
    toastTimer: null,
  };

  // ═════════════════════════════════════════════════════════
  //  SVG factories
  // ═════════════════════════════════════════════════════════

  // Wine glass icon — distinct silhouette per style.
  // Different viewBox aspect ratios make each glass feel native to its wine:
  // bordeaux is tall + balloon, flute is narrow + tall, coupe is wide + shallow, etc.
  function glassIcon(style) {
    const fills = {
      red:'#7a2230', white:'#d8b53a', rose:'#e8a4a4',
      sparkling:'#f0d878', dessert:'#a05428', orange:'#c5772d',
    };

    switch (style) {
      case 'all':
        // Three small glasses representing variety (red, white, sparkling)
        return `<svg class="wc-glass wc-glass-all" viewBox="0 0 50 36">
          <!-- red mini -->
          <path d="M 4 4 Q 4 14 10 17 Q 16 14 16 4 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M 5.5 6 Q 5.5 13.5 10 16 Q 14.5 13.5 14.5 6 Z" fill="${fills.red}" opacity=".92"/>
          <line x1="10" y1="17" x2="10" y2="26" stroke="currentColor" stroke-width="1.3"/>
          <ellipse cx="10" cy="27.5" rx="4.5" ry="1" fill="none" stroke="currentColor" stroke-width="1.3"/>
          <!-- white middle -->
          <path d="M 21 3 Q 20 13.5 25 16 Q 30 13.5 29 3 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M 22 6 Q 21.5 13 25 15 Q 28.5 13 28 6 Z" fill="${fills.white}" opacity=".88"/>
          <line x1="25" y1="16" x2="25" y2="26" stroke="currentColor" stroke-width="1.3"/>
          <ellipse cx="25" cy="27.5" rx="4.5" ry="1" fill="none" stroke="currentColor" stroke-width="1.3"/>
          <!-- sparkling flute right -->
          <path d="M 36.5 3 L 41.5 3 L 41 16 Q 41 18 39 18 Q 37 18 37 16 L 36.5 3 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M 37 9 L 40.5 9 L 40.3 15.8 Q 40.3 17.5 39 17.5 Q 37.7 17.5 37.7 15.8 Z" fill="${fills.sparkling}" opacity=".92"/>
          <circle cx="38.5" cy="11.5" r=".55" fill="#fff" opacity=".8"/>
          <circle cx="39.6" cy="13.8" r=".45" fill="#fff" opacity=".8"/>
          <line x1="39" y1="18" x2="39" y2="26" stroke="currentColor" stroke-width="1.3"/>
          <ellipse cx="39" cy="27.5" rx="4" ry="1" fill="none" stroke="currentColor" stroke-width="1.3"/>
        </svg>`;

      case 'red': // Bordeaux balloon — tall, generous bowl
        return `<svg class="wc-glass" viewBox="0 0 36 50">
          <path d="M 5 4 Q 5 22 18 28 Q 31 22 31 4 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 6.8 8 Q 6.8 21 18 26.2 Q 29.2 21 29.2 8 Z" fill="${fills.red}" opacity=".94"/>
          <line x1="18" y1="28" x2="18" y2="44" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="18" cy="46" rx="9" ry="1.4" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      case 'white': // Slender tulip — narrower bowl
        return `<svg class="wc-glass" viewBox="0 0 30 50">
          <path d="M 6 4 Q 4 20 15 26 Q 26 20 24 4 Q 22 6 19 5 L 15 4.5 L 11 5 Q 8 6 6 4 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 7.5 9 Q 6.8 19 15 24 Q 23.2 19 22.5 9 Z" fill="${fills.white}" opacity=".9"/>
          <line x1="15" y1="26" x2="15" y2="44" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="15" cy="46" rx="8" ry="1.3" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      case 'rose': // Wide coupe-style bowl
        return `<svg class="wc-glass" viewBox="0 0 40 50">
          <path d="M 4 6 Q 4 18 20 23 Q 36 18 36 6 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 6 9 Q 6 17 20 21 Q 34 17 34 9 Z" fill="${fills.rose}" opacity=".92"/>
          <line x1="20" y1="23" x2="20" y2="44" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="20" cy="46" rx="9.5" ry="1.4" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      case 'sparkling': // Tall narrow flute with bubbles
        return `<svg class="wc-glass" viewBox="0 0 26 50">
          <path d="M 9 4 L 17 4 L 16.5 30 Q 16.5 33 13 33 Q 9.5 33 9.5 30 L 9 4 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 10 14 L 16 14 L 15.7 30 Q 15.7 32.4 13 32.4 Q 10.3 32.4 10.3 30 Z" fill="${fills.sparkling}" opacity=".94"/>
          <circle cx="11.5" cy="18" r=".9" fill="#fff" opacity=".8"/>
          <circle cx="14" cy="22" r=".75" fill="#fff" opacity=".8"/>
          <circle cx="12.2" cy="25.5" r=".65" fill="#fff" opacity=".8"/>
          <circle cx="14.3" cy="28" r=".55" fill="#fff" opacity=".8"/>
          <line x1="13" y1="33" x2="13" y2="44" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="13" cy="46" rx="6" ry="1.3" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      case 'orange': // Burgundy bowl — wide and slightly closed at top
        return `<svg class="wc-glass" viewBox="0 0 38 50">
          <path d="M 5 4 Q 3 18 19 25 Q 35 18 33 4 Q 32 8 27 6.5 L 19 7 L 11 6.5 Q 6 8 5 4 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 7 10 Q 6 18 19 23 Q 32 18 31 10 Z" fill="${fills.orange}" opacity=".9"/>
          <line x1="19" y1="25" x2="19" y2="44" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="19" cy="46" rx="9" ry="1.4" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      case 'dessert': // Small Port glass
        return `<svg class="wc-glass" viewBox="0 0 22 50">
          <path d="M 4 8 Q 4 18 11 21 Q 18 18 18 8 Q 17 9.5 15 9 L 11 8.5 L 7 9 Q 5 9.5 4 8 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M 5.5 11 Q 5.5 17 11 19 Q 16.5 17 16.5 11 Z" fill="${fills.dessert}" opacity=".92"/>
          <line x1="11" y1="21" x2="11" y2="42" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="11" cy="44" rx="6" ry="1.3" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;

      default:
        return `<svg class="wc-glass" viewBox="0 0 34 42">
          <path d="M 8 4 L 26 4 Q 26 16 21 22 Q 19 24 17 24 Q 15 24 13 22 Q 8 16 8 4 Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
          <line x1="17" y1="24" x2="17" y2="38" stroke="currentColor" stroke-width="1.4"/>
          <ellipse cx="17" cy="40" rx="7" ry="1.2" fill="none" stroke="currentColor" stroke-width="1.4"/>
        </svg>`;
    }
  }

  // Bottle SVG for inside the chest
  function bottleSVG(color) {
    return `<svg viewBox="0 0 42 104">
      <rect x="17" y="4" width="8" height="14" fill="#1a0e04"/>
      <rect x="16" y="17" width="10" height="2.5" fill="${color}"/>
      <path d="M 18 19 L 18 32 L 13 38 L 13 96 Q 13 100 17 100 L 25 100 Q 29 100 29 96 L 29 38 L 24 32 L 24 19 Z"
        fill="${color}" stroke="#1a0e04" stroke-width=".6"/>
      <path d="M 15 42 L 15 80" stroke="rgba(255,255,255,.25)" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="13" y="56" width="16" height="28" fill="#fdf4d6" stroke="#1a0e04" stroke-width=".4"/>
      <line x1="14" y1="60" x2="28" y2="60" stroke="${color}" stroke-width=".8"/>
      <line x1="15" y1="65" x2="27" y2="65" stroke="#8a6e3e" stroke-width=".3"/>
      <line x1="15" y1="68" x2="27" y2="68" stroke="#8a6e3e" stroke-width=".3"/>
      <line x1="15" y1="71" x2="27" y2="71" stroke="#8a6e3e" stroke-width=".3"/>
      <line x1="14" y1="80" x2="28" y2="80" stroke="${color}" stroke-width=".5"/>
    </svg>`;
  }

  // ─── Bottle silhouette per style — replaces the radar glyph on cards ──
  // Each wine gets a stylized inked bottle whose shape reflects its category:
  // Bordeaux (red), Burgundy (orange), Hock (white/rosé), Champagne (sparkling),
  // Half-bottle (dessert). Label panel shows the producer initial + year.
  function bottleSVG(wine, accent) {
    const style = wine.style;
    const year = wine.year ?? 'NV';
    const initial = producerInitial(wine.producer);

    let bodyPath, capBlock, labelY, labelH;
    if (style === 'sparkling') {
      // Champagne: thicker neck with wire muselet hint, sloped shoulders
      capBlock = `
        <rect x="20" y="2" width="10" height="3" fill="currentColor"/>
        <path d="M 19 5 L 31 5 L 30 16 L 20 16 Z" fill="currentColor" opacity=".55"/>
        <line x1="20" y1="11" x2="30" y2="11" stroke="currentColor" stroke-width="0.5" opacity=".6"/>
        <rect x="22" y="16" width="6" height="20" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
      bodyPath = 'M 22 36 Q 14 40 12 52 L 12 130 Q 12 134 16 134 L 34 134 Q 38 134 38 130 L 38 52 Q 36 40 28 36 Z';
      labelY = 78; labelH = 40;
    } else if (style === 'white' || style === 'rose') {
      // Hock-style: tall slender, sloped continuously
      capBlock = `
        <rect x="22" y="2" width="6" height="3" fill="currentColor"/>
        <path d="M 21 5 L 29 5 L 28 14 L 22 14 Z" fill="currentColor" opacity=".55"/>
        <rect x="22" y="14" width="6" height="22" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
      bodyPath = 'M 22 36 Q 16 38 14 48 L 14 130 Q 14 134 18 134 L 32 134 Q 36 134 36 130 L 36 48 Q 34 38 28 36 Z';
      labelY = 78; labelH = 40;
    } else if (style === 'orange') {
      // Burgundy: sloped shoulders, wider body
      capBlock = `
        <rect x="22" y="2" width="6" height="3" fill="currentColor"/>
        <path d="M 21 5 L 29 5 L 28 13 L 22 13 Z" fill="currentColor" opacity=".55"/>
        <rect x="22" y="13" width="6" height="20" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
      bodyPath = 'M 22 33 Q 13 38 11 52 L 11 130 Q 11 134 15 134 L 35 134 Q 39 134 39 130 L 39 52 Q 37 38 28 33 Z';
      labelY = 76; labelH = 40;
    } else if (style === 'dessert') {
      // Half-bottle: smaller, shorter neck
      capBlock = `
        <rect x="23" y="32" width="4" height="2" fill="currentColor"/>
        <path d="M 22 34 L 28 34 L 27 50 L 23 50 Z" fill="currentColor" opacity=".55"/>
        <rect x="23" y="50" width="4" height="14" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
      bodyPath = 'M 23 64 L 17 70 L 17 130 Q 17 134 21 134 L 29 134 Q 33 134 33 130 L 33 70 L 27 64 Z';
      labelY = 92; labelH = 32;
    } else {
      // Bordeaux (default red): straight shoulders
      capBlock = `
        <rect x="22" y="2" width="6" height="3" fill="currentColor"/>
        <path d="M 21 5 L 29 5 L 28 14 L 22 14 Z" fill="currentColor" opacity=".55"/>
        <rect x="22" y="14" width="6" height="22" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
      bodyPath = 'M 22 36 L 14 44 L 14 130 Q 14 134 18 134 L 32 134 Q 36 134 36 130 L 36 44 L 28 36 Z';
      labelY = 78; labelH = 40;
    }

    return `<svg viewBox="0 0 50 140" class="wc-card-bottle-svg" aria-hidden="true">
      ${capBlock}
      <path d="${bodyPath}" fill="${accent}" fill-opacity=".07" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Label panel -->
      <rect x="14" y="${labelY}" width="22" height="${labelH}" fill="rgba(255,250,235,0.88)" stroke="${accent}" stroke-width="0.5" stroke-opacity=".4"/>
      <line x1="17" y1="${labelY + 5}" x2="33" y2="${labelY + 5}" stroke="${accent}" stroke-width="0.5" opacity=".55"/>
      <text x="25" y="${labelY + labelH * 0.55}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${style === 'dessert' ? 11 : 13}" fill="${accent}" letter-spacing="0.04em">${esc(initial)}</text>
      <line x1="17" y1="${labelY + labelH - 9}" x2="33" y2="${labelY + labelH - 9}" stroke="${accent}" stroke-width="0.5" opacity=".55"/>
      <text x="25" y="${labelY + labelH - 3}" text-anchor="middle" font-family="Cinzel" font-weight="500" font-size="5.5" fill="${accent}" letter-spacing="0.18em">${esc(year)}</text>
    </svg>`;
  }

  // Producer initial — strips "Vinarija", "Vina", "PZ", "Family" prefixes
  function producerInitial(producer) {
    if (!producer) return '·';
    const skip = /^(vinarija|vina|family|pz|family|wines)$/i;
    const words = producer.split(/\s+/).filter(w => w && !skip.test(w));
    if (words.length === 0) return producer.charAt(0).toUpperCase();
    return words[0].charAt(0).toUpperCase();
  }

  // ─── Mood words — derived from top profile axes + style ─────────
  const MOOD_WORDS = {
    sweetness: () => 'MEDENO',
    freshness: (style) => style === 'sparkling' ? 'ŽIVAHNO'
                       : style === 'rose' ? 'LJETNO'
                       : 'SVJEŽE',
    dryness:   (style) => style === 'orange' ? 'MACERIRANO'
                       : style === 'red' ? 'STRUKTURIRANO'
                       : 'SUHO',
    fruitiness: () => 'VOĆNO',
    body:      (style) => style === 'red' ? 'MOĆNO'
                       : style === 'sparkling' ? 'BOGATO'
                       : 'PUNO',
  };
  // Returns the dominant axis word, plus a secondary word if the next-highest axis is also strong.
  function characteristicWords(wine) {
    const p = wine.profile;
    const axes = [
      ['sweetness',  p.sweetness],
      ['freshness',  p.freshness],
      ['dryness',    p.dryness],
      ['fruitiness', p.fruitiness],
      ['body',       p.body],
    ].sort((a, b) => b[1] - a[1]);

    const word = (axisName) => {
      const fn = MOOD_WORDS[axisName];
      return fn ? fn(wine.style) : null;
    };

    const primary = word(axes[0][0]) || 'ELEGANTNO';
    // Secondary only if it's >= 72 AND a different word from primary
    if (axes[1] && axes[1][1] >= 72) {
      const secondary = word(axes[1][0]);
      if (secondary && secondary !== primary) {
        return primary + ' · ' + secondary;
      }
    }
    return primary;
  }
  // Backwards-compat alias (not used after this refactor, but safe to keep)
  function characteristicWord(wine) { return characteristicWords(wine); }

  // First sentence of the tasting notes — for the card pull-quote
  function shortNote(notes) {
    if (!notes) return '';
    const trimmed = notes.trim();
    const idx = trimmed.search(/\.\s/);
    if (idx > 0 && idx < 110) return trimmed.slice(0, idx + 1);
    if (trimmed.length <= 120) return trimmed;
    return trimmed.slice(0, 100).split(' ').slice(0, -1).join(' ') + '…';
  }

  // Pick a pairing icon for the card by matching the wine's pairing text
  // against the existing PAIRING_GROUPS rules. Same icon system as filter chips.
  function pairIconForCard(wine) {
    for (const g of PAIRING_GROUPS) {
      if (g.match && g.match(wine)) return pairIcon(g.id);
    }
    return '';
  }

  // Overlay spider chart for chest comparison (multiple wines)
  function overlaySpider(wines, size = 240) {
    const cx = size / 2, cy = size / 2, R = size / 2 - 26;
    const labels = ['SL','SV','SU','VO','TI'];
    let s = '';
    [.25,.5,.75,1].forEach(rr => {
      s += `<circle cx="${cx}" cy="${cy}" r="${(R * rr).toFixed(1)}" fill="none" stroke="rgba(195,149,54,.25)" stroke-width=".5" stroke-dasharray="${rr < 1 ? '2 3' : ''}"/>`;
    });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R).toFixed(1)}" stroke="rgba(195,149,54,.2)" stroke-width=".5"/>`;
    }
    wines.forEach(w => {
      const c = STYLE_COLORS[w.style];
      const ax = [w.profile.sweetness, w.profile.freshness, w.profile.dryness, w.profile.fruitiness, w.profile.body];
      const pts = ax.map((v, i) => {
        const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
        const r = R * v / 100;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      });
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
      s += `<path d="${d}" fill="${c}33" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`;
    });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const lr = R + 12;
      const lx = cx + Math.cos(a) * lr;
      const ly = cy + Math.sin(a) * lr + 4;
      s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="11" fill="#e0b85a">${labels[i]}</text>`;
    }
    return `<svg viewBox="0 0 ${size} ${size}">${s}</svg>`;
  }

  // ═════════════════════════════════════════════════════════
  //  Filter pipeline
  // ═════════════════════════════════════════════════════════
  function entries() {
    return state.wines.filter(w => {
      if (!w.inStock) return false;
      if (state.activeTab !== 'all' && w.style !== state.activeTab) return false;
      if (state.activeFilters.tier && w.tier !== state.activeFilters.tier) return false;
      if (state.activeFilters.body) {
        const f = BODY.find(b => b[0] === state.activeFilters.body);
        if (f && !f[2](w)) return false;
      }
      if (state.activeFilters.pair) {
        const p = PAIRING_GROUPS.find(x => x.id === state.activeFilters.pair);
        if (p && !p.match(w)) return false;
      }
      return true;
    });
  }

  // ═════════════════════════════════════════════════════════
  //  Render — Browse view
  // ═════════════════════════════════════════════════════════
  function renderBrowse() {
    const root = $('wine-browse-screen');
    if (!root) return;
    root.innerHTML = `
      <div class="wc-stage">
        <div class="wc-stage-chart" aria-hidden="true">${chartSVG()}</div>
        <div class="wc-sheet">

          <section class="wc-hero" aria-label="Kapetanova Kuća — Vinski podrum">
            <svg class="wc-hero-compass" viewBox="-150 -150 300 300" aria-hidden="true">
              <defs>
                <radialGradient id="wc-hero-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stop-color="rgba(195,149,54,0.22)"/>
                  <stop offset="100%" stop-color="rgba(195,149,54,0)"/>
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="125" fill="url(#wc-hero-glow)"/>
              <circle cx="0" cy="0" r="128" fill="none" stroke="rgba(195,149,54,0.42)" stroke-width="0.7"/>
              <circle cx="0" cy="0" r="120" fill="none" stroke="rgba(195,149,54,0.22)" stroke-width="0.5"/>
              <circle cx="0" cy="0" r="55"  fill="none" stroke="rgba(195,149,54,0.25)" stroke-width="0.5" stroke-dasharray="2 3"/>
              <!-- 8 rays -->
              <g stroke="rgba(195,149,54,0.35)" stroke-width="1">
                <line x1="0"    y1="-120" x2="0"    y2="-58"/>
                <line x1="84"   y1="-84"  x2="42"   y2="-42"/>
                <line x1="120"  y1="0"    x2="58"   y2="0"/>
                <line x1="84"   y1="84"   x2="42"   y2="42"/>
                <line x1="0"    y1="120"  x2="0"    y2="58"/>
                <line x1="-84"  y1="84"   x2="-42"  y2="42"/>
                <line x1="-120" y1="0"    x2="-58"  y2="0"/>
                <line x1="-84"  y1="-84"  x2="-42"  y2="-42"/>
              </g>
              <!-- Compass star at center -->
              <polygon points="0,-26 9,-9 26,0 9,9 0,26 -9,9 -26,0 -9,-9"
                fill="rgba(195,149,54,0.45)" stroke="rgba(110,82,26,0.55)" stroke-width="0.6"/>
              <!-- Wine-red North tip -->
              <polygon points="0,-50 5,-26 -5,-26" fill="rgba(122,34,48,0.6)"/>
              <!-- Cardinal labels -->
              <g font-family="Cinzel, serif" font-weight="700" font-size="12" fill="rgba(74,44,20,0.55)" text-anchor="middle" letter-spacing="2">
                <text x="0"    y="-135">N</text>
                <text x="138"  y="5">E</text>
                <text x="0"    y="146">S</text>
                <text x="-138" y="5">W</text>
              </g>
            </svg>

            <div class="wc-hero-content">
              <div class="wc-hero-inscription">Per Mare &nbsp;·&nbsp; Per Vinum</div>

              <div class="wc-hero-rule-row">
                <span class="wc-hero-rule"></span>
                <span class="wc-hero-rule-glyph">⚓</span>
                <span class="wc-hero-rule"></span>
              </div>

              <h1 class="wc-hero-title"><span class="wc-hero-title-inner">VINSKI PODRUM</span></h1>
              <div class="wc-hero-subtitle">Carta Vinaria — Kapetanova Kuća</div>

              <div class="wc-hero-rule-row">
                <span class="wc-hero-rule"></span>
                <span class="wc-hero-rule-glyph">⚓</span>
                <span class="wc-hero-rule"></span>
              </div>

              <p class="wc-hero-paragraph">Stoljećima Mali Ston gleda na more s peljeških padina. Naš podrum okuplja blago hrvatskih vinograda — pošip s korčulanskog pijeska, plavac sa stijena Pelješca, malvasiju iz Konavla — i miješa ih sa svjetskim klasikom. <em>Svaka boca priča svoje stoljeće.</em></p>

              <div class="wc-hero-ledger">
                <span>42°51′N · 17°41′E</span>
                <span class="wc-hero-ledger-dot"></span>
                <span>Mali Ston · MMXXVI</span>
                <span class="wc-hero-ledger-dot"></span>
                <span>Br. III · Vol. I</span>
              </div>
            </div>
          </section>

          <!-- Top section (cat-hero + filters) — placeholder until Tomo's final top design lands -->
          <div class="wc-cat-hero">
            <div class="wc-cat-head">
              <h2>Po vrsti vina</h2>
              <span class="wc-live"><b id="wc-live-count">0</b>etiketa</span>
            </div>
            <div class="wc-cat-tabs" id="wc-tabs"></div>
          </div>

          <div class="wc-filters" id="wc-filters"></div>

          <div class="wc-strip">
            <span class="wc-strip-count"><b id="wc-list-count">0</b><span class="wc-strip-count-lbl">vina na karti</span></span>
            <span class="wc-strip-save"><b>−25%</b><span class="wc-strip-save-lbl">u aplikaciji</span></span>
          </div>

          <div class="wc-grid" id="wc-grid"></div>
        </div>
      </div>
    `;
    renderTabs();
    renderFilters();
    renderGrid();
  }

  function renderTabs() {
    const wrap = $('wc-tabs');
    if (!wrap) return;
    wrap.innerHTML = '';
    TABS.forEach(tab => {
      const count = tab.id === 'all' ? state.wines.length :
                    state.wines.filter(w => w.style === tab.id).length;
      const btn = document.createElement('button');
      btn.className = 'wc-ctab' + (state.activeTab === tab.id ? ' active' : '');
      btn.dataset.id = tab.id;
      btn.innerHTML = `${glassIcon(tab.id)}<span class="wc-ctab-lbl">${tab.label}</span><span class="wc-ctab-ct">${count}</span>`;
      btn.onclick = () => { state.activeTab = tab.id; renderTabs(); renderGrid(); };
      wrap.appendChild(btn);
    });
  }

  // ─── Body weight pictogram (•, ••, •••) ─────────────────
  function bodyDots(id) {
    const n = id === 'lagano' ? 1 : id === 'srednje' ? 2 : 3;
    const w = 4 + (n - 1) * 6 + 4; // viewBox width: 4px padding + 6px per extra dot
    let s = `<svg viewBox="0 0 ${w} 6" class="wc-body-dots" aria-hidden="true">`;
    for (let i = 0; i < n; i++) s += `<circle cx="${4 + i * 6}" cy="3" r="2" fill="currentColor"/>`;
    s += '</svg>';
    return s;
  }

  // ─── Background nautical chart (used in both dark and parchment themes) ─
  // Color comes from CSS `currentColor` on the wrapper, so the same SVG
  // adapts to whichever theme it sits in.
  function chartSVG() {
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="wcChartHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="currentColor" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#wcChartHalo)"/>

      <!-- Lat/long grid -->
      <g stroke="currentColor" stroke-width="0.5" opacity="0.55">
        <line x1="0"    y1="125"  x2="1600" y2="125"/>
        <line x1="0"    y1="275"  x2="1600" y2="275"/>
        <line x1="0"    y1="425"  x2="1600" y2="425"/>
        <line x1="0"    y1="575"  x2="1600" y2="575"/>
        <line x1="0"    y1="725"  x2="1600" y2="725"/>
        <line x1="0"    y1="875"  x2="1600" y2="875"/>
        <line x1="125"  y1="0"    x2="125"  y2="1000"/>
        <line x1="275"  y1="0"    x2="275"  y2="1000"/>
        <line x1="425"  y1="0"    x2="425"  y2="1000"/>
        <line x1="575"  y1="0"    x2="575"  y2="1000"/>
        <line x1="725"  y1="0"    x2="725"  y2="1000"/>
        <line x1="875"  y1="0"    x2="875"  y2="1000"/>
        <line x1="1025" y1="0"    x2="1025" y2="1000"/>
        <line x1="1175" y1="0"    x2="1175" y2="1000"/>
        <line x1="1325" y1="0"    x2="1325" y2="1000"/>
        <line x1="1475" y1="0"    x2="1475" y2="1000"/>
      </g>

      <!-- Depth contour lines (organic dashed curves) -->
      <g stroke="currentColor" stroke-width="0.7" fill="none" opacity="0.45" stroke-dasharray="6 5">
        <path d="M -50 220 Q 240 170 480 250 T 960 280 T 1450 230 L 1700 250"/>
        <path d="M -50 380 Q 220 340 460 400 T 940 410 T 1400 370 L 1700 380"/>
        <path d="M -50 660 Q 250 600 480 650 T 960 690 T 1400 660 L 1700 670"/>
      </g>

      <!-- Faint coastline silhouette running across the top -->
      <g fill="currentColor" opacity="0.05">
        <path d="M 0 60 Q 80 90 200 70 Q 350 30 500 80 Q 640 130 780 90 Q 920 50 1060 100 Q 1240 160 1400 110 Q 1500 80 1600 110 L 1600 0 L 0 0 Z"/>
      </g>

      <!-- Distant compass rose top-right -->
      <g transform="translate(1380 180)" stroke="currentColor" fill="none" opacity="0.5">
        <circle r="80" stroke-width="0.7"/>
        <circle r="62" stroke-width="0.5" stroke-dasharray="2 4"/>
        <circle r="22" stroke-width="0.4"/>
        <line x1="0"   y1="-78" x2="0"   y2="78" stroke-width="0.7"/>
        <line x1="-78" y1="0"   x2="78"  y2="0"  stroke-width="0.7"/>
        <line x1="-55" y1="-55" x2="55"  y2="55" stroke-width="0.45"/>
        <line x1="-55" y1="55"  x2="55"  y2="-55" stroke-width="0.45"/>
        <polygon points="0,-22 5,-5 22,0 5,5 0,22 -5,5 -22,0 -5,-5" fill="currentColor" opacity="0.6"/>
        <text x="0"   y="-90"  text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="currentColor" letter-spacing="2">N</text>
        <text x="92"  y="5"    text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="currentColor" letter-spacing="2">E</text>
        <text x="0"   y="100"  text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="currentColor" letter-spacing="2">S</text>
        <text x="-92" y="5"    text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="currentColor" letter-spacing="2">W</text>
      </g>

      <!-- Smaller compass rose bottom-left -->
      <g transform="translate(180 820)" stroke="currentColor" fill="none" opacity="0.4">
        <circle r="50" stroke-width="0.55"/>
        <circle r="36" stroke-width="0.4" stroke-dasharray="2 3"/>
        <line x1="0"   y1="-48" x2="0"  y2="48" stroke-width="0.5"/>
        <line x1="-48" y1="0"   x2="48" y2="0"  stroke-width="0.5"/>
        <line x1="-34" y1="-34" x2="34" y2="34" stroke-width="0.4"/>
        <line x1="-34" y1="34"  x2="34" y2="-34" stroke-width="0.4"/>
      </g>

      <!-- Coordinate labels at some grid intersections -->
      <g font-family="'JetBrains Mono', monospace" font-size="10" fill="currentColor" opacity="0.45" letter-spacing="2">
        <text x="135"  y="120">42°50′N</text>
        <text x="135"  y="270">42°51′N</text>
        <text x="135"  y="420">42°52′N</text>
        <text x="135"  y="570">42°53′N</text>
        <text x="430"  y="985">17°41′E</text>
        <text x="730"  y="985">17°42′E</text>
        <text x="1030" y="985">17°43′E</text>
      </g>

      <!-- Tiny ship marker near the second compass -->
      <g transform="translate(720 540)" stroke="currentColor" fill="none" opacity="0.5">
        <path d="M -8 0 L 8 0 L 5 4 L -5 4 Z" stroke-width="0.6"/>
        <line x1="0" y1="0" x2="0" y2="-10" stroke-width="0.5"/>
        <line x1="0" y1="-10" x2="6" y2="-3" stroke-width="0.5"/>
      </g>
    </svg>`;
  }

  // ─── Profile-axis icons (line-drawn, parchment-friendly) ─
  // Used in the comparison-table header + legend.
  //   sweetness  → honey drop
  //   freshness  → citrus slice
  //   dryness    → oak leaf (tannin from oak / grape skin)
  //   fruitiness → cherry pair
  //   body       → wine barrel
  function profileIcon(axis) {
    const ico = {
      sweetness: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M 8 1.5 Q 5.5 5 5.5 9 Q 5.5 12.5 8 13.5 Q 10.5 12.5 10.5 9 Q 10.5 5 8 1.5 Z" fill="currentColor" fill-opacity=".42" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        <ellipse cx="9" cy="9.5" rx=".7" ry=".4" fill="#fff" opacity=".55"/>
      </svg>`,
      freshness: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.2"/>
        <circle cx="8" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width=".7" opacity=".75"/>
        <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" stroke-width=".7" opacity=".7"/>
        <line x1="8" y1="2.5" x2="8" y2="13.5" stroke="currentColor" stroke-width=".7" opacity=".7"/>
        <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width=".55" opacity=".5"/>
        <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width=".55" opacity=".5"/>
      </svg>`,
      dryness: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M 8 2 Q 6.5 3 6 4 Q 4 4 4 5.5 Q 4.5 6.5 5.5 6.5 Q 4.5 7.5 4.5 9 Q 6 9 6.8 8.3 Q 6.8 10 7.5 11 Q 7.5 12.5 8 14 Q 8.5 12.5 8.5 11 Q 9.2 10 9.2 8.3 Q 10 9 11.5 9 Q 11.5 7.5 10.5 6.5 Q 11.5 6.5 12 5.5 Q 12 4 10 4 Q 9.5 3 8 2 Z" fill="currentColor" fill-opacity=".32" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
        <line x1="8" y1="3" x2="8" y2="14" stroke="currentColor" stroke-width=".7" opacity=".6"/>
      </svg>`,
      fruitiness: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="11" r="2.8" fill="currentColor" fill-opacity=".42" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="10.5" cy="12" r="2.4" fill="currentColor" fill-opacity=".42" stroke="currentColor" stroke-width="1.1"/>
        <path d="M 5.5 8.2 Q 7 5 9 3.5" fill="none" stroke="currentColor" stroke-width=".9"/>
        <path d="M 10.5 9.6 Q 10.5 6 9 3.5" fill="none" stroke="currentColor" stroke-width=".9"/>
        <path d="M 8 3 Q 9.5 2 11 3" fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round"/>
      </svg>`,
      body: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M 3 4 Q 1.5 8 3 12 L 13 12 Q 14.5 8 13 4 Z" fill="currentColor" fill-opacity=".32" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        <line x1="2.5" y1="6.5" x2="13.5" y2="6.5" stroke="currentColor" stroke-width=".7" opacity=".7"/>
        <line x1="2.5" y1="9.5" x2="13.5" y2="9.5" stroke="currentColor" stroke-width=".7" opacity=".7"/>
        <line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width=".5" opacity=".5"/>
      </svg>`,
    };
    return ico[axis] || '';
  }
  const PROFILE_AXIS_LABELS = {
    sweetness: 'Slatkoća',
    freshness: 'Svježina',
    dryness:   'Suhoća',
    fruitiness:'Voćnost',
    body:      'Tijelo',
  };

  // ─── Pairing icons (line-drawn, parchment-friendly) ─────
  function pairIcon(id) {
    const ico = {
      fish:    `<svg viewBox="0 0 22 14" aria-hidden="true"><path d="M 2 7 Q 5 3 11 4 Q 18 5 20 7 Q 18 9 11 10 Q 5 11 2 7 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M 0 4 L 2 7 L 0 10 Z" fill="currentColor" opacity=".55"/><circle cx="16" cy="6.5" r="1" fill="currentColor"/></svg>`,
      meat:    `<svg viewBox="0 0 18 14" aria-hidden="true"><path d="M 2 6 Q 3 3 7 3 Q 11 3 13 5 Q 16 4 16 8 Q 14 11 10 11 Q 6 11 4 9 Q 2 9 2 6 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="6" cy="7" r=".8" fill="currentColor" opacity=".55"/></svg>`,
      cheese:  `<svg viewBox="0 0 20 14" aria-hidden="true"><path d="M 2 12 L 11 3 L 17 12 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="12" cy="7.5" r=".75" fill="currentColor"/><circle cx="13.5" cy="10.5" r=".55" fill="currentColor"/></svg>`,
      dessert: `<svg viewBox="0 0 18 14" aria-hidden="true"><path d="M 3 12 L 3 7 Q 9 4 15 7 L 15 12 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><line x1="9" y1="3" x2="9" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="9" cy="2.4" r=".9" fill="currentColor"/></svg>`,
      aper:    `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M 2 3 L 8 9 L 14 3 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M 5 5 L 8 7.5 L 11 5 Z" fill="currentColor" opacity=".4"/><line x1="8" y1="9" x2="8" y2="14" stroke="currentColor" stroke-width="1.3"/><line x1="5" y1="14" x2="11" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    };
    return ico[id] || '';
  }

  function renderFilters() {
    const e = $('wc-filters');
    if (!e) return;
    const af = state.activeFilters;
    let activeCount = 0;
    if (af.body) activeCount++;
    if (af.tier) activeCount++;
    if (af.pair) activeCount++;

    const countLabel = activeCount === 1 ? '1 aktivan filter' :
                       activeCount === 0 ? '' :
                       `${activeCount} aktivna filtra`;

    e.innerHTML = `
      <div class="wc-filter-meta">
        <span class="wc-filter-meta-title">Filtri</span>
        ${activeCount > 0
          ? `<span class="wc-filter-meta-count">${countLabel}</span>
             <button class="wc-filter-clear" id="wc-filter-clear" type="button">✕ Očisti sve</button>`
          : `<span class="wc-filter-meta-hint">odaberite kriterije za pretragu</span>`}
      </div>

      <div class="wc-filters-grid">
        <div class="wc-filter-rows">
          <div class="wc-filter-row">
            <div class="wc-filter-row-head">Tijelo</div>
            <div class="wc-filter-row-chips" data-group="body">
              ${BODY.map(([id, L]) => `
                <button class="wc-fchip ${af.body === id ? 'active' : ''}" data-id="${id}" type="button">
                  <span class="wc-fchip-pict">${bodyDots(id)}</span>
                  <span>${L}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wc-filter-row">
            <div class="wc-filter-row-head">Cijena</div>
            <div class="wc-filter-row-chips" data-group="tier">
              ${TIERS.map(tier => `
                <button class="wc-fchip wc-fchip-tier ${af.tier === tier ? 'active' : ''}" data-id="${tier}" type="button">${tier}</button>
              `).join('')}
            </div>
          </div>

          <div class="wc-filter-row">
            <div class="wc-filter-row-head">Uz jelo</div>
            <div class="wc-filter-row-chips" data-group="pair">
              ${PAIRING_GROUPS.map(p => `
                <button class="wc-fchip wc-fchip-pair ${af.pair === p.id ? 'active' : ''}" data-id="${p.id}" type="button">
                  <span class="wc-fchip-pict">${pairIcon(p.id)}</span>
                  <span>${p.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <aside class="wc-cellar-intro" aria-label="O podrumu">
          <div class="wc-cellar-intro-ornament">
            <span class="wc-cellar-intro-rule"></span>
            <span class="wc-cellar-intro-glyph">⚓</span>
            <span class="wc-cellar-intro-rule"></span>
          </div>
          <h3 class="wc-cellar-intro-title">Naša priča</h3>
          <p class="wc-cellar-intro-text">Na obali Malog Stona, gdje se more i loza dotiču stoljećima, čuvamo selekciju iz cijele Hrvatske — pošip s korčulanskog pijeska, plavac s peljeških padina, dalmatinske klasike i svjetska imena.</p>
          <p class="wc-cellar-intro-tag">Otkrijte vino za stol — ili spakirajte kovčeg i ponesite Kapetanovu kuću kući.</p>
        </aside>
      </div>
    `;

    // Wire chip clicks via delegation
    e.querySelectorAll('.wc-filter-row-chips').forEach(group => {
      const key = group.dataset.group;
      group.querySelectorAll('.wc-fchip').forEach(chip => {
        chip.addEventListener('click', () => {
          const v = chip.dataset.id;
          state.activeFilters[key] = state.activeFilters[key] === v ? null : v;
          renderFilters();
          renderGrid();
        });
      });
    });

    const clearBtn = $('wc-filter-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.activeFilters = { tier: null, body: null, pair: null };
        renderFilters();
        renderGrid();
      });
    }
  }

  function renderGrid() {
    const grid = $('wc-grid');
    if (!grid) return;
    const list = entries();
    const lc = $('wc-list-count'); if (lc) lc.textContent = list.length;
    const lvc = $('wc-live-count'); if (lvc) lvc.textContent = list.length;

    if (!list.length) {
      grid.innerHTML = '<div class="wc-empty">Nema vina za odabrane filtere — promijenite kriterije iznad.</div>';
      return;
    }
    grid.innerHTML = list.map(w => {
      const c = STYLE_COLORS[w.style];
      const inChest = state.chest.includes(w.id);
      const barrelTxt = (w.barrel && w.barrel.months) ? `${w.barrel.months} mj.` : 'bez bačve';
      const yr = w.year ?? 'NV';
      const sp = souvenirPrice(w);
      const savings = w.restaurantPrice && sp ? (w.restaurantPrice - sp) : 0;
      return `
        <button class="wc-card ${inChest ? 'in-chest' : ''}" style="--accent:${c}" data-id="${escAttr(w.id)}">
          <span class="wc-add-pin ${inChest ? 'added' : ''}" data-add="${escAttr(w.id)}" title="${inChest ? 'Ukloni iz kovčega' : 'Ukrcaj u kovčeg'}">${inChest ? '✓' : '+'}</span>
          <div class="wc-card-head">
            <h3>${esc(w.name)}</h3>
            <div class="wc-card-producer">${esc(w.producer)}</div>
            <div class="wc-card-badges">
              ${w.featured ? '<span class="wc-badge wc-badge-reco">★ Preporuka</span>' : ''}
              <span class="wc-badge wc-badge-style">${esc(STYLE_LABELS[w.style])}</span>
              <span class="wc-badge wc-badge-year">${esc(yr)}</span>
              <span class="wc-badge wc-badge-tier">${esc(w.tier || '')}</span>
              <span class="wc-badge">${esc(w.region.split(',')[0])}</span>
            </div>
          </div>
          <div class="wc-card-mood-row">
            <span class="wc-card-mood-rule"></span>
            <span class="wc-card-mood-word">${esc(characteristicWords(w))}</span>
            <span class="wc-card-mood-rule"></span>
          </div>
          <div class="wc-card-body">
            <div class="wc-card-bottle">${bottleSVG(w, c)}</div>
            <div class="wc-card-specs">
              <div class="wc-card-spec-row wc-card-spec-full">
                <span class="wc-card-k">Sorta</span>
                <span class="wc-card-v">${esc(w.grapeVariety)}</span>
              </div>
              <div class="wc-card-spec-row wc-card-spec-pair">
                <div><span class="wc-card-k">Bačva</span><span class="wc-card-v">${esc(barrelTxt)}</span></div>
                <div><span class="wc-card-k">Alk.</span><span class="wc-card-v">${w.abv}%</span></div>
              </div>
              <div class="wc-card-spec-row wc-card-spec-trio">
                <div><span class="wc-card-k">Servis</span><span class="wc-card-v">${esc(w.servingC)}°</span></div>
                <div><span class="wc-card-k">Dekant</span><span class="wc-card-v">${w.decantMin ? w.decantMin + '′' : '—'}</span></div>
                <div><span class="wc-card-k">Čaša</span><span class="wc-card-v">${esc(w.glass)}</span></div>
              </div>
            </div>
          </div>
          ${shortNote(w.tastingNotes) ? `
            <div class="wc-card-note">
              <span class="wc-card-note-mark">“</span>
              <span class="wc-card-note-text">${esc(shortNote(w.tastingNotes))}</span>
            </div>
          ` : ''}
          <div class="wc-card-pair">
            ${pairIconForCard(w) ? `<span class="wc-card-pair-icon">${pairIconForCard(w)}</span>` : '<span class="wc-card-pair-dash"></span>'}
            <span class="wc-card-pair-text">${esc(w.pairing || '')}</span>
          </div>
          <div class="wc-card-foot">
            <div class="wc-card-price">
              <span class="wc-card-price-app">${sp ?? '—'} €</span>
              <span class="wc-card-price-strike">${w.restaurantPrice ?? ''}€</span>
            </div>
            <div class="wc-card-foot-meta">
              <span class="wc-card-foot-vol">${w.volume} ml</span>
              <span class="wc-card-foot-savings">ušteda ${savings} €</span>
            </div>
          </div>
        </button>`;
    }).join('');

    // Wire interactions
    grid.querySelectorAll('.wc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-add]')) return; // pinned button handled separately
        openDetail(card.dataset.id);
      });
    });
    grid.querySelectorAll('[data-add]').forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChest(pin.dataset.add);
      });
    });
  }

  // ─── Pricing helpers ─────────────────────────────────────
  function souvenirPrice(wine) {
    const pct = (state.config && state.config.souvenirDiscountPct) ?? 0.25;
    if (!wine.restaurantPrice) return null;
    return Math.round(wine.restaurantPrice * (1 - pct));
  }

  // ─── Tiny escape helpers (App.esc may not always be loaded yet) ──
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escAttr(v) { return esc(v); }

  // ═════════════════════════════════════════════════════════
  //  Detail drawer — slides up from bottom
  // ═════════════════════════════════════════════════════════
  function openDetail(id) {
    const w = state.wines.find(x => x.id === id);
    if (!w) return;
    state.openWineId = id;
    const c = STYLE_COLORS[w.style];
    const barrelTxt = (w.barrel && w.barrel.months)
      ? `${w.barrel.months} mj. ${w.barrel.type === 'oak' ? 'fr. hrast' : (w.barrel.type === 'mixed' ? 'mješ.' : (w.barrel.type === 'steel' ? 'inox' : ''))}`
      : 'bez bačve';
    const inChest = state.chest.includes(w.id);
    const sp = souvenirPrice(w);

    const inner = $('wc-drawer-inner');
    inner.innerHTML = `
      <div class="wc-d-head">
        <div class="wc-d-kicker">${esc(STYLE_LABELS[w.style])} · ${esc(w.region)}</div>
        <h1>${esc(w.name)}</h1>
        <div class="wc-d-producer">${esc(w.producer)}</div>
        <div class="wc-card-badges wc-d-badges">
          <span class="wc-badge wc-badge-style" style="background:${c};border-color:${c};color:#fff">${esc(STYLE_LABELS[w.style])}</span>
          <span class="wc-badge wc-badge-year">${esc(w.year ?? 'NV')}</span>
          <span class="wc-badge wc-badge-tier">${esc(w.tier || '')}</span>
          <span class="wc-badge">${esc(w.grapeVariety)}</span>
          <span class="wc-badge">${esc(w.region)}</span>
          <span class="wc-badge">${w.abv}% alc.</span>
          <span class="wc-badge">${w.volume} ml</span>
          <span class="wc-badge">${esc(barrelTxt)}</span>
        </div>
      </div>

      <div class="wc-d-body">
        <div class="wc-d-left">
          <div class="wc-d-h3">Priča somelijera</div>
          <p class="wc-d-story">${esc(w.story)}</p>
          <div class="wc-d-quote">${esc(w.tastingNotes)}</div>

          <div class="wc-d-h3" style="margin-top:22px">Sastav vina</div>
          <div class="wc-d-bars" style="--accent:${c}">
            <div class="wc-b-row"><span class="wc-b-nm">Šećer</span><span class="wc-b-bar"><i style="width:${w.bars.sugar}%"></i></span><span class="wc-b-vv">${w.bars.sugar}</span></div>
            <div class="wc-b-row"><span class="wc-b-nm">Kiselina</span><span class="wc-b-bar"><i style="width:${w.bars.acid}%"></i></span><span class="wc-b-vv">${w.bars.acid}</span></div>
            <div class="wc-b-row"><span class="wc-b-nm">Tanini</span><span class="wc-b-bar"><i style="width:${w.bars.tannin}%"></i></span><span class="wc-b-vv">${w.bars.tannin}</span></div>
            <div class="wc-b-row"><span class="wc-b-nm">Alkohol</span><span class="wc-b-bar"><i style="width:${(w.bars.alcohol / 16 * 100).toFixed(0)}%"></i></span><span class="wc-b-vv">${w.bars.alcohol}%</span></div>
          </div>

          <div class="wc-d-serve">
            <div class="wc-d-spec"><div class="wc-d-spec-ico">🌡️</div><div class="wc-d-spec-lbl">Temperatura</div><div class="wc-d-spec-val">${esc(w.servingC)}°C</div></div>
            <div class="wc-d-spec"><div class="wc-d-spec-ico">⏱️</div><div class="wc-d-spec-lbl">Dekantiranje</div><div class="wc-d-spec-val">${w.decantMin ? w.decantMin + ' min' : '—'}</div></div>
            <div class="wc-d-spec"><div class="wc-d-spec-ico">🥂</div><div class="wc-d-spec-lbl">Čaša</div><div class="wc-d-spec-val">${esc(w.glass)}</div></div>
          </div>
        </div>

        <div class="wc-d-right">
          <div class="wc-d-h3">Iz naše kuhinje</div>
          <div class="wc-d-dishes">${(w.dishes || []).map((d, i) => `<div class="wc-d-dish"><span class="wc-d-dish-n">0${i + 1}</span><span>${esc(d)}</span></div>`).join('')}</div>

          <div class="wc-d-h3" style="margin-top:22px">Slično na karti</div>
          <div class="wc-d-related">${(w.related || []).map(rid => {
            const r = state.wines.find(x => x.id === rid);
            if (!r) return '';
            const rsp = souvenirPrice(r);
            return `<button class="wc-rcard" style="--racc:${STYLE_COLORS[r.style]}" data-id="${escAttr(rid)}"><div class="wc-rcard-sw"></div><div class="wc-rcard-nm">${esc(r.name.split(' ').slice(0, 2).join(' '))}</div><div class="wc-rcard-pr">${rsp}€</div></button>`;
          }).join('')}</div>
        </div>
      </div>

      <div class="wc-d-cta">
        <div class="wc-d-cta-seal">EX<br>NAVIS<br>'26</div>
        <div>
          <div class="wc-d-cta-label">U aplikaciji · ${w.volume}ml</div>
          <div class="wc-d-cta-row"><span class="wc-d-cta-app">${sp} €</span><span class="wc-d-cta-ml">/ ${w.volume}ml · −25% od restorana</span></div>
        </div>
        <div class="wc-d-cta-actions">
          <button class="wc-d-btn wc-d-btn-primary" id="wc-d-add">${inChest ? '✓ U kovčegu' : '⚓ Ukrcaj u kovčeg'}</button>
          <button class="wc-d-btn wc-d-btn-ghost" id="wc-d-close">Zatvori</button>
        </div>
      </div>
    `;
    $('wc-drawer').classList.add('open');
    $('wc-drawer-mask').classList.add('open');
    $('wc-d-add').onclick = () => { toggleChest(w.id); openDetail(w.id); };
    $('wc-d-close').onclick = closeDetail;
    inner.querySelectorAll('.wc-rcard').forEach(r => r.onclick = () => openDetail(r.dataset.id));
  }
  function closeDetail() {
    $('wc-drawer').classList.remove('open');
    $('wc-drawer-mask').classList.remove('open');
    state.openWineId = null;
  }

  // ═════════════════════════════════════════════════════════
  //  Chest (Vinski kovčeg) — FAB + wooden drawer
  // ═════════════════════════════════════════════════════════
  function toggleChest(id) {
    const w = state.wines.find(x => x.id === id);
    if (!w) return;
    if (state.chest.includes(id)) {
      state.chest = state.chest.filter(x => x !== id);
    } else {
      state.chest.push(id);
      showToast(`⚓ ${w.name} ukrcano`);
    }
    updateChestFab();
    renderGrid();
    if (state.openWineId) openDetail(state.openWineId);
    if ($('wc-chest-drawer').classList.contains('open')) renderChest();
  }

  function showToast(msg) {
    const t = $('wc-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function updateChestFab() {
    const fab = $('wc-chest-fab');
    const badge = $('wc-chest-badge');
    if (badge) badge.textContent = state.chest.length;
    if (fab) fab.classList.toggle('show', state.chest.length > 0);
  }

  function renderChest() {
    const wines = state.chest.map(id => state.wines.find(w => w.id === id)).filter(Boolean);
    const slotsEl = $('wc-chest-slots');
    const extrasEl = $('wc-chest-extras');
    if (!slotsEl || !extrasEl) return;

    if (!wines.length) {
      slotsEl.innerHTML = '<div class="wc-chest-empty"><div class="wc-chest-empty-icon">⚓</div>Kovčeg je prazan.<br>Ukrcajte vino dodirom na <b>+</b> u kartici.</div>';
      extrasEl.innerHTML = '';
      // Hide manifest meta when empty
      const mfst = $('wc-chest-manifest'); if (mfst) mfst.style.display = 'none';
      return;
    }

    // Show + populate manifest meta
    const mfst = $('wc-chest-manifest');
    if (mfst) {
      mfst.style.display = '';
      mfst.innerHTML = `
        <span class="wc-cm-key">Manifest</span>
        <span class="wc-cm-dot"></span>
        <span class="wc-cm-count"><b>${wines.length}</b> ${wines.length === 1 ? 'unos' : 'unosa'}</span>
        <span class="wc-cm-dot"></span>
        <span class="wc-cm-place">Mali Ston · MMXXVI</span>
      `;
    }

    // Render the manifest list of info-rich cards
    let list = '<div class="wc-chest-list">';
    wines.forEach((w, i) => {
      list += renderChestCard(w, i);
    });
    list += '</div>';
    slotsEl.innerHTML = list;

    const total = wines.reduce((a, w) => a + (souvenirPrice(w) || 0), 0);
    const totalRest = wines.reduce((a, w) => a + (w.restaurantPrice || 0), 0);
    const eta = (state.config && state.config.pickupEtaMinutes) || 10;

    let extras = '';
    if (wines.length >= 2) extras += renderCompareSection(wines);

    extras += `<div class="wc-totals-band">
      <div class="wc-totals-row">
        <div class="wc-totals-left">
          <span class="wc-totals-lbl">Ukupno · u aplikaciji</span>
          <span class="wc-totals-v">${total} €</span>
          <div class="wc-totals-save">u restoranu ${totalRest}€ · uštedite <b>${totalRest - total} €</b></div>
        </div>
        <div class="wc-totals-right">
          <span class="wc-totals-ll">u restoranu</span>
          <span class="wc-totals-vv">${totalRest} €</span>
        </div>
      </div>
      <div class="wc-totals-deliver">
        <span class="wc-totals-deliver-icon">⚓</span>
        <span class="wc-totals-deliver-text">Spakirajte kovčeg — konobar će vam ga donijeti za ${eta} minuta</span>
      </div>
      <div class="wc-totals-cta">
        <button class="wc-d-btn wc-d-btn-ghost" id="wc-c-clear">Isprazni</button>
        <button class="wc-d-btn wc-d-btn-primary">Spakiraj kovčeg →</button>
      </div>
    </div>`;
    extrasEl.innerHTML = extras;

    // Wire chest interactions
    slotsEl.querySelectorAll('[data-rm]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        state.chest = state.chest.filter(x => x !== b.dataset.rm);
        updateChestFab();
        renderGrid();
        renderChest();
      });
    });
    extrasEl.querySelectorAll('.wc-cmp-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-rm]')) return;
        const id = row.dataset.id;
        if (!id) return;
        closeChest();
        setTimeout(() => openDetail(id), 220);
      });
    });
    extrasEl.querySelectorAll('.wc-cmp-rm').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        state.chest = state.chest.filter(x => x !== b.dataset.rm);
        updateChestFab();
        renderGrid();
        renderChest();
      });
    });
    extrasEl.querySelectorAll('.wc-somm-name[data-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        if (!id) return;
        closeChest();
        setTimeout(() => openDetail(id), 220);
      });
    });
    // Chest manifest cards: tap to open that wine's detail
    slotsEl.querySelectorAll('.wc-cc').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-rm]')) return;
        const id = card.dataset.id;
        if (!id) return;
        closeChest();
        setTimeout(() => openDetail(id), 220);
      });
    });

    const cl = $('wc-c-clear');
    if (cl) cl.onclick = () => { state.chest = []; updateChestFab(); renderGrid(); closeChest(); };
  }

  // ─── Chest manifest card (one row per wine in the kovčeg) ──────
  function renderChestCard(w, i) {
    const c = STYLE_COLORS[w.style];
    const sp = souvenirPrice(w);
    const numeral = toRoman(i + 1);
    const barrelTxt = (w.barrel && w.barrel.months) ? `${w.barrel.months} mj.` : 'inox';
    const region = (w.region || '').split(',')[0].trim();
    return `<article class="wc-cc" style="--accent:${c}" data-id="${escAttr(w.id)}">
      <div class="wc-cc-num">no. ${numeral}</div>
      <div class="wc-cc-bottle">${bottleSVG(w, c)}</div>
      <div class="wc-cc-info">
        <div class="wc-cc-head">
          <h4 class="wc-cc-name">${esc(w.name)}</h4>
          <span class="wc-cc-style">${esc(STYLE_LABELS[w.style])}</span>
        </div>
        <div class="wc-cc-producer">${esc(w.producer)}</div>
        <div class="wc-cc-meta">
          <span class="wc-cc-year">${esc(w.year ?? 'NV')}</span>
          <span class="wc-cc-sep">·</span>
          <span>${esc(region)}</span>
          <span class="wc-cc-sep">·</span>
          <span>${esc(w.grapeVariety)}</span>
        </div>
        <div class="wc-cc-data">
          <span><span class="wc-cc-data-k">Bačva</span> ${esc(barrelTxt)}</span>
          <span class="wc-cc-data-sep"></span>
          <span><span class="wc-cc-data-k">Servis</span> ${esc(w.servingC)}°</span>
          <span class="wc-cc-data-sep"></span>
          <span><span class="wc-cc-data-k">Alk</span> ${w.abv}%</span>
        </div>
      </div>
      <div class="wc-cc-price-block">
        <div class="wc-cc-price">${sp}€</div>
        <div class="wc-cc-volume">${w.volume} ml</div>
      </div>
      <button class="wc-cc-rm" data-rm="${escAttr(w.id)}" type="button" aria-label="Ukloni iz kovčega">×</button>
    </article>`;
  }

  // Roman numerals (used for catalog "no. III" prefix in chest manifest)
  function toRoman(num) {
    const map = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100],  ['XC', 90],  ['L', 50],  ['XL', 40],
      ['X', 10],   ['IX', 9],   ['V', 5],   ['IV', 4], ['I', 1],
    ];
    let s = '';
    for (const [letter, value] of map) {
      while (num >= value) { s += letter; num -= value; }
    }
    return s || '·';
  }

  // ─── Comparison section: style-mix + table + sommelier highlights ────
  function renderCompareSection(wines) {
    return `<section class="wc-compare-section">
      <header class="wc-cmp-header">
        <h3 class="wc-cmp-title">Usporedba</h3>
        <div class="wc-cmp-subtitle">${wines.length} vina u kovčegu</div>
      </header>

      <div class="wc-mix-row">
        <div class="wc-mix-label">Mix u kovčegu</div>
        <div class="wc-mix-bar">${renderMixBar(wines)}</div>
      </div>

      <div class="wc-cmp-table-wrap">
        <div class="wc-cmp-table">
          <div class="wc-cmp-head">
            <div class="wc-cmp-c-name">Vino</div>
            <div class="wc-cmp-c-style">Stil</div>
            <div class="wc-cmp-c-year">God.</div>
            <div class="wc-cmp-c-body">Tij.</div>
            <div class="wc-cmp-c-profile" aria-label="Profil okusa">
              <span class="wc-cmp-h-ico" title="Slatkoća">${profileIcon('sweetness')}</span>
              <span class="wc-cmp-h-ico" title="Svježina">${profileIcon('freshness')}</span>
              <span class="wc-cmp-h-ico" title="Suhoća">${profileIcon('dryness')}</span>
              <span class="wc-cmp-h-ico" title="Voćnost">${profileIcon('fruitiness')}</span>
              <span class="wc-cmp-h-ico" title="Tijelo">${profileIcon('body')}</span>
            </div>
            <div class="wc-cmp-c-price">Cijena</div>
            <div class="wc-cmp-c-rm" aria-label="Ukloni"></div>
          </div>
          ${wines.map(w => renderCompareRow(w)).join('')}
        </div>
      </div>

      <div class="wc-cmp-legend" aria-label="Legenda profila okusa">
        <span class="wc-cmp-legend-title">Legenda</span>
        ${['sweetness','freshness','dryness','fruitiness','body'].map(a => `
          <span class="wc-cmp-legend-item">
            <span class="wc-cmp-legend-ico">${profileIcon(a)}</span>
            <span class="wc-cmp-legend-label">${esc(PROFILE_AXIS_LABELS[a])}</span>
          </span>
        `).join('')}
      </div>

      ${renderSommelierLine(wines)}
    </section>`;
  }

  function renderMixBar(wines) {
    const counts = {};
    wines.forEach(w => { counts[w.style] = (counts[w.style] || 0) + 1; });
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return ordered.map(([style, count]) => {
      const pct = (count / wines.length * 100).toFixed(2);
      const label = STYLE_LABELS[style] || style;
      return `<span class="wc-mix-seg" style="width:${pct}%; background:${STYLE_COLORS[style]}" title="${esc(label)}: ${count}">
        <span class="wc-mix-seg-text">${esc(label)} <b>${count}</b></span>
      </span>`;
    }).join('');
  }

  function renderCompareRow(w) {
    const c = STYLE_COLORS[w.style];
    const sp = souvenirPrice(w);
    const bodyClass = w.profile.body < 60 ? 1 : w.profile.body < 78 ? 2 : 3;
    const dots = '●'.repeat(bodyClass) + '<span class="wc-cmp-body-empty">●</span>'.repeat(3 - bodyClass);
    const axes = ['sweetness', 'freshness', 'dryness', 'fruitiness', 'body'];
    const profileBars = axes.map(axis => {
      const v = Math.max(0, Math.min(100, w.profile[axis] || 0));
      return `<span class="wc-cmp-prof-bar" title="${axis}: ${v}"><span class="wc-cmp-prof-fill" style="height:${v}%; background:${c}"></span></span>`;
    }).join('');

    return `<div class="wc-cmp-row" style="--accent:${c}" data-id="${escAttr(w.id)}">
      <div class="wc-cmp-c-name">
        <div class="wc-cmp-c-name-main">${esc(w.name)}</div>
        <div class="wc-cmp-c-name-sub">${esc(w.producer)}</div>
      </div>
      <div class="wc-cmp-c-style"><span class="wc-cmp-style-pill" style="background:${c}">${esc(STYLE_LABELS[w.style])}</span></div>
      <div class="wc-cmp-c-year">${esc(w.year ?? 'NV')}</div>
      <div class="wc-cmp-c-body">${dots}</div>
      <div class="wc-cmp-c-profile">${profileBars}</div>
      <div class="wc-cmp-c-price">${sp}€</div>
      <div class="wc-cmp-c-rm">
        <button class="wc-cmp-rm" data-rm="${escAttr(w.id)}" type="button" aria-label="Ukloni iz kovčega">×</button>
      </div>
    </div>`;
  }

  function renderSommelierLine(wines) {
    if (!wines.length) return '';
    const byBody = [...wines].sort((a, b) => b.profile.body - a.profile.body)[0];
    const byFresh = [...wines].sort((a, b) => b.profile.freshness - a.profile.freshness)[0];
    const cheapest = [...wines].sort((a, b) => (souvenirPrice(a) || 0) - (souvenirPrice(b) || 0))[0];
    return `<div class="wc-somm-line">
      <span class="wc-somm-pick">
        <span class="wc-somm-label">★ Najmoćnije</span>
        <span class="wc-somm-name" data-id="${escAttr(byBody.id)}">${esc(byBody.name)}</span>
      </span>
      <span class="wc-somm-sep">·</span>
      <span class="wc-somm-pick">
        <span class="wc-somm-label">★ Najsvježije</span>
        <span class="wc-somm-name" data-id="${escAttr(byFresh.id)}">${esc(byFresh.name)}</span>
      </span>
      <span class="wc-somm-sep">·</span>
      <span class="wc-somm-pick">
        <span class="wc-somm-label">★ Najpovoljnije</span>
        <span class="wc-somm-name" data-id="${escAttr(cheapest.id)}">${esc(cheapest.name)} <em>${souvenirPrice(cheapest)}€</em></span>
      </span>
    </div>`;
  }

  function openChest() {
    renderChest();
    $('wc-chest-drawer').classList.add('open');
    $('wc-chest-mask').classList.add('open');
  }
  function closeChest() {
    $('wc-chest-drawer').classList.remove('open');
    $('wc-chest-mask').classList.remove('open');
  }

  // ═════════════════════════════════════════════════════════
  //  Mode tab integration
  // ═════════════════════════════════════════════════════════
  function injectModeTab() {
    const switcher = $('mode-switcher');
    if (!switcher || $('tab-cellar')) return;

    const btn = document.createElement('button');
    btn.className = 'mode-btn mode-btn-cellar';
    btn.id = 'tab-cellar';
    btn.dataset.mode = 'cellar';
    btn.type = 'button';
    btn.innerHTML = `
      <svg class="mode-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 2 L8 8 Q8 13 12 13 Q16 13 16 8 L16 2 Z" />
        <line x1="12" y1="13" x2="12" y2="20" />
        <line x1="8" y1="20" x2="16" y2="20" />
      </svg>
      <span class="mode-btn-title">Vinski podrum</span>
      <span class="mode-btn-sub">Otkrijte naš podrum i ponesite ga kući</span>
    `;
    switcher.appendChild(btn);

    btn.addEventListener('click', activateCellar);
    switcher.querySelectorAll('.mode-btn:not(#tab-cellar)').forEach(other => {
      other.addEventListener('click', deactivateCellar);
    });
  }

  // ─── Mode transition (chart-style: parchment circle + compass) ─────
  function runTransition(applyMode) {
    const t = $('wc-transition');
    if (!t) { applyMode(); return; }
    // Phase 1: overlay covers (parchment expands from center, compass spins in)
    t.classList.add('show', 'expanding');
    // Phase 2: swap mode behind the visible overlay
    setTimeout(applyMode, 380);
    // Phase 3: fade overlay out, revealing new view
    setTimeout(() => t.classList.remove('show'), 620);
    // Cleanup
    setTimeout(() => t.classList.remove('expanding'), 1100);
  }

  function activateCellar() {
    runTransition(() => {
      document.body.classList.add('mode-cellar-active');
      document.querySelectorAll('#mode-switcher .mode-btn').forEach(b => {
        b.classList.toggle('active', b.id === 'tab-cellar');
      });
      renderBrowse();
      updateChestFab();
      window.scrollTo(0, 0);
    });
  }
  function deactivateCellar() {
    // Only run transition if cellar was actually active (avoids spurious overlay on plain tab clicks)
    if (!document.body.classList.contains('mode-cellar-active')) return;
    runTransition(() => {
      document.body.classList.remove('mode-cellar-active');
      const cellarBtn = $('tab-cellar');
      if (cellarBtn) cellarBtn.classList.remove('active');
      closeDetail();
      closeChest();
    });
  }

  // ═════════════════════════════════════════════════════════
  //  DOM injection
  // ═════════════════════════════════════════════════════════
  function injectScreens() {
    const card = document.querySelector('.guest-card');
    if (card && !$('wine-browse-screen')) {
      const browse = document.createElement('div');
      browse.id = 'wine-browse-screen';
      browse.className = 'wine-screen';
      card.appendChild(browse);
    }

    if (!$('wc-drawer')) {
      // Detail drawer (slides up)
      const dm = document.createElement('div');
      dm.id = 'wc-drawer-mask';
      dm.className = 'wc-drawer-mask';
      document.body.appendChild(dm);

      const dr = document.createElement('aside');
      dr.id = 'wc-drawer';
      dr.className = 'wc-drawer';
      dr.innerHTML = `
        <button class="wc-drawer-close" id="wc-drawer-close">×</button>
        <div class="wc-drawer-handle"></div>
        <div class="wc-drawer-inner" id="wc-drawer-inner"></div>
      `;
      document.body.appendChild(dr);

      dm.addEventListener('click', closeDetail);
      $('wc-drawer-close').addEventListener('click', closeDetail);
    }

    if (!$('wc-chest-fab')) {
      const fab = document.createElement('button');
      fab.id = 'wc-chest-fab';
      fab.className = 'wc-chest-fab';
      fab.setAttribute('aria-label', 'Otvori kovčeg');
      fab.innerHTML = `
        <span class="wc-chest-fab-ico">
          <svg viewBox="0 0 28 24" fill="none" aria-hidden="true">
            <path d="M 2 10 Q 2 4 6 4 L 22 4 Q 26 4 26 10" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>
            <rect x="2" y="10" width="24" height="12" rx="1.5" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>
            <line x1="2" y1="13" x2="26" y2="13" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"/>
            <line x1="14" y1="10" x2="14" y2="22" stroke="rgba(0,0,0,0.35)" stroke-width="0.8"/>
            <rect x="11.5" y="11" width="5" height="4" rx="0.6" fill="rgba(195,149,54,0.95)" stroke="rgba(74,44,20,0.6)" stroke-width="0.4"/>
            <circle cx="14" cy="13" r="0.6" fill="rgba(0,0,0,0.55)"/>
          </svg>
        </span>
        <span class="wc-chest-fab-label">Kovčeg</span>
        <span class="wc-chest-fab-b" id="wc-chest-badge">0</span>
      `;
      document.body.appendChild(fab);

      const cm = document.createElement('div');
      cm.id = 'wc-chest-mask';
      cm.className = 'wc-chest-mask';
      document.body.appendChild(cm);

      const cd = document.createElement('aside');
      cd.id = 'wc-chest-drawer';
      cd.className = 'wc-chest-drawer';
      cd.innerHTML = `
        <div class="wc-chest-inner">
          <div class="wc-chest-handle"></div>
          <button class="wc-chest-close" id="wc-chest-close">×</button>
          <div class="wc-chest-wood">
            <span class="wc-chest-corner wc-chest-corner-tl"></span>
            <span class="wc-chest-corner wc-chest-corner-tr"></span>
            <span class="wc-chest-corner wc-chest-corner-bl"></span>
            <span class="wc-chest-corner wc-chest-corner-br"></span>
            <div class="wc-chest-nameplate">
              <h2>K O V Č E G</h2>
              <p>Vaša odabrana vina</p>
            </div>
            <div class="wc-chest-manifest" id="wc-chest-manifest"></div>
            <div id="wc-chest-slots"></div>
          </div>
          <div id="wc-chest-extras"></div>
        </div>
      `;
      document.body.appendChild(cd);

      fab.addEventListener('click', openChest);
      cm.addEventListener('click', closeChest);
      $('wc-chest-close').addEventListener('click', closeChest);
    }

    if (!$('wc-toast')) {
      const t = document.createElement('div');
      t.id = 'wc-toast';
      t.className = 'wc-toast';
      t.textContent = 'Ukrcano';
      document.body.appendChild(t);
    }

    // Body-level nautical chart background (visible in dark themes)
    if (!$('wc-app-chart')) {
      const chart = document.createElement('div');
      chart.id = 'wc-app-chart';
      chart.className = 'wc-app-chart';
      chart.setAttribute('aria-hidden', 'true');
      chart.innerHTML = chartSVG();
      // Insert as the very first child of body so it sits below all content
      document.body.insertBefore(chart, document.body.firstChild);
    }

    if (!$('wc-transition')) {
      const tr = document.createElement('div');
      tr.id = 'wc-transition';
      tr.className = 'wc-transition';
      tr.setAttribute('aria-hidden', 'true');
      tr.innerHTML = `
        <div class="wc-transition-paper"></div>
        <div class="wc-transition-compass">
          <svg viewBox="-150 -150 300 300" aria-hidden="true">
            <defs>
              <radialGradient id="wcTransGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stop-color="rgba(195,149,54,0.55)"/>
                <stop offset="100%" stop-color="rgba(195,149,54,0)"/>
              </radialGradient>
            </defs>
            <!-- Halo -->
            <circle cx="0" cy="0" r="135" fill="url(#wcTransGlow)"/>
            <!-- Outer rings -->
            <circle cx="0" cy="0" r="138" fill="none" stroke="rgba(110,82,26,0.5)" stroke-width="1" stroke-dasharray="2 4"/>
            <circle cx="0" cy="0" r="125" fill="none" stroke="rgba(110,82,26,0.7)" stroke-width="1.4"/>
            <circle cx="0" cy="0" r="115" fill="none" stroke="rgba(195,149,54,0.55)" stroke-width="0.7"/>
            <!-- Inner dashed ring -->
            <circle cx="0" cy="0" r="55" fill="none" stroke="rgba(195,149,54,0.55)" stroke-width="0.8" stroke-dasharray="3 3"/>
            <!-- 8 main rays -->
            <g stroke="rgba(195,149,54,0.6)" stroke-width="1.2">
              <line x1="0"    y1="-115" x2="0"    y2="-58"/>
              <line x1="81"   y1="-81"  x2="42"   y2="-42"/>
              <line x1="115"  y1="0"    x2="58"   y2="0"/>
              <line x1="81"   y1="81"   x2="42"   y2="42"/>
              <line x1="0"    y1="115"  x2="0"    y2="58"/>
              <line x1="-81"  y1="81"   x2="-42"  y2="42"/>
              <line x1="-115" y1="0"    x2="-58"  y2="0"/>
              <line x1="-81"  y1="-81"  x2="-42"  y2="-42"/>
            </g>
            <!-- 8 minor ticks (between mains) -->
            <g stroke="rgba(195,149,54,0.32)" stroke-width="0.6">
              <line x1="44"   y1="-106" x2="22"   y2="-53"/>
              <line x1="106"  y1="-44"  x2="53"   y2="-22"/>
              <line x1="106"  y1="44"   x2="53"   y2="22"/>
              <line x1="44"   y1="106"  x2="22"   y2="53"/>
              <line x1="-44"  y1="106"  x2="-22"  y2="53"/>
              <line x1="-106" y1="44"   x2="-53"  y2="22"/>
              <line x1="-106" y1="-44"  x2="-53"  y2="-22"/>
              <line x1="-44"  y1="-106" x2="-22"  y2="-53"/>
            </g>
            <!-- 8-pointed compass star -->
            <polygon points="0,-50 12,-12 50,0 12,12 0,50 -12,12 -50,0 -12,-12"
              fill="rgba(195,149,54,0.7)" stroke="rgba(110,82,26,0.7)" stroke-width="1"/>
            <!-- Wine-red North tip (longer than the others) -->
            <polygon points="0,-92 7,-50 -7,-50" fill="rgba(122,34,48,0.88)"/>
            <!-- Cardinal labels -->
            <g font-family="Cinzel, serif" font-weight="700" font-size="16" fill="rgba(74,44,20,0.7)" text-anchor="middle" letter-spacing="3">
              <text x="0"    y="-150">N</text>
              <text x="150"  y="6">E</text>
              <text x="0"    y="158">S</text>
              <text x="-150" y="6">W</text>
            </g>
          </svg>
        </div>
      `;
      document.body.appendChild(tr);
    }
  }

  // ═════════════════════════════════════════════════════════
  //  Subscribe to data
  // ═════════════════════════════════════════════════════════
  function subscribe() {
    if (!window.App || !window.App.Store) return;
    window.App.Store.collection('wines').onSnapshot((snap) => {
      state.wines = [];
      snap.forEach(d => state.wines.push(d.data()));
      state.wines.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      if (document.body.classList.contains('mode-cellar-active')) {
        renderBrowse();
      }
    });
    window.App.Store.collection('config').doc('wines').get().then((s) => {
      if (s.exists) state.config = s.data();
      else state.config = { souvenirDiscountPct: 0.25, boxTierDiscounts: { 3: 0.03, 6: 0.07, 12: 0.12 }, pickupEtaMinutes: 10 };
    });
  }

  // ═════════════════════════════════════════════════════════
  //  Init
  // ═════════════════════════════════════════════════════════
  function init() {
    if (state.initialized) return;
    state.initialized = true;
    injectModeTab();
    injectScreens();
    subscribe();
    window.addEventListener('hashchange', () => {
      // Navigating to admin/club clears cellar mode
      document.body.classList.remove('mode-cellar-active');
      const btn = $('tab-cellar');
      if (btn) btn.classList.remove('active');
      closeDetail();
      closeChest();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  // Expose for debugging
  window.App = window.App || {};
  window.App.modules = window.App.modules || {};
  window.App.modules.wine = {
    state, renderBrowse, renderGrid, openDetail, closeDetail,
    openChest, closeChest, toggleChest, activateCellar, deactivateCellar,
    STYLE_COLORS, STYLE_LABELS,
  };
})();
