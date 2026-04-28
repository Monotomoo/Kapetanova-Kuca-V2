// ═══════════════════════════════════════════════════
//  STORE — localStorage adapter w/ Firestore-shape API
// ═══════════════════════════════════════════════════
//  Mirrors enough of Firebase compat Firestore that our
//  modules can call db.collection('wines').add(...) etc.
//  When Tomo flips to live Firestore, swap this for the
//  real `firebase.firestore()` and the modules don't change.
//
//  Persistence: localStorage, key prefix `kk:store:<col>`.
//  Each collection = JSON array of documents.
//  IDs auto-generated (`local-<ts>-<rand>`).
//  Subscribers fire on every write to that collection.
//
//  NOT supported (intentionally — yagni for V1):
//   - sub-collections
//   - real-time across tabs (single-tab dev only)
//   - server timestamps (uses Date.now())
//   - composite indexes / multi-where queries
//   - transactions
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const PREFIX = 'kk:store:';
  const subscribers = Object.create(null); // collection -> [fn]

  // -- low-level read/write -------------------------------------
  function readCol(name) {
    try {
      const raw = localStorage.getItem(PREFIX + name);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[store] readCol failed', name, e);
      return [];
    }
  }
  function writeCol(name, docs) {
    try {
      localStorage.setItem(PREFIX + name, JSON.stringify(docs));
      notify(name);
    } catch (e) {
      console.error('[store] writeCol failed', name, e);
    }
  }
  function notify(name) {
    if (!subscribers[name]) return;
    const snapshot = makeSnapshot(name);
    subscribers[name].slice().forEach((fn) => {
      try { fn(snapshot); } catch (err) { console.error('[store] subscriber error', err); }
    });
  }

  // -- id generation --------------------------------------------
  function genId() {
    return 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // -- snapshot factory -----------------------------------------
  function makeSnapshot(name, filters, sort, limit) {
    let docs = readCol(name);
    if (filters && filters.length) {
      docs = docs.filter((d) => filters.every((f) => match(d, f)));
    }
    if (sort) {
      const { field, dir } = sort;
      docs = docs.slice().sort((a, b) => {
        const av = a[field], bv = b[field];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return dir === 'desc' ? -cmp : cmp;
      });
    }
    if (limit) docs = docs.slice(0, limit);
    return {
      docs: docs.map((d) => ({
        id: d.id,
        data: () => ({ ...d }),
        exists: true,
      })),
      size: docs.length,
      empty: docs.length === 0,
      forEach(fn) { this.docs.forEach(fn); },
    };
  }
  function match(doc, filter) {
    const { field, op, value } = filter;
    const v = doc[field];
    switch (op) {
      case '==': return v === value;
      case '!=': return v !== value;
      case '<':  return v < value;
      case '<=': return v <= value;
      case '>':  return v > value;
      case '>=': return v >= value;
      case 'in': return Array.isArray(value) && value.includes(v);
      case 'array-contains': return Array.isArray(v) && v.includes(value);
      default: return true;
    }
  }

  // -- query builder --------------------------------------------
  function makeQuery(name, filters, sort, lim) {
    return {
      where(field, op, value) {
        return makeQuery(name, [...filters, { field, op, value }], sort, lim);
      },
      orderBy(field, dir = 'asc') {
        return makeQuery(name, filters, { field, dir }, lim);
      },
      limit(n) {
        return makeQuery(name, filters, sort, n);
      },
      get() {
        return Promise.resolve(makeSnapshot(name, filters, sort, lim));
      },
      onSnapshot(cb) {
        const wrapped = () => cb(makeSnapshot(name, filters, sort, lim));
        (subscribers[name] || (subscribers[name] = [])).push(wrapped);
        // emit immediately
        Promise.resolve().then(wrapped);
        return () => {
          subscribers[name] = (subscribers[name] || []).filter((f) => f !== wrapped);
        };
      },
    };
  }

  // -- doc ref --------------------------------------------------
  function makeDocRef(name, id) {
    return {
      id,
      get() {
        const docs = readCol(name);
        const found = docs.find((d) => d.id === id);
        return Promise.resolve({
          id,
          exists: !!found,
          data: () => found ? { ...found } : null,
        });
      },
      set(data) {
        const docs = readCol(name);
        const idx = docs.findIndex((d) => d.id === id);
        const now = Date.now();
        const next = { ...data, id, updatedAt: now };
        if (idx === -1) {
          next.createdAt = now;
          docs.push(next);
        } else {
          next.createdAt = docs[idx].createdAt || now;
          docs[idx] = next;
        }
        writeCol(name, docs);
        return Promise.resolve();
      },
      update(partial) {
        const docs = readCol(name);
        const idx = docs.findIndex((d) => d.id === id);
        if (idx === -1) return Promise.reject(new Error('Doc not found: ' + name + '/' + id));
        docs[idx] = { ...docs[idx], ...partial, id, updatedAt: Date.now() };
        writeCol(name, docs);
        return Promise.resolve();
      },
      delete() {
        const docs = readCol(name);
        const next = docs.filter((d) => d.id !== id);
        writeCol(name, next);
        return Promise.resolve();
      },
    };
  }

  // -- collection ref -------------------------------------------
  function makeCollectionRef(name) {
    const queryFns = makeQuery(name, [], null, null);
    return {
      add(data) {
        const docs = readCol(name);
        const now = Date.now();
        const id = data.id || genId();
        const doc = { ...data, id, createdAt: now, updatedAt: now };
        docs.push(doc);
        writeCol(name, docs);
        return Promise.resolve({ id });
      },
      doc(id) { return makeDocRef(name, id); },
      where: queryFns.where,
      orderBy: queryFns.orderBy,
      limit: queryFns.limit,
      get: queryFns.get,
      onSnapshot: queryFns.onSnapshot,
    };
  }

  // -- public Store API -----------------------------------------
  const Store = {
    collection(name) { return makeCollectionRef(name); },

    // Bulk seed — used by wines-seed.js on first load.
    // Only writes if collection is empty (idempotent).
    seedIfEmpty(name, docs) {
      const existing = readCol(name);
      if (existing.length > 0) return false;
      const now = Date.now();
      const stamped = docs.map((d) => ({
        ...d,
        id: d.id || genId(),
        createdAt: d.createdAt || now,
        updatedAt: d.updatedAt || now,
      }));
      writeCol(name, stamped);
      return true;
    },

    // Force-replace seed (admin "reset to defaults" later).
    reseed(name, docs) {
      const now = Date.now();
      const stamped = docs.map((d) => ({
        ...d,
        id: d.id || genId(),
        createdAt: d.createdAt || now,
        updatedAt: d.updatedAt || now,
      }));
      writeCol(name, stamped);
    },

    // Direct read — convenience for non-reactive consumers.
    readAll(name) { return readCol(name); },

    // Wipe a single collection.
    clear(name) {
      localStorage.removeItem(PREFIX + name);
      notify(name);
    },

    // Wipe everything kk:store: prefixed.
    clearAll() {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(PREFIX)) localStorage.removeItem(k);
      });
    },

    // For debugging in DevTools.
    _subscribers: subscribers,
    _PREFIX: PREFIX,
  };

  window.App = window.App || {};
  window.App.Store = Store;
})();
