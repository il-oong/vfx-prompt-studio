/* ───────────────────────────────────────────────────────────────
   js/tab-deliver.js
   Deliver stage — platform export checklist + metadata + AI usage
   declaration auto-generation + project JSON export.
   Persists to project.deliver = { platforms, metadata, aiTools, credits }
   Public: window.Deliver = { render(host), open(projectId) }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let state = {
    projectId: null,
    project: null,
  };

  let saveTimer = null;

  const PLATFORMS = [
    { key: 'youtube',  label: 'YouTube 메인',     spec: '4K H.264 · 24fps · 16:9 · -14 LUFS' },
    { key: 'reels',    label: 'Instagram Reels',  spec: '1080p H.264 · 30fps · 9:16 · -14 LUFS · 60초 이하' },
    { key: 'tiktok',   label: 'TikTok',           spec: '1080p H.264 · 30fps · 9:16 · -14 LUFS · 3분 이하' },
    { key: 'shorts',   label: 'YouTube Shorts',   spec: '1080p H.264 · 30fps · 9:16 · 60초 이하' },
    { key: 'spotify',  label: 'Spotify Canvas',   spec: '720p · 8초 루프 · 9:16 · 무음' },
    { key: 'twitter',  label: 'X (Twitter)',      spec: '1080p H.264 · 30fps · 16:9 · 2분 20초 이하' },
  ];

  const KNOWN_AI_TOOLS = [
    'Google Veo 3.1', 'Google Gemini', 'Google Nano Banana',
    'OpenAI Sora', 'Runway Gen-4', 'Kling AI', 'Hailuo MiniMax',
    'Midjourney', 'Flux', 'Wan 2.2', 'HunyuanVideo', 'LTX-Video',
    'Stable Diffusion', 'CogVideoX', 'After Effects', 'DaVinci Resolve',
  ];

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function getDeliver() {
    if (!state.project) return { platforms: {}, metadata: {}, aiTools: [], credits: '', costNotes: '' };
    if (!state.project.deliver) state.project.deliver = { platforms: {}, metadata: {}, aiTools: [], credits: '', costNotes: '' };
    const d = state.project.deliver;
    if (!d.platforms) d.platforms = {};
    if (!d.metadata) d.metadata = {};
    if (!d.aiTools) d.aiTools = [];
    return d;
  }

  async function persist() {
    if (!state.project) return;
    await window.VFXDB.put('projects', state.project);
  }
  function debouncedPersist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }

  /* ── Platform checklist ──────────────────────────────────────── */
  async function togglePlatform(key) {
    const d = getDeliver();
    if (!d.platforms[key]) d.platforms[key] = { enabled: false, done: false, fileLink: '' };
    d.platforms[key].enabled = !d.platforms[key].enabled;
    await persist();
    render();
  }

  async function togglePlatformDone(key) {
    const d = getDeliver();
    if (!d.platforms[key]) d.platforms[key] = { enabled: true, done: false, fileLink: '' };
    d.platforms[key].done = !d.platforms[key].done;
    await persist();
    render();
  }

  async function updatePlatformLink(key, link) {
    const d = getDeliver();
    if (!d.platforms[key]) d.platforms[key] = { enabled: true, done: false };
    d.platforms[key].fileLink = link;
    debouncedPersist();
  }

  /* ── Metadata fields ─────────────────────────────────────────── */
  async function updateMeta(field, value) {
    const d = getDeliver();
    d.metadata[field] = value;
    debouncedPersist();
  }

  /* ── AI tools ────────────────────────────────────────────────── */
  async function toggleAITool(tool) {
    const d = getDeliver();
    if (d.aiTools.includes(tool)) {
      d.aiTools = d.aiTools.filter((t) => t !== tool);
    } else {
      d.aiTools.push(tool);
    }
    await persist();
    render();
  }

  async function addCustomAITool() {
    const name = prompt('도구 이름 (예: Topaz Video AI)');
    if (!name) return;
    const d = getDeliver();
    if (!d.aiTools.includes(name)) {
      d.aiTools.push(name);
      await persist();
      render();
    }
  }

  function buildAIDeclaration() {
    const d = getDeliver();
    if (d.aiTools.length === 0) return '';
    const tools = d.aiTools.join(', ');
    return `이 영상은 AI 생성 도구가 일부 활용되었습니다 (${tools}). 모든 AI 생성물은 정식 결제 사용 (Vertex AI / AI Studio API 등) 기반이며, 한국 AI 기본법 및 방통위 가이드라인에 따라 본 표기를 포함합니다.`;
  }

  function copyAIDeclaration() {
    const text = buildAIDeclaration();
    if (!text) {
      window.App?.toast('사용한 AI 도구를 먼저 선택하세요');
      return;
    }
    navigator.clipboard?.writeText(text).then(() => window.App?.toast('AI 표기 복사됨'));
  }

  /* ── Project export ──────────────────────────────────────────── */
  async function exportProjectJSON() {
    if (!state.project) return;
    const data = {
      project: { ...state.project, linkedFolderHandle: null },
      prompts: await window.VFXDB.all('prompts', 'projectId', state.projectId),
      file_memos: await window.VFXDB.all('file_memos', 'projectId', state.projectId),
      chat: await window.VFXDB.all('chat', 'projectId', state.projectId),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-${state.project.name.replace(/[^a-z0-9가-힣]+/gi, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function buildCreditsText() {
    const d = getDeliver();
    const m = d.metadata;
    const parts = [];
    if (m.director)    parts.push('감독: ' + m.director);
    if (m.cinematography) parts.push('촬영: ' + m.cinematography);
    if (m.editing)     parts.push('편집: ' + m.editing);
    if (m.vfx)         parts.push('VFX: ' + m.vfx);
    if (m.colorist)    parts.push('컬러: ' + m.colorist);
    if (m.sound)       parts.push('사운드: ' + m.sound);
    return parts.join('  ·  ');
  }

  function copyCredits() {
    const text = buildCreditsText();
    if (!text) {
      window.App?.toast('크레딧 필드를 채워주세요');
      return;
    }
    navigator.clipboard?.writeText(text).then(() => window.App?.toast('크레딧 복사됨'));
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function renderPlatformRow(p) {
    const d = getDeliver();
    const cfg = d.platforms[p.key] || { enabled: false, done: false, fileLink: '' };
    return `
      <div class="dl-platform-row ${cfg.enabled ? 'is-enabled' : ''}">
        <label class="dl-platform-toggle">
          <input type="checkbox" data-platform-enable="${p.key}" ${cfg.enabled ? 'checked' : ''}>
          <span class="dl-platform-label">${esc(p.label)}</span>
          <span class="dl-platform-spec">${esc(p.spec)}</span>
        </label>
        ${cfg.enabled ? `
          <div class="dl-platform-detail">
            <label class="dl-platform-done">
              <input type="checkbox" data-platform-done="${p.key}" ${cfg.done ? 'checked' : ''}>
              <span>${cfg.done ? '✓ 출력 완료' : '출력 대기'}</span>
            </label>
            <input class="input dl-platform-link" data-platform-link="${p.key}" value="${esc(cfg.fileLink || '')}" placeholder="파일 경로 또는 공개 URL">
          </div>` : ''}
      </div>`;
  }

  function render() {
    if (!host) return;
    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">⑤</div>
            <h3>프로젝트를 먼저 만들어 주세요</h3>
            <button class="btn btn--primary" id="dl-new-project">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      host.querySelector('#dl-new-project')?.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }

    const d = getDeliver();
    const m = d.metadata;
    const enabledCount = Object.values(d.platforms).filter((x) => x.enabled).length;
    const doneCount = Object.values(d.platforms).filter((x) => x.enabled && x.done).length;

    host.innerHTML = `
      <div class="tab-pad"><div class="tab-max">
        <div class="dl-head">
          <div>
            <div class="eyebrow eyebrow--amber">⑤ Deliver</div>
            <h2 class="title">마감 · 송출</h2>
            <p class="subtitle">플랫폼별 마스터 출력 체크리스트 + 메타데이터 + AI 표기 + 프로젝트 백업</p>
          </div>
          <div class="dl-summary">
            ${doneCount} / ${enabledCount} 플랫폼 완료
          </div>
        </div>

        <section class="dl-section">
          <h3 class="dl-section-title">플랫폼별 마스터 출력</h3>
          <p class="cp-hint">사용할 플랫폼을 체크하면 출력 사양과 진행 상태가 표시됩니다.</p>
          <div class="dl-platforms">
            ${PLATFORMS.map(renderPlatformRow).join('')}
          </div>
        </section>

        <section class="dl-section">
          <h3 class="dl-section-title">메타데이터</h3>
          <div class="dl-grid">
            <label class="dl-field dl-field--wide">
              <span class="dl-label">제목</span>
              <input class="input" data-meta="title" value="${esc(m.title)}" placeholder="예: Night Drone Seoul - Official MV">
            </label>
            <label class="dl-field dl-field--wide">
              <span class="dl-label">설명</span>
              <textarea class="input" data-meta="description" rows="3" placeholder="작품 설명, 컨셉, 출연진 등">${esc(m.description)}</textarea>
            </label>
            <label class="dl-field dl-field--wide">
              <span class="dl-label">태그 (쉼표 구분)</span>
              <input class="input" data-meta="tags" value="${esc(m.tags)}" placeholder="MV, 인디, 시네마틱, AI VFX, 2026">
            </label>

            <label class="dl-field">
              <span class="dl-label">감독</span>
              <input class="input" data-meta="director" value="${esc(m.director)}" placeholder="감독명">
            </label>
            <label class="dl-field">
              <span class="dl-label">촬영</span>
              <input class="input" data-meta="cinematography" value="${esc(m.cinematography)}" placeholder="DOP">
            </label>
            <label class="dl-field">
              <span class="dl-label">편집</span>
              <input class="input" data-meta="editing" value="${esc(m.editing)}" placeholder="편집자">
            </label>
            <label class="dl-field">
              <span class="dl-label">VFX</span>
              <input class="input" data-meta="vfx" value="${esc(m.vfx)}" placeholder="VFX 슈퍼바이저">
            </label>
            <label class="dl-field">
              <span class="dl-label">컬러</span>
              <input class="input" data-meta="colorist" value="${esc(m.colorist)}" placeholder="콜로리스트">
            </label>
            <label class="dl-field">
              <span class="dl-label">사운드</span>
              <input class="input" data-meta="sound" value="${esc(m.sound)}" placeholder="믹스 엔지니어">
            </label>
          </div>
          <div class="dl-credit-preview">
            <div class="dl-credit-label">크레딧 한 줄 (복사 가능)</div>
            <div class="dl-credit-text">${esc(buildCreditsText()) || '<em>위 필드를 채우면 자동 생성됩니다</em>'}</div>
            <button class="btn btn--sm" id="dl-copy-credits" ${buildCreditsText() ? '' : 'disabled'}>⎘ 복사</button>
          </div>
        </section>

        <section class="dl-section">
          <h3 class="dl-section-title">사용한 AI 도구</h3>
          <p class="cp-hint">한국 송출 시 AI 사용 표기 의무. 사용한 도구를 선택하면 표기 문구가 자동 생성됩니다.</p>
          <div class="dl-ai-grid">
            ${KNOWN_AI_TOOLS.map((t) => `
              <button class="dl-ai-chip ${d.aiTools.includes(t) ? 'is-active' : ''}" data-ai-tool="${esc(t)}">${esc(t)}</button>`).join('')}
            <button class="dl-ai-chip dl-ai-chip--add" id="dl-ai-add">+ 기타</button>
          </div>
          ${d.aiTools.length > 0 ? `
            <div class="dl-ai-declaration">
              <div class="dl-credit-label">AI 사용 표기 (한국 송출용)</div>
              <p class="dl-ai-text">${esc(buildAIDeclaration())}</p>
              <button class="btn btn--sm" id="dl-copy-ai">⎘ 복사</button>
            </div>` : ''}
        </section>

        <section class="dl-section">
          <h3 class="dl-section-title">비용 / 영수증 메모</h3>
          <textarea class="input" data-meta="costNotes" rows="3" placeholder="Vertex AI · AI Studio API · ComfyUI 등 사용 비용 메모. 분쟁 발생 시 합법 사용 증빙.">${esc(d.costNotes || '')}</textarea>
        </section>

        <section class="dl-section">
          <h3 class="dl-section-title">프로젝트 백업</h3>
          <p class="cp-hint">컨셉 · 컷 · 프롬프트 · 메모 · 채팅 기록을 한 JSON 파일로 내보냅니다.</p>
          <button class="btn btn--primary" id="dl-export-json">📦 프로젝트 JSON 내보내기</button>
        </section>
      </div></div>`;

    wireEvents();
  }

  function wireEvents() {
    if (!host) return;

    host.querySelectorAll('[data-platform-enable]').forEach((cb) => {
      cb.addEventListener('change', () => togglePlatform(cb.getAttribute('data-platform-enable')));
    });
    host.querySelectorAll('[data-platform-done]').forEach((cb) => {
      cb.addEventListener('change', () => togglePlatformDone(cb.getAttribute('data-platform-done')));
    });
    host.querySelectorAll('[data-platform-link]').forEach((inp) => {
      inp.addEventListener('input', () => updatePlatformLink(inp.getAttribute('data-platform-link'), inp.value));
    });

    host.querySelectorAll('[data-meta]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const field = inp.getAttribute('data-meta');
        if (field === 'costNotes') {
          getDeliver().costNotes = inp.value;
        } else {
          updateMeta(field, inp.value);
        }
        debouncedPersist();
        // For credits preview, re-render
        if (['director', 'cinematography', 'editing', 'vfx', 'colorist', 'sound'].includes(field)) {
          // light re-render of just credits preview
          const previewEl = host.querySelector('.dl-credit-text');
          if (previewEl) previewEl.innerHTML = esc(buildCreditsText()) || '<em>위 필드를 채우면 자동 생성됩니다</em>';
          const btn = host.querySelector('#dl-copy-credits');
          if (btn) btn.disabled = !buildCreditsText();
        }
      });
    });

    host.querySelectorAll('[data-ai-tool]').forEach((b) => {
      b.addEventListener('click', () => toggleAITool(b.getAttribute('data-ai-tool')));
    });
    host.querySelector('#dl-ai-add')?.addEventListener('click', addCustomAITool);
    host.querySelector('#dl-copy-ai')?.addEventListener('click', copyAIDeclaration);
    host.querySelector('#dl-copy-credits')?.addEventListener('click', copyCredits);
    host.querySelector('#dl-export-json')?.addEventListener('click', exportProjectJSON);
  }

  async function open(projectId) {
    clearTimeout(saveTimer);
    saveTimer = null;
    state.projectId = projectId || null;
    state.project = projectId ? await window.VFXDB.get('projects', projectId) : null;
  }

  function setHost(el) { host = el; render(); }

  window.Deliver = { render: setHost, open };
})();
