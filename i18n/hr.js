// ═══════════════════════════════════════════════════
//  i18n/hr.js — Croatian strings + t() helper
// ═══════════════════════════════════════════════════
//  V1 covers wine + ostrea-club only. Existing waitlist +
//  bookings strings stay inline in app.js until the full
//  refactor.
//
//  Usage:  App.t('wine.detail.add_to_box')
//          App.t('wine.detail.year_label', { year: 2021 })
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const HR = {

    // ─── Common ─────────────────────────────────────────────
    'common.back': '← Natrag',
    'common.cancel': 'Odustani',
    'common.confirm': 'Potvrdi',
    'common.save': 'Spremi',
    'common.close': '✕',
    'common.loading': 'Učitavanje…',
    'common.empty': 'Trenutno nema rezultata.',
    'common.optional': '(opcionalno)',
    'common.required': '*',

    // ─── Wine cellar — top-level ────────────────────────────
    'wine.tab.title': 'Vinski podrum',
    'wine.tab.sub': 'Otkrijte naš podrum i ponesite ga kući',

    // ─── Wine browse ────────────────────────────────────────
    'wine.browse.heading': 'Naš vinski podrum',
    'wine.browse.subheading': 'Birano s pažnjom — od dalmatinskih klasika do svjetskih biser',
    'wine.browse.mood.title': 'Raspoloženje',
    'wine.browse.mood.classics_dalmatia': 'Klasici Dalmacije',
    'wine.browse.mood.light_fresh': 'Lagano i osvježavajuće',
    'wine.browse.mood.bold_red': 'Snažno crveno',
    'wine.browse.mood.bubbly': 'Pjenušavi trenutci',
    'wine.browse.mood.sweet_finish': 'Slatki završeci',
    'wine.browse.mood.macerated': 'Macerirano',

    'wine.browse.filter.title': 'Filtri',
    'wine.browse.filter.all': 'Sve',
    'wine.browse.filter.style.red': 'Crveno',
    'wine.browse.filter.style.white': 'Bijelo',
    'wine.browse.filter.style.rose': 'Rosé',
    'wine.browse.filter.style.sparkling': 'Pjenušac',
    'wine.browse.filter.style.dessert': 'Desertno',
    'wine.browse.filter.style.orange': 'Macerirano',

    'wine.browse.region.label': 'Regija',
    'wine.browse.grape.label': 'Sorta',
    'wine.browse.clear_filters': 'Poništi filtre',
    'wine.browse.count': '{n} vina',
    'wine.browse.empty': 'Nijedno vino ne odgovara odabiru. Pokušajte sa širim filtrom.',
    'wine.browse.featured_label': 'Preporuka',

    // ─── Wine card (in browse list) ────────────────────────
    'wine.card.from': 'iz',
    'wine.card.year_unknown': 'v.n.s.',
    'wine.card.add': '+ Kovčeg',
    'wine.card.tap_for_details': 'Detalji →',

    // ─── Wine detail screen ────────────────────────────────
    'wine.detail.profile.title': 'Profil okusa',
    'wine.detail.profile.sweetness': 'Slatkoća',
    'wine.detail.profile.freshness': 'Svježina',
    'wine.detail.profile.dryness': 'Suhoća',
    'wine.detail.profile.fruitiness': 'Voćnost',
    'wine.detail.profile.body': 'Tijelo',

    'wine.detail.region': 'Regija',
    'wine.detail.country': 'Zemlja',
    'wine.detail.year': 'Godina',
    'wine.detail.year_unknown': 'Bez godine',
    'wine.detail.barrel': 'Sazrijevanje',
    'wine.detail.grape': 'Sorta',
    'wine.detail.producer': 'Vinarija',
    'wine.detail.style': 'Stil',

    'wine.detail.barrel.oak': 'Hrastova bačva',
    'wine.detail.barrel.steel': 'Inox',
    'wine.detail.barrel.mixed': 'Bačva i inox',
    'wine.detail.barrel.none': 'Bez sazrijevanja',
    'wine.detail.barrel.months': '{m} mjeseci',

    'wine.detail.tasting.title': 'Bilješka',
    'wine.detail.price.title': 'Cijena',
    'wine.detail.price.restaurant': 'U restoranu',
    'wine.detail.price.app': 'U aplikaciji',
    'wine.detail.price.savings': 'uštedite {pct}%',

    'wine.detail.add_to_box': 'Dodaj u kovčeg',
    'wine.detail.added': '✓ Dodano',
    'wine.detail.compare': 'Usporedi',
    'wine.detail.remove_from_box': '− Ukloni',

    // ─── Style labels ──────────────────────────────────────
    'wine.style.red': 'Crveno vino',
    'wine.style.white': 'Bijelo vino',
    'wine.style.rose': 'Rosé',
    'wine.style.sparkling': 'Pjenušac',
    'wine.style.dessert': 'Desertno vino',
    'wine.style.orange': 'Macerirano',

    // ─── Box / Vinski Kovčeg ───────────────────────────────
    'wine.box.title': 'Vinski kovčeg',
    'wine.box.subtitle': 'Vaš souvenir iz Kapetanove kuće',
    'wine.box.tab.curated': 'Kurirano',
    'wine.box.tab.free': 'Slobodan odabir',
    'wine.box.tier.title': 'Veličina kovčega',
    'wine.box.tier.3': '3 boce',
    'wine.box.tier.6': '6 boca',
    'wine.box.tier.12': '12 boca',
    'wine.box.tier.discount': 'popust {pct}%',
    'wine.box.slot.empty': 'Prazno',
    'wine.box.slot.add': '+ Dodaj boca',
    'wine.box.suggestions.title': 'Dovrši kovčeg',
    'wine.box.suggestions.empty': 'Bravo — kovčeg je popunjen.',
    'wine.box.subtotal': 'Boce ukupno',
    'wine.box.tier_bonus': 'Bonus {tier}-pack',
    'wine.box.total': 'Za platiti',
    'wine.box.checkout': 'Naruči kovčeg →',
    'wine.box.empty_cta': 'Počnite popunjavati kovčeg',
    'wine.box.compare': 'Usporedi odabrana',

    // ─── Order checkout ────────────────────────────────────
    'wine.checkout.title': 'Vaši podaci',
    'wine.checkout.linked.waitlist': 'Povezano s vašim mjestom u redu',
    'wine.checkout.linked.booking': 'Povezano s vašom rezervacijom',
    'wine.checkout.linked.standalone': 'Bez rezervacije — unesite kontakt',
    'wine.checkout.notes': 'Napomena (opcionalno)',
    'wine.checkout.submit': 'Potvrdi narudžbu →',

    'wine.confirm.heading': 'Hvala!',
    'wine.confirm.message': 'Tvoj kovčeg bit će spreman za 10 minuta na šanku.',
    'wine.confirm.eta': 'Spremno za {min} minuta',
    'wine.confirm.bottles': '{n} {boca}',

    // ─── Comparison ────────────────────────────────────────
    'wine.compare.title': 'Usporedba vina',
    'wine.compare.empty': 'Odaberite barem dva vina za usporedbu.',
    'wine.compare.close': '✕ Zatvori usporedbu',

    // ─── Ostrea Club ───────────────────────────────────────
    'club.tab.title': 'Ostrea Club',
    'club.tab.sub': 'Naš klub odanih gostiju',
    'club.signup.heading': 'Postanite član',
    'club.signup.subheading': 'Ekskluzivna vina, prioritetne rezervacije i pažnja kakvu zaslužujete.',
    'club.signup.perks.title': 'Što dobivate',
    'club.signup.perks.priority': 'Prioritetne rezervacije i bolja mjesta',
    'club.signup.perks.exclusive_wines': 'Ekskluzivna vina dostupna samo članovima',
    'club.signup.perks.discount': 'Trajni popust na sve narudžbe iz aplikacije',
    'club.signup.perks.events': 'Pozivi na degustacije i privatne večeri',
    'club.signup.perks.birthday': 'Iznenađenje za rođendan',

    'club.signup.name': 'Ime i prezime',
    'club.signup.phone': 'Telefon',
    'club.signup.email': 'Email',
    'club.signup.birthdate': 'Datum rođenja (opcionalno)',
    'club.signup.submit': 'Postani član →',
    'club.signup.coming_soon': 'Klub se priprema — uskoro!',

    'club.tier.silver': 'Srebrni',
    'club.tier.gold': 'Zlatni',
    'club.tier.platinum': 'Platinasti',

    'club.welcome.heading': 'Dobrodošli u Ostrea Club',
    'club.welcome.message': 'Hvala što ste s nama. Vaše članstvo je aktivno.',

    // ─── Admin (wine cellar tab) ───────────────────────────
    'admin.wine.tab': 'Vinski podrum',
    'admin.wine.subtab.catalog': 'Katalog',
    'admin.wine.subtab.orders': 'Narudžbe',
    'admin.wine.subtab.settings': 'Postavke',
    'admin.club.tab': 'Klub',
  };

  function t(key, vars) {
    let s = HR[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return s;
  }

  window.App = window.App || {};
  window.App.t = t;
  window.App.i18n = { hr: HR };
})();
