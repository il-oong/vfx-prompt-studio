/* VFX Prompt Studio — IndexedDB 추상화 레이어 */
var VFXDb = (function() {
  var DB_NAME = 'VFXAppDB';
  var DB_VERSION = 1;
  var db = null;

  function open() {
    return new Promise(function(resolve, reject) {
      if (db) { resolve(db); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function(e) {
        var d = e.target.result;

        if (!d.objectStoreNames.contains('projects')) {
          var ps = d.createObjectStore('projects', { keyPath: 'id' });
          ps.createIndex('name', 'name', { unique: false });
        }

        if (!d.objectStoreNames.contains('file_memos')) {
          var fs = d.createObjectStore('file_memos', { keyPath: 'id' });
          fs.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!d.objectStoreNames.contains('prompts')) {
          var prs = d.createObjectStore('prompts', { keyPath: 'id' });
          prs.createIndex('projectId', 'projectId', { unique: false });
          prs.createIndex('tool', 'tool', { unique: false });
        }

        if (!d.objectStoreNames.contains('settings')) {
          d.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!d.objectStoreNames.contains('folder_handles')) {
          d.createObjectStore('folder_handles', { keyPath: 'projectId' });
        }
      };

      req.onsuccess = function(e) {
        db = e.target.result;
        resolve(db);
      };

      req.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }

  function tx(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function prom(req) {
    return new Promise(function(resolve, reject) {
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  }

  /* ── 공통 UUID ── */
  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ═══════════════════════════════
     프로젝트 CRUD
  ═══════════════════════════════ */
  function getProjects() {
    return open().then(function() {
      return prom(tx('projects', 'readonly').getAll());
    }).then(function(list) {
      return list.sort(function(a, b) { return a.createdAt - b.createdAt; });
    });
  }

  function getProject(id) {
    return open().then(function() {
      return prom(tx('projects', 'readonly').get(id));
    });
  }

  function saveProject(data) {
    return open().then(function() {
      var now = Date.now();
      var p = Object.assign({ id: uid(), createdAt: now, updatedAt: now }, data);
      return prom(tx('projects', 'readwrite').put(p)).then(function() { return p; });
    });
  }

  function updateProject(id, updates) {
    return getProject(id).then(function(p) {
      if (!p) throw new Error('프로젝트를 찾을 수 없습니다.');
      var updated = Object.assign({}, p, updates, { updatedAt: Date.now() });
      return prom(tx('projects', 'readwrite').put(updated)).then(function() { return updated; });
    });
  }

  function deleteProject(id) {
    return open().then(function() {
      return Promise.all([
        prom(tx('projects', 'readwrite').delete(id)),
        deletePromptsByProject(id),
        deleteFileMemosByProject(id),
        prom(tx('folder_handles', 'readwrite').delete(id))
      ]);
    });
  }

  /* ═══════════════════════════════
     파일 메모 CRUD
  ═══════════════════════════════ */
  function getFileMemosByProject(projectId) {
    return open().then(function() {
      var index = tx('file_memos', 'readonly').index('projectId');
      return prom(index.getAll(projectId));
    });
  }

  function getFileMemo(id) {
    return open().then(function() {
      return prom(tx('file_memos', 'readonly').get(id));
    });
  }

  function saveFileMemo(data) {
    return open().then(function() {
      var now = Date.now();
      var m = Object.assign({ id: uid(), createdAt: now, updatedAt: now }, data);
      return prom(tx('file_memos', 'readwrite').put(m)).then(function() { return m; });
    });
  }

  function updateFileMemo(id, updates) {
    return getFileMemo(id).then(function(m) {
      if (!m) {
        var newMemo = Object.assign({ id: id, createdAt: Date.now(), updatedAt: Date.now() }, updates);
        return prom(tx('file_memos', 'readwrite').put(newMemo)).then(function() { return newMemo; });
      }
      var updated = Object.assign({}, m, updates, { updatedAt: Date.now() });
      return prom(tx('file_memos', 'readwrite').put(updated)).then(function() { return updated; });
    });
  }

  function deleteFileMemosByProject(projectId) {
    return open().then(function() {
      var index = tx('file_memos', 'readwrite').index('projectId');
      return prom(index.getAll(projectId)).then(function(items) {
        var store = tx('file_memos', 'readwrite');
        return Promise.all(items.map(function(item) { return prom(store.delete(item.id)); }));
      });
    });
  }

  /* ═══════════════════════════════
     프롬프트 CRUD
  ═══════════════════════════════ */
  function getPrompts() {
    return open().then(function() {
      return prom(tx('prompts', 'readonly').getAll());
    }).then(function(list) {
      return list.sort(function(a, b) { return b.createdAt - a.createdAt; });
    });
  }

  function getPromptsByProject(projectId) {
    return open().then(function() {
      if (projectId === 'all') return getPrompts();
      var index = tx('prompts', 'readonly').index('projectId');
      return prom(index.getAll(projectId)).then(function(list) {
        return list.sort(function(a, b) { return b.createdAt - a.createdAt; });
      });
    });
  }

  function getPrompt(id) {
    return open().then(function() {
      return prom(tx('prompts', 'readonly').get(id));
    });
  }

  function savePrompt(data) {
    return open().then(function() {
      var now = Date.now();
      var p = Object.assign({
        id: uid(),
        projectId: 'global',
        title: '',
        content: '',
        originalKorean: '',
        tool: '',
        category: 'scene',
        tags: [],
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      }, data);
      return prom(tx('prompts', 'readwrite').put(p)).then(function() { return p; });
    });
  }

  function updatePrompt(id, updates) {
    return getPrompt(id).then(function(p) {
      if (!p) throw new Error('프롬프트를 찾을 수 없습니다.');
      var updated = Object.assign({}, p, updates, { updatedAt: Date.now() });
      return prom(tx('prompts', 'readwrite').put(updated)).then(function() { return updated; });
    });
  }

  function deletePrompt(id) {
    return open().then(function() {
      return prom(tx('prompts', 'readwrite').delete(id));
    });
  }

  function deletePromptsByProject(projectId) {
    return getPromptsByProject(projectId).then(function(list) {
      return open().then(function() {
        var store = tx('prompts', 'readwrite');
        return Promise.all(list.map(function(p) { return prom(store.delete(p.id)); }));
      });
    });
  }

  /* ═══════════════════════════════
     설정 CRUD
  ═══════════════════════════════ */
  function getSetting(key) {
    return open().then(function() {
      return prom(tx('settings', 'readonly').get(key));
    }).then(function(r) { return r ? r.value : null; });
  }

  function setSetting(key, value) {
    return open().then(function() {
      return prom(tx('settings', 'readwrite').put({ key: key, value: value }));
    });
  }

  /* ═══════════════════════════════
     폴더 핸들 저장
  ═══════════════════════════════ */
  function getFolderHandle(projectId) {
    return open().then(function() {
      return prom(tx('folder_handles', 'readonly').get(projectId));
    }).then(function(r) { return r ? r.handle : null; });
  }

  function saveFolderHandle(projectId, handle) {
    return open().then(function() {
      return prom(tx('folder_handles', 'readwrite').put({ projectId: projectId, handle: handle }));
    });
  }

  function deleteFolderHandle(projectId) {
    return open().then(function() {
      return prom(tx('folder_handles', 'readwrite').delete(projectId));
    });
  }

  return {
    open: open,
    uid: uid,
    getProjects: getProjects,
    getProject: getProject,
    saveProject: saveProject,
    updateProject: updateProject,
    deleteProject: deleteProject,
    getFileMemosByProject: getFileMemosByProject,
    getFileMemo: getFileMemo,
    saveFileMemo: saveFileMemo,
    updateFileMemo: updateFileMemo,
    getPrompts: getPrompts,
    getPromptsByProject: getPromptsByProject,
    getPrompt: getPrompt,
    savePrompt: savePrompt,
    updatePrompt: updatePrompt,
    deletePrompt: deletePrompt,
    getSetting: getSetting,
    setSetting: setSetting,
    getFolderHandle: getFolderHandle,
    saveFolderHandle: saveFolderHandle,
    deleteFolderHandle: deleteFolderHandle
  };
})();
