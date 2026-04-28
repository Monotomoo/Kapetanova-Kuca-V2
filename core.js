// ═══════════════════════════════════════════════════
//  CORE — App namespace, event bus, h() template, esc()
// ═══════════════════════════════════════════════════
//  Loaded after app.js. Provides the foundation the new
//  modules (wine, ostrea-club) build on, without touching
//  the existing waitlist + bookings code.
//
//  Pay-rent rule: every export here must justify itself
//  within 1–2 modules. If after Ostrea Club lands and one
//  of these is used in only one place — rip it out.
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  // -- Escape user content for safe innerHTML -------------------
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // -- Tagged template that auto-escapes interpolations ---------
  // Usage:  h`<div>${userInput}</div>`        → safe
  // Usage:  h`<div>${App.raw(htmlBlob)}</div>` → opt-out for trusted HTML
  function h(strings, ...values) {
    let out = '';
    strings.forEach((s, i) => {
      out += s;
      if (i < values.length) {
        const v = values[i];
        if (v && typeof v === 'object' && v.__html === true) {
          out += v.value;
        } else if (Array.isArray(v)) {
          out += v.join('');
        } else {
          out += esc(v);
        }
      }
    });
    return out;
  }

  // -- Mark a string as already-trusted HTML --------------------
  function raw(value) {
    return { __html: true, value: String(value) };
  }

  // -- Tiny pub/sub event bus -----------------------------------
  function createBus() {
    const subs = Object.create(null);
    return {
      on(event, fn) {
        (subs[event] || (subs[event] = [])).push(fn);
        return () => this.off(event, fn);
      },
      off(event, fn) {
        if (!subs[event]) return;
        subs[event] = subs[event].filter((f) => f !== fn);
      },
      emit(event, payload) {
        if (!subs[event]) return;
        subs[event].slice().forEach((fn) => {
          try { fn(payload); } catch (e) { console.error('[bus]', event, e); }
        });
      },
    };
  }

  // -- Format helpers used widely -------------------------------
  // Format euro price, integer or decimal, with € suffix.
  function fmtEur(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const n = Number(value);
    return Number.isInteger(n) ? `${n} €` : `${n.toFixed(2)} €`;
  }

  // -- Generate a stable-ish slug id from a string --------------
  function slugify(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
      .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // -- Tiny querySelector helpers -------------------------------
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // -- Build the App namespace ----------------------------------
  const App = window.App || {};
  App.state = App.state || {};
  App.modules = App.modules || {};
  App.bus = App.bus || createBus();
  App.h = h;
  App.esc = esc;
  App.raw = raw;
  App.fmtEur = fmtEur;
  App.slugify = slugify;
  App.qs = qs;
  App.qsa = qsa;
  window.App = App;
})();
