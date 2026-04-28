// ═══════════════════════════════════════════════════
//  WINES SEED — V1 50 wines + config + curated boxes
// ═══════════════════════════════════════════════════
//  V2 — extended for the parchment design (direction-c5).
//  Adds per-wine: abv, volume, servingC, decantMin, glass,
//  bars, story, pairing, dishes, related, tier (alias of priceTier).
//
//  Selection per architecture plan §9.2.
//  Pricing tiers per §9.4: € 25 / €€ 40 / €€€ 70 / €€€€ 130.
//  Tomo can fine-tune each wine in admin Postavke.
//
//  Profile axes (each 0–100, independent):
//    sweetness  · freshness · dryness · fruitiness · body
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const PRICE_TIERS = { '€': 25, '€€': 40, '€€€': 70, '€€€€': 130 };

  // Style-derived defaults (used by the post-processor below).
  const STYLE_DEFAULTS = {
    red: {
      abv: 14.0, servingC: '17–18', glass: 'Bordeaux',
      pairing: 'Crveno meso, divljač, zreli sirevi',
      dishes: ['Janjetina ispod peke','Pašticada s njokima','Tagliata sa rikolom'],
    },
    white: {
      abv: 13.0, servingC: '10–12', glass: 'Univerzalna',
      pairing: 'Riba na žaru, plodovi mora, lagana jela',
      dishes: ['Brancin na žaru s blitvom','Crni rižoto','Lignje na žaru'],
    },
    rose: {
      abv: 13.0, servingC: '8–10', glass: 'Univerzalna',
      pairing: 'Predjela, plodovi mora, salate',
      dishes: ['Tuna tartar','Salata od hobotnice','Carpaccio od plodova mora'],
    },
    sparkling: {
      abv: 12.5, servingC: '6–8', glass: 'Flûte',
      pairing: 'Aperitiv, kamenice, predjela',
      dishes: ['Kamenice s limunom','Carpaccio od tunjevine','Predjela platter'],
    },
    dessert: {
      abv: 15.0, servingC: '12–14', glass: 'Desertna',
      pairing: 'Rožata, badem, zreli sirevi',
      dishes: ['Rožata s karamelom','Sir s domaćim medom','Tarta od smokve'],
    },
    orange: {
      abv: 13.5, servingC: '12–14', glass: 'Burgundac',
      pairing: 'Pršut, zreli sirevi, kuhana riba',
      dishes: ['Pršut & sir platter','Riba u soli','Cordon bleu'],
    },
  };

  // Story templates by grape — fallback when wine doesn't have a hand-written story.
  const GRAPE_STORIES = {
    'Pošip':                  (w) => `Pošip je glavica Korčule i Pelješca. ${w.producer} ga radi s pažnjom — mineralna struktura, žuta jabuka, blagi badem. Vino koje mirise more.`,
    'Rukatac':                (w) => `Rukatac je rijetka autohtona sorta. ${w.producer} čuva tradiciju kroz generacije — kremenitomineralni profil, gotovo slano, nesvakidašnje pitko.`,
    'Grk':                    (w) => `Grk uspijeva samo u pijesku Lumbarde — svega nekoliko hektara na svijetu. ${w.producer} čuva tu tradiciju. Suhi do kosti, gorkasto-bademski profil, zemljan i dostojanstven.`,
    'Malvasija Dubrovačka':   (w) => `Malvasija Dubrovačka je aromatski biser Konavla. ${w.producer} radi vino s mediteranskim travama i blagim medom — neusiljen, mediteranski karakter.`,
    'Malvazija Istarska':     (w) => `Malvazija Istarska je referenca istarskog vinogorja. ${w.producer} ju radi po tradiciji — bagrem, jabuka, gorkasta nota završnice koja definira sortu.`,
    'Sauvignon Blanc':        (w) => `Sauvignon Blanc je svjetski klasik. ${w.producer} ga interpretira kroz hrvatske terre — travnati profil, agrumi, naglašena svježina.`,
    'Chardonnay':             (w) => `${w.producer} radi Chardonnay po klasičnoj školi — sazrijevanje u hrastu daje teksturu, voće struktura. Slavonski biser.`,
    'Graševina':              (w) => `Graševina je hrvatska radna konjanica i ponos Slavonije. ${w.producer} ju radi sa srcem — žuta jabuka, dunja, blaga slatkoća, čista završnica.`,
    'Žilavka':                (w) => `Žilavka je hercegovački klasik. ${w.producer} čuva tradiciju — orah, suho cvijeće, kameni mineral. Strukturirana suha bjelica.`,
    'Žlahtina':               (w) => `Žlahtina je krčka delicija iz Vrbničkog polja. ${w.producer} ju radi za ljetne trenutke — lagana, pitka, blago slatkasta.`,
    'Tamjanika':              (w) => `Tamjanika je aromatska južnjačka sorta. ${w.producer} ju interpretira kroz Hercegovinu — ruža, liči, breskva, polusladak balans.`,
    'Škrlet':                 (w) => `Škrlet je moslavinska autohtona rijetkost. ${w.producer} radi u tradicionalnom stilu — cvjetni nos, jabuka, lagano voće.`,
    'Plavac Mali':            (w) => `Plavac mali na strmim padinama ${w.region} dobiva karakter koji nigdje drugdje ne nalazimo. ${w.producer} njegovuje tradiciju — sunce, kamen, more, ozbiljna ruka.`,
    'Plavac Sivi':            (w) => `Plavac sivi je rijetka mutacija Plavca malog. ${w.producer} ga radi u oranžnom stilu — citrusna kora, kim, hrastovina. Eksperimentalan i intrigantan.`,
    'Crljenak (Zinfandel)':   (w) => `Crljenak je dalmatinski predak Zinfandela — DNK potvrđen u 21. stoljeću. ${w.producer} ga vraća na zavičajno tlo. Marmeladni, papren, snažno voćan.`,
    'Babić':                  (w) => `Babić je šibensko-primoštenski klasik. ${w.producer} radi po tradiciji kraljevskih vinograda — koža, suhi plodovi, agresivni tanini koji s godinama dobivaju eleganciju.`,
    'Merlot':                 (w) => `Merlot u ${w.region} dobiva mediteranski naboj. ${w.producer} ga radi pristupačno — šljiva, čokolada, mekani tanini.`,
    'Syrah':                  (w) => `Syrah je svjetski grand u Dalmaciji. ${w.producer} ga radi u mediteranskom stilu — papar, ljubičice, plavi plodovi, pikantna začinska sredina.`,
    'Cabernet Sauvignon':     (w) => `Cabernet Sauvignon je internacionalna mjera struktura. ${w.producer} ga interpretira kroz Sjevernu Dalmaciju — ribizla, paprika, cedar.`,
    'Blatina':                (w) => `Blatina je hercegovački autoritet. ${w.producer} radi iz starih vinograda — divlje voće, kameni mineral, suhe začinske note.`,
    'Cab.Sau. – Mer. – Cab.Fra.': (w) => `Klasična bordoška kupaža u dalmatinskom okruženju. ${w.producer} ju gradi na strukturi — ribizla, cedar, fini tanini koji odoljevaju vremenu.`,
    'Pošip / Maraština':      (w) => `Kupaža autohtonih dalmatinskih sorti. ${w.producer} traži balans, srednje tijelo, svestrana podloga uz širok spektar jela.`,
    'Pošip / Chardonnay':     (w) => `${w.producer} radi pjenušac klasičnom metodom — druga fermentacija u boci, dugotrajno odležavanje. Brioš, jabuka, fina perlaža.`,
    'Pošip Crni':             (w) => `Pošip Crni je rijetka mutacija — ${w.producer} ga koristi za autentični korčulanski rosé. Jagoda, ruža, mineralna sol.`,
    'Glera':                  (w) => `Glera je dušа Prosecca. Klasični stil — kruška, jabuka, mekana perlaža, najjednostavnija radost.`,
    'Macabeo / Parellada / Xarello': (w) => `Klasična cava-kupaža iz Penedèsa. Suhi profil, citrus, jabuka — pouzdan izbor za društveni trenutak.`,
    'Chardonnay / Pinot Noir / Pinot Meunier': (w) => `Klasična bordo-kupaža Champagne tradicije. Brioš, žuta jabuka, lješnjak — referenca za stil.`,
    'Chardonnay / Pinot Noir': (w) => `Vrhunski milenijski šampanjac. Kompleksnost, finoća, dugovječnost — kategorija po sebi.`,
    'Chardonnay / Malvazija': (w) => `Istarski klasični-metoda pjenušac. Suhi, mineralni profil, fina perlaža.`,
  };

  function makeStory(w) {
    if (w.story) return w.story;
    const tpl = GRAPE_STORIES[w.grapeVariety];
    if (tpl) return tpl(w);
    return `${w.producer} radi vino iz ${w.region}. ${w.grapeVariety} u ovoj interpretaciji daje karakteran izričaj — autentično, mediteranski, s pažnjom prema mjestu.`;
  }

  // Helper to keep wine objects compact.
  function w(o) {
    const p = o.profile || {};
    return {
      id: o.id,
      name: o.name,
      producer: o.producer,
      year: o.year ?? null,
      style: o.style,
      grapeVariety: o.grape,
      region: o.region,
      country: o.country || 'Hrvatska',
      barrel: o.barrel || { type: 'steel', months: 0 },
      profile: {
        sweetness: p.sweetness ?? 0,
        freshness: p.freshness ?? 0,
        dryness:   p.dryness   ?? 0,
        fruitiness:p.fruitiness?? 0,
        body:      p.body      ?? 0,
      },
      tastingNotes: o.notes || '',
      priceTier: o.tier,
      restaurantPrice: o.priceOverride ?? PRICE_TIERS[o.tier],
      souvenirAvailable: o.souvenirAvailable !== false,
      souvenirStock: o.souvenirStock ?? null,
      inStock: o.inStock !== false,
      featured: o.featured || false,
      pairsWith: o.pairsWith || [],
      memberExclusive: o.memberExclusive || false,
      memberDiscountPct: o.memberDiscountPct || null,
      imageUrl: null,
      // Parchment-design fields (may be overridden per wine):
      abv: o.abv,
      volume: o.volume,
      servingC: o.servingC,
      decantMin: o.decantMin,
      glass: o.glass,
      bars: o.bars,
      story: o.story,
      pairing: o.pairing,
      dishes: o.dishes,
      related: o.related,
    };
  }

  const WINES = [
    // ═══════ WHITES (22) ═══════════════════════════════════
    w({ id:'posip-blato', name:'Pošip Blato', producer:'PZ Blato', year:2023, style:'white', grape:'Pošip', region:'Korčula', tier:'€',
       profile:{sweetness:8, freshness:72, dryness:55, fruitiness:60, body:55},
       notes:'Ulazni Pošip iz suradničke vinarije. Cvjetni nos, jabuka i kruška, čista mineralna završnica.' }),
    w({ id:'posip-madre-milinovic', name:'Pošip Madre Milinović', producer:'Milinović', year:2022, style:'white', grape:'Pošip', region:'Pelješac', tier:'€€',
       profile:{sweetness:7, freshness:70, dryness:62, fruitiness:65, body:65},
       notes:'Strukturiran Pošip s notama agruma i bijelog cvijeća. Lagana mineralnost iz kamenog tla Pelješca.' }),
    w({ id:'posip-marko-polo', name:'Pošip Marko Polo', producer:'Marko Polo Wines', year:2022, style:'white', grape:'Pošip', region:'Korčula', tier:'€€',
       profile:{sweetness:8, freshness:70, dryness:60, fruitiness:70, body:65},
       notes:'Klasični korčulanski Pošip — žuta jabuka, badem i more. Zaobljena tekstura, duga slana završnica.' }),
    w({ id:'posip-korta-katarina', name:'Pošip Korta Katarina', producer:'Korta Katarina', year:2021, style:'white', grape:'Pošip', region:'Pelješac', tier:'€€€', featured:true,
       profile:{sweetness:6, freshness:68, dryness:65, fruitiness:70, body:75}, barrel:{type:'mixed', months:6},
       abv:13.5, glass:'Burgundac', servingC:'10–12', decantMin:0,
       story:'Korta Katarina je obiteljski podrum iz Orebića. Ovaj Pošip dolazi s padina iznad mora — jugo donosi sol, sunce zrelost. Šest mjeseci u burgundskim bačvama daje teksturu bez gubitka napetosti.',
       pairing:'Riba na žaru, hobotnica ispod peke',
       dishes:['Hobotnica ispod peke','Brancin na žaru s blitvom','Crni rižoto'],
       related:['posip-grgic','grk-bire','rukatac-stalagmit-milos'],
       notes:'Premium Pošip s djelomičnim sazrijevanjem u bačvi. Bogat, kremast, s notama lješnjaka i kamenoga voća.' }),
    w({ id:'posip-grgic', name:'Pošip Grgić', producer:'Grgić Vina', year:2021, style:'white', grape:'Pošip', region:'Pelješac', tier:'€€€', featured:true,
       profile:{sweetness:6, freshness:72, dryness:62, fruitiness:68, body:72}, barrel:{type:'mixed', months:4},
       abv:13.5, glass:'Burgundac', servingC:'10–12',
       story:'Potpis Mike Grgića — jednog od graditelja kalifornijskog Napa Valleya, vraćenog kući u Pelješac. Elegancija, finoća, nota meda i bijelog cvijeća. Hrvatska klasa s napa-finožom.',
       pairing:'Bijela riba, hladna predjela, mladi sirevi',
       dishes:['Brancin na soli','Buzara s kamenicama','Burrata s mediteranskim biljem'],
       related:['posip-korta-katarina','malvasija-dbk-25-perpera','chardonnay-krauthaker'],
       notes:'Potpis Mikea Grgića — elegancija, finoća, nota meda i bijelog cvijeća.' }),
    w({ id:'posip-sur-lie', name:'Pošip Sur Lie', producer:'Skaramuča', year:2022, style:'white', grape:'Pošip', region:'Korčula', tier:'€€',
       profile:{sweetness:7, freshness:72, dryness:58, fruitiness:65, body:68}, barrel:{type:'steel', months:6},
       notes:'Pošip dozrijevan na talogu — kremasta tekstura, bogatija sredina, blagi miris kvasca.' }),
    w({ id:'rukatac-stalagmit-milos', name:'Rukatac Stalagmit', producer:'Vinarija Miloš', year:2022, style:'white', grape:'Rukatac', region:'Pelješac', tier:'€€',
       profile:{sweetness:5, freshness:78, dryness:62, fruitiness:55, body:55},
       notes:'Lagani, kremenitomineralni Rukatac. Zelena jabuka, limeta, naglasak soli — savršeno uz školjke.' }),
    w({ id:'rukatac-cara', name:'Rukatac PZ Čara', producer:'PZ Čara', year:2023, style:'white', grape:'Rukatac', region:'Korčula', tier:'€',
       profile:{sweetness:6, freshness:75, dryness:58, fruitiness:55, body:50},
       notes:'Pitki Rukatac iz suradničke vinarije Čara. Citrusni nos, suha završnica, dnevnog karaktera.' }),
    w({ id:'grk-reventon-zure', name:'Grk Reventon', producer:'Bartul Zure', year:2022, style:'white', grape:'Grk', region:'Lumbarda (Korčula)', tier:'€€€',
       profile:{sweetness:5, freshness:68, dryness:75, fruitiness:65, body:72},
       notes:'Rijetka sorta Grk iz pijeska Lumbarde. Strukturiran, gorkast, mineralan — vino za znalce.' }),
    w({ id:'grk-bire', name:'Grk Bire', producer:'Bire', year:2022, style:'white', grape:'Grk', region:'Lumbarda (Korčula)', tier:'€€',
       profile:{sweetness:5, freshness:70, dryness:72, fruitiness:62, body:68},
       notes:'Bire čuva tradiciju Grka — suh, gorkasto-bademski profil, zemljana mineralnost s pijeska.' }),
    w({ id:'malvasija-dbk-kremena', name:'Malvasija Dbk Kremena', producer:'Kremena', year:2022, style:'white', grape:'Malvasija Dubrovačka', region:'Konavle', tier:'€€',
       profile:{sweetness:10, freshness:65, dryness:55, fruitiness:75, body:60},
       notes:'Aromatski biser Konavla — narančin cvijet, breskva, suptilni med. Mekana, cvjetna završnica.' }),
    w({ id:'malvasija-dbk-25-perpera', name:'Malvasija Dbk 25 Perpera', producer:'Volarević', year:2021, style:'white', grape:'Malvasija Dubrovačka', region:'Konavle', tier:'€€€', featured:true,
       profile:{sweetness:12, freshness:65, dryness:55, fruitiness:78, body:65},
       abv:13.0, glass:'Univerzalna', servingC:'9–11',
       story:'25 Perpera bila je dubrovačka srebrena kovanica — ovo vino je njena tekuća verzija. Volarević radi Malvasiju s konavoskih terasa iznad mora: mediteranske trave, marelica, sol.',
       pairing:'Školjke, rižoto od plodova mora',
       dishes:['Školjke buzara','Rižoto od plodova mora','Tuna tartar'],
       related:['malvasija-dbk-kremena','orange-miljas','posip-korta-katarina'],
       notes:'Vrhunska Malvasija nazvana po staroj dubrovačkoj kovanici. Bogat aromatski profil, dugačka mineralna završnica.' }),
    w({ id:'malvazija-kozlovic', name:'Malvazija Kozlović', producer:'Kozlović', year:2022, style:'white', grape:'Malvazija Istarska', region:'Istra', tier:'€€',
       profile:{sweetness:6, freshness:72, dryness:60, fruitiness:70, body:62},
       notes:'Stilski referentna istarska Malvazija. Bagrem, jabuka, gorkasta završnica karakteristična za sortu.' }),
    w({ id:'malvazija-mala-nevina', name:'Mala Nevina', producer:'Saints Hills', year:2022, style:'white', grape:'Malvazija Istarska', region:'Istra', tier:'€€€',
       profile:{sweetness:7, freshness:70, dryness:62, fruitiness:72, body:70}, barrel:{type:'mixed', months:6},
       notes:'Saints Hillsova premium Malvazija. Djelomično u akaciji — kremasta, slojevita, s notama suhog cvijeća.' }),
    w({ id:'sauv-blanc-frenchie', name:'Sauvignon Blanc Frenchie', producer:'Erdoro', year:2023, style:'white', grape:'Sauvignon Blanc', region:'Slavonija', tier:'€€',
       profile:{sweetness:5, freshness:88, dryness:65, fruitiness:80, body:50},
       notes:'Svjež, hrskav slavonski Sauvignon. Travnati profil, grejp, marakuja — savršen aperitif.' }),
    w({ id:'sauv-blanc-litterarii', name:'Sauvignon Blanc Litterarii', producer:'Litterarii', year:2022, style:'white', grape:'Sauvignon Blanc', region:'Slavonija', tier:'€€€',
       profile:{sweetness:5, freshness:85, dryness:62, fruitiness:78, body:55},
       notes:'Elegantan Sauvignon s naglašenim mineralima. Profinjenost umjesto agresivnosti — zreliji stil.' }),
    w({ id:'grasevina-mitrovac', name:'Graševina Mitrovac', producer:'Krauthaker', year:2022, style:'white', grape:'Graševina', region:'Slavonija', tier:'€€',
       profile:{sweetness:10, freshness:72, dryness:50, fruitiness:72, body:60},
       notes:'Krauthakerova klasična Graševina iz vinograda Mitrovac. Žuta jabuka, dunja, blaga slatkoća, čista završnica.' }),
    w({ id:'chardonnay-krauthaker', name:'Chardonnay', producer:'Krauthaker', year:2021, style:'white', grape:'Chardonnay', region:'Slavonija', tier:'€€€',
       profile:{sweetness:7, freshness:62, dryness:55, fruitiness:68, body:78}, barrel:{type:'oak', months:9},
       notes:'Bogat, kremast Chardonnay sazrijevan u hrastu. Maslac, vanilija, žuta jabuka — slavonski klasik.' }),
    w({ id:'zilavka-nuic', name:'Žilavka Selekcija', producer:'Nuić', year:2022, style:'white', grape:'Žilavka', region:'Hercegovina', country:'BiH', tier:'€€',
       profile:{sweetness:6, freshness:65, dryness:65, fruitiness:60, body:65},
       notes:'Hercegovačka Žilavka — orah, suho cvijeće, kameni mineral. Strukturirana suha bjelica.' }),
    w({ id:'zlahtina-gospoja', name:'Žlahtina', producer:'Gospoja', year:2023, style:'white', grape:'Žlahtina', region:'Krk', tier:'€',
       profile:{sweetness:8, freshness:75, dryness:50, fruitiness:65, body:50},
       notes:'Krčka Žlahtina iz Vrbničkog polja. Lagana, pitka, blago slatkasta, idealna za vrelo poslijepodne.' }),
    w({ id:'skrlet-familia-kosutic', name:'Škrlet Familia', producer:'Košutić', year:2022, style:'white', grape:'Škrlet', region:'Moslavina', tier:'€€',
       profile:{sweetness:9, freshness:72, dryness:50, fruitiness:68, body:55},
       notes:'Moslavinski autohtoni Škrlet. Cvjetni nos, jabuka, lagano voće — nježan i pitak stil.' }),
    w({ id:'tamjanika-rubis', name:'Tamjanika', producer:'Rubis', year:2022, style:'white', grape:'Tamjanika', region:'Hercegovina', country:'BiH', tier:'€€',
       profile:{sweetness:35, freshness:62, dryness:40, fruitiness:88, body:60},
       notes:'Aromatska Tamjanika — ruža, liči, breskva. Polusladak stil koji kompenzira intenzivnu aromu.' }),
    w({ id:'cuvee-vukas', name:'Cuvée Vukas', producer:'Vukas', year:2022, style:'white', grape:'Pošip / Maraština', region:'Pelješac', tier:'€€',
       profile:{sweetness:7, freshness:70, dryness:58, fruitiness:68, body:65},
       notes:'Kupaža autohtonih dalmatinskih sorti — uravnotežen profil, srednje tijelo, svestrana podloga uz hranu.' }),

    // ═══════ ROSÉ (4) ═══════════════════════════════════════
    w({ id:'rose-stagnum-milos', name:'Stagnum Rosé', producer:'Vinarija Miloš', year:2023, style:'rose', grape:'Plavac Mali', region:'Pelješac', tier:'€€',
       profile:{sweetness:8, freshness:78, dryness:55, fruitiness:75, body:48},
       story:'Miloševi su jedni od rijetkih koji ozbiljno shvaćaju rosé. Direktna preša Plavca, hladna fermentacija — boja je svijetla, karakter ravan ozbiljnom bijelom.',
       pairing:'Tuna tartar, salata od hobotnice',
       dishes:['Tuna tartar s avokadom','Salata od hobotnice','Carpaccio od plodova mora'],
       related:['rose-korta-katarina','rose-posip-crni-nerica','rose-la-chic-volarevic'],
       notes:'Suhi rosé od Plavca malog. Jagoda, ružmarin, mineralni svežanj — ozbiljan rosé za večeru.' }),
    w({ id:'rose-korta-katarina', name:'Korta Katarina Rosé', producer:'Korta Katarina', year:2023, style:'rose', grape:'Plavac Mali', region:'Pelješac', tier:'€€€',
       profile:{sweetness:10, freshness:75, dryness:50, fruitiness:80, body:50},
       notes:'Elegantan rosé blijede boje. Trešnja, narančina kora, pitki svaki gutljaj. Provansa-stil iz Pelješca.' }),
    w({ id:'rose-posip-crni-nerica', name:'Pošip Crni Rosé', producer:'Nerica', year:2023, style:'rose', grape:'Pošip Crni', region:'Korčula', tier:'€€', featured:true,
       profile:{sweetness:12, freshness:78, dryness:48, fruitiness:78, body:48},
       story:'Pošip Crni je rijetka mutacija crnog grožđa Pošipa — koristi se za autentični korčulanski rosé. Nerica čuva tu raritetnost. Jagoda, ružino lišće, sol.',
       pairing:'Predjela, brodet, salata od hobotnice',
       dishes:['Brodet od bijele ribe','Salata od hobotnice','Crni rižoto'],
       related:['rose-stagnum-milos','rose-korta-katarina','posip-korta-katarina'],
       notes:'Rijedak rosé od crnog Pošipa — autentični korčulanski izričaj. Jagoda, ružino lišće, sol.' }),
    w({ id:'rose-la-chic-volarevic', name:'La Chic Rosé', producer:'Volarević', year:2023, style:'rose', grape:'Plavac Mali', region:'Konavle', tier:'€€',
       profile:{sweetness:14, freshness:72, dryness:48, fruitiness:75, body:50},
       notes:'Lagan i moderni rosé. Malina, breskva, pitka kiselina — stil za ljetne aperitive.' }),

    // ═══════ ORANGE / MACERIRANO (2) ════════════════════════
    w({ id:'orange-miljas', name:'Orange', producer:'Miljas', year:2022, style:'orange', grape:'Malvasija Dubrovačka', region:'Konavle', tier:'€€€',
       profile:{sweetness:6, freshness:60, dryness:78, fruitiness:65, body:72}, barrel:{type:'mixed', months:8},
       story:'Marko Miljas iz Konavala radi orange wine bez kompromisa: dva mjeseca maceracije, čak osam mjeseci u amfori i drvu. Boja čaja, struktura crvenoga, duša bijeloga.',
       pairing:'Pršut, zreli sirevi, kuhana riba',
       dishes:['Pršut & sir platter','Riba u soli','Cordon bleu'],
       related:['malvasija-dbk-25-perpera','orange-plavac-sivi','babic-korta-katarina'],
       notes:'Macerirana Malvasija u kontaktu s kožicom. Tanini, sušeno voće, čaj — orange za znalce.' }),
    w({ id:'orange-plavac-sivi', name:'Plavac Sivi Orange', producer:'Plavac Sivi', year:2022, style:'orange', grape:'Plavac Sivi', region:'Pelješac', tier:'€€€',
       profile:{sweetness:5, freshness:55, dryness:80, fruitiness:60, body:75}, barrel:{type:'oak', months:10},
       notes:'Sivi Plavac mali u oranžnom stilu. Citrusna kora, kim, hrastovina — eksperimentalan i intrigantan.' }),

    // ═══════ REDS (14) ══════════════════════════════════════
    w({ id:'plavac-stagnum-2012', name:'Plavac Stagnum 2012', producer:'Vinarija Miloš', year:2012, style:'red', grape:'Plavac Mali', region:'Pelješac', tier:'€€€€', featured:true,
       profile:{sweetness:6, freshness:48, dryness:82, fruitiness:70, body:92}, barrel:{type:'oak', months:24},
       abv:14.5, glass:'Bordeaux', servingC:'17–18', decantMin:60,
       story:'Frano Miloš pravi vino kao da je 1850. Plavac sa Pelješca, dvije godine u velikim slavonskim bačvama, bez kompromisa. Stagnum je bio rimski naziv za Ston — ovo je vino vremena i mjesta.',
       pairing:'Janjetina ispod peke, divljač, zreli sirevi',
       dishes:['Janjetina ispod peke','Pašticada s njokima','Tagliata s tartufima'],
       related:['plavac-don-josip-postup','plavac-grgic-2018','plavac-ivan-dolac'],
       notes:'Ikoničan zreli Plavac iz Stona. Suhi šumski plodovi, koža, duhan, kava — moćan i kompleksan.' }),
    w({ id:'plavac-grgic-2018', name:'Plavac Grgić 2018', producer:'Grgić Vina', year:2018, style:'red', grape:'Plavac Mali', region:'Pelješac', tier:'€€€€',
       profile:{sweetness:5, freshness:50, dryness:85, fruitiness:72, body:90}, barrel:{type:'oak', months:18},
       notes:'Grgićev autoritativni Plavac. Crna trešnja, lovor, kameni minerali, snažna struktura tanina.' }),
    w({ id:'plavac-korta-katarina', name:'Plavac Korta Katarina', producer:'Korta Katarina', year:2019, style:'red', grape:'Plavac Mali', region:'Pelješac', tier:'€€€',
       profile:{sweetness:7, freshness:52, dryness:78, fruitiness:78, body:88}, barrel:{type:'oak', months:14},
       notes:'Klasičan Pelješki Plavac — zrele višnje, paprika, mediteransko bilje, balansirana hrastovina.' }),
    w({ id:'plavac-sv-roko', name:'Plavac Sv. Roko', producer:'Saints Hills', year:2020, style:'red', grape:'Plavac Mali', region:'Pelješac', tier:'€€', featured:true,
       profile:{sweetness:8, freshness:55, dryness:75, fruitiness:80, body:85}, barrel:{type:'oak', months:12},
       abv:14.0, glass:'Bordeaux', servingC:'17–18', decantMin:30,
       story:'Saints Hills radi Plavac kao moderan klasik — nazvan po patronu Pelješca. Dvanaest mjeseci u hrastu, balans struktura i pitkost. Dobar uvod u kategoriju i pouzdan posjetilac stola.',
       pairing:'Crveno meso, pašticada, tvrdi sirevi',
       dishes:['Pašticada s njokima','Janjetina ispod peke','Tagliata s rikolom'],
       related:['plavac-korta-katarina','plavac-bartul-barrique','plavac-stagnum-2012'],
       notes:'Pristupačan ali ozbiljan Plavac. Šljiva, čokolada, ružmarin — dobar uvod u kategoriju.' }),
    w({ id:'plavac-bartul-barrique', name:'Plavac Bartul Barrique', producer:'Bartul', year:2019, style:'red', grape:'Plavac Mali', region:'Brač', tier:'€€€',
       profile:{sweetness:6, freshness:52, dryness:80, fruitiness:75, body:88}, barrel:{type:'oak', months:18},
       notes:'Brački Plavac iz hrasta. Karob, kakao, suho cvijeće, taninska kičma. Tipično otočki karakter.' }),
    w({ id:'plavac-ivan-dolac', name:'Plavac Ivan Dolac', producer:'PZ Svirče', year:2020, style:'red', grape:'Plavac Mali', region:'Hvar', tier:'€€€',
       profile:{sweetness:7, freshness:50, dryness:80, fruitiness:78, body:90}, barrel:{type:'oak', months:14},
       notes:'Položajni Plavac sa strmih hvarskih vinograda. Smola, suho voće, sol mora — kultni izričaj.' }),
    w({ id:'plavac-don-josip-postup', name:'Postup Don Josip', producer:'Mikulić', year:2018, style:'red', grape:'Plavac Mali', region:'Postup (Pelješac)', tier:'€€€€', featured:true,
       profile:{sweetness:6, freshness:48, dryness:85, fruitiness:75, body:92}, barrel:{type:'oak', months:20},
       abv:14.5, glass:'Bordeaux', servingC:'17–18', decantMin:60,
       story:'Postup je zaštićeni vrhunski položaj — južne padine Pelješca koje sunce gleda s tri strane. Mikulićev primjerak je ozbiljnost u boci: duboki tanini, dugovječan, definicija mjesta.',
       pairing:'Divljač, ribarska brodet, zreli tvrdi sirevi',
       dishes:['Divljač s borovnicama','Tagliatelle s tartufima','Sir & pršut platter'],
       related:['plavac-stagnum-2012','plavac-grgic-2018','cuvee-jakob'],
       notes:'Postup je zaštićen vrhunski položaj. Mikulićev primjerak — duboki tanini, dugovječan i moćan.' }),
    w({ id:'crljenak-zinfandel-korta', name:'Zinfandel', producer:'Korta Katarina', year:2019, style:'red', grape:'Crljenak (Zinfandel)', region:'Pelješac', tier:'€€€',
       profile:{sweetness:12, freshness:55, dryness:70, fruitiness:88, body:85}, barrel:{type:'oak', months:14},
       notes:'Crljenak — rodbinski preteča kalifornijskog Zinfandela. Marmeladni, papren, snažno voćan profil.' }),
    w({ id:'babic-korta-katarina', name:'Babić', producer:'Korta Katarina', year:2019, style:'red', grape:'Babić', region:'Šibenik', tier:'€€€',
       profile:{sweetness:5, freshness:55, dryness:85, fruitiness:65, body:80}, barrel:{type:'oak', months:14},
       notes:'Šibenski Babić — koža, suhi plodovi, agresivni tanini koji s godinama dobivaju eleganciju.' }),
    w({ id:'merlot-negromat', name:'Merlot Negromat', producer:'Crvik', year:2020, style:'red', grape:'Merlot', region:'Konavle', tier:'€€',
       profile:{sweetness:9, freshness:50, dryness:62, fruitiness:78, body:75}, barrel:{type:'oak', months:10},
       notes:'Konavoski Merlot — šljiva, čokolada, mekani tanini. Pristupačan i prijateljski stil.' }),
    w({ id:'syrah-korlat', name:'Syrah', producer:'Korlat', year:2019, style:'red', grape:'Syrah', region:'Sjeverna Dalmacija', tier:'€€€',
       profile:{sweetness:7, freshness:55, dryness:75, fruitiness:72, body:85}, barrel:{type:'oak', months:14},
       notes:'Korlatov Syrah — papar, ljubičice, plavi plodovi, pikantna začinska sredina. Mediteranski stil.' }),
    w({ id:'cab-sauv-korlat', name:'Cabernet Sauvignon', producer:'Korlat', year:2019, style:'red', grape:'Cabernet Sauvignon', region:'Sjeverna Dalmacija', tier:'€€€',
       profile:{sweetness:5, freshness:50, dryness:82, fruitiness:65, body:85}, barrel:{type:'oak', months:14},
       notes:'Strukturiran Cabernet — ribizla, paprika, cedar. Klasičan profil iz Benkovačkog područja.' }),
    w({ id:'blatina-veteribus', name:'Blatina Veteribus Barrique', producer:'Rubis', year:2019, style:'red', grape:'Blatina', region:'Hercegovina', country:'BiH', tier:'€€€',
       profile:{sweetness:6, freshness:55, dryness:78, fruitiness:70, body:80}, barrel:{type:'oak', months:18},
       notes:'Hercegovačka Blatina iz starih vinograda — divlje voće, kameni mineral, suhe začinske note.' }),
    w({ id:'cuvee-jakob', name:'Cuvée Jakob', producer:'Vinarija Jakob', year:2018, style:'red', grape:'Cab.Sau. – Mer. – Cab.Fra.', region:'Konavle', tier:'€€€', featured:true,
       profile:{sweetness:7, freshness:52, dryness:75, fruitiness:75, body:85}, barrel:{type:'oak', months:18},
       abv:14.0, glass:'Bordeaux', servingC:'17–18', decantMin:45,
       story:'Klasična bordoška kupaža u dalmatinskom okruženju. Cabernet daje strukturu, Merlot zaobljuje, Cab Franc parfimira. Osamnaest mjeseci u hrastu, godine ostatka u boci.',
       pairing:'Janjetina, divljač, zreli sirevi',
       dishes:['Janjetina ispod peke','Bistecca alla Fiorentina','Sir & pršut platter'],
       related:['plavac-don-josip-postup','plavac-stagnum-2012','syrah-korlat'],
       notes:'Bordoška kupaža u dalmatinskom okruženju. Klasičan profil — ribizla, cedar, fini tanini.' }),

    // ═══════ SPARKLING (5) ═════════════════════════════════
    w({ id:'pjenusac-vukas-decumanus', name:'Decumanus Pjenušac', producer:'Vukas', year:null, style:'sparkling', grape:'Pošip / Chardonnay', region:'Pelješac', tier:'€€€', featured:true,
       profile:{sweetness:8, freshness:88, dryness:42, fruitiness:62, body:55},
       abv:12.5, glass:'Flûte', servingC:'6–8',
       story:'Vukas radi pjenušac metodom koju su naučili u Champagne — druga fermentacija u boci, 24 mjeseca na talogu. Decumanus je rimski put kroz Stoljeća; ovo vino je fina nit kroz njih.',
       pairing:'Kamenice, predjela, aperitiv',
       dishes:['Kamenice s limunom','Carpaccio od tunjevine','Sushi platter'],
       related:['pjenusac-misal-persuric','prosecco-075','moet-chandon-075'],
       notes:'Klasičan-metoda pjenušac iz Dalmacije. Brioš, jabuka, fina perlaža — svečani trenutak.' }),
    w({ id:'pjenusac-misal-persuric', name:'Misal Pjenušac', producer:'Peršurić', year:null, style:'sparkling', grape:'Chardonnay / Malvazija', region:'Istra', tier:'€€€',
       profile:{sweetness:7, freshness:88, dryness:45, fruitiness:60, body:55},
       notes:'Istarski klasik. Suhi, mineralni profil, fina perlaža, tradicija proizvodnje od osamdesetih.' }),
    w({ id:'pjenusac-matriarch', name:'Matriarch', producer:'Saints Hills', year:null, style:'sparkling', grape:'Pošip', region:'Pelješac', tier:'€€€€',
       profile:{sweetness:6, freshness:90, dryness:48, fruitiness:60, body:60},
       notes:'Premium pjenušac od Pošipa. Klasična metoda, dugotrajno odležavanje na talogu — brioš, lješnjak, sol.' }),
    w({ id:'prosecco-075', name:'Prosecco', producer:'Astoria', year:null, style:'sparkling', grape:'Glera', region:'Veneto', country:'Italija', tier:'€€',
       profile:{sweetness:18, freshness:80, dryness:35, fruitiness:75, body:48},
       notes:'Klasični talijanski Prosecco. Kruška, jabuka, mekana perlaža — najjednostavnija radost.' }),
    w({ id:'freixenet-075', name:'Freixenet Cordon Negro', producer:'Freixenet', year:null, style:'sparkling', grape:'Macabeo / Parellada / Xarello', region:'Penedès', country:'Španjolska', tier:'€€',
       profile:{sweetness:10, freshness:82, dryness:45, fruitiness:60, body:50},
       notes:'Cava klasik. Suhi profil, citrus, jabuka — pouzdan izbor za društveni trenutak.' }),

    // ═══════ CHAMPAGNE (3) ═════════════════════════════════
    w({ id:'moet-chandon-075', name:'Moët & Chandon Brut Impérial', producer:'Moët & Chandon', year:null, style:'sparkling', grape:'Chardonnay / Pinot Noir / Pinot Meunier', region:'Champagne', country:'Francuska', tier:'€€€€', featured:true,
       profile:{sweetness:8, freshness:88, dryness:50, fruitiness:65, body:55},
       abv:12.0, glass:'Flûte', servingC:'6–8',
       story:'Najpoznatiji šampanjac na svijetu, kuća osnovana 1743. Brut Impérial je referenca za stil — brioš, žuta jabuka, lješnjak. Standard po kojem se mjere ostali.',
       pairing:'Aperitiv, kamenice, lagana riba',
       dishes:['Kamenice prirodne','Tartar od lososa','Carpaccio od tunjevine'],
       related:['dom-perignon','ruinart','pjenusac-vukas-decumanus'],
       notes:'Najpoznatiji šampanjac na svijetu. Brioš, žuta jabuka, lješnjak — referenca za stil.' }),
    w({ id:'dom-perignon', name:'Dom Pérignon', producer:'Moët & Chandon', year:2013, style:'sparkling', grape:'Chardonnay / Pinot Noir', region:'Champagne', country:'Francuska', tier:'€€€€', featured:true, priceOverride:380,
       profile:{sweetness:6, freshness:90, dryness:55, fruitiness:60, body:65},
       notes:'Vrhunski milenijski šampanjac. Kompleksnost, finoća, dugovječnost — definicija luksuza.' }),
    w({ id:'ruinart', name:'Ruinart Blanc de Blancs', producer:'Ruinart', year:null, style:'sparkling', grape:'Chardonnay', region:'Champagne', country:'Francuska', tier:'€€€€', priceOverride:220,
       profile:{sweetness:5, freshness:92, dryness:55, fruitiness:55, body:55},
       notes:'Najstarija kuća šampanjca, samo Chardonnay. Profinjenost, citrus, kremenita mineralnost.' }),

    // ═══════ DESSERT (3) ═══════════════════════════════════
    w({ id:'posip-slatki-nerica', name:'Pošip Slatki', producer:'Nerica', year:2020, style:'dessert', grape:'Pošip', region:'Korčula', tier:'€€€', priceOverride:55,
       profile:{sweetness:78, freshness:60, dryness:30, fruitiness:82, body:70},
       volume:500,
       notes:'Slatki Pošip iz prosušenog grožđa. Med, marelica, suho cvijeće — idealan uz tvrdi sir.' }),
    w({ id:'malvasija-dbk-prosek', name:'Prošek Malvasija Dbk', producer:'Volarević', year:2018, style:'dessert', grape:'Malvasija Dubrovačka', region:'Konavle', tier:'€€€€', featured:true, priceOverride:90,
       profile:{sweetness:88, freshness:55, dryness:25, fruitiness:78, body:75},
       volume:375, abv:15.0, glass:'Desertna', servingC:'12–14',
       story:'Prošek se pravi od prosušenog grožđa — prirodno koncentrirano, autentični dalmatinski klasik star koliko i sama Dalmacija. Volarević radi iz 2018: tri godine u bačvi, med koji ne staje.',
       pairing:'Rožata, badem, zreli sirevi',
       dishes:['Rožata s karamelom','Sir s domaćim medom','Tarta od smokve'],
       related:['posip-slatki-nerica','plavac-elihu-rozic','malvasija-dbk-25-perpera'],
       notes:'Prošek — autentični dalmatinski desertni klasik. Med, suhe smokve, oraščić, beskonačna završnica.' }),
    w({ id:'plavac-elihu-rozic', name:'Plavac Elihu Slatki', producer:'Rozić', year:2019, style:'dessert', grape:'Plavac Mali', region:'Pelješac', tier:'€€€', priceOverride:60,
       profile:{sweetness:80, freshness:50, dryness:35, fruitiness:82, body:80},
       volume:500,
       notes:'Slatki crni od prosušenog Plavca. Šljiva u rumu, čokolada, kandirano voće — desert sam za sebe.' }),
  ];

  // ─── POST-PROCESSOR — fill in default fields for parchment design ──────
  function autoRelated(wine, all) {
    if (wine.related && wine.related.length) return wine.related;
    if (wine.pairsWith && wine.pairsWith.length) return wine.pairsWith.slice(0, 3);
    // pick 3 same-style wines, prefer same region
    const sameStyle = all.filter(o => o.style === wine.style && o.id !== wine.id);
    sameStyle.sort((a, b) => {
      const aMatch = a.region === wine.region ? 0 : 1;
      const bMatch = b.region === wine.region ? 0 : 1;
      return aMatch - bMatch;
    });
    return sameStyle.slice(0, 3).map(o => o.id);
  }

  function decantFor(w) {
    if (w.style !== 'red' && w.style !== 'orange') return 0;
    const months = (w.barrel && w.barrel.months) || 0;
    if (w.style === 'orange') return 30;
    if (months >= 18) return 60;
    if (months >= 12) return 30;
    return 0;
  }

  WINES.forEach((wine, i) => {
    const sd = STYLE_DEFAULTS[wine.style] || STYLE_DEFAULTS.white;
    if (wine.abv === undefined)       wine.abv = sd.abv;
    if (wine.volume === undefined)    wine.volume = 750;
    if (wine.servingC === undefined)  wine.servingC = sd.servingC;
    if (wine.decantMin === undefined) wine.decantMin = decantFor(wine);
    if (wine.glass === undefined)     wine.glass = sd.glass;
    if (wine.bars === undefined) {
      wine.bars = {
        sugar:   wine.profile.sweetness,
        acid:    Math.round(wine.profile.freshness * 0.95),
        tannin:  wine.style === 'red' ? wine.profile.dryness :
                 wine.style === 'orange' ? Math.round(wine.profile.dryness * 0.5) : 0,
        alcohol: wine.abv,
      };
    }
    if (wine.story === undefined || wine.story === null) wine.story = makeStory(wine);
    if (wine.pairing === undefined)   wine.pairing = sd.pairing;
    if (wine.dishes === undefined)    wine.dishes = sd.dishes.slice();
    if (wine.tier === undefined)      wine.tier = wine.priceTier;
  });
  // Second pass for related (needs the full list available)
  WINES.forEach((wine) => {
    if (wine.related === undefined) wine.related = autoRelated(wine, WINES);
  });

  // ─── Curated boxes (5 V1 themes) ──────────────────────────
  const CURATED_BOXES = [
    { id:'box-klasici-dalmacije',  name:'Klasici Dalmacije',  tier:6,  theme:'classics_dalmatia',
      description:'Najbolji predstavnici dalmatinskog vinogorja — bijela i crvena.',
      wineIds:['posip-korta-katarina','posip-grgic','rukatac-stalagmit-milos','plavac-korta-katarina','plavac-stagnum-2012','babic-korta-katarina'] },
    { id:'box-bijela-kolekcija',   name:'Bijela kolekcija',   tier:6,  theme:'whites_collection',
      description:'Šest različitih lica hrvatskih bjelaca — od Korčule do Slavonije.',
      wineIds:['posip-madre-milinovic','grk-bire','malvasija-dbk-kremena','malvazija-kozlovic','sauv-blanc-frenchie','grasevina-mitrovac'] },
    { id:'box-premium',            name:'Premium',            tier:12, theme:'premium',
      description:'Vrhunska selekcija za posebne trenutke.',
      wineIds:['plavac-stagnum-2012','plavac-grgic-2018','plavac-don-josip-postup','posip-grgic','posip-korta-katarina','cuvee-jakob','dom-perignon','ruinart','pjenusac-misal-persuric','malvasija-dbk-prosek','malvasija-dbk-25-perpera','tamjanika-rubis'] },
    { id:'box-pjenusavi-trenutci', name:'Pjenušavi trenutci', tier:3,  theme:'bubbly',
      description:'Tri pjenušca za slavlje — domaći, talijanski, francuski.',
      wineIds:['pjenusac-vukas-decumanus','prosecco-075','moet-chandon-075'] },
    { id:'box-slatki-zavrseci',    name:'Slatki završeci',    tier:3,  theme:'sweet_finish',
      description:'Trio desertnih klasika za savršen kraj večere.',
      wineIds:['posip-slatki-nerica','malvasija-dbk-prosek','plavac-elihu-rozic'] },
  ];

  // ─── Wine cellar config ──────────────────────────────────
  const WINE_CONFIG = {
    id: 'wines',
    priceTiers: PRICE_TIERS,
    souvenirDiscountPct: 0.25,
    boxTierDiscounts: { 3: 0.03, 6: 0.07, 12: 0.12 },
    pickupEtaMinutes: 10,
    curatedBoxes: CURATED_BOXES,
    currency: 'EUR',
    currencySymbol: '€',
  };

  // ─── Bootstrap ───────────────────────────────────────────
  // Idempotent — won't overwrite existing data unless we force.
  // V2 SCHEMA BUMP — if the existing seed lacks the parchment fields
  // (story / abv / etc) on every wine, force re-seed so the design has data.
  function needsReseed() {
    if (!window.App || !window.App.Store) return false;
    const existing = window.App.Store.readAll('wines');
    if (existing.length === 0) return true;
    const sample = existing[0];
    return !sample.story || !sample.abv || !sample.bars;
  }
  function bootstrap() {
    if (!window.App || !window.App.Store) {
      console.warn('[wines-seed] App.Store not yet available');
      return;
    }
    if (needsReseed()) {
      console.log('[wines-seed] schema upgrade — reseeding', WINES.length, 'wines');
      window.App.Store.reseed('wines', WINES);
    } else {
      window.App.Store.seedIfEmpty('wines', WINES);
    }
    const cfgExisting = window.App.Store.readAll('config');
    const cfgDoc = cfgExisting.find((d) => d.id === 'wines');
    if (!cfgDoc || !cfgDoc.curatedBoxes) {
      window.App.Store.collection('config').doc('wines').set(WINE_CONFIG);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Expose for admin reset / debugging
  window.App = window.App || {};
  window.App.WinesSeed = { WINES, CURATED_BOXES, WINE_CONFIG, PRICE_TIERS, STYLE_DEFAULTS, GRAPE_STORIES };
})();
