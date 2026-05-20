/* ───────────────────────────────────────────────────────────────
   js/db.js
   IndexedDB wrapper. Single database `VFXAppDB` with stores:
   - projects   { id, name, description, color, dirHandle, createdAt,
                  stages: { concept, shotlist, generate, composite, deliver },
                  concept: { scenario, songInfo, moodNotes } }
   - prompts    { id, projectId, title, content, originalKorean, tool,
                  category, tags[], isFavorite, createdAt }
   - file_memos { id, projectId, filePath, memo, tool, tags[], createdAt }
   - settings   { key, value }
   - chat       { id, projectId, role, text, tool, ts }   (bot history)
   - scenes     { id, projectId, order, titleKo, descKo, descEn,
                  durationSec, type, status, imageData, imageMime,
                  videoPath, notes, createdAt, updatedAt }

   API (all async, return promises):
     VFXDB.ready()                        → opens / migrates DB
     VFXDB.put(store, obj)                → put + return obj
     VFXDB.get(store, id)                 → get single
     VFXDB.all(store, idx?, key?)         → all rows, optional index filter
     VFXDB.delete(store, id)              → delete
     VFXDB.clear(store)                   → wipe a store
   Exposed as window.VFXDB
   ─────────────────────────────────────────────────────────────── */

(function () {
  const DB_NAME = 'VFXAppDB';
  const DB_VERSION = 3;

  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prompts')) {
          const s = db.createObjectStore('prompts', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
          s.createIndex('tool', 'tool', { unique: false });
          s.createIndex('category', 'category', { unique: false });
          s.createIndex('isFavorite', 'isFavorite', { unique: false });
        }
        if (!db.objectStoreNames.contains('file_memos')) {
          const s = db.createObjectStore('file_memos', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('chat')) {
          const s = db.createObjectStore('chat', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
          s.createIndex('ts', 'ts', { unique: false });
        }
        if (!db.objectStoreNames.contains('scenes')) {
          const s = db.createObjectStore('scenes', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
          s.createIndex('order', 'order', { unique: false });
        }
      };
      req.onsuccess = () => {
        _db = req.result;
        _db.onversionchange = () => { _db.close(); _db = null; };
        resolve(_db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode = 'readonly') {
    return open().then((db) => db.transaction(store, mode).objectStore(store));
  }

  function reqPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const VFXDB = {
    async ready() { return open(); },

    async put(store, obj) {
      const s = await tx(store, 'readwrite');
      await reqPromise(s.put(obj));
      return obj;
    },

    async get(store, id) {
      const s = await tx(store, 'readonly');
      return reqPromise(s.get(id));
    },

    async all(store, indexName, key) {
      const s = await tx(store, 'readonly');
      const src = indexName ? s.index(indexName) : s;
      const req = key !== undefined ? src.getAll(key) : src.getAll();
      return reqPromise(req);
    },

    async delete(store, id) {
      const s = await tx(store, 'readwrite');
      await reqPromise(s.delete(id));
    },

    async clear(store) {
      const s = await tx(store, 'readwrite');
      await reqPromise(s.clear());
    },

    /* ── Convenience helpers for settings ── */
    async getSetting(key, fallback = null) {
      const row = await this.get('settings', key);
      return row ? row.value : fallback;
    },
    async setSetting(key, value) {
      return this.put('settings', { key, value });
    },

    /* ── ID helper ── */
    uid() {
      // crypto.randomUUID is available in all modern browsers (incl. Vercel runtimes)
      return (crypto.randomUUID && crypto.randomUUID()) ||
        ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }));
    },
  };

  window.VFXDB = VFXDB;
})();
