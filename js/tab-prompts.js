/* ───────────────────────────────────────────────────────────────
   js/tab-prompts.js
   Saved prompts list. Reads/writes IndexedDB `prompts` store.
   - Filter by category + tool + favorite + free-text search
   - Inline favorite, copy, delete; edit via modal
   - Public: window.Prompts = { render, open, saveFromBot }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let state = {
    projectId: null,
    items: [],
    filter: { cat: 'all', tool: 'all', fav: false, q: '' },
  };
  let host = null;

  const CATEGORIES = [
    { id: 'all',       label: 'All' },
    { id: 'scene',     label: 'Scene' },
    { id: 'asset',     label: 'Asset' },
    { id: 'character', label: 'Character' },
    { id: 'bg',        label: 'BG' },
    { id: 'fx',        label: 'FX' },
  ];

  async function loadAll() {
    if (!state.projectId) { state.items = []; return; }
    const rows = await window.VFXDB.all('prompts', 'projectId', state.projectId);
    state.items = rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function filtered() {
    const f = state.filter;
    const q = f.q.trim().toLowerCase();
    return state.items.filter((p) => {
      if (f.cat !== 'all' && p.category !== f.cat) return false;
      if (f.tool !== 'all' && p.tool !== f.tool) return false;
      if (f.fav && !p.isFavorite) return false;
      if (q) {
        const hay = (p.title + ' ' + p.content + ' ' + (p.originalKorean || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }

  function renderCard(p) {
    const tool = window.TOOL_PRESETS[p.tool] || { name: p.tool || '—' };
    return `
      <article class="prompt-card" data-id="${p.id}">
        <div class="prompt-head">
          <button class="prompt-star ${p.isFavorite ? 'is-on' : ''}" data-act="fav">★</button>
          <h3 class="prompt-title">${esc(p.title || '(제목 없음)')}</h3>
          <span class="chip chip--accent" style="margin-left:auto;">${esc(tool.name.toUpperCase())}</span>
          <span class="chip">${esc(p.category || 'scene')}</span>
        </div>
        ${p.originalKorean ? `<div class="prompt-korean">↳ ${esc(p.originalKorean)}</div>` : ''}
        <pre class="prompt-content">${esc(p.content)}</pre>
        ${p.tags && p.tags.length ? `
        <div class="prompt-tags">
          ${p.tags.map((t) => `<span class="prompt-tag">#${esc(t)}</span>`).join('')}
        </div>` : ''}
        <div class="prompt-actions">
          <button class="btn btn--sm" data-act="copy">⎘ Copy</button>
          <button class="btn btn--sm" data-act="edit">Edit</button>
          <button class="btn btn--sm" data-act="reask">↺ 다시 Gemini 에</button>
          <button class="btn btn--sm btn--ghost" data-act="delete" title="삭제">✕</button>
          <span class="prompt-date">${fmtDate(p.createdAt)}</span>
        </div>
      </article>`;
  }

  function render() {
    if (!host) return;
    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">◆</div>
            <h3>프로젝트가 없어요</h3>
            <p>프롬프트는 프로젝트별로 저장됩니다. 먼저 새 프로젝트를 만들어 주세요.</p>
            <button class="btn btn--primary" id="prompts-new-proj">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      const b = host.querySelector('#prompts-new-proj');
      if (b) b.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }

    const list = filtered();
    const f = state.filter;
    host.innerHTML = `
      <div class="tab-pad"><div class="tab-max">
        <div class="prompts-head">
          <div>
            <div class="eyebrow">Saved · ${state.items.length} entries</div>
            <h1 class="title">Prompt library</h1>
          </div>
          <button class="btn btn--primary" id="prompts-new">+ 새 프롬프트</button>
        </div>

        <div class="prompts-filter">
          <input class="input prompts-search" id="prompts-q" placeholder="🔎  제목 · 내용 · 태그 검색" value="${esc(f.q)}">
        </div>

        <div class="prompts-filter-row">
          ${CATEGORIES.map((c) => `<button class="chip ${f.cat === c.id ? 'is-active' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`).join('')}
          <span class="prompts-divider"></span>
          <button class="chip ${f.fav ? 'is-active' : ''}" data-fav="1">★ 즐겨찾기</button>
          <select class="prompts-tool-select" id="prompts-tool">
            <option value="all" ${f.tool === 'all' ? 'selected' : ''}>모든 툴</option>
            ${window.TOOL_ORDER.map((id) => `<option value="${id}" ${f.tool === id ? 'selected' : ''}>${esc(window.TOOL_PRESETS[id].name)}</option>`).join('')}
          </select>
        </div>

        ${list.length === 0 ? `
          <div class="empty">
            <div class="empty-icon">◆</div>
            <h3>${state.items.length === 0 ? '아직 저장된 프롬프트가 없어요' : '조건에 맞는 프롬프트가 없어요'}</h3>
            <p>${state.items.length === 0 ? 'Studio 에서 봇 응답을 저장하거나, 위 [+ 새 프롬프트] 로 직접 추가할 수 있어요.' : '필터를 조정해 보세요.'}</p>
          </div>
        ` : `
          <div class="prompts-list">
            ${list.map(renderCard).join('')}
          </div>
        `}
      </div></div>`;

    // Wire events
    host.querySelector('#prompts-new')?.addEventListener('click', () => openEditModal(null));
    host.querySelector('#prompts-q')?.addEventListener('input', (e) => {
      state.filter.q = e.target.value;
      // Re-render only the list area for snappier typing
      const listEl = host.querySelector('.prompts-list');
      if (listEl || state.items.length === 0) render();
    });
    host.querySelectorAll('[data-cat]').forEach((el) => {
      el.addEventListener('click', () => { state.filter.cat = el.getAttribute('data-cat'); render(); });
    });
    host.querySelectorAll('[data-fav]').forEach((el) => {
      el.addEventListener('click', () => { state.filter.fav = !state.filter.fav; render(); });
    });
    host.querySelector('#prompts-tool')?.addEventListener('change', (e) => {
      state.filter.tool = e.target.value; render();
    });

    host.querySelectorAll('.prompt-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const p = state.items.find((x) => x.id === id);
      card.querySelectorAll('[data-act]').forEach((btn) => {
        const act = btn.getAttribute('data-act');
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (act === 'fav') {
            p.isFavorite = !p.isFavorite;
            await window.VFXDB.put('prompts', p);
            render();
          } else if (act === 'copy') {
            navigator.clipboard?.writeText(p.content).then(() => window.App?.toast('복사됐어요'));
          } else if (act === 'edit') {
            openEditModal(p);
          } else if (act === 'delete') {
            if (!confirm('이 프롬프트를 지울까요?')) return;
            await window.VFXDB.delete('prompts', p.id);
            state.items = state.items.filter((x) => x.id !== p.id);
            render();
            window.App?.toast('삭제됨');
          } else if (act === 'reask') {
            if (!p.originalKorean) {
              window.App?.toast('원본 한국어 설명이 없어 다시 요청할 수 없어요');
              return;
            }
            window.App?.openTab?.('studio');
            window.Bot?.setTool?.(p.tool);
            setTimeout(() => {
              const ta = document.querySelector('#composer-input');
              if (ta) { ta.value = p.originalKorean; ta.dispatchEvent(new Event('input')); ta.focus(); }
            }, 60);
          }
        });
      });
    });
  }

  /* ── Edit modal ───────────────────────────────────────────────── */
  function openEditModal(p) {
    const isNew = !p;
    const data = isNew ? {
      id: window.VFXDB.uid(),
      projectId: state.projectId,
      title: '',
      content: '',
      originalKorean: '',
      tool: 'runway',
      category: 'scene',
      tags: [],
      isFavorite: false,
      createdAt: Date.now(),
    } : { ...p };

    window.App.openModal(`
      <div class="modal modal--wide">
        <div class="modal-head">
          <div class="eyebrow">${isNew ? 'New' : 'Edit'} prompt</div>
          <h2 class="modal-title">${isNew ? '프롬프트 추가' : data.title || '프롬프트 수정'}</h2>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">제목</label>
            <input class="input" id="pm-title" value="${esc(data.title)}" placeholder="예: 야간 도심 드론샷">
          </div>
          <div class="field">
            <label class="field-label">원본 한국어 설명 <span class="field-hint">(선택)</span></label>
            <textarea class="input" id="pm-ko" rows="2" placeholder="한국어 설명을 적어두면 나중에 다시 Gemini에게 요청할 수 있어요">${esc(data.originalKorean)}</textarea>
          </div>
          <div class="field">
            <label class="field-label">영어 프롬프트 본문</label>
            <textarea class="input" id="pm-content" rows="6" style="font-family:var(--font-mono);font-size:13px;">${esc(data.content)}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="field">
              <label class="field-label">툴</label>
              <select class="input" id="pm-tool">
                ${window.TOOL_ORDER.map((id) => `<option value="${id}" ${data.tool === id ? 'selected' : ''}>${esc(window.TOOL_PRESETS[id].name)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">카테고리</label>
              <select class="input" id="pm-cat">
                ${['scene','asset','character','bg','fx'].map((c) => `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label class="field-label">태그 <span class="field-hint">(쉼표로 구분)</span></label>
            <input class="input" id="pm-tags" value="${esc((data.tags || []).join(', '))}" placeholder="rain, neon, seoul">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" id="pm-cancel">취소</button>
          <button class="btn btn--primary" id="pm-save">${isNew ? '추가' : '저장'}</button>
        </div>
      </div>
    `);

    document.querySelector('#pm-cancel').addEventListener('click', () => window.App.closeModal());
    document.querySelector('#pm-save').addEventListener('click', async () => {
      data.title          = document.querySelector('#pm-title').value.trim();
      data.originalKorean = document.querySelector('#pm-ko').value.trim();
      data.content        = document.querySelector('#pm-content').value.trim();
      data.tool           = document.querySelector('#pm-tool').value;
      data.category       = document.querySelector('#pm-cat').value;
      data.tags           = document.querySelector('#pm-tags').value
        .split(',').map((t) => t.trim()).filter(Boolean);

      if (!data.content) {
        window.App.toast('프롬프트 내용을 입력하세요');
        return;
      }
      if (!data.title) data.title = data.content.slice(0, 60);

      await window.VFXDB.put('prompts', data);
      await loadAll();
      render();
      window.App.closeModal();
      window.App.toast(isNew ? '추가됨' : '저장됨');
    });
  }

  /* ── Public ──────────────────────────────────────────────────── */
  async function open(projectId) {
    state.projectId = projectId || null;
    state.filter = { cat: 'all', tool: 'all', fav: false, q: '' };
    await loadAll();
  }

  function setHost(el) { host = el; render(); }

  async function saveFromBot({ content, tool, originalKorean }) {
    if (!state.projectId) {
      // pick first project lazily
      const all = await window.VFXDB.all('projects');
      if (all[0]) state.projectId = all[0].id;
    }
    if (!state.projectId) return;
    const obj = {
      id: window.VFXDB.uid(),
      projectId: state.projectId,
      title: (originalKorean || content || '').slice(0, 60),
      content: content || '',
      originalKorean: originalKorean || '',
      tool: tool || 'runway',
      category: 'scene',
      tags: [],
      isFavorite: false,
      createdAt: Date.now(),
    };
    await window.VFXDB.put('prompts', obj);
    if (host && state.items) {
      state.items.unshift(obj);
      render();
    }
  }

  window.Prompts = { render: setHost, open, saveFromBot };
})();
