/* ───────────────────────────────────────────────────────────────
   js/tab-storyboard.js
   Storyboard / Shotlist tab — the heart of project workflow.
   - Scene cards CRUD per project (IndexedDB `scenes` store)
   - Korean → English prompt translation (reuses /api/gemini)
   - Per-scene image generation via Nano Banana (/api/image)
   - Drag reorder, status badges, scene detail panel
   Public: window.Storyboard = { render(host), open(projectId) }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let state = {
    projectId: null,
    scenes: [],
    selectedId: null,
    translating: {}, // sceneId -> bool
    generatingImg: {}, // sceneId -> bool
  };

  const SHOT_TYPES = [
    ['wide', '와이드 / 설정샷'],
    ['medium', '미디엄'],
    ['close-up', '클로즈업'],
    ['extreme-close-up', '극 클로즈업'],
    ['macro', '매크로'],
    ['over-shoulder', '어깨너머'],
    ['pov', 'POV'],
    ['drone', '드론'],
  ];

  const SCENE_STATUS = {
    planned: { label: '계획됨', icon: '○', color: 'muted' },
    image: { label: '이미지 ✓', icon: '◐', color: 'amber' },
    video: { label: '영상 ✓', icon: '◑', color: 'accent' },
    done: { label: '완료', icon: '✓', color: 'emerald' },
  };

  const SCENE_TYPES = [
    ['ai-video', 'AI 영상'],
    ['ai-image', 'AI 이미지'],
    ['real', '실촬'],
    ['vfx-comp', 'VFX 합성'],
    ['transition', '트랜지션'],
  ];

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function hasKorean(t) {
    return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(t || '');
  }

  function selectedScene() {
    return state.scenes.find((s) => s.id === state.selectedId) || null;
  }

  /* ── DB ──────────────────────────────────────────────────────── */
  async function loadScenes(projectId) {
    if (!projectId) return [];
    const rows = await window.VFXDB.all('scenes', 'projectId', projectId);
    return rows.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async function persist(scene) {
    scene.updatedAt = Date.now();
    await window.VFXDB.put('scenes', scene);
  }

  async function addScene() {
    if (!state.projectId) return;
    const nextOrder = state.scenes.length
      ? Math.max(...state.scenes.map((s) => s.order || 0)) + 1
      : 1;
    const sc = {
      id: window.VFXDB.uid(),
      projectId: state.projectId,
      order: nextOrder,
      titleKo: '컷 ' + nextOrder,
      descKo: '',
      descEn: '',
      durationSec: 5,
      type: 'ai-video',
      status: 'planned',
      imageData: null,
      imageMime: null,
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.scenes.push(sc);
    state.selectedId = sc.id;
    await persist(sc);
    render();
  }

  async function deleteScene(id) {
    if (!confirm('이 컷을 삭제할까요?')) return;
    await window.VFXDB.delete('scenes', id);
    state.scenes = state.scenes.filter((s) => s.id !== id);
    if (state.selectedId === id) state.selectedId = state.scenes[0]?.id || null;
    render();
  }

  async function moveScene(id, dir) {
    const i = state.scenes.findIndex((s) => s.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= state.scenes.length) return;
    [state.scenes[i], state.scenes[j]] = [state.scenes[j], state.scenes[i]];
    // re-number order
    state.scenes.forEach((s, idx) => { s.order = idx + 1; });
    for (const s of state.scenes) await persist(s);
    render();
  }

  async function updateField(id, field, value) {
    const sc = state.scenes.find((s) => s.id === id);
    if (!sc) return;
    sc[field] = value;
    await persist(sc);
  }

  /* ── Translate ───────────────────────────────────────────────── */
  async function translateScene(id) {
    const sc = state.scenes.find((s) => s.id === id);
    if (!sc) return;
    const text = (sc.descKo || '').trim();
    if (!text) return;
    if (!hasKorean(text)) {
      sc.descEn = text;
      await persist(sc);
      render();
      return;
    }
    state.translating[id] = true;
    render();
    try {
      const sys = (window.BASE_SYSTEM_PROMPT || '') +
        '\n\n[TOOL: General cinematic prompt for storyboard / video generation]\nGenerate a single concise English prompt (40-90 words) suitable for AI video tools (Veo, Wan, Runway). One paragraph, no markdown.';
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text }],
          systemPrompt: sys,
        }),
      });
      const data = await r.json().catch(() => ({}));
      // bot replies start with Korean acknowledgement, then English prompt block — try to extract
      const out = (data.text || text).trim();
      // crude split: take last paragraph
      const blocks = out.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
      sc.descEn = blocks.length > 1 ? blocks[blocks.length - 1] : out;
      await persist(sc);
    } catch (err) {
      window.App?.toast('번역 실패: ' + err.message);
    } finally {
      state.translating[id] = false;
      render();
    }
  }

  /* ── Nano Banana image generation ─────────────────────────────── */
  async function generateImage(id) {
    const sc = state.scenes.find((s) => s.id === id);
    if (!sc) return;
    const prompt = (sc.descEn || sc.descKo || '').trim();
    if (!prompt) {
      window.App?.toast('먼저 프롬프트를 입력해 주세요');
      return;
    }
    state.generatingImg[id] = true;
    render();
    try {
      const r = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt + ', cinematic still, single frame keyframe' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.data) {
        throw new Error(data.detail || data.message || data.error || ('HTTP ' + r.status));
      }
      sc.imageData = data.data;
      sc.imageMime = data.mime || 'image/png';
      if (sc.status === 'planned') sc.status = 'image';
      await persist(sc);
      window.App?.toast('이미지 생성됨');
    } catch (err) {
      window.App?.toast('이미지 실패: ' + err.message);
    } finally {
      state.generatingImg[id] = false;
      render();
    }
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function statusBadge(status) {
    const s = SCENE_STATUS[status] || SCENE_STATUS.planned;
    return `<span class="sb-status sb-status--${s.color}">${s.icon} ${esc(s.label)}</span>`;
  }

  function renderCard(sc, idx) {
    const isSelected = sc.id === state.selectedId;
    const imgSrc = sc.imageData
      ? `data:${sc.imageMime || 'image/png'};base64,${sc.imageData}`
      : '';
    const typeLabel = SCENE_TYPES.find(([k]) => k === sc.type)?.[1] || sc.type;
    return `
      <div class="sb-card ${isSelected ? 'is-selected' : ''}" data-scene-id="${sc.id}">
        <div class="sb-card-thumb">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${esc(sc.titleKo)}" />`
            : `<div class="sb-card-thumb-empty">콘티 이미지 없음</div>`}
        </div>
        <div class="sb-card-body">
          <div class="sb-card-head">
            <span class="sb-card-num">#${idx + 1}</span>
            <span class="sb-card-title">${esc(sc.titleKo || '제목 없음')}</span>
            <span class="sb-card-dur">${sc.durationSec}s</span>
          </div>
          <div class="sb-card-meta">
            <span class="sb-card-type">${esc(typeLabel)}</span>
            ${statusBadge(sc.status)}
          </div>
          ${sc.descKo ? `<p class="sb-card-desc">${esc(sc.descKo.slice(0, 80))}${sc.descKo.length > 80 ? '…' : ''}</p>` : ''}
        </div>
        <div class="sb-card-actions">
          <button class="sb-icon-btn" data-move-up="${sc.id}" ${idx === 0 ? 'disabled' : ''} title="앞으로">↑</button>
          <button class="sb-icon-btn" data-move-down="${sc.id}" ${idx === state.scenes.length - 1 ? 'disabled' : ''} title="뒤로">↓</button>
          <button class="sb-icon-btn sb-icon-btn--danger" data-delete="${sc.id}" title="삭제">×</button>
        </div>
      </div>`;
  }

  function renderDetail() {
    const sc = selectedScene();
    if (!sc) {
      return `
        <div class="sb-detail-empty">
          <div class="empty-icon">◆</div>
          <p>좌측에서 컷을 선택하거나 새로 추가하세요</p>
        </div>`;
    }
    const imgSrc = sc.imageData
      ? `data:${sc.imageMime || 'image/png'};base64,${sc.imageData}`
      : '';
    const translating = state.translating[sc.id];
    const generating = state.generatingImg[sc.id];

    return `
      <div class="sb-detail">
        <div class="sb-detail-head">
          <input class="input sb-detail-title" data-field="titleKo" value="${esc(sc.titleKo)}" placeholder="컷 제목">
        </div>

        <div class="sb-detail-grid">
          <div class="sb-detail-left">
            <div class="sb-field">
              <label class="sb-label">
                한국어 묘사
                <span class="sb-label-badge">자동 영어 변환</span>
              </label>
              <textarea class="input sb-detail-desc" data-field="descKo" rows="4"
                placeholder="예: 비 내린 직후 도심 골목, 네온 사인 반사, 카메라가 천천히 전진하며 인물의 뒷모습을 따라간다">${esc(sc.descKo)}</textarea>
              <button class="btn btn--sm" data-translate="${sc.id}" ${translating || !sc.descKo ? 'disabled' : ''}>
                ${translating ? '변환 중…' : '↻ 영어 프롬프트로 변환'}
              </button>
            </div>

            <div class="sb-field">
              <label class="sb-label">영어 프롬프트 (Veo / Wan / Runway 용)</label>
              <textarea class="input sb-detail-en" data-field="descEn" rows="5"
                placeholder="영문 프롬프트가 여기에 표시됩니다">${esc(sc.descEn)}</textarea>
            </div>

            <div class="sb-row">
              <div class="sb-field sb-field--mini">
                <label class="sb-label">길이 (초)</label>
                <input type="number" min="1" max="60" class="input" data-field="durationSec" value="${sc.durationSec}">
              </div>
              <div class="sb-field sb-field--mini">
                <label class="sb-label">컷 타입</label>
                <select class="input" data-field="type">
                  ${SCENE_TYPES.map(([k, ko]) => `<option value="${k}" ${sc.type === k ? 'selected' : ''}>${esc(ko)}</option>`).join('')}
                </select>
              </div>
              <div class="sb-field sb-field--mini">
                <label class="sb-label">상태</label>
                <select class="input" data-field="status">
                  ${Object.entries(SCENE_STATUS).map(([k, v]) => `<option value="${k}" ${sc.status === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="sb-field">
              <label class="sb-label">메모</label>
              <textarea class="input" data-field="notes" rows="2"
                placeholder="촬영·합성·편집 시 참고 사항">${esc(sc.notes || '')}</textarea>
            </div>
          </div>

          <div class="sb-detail-right">
            <label class="sb-label">콘티 이미지 (Nano Banana)</label>
            <div class="sb-detail-img-wrap">
              ${imgSrc
                ? `<img src="${imgSrc}" alt="콘티" class="sb-detail-img">`
                : `<div class="sb-detail-img-empty">${generating ? '생성 중…' : '이미지 없음'}</div>`}
            </div>
            <button class="btn btn--primary" data-gen-img="${sc.id}" ${generating || (!sc.descEn && !sc.descKo) ? 'disabled' : ''}>
              ${generating ? '생성 중…' : (imgSrc ? '↻ 다시 생성' : '🎨 이미지 생성')}
            </button>
            <p class="sb-hint">건당 약 $0.04. 프롬프트가 비어있으면 비활성화.</p>
          </div>
        </div>
      </div>`;
  }

  function totalDuration() {
    return state.scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);
  }

  function render() {
    if (!host) return;

    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">◆</div>
            <h3>프로젝트를 먼저 만들어 주세요</h3>
            <p>Storyboard는 프로젝트 단위로 관리됩니다.</p>
            <button class="btn btn--primary" id="sb-new-project">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      host.querySelector('#sb-new-project')?.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }

    const total = totalDuration();
    const completed = state.scenes.filter((s) => s.status === 'done').length;

    host.innerHTML = `
      <div class="sb-layout">
        <div class="sb-list">
          <div class="sb-list-head">
            <div>
              <div class="eyebrow eyebrow--amber">Shotlist</div>
              <h2 class="sb-list-title">컷 시퀀스</h2>
            </div>
            <div class="sb-list-meta">
              <span>${state.scenes.length} 컷 · ${total}s</span>
              <span class="sb-list-dot">·</span>
              <span>${completed} / ${state.scenes.length} 완료</span>
            </div>
          </div>
          <div class="sb-cards" id="sb-cards">
            ${state.scenes.length === 0
              ? '<div class="sb-empty">아직 컷이 없어요. 아래 + 버튼으로 추가하세요.</div>'
              : state.scenes.map(renderCard).join('')}
          </div>
          <button class="btn btn--primary sb-add" id="sb-add">+ 새 컷</button>
        </div>

        <div class="sb-detail-pane">
          ${renderDetail()}
        </div>
      </div>`;

    // Wire events
    host.querySelector('#sb-add')?.addEventListener('click', addScene);

    host.querySelectorAll('.sb-card').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; // action buttons handled separately
        state.selectedId = el.getAttribute('data-scene-id');
        render();
      });
    });

    host.querySelectorAll('[data-move-up]').forEach((b) => {
      b.addEventListener('click', () => moveScene(b.getAttribute('data-move-up'), -1));
    });
    host.querySelectorAll('[data-move-down]').forEach((b) => {
      b.addEventListener('click', () => moveScene(b.getAttribute('data-move-down'), +1));
    });
    host.querySelectorAll('[data-delete]').forEach((b) => {
      b.addEventListener('click', () => deleteScene(b.getAttribute('data-delete')));
    });

    // Detail panel field bindings
    const sc = selectedScene();
    if (sc) {
      host.querySelectorAll('[data-field]').forEach((el) => {
        const field = el.getAttribute('data-field');
        el.addEventListener('change', async () => {
          let v = el.value;
          if (field === 'durationSec') v = Math.max(1, Math.min(60, Number(v) || 1));
          await updateField(sc.id, field, v);
          // partial re-render: just update list metadata
          if (field === 'titleKo' || field === 'durationSec' || field === 'status' || field === 'type' || field === 'descKo') {
            render();
          }
        });
        // textarea descKo also updates without losing focus on input — defer to change
      });
      host.querySelector(`[data-translate="${sc.id}"]`)?.addEventListener('click', () => translateScene(sc.id));
      host.querySelector(`[data-gen-img="${sc.id}"]`)?.addEventListener('click', () => generateImage(sc.id));
    }
  }

  async function open(projectId) {
    state.projectId = projectId || null;
    state.scenes = await loadScenes(projectId);
    state.selectedId = state.scenes[0]?.id || null;
    state.translating = {};
    state.generatingImg = {};
  }

  function setHost(el) { host = el; render(); }

  window.Storyboard = { render: setHost, open };
})();
