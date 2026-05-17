/* ───────────────────────────────────────────────────────────────
   js/tab-archive.js
   Local folder browser using File System Access API.
   - Connect a folder per project (showDirectoryPicker)
   - Persist FileSystemDirectoryHandle to IndexedDB (project record)
   - Reconnect on reload (queryPermission → requestPermission)
   - Folder tree sidebar + media grid (img + video first-frame)
   - Click tile → preview + memo edit (file_memos store)
   Public: window.Archive = { render, open }
   ─────────────────────────────────────────────────────────────── */

(function () {
  const IMG_EXT   = ['png','jpg','jpeg','webp','gif','avif','bmp'];
  const VIDEO_EXT = ['mp4','mov','webm','m4v'];

  let state = {
    projectId: null,
    project: null,
    rootHandle: null,
    tree: null,         // { name, path, children: [...], files: [...] }
    currentPath: '',    // relative path under root
    files: [],          // {name, path, ext, kind, handle}
    thumbs: new Map(),  // path → dataURL / blobURL
    permission: 'unknown', // 'granted' | 'denied' | 'prompt' | 'unsupported'
    loading: false,
    error: null,
    fileFilter: 'all', // 'all' | 'image' | 'video'
  };
  let host = null;
  let blobUrls = new Set();

  function isSupported() {
    return typeof window.showDirectoryPicker === 'function';
  }

  function extOf(name) {
    const i = name.lastIndexOf('.');
    return i < 0 ? '' : name.slice(i + 1).toLowerCase();
  }
  function kindOf(name) {
    const e = extOf(name);
    if (IMG_EXT.includes(e)) return 'image';
    if (VIDEO_EXT.includes(e)) return 'video';
    return null;
  }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  /* ── File System Access permission helpers ──────────────────── */
  async function checkPermission(handle) {
    if (!handle) return 'denied';
    if (!handle.queryPermission) return 'granted';
    const q = await handle.queryPermission({ mode: 'read' });
    return q;
  }
  async function requestPermission(handle) {
    if (!handle.requestPermission) return 'granted';
    return handle.requestPermission({ mode: 'read' });
  }

  async function pickFolder() {
    try {
      const handle = await window.showDirectoryPicker({ id: 'vfx-archive', mode: 'read' });
      state.rootHandle = handle;
      state.project.linkedFolderHandle = handle;
      state.project.linkedFolderName = handle.name;
      await window.VFXDB.put('projects', state.project);
      state.permission = 'granted';
      state.currentPath = '';
      await buildTree();
      await loadFiles(state.currentPath);
      render();
    } catch (e) {
      if (e.name === 'AbortError') return;
      state.error = e.message;
      render();
    }
  }

  async function reconnect() {
    if (!state.project?.linkedFolderHandle) return;
    state.rootHandle = state.project.linkedFolderHandle;
    let perm = await checkPermission(state.rootHandle);
    if (perm !== 'granted') perm = await requestPermission(state.rootHandle);
    state.permission = perm;
    if (perm === 'granted') {
      await buildTree();
      await loadFiles(state.currentPath);
    }
    render();
  }

  /* ── Tree + file listing ──────────────────────────────────────── */
  async function buildTree() {
    if (!state.rootHandle) { state.tree = null; return; }
    const root = { name: state.rootHandle.name, path: '', kind: 'dir', children: [] };
    async function walk(dirHandle, node, depth = 0) {
      if (depth > 4) return; // safety
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
          const child = { name, path: node.path ? node.path + '/' + name : name, kind: 'dir', children: [] };
          node.children.push(child);
          try { await walk(handle, child, depth + 1); } catch {}
        }
      }
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
    try { await walk(state.rootHandle, root); } catch (e) { state.error = e.message; }
    state.tree = root;
  }

  async function resolvePath(path) {
    // returns FileSystemDirectoryHandle for relative path
    if (!state.rootHandle) return null;
    if (!path) return state.rootHandle;
    let h = state.rootHandle;
    for (const part of path.split('/').filter(Boolean)) {
      h = await h.getDirectoryHandle(part);
    }
    return h;
  }

  async function loadFiles(path) {
    state.loading = true;
    state.files = [];
    render();
    try {
      const dir = await resolvePath(path);
      if (!dir) return;
      const out = [];
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind !== 'file') continue;
        const k = kindOf(name);
        if (!k) continue;
        out.push({
          name,
          path: path ? path + '/' + name : name,
          ext: extOf(name),
          kind: k,
          handle,
        });
      }
      out.sort((a, b) => a.name.localeCompare(b.name));
      state.files = out;
      state.loading = false;
      render();
      // Generate thumbnails (async, fire-and-forget)
      for (const f of out) generateThumb(f);
    } catch (e) {
      state.loading = false;
      state.error = e.message;
      render();
    }
  }

  /* ── Thumbnails ──────────────────────────────────────────────── */
  async function generateThumb(f) {
    if (state.thumbs.has(f.path)) return;
    try {
      const file = await f.handle.getFile();
      if (f.kind === 'image') {
        const url = URL.createObjectURL(file);
        blobUrls.add(url);
        state.thumbs.set(f.path, { url, kind: 'image' });
      } else if (f.kind === 'video') {
        const url = URL.createObjectURL(file);
        blobUrls.add(url);
        const data = await videoThumb(url);
        state.thumbs.set(f.path, { url: data, fileUrl: url, kind: 'video' });
      }
      patchThumb(f.path);
    } catch (e) {
      state.thumbs.set(f.path, { error: true });
      patchThumb(f.path);
    }
  }

  function videoThumb(url) {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true; v.playsInline = true;
      v.src = url;
      v.addEventListener('loadedmetadata', () => {
        v.currentTime = Math.min(1, (v.duration || 1) * 0.1);
      });
      v.addEventListener('seeked', () => {
        try {
          const w = 480;
          const h = Math.round((v.videoHeight / v.videoWidth) * w) || 270;
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(v, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.72));
        } catch (e) { reject(e); }
      });
      v.addEventListener('error', () => reject(new Error('video decode failed')));
      setTimeout(() => reject(new Error('video timeout')), 5000);
    });
  }

  function patchThumb(path) {
    if (!host) return;
    const el = host.querySelector(`[data-thumb="${CSS.escape(path)}"]`);
    if (!el) return;
    const t = state.thumbs.get(path);
    if (!t) return;
    if (t.error) {
      el.innerHTML = '<div class="thumb-fallback">?</div>';
    } else {
      el.style.backgroundImage = `url("${t.url}")`;
    }
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function renderTree(node, depth = 0) {
    const isActive = node.path === state.currentPath;
    return `
      <div class="tree-item ${isActive ? 'is-active' : ''}"
           data-tree="${esc(node.path)}"
           style="padding-left:${10 + depth * 14}px">
        <span class="tree-icon">${depth === 0 ? '▤' : '▸'}</span>
        <span class="tree-name">${esc(node.path === '' ? node.name : node.name)}</span>
      </div>
      ${(node.children || []).map((c) => renderTree(c, depth + 1)).join('')}
    `;
  }

  function render() {
    if (!host) return;
    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">▦</div>
            <h3>프로젝트가 없어요</h3>
            <p>아카이브는 프로젝트별로 로컬 폴더를 연결합니다. 먼저 새 프로젝트를 만드세요.</p>
            <button class="btn btn--primary" id="ar-new-proj">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      host.querySelector('#ar-new-proj')?.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }
    if (!isSupported()) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">!</div>
            <h3>이 브라우저는 지원되지 않아요</h3>
            <p>아카이브 기능은 File System Access API 가 필요합니다. Chrome 또는 Edge 최신 버전에서 사용하세요.</p>
          </div>
        </div></div>`;
      return;
    }

    if (!state.rootHandle) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="ar-head">
            <div>
              <div class="eyebrow">Archive</div>
              <h1 class="title">로컬 폴더 연결</h1>
              <p class="subtitle">바탕화면이나 작업 폴더를 연결하면 이미지·영상 썸네일이 자동으로 표시돼요. 다음 실행 시에도 자동 재연결됩니다.</p>
            </div>
          </div>
          <div class="ar-connect-card">
            <div class="ar-connect-icon">📁</div>
            <h3>폴더를 선택하세요</h3>
            <p>읽기 권한만 요청합니다. 파일을 수정하지 않아요.</p>
            <button class="btn btn--primary" id="ar-pick">+ 폴더 연결</button>
          </div>
        </div></div>`;
      host.querySelector('#ar-pick')?.addEventListener('click', pickFolder);
      return;
    }

    if (state.permission !== 'granted') {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="ar-connect-card">
            <div class="ar-connect-icon">🔒</div>
            <h3>권한 재확인 필요</h3>
            <p>"${esc(state.rootHandle.name)}" 폴더에 접근하려면 권한이 필요해요.</p>
            <button class="btn btn--primary" id="ar-grant">권한 허용</button>
            <button class="btn btn--ghost" id="ar-repick">다른 폴더 선택</button>
          </div>
        </div></div>`;
      host.querySelector('#ar-grant')?.addEventListener('click', async () => {
        state.permission = await requestPermission(state.rootHandle);
        if (state.permission === 'granted') {
          await buildTree();
          await loadFiles(state.currentPath);
        }
        render();
      });
      host.querySelector('#ar-repick')?.addEventListener('click', pickFolder);
      return;
    }

    host.innerHTML = `
      <div class="ar-shell">
        <aside class="ar-tree">
          <div class="ar-tree-head">
            <span class="eyebrow eyebrow--muted">폴더</span>
            <button class="btn btn--sm btn--ghost" id="ar-repick" title="다른 폴더 연결">↻</button>
          </div>
          <div class="ar-tree-list">
            ${state.tree ? renderTree(state.tree) : ''}
          </div>
        </aside>

        <main class="ar-main">
          <div class="ar-bar">
            <div class="ar-breadcrumb">
              <span class="ar-crumb" data-tree="">${esc(state.rootHandle.name)}</span>
              ${state.currentPath.split('/').filter(Boolean).map((part, i, arr) => {
                const p = arr.slice(0, i + 1).join('/');
                return `<span class="ar-crumb-sep">/</span><span class="ar-crumb" data-tree="${esc(p)}">${esc(part)}</span>`;
              }).join('')}
            </div>
            <div class="ar-bar-right">
              <div class="ar-filter-chips">
                <button class="chip btn--sm ${state.fileFilter === 'all' ? 'is-active' : ''}" data-kind="all">전체</button>
                <button class="chip btn--sm ${state.fileFilter === 'image' ? 'is-active' : ''}" data-kind="image">이미지</button>
                <button class="chip btn--sm ${state.fileFilter === 'video' ? 'is-active' : ''}" data-kind="video">영상</button>
              </div>
              <span class="ar-count">${state.files.length} files</span>
              <button class="btn btn--sm" id="ar-refresh">↻ refresh</button>
            </div>
          </div>

          ${state.loading ? '<div class="ar-loading">불러오는 중…</div>' : ''}

          ${(() => {
            const visible = state.files.filter((f) => state.fileFilter === 'all' || f.kind === state.fileFilter);
            if (!state.loading && visible.length === 0) return `
              <div class="empty">
                <div class="empty-icon">▦</div>
                <h3>이 폴더에 미디어가 없어요</h3>
                <p>이미지 ${IMG_EXT.join('/')}, 영상 ${VIDEO_EXT.join('/')} 만 표시됩니다.</p>
              </div>`;
            return `
              <div class="ar-grid">
                ${visible.map((f) => `
                  <button class="ar-tile" data-file="${esc(f.path)}">
                    <div class="ar-thumb" data-thumb="${esc(f.path)}">
                      ${f.kind === 'video' ? '<span class="thumb-play">▶</span>' : ''}
                    </div>
                    <div class="ar-tile-meta">
                      <span class="ar-tile-name">${esc(f.name)}</span>
                      <span class="ar-tile-kind">${esc(f.ext.toUpperCase())}</span>
                    </div>
                  </button>
                `).join('')}
              </div>`;
          })()}
        </main>
      </div>
    `;

    // Wire events
    host.querySelectorAll('[data-tree]').forEach((el) => {
      el.addEventListener('click', async () => {
        const p = el.getAttribute('data-tree');
        state.currentPath = p;
        await loadFiles(p);
      });
    });
    host.querySelectorAll('[data-kind]').forEach((el) => {
      el.addEventListener('click', () => {
        state.fileFilter = el.getAttribute('data-kind');
        render();
      });
    });
    host.querySelector('#ar-repick')?.addEventListener('click', pickFolder);
    host.querySelector('#ar-refresh')?.addEventListener('click', async () => {
      await buildTree();
      await loadFiles(state.currentPath);
    });
    host.querySelectorAll('.ar-tile').forEach((el) => {
      const p = el.getAttribute('data-file');
      el.addEventListener('click', () => openPreview(p));
    });

    // Patch in any thumbs we already have
    for (const [path, t] of state.thumbs) patchThumb(path);
  }

  /* ── File preview modal + memo edit ──────────────────────────── */
  async function openPreview(path) {
    const f = state.files.find((x) => x.path === path);
    if (!f) return;
    const memoId = state.projectId + '|' + path;
    const memo = (await window.VFXDB.get('file_memos', memoId)) || {
      id: memoId, projectId: state.projectId, filePath: path,
      memo: '', tool: 'runway', tags: [], createdAt: Date.now(),
    };

    const file = await f.handle.getFile();
    const url = URL.createObjectURL(file);
    blobUrls.add(url);

    window.App.openModal(`
      <div class="modal modal--wide ar-preview-modal">
        <div class="ar-preview-media">
          ${f.kind === 'image'
            ? `<img src="${url}" alt="${esc(f.name)}">`
            : `<video src="${url}" controls autoplay muted></video>`}
        </div>
        <div class="ar-preview-side">
          <div class="modal-head">
            <div class="eyebrow eyebrow--muted">${esc(f.kind.toUpperCase())} · ${esc(f.ext.toUpperCase())}</div>
            <h2 class="modal-title" style="font-size:22px;">${esc(f.name)}</h2>
            <div class="modal-sub">${esc(path)}</div>
          </div>
          <div class="modal-body">
            <div class="field">
              <label class="field-label">사용 툴</label>
              <select class="input" id="mm-tool">
                ${window.TOOL_ORDER.map((id) => `<option value="${id}" ${memo.tool === id ? 'selected' : ''}>${esc(window.TOOL_PRESETS[id].name)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">메모</label>
              <textarea class="input" id="mm-memo" rows="5" placeholder="설정, seed, 후처리, 메모…">${esc(memo.memo)}</textarea>
            </div>
            <div class="field">
              <label class="field-label">태그</label>
              <input class="input" id="mm-tags" value="${esc((memo.tags || []).join(', '))}" placeholder="rain, neon, hero">
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn" id="mm-close">닫기</button>
            <button class="btn btn--primary" id="mm-save">메모 저장</button>
          </div>
        </div>
      </div>
    `);

    document.querySelector('#mm-close').addEventListener('click', () => window.App.closeModal());
    document.querySelector('#mm-save').addEventListener('click', async () => {
      memo.tool = document.querySelector('#mm-tool').value;
      memo.memo = document.querySelector('#mm-memo').value;
      memo.tags = document.querySelector('#mm-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
      await window.VFXDB.put('file_memos', memo);
      window.App.closeModal();
      window.App.toast('메모 저장됨');
    });
  }

  /* ── Public ──────────────────────────────────────────────────── */
  async function open(projectId, project) {
    // Clean previous blob URLs
    for (const u of blobUrls) URL.revokeObjectURL(u);
    blobUrls = new Set();
    state.thumbs = new Map();

    state.projectId = projectId || null;
    state.project = project || null;
    state.rootHandle = project?.linkedFolderHandle || null;
    state.currentPath = '';
    state.files = [];
    state.error = null;
    state.permission = 'unknown';

    if (state.rootHandle) {
      let perm = await checkPermission(state.rootHandle);
      if (perm === 'prompt') {
        // Don't auto-request — show grant button
      }
      state.permission = perm;
      if (perm === 'granted') {
        await buildTree();
        await loadFiles('');
      }
    }
  }

  function setHost(el) { host = el; render(); }

  window.Archive = { render: setHost, open };
})();
