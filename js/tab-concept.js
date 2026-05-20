/* ───────────────────────────────────────────────────────────────
   js/tab-concept.js
   Concept stage — scenario, song info, mood board, auto shot list.
   Persists everything into the active project's `concept` object
   (project.concept = { scenario, song, moodImages[] }).
   Public: window.Concept = { render(host), open(projectId) }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let state = {
    projectId: null,
    project: null,
    saving: false,
    generating: false,
    shotListResult: '',
  };

  let saveTimer = null;

  const DEFAULT_CONCEPT = {
    scenario: '',
    song: { title: '', artist: '', bpm: '', durationSec: '', genre: '' },
    moodImages: [],   // { id, data, mime, caption, createdAt }
    referenceLinks: [], // { id, url, note }
  };

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function getConcept() {
    if (!state.project) return structuredClone(DEFAULT_CONCEPT);
    if (!state.project.concept) state.project.concept = structuredClone(DEFAULT_CONCEPT);
    const c = state.project.concept;
    if (!c.song) c.song = structuredClone(DEFAULT_CONCEPT.song);
    if (!c.moodImages) c.moodImages = [];
    if (!c.referenceLinks) c.referenceLinks = [];
    return c;
  }

  async function persist() {
    if (!state.project) return;
    state.saving = true;
    renderStatus();
    await window.VFXDB.put('projects', state.project);
    state.saving = false;
    renderStatus();
  }

  function debouncedPersist() {
    clearTimeout(saveTimer);
    state.saving = true;
    renderStatus();
    saveTimer = setTimeout(() => persist(), 500);
  }

  function renderStatus() {
    const el = host?.querySelector('#cp-status');
    if (!el) return;
    el.textContent = state.saving ? '저장 중…' : '✓ 자동 저장됨';
    el.className = 'cp-status ' + (state.saving ? 'is-saving' : 'is-saved');
  }

  /* ── Mood images ─────────────────────────────────────────────── */
  async function addMoodImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const [meta, data] = dataUrl.split(',');
    const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
    const concept = getConcept();
    concept.moodImages.push({
      id: window.VFXDB.uid(),
      data, mime,
      caption: file.name.replace(/\.[^.]+$/, ''),
      createdAt: Date.now(),
    });
    await persist();
    render();
  }

  async function removeMoodImage(id) {
    const concept = getConcept();
    concept.moodImages = concept.moodImages.filter((m) => m.id !== id);
    await persist();
    render();
  }

  async function updateMoodCaption(id, caption) {
    const concept = getConcept();
    const m = concept.moodImages.find((x) => x.id === id);
    if (m) {
      m.caption = caption;
      debouncedPersist();
    }
  }

  /* ── Reference links ─────────────────────────────────────────── */
  async function addReferenceLink() {
    const concept = getConcept();
    concept.referenceLinks.push({
      id: window.VFXDB.uid(),
      url: '',
      note: '',
    });
    await persist();
    render();
  }

  async function removeReferenceLink(id) {
    const concept = getConcept();
    concept.referenceLinks = concept.referenceLinks.filter((l) => l.id !== id);
    await persist();
    render();
  }

  async function updateReferenceLink(id, field, value) {
    const concept = getConcept();
    const l = concept.referenceLinks.find((x) => x.id === id);
    if (l) {
      l[field] = value;
      debouncedPersist();
    }
  }

  /* ── Shot list auto-generation ───────────────────────────────── */
  async function generateShotList() {
    const concept = getConcept();
    const scenario = (concept.scenario || '').trim();
    if (!scenario) {
      window.App?.toast('시나리오를 먼저 작성하세요');
      return;
    }
    state.generating = true;
    state.shotListResult = '';
    render();

    const songInfo = concept.song.title ? `곡: ${concept.song.title}` +
      (concept.song.artist ? ` - ${concept.song.artist}` : '') +
      (concept.song.durationSec ? ` (${concept.song.durationSec}초)` : '') : '';

    const sys = `You are a music-video shot list designer. Given a Korean scenario, break it into a numbered shot list suitable for production.
RULES
- Communicate with the user in Korean.
- Output a structured shot list, NOT prose.
- Format each shot as: "씬N 컷N | 길이 (초) | 샷 타입 | 한국어 묘사"
- Group shots by scene (씬1, 씬2, ...). Aim for 4-8 scenes total, 2-6 shots per scene.
- Total length should roughly match the song duration if given.
- After the list, add one short Korean paragraph noting the overall pacing/tone.`;

    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: `${songInfo}\n\n시나리오:\n${scenario}\n\n위 시나리오로 컷 리스트를 만들어주세요.` }],
          systemPrompt: sys,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.detail || data.message || data.error || ('HTTP ' + r.status));
      }
      const data = await r.json();
      state.shotListResult = data.text || '';
      // Persist generated shot list as part of concept for reuse
      concept.generatedShotList = state.shotListResult;
      concept.generatedAt = Date.now();
      await persist();
    } catch (err) {
      window.App?.toast('생성 실패: ' + err.message);
      state.shotListResult = '⚠ ' + err.message;
    } finally {
      state.generating = false;
      render();
    }
  }

  function copyShotList() {
    const text = state.shotListResult || getConcept().generatedShotList || '';
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => window.App?.toast('복사됨'));
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function render() {
    if (!host) return;
    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">①</div>
            <h3>프로젝트를 먼저 만들어 주세요</h3>
            <p>Concept는 프로젝트 단위로 저장됩니다.</p>
            <button class="btn btn--primary" id="cp-new-project">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      host.querySelector('#cp-new-project')?.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }

    const c = getConcept();
    const shotListShown = state.shotListResult || c.generatedShotList || '';

    host.innerHTML = `
      <div class="tab-pad"><div class="tab-max">
        <div class="cp-head">
          <div>
            <div class="eyebrow eyebrow--amber">① Concept</div>
            <h2 class="title">컨셉 디벨롭</h2>
            <p class="subtitle">시나리오 · 곡 정보 · 무드보드 · 레퍼런스. 작성 즉시 자동 저장됩니다.</p>
          </div>
          <div class="cp-status is-saved" id="cp-status">✓ 자동 저장됨</div>
        </div>

        <section class="cp-section">
          <h3 class="cp-section-title">시나리오</h3>
          <textarea class="input cp-scenario" id="cp-scenario" rows="8"
            placeholder="새벽 도시. 비 내린 직후 골목. 한 여자가 우산도 없이 옥상으로 올라간다. 멀리 네온 사인이 깜빡인다. 그녀가 뒤돌아본다…">${esc(c.scenario)}</textarea>
        </section>

        <section class="cp-section">
          <h3 class="cp-section-title">곡 정보</h3>
          <div class="cp-grid cp-grid--song">
            <label class="cp-field">
              <span class="cp-label">제목</span>
              <input class="input" id="cp-song-title" value="${esc(c.song.title)}" placeholder="곡 제목">
            </label>
            <label class="cp-field">
              <span class="cp-label">아티스트</span>
              <input class="input" id="cp-song-artist" value="${esc(c.song.artist)}" placeholder="아티스트명">
            </label>
            <label class="cp-field">
              <span class="cp-label">BPM</span>
              <input class="input" id="cp-song-bpm" type="number" min="40" max="240" value="${esc(c.song.bpm)}" placeholder="120">
            </label>
            <label class="cp-field">
              <span class="cp-label">총 길이 (초)</span>
              <input class="input" id="cp-song-dur" type="number" min="10" max="600" value="${esc(c.song.durationSec)}" placeholder="180">
            </label>
            <label class="cp-field cp-field--wide">
              <span class="cp-label">장르 / 무드</span>
              <input class="input" id="cp-song-genre" value="${esc(c.song.genre)}" placeholder="예: 인디 락 / 멜랑콜리">
            </label>
          </div>
        </section>

        <section class="cp-section">
          <h3 class="cp-section-title">무드보드 이미지</h3>
          <p class="cp-hint">컨셉 비주얼·레퍼런스 이미지를 업로드하세요. 드래그해서 추가 가능.</p>
          <div class="cp-mood-grid" id="cp-mood-grid">
            ${c.moodImages.length === 0 ? '' : c.moodImages.map((m) => `
              <div class="cp-mood-card" data-mood-id="${m.id}">
                <img src="data:${m.mime};base64,${m.data}" alt="${esc(m.caption)}">
                <input class="input cp-mood-caption" data-mood-caption="${m.id}" value="${esc(m.caption)}" placeholder="설명">
                <button class="cp-mood-remove" data-mood-remove="${m.id}" title="삭제">×</button>
              </div>`).join('')}
            <label class="cp-mood-add" id="cp-mood-drop">
              <input type="file" accept="image/*" multiple id="cp-mood-file" hidden>
              <div class="cp-mood-add-icon">+</div>
              <div class="cp-mood-add-text">이미지 추가<br><span>드래그 또는 클릭</span></div>
            </label>
          </div>
        </section>

        <section class="cp-section">
          <h3 class="cp-section-title">레퍼런스 링크</h3>
          <div class="cp-refs">
            ${c.referenceLinks.length === 0 ? '<p class="cp-hint">Vimeo / YouTube / Behance 등 레퍼런스 URL 저장.</p>' : ''}
            ${c.referenceLinks.map((l) => `
              <div class="cp-ref-row" data-ref-id="${l.id}">
                <input class="input" data-ref-field="url" data-ref-id="${l.id}" value="${esc(l.url)}" placeholder="https://...">
                <input class="input" data-ref-field="note" data-ref-id="${l.id}" value="${esc(l.note)}" placeholder="메모 (예: 컬러 톤 참고)">
                <button class="btn btn--sm btn--ghost" data-ref-remove="${l.id}">×</button>
              </div>`).join('')}
            <button class="btn btn--sm" id="cp-add-ref">+ 레퍼런스 추가</button>
          </div>
        </section>

        <section class="cp-section">
          <h3 class="cp-section-title">자동 컷 리스트 생성</h3>
          <p class="cp-hint">시나리오 + 곡 정보를 바탕으로 Gemini가 씬·컷 구조를 제안합니다.</p>
          <button class="btn btn--primary" id="cp-generate" ${state.generating || !c.scenario.trim() ? 'disabled' : ''}>
            ${state.generating ? '생성 중…' : (shotListShown ? '↻ 다시 생성' : '✦ 컷 리스트 생성')}
          </button>
          ${shotListShown ? `
            <div class="cp-shotlist">
              <div class="cp-shotlist-head">
                <span>제안된 컷 리스트</span>
                <button class="btn btn--sm" id="cp-copy-shotlist">⎘ 복사</button>
              </div>
              <pre class="cp-shotlist-text">${esc(shotListShown)}</pre>
            </div>` : ''}
        </section>
      </div></div>`;

    wireEvents();
  }

  function wireEvents() {
    if (!host) return;

    // Scenario
    host.querySelector('#cp-scenario')?.addEventListener('input', (e) => {
      getConcept().scenario = e.target.value;
      debouncedPersist();
    });

    // Song fields
    const songFields = ['title', 'artist', 'bpm', 'durationSec', 'genre'];
    songFields.forEach((f) => {
      const id = 'cp-song-' + (f === 'durationSec' ? 'dur' : f);
      host.querySelector('#' + id)?.addEventListener('input', (e) => {
        getConcept().song[f] = e.target.value;
        debouncedPersist();
      });
    });

    // Mood image drop + click
    const drop = host.querySelector('#cp-mood-drop');
    const fileInput = host.querySelector('#cp-mood-file');
    if (drop && fileInput) {
      drop.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') fileInput.click();
      });
      fileInput.addEventListener('change', async (e) => {
        for (const f of e.target.files) await addMoodImage(f);
        e.target.value = '';
      });
      ['dragenter', 'dragover'].forEach((ev) => {
        drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); });
      });
      ['dragleave', 'drop'].forEach((ev) => {
        drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); });
      });
      drop.addEventListener('drop', async (e) => {
        for (const f of e.dataTransfer.files) await addMoodImage(f);
      });
    }
    host.querySelectorAll('[data-mood-remove]').forEach((b) => {
      b.addEventListener('click', () => removeMoodImage(b.getAttribute('data-mood-remove')));
    });
    host.querySelectorAll('[data-mood-caption]').forEach((inp) => {
      inp.addEventListener('input', (e) => updateMoodCaption(inp.getAttribute('data-mood-caption'), e.target.value));
    });

    // Reference links
    host.querySelector('#cp-add-ref')?.addEventListener('click', addReferenceLink);
    host.querySelectorAll('[data-ref-remove]').forEach((b) => {
      b.addEventListener('click', () => removeReferenceLink(b.getAttribute('data-ref-remove')));
    });
    host.querySelectorAll('[data-ref-field]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        updateReferenceLink(inp.getAttribute('data-ref-id'), inp.getAttribute('data-ref-field'), e.target.value);
      });
    });

    // Shot list generation
    host.querySelector('#cp-generate')?.addEventListener('click', generateShotList);
    host.querySelector('#cp-copy-shotlist')?.addEventListener('click', copyShotList);
  }

  async function open(projectId) {
    clearTimeout(saveTimer);
    saveTimer = null;
    state.projectId = projectId || null;
    state.project = projectId ? await window.VFXDB.get('projects', projectId) : null;
    state.shotListResult = '';
    state.generating = false;
  }

  function setHost(el) { host = el; render(); }

  window.Concept = { render: setHost, open };
})();
