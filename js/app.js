/* ───────────────────────────────────────────────────────────────
   js/app.js
   App boot + tab routing + project switcher + settings modal
   + theme toggle + first-run demo data seed.

   Loaded LAST. Initializes everything; exposes window.App.
   ─────────────────────────────────────────────────────────────── */

(function () {
  const TABS = ['studio', 'storyboard', 'prompts', 'archive', 'guide'];

  // Production pipeline stages — each can be active/skip per project.
  const STAGES = [
    { id: 'concept',   label: '① Concept',   tab: 'studio',     desc: '시나리오 · 무드보드' },
    { id: 'shotlist',  label: '② Shotlist',  tab: 'storyboard', desc: '컷 분할 · 콘티 이미지' },
    { id: 'generate',  label: '③ Generate',  tab: 'studio',     desc: 'AI 영상 생성' },
    { id: 'composite', label: '④ Composite', tab: 'archive',    desc: '합성 · VFX 작업' },
    { id: 'deliver',   label: '⑤ Deliver',   tab: 'archive',    desc: '마스터 · 배포' },
  ];

  const PROJECT_COLORS = [
    'linear-gradient(135deg,#5b5bd6,#c47b2c)',
    'linear-gradient(135deg,#4a8a6b,#88f03e)',
    'linear-gradient(135deg,#c84a3a,#ff9200)',
    'linear-gradient(135deg,#0066ff,#cb59ff)',
    'linear-gradient(135deg,#c47b8c,#fed3f7)',
    'linear-gradient(135deg,#46474c,#aeb0b6)',
    'linear-gradient(135deg,#00bdde,#79c0ff)',
    'linear-gradient(135deg,#d4a574,#3a16c9)',
  ];

  let state = {
    tab: 'studio',
    projects: [],
    activeProjectId: null,
    theme: 'light',
    apiStatus: 'unknown',  // 'ok' | 'no-key' | 'offline' | 'unknown'
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ── Toast ───────────────────────────────────────────────────── */
  let toastT = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('is-on'), 1800);
  }

  /* ── Modal host ──────────────────────────────────────────────── */
  function openModal(html) {
    const host = $('#modal-host');
    host.innerHTML = html;
    host.hidden = false;
    host.addEventListener('click', onScrim, { once: false });
    document.addEventListener('keydown', onEsc);
  }
  function closeModal() {
    const host = $('#modal-host');
    host.innerHTML = '';
    host.hidden = true;
    host.removeEventListener('click', onScrim);
    document.removeEventListener('keydown', onEsc);
  }
  function onScrim(e) { if (e.target.id === 'modal-host') closeModal(); }
  function onEsc(e)   { if (e.key === 'Escape') closeModal(); }

  /* ── Theme ──────────────────────────────────────────────────── */
  async function loadTheme() {
    const t = (await window.VFXDB.getSetting('theme')) || 'light';
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    $('#theme-icon').textContent = t === 'dark' ? '◑' : '◐';
  }
  async function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    $('#theme-icon').textContent = state.theme === 'dark' ? '◑' : '◐';
    await window.VFXDB.setSetting('theme', state.theme);
  }

  /* ── Project manager ────────────────────────────────────────── */
  async function loadProjects() {
    state.projects = (await window.VFXDB.all('projects'))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    let activeId = await window.VFXDB.getSetting('activeProjectId');
    if (activeId && !state.projects.find((p) => p.id === activeId)) activeId = null;
    if (!activeId && state.projects[0]) activeId = state.projects[0].id;
    state.activeProjectId = activeId || null;
    if (activeId) await window.VFXDB.setSetting('activeProjectId', activeId);
    renderContextStrip();
  }

  function getActiveProject() {
    return state.projects.find((p) => p.id === state.activeProjectId) || null;
  }

  async function setActiveProject(id) {
    state.activeProjectId = id;
    await window.VFXDB.setSetting('activeProjectId', id);
    renderContextStrip();
    await renderCurrentTab();
  }

  async function createProject(data) {
    const p = {
      id: window.VFXDB.uid(),
      name: data.name,
      description: data.description || '',
      color: data.color || PROJECT_COLORS[0],
      linkedFolderHandle: null,
      linkedFolderName: null,
      createdAt: Date.now(),
    };
    await window.VFXDB.put('projects', p);
    state.projects.unshift(p);
    state.activeProjectId = p.id;
    await window.VFXDB.setSetting('activeProjectId', p.id);
    renderContextStrip();
    return p;
  }

  async function deleteProject(id) {
    const prompts = await window.VFXDB.all('prompts', 'projectId', id);
    for (const pr of prompts) await window.VFXDB.delete('prompts', pr.id);
    const chats = await window.VFXDB.all('chat', 'projectId', id);
    for (const c of chats) await window.VFXDB.delete('chat', c.id);
    const memos = await window.VFXDB.all('file_memos', 'projectId', id);
    for (const m of memos) await window.VFXDB.delete('file_memos', m.id);
    await window.VFXDB.delete('projects', id);
    state.projects = state.projects.filter((p) => p.id !== id);
    if (state.activeProjectId === id) {
      state.activeProjectId = state.projects[0]?.id || null;
      if (state.activeProjectId) await window.VFXDB.setSetting('activeProjectId', state.activeProjectId);
    }
    renderContextStrip();
    await renderCurrentTab();
  }

  function openEditProjectModal(p) {
    let pickedColor = p.color;
    openModal(`
      <div class="modal">
        <div class="modal-head">
          <div class="eyebrow">Edit</div>
          <h2 class="modal-title">프로젝트 편집</h2>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">이름</label>
            <input class="input" id="ep-name" value="${escapeHtml(p.name)}" autofocus>
          </div>
          <div class="field">
            <label class="field-label">설명 <span class="field-hint">(선택)</span></label>
            <input class="input" id="ep-desc" value="${escapeHtml(p.description || '')}">
          </div>
          <div class="field">
            <label class="field-label">색상</label>
            <div class="swatch-grid" id="ep-colors">
              ${PROJECT_COLORS.map((c) => `<button data-color="${escapeHtml(c)}" style="background:${c}" class="${c === p.color ? 'is-active' : ''}"></button>`).join('')}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--ghost" id="ep-delete" style="color:var(--red);margin-right:auto;">삭제</button>
          <button class="btn" id="ep-cancel">취소</button>
          <button class="btn btn--primary" id="ep-save">저장</button>
        </div>
      </div>
    `);

    $('#ep-colors').addEventListener('click', (e) => {
      const b = e.target.closest('[data-color]');
      if (!b) return;
      pickedColor = b.getAttribute('data-color');
      $$('#ep-colors button').forEach((x) => x.classList.toggle('is-active', x === b));
    });
    $('#ep-cancel').addEventListener('click', closeModal);
    $('#ep-delete').addEventListener('click', async () => {
      if (!confirm(`"${p.name}" 프로젝트를 삭제할까요? 프롬프트와 채팅 기록도 모두 지워집니다.`)) return;
      await deleteProject(p.id);
      closeModal();
      toast('프로젝트 삭제됨');
    });
    $('#ep-save').addEventListener('click', async () => {
      const name = $('#ep-name').value.trim();
      if (!name) { toast('이름을 입력하세요'); return; }
      p.name = name;
      p.description = $('#ep-desc').value.trim();
      p.color = pickedColor;
      await window.VFXDB.put('projects', p);
      const idx = state.projects.findIndex((x) => x.id === p.id);
      if (idx >= 0) state.projects[idx] = p;
      renderContextStrip();
      closeModal();
      toast('저장됨');
      await renderCurrentTab();
    });
  }

  function renderContextStrip() {
    const p = getActiveProject();
    if (p) {
      $('#ctx-swatch').style.background = p.color;
      $('#ctx-name').textContent = p.name;
      $('#ctx-sub').textContent = p.linkedFolderName
        ? `▦ ${p.linkedFolderName} · ${p.description || ''}`.trim()
        : (p.description || '폴더 미연결');
    } else {
      $('#ctx-swatch').style.background = 'var(--panel)';
      $('#ctx-name').textContent = '프로젝트 없음';
      $('#ctx-sub').textContent = '+ 새 프로젝트로 시작하기';
    }
    renderApiStatus();
    renderStages();
  }

  function renderApiStatus() {
    const el = $('#ctx-status');
    el.classList.remove('is-online', 'is-warn');
    if (state.apiStatus === 'ok') {
      el.classList.add('is-online');
      el.textContent = 'online · Gemini 2.0 Flash';
    } else if (state.apiStatus === 'no-key') {
      el.classList.add('is-warn');
      el.textContent = 'API 키 미설정';
    } else if (state.apiStatus === 'offline') {
      el.textContent = 'offline · local only';
    } else {
      el.textContent = 'connecting…';
    }
  }

  async function checkApiStatus() {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', text: 'ping' }], systemPrompt: 'Reply with: pong' }),
      });
      if (r.status === 500) {
        const data = await r.json().catch(() => ({}));
        if (data.error === 'NO_KEY') { state.apiStatus = 'no-key'; renderApiStatus(); return; }
      }
      if (r.ok) { state.apiStatus = 'ok'; renderApiStatus(); return; }
      state.apiStatus = 'offline';
    } catch {
      state.apiStatus = 'offline';
    }
    renderApiStatus();
  }

  /* ── Context dropdown ────────────────────────────────────────── */
  function openCtxDropdown() {
    const dd = $('#ctx-dropdown');
    const list = $('#ctx-dropdown-list');
    list.innerHTML = state.projects.length === 0
      ? '<div style="padding:8px 10px;color:var(--muted);font-size:12px;">아직 프로젝트가 없어요</div>'
      : state.projects.map((p) => `
          <div class="ctx-dropdown-item-wrap">
            <button class="ctx-dropdown-item ${p.id === state.activeProjectId ? 'is-active' : ''}" data-id="${p.id}">
              <span class="cdi-swatch" style="background:${p.color};"></span>
              <span>
                <div class="cdi-name">${escapeHtml(p.name)}</div>
                <div class="cdi-meta">${p.linkedFolderName ? '▦ ' + escapeHtml(p.linkedFolderName) : '폴더 미연결'}</div>
              </span>
            </button>
            <button class="cdi-more" data-edit="${p.id}" title="편집">···</button>
          </div>`).join('');
    list.querySelectorAll('[data-id]').forEach((b) => {
      b.addEventListener('click', async () => {
        await setActiveProject(b.getAttribute('data-id'));
        closeCtxDropdown();
      });
    });
    list.querySelectorAll('[data-edit]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.getAttribute('data-edit');
        const p = state.projects.find((x) => x.id === id);
        if (p) { closeCtxDropdown(); openEditProjectModal(p); }
      });
    });
    dd.hidden = false;
    setTimeout(() => document.addEventListener('click', onCtxOutside, true), 0);
  }
  function closeCtxDropdown() {
    $('#ctx-dropdown').hidden = true;
    document.removeEventListener('click', onCtxOutside, true);
  }
  function onCtxOutside(e) {
    if ($('#ctx-dropdown').contains(e.target) || $('#ctx-project-trigger').contains(e.target)) return;
    closeCtxDropdown();
  }

  /* ── New project modal ──────────────────────────────────────── */
  function openNewProjectModal() {
    let pickedColor = PROJECT_COLORS[0];
    openModal(`
      <div class="modal">
        <div class="modal-head">
          <div class="eyebrow">New</div>
          <h2 class="modal-title">새 프로젝트</h2>
          <div class="modal-sub">프롬프트, 폴더 연결, 대화 기록을 이 프로젝트에 모아둡니다.</div>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">이름</label>
            <input class="input" id="np-name" placeholder="예: Night Drone Seoul" autofocus>
          </div>
          <div class="field">
            <label class="field-label">설명 <span class="field-hint">(선택)</span></label>
            <input class="input" id="np-desc" placeholder="비 내린 직후 도심 야경 시퀀스">
          </div>
          <div class="field">
            <label class="field-label">색상</label>
            <div class="swatch-grid" id="np-colors">
              ${PROJECT_COLORS.map((c, i) => `<button data-color="${escapeHtml(c)}" style="background:${c}" class="${i === 0 ? 'is-active' : ''}"></button>`).join('')}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" id="np-cancel">취소</button>
          <button class="btn btn--primary" id="np-create">만들기</button>
        </div>
      </div>
    `);

    $('#np-colors').addEventListener('click', (e) => {
      const b = e.target.closest('[data-color]');
      if (!b) return;
      pickedColor = b.getAttribute('data-color');
      $$('#np-colors button').forEach((x) => x.classList.toggle('is-active', x === b));
    });
    $('#np-cancel').addEventListener('click', closeModal);
    $('#np-create').addEventListener('click', async () => {
      const name = $('#np-name').value.trim();
      if (!name) { toast('이름을 입력하세요'); return; }
      await createProject({
        name,
        description: $('#np-desc').value.trim(),
        color: pickedColor,
      });
      closeModal();
      toast('프로젝트 생성됨');
      await renderCurrentTab();
    });
  }

  /* ── Settings modal ─────────────────────────────────────────── */
  async function openSettingsModal() {
    const apiStatusBadge = state.apiStatus === 'ok'
      ? '<span class="chip chip--emerald">● 연결됨</span>'
      : state.apiStatus === 'no-key'
        ? '<span class="chip chip--amber">⚠ API 키 미설정</span>'
        : '<span class="chip">● 오프라인</span>';

    openModal(`
      <div class="modal">
        <div class="modal-head">
          <div class="eyebrow">Settings</div>
          <h2 class="modal-title">설정</h2>
        </div>
        <div class="modal-body">

          <div class="settings-section">
            <div class="settings-section-head">
              <h3>Gemini API</h3>
              ${apiStatusBadge}
            </div>
            <p class="field-hint" style="margin:0 0 12px;">
              Vercel 프로젝트 → Settings → Environment Variables 에
              <code>GEMINI_API_KEY</code> 를 추가하면 자동으로 연결됩니다.
            </p>
            <button class="btn btn--sm" id="set-recheck">연결 다시 확인</button>
          </div>

          <hr style="border:0;border-top:1px solid var(--border);margin:8px 0;">

          <div class="settings-section">
            <h3>데이터</h3>
            <p class="field-hint" style="margin:0 0 12px;">프로젝트, 프롬프트, 메모, 채팅 기록은 모두 브라우저 IndexedDB 에 저장됩니다.</p>
            <div style="display:flex; gap:8px; flex-wrap: wrap;">
              <button class="btn btn--sm" id="set-export">JSON 으로 내보내기</button>
              <button class="btn btn--sm" id="set-import">JSON 가져오기</button>
              <button class="btn btn--sm btn--ghost" id="set-wipe" style="color:var(--red);">모든 데이터 삭제</button>
            </div>
          </div>

          <hr style="border:0;border-top:1px solid var(--border);margin:8px 0;">

          <div class="settings-section">
            <h3>외관</h3>
            <div style="display:flex; gap:8px;">
              <button class="chip ${state.theme === 'light' ? 'is-active' : ''}" data-theme="light">☀ Light</button>
              <button class="chip ${state.theme === 'dark' ? 'is-active' : ''}" data-theme="dark">☾ Dark</button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--primary" id="set-close">닫기</button>
        </div>
      </div>
    `);

    $('#set-close').addEventListener('click', closeModal);
    $('#set-recheck').addEventListener('click', async () => {
      toast('연결 확인 중…');
      await checkApiStatus();
      closeModal();
      openSettingsModal();
    });
    $$('[data-theme]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (state.theme !== b.getAttribute('data-theme')) await toggleTheme();
        $$('[data-theme]').forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });
    $('#set-export').addEventListener('click', exportAll);
    $('#set-import').addEventListener('click', importAll);
    $('#set-wipe').addEventListener('click', async () => {
      if (!confirm('정말 모든 데이터를 지울까요? 되돌릴 수 없어요.')) return;
      for (const s of ['projects','prompts','file_memos','chat']) await window.VFXDB.clear(s);
      await window.VFXDB.delete('settings', 'activeProjectId');
      state.projects = [];
      state.activeProjectId = null;
      renderContextStrip();
      closeModal();
      toast('초기화됨');
      await renderCurrentTab();
    });
  }

  async function exportAll() {
    const data = {};
    for (const s of ['projects','prompts','file_memos','chat','settings']) {
      data[s] = await window.VFXDB.all(s);
    }
    // Strip non-serializable handles
    data.projects = data.projects.map((p) => ({ ...p, linkedFolderHandle: null }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vfx-prompt-studio-' + Date.now() + '.json'; a.click();
    URL.revokeObjectURL(url);
    toast('내보내기 완료');
  }

  async function importAll() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.addEventListener('change', async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        const txt = await f.text();
        const data = JSON.parse(txt);
        for (const s of ['projects','prompts','file_memos','chat']) {
          if (Array.isArray(data[s])) for (const r of data[s]) await window.VFXDB.put(s, r);
        }
        toast('가져오기 완료');
        await loadProjects();
        await renderCurrentTab();
      } catch (e) {
        toast('가져오기 실패: ' + e.message);
      }
    });
    inp.click();
  }

  /* ── Tabs ────────────────────────────────────────────────────── */
  async function switchTab(id) {
    if (!TABS.includes(id)) return;
    state.tab = id;
    $$('.rail-btn').forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-tab') === id));
    await renderCurrentTab();
    renderStages();
  }

  async function renderCurrentTab() {
    const host = $('#content');
    const p = getActiveProject();
    if (state.tab === 'studio') {
      await window.Bot.open(p?.id);
      window.Bot.render(host);
    } else if (state.tab === 'storyboard') {
      await window.Storyboard.open(p?.id);
      window.Storyboard.render(host);
    } else if (state.tab === 'prompts') {
      await window.Prompts.open(p?.id);
      window.Prompts.render(host);
    } else if (state.tab === 'archive') {
      await window.Archive.open(p?.id, p);
      window.Archive.render(host);
    } else if (state.tab === 'guide') {
      window.Guide.render(host);
    }
  }

  /* ── Stage chips (project workflow pipeline) ────────────────── */
  function getProjectStages(p) {
    // Returns merged stage state — defaults to all active
    const stored = p?.stages || {};
    const merged = {};
    for (const stg of STAGES) {
      merged[stg.id] = stored[stg.id] || { status: 'active' };
    }
    return merged;
  }

  async function toggleStageSkip(stageId) {
    const p = getActiveProject();
    if (!p) return;
    if (!p.stages) p.stages = {};
    if (!p.stages[stageId]) p.stages[stageId] = { status: 'active' };
    p.stages[stageId].status = p.stages[stageId].status === 'skip' ? 'active' : 'skip';
    await window.VFXDB.put('projects', p);
    renderStages();
  }

  function renderStages() {
    const stripEl = $('#stages');
    if (!stripEl) return;
    const p = getActiveProject();
    if (!p) { stripEl.hidden = true; return; }
    stripEl.hidden = false;

    const stages = getProjectStages(p);
    const activeStages = STAGES.filter((s) => stages[s.id].status !== 'skip');
    const activeCount = activeStages.length;

    stripEl.innerHTML = `
      <div class="stages-inner">
        ${STAGES.map((stg) => {
          const st = stages[stg.id];
          const isSkip = st.status === 'skip';
          const isActiveTab = state.tab === stg.tab;
          return `
            <button class="stage-chip ${isSkip ? 'is-skip' : ''} ${isActiveTab ? 'is-current' : ''}"
                    data-stage="${stg.id}" data-tab="${stg.tab}" title="${escapeHtml(stg.desc)}">
              <span class="stage-chip-label">${escapeHtml(stg.label)}</span>
              <span class="stage-chip-desc">${escapeHtml(stg.desc)}</span>
              <button class="stage-skip-btn" data-skip="${stg.id}" title="${isSkip ? '활성화' : '건너뛰기'}">${isSkip ? '+' : '⊘'}</button>
            </button>`;
        }).join('')}
        <div class="stages-meta">활성 ${activeCount} / ${STAGES.length} 단계</div>
      </div>
    `;

    stripEl.querySelectorAll('[data-stage]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('[data-skip]')) return;
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== state.tab) switchTab(tab);
      });
    });
    stripEl.querySelectorAll('[data-skip]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStageSkip(btn.getAttribute('data-skip'));
      });
    });
  }

  /* ── First-run demo seed ─────────────────────────────────────── */
  async function maybeSeedDemo() {
    const seeded = await window.VFXDB.getSetting('seeded');
    if (seeded) return;
    const existing = await window.VFXDB.all('projects');
    if (existing.length > 0) {
      await window.VFXDB.setSetting('seeded', true);
      return;
    }
    const p1 = {
      id: window.VFXDB.uid(),
      name: 'Night Drone Seoul',
      description: '비 내린 직후 도심 야경 시퀀스',
      color: PROJECT_COLORS[0],
      linkedFolderHandle: null,
      linkedFolderName: null,
      createdAt: Date.now() - 86400000,
    };
    const p2 = {
      id: window.VFXDB.uid(),
      name: 'Mech Kitbash',
      description: '키트배시 메카닉 스튜디오 샷',
      color: PROJECT_COLORS[1],
      linkedFolderHandle: null,
      linkedFolderName: null,
      createdAt: Date.now() - 3600000,
    };
    await window.VFXDB.put('projects', p1);
    await window.VFXDB.put('projects', p2);

    const seedPrompts = [
      {
        projectId: p1.id, tool: 'runway', category: 'scene', isFavorite: true,
        title: 'Night drone, rain-slick Seoul',
        originalKorean: '야간 도심 드론샷, 비 내린 직후 네온이 바닥에 반사',
        content: 'High-angle drone shot descending through rain-slick neon-lit alleyway of nighttime Seoul, anamorphic lens flare, slow forward push into narrow street, volumetric fog, teal-orange grade, 35mm film grain, 10 seconds.',
        tags: ['rain', 'neon', 'seoul'],
      },
      {
        projectId: p1.id, tool: 'kling', category: 'fx', isFavorite: false,
        title: 'Volumetric fog rolling',
        originalKorean: '안개가 굴러오는 새벽 협곡',
        content: 'Static locked-off wide shot, dense volumetric fog rolling across rocky valley floor at dawn, backlight forming god rays through mist, photorealistic, 5 seconds.',
        tags: ['fog', 'dawn'],
      },
      {
        projectId: p2.id, tool: 'midjourney', category: 'asset', isFavorite: true,
        title: 'Mech kitbash hero',
        originalKorean: '메카닉 스튜디오 헤로 샷',
        content: 'Studio render, weathered industrial mecha, brutalist silhouette, side three-quarter, neutral grey backdrop, rim light from upper-left, octane render, --ar 16:9 --style raw --v 6',
        tags: ['mech', 'studio'],
      },
    ];
    for (const sp of seedPrompts) {
      await window.VFXDB.put('prompts', {
        id: window.VFXDB.uid(),
        createdAt: Date.now() - Math.random() * 86400000 * 5,
        ...sp,
      });
    }

    await window.VFXDB.setSetting('seeded', true);
    await window.VFXDB.setSetting('activeProjectId', p1.id);
  }

  /* ── Util ────────────────────────────────────────────────────── */
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  /* ── Keyboard shortcuts ─────────────────────────────────────── */
  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input,textarea')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        switchTab('studio');
        setTimeout(() => $('#composer-input')?.focus(), 60);
      }
      if (e.key === '1') switchTab('studio');
      if (e.key === '2') switchTab('storyboard');
      if (e.key === '3') switchTab('prompts');
      if (e.key === '4') switchTab('archive');
      if (e.key === '5') switchTab('guide');
    });
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  async function boot() {
    await window.VFXDB.ready();
    await loadTheme();
    await maybeSeedDemo();
    await loadProjects();
    await renderCurrentTab();
    checkApiStatus();

    // Rail
    $$('.rail-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.getAttribute('data-tab'))));
    $('#theme-toggle').addEventListener('click', toggleTheme);
    $('#settings-open').addEventListener('click', openSettingsModal);

    // Context strip
    $('#ctx-project-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = $('#ctx-dropdown');
      if (dd.hidden) openCtxDropdown(); else closeCtxDropdown();
    });
    $('#ctx-dropdown-new').addEventListener('click', () => {
      closeCtxDropdown();
      openNewProjectModal();
    });

    bindKeys();
  }

  window.App = {
    toast, openModal, closeModal,
    openNewProjectModal, openSettingsModal, openEditProjectModal,
    openTab: switchTab,
    activeProject: getActiveProject,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
