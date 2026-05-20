/* ───────────────────────────────────────────────────────────────
   js/tab-composite.js
   Composite stage — VFX comp checklist + frame-by-frame color tool.
   Two main areas:
     1. Per-shot comp checklist (6 standard steps from MV Workflow guide)
     2. Frame color tool: extract frames via FFmpeg.wasm, apply uniform
        color treatment via canvas, reassemble to mp4
   Persists to project.composite = { shots[], notes }
   Public: window.Composite = { render(host), open(projectId) }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let state = {
    projectId: null,
    project: null,
    activeView: 'checklist',  // 'checklist' | 'color'
    color: {
      ffmpegReady: false,
      ffmpegLoading: false,
      videoFile: null,
      videoUrl: '',
      frames: [],          // base64 PNG previews (subsample for UI)
      totalFrames: 0,
      fps: 24,
      extracting: false,
      extractProgress: 0,
      filters: {
        brightness: 100,   // 0-200
        contrast: 100,     // 0-200
        saturation: 100,   // 0-200
        temperature: 0,    // -100 to +100 (cool to warm)
        tint: 0,           // -100 to +100 (magenta to green)
        hue: 0,            // -180 to +180
      },
      encoding: false,
      encodeProgress: 0,
      outputUrl: '',
      outputBlob: null,
    },
  };

  const COMP_STEPS = [
    { key: 'matte',   label: '매트 / 로토',   desc: '합성 영역 마스킹 + 카메라 트래킹' },
    { key: 'cleanup', label: '클린업',        desc: '워터마크·와이어·로고 제거' },
    { key: 'asset',   label: 'AI 에셋 합성',  desc: 'Add/Screen 블렌드, 마스킹 정리' },
    { key: 'grain',   label: '그레인 매칭',   desc: 'AI 부드러움 → 실촬 노이즈 매칭' },
    { key: 'light',   label: '조명 매칭',     desc: '실촬 광원 방향에 그림자·하이라이트 맞추기' },
    { key: 'color',   label: '색온도 매칭',   desc: '1차 그레이드로 톤 통일' },
  ];

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function getComposite() {
    if (!state.project) return { shots: [], notes: '' };
    if (!state.project.composite) state.project.composite = { shots: [], notes: '' };
    if (!state.project.composite.shots) state.project.composite.shots = [];
    return state.project.composite;
  }

  let saveTimer = null;
  async function persist() {
    if (!state.project) return;
    await window.VFXDB.put('projects', state.project);
  }
  function debouncedPersist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }

  /* ── Comp checklist shots ────────────────────────────────────── */
  async function addShot() {
    const comp = getComposite();
    const order = comp.shots.length + 1;
    comp.shots.push({
      id: window.VFXDB.uid(),
      title: '컷 ' + order,
      description: '',
      progress: {},  // {matte: true, cleanup: false, ...}
      notes: '',
    });
    await persist();
    render();
  }

  async function removeShot(id) {
    if (!confirm('이 컷의 합성 체크를 지울까요?')) return;
    const comp = getComposite();
    comp.shots = comp.shots.filter((s) => s.id !== id);
    await persist();
    render();
  }

  async function updateShot(id, field, value) {
    const comp = getComposite();
    const s = comp.shots.find((x) => x.id === id);
    if (!s) return;
    s[field] = value;
    debouncedPersist();
  }

  async function toggleStep(shotId, stepKey) {
    const comp = getComposite();
    const s = comp.shots.find((x) => x.id === shotId);
    if (!s) return;
    if (!s.progress) s.progress = {};
    s.progress[stepKey] = !s.progress[stepKey];
    await persist();
    render();
  }

  function shotCompleteCount(shot) {
    if (!shot.progress) return 0;
    return COMP_STEPS.filter((s) => shot.progress[s.key]).length;
  }

  /* ── FFmpeg.wasm lazy loader ─────────────────────────────────── */
  function loadExternalScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('스크립트 로드 실패: ' + src));
      document.head.appendChild(s);
    });
  }

  async function loadFFmpeg() {
    if (state.color.ffmpegReady || state.color.ffmpegLoading) return;
    state.color.ffmpegLoading = true;
    render();
    try {
      const FFMPEG_VER = '0.12.10';
      const CORE_VER = '0.12.6';
      const UTIL_VER = '0.12.1';
      if (!window.FFmpegWASM) {
        await loadExternalScript(`https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VER}/dist/umd/ffmpeg.js`);
      }
      if (!window.FFmpegUtil) {
        await loadExternalScript(`https://unpkg.com/@ffmpeg/util@${UTIL_VER}/dist/umd/index.js`);
      }
      const { FFmpeg } = window.FFmpegWASM;
      const { toBlobURL } = window.FFmpegUtil;
      window._ffmpeg = new FFmpeg();
      window._ffmpeg.on('progress', ({ progress }) => {
        if (state.color.extracting) {
          state.color.extractProgress = Math.round(progress * 100);
          updateProgressUI();
        } else if (state.color.encoding) {
          state.color.encodeProgress = Math.round(progress * 100);
          updateProgressUI();
        }
      });
      // Use blob URLs (per official FFmpeg.wasm docs) so the core script
      // and wasm load as same-origin even under strict COEP environments.
      const baseURL = `https://unpkg.com/@ffmpeg/core@${CORE_VER}/dist/umd`;
      await window._ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      state.color.ffmpegReady = true;
    } catch (err) {
      window.App?.toast('FFmpeg 로드 실패: ' + err.message);
    } finally {
      state.color.ffmpegLoading = false;
      render();
    }
  }

  function updateProgressUI() {
    const el = host?.querySelector('#cc-progress-bar');
    const label = host?.querySelector('#cc-progress-label');
    if (!el) return;
    const pct = state.color.extracting ? state.color.extractProgress : state.color.encodeProgress;
    el.style.width = pct + '%';
    if (label) label.textContent = (state.color.extracting ? '추출 중' : '인코딩 중') + ': ' + pct + '%';
  }

  /* ── Frame extraction ────────────────────────────────────────── */
  async function extractFrames(file) {
    if (!state.color.ffmpegReady) await loadFFmpeg();
    if (!state.color.ffmpegReady) return;

    state.color.videoFile = file;
    state.color.videoUrl = URL.createObjectURL(file);
    state.color.frames = [];
    state.color.extracting = true;
    state.color.extractProgress = 0;
    state.color.outputUrl = '';
    render();

    const ffmpeg = window._ffmpeg;
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile('in.mp4', buf);
      // Extract preview frames at 2 fps (just for grid display)
      await ffmpeg.exec(['-i', 'in.mp4', '-vf', 'fps=2,scale=160:-2', 'p_%04d.png']);
      const list = await ffmpeg.listDir('/');
      const previewFiles = list.filter((e) => /^p_\d+\.png$/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name));
      const previews = [];
      for (let i = 0; i < Math.min(previewFiles.length, 24); i++) {
        const f = previewFiles[i];
        const data = await ffmpeg.readFile('/' + f.name);
        const blob = new Blob([data], { type: 'image/png' });
        previews.push(URL.createObjectURL(blob));
      }
      state.color.frames = previews;
      state.color.totalFrames = previewFiles.length * (state.color.fps / 2); // rough
      // cleanup preview pngs
      for (const f of previewFiles) await ffmpeg.deleteFile('/' + f.name);
    } catch (err) {
      window.App?.toast('프레임 추출 실패: ' + err.message);
    } finally {
      state.color.extracting = false;
      render();
    }
  }

  /* ── Apply color filters & re-encode ─────────────────────────── */
  function buildCssFilter() {
    const f = state.color.filters;
    // CSS filter for live preview
    return [
      `brightness(${f.brightness}%)`,
      `contrast(${f.contrast}%)`,
      `saturate(${f.saturation}%)`,
      `hue-rotate(${f.hue}deg)`,
    ].join(' ');
  }

  function buildFFmpegFilter() {
    const f = state.color.filters;
    // eq: brightness(-1 to 1), contrast(0-2), saturation(0-3), gamma
    const b = (f.brightness - 100) / 100;      // -1 .. 1
    const c = f.contrast / 100;                 // 0 .. 2
    const s = f.saturation / 100;               // 0 .. 2
    const parts = [`eq=brightness=${b.toFixed(2)}:contrast=${c.toFixed(2)}:saturation=${s.toFixed(2)}`];
    if (f.hue !== 0) parts.push(`hue=h=${f.hue}`);
    // Temperature & tint via colorbalance
    if (f.temperature !== 0 || f.tint !== 0) {
      const r = f.temperature / 200;   // -0.5..0.5
      const g = f.tint / 200;
      const bl = -r;
      parts.push(`colorbalance=rm=${r.toFixed(2)}:gm=${g.toFixed(2)}:bm=${bl.toFixed(2)}`);
    }
    return parts.join(',');
  }

  async function encodeColored() {
    if (!state.color.ffmpegReady) await loadFFmpeg();
    if (!state.color.videoFile) {
      window.App?.toast('영상을 먼저 업로드하세요');
      return;
    }
    state.color.encoding = true;
    state.color.encodeProgress = 0;
    state.color.outputUrl = '';
    render();

    const ffmpeg = window._ffmpeg;
    try {
      // input is already written as in.mp4 from extractFrames
      const vf = buildFFmpegFilter();
      await ffmpeg.exec([
        '-i', 'in.mp4',
        '-vf', vf,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-r', String(state.color.fps),
        '-c:a', 'copy',
        '-y',
        'out.mp4',
      ]);
      const data = await ffmpeg.readFile('out.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      state.color.outputBlob = blob;
      state.color.outputUrl = URL.createObjectURL(blob);
      window.App?.toast('영상 컬러 처리 완료');
    } catch (err) {
      window.App?.toast('인코딩 실패: ' + err.message);
    } finally {
      state.color.encoding = false;
      render();
    }
  }

  function downloadOutput() {
    if (!state.color.outputBlob) return;
    const a = document.createElement('a');
    a.href = state.color.outputUrl;
    a.download = 'color-graded-' + Date.now() + '.mp4';
    a.click();
  }

  function resetFilters() {
    state.color.filters = {
      brightness: 100, contrast: 100, saturation: 100,
      temperature: 0, tint: 0, hue: 0,
    };
    render();
  }

  function updateFilter(name, value) {
    state.color.filters[name] = Number(value);
    // Live preview update only — no re-render for performance
    const previewImg = host?.querySelector('#cc-preview-img');
    const previewVid = host?.querySelector('#cc-preview-video');
    const filterStr = buildCssFilter();
    if (previewImg) previewImg.style.filter = filterStr;
    if (previewVid) previewVid.style.filter = filterStr;
    const valueEl = host?.querySelector('[data-filter-val="' + name + '"]');
    if (valueEl) valueEl.textContent = value;
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function renderChecklistView() {
    const comp = getComposite();
    return `
      <div class="cc-checklist">
        <div class="cc-list-head">
          <h3>컷별 합성 진행</h3>
          <button class="btn btn--primary btn--sm" id="cc-add-shot">+ 컷 추가</button>
        </div>
        ${comp.shots.length === 0 ? `
          <div class="cc-empty">
            <p>합성 체크리스트가 비어있어요.</p>
            <p>편집 락(Picture Lock)된 컷마다 합성 단계를 체크해서 진행 상황을 추적합니다.</p>
          </div>` : comp.shots.map((s, i) => {
          const done = shotCompleteCount(s);
          const pct = Math.round((done / COMP_STEPS.length) * 100);
          return `
            <div class="cc-shot-card">
              <div class="cc-shot-head">
                <span class="cc-shot-num">#${i + 1}</span>
                <input class="input cc-shot-title" data-shot-field="title" data-shot-id="${s.id}" value="${esc(s.title)}" placeholder="컷 제목">
                <span class="cc-shot-progress">${done} / ${COMP_STEPS.length}</span>
                <div class="cc-shot-bar"><div class="cc-shot-bar-fill" style="width:${pct}%"></div></div>
                <button class="btn btn--sm btn--ghost" data-shot-remove="${s.id}" title="삭제">×</button>
              </div>
              <input class="input cc-shot-desc" data-shot-field="description" data-shot-id="${s.id}" value="${esc(s.description)}" placeholder="컷 간단 설명 (예: 옥상 배경을 야간 도쿄로 교체)">
              <div class="cc-steps">
                ${COMP_STEPS.map((st) => `
                  <label class="cc-step ${s.progress?.[st.key] ? 'is-done' : ''}">
                    <input type="checkbox" data-shot-step="${s.id}" data-step-key="${st.key}" ${s.progress?.[st.key] ? 'checked' : ''}>
                    <span class="cc-step-label">${esc(st.label)}</span>
                    <span class="cc-step-desc">${esc(st.desc)}</span>
                  </label>`).join('')}
              </div>
              <textarea class="input cc-shot-notes" data-shot-field="notes" data-shot-id="${s.id}" rows="2" placeholder="합성 메모">${esc(s.notes || '')}</textarea>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderColorView() {
    const c = state.color;
    return `
      <div class="cc-color">
        <div class="cc-color-head">
          <h3>프레임별 컬러 워크플로우</h3>
          <p class="cc-hint">영상 업로드 → 프레임 추출 → 컬러 조정 (전체 프레임 일관 적용) → mp4 재인코딩 다운로드.<br>
          무거운 작업이라 첫 사용 시 FFmpeg.wasm (~30MB) 다운로드가 필요합니다.</p>
        </div>

        ${!c.ffmpegReady && !c.ffmpegLoading ? `
          <button class="btn btn--primary" id="cc-load-ffmpeg">📦 FFmpeg 엔진 로드 시작</button>` : ''}
        ${c.ffmpegLoading ? `<div class="cc-loading">FFmpeg 다운로드 중…</div>` : ''}

        ${c.ffmpegReady ? `
          <div class="cc-color-grid">
            <div class="cc-color-left">
              <label class="cc-drop ${c.videoFile ? 'has-file' : ''}" id="cc-drop">
                <input type="file" accept="video/*" id="cc-video-file" hidden>
                ${c.videoFile
                  ? `<div class="cc-drop-info">${esc(c.videoFile.name)} (${(c.videoFile.size / 1024 / 1024).toFixed(1)} MB)<br><span>다른 영상 선택</span></div>`
                  : `<div class="cc-drop-info"><strong>+ 영상 업로드</strong><br><span>드래그 또는 클릭 (mp4 / mov / webm)</span></div>`}
              </label>

              ${c.extracting || c.encoding ? `
                <div class="cc-progress">
                  <div class="cc-progress-bar"><div class="cc-progress-fill" id="cc-progress-bar" style="width:${c.extracting ? c.extractProgress : c.encodeProgress}%"></div></div>
                  <div class="cc-progress-label" id="cc-progress-label">${c.extracting ? '추출' : '인코딩'} 중: ${c.extracting ? c.extractProgress : c.encodeProgress}%</div>
                </div>` : ''}

              ${c.videoUrl && c.frames.length > 0 ? `
                <div class="cc-preview">
                  <div class="cc-preview-label">원본 (필터 라이브 미리보기)</div>
                  <video src="${c.videoUrl}" id="cc-preview-video" controls muted style="filter:${buildCssFilter()}"></video>
                </div>
                <div class="cc-frame-grid">
                  ${c.frames.map((src) => `<img src="${src}" class="cc-frame" style="filter:${buildCssFilter()}">`).join('')}
                </div>` : ''}

              ${c.outputUrl ? `
                <div class="cc-preview">
                  <div class="cc-preview-label">컬러 처리 결과</div>
                  <video src="${c.outputUrl}" controls></video>
                  <button class="btn btn--primary" id="cc-download">⬇ mp4 다운로드</button>
                </div>` : ''}
            </div>

            <div class="cc-color-right">
              <h4 class="cc-controls-title">컬러 컨트롤</h4>
              ${renderSlider('brightness', '밝기', 0, 200, c.filters.brightness, '%')}
              ${renderSlider('contrast', '대비', 0, 200, c.filters.contrast, '%')}
              ${renderSlider('saturation', '채도', 0, 200, c.filters.saturation, '%')}
              ${renderSlider('temperature', '색온도', -100, 100, c.filters.temperature, ' (− 차갑 / + 따뜻)')}
              ${renderSlider('tint', '틴트', -100, 100, c.filters.tint, ' (− 마젠타 / + 그린)')}
              ${renderSlider('hue', '색조 회전', -180, 180, c.filters.hue, '°')}

              <div class="cc-controls-actions">
                <button class="btn btn--sm" id="cc-reset-filters">↺ 초기화</button>
                <button class="btn btn--primary" id="cc-encode" ${!c.videoFile || c.encoding ? 'disabled' : ''}>
                  ${c.encoding ? '인코딩 중…' : '🎞 전체 프레임 적용 + 다운로드 준비'}
                </button>
              </div>

              <div class="cc-preset-row">
                <button class="btn btn--sm" data-preset="teal-orange">티얼-오렌지</button>
                <button class="btn btn--sm" data-preset="bleach">블리치 바이패스</button>
                <button class="btn btn--sm" data-preset="warm">웜 시네마</button>
                <button class="btn btn--sm" data-preset="cool">쿨 누아르</button>
              </div>
            </div>
          </div>` : ''}
      </div>`;
  }

  function renderSlider(name, label, min, max, val, suffix) {
    return `
      <div class="cc-slider-row">
        <div class="cc-slider-label">
          <span>${esc(label)}</span>
          <span class="cc-slider-val"><span data-filter-val="${name}">${val}</span>${esc(suffix)}</span>
        </div>
        <input type="range" min="${min}" max="${max}" value="${val}" data-filter="${name}" class="cc-slider">
      </div>`;
  }

  function applyPreset(name) {
    const presets = {
      'teal-orange': { brightness: 100, contrast: 115, saturation: 120, temperature: 25, tint: -10, hue: 0 },
      'bleach':      { brightness: 105, contrast: 140, saturation: 40, temperature: 5, tint: 0, hue: 0 },
      'warm':        { brightness: 105, contrast: 105, saturation: 105, temperature: 40, tint: -5, hue: 0 },
      'cool':        { brightness: 95,  contrast: 120, saturation: 80,  temperature: -30, tint: 5, hue: 0 },
    };
    if (presets[name]) {
      state.color.filters = { ...presets[name] };
      render();
    }
  }

  function render() {
    if (!host) return;
    if (!state.projectId) {
      host.innerHTML = `
        <div class="tab-pad"><div class="tab-max">
          <div class="empty">
            <div class="empty-icon">④</div>
            <h3>프로젝트를 먼저 만들어 주세요</h3>
            <button class="btn btn--primary" id="cc-new-project">+ 새 프로젝트</button>
          </div>
        </div></div>`;
      host.querySelector('#cc-new-project')?.addEventListener('click', () => window.App?.openNewProjectModal?.());
      return;
    }

    host.innerHTML = `
      <div class="tab-pad"><div class="tab-max">
        <div class="cc-head">
          <div>
            <div class="eyebrow eyebrow--amber">④ Composite</div>
            <h2 class="title">합성 작업</h2>
            <p class="subtitle">컷별 합성 체크리스트 + 프레임별 컬러 워크플로우. 둘 다 한 자리에서.</p>
          </div>
          <div class="cc-view-tabs">
            <button class="cc-view-tab ${state.activeView === 'checklist' ? 'is-active' : ''}" data-view="checklist">합성 체크리스트</button>
            <button class="cc-view-tab ${state.activeView === 'color' ? 'is-active' : ''}" data-view="color">프레임 컬러</button>
          </div>
        </div>

        ${state.activeView === 'checklist' ? renderChecklistView() : renderColorView()}
      </div></div>`;

    wireEvents();
  }

  function wireEvents() {
    if (!host) return;

    host.querySelectorAll('[data-view]').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeView = b.getAttribute('data-view');
        render();
      });
    });

    if (state.activeView === 'checklist') {
      host.querySelector('#cc-add-shot')?.addEventListener('click', addShot);
      host.querySelectorAll('[data-shot-remove]').forEach((b) => {
        b.addEventListener('click', () => removeShot(b.getAttribute('data-shot-remove')));
      });
      host.querySelectorAll('[data-shot-field]').forEach((el) => {
        el.addEventListener('input', () => {
          updateShot(el.getAttribute('data-shot-id'), el.getAttribute('data-shot-field'), el.value);
        });
      });
      host.querySelectorAll('[data-shot-step]').forEach((cb) => {
        cb.addEventListener('change', () => toggleStep(cb.getAttribute('data-shot-step'), cb.getAttribute('data-step-key')));
      });
    } else {
      // Color view
      host.querySelector('#cc-load-ffmpeg')?.addEventListener('click', loadFFmpeg);

      const drop = host.querySelector('#cc-drop');
      const fileInput = host.querySelector('#cc-video-file');
      if (drop && fileInput) {
        drop.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') fileInput.click();
        });
        fileInput.addEventListener('change', async (e) => {
          if (e.target.files[0]) await extractFrames(e.target.files[0]);
          e.target.value = '';
        });
        ['dragenter', 'dragover'].forEach((ev) => {
          drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); });
        });
        ['dragleave', 'drop'].forEach((ev) => {
          drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); });
        });
        drop.addEventListener('drop', async (e) => {
          if (e.dataTransfer.files[0]) await extractFrames(e.dataTransfer.files[0]);
        });
      }

      host.querySelectorAll('[data-filter]').forEach((sl) => {
        sl.addEventListener('input', (e) => updateFilter(sl.getAttribute('data-filter'), e.target.value));
      });

      host.querySelectorAll('[data-preset]').forEach((b) => {
        b.addEventListener('click', () => applyPreset(b.getAttribute('data-preset')));
      });

      host.querySelector('#cc-reset-filters')?.addEventListener('click', resetFilters);
      host.querySelector('#cc-encode')?.addEventListener('click', encodeColored);
      host.querySelector('#cc-download')?.addEventListener('click', downloadOutput);
    }
  }

  async function open(projectId) {
    clearTimeout(saveTimer);
    saveTimer = null;
    state.projectId = projectId || null;
    state.project = projectId ? await window.VFXDB.get('projects', projectId) : null;
    state.activeView = 'checklist';
  }

  function setHost(el) { host = el; render(); }

  window.Composite = { render: setHost, open };
})();
