/* ───────────────────────────────────────────────────────────────
   js/tab-travel.js
   Travel Video tab — analyze a reference URL, upload photos,
   auto-generate a stylized travel memory video via Canvas + MediaRecorder.
   Public: window.Travel = { render(host) }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;

  let st = {
    refUrl:       '',
    analyzing:    false,
    style:        null,   // { brightness, contrast, saturation, hue, warmth, filterName, mood, textColor, textFont }
    platformHint: '',

    mediaFiles:   [],     // [{ id, file, objectUrl, img }]

    title:        '',
    subtitle:     '',
    titlePos:     'bottom',  // 'top' | 'center' | 'bottom'

    photoTime:    4,     // seconds per photo
    transitionSec: 0.8, // cross-fade duration (seconds)

    rendering:       false,
    renderProgress:  0,
    outputUrl:       null,
  };

  const CW = 1280;
  const CH = 720;

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ─── Render ───────────────────────────────────────────────── */
  function render() {
    if (!host) return;
    host.innerHTML = html();
    bind();
  }

  function html() {
    const photoCount = st.mediaFiles.length;
    const totalSec   = photoCount * st.photoTime + Math.max(0, photoCount - 1) * st.transitionSec;
    const canGen     = !st.rendering && photoCount > 0;

    return `
<div class="tab-pad"><div class="tab-max tv-wrap">

  <div class="tv-header">
    <div class="eyebrow eyebrow--accent">Travel Video</div>
    <h2 class="title">여행 영상 자동 생성</h2>
    <p class="subtitle">레퍼런스 URL을 넣으면 그 색감·필터로 내 사진을 자동으로 영상으로 만들어줘요.</p>
  </div>

  <!-- ① URL -->
  <div class="tv-step ${st.style ? 'is-done' : ''}">
    <div class="tv-step-num">1</div>
    <div class="tv-step-body">
      <div class="tv-step-title">레퍼런스 영상 URL <span class="tv-optional">선택</span></div>
      <p class="tv-step-desc">좋아하는 여행 YouTube 영상 URL → 색감·필터를 자동 분석합니다. 없으면 기본 필름 톤으로 생성.</p>
      <div class="tv-url-row">
        <input class="input tv-url-input" id="tv-url" type="url"
               placeholder="https://www.youtube.com/watch?v=..."
               value="${esc(st.refUrl)}">
        <button class="btn tv-analyze-btn" id="tv-analyze"
                ${st.analyzing || !st.refUrl.trim() ? 'disabled' : ''}>
          ${st.analyzing ? '분석 중…' : '분석'}
        </button>
      </div>
      ${st.style ? styleCard() : ''}
    </div>
  </div>

  <!-- ② 사진 -->
  <div class="tv-step ${photoCount > 0 ? 'is-done' : ''}">
    <div class="tv-step-num">2</div>
    <div class="tv-step-body">
      <div class="tv-step-title">내 여행 사진 올리기</div>
      <p class="tv-step-desc">여러 장을 한 번에 올릴 수 있어요. 순서가 곧 영상 순서입니다.</p>
      <div class="tv-dropzone" id="tv-dropzone">
        <div class="tv-drop-icon">📷</div>
        <div class="tv-drop-text">클릭하거나 사진을 드래그하세요</div>
        <div class="tv-drop-sub">JPG · PNG · WEBP · 여러 장 동시 선택 가능</div>
        <input type="file" id="tv-file-input" accept="image/*" multiple style="display:none">
      </div>
      ${photoCount > 0 ? mediaGrid(photoCount, totalSec) : ''}
    </div>
  </div>

  <!-- ③ 텍스트 -->
  <div class="tv-step">
    <div class="tv-step-num">3</div>
    <div class="tv-step-body">
      <div class="tv-step-title">타이틀 글씨 <span class="tv-optional">선택</span></div>
      <p class="tv-step-desc">영상에 들어갈 메인 제목과 부제목. 비워두면 글씨 없이 생성.</p>
      <div class="tv-text-fields">
        <input class="input" id="tv-title"
               placeholder="메인 제목  예) 도쿄 3일 / Tokyo Spring"
               value="${esc(st.title)}">
        <input class="input" id="tv-subtitle"
               placeholder="부제목  예) 2025. 04  ·  벚꽃 여행"
               value="${esc(st.subtitle)}">
      </div>
      <div class="tv-row-opts">
        <span class="tv-opt-label">텍스트 위치</span>
        <div class="tv-chips">
          ${['top','center','bottom'].map((p) => `
            <button class="g-builder-chip ${st.titlePos === p ? 'is-active' : ''}" data-pos="${p}">
              ${{ top:'상단', center:'중앙', bottom:'하단' }[p]}
            </button>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- ④ 설정 -->
  <div class="tv-step">
    <div class="tv-step-num">4</div>
    <div class="tv-step-body">
      <div class="tv-step-title">영상 설정</div>
      <div class="tv-row-opts">
        <span class="tv-opt-label">사진당 시간</span>
        <div class="tv-chips">
          ${[3,4,5].map((t) => `
            <button class="g-builder-chip ${st.photoTime === t ? 'is-active' : ''}" data-ptime="${t}">
              ${t}초
            </button>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Generate -->
  <div class="tv-action">
    <button class="btn btn--accent tv-gen-btn" id="tv-generate" ${canGen ? '' : 'disabled'}>
      ${st.rendering ? '생성 중…' : '▶  자동 영상 생성'}
    </button>
    ${photoCount === 0 ? '<span class="tv-action-hint">사진을 먼저 올려주세요</span>' : ''}
    ${st.rendering ? `
      <div class="tv-progress-wrap">
        <div class="tv-progress-track"><div class="tv-progress-fill" id="tv-pfill" style="width:${st.renderProgress}%"></div></div>
        <span class="tv-progress-pct" id="tv-ppct">${st.renderProgress}%</span>
      </div>
      <p class="tv-progress-note">실시간으로 영상을 만드는 중이에요 — 잠깐만요</p>` : ''}
  </div>

  ${outputPanel()}

  <!-- off-screen rendering canvas -->
  <canvas id="tv-canvas" width="${CW}" height="${CH}" style="display:none"></canvas>
</div></div>`;
  }

  function styleCard() {
    const s = st.style;
    return `
      <div class="tv-style-card">
        <div class="tv-style-top">
          <span class="tv-filter-name">${esc(s.filterName)}</span>
          <span class="tv-filter-mood">${esc(s.mood)}</span>
        </div>
        <div class="tv-style-bars">
          ${bar('밝기', s.brightness, 80, 130)}
          ${bar('대비', s.contrast,   80, 120)}
          ${bar('채도', s.saturation, 60, 120)}
          ${bar('색온도', s.warmth + 40, 0, 80, s.warmth < -5 ? '차가운' : s.warmth > 5 ? '따뜻한' : '중성')}
        </div>
        <div class="tv-grade-tag">${esc(s.colorGrade)}</div>
      </div>`;
  }

  function bar(label, val, min, max, override) {
    const pct = Math.max(0, Math.min(100, Math.round(((val - min) / (max - min)) * 100)));
    return `
      <div class="tv-bar-row">
        <span class="tv-bar-label">${esc(label)}</span>
        <div class="tv-bar-track"><div class="tv-bar-fill" style="width:${pct}%"></div></div>
        <span class="tv-bar-val">${override || val}</span>
      </div>`;
  }

  function mediaGrid(count, totalSec) {
    const secLabel = totalSec < 60 ? `${Math.round(totalSec)}초` : `${Math.floor(totalSec / 60)}분 ${Math.round(totalSec % 60)}초`;
    return `
      <div class="tv-media-grid" id="tv-media-grid">
        ${st.mediaFiles.map((m, i) => `
          <div class="tv-media-item">
            <img src="${esc(m.objectUrl)}" alt="">
            <div class="tv-media-badge">${i + 1}</div>
            <button class="tv-media-remove" data-remove="${i}" title="삭제">×</button>
            <div class="tv-media-reorder">
              ${i > 0 ? `<button class="tv-media-mv" data-mv-l="${i}" title="앞으로">◀</button>` : ''}
              ${i < count - 1 ? `<button class="tv-media-mv" data-mv-r="${i}" title="뒤로">▶</button>` : ''}
            </div>
          </div>`).join('')}
        <button class="tv-media-add" id="tv-media-more">+ 더 추가</button>
      </div>
      <p class="tv-media-meta">${count}장 · 예상 영상 길이 ${secLabel}</p>`;
  }

  function outputPanel() {
    if (!st.outputUrl) return '';
    return `
      <div class="tv-output">
        <div class="tv-output-label">✓ 영상 생성 완료</div>
        <video class="tv-output-video" src="${esc(st.outputUrl)}" controls autoplay loop muted playsinline></video>
        <div class="tv-output-actions">
          <a class="btn btn--accent" href="${esc(st.outputUrl)}" download="travel.webm">⬇ 다운로드 (.webm)</a>
          <button class="btn" id="tv-reset">다시 만들기</button>
        </div>
        <p class="tv-output-note">WebM으로 저장돼요. MP4로 변환하려면 Cloudconvert나 HandBrake를 사용하세요.</p>
      </div>`;
  }

  /* ─── Event binding ────────────────────────────────────────── */
  function bind() {
    /* URL input */
    const urlInp = q('#tv-url');
    if (urlInp) {
      urlInp.addEventListener('input', (e) => {
        st.refUrl = e.target.value;
        const btn = q('#tv-analyze');
        if (btn) btn.disabled = !st.refUrl.trim() || st.analyzing;
      });
      urlInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') q('#tv-analyze')?.click();
      });
    }
    q('#tv-analyze')?.addEventListener('click', analyzeUrl);

    /* Dropzone */
    const dz   = q('#tv-dropzone');
    const finp = q('#tv-file-input');
    if (dz && finp) {
      dz.addEventListener('click', () => finp.click());
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('is-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('is-over'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('is-over');
        addFiles(e.dataTransfer.files);
      });
      finp.addEventListener('change', (e) => addFiles(e.target.files));
    }

    /* Add more */
    q('#tv-media-more')?.addEventListener('click', () => {
      const inp = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', multiple: true });
      inp.addEventListener('change', (e) => addFiles(e.target.files));
      inp.click();
    });

    /* Remove / reorder */
    qAll('[data-remove]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = +b.getAttribute('data-remove');
      URL.revokeObjectURL(st.mediaFiles[i]?.objectUrl);
      st.mediaFiles.splice(i, 1);
      render();
    }));
    qAll('[data-mv-l]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = +b.getAttribute('data-mv-l');
      [st.mediaFiles[i - 1], st.mediaFiles[i]] = [st.mediaFiles[i], st.mediaFiles[i - 1]];
      render();
    }));
    qAll('[data-mv-r]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = +b.getAttribute('data-mv-r');
      [st.mediaFiles[i + 1], st.mediaFiles[i]] = [st.mediaFiles[i], st.mediaFiles[i + 1]];
      render();
    }));

    /* Text */
    q('#tv-title')?.addEventListener('input',    (e) => { st.title    = e.target.value; });
    q('#tv-subtitle')?.addEventListener('input', (e) => { st.subtitle = e.target.value; });

    /* Position chips */
    qAll('[data-pos]').forEach((b) => b.addEventListener('click', () => {
      st.titlePos = b.getAttribute('data-pos');
      render();
    }));

    /* Photo time chips */
    qAll('[data-ptime]').forEach((b) => b.addEventListener('click', () => {
      st.photoTime = +b.getAttribute('data-ptime');
      render();
    }));

    /* Generate */
    q('#tv-generate')?.addEventListener('click', generate);

    /* Reset */
    q('#tv-reset')?.addEventListener('click', () => {
      if (st.outputUrl) URL.revokeObjectURL(st.outputUrl);
      st.outputUrl = null;
      render();
    });
  }

  function q(sel)    { return host?.querySelector(sel); }
  function qAll(sel) { return host?.querySelectorAll(sel) || []; }

  /* ─── URL analysis ─────────────────────────────────────────── */
  async function analyzeUrl() {
    if (!st.refUrl.trim() || st.analyzing) return;
    st.analyzing = true;
    render();
    try {
      const res  = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: st.refUrl.trim() }),
      });
      const data = await res.json();
      st.style        = data.style || defaultStyle();
      st.platformHint = data.platformHint || '';
      window.App?.toast(`스타일 분석 완료 · ${st.style.filterName}`);
    } catch {
      st.style = defaultStyle();
      window.App?.toast('API 오류 — 기본 필름 톤으로 진행합니다');
    } finally {
      st.analyzing = false;
      render();
    }
  }

  function defaultStyle() {
    return {
      brightness: 105, contrast: 92, saturation: 82,
      hue: 0, warmth: 12,
      filterName: 'Warm Memory', mood: '따뜻하고 필름 감성',
      colorGrade: 'warm desaturated film',
      textColor: '#ffffff', textFont: 'serif',
    };
  }

  /* ─── File handling ────────────────────────────────────────── */
  async function addFiles(files) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    for (const file of imgs) {
      const objectUrl = URL.createObjectURL(file);
      const img = await loadImg(objectUrl);
      st.mediaFiles.push({ id: Math.random().toString(36).slice(2), file, objectUrl, img });
    }
    render();
  }

  function loadImg(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload  = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  }

  /* ─── Video generation ─────────────────────────────────────── */
  async function generate() {
    if (st.rendering || st.mediaFiles.length === 0) return;

    const style  = st.style || defaultStyle();
    const photos = st.mediaFiles.map((m) => m.img);
    const ptMs   = st.photoTime * 1000;
    const trMs   = st.transitionSec * 1000;
    const totalMs = photos.length * ptMs + Math.max(0, photos.length - 1) * trMs;

    st.rendering      = true;
    st.renderProgress = 0;
    if (st.outputUrl) { URL.revokeObjectURL(st.outputUrl); st.outputUrl = null; }
    render();

    const canvas = q('#tv-canvas');
    const ctx    = canvas.getContext('2d');

    /* MediaRecorder */
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const stream   = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
    const chunks   = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const finished = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        st.outputUrl = URL.createObjectURL(blob);
        resolve();
      };
    });

    recorder.start(200);
    const t0 = performance.now();

    function loop() {
      const elapsed = performance.now() - t0;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));

      // Live-update progress bar without full re-render
      const fill  = q('#tv-pfill');
      const label = q('#tv-ppct');
      if (fill)  fill.style.width   = pct + '%';
      if (label) label.textContent  = pct + '%';
      st.renderProgress = pct;

      if (elapsed >= totalMs) {
        drawFrame(ctx, photos, style, totalMs - 1, ptMs, trMs);
        recorder.stop();
        return;
      }

      drawFrame(ctx, photos, style, elapsed, ptMs, trMs);
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
    await finished;

    st.rendering      = false;
    st.renderProgress = 100;
    render();
    window.App?.toast('영상 생성 완료!');
  }

  /* ─── Canvas drawing ───────────────────────────────────────── */
  function drawFrame(ctx, photos, style, elapsed, ptMs, trMs) {
    ctx.clearRect(0, 0, CW, CH);

    // Determine which photo(s) to show
    let curIdx = 0;
    let nxtIdx = -1;
    let alpha   = 1;  // 0→1 = crossfade from cur → nxt

    let remaining = elapsed;
    for (let i = 0; i < photos.length; i++) {
      if (remaining < ptMs) {
        curIdx = i; break;
      }
      remaining -= ptMs;
      if (i < photos.length - 1) {
        if (remaining < trMs) {
          curIdx = i;
          nxtIdx = i + 1;
          alpha  = remaining / trMs;
          break;
        }
        remaining -= trMs;
      }
      curIdx = i; // last photo fallback
    }

    // Draw current photo
    drawPhoto(ctx, photos[curIdx], style, 1);

    // Cross-fade next photo
    if (nxtIdx >= 0) {
      drawPhoto(ctx, photos[nxtIdx], style, alpha);
    }

    // Text overlay
    if (st.title || st.subtitle) drawText(ctx, style);
  }

  function drawPhoto(ctx, img, style, alpha) {
    // Cover-fit
    const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = (CW - w) / 2;
    const y = (CH - h) / 2;

    // CSS filter (brightness / contrast / saturate / hue-rotate + sepia for warmth)
    const b   = style.brightness ?? 100;
    const c   = style.contrast   ?? 100;
    const s   = style.saturation ?? 100;
    const hue = style.hue        ?? 0;
    const wrm = style.warmth     ?? 0;
    const sep = wrm > 0 ? Math.min(Math.round(wrm * 1.5), 35) : 0;
    const hShift = wrm < 0 ? Math.round(wrm * 0.4) : 0;  // slight cool hue shift

    ctx.filter     = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${hue + hShift}deg) sepia(${sep}%)`;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, w, h);
    ctx.filter      = 'none';
    ctx.globalAlpha = 1;
  }

  function drawText(ctx, style) {
    const isSerif   = style.textFont !== 'sans-serif';
    const textColor = style.textColor || '#ffffff';
    const fontFam   = isSerif ? 'Georgia, "Times New Roman", serif' : '"Inter", system-ui, sans-serif';

    const TITLE_SZ = 70;
    const SUB_SZ   = 34;
    const PAD      = 64;
    const GAP      = 18;

    let yT, yS;
    if (st.titlePos === 'top') {
      yT = PAD + TITLE_SZ;
      yS = yT + GAP + SUB_SZ;
    } else if (st.titlePos === 'center') {
      const totalH = TITLE_SZ + (st.subtitle ? GAP + SUB_SZ : 0);
      yT = (CH - totalH) / 2 + TITLE_SZ;
      yS = yT + GAP + SUB_SZ;
    } else {
      yS = CH - PAD;
      yT = yS - (st.subtitle ? GAP + SUB_SZ : 0) - GAP;
      if (!st.subtitle) yT = yS;
    }

    // Gradient scrim
    const scrimH  = TITLE_SZ + (st.subtitle ? SUB_SZ + GAP : 0) + PAD * 2;
    const scrimY  = st.titlePos === 'top' ? 0 : CH - scrimH;
    const grad    = ctx.createLinearGradient(0, scrimY, 0, scrimY + scrimH);
    const clr0    = st.titlePos === 'top' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)';
    const clr1    = st.titlePos === 'top' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.55)';
    grad.addColorStop(0, clr0);
    grad.addColorStop(1, clr1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle   = grad;
    ctx.fillRect(0, scrimY, CW, scrimH);

    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';

    if (st.title) {
      ctx.font        = `${isSerif ? 'italic' : 'bold'} ${TITLE_SZ}px ${fontFam}`;
      ctx.fillStyle   = textColor;
      ctx.shadowBlur  = 14;
      ctx.fillText(st.title, CW / 2, yT);
    }
    if (st.subtitle) {
      ctx.font        = `300 ${SUB_SZ}px ${fontFam}`;
      ctx.fillStyle   = textColor;
      ctx.shadowBlur  = 8;
      ctx.fillText(st.subtitle, CW / 2, yS);
    }

    ctx.shadowBlur = 0;
  }

  /* ─── Public ───────────────────────────────────────────────── */
  function setHost(el) { host = el; render(); }
  window.Travel = { render: setHost };
})();
