// ═══════════════════════════════════════════════════
//  modules/ostrea-club.js — Ostrea Club (membership)
// ═══════════════════════════════════════════════════
//  V1 scaffold this turn: schema, nav entry, coming-soon
//  guest screen with perks preview, functional sign-up form
//  that writes to App.Store.collection('members').
//
//  Next session — design conversation with Tomo about:
//   - tier model (single tier vs silver/gold/platinum)
//   - perks specifics (exclusive wines, priority booking,
//     member discount %, birthday surprise)
//   - sign-up gating (open vs invite-only)
//   - integration with wine module (memberExclusive +
//     memberDiscountPct fields already exist on each wine)
//   - Excel export sheet for member roster
//
//  Schema (members collection):
//   {
//     id,
//     name, phone, email,
//     joinedAt: timestamp,
//     birthDate: 'MM-DD' or null,
//     tier: 'silver' | 'gold' | 'platinum',
//     perksUsed: { lastBirthdaySurprise: yyyy, ... },
//     visitCount: number,        // updated by waitlist/booking on phone match
//     lastVisitAt: timestamp,
//     status: 'active' | 'paused' | 'cancelled',
//     notes: string,             // admin-only field
//   }
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => (window.App && window.App.t) ? window.App.t(k, v) : k;
  const esc = (s) => (window.App && window.App.esc) ? window.App.esc(s) : String(s);

  const state = {
    initialized: false,
    members: [],
    currentMember: null,   // resolved from phone match against active waitlist/booking entry (V2)
  };

  // ─── Inject the "Postanite član" footer entry ────────────
  function injectFooterEntry() {
    const guestView = $('guest-view');
    if (!guestView || $('club-entry-link')) return;

    const link = document.createElement('a');
    link.href = '#club';
    link.id = 'club-entry-link';
    link.className = 'club-entry-link';
    link.innerHTML = `
      <span class="club-entry-icon">🦪</span>
      <span class="club-entry-text">${esc(t('club.signup.heading'))}</span>
      <span class="club-entry-arrow">→</span>
    `;
    // Insert just before the existing staff link so it sits in the same footer area.
    const staffBtn = guestView.querySelector('.staff-btn');
    if (staffBtn) {
      staffBtn.parentNode.insertBefore(link, staffBtn);
    } else {
      guestView.appendChild(link);
    }
  }

  // ─── Inject the #club-screen container ───────────────────
  function injectScreen() {
    if ($('club-screen-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'club-screen-wrap';
    wrap.className = 'club-screen-wrap';
    wrap.style.display = 'none';
    document.body.appendChild(wrap);
  }

  // ─── Render the club screen ─────────────────────────────
  function renderClubScreen() {
    const wrap = $('club-screen-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="club-screen">
        <a href="#guest" class="wine-detail-back">${esc(t('common.back'))}</a>

        <div class="club-coming-soon-badge">${esc(t('club.signup.coming_soon'))}</div>

        <h1 class="club-heading">${esc(t('club.signup.heading'))}</h1>
        <p class="club-sub">${esc(t('club.signup.subheading'))}</p>

        <div class="club-perks">
          <div class="club-perks-title">${esc(t('club.signup.perks.title'))}</div>
          <ul class="club-perks-list">
            <li><span class="club-perk-icon">⚓</span><span>${esc(t('club.signup.perks.priority'))}</span></li>
            <li><span class="club-perk-icon">🍷</span><span>${esc(t('club.signup.perks.exclusive_wines'))}</span></li>
            <li><span class="club-perk-icon">⚜</span><span>${esc(t('club.signup.perks.discount'))}</span></li>
            <li><span class="club-perk-icon">🥂</span><span>${esc(t('club.signup.perks.events'))}</span></li>
            <li><span class="club-perk-icon">🎁</span><span>${esc(t('club.signup.perks.birthday'))}</span></li>
          </ul>
        </div>

        <form id="club-signup-form" class="club-signup-form">
          <div class="club-field">
            <label>${esc(t('club.signup.name'))}</label>
            <input type="text" name="name" required autocomplete="name" />
          </div>
          <div class="club-field">
            <label>${esc(t('club.signup.phone'))}</label>
            <input type="tel" name="phone" required autocomplete="tel" placeholder="+385 xx xxx xxxx" />
          </div>
          <div class="club-field">
            <label>${esc(t('club.signup.email'))}</label>
            <input type="email" name="email" autocomplete="email" />
          </div>
          <div class="club-field">
            <label>${esc(t('club.signup.birthdate'))}</label>
            <input type="text" name="birthDate" placeholder="DD.MM." />
          </div>
          <button type="submit" class="club-submit-btn">${esc(t('club.signup.submit'))}</button>
        </form>

        <div id="club-success" class="club-success" style="display:none;">
          <div class="club-success-glyph">⚓</div>
          <h2 class="club-success-heading">${esc(t('club.welcome.heading'))}</h2>
          <p class="club-success-message">${esc(t('club.welcome.message'))}</p>
        </div>
      </div>
    `;
    wireSignup();
  }

  function wireSignup() {
    const form = $('club-signup-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const member = {
        name: (fd.get('name') || '').toString().trim(),
        phone: (fd.get('phone') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        birthDate: (fd.get('birthDate') || '').toString().trim() || null,
        tier: 'silver',
        joinedAt: Date.now(),
        perksUsed: {},
        visitCount: 0,
        lastVisitAt: null,
        status: 'active',
        notes: '',
      };
      if (!member.name || !member.phone) return;
      if (window.App && window.App.Store) {
        window.App.Store.collection('members').add(member).then(() => {
          form.style.display = 'none';
          const success = $('club-success');
          if (success) success.style.display = 'block';
        });
      }
    });
  }

  // ─── Hash routing ────────────────────────────────────────
  function handleHashChange() {
    const wrap = $('club-screen-wrap');
    if (!wrap) return;
    if (location.hash === '#club') {
      // Show the club screen, hide everything else
      const guest = $('guest-view');
      const admin = $('admin-view');
      const pin = $('pin-overlay');
      if (guest) guest.classList.remove('active');
      if (admin) admin.classList.remove('active');
      if (pin) pin.classList.remove('active');
      wrap.style.display = 'block';
      renderClubScreen();
      window.scrollTo(0, 0);
    } else {
      wrap.style.display = 'none';
    }
  }

  // ─── Subscribe to members collection ─────────────────────
  function subscribe() {
    if (!window.App || !window.App.Store) return;
    window.App.Store.collection('members').onSnapshot((snap) => {
      state.members = [];
      snap.forEach(d => state.members.push(d.data()));
    });
  }

  // ─── Helper: find a member by phone (used by wine module future) ─
  function findByPhone(phone) {
    if (!phone) return null;
    const norm = phone.replace(/\s+/g, '').toLowerCase();
    return state.members.find((m) =>
      m.phone && m.phone.replace(/\s+/g, '').toLowerCase() === norm
    ) || null;
  }

  // ─── Init ────────────────────────────────────────────────
  function init() {
    if (state.initialized) return;
    state.initialized = true;
    injectFooterEntry();
    injectScreen();
    subscribe();
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  // Expose for debugging + cross-module use
  window.App = window.App || {};
  window.App.modules = window.App.modules || {};
  window.App.modules.ostreaClub = {
    state,
    findByPhone,
    renderClubScreen,
  };
})();
