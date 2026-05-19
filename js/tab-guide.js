/* ───────────────────────────────────────────────────────────────
   js/tab-guide.js
   Guide tab with sidebar navigation.
   Sections: Workflow / AI Tools / Glossary / Tips / Runway Skills / Runway Situations
   Public: window.Guide = { render }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let currentSection = 'workflow';

  // Video Builder state
  // actionSeq: 순서가 있는 행동 시퀀스. 각 항목 { en, ko }.
  //   - 칩 클릭: { en: chipEn, ko: chipKo } 로 push
  //   - 자유 입력: 한글 → 자동 번역 후 push, 영어면 그대로 push
  let builder = {
    shot: '', subjectKo: '', subjectEn: '',
    actionSeq: [], actionInput: '', actionInputTranslating: false,
    env: '', camera: '', lighting: '', look: '',
    ratio: '', duration: '10 seconds', translating: false,
  };
  let translateTimer = null;
  let actionInputTimer = null;
  let actionInputPending = '';

  // Image Builder state
  let img = {
    medium: '', subjectKo: '', subjectEn: '', pose: '',
    bg: '', composition: '', lighting: '', color: '', look: '',
    ratio: '--ar 1:1', translating: false,
  };
  let imgTranslateTimer = null;

  const SECTIONS = [
    { id: 'builder',             label: '✦ Video Builder',  group: 'GUIDE' },
    { id: 'image-builder',       label: '✦ Image Builder',  group: 'GUIDE' },
    { id: 'workflow',            label: 'Workflow',         group: 'GUIDE' },
    { id: 'tools',               label: 'AI Tools',         group: 'GUIDE' },
    { id: 'glossary',            label: 'Glossary',         group: 'GUIDE' },
    { id: 'tips',                label: 'Tips',             group: 'GUIDE' },
    { id: 'runway-beginner',     label: 'Beginner',         group: 'RUNWAY SKILLS' },
    { id: 'runway-intermediate', label: 'Intermediate',     group: 'RUNWAY SKILLS' },
    { id: 'runway-advanced',     label: 'Advanced',         group: 'RUNWAY SKILLS' },
    { id: 'runway-asset',        label: '영상 에셋 제작',   group: 'RUNWAY SITUATIONS' },
    { id: 'runway-longform',     label: '긴 영상 제작',     group: 'RUNWAY SITUATIONS' },
    { id: 'runway-story',        label: '스토리 영상 제작', group: 'RUNWAY SITUATIONS' },
  ];

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function stars(n) {
    return '★'.repeat(n) + '<span class="g-star-off">' + '★'.repeat(5 - n) + '</span>';
  }

  // ── Korean detection + auto-translate ────────────────────────
  function hasKorean(t) {
    return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(t);
  }

  async function doTranslate(text) {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text }],
          systemPrompt: 'Translate the Korean noun phrase to concise cinematic English. Output ONLY the English translation, 2-8 words, lowercase, no quotes, no explanation.',
        }),
      });
      const data = await r.json().catch(() => ({}));
      builder.subjectEn = (data.text || text).trim().replace(/\.$/, '');
    } catch {
      builder.subjectEn = text;
    }
    builder.translating = false;
    updatePromptResult();
    const hint = host?.querySelector('#builder-subject-hint');
    if (hint) hint.textContent = builder.subjectEn ? '→ ' + builder.subjectEn : '';
  }

  function scheduleTranslate(text) {
    clearTimeout(translateTimer);
    if (!text.trim()) {
      builder.subjectEn = '';
      builder.translating = false;
      updatePromptResult();
      return;
    }
    if (!hasKorean(text)) {
      builder.subjectEn = text;
      builder.translating = false;
      const hint = host?.querySelector('#builder-subject-hint');
      if (hint) hint.textContent = '';
      updatePromptResult();
      return;
    }
    builder.translating = true;
    updatePromptResult();
    translateTimer = setTimeout(() => doTranslate(text), 700);
  }

  function renderSidebar() {
    const groups = {};
    const groupOrder = [];
    SECTIONS.forEach((s) => {
      if (!groups[s.group]) { groups[s.group] = []; groupOrder.push(s.group); }
      groups[s.group].push(s);
    });
    return `
      <nav class="g-nav">
        ${groupOrder.map((g) => `
          <div class="g-nav-group">
            <div class="g-nav-group-label">${esc(g)}</div>
            ${groups[g].map((s) => `
              <button class="g-nav-item ${s.id === currentSection ? 'is-active' : ''}" data-section="${s.id}">${esc(s.label)}</button>
            `).join('')}
          </div>
        `).join('')}
      </nav>`;
  }

  function renderWorkflow() {
    return `
      <div class="eyebrow eyebrow--amber">Volume One</div>
      <h2 class="title">Workflow</h2>
      <p class="subtitle">생성 AI VFX 파이프라인의 표준 흐름입니다. 각 단계의 도구와 역할을 이해하면 작업이 빨라집니다.</p>
      <div class="g-section">
        <div class="g-flow">
          ${window.GUIDE_WORKFLOW.map((s) => `
            <div class="g-flow-card g-flow-card--${s.c}">
              <div class="g-flow-step">
                <span class="g-flow-num">${esc(s.i)}</span>
                <span class="g-flow-arrow">→</span>
              </div>
              <h3 class="g-flow-name">${esc(s.t)}</h3>
              <div class="g-flow-tools">${esc(s.d)}</div>
              <p class="g-flow-body">${esc(s.body)}</p>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function effCell(v) {
    if (v == null) return '<span class="g-eff-na" title="해당 상황 비대상">—</span>';
    return '<span class="g-stars">' + stars(v) + '</span>';
  }

  const SITUATION_COLS = [
    { key: 'asset',    label: 'Asset',    desc: '단위 VFX 에셋 · 루프 텍스처 · 폭발 · 파티클' },
    { key: 'story',    label: 'Story',    desc: '내러티브·캐릭터 · 다중 씬 · 인물 일관성' },
    { key: 'longform', label: 'Longform', desc: '1분+ 긴 영상 · 세그먼트 이어붙이기' },
    { key: 'still',    label: 'Still',    desc: '정지 이미지 · 키비주얼 · 무드보드' },
  ];

  function renderTools() {
    return `
      <div class="eyebrow eyebrow--amber">Volume Two</div>
      <h2 class="title">AI Tools</h2>
      <p class="subtitle">각 도구의 강점과 특성을 비교합니다. 씬에 맞는 도구를 고르는 것만으로도 결과가 달라집니다.</p>
      <div class="g-section">
        <div class="g-tools g-tools--main">
          <div class="g-tools-row g-tools-head">
            <span>Tool</span><span>Best for</span><span>Length</span><span>Realism</span><span>Control</span><span>Price</span>
          </div>
          ${window.GUIDE_TOOLS.map((t) => {
            const tool = window.TOOL_PRESETS[t.id];
            return `
            <div class="g-tools-row">
              <span class="g-tools-name">${esc(tool.name)}</span>
              <span class="g-tools-best">${esc(t.best)}</span>
              <span class="g-tools-dur">${esc(t.dur)}</span>
              <span class="g-stars">${stars(t.realism)}</span>
              <span class="g-stars">${stars(t.control)}</span>
              <span class="g-tools-price" title="${esc(t.priceNote || '')}">${esc(t.price || '—')}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="g-section">
        <div class="g-section-head">
          <h3 class="g-section-title">상황별 효율</h3>
        </div>
        <p class="g-rw-desc">같은 툴이라도 작업 유형에 따라 효율이 크게 달라집니다. 별점은 해당 상황에서의 결과 품질·생산성 종합 평가입니다. <span class="g-eff-na-inline">—</span> 는 해당 상황 비대상 (예: 이미지 전용 툴의 영상 작업).</p>
        <div class="g-eff">
          <div class="g-eff-row g-eff-head">
            <span>Tool</span>
            ${SITUATION_COLS.map((c) => `<span title="${esc(c.desc)}">${esc(c.label)}</span>`).join('')}
            <span>Price</span>
          </div>
          ${window.GUIDE_TOOLS.map((t) => {
            const tool = window.TOOL_PRESETS[t.id];
            const eff = t.efficiency || {};
            return `
            <div class="g-eff-row">
              <span class="g-tools-name">${esc(tool.name)}</span>
              ${SITUATION_COLS.map((c) => effCell(eff[c.key])).join('')}
              <span class="g-tools-price" title="${esc(t.priceNote || '')}">${esc(t.price || '—')}</span>
            </div>`;
          }).join('')}
        </div>
        <p class="g-eff-note">가격은 2026 기준 참고가 (월 구독 또는 크레딧 환산). 셀에 마우스를 올리면 세부 플랜이 보입니다.</p>
      </div>`;
  }

  function renderGlossary() {
    return `
      <div class="eyebrow eyebrow--amber">Volume Three</div>
      <h2 class="title">Korean → English Vocabulary</h2>
      <p class="subtitle">VFX 프롬프트에서 자주 쓰는 표현의 한영 대조표입니다. Studio에서 한국어로 말할 때 이 어휘를 참고하세요.</p>
      <div class="g-section">
        <div class="g-glossary-search">
          <input class="input" id="g-search" placeholder="🔎  '드론' 또는 'rim light' 검색">
        </div>
        <div class="g-glossary" id="g-glossary">
          ${window.GUIDE_GLOSSARY.map((g) => `
            <div class="g-glossary-group" data-group="${esc(g.group)}">
              <h4 class="g-glossary-group-title">${esc(g.group)}</h4>
              <div class="g-glossary-list">
                ${g.items.map(([en, ko]) => `
                  <div class="g-glossary-row" data-search="${esc((en + ' ' + ko).toLowerCase())}">
                    <span class="g-glossary-ko">${esc(ko)}</span>
                    <span class="g-glossary-arrow">→</span>
                    <span class="g-glossary-en">${esc(en)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderTips() {
    return `
      <div class="eyebrow eyebrow--amber">Volume Four</div>
      <h2 class="title">Prompting Tips</h2>
      <p class="subtitle">프롬프트 품질을 높이는 검증된 방법들입니다.</p>
      <div class="g-section">
        <div class="g-tips">
          ${(window.GUIDE_TIPS || []).map((tip) => `
            <div class="g-tip-card g-tip-card--${esc(tip.color)}">
              <div class="g-tip-icon">${esc(tip.icon)}</div>
              <div class="g-tip-content">
                <p class="g-tip-title">${esc(tip.title)}</p>
                <p class="g-tip-body">${esc(tip.body)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderRunwaySection(data) {
    if (!data) return '<p style="color:var(--muted)">데이터를 불러오지 못했습니다.</p>';
    return `
      <div class="eyebrow">Runway Guide</div>
      <h2 class="title">${esc(data.title)}</h2>
      <p class="subtitle">${esc(data.subtitle)}</p>
      ${data.sections.map((s) => `
        <div class="g-section">
          <div class="g-section-head">
            <h3 class="g-section-title">${esc(s.heading)}</h3>
          </div>
          ${s.body ? `<p class="g-rw-desc">${esc(s.body)}</p>` : ''}
          ${s.steps ? `
            <ol class="g-rw-steps">
              ${s.steps.map((step) => `<li class="g-rw-step">${esc(step)}</li>`).join('')}
            </ol>` : ''}
          ${s.items ? `
            <div class="g-rw-items">
              ${s.items.map(([title, desc]) => `
                <div class="g-rw-item">
                  <span class="g-rw-item-title">${esc(title)}</span>
                  <span class="g-rw-item-desc">${esc(desc)}</span>
                </div>`).join('')}
            </div>` : ''}
          ${s.examples ? `
            <div class="g-rw-examples">
              ${s.examples.map((ex) => `<div class="g-rw-example">${esc(ex)}</div>`).join('')}
            </div>` : ''}
        </div>
      `).join('')}`;
  }

  // ── Prompt Builder ────────────────────────────────────────────
  const BUILDER_OPTS = {
    shot: [
      ['Wide establishing shot', '와이드 설정샷'],
      ['Extreme wide shot', '극 와이드'],
      ['Medium shot', '미디엄'],
      ['Close-up', '클로즈업'],
      ['Extreme close-up', '극 클로즈업'],
      ['Macro', '매크로'],
      ['Over-the-shoulder', '어깨너머'],
      ['POV shot', '1인칭 시점'],
      ['Dutch angle', '더치 앵글'],
      ['High-angle drone shot', '고각 드론'],
      ['Low-angle worm\'s eye', '저각'],
      ['Two shot', '투샷'],
    ],
    action: [
      ['standing still', '정지 / 대기'],
      ['walking slowly', '천천히 걷는'],
      ['running', '달리는'],
      ['looking back over shoulder', '뒤돌아보는'],
      ['reaching out', '손을 뻗는'],
      ['falling', '쓰러지는'],
      ['turning around', '돌아서는'],
      ['crouching', '웅크리는'],
    ],
    env: [
      ['volumetric fog', '부피감 있는 안개'],
      ['rain-slick city reflections', '빗물 반사 도시'],
      ['haze and heat shimmer', '아지랑이 / 연무'],
      ['dust motes in sunlight', '빛 속 먼지'],
      ['smoke and steam vents', '연기 / 수증기'],
      ['aurora borealis sky', '오로라'],
      ['golden hour warm glow', '황금시간대'],
      ['blue hour twilight', '블루아워'],
      ['overcast diffused sky', '흐린 날'],
      ['heavy downpour rain', '폭우'],
      ['blizzard snowstorm', '눈보라'],
      ['dark stormclouds lightning', '먹구름 번개'],
    ],
    camera: [
      ['slow dolly-in', '전진 (달리인)'],
      ['dolly out', '후진'],
      ['crane up', '크레인 상승'],
      ['crane down', '크레인 하강'],
      ['orbit arc shot', '궤도 회전'],
      ['whip pan', '휙 패닝'],
      ['rack focus', '포커스 이동'],
      ['locked off static', '고정 샷'],
      ['parallax move', '시차 무브'],
      ['crash zoom', '급격한 줌'],
      ['handheld shaky', '핸드헬드'],
      ['drone descent', '드론 하강'],
    ],
    lighting: [
      ['golden hour rim light', '황금시간대 윤곽광'],
      ['blue hour backlight', '블루아워 역광'],
      ['hard directional key light', '강한 방향성 주광'],
      ['soft diffused wrap light', '부드러운 확산광'],
      ['practical neon glow', '네온 실광원'],
      ['volumetric god rays', '갓레이 빛줄기'],
      ['deep shadow underexposed', '깊은 그림자'],
      ['studio rim backlight', '스튜디오 윤곽광'],
      ['warm tungsten interior light', '텅스텐 실내광'],
      ['harsh overhead midday', '정오 수직광'],
    ],
    look: [
      ['35mm film grain', '35mm 필름 그레인'],
      ['teal-orange cinematic grade', '청-주황 시네마틱'],
      ['anamorphic lens flare', '아나모픽 플레어'],
      ['Kodak Portra warm tone', '코닥 포트라 톤'],
      ['bleach bypass desaturated', '블리치 바이패스'],
      ['halation glow on highlights', '하레이션'],
      ['high contrast noir', '고대비 누아르'],
      ['muted desaturated palette', '채도 낮은 무채색'],
      ['vintage Super 8mm', '슈퍼 8mm 빈티지'],
      ['hyper-real ultra-sharp HDR', '극사실 HDR'],
    ],
    ratio: [
      ['16:9 widescreen', '16:9 와이드'],
      ['9:16 vertical', '9:16 세로'],
      ['1:1 square format', '1:1 정방형'],
      ['2.39:1 anamorphic widescreen', '2.39:1 아나모픽'],
    ],
    duration: ['5 seconds', '10 seconds', '20 seconds'],
  };

  function assemblePrompt() {
    const parts = [];
    if (builder.camera) parts.push(builder.camera);
    if (builder.shot) parts.push(builder.shot);
    const subj = (builder.subjectEn || builder.subjectKo || '').trim();
    const actionStr = actionSeqString();
    if (subj) {
      parts.push('of ' + subj + (actionStr ? ' ' + actionStr : ''));
    } else if (actionStr) {
      parts.push(actionStr);
    }
    if (builder.env)      parts.push(builder.env);
    if (builder.lighting) parts.push(builder.lighting);
    if (builder.look)     parts.push(builder.look);
    if (builder.ratio)    parts.push(builder.ratio);
    if (builder.duration) parts.push(builder.duration);
    if (!parts.length) return '';
    return parts.join(', ') + '.';
  }

  function updatePromptResult() {
    if (!host) return;
    const result = host.querySelector('.g-builder-result');
    if (!result) return;
    if (builder.translating) {
      result.className = 'g-builder-result';
      result.innerHTML = '<div class="g-builder-placeholder">번역 중…</div>';
      return;
    }
    const prompt = assemblePrompt();
    result.className = 'g-builder-result' + (prompt ? ' is-filled' : '');
    result.innerHTML = prompt
      ? `<div class="g-builder-prompt">${esc(prompt)}</div>
         <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
      : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`;
    const copyBtn = result.querySelector('.g-builder-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(copyBtn.getAttribute('data-copy'))
          .then(() => window.App?.toast('복사됐어요'));
      });
    }
  }

  function chipRow(field, opts) {
    return opts.map(([en, ko]) => `
      <button class="g-builder-chip ${builder[field] === en ? 'is-active' : ''}"
              data-field="${esc(field)}" data-val="${esc(en)}" data-ko="${esc(ko)}" title="${esc(en)}">
        ${esc(ko)}
      </button>`).join('');
  }

  async function translateAction(text) {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text }],
          systemPrompt: 'Translate this Korean action/motion description to a concise present-participle English phrase suitable for VFX video prompts (e.g. "walking slowly", "reaching out", "punching the wall"). Output ONLY the English phrase, 2-8 words, lowercase, no quotes, no period.',
        }),
      });
      const data = await r.json().catch(() => ({}));
      return (data.text || text).trim().replace(/\.$/, '');
    } catch {
      return text;
    }
  }

  async function addActionFromInput() {
    const text = (builder.actionInput || '').trim();
    if (!text || builder.actionInputTranslating) return;
    if (!hasKorean(text)) {
      builder.actionSeq.push({ en: text, ko: text });
      builder.actionInput = '';
      render();
      return;
    }
    builder.actionInputTranslating = true;
    render();
    const en = await translateAction(text);
    builder.actionSeq.push({ en, ko: text });
    builder.actionInput = '';
    builder.actionInputTranslating = false;
    render();
  }

  function actionSeqString() {
    const items = builder.actionSeq.map((a) => a.en).filter(Boolean);
    if (items.length === 0) return '';
    return items.join(', then ');
  }

  function renderActionRow() {
    const seq = builder.actionSeq;
    return `
      <div class="g-builder-row">
        <div class="g-builder-label">
          행동 / 모션
          <span class="g-builder-label-badge">순서대로 누적</span>
        </div>
        <div class="g-builder-chips">${chipRow('action', BUILDER_OPTS.action)}</div>
        <div class="g-builder-action-input-row">
          <input class="input g-builder-input g-builder-action-input" id="builder-action-input"
                 placeholder="예: 벽을 친다 / 갑자기 멈춰선다 (한글 자동 번역, Enter 로 추가)"
                 value="${esc(builder.actionInput || '')}"
                 ${builder.actionInputTranslating ? 'disabled' : ''}>
          <button class="btn btn--sm" id="builder-action-add" ${builder.actionInputTranslating ? 'disabled' : ''}>
            ${builder.actionInputTranslating ? '번역 중…' : '+ 추가'}
          </button>
        </div>
        ${seq.length > 0 ? `
          <div class="g-builder-seq">
            ${seq.map((a, i) => `
              <span class="g-builder-seq-item">
                <span class="g-builder-seq-idx">${i + 1}</span>
                <span class="g-builder-seq-text" title="${esc(a.en)}">${esc(a.ko || a.en)}</span>
                ${i > 0 ? `<button class="g-builder-seq-move" data-action-up="${i}" title="앞으로">↑</button>` : ''}
                ${i < seq.length - 1 ? `<button class="g-builder-seq-move" data-action-down="${i}" title="뒤로">↓</button>` : ''}
                <button class="g-builder-seq-remove" data-action-remove="${i}" title="삭제">×</button>
              </span>
              ${i < seq.length - 1 ? '<span class="g-builder-seq-arrow">→</span>' : ''}
            `).join('')}
          </div>` : ''}
      </div>`;
  }

  function renderBuilderRules() {
    return `
      <div class="g-builder-rules">
        <div class="g-builder-rules-title">참고 이미지 유지 커맨드</div>
        <div class="g-builder-rules-grid">
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Midjourney</div>
            <div class="g-builder-rule-cmds">
              <code>--sref URL</code> 스타일 유지<br>
              <code>--cref URL</code> 캐릭터 유지<br>
              <code>--iw 0.5-2</code> 이미지 가중치
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Runway Gen-4</div>
            <div class="g-builder-rule-cmds">
              인터페이스에서 이미지 첨부<br>
              Reference Image 모드 선택<br>
              프롬프트와 함께 전송
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Kling AI</div>
            <div class="g-builder-rule-cmds">
              Image-to-Video 탭 선택<br>
              첫 프레임 이미지 업로드<br>
              Motion Brush로 영역 지정
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Flux / SDXL</div>
            <div class="g-builder-rule-cmds">
              IP-Adapter로 스타일 이식<br>
              img2img strength 0.5-0.8<br>
              ControlNet으로 구도 고정
            </div>
          </div>
        </div>

        <div class="g-builder-rules-title" style="margin-top:18px">유용한 프롬프트 규칙</div>
        <div class="g-builder-rules-grid">
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Midjourney 파라미터</div>
            <div class="g-builder-rule-cmds">
              <code>--no blurry, text</code> 제외어<br>
              <code>--q 2</code> 고품질 렌더<br>
              <code>--chaos 10-30</code> 다양성
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">영상 AI 공통</div>
            <div class="g-builder-rule-cmds">
              동작 동사로 시작 → 카메라 명확히<br>
              조명 키워드로 분위기 고정<br>
              "cinematic" 항상 포함
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">품질 부스터</div>
            <div class="g-builder-rule-cmds">
              photorealistic, ultra-detailed<br>
              sharp focus, 8K resolution<br>
              award-winning cinematography
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">네거티브 프롬프트</div>
            <div class="g-builder-rule-cmds">
              blurry, overexposed, distorted<br>
              low quality, watermark, text<br>
              (각 툴 네거티브 필드에 추가)
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderBuilder() {
    const prompt = assemblePrompt();
    return `
      <div class="eyebrow">Guide</div>
      <h2 class="title">Prompt Builder</h2>
      <p class="subtitle">항목을 클릭해 조합하면 영어 VFX 프롬프트가 완성됩니다. 피사체는 한국어로 입력해도 자동 번역됩니다.</p>

      ${renderBuilderRules()}

      <div class="g-builder">

        <div class="g-builder-row">
          <div class="g-builder-label">샷 타입</div>
          <div class="g-builder-chips">${chipRow('shot', BUILDER_OPTS.shot)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">
            피사체
            <span class="g-builder-label-badge">한글 자동 번역</span>
          </div>
          <input class="input g-builder-input" id="builder-subject"
                 placeholder="예: 혼자 서 있는 탐험가 / lone figure in ruins"
                 value="${esc(builder.subjectKo)}">
          <div id="builder-subject-hint" class="g-builder-hint">${builder.subjectEn && hasKorean(builder.subjectKo) ? '→ ' + esc(builder.subjectEn) : ''}</div>
        </div>

        ${renderActionRow()}

        <div class="g-builder-row">
          <div class="g-builder-label">환경 / 분위기</div>
          <div class="g-builder-chips">${chipRow('env', BUILDER_OPTS.env)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">카메라 무브</div>
          <div class="g-builder-chips">${chipRow('camera', BUILDER_OPTS.camera)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">조명</div>
          <div class="g-builder-chips">${chipRow('lighting', BUILDER_OPTS.lighting)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">룩 / 그레이드</div>
          <div class="g-builder-chips">${chipRow('look', BUILDER_OPTS.look)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">비율</div>
          <div class="g-builder-chips">
            ${BUILDER_OPTS.ratio.map(([val, ko]) => `
              <button class="g-builder-chip ${builder.ratio === val ? 'is-active' : ''}"
                      data-field="ratio" data-val="${esc(val)}">${esc(ko)}</button>
            `).join('')}
          </div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">길이</div>
          <div class="g-builder-chips">
            ${BUILDER_OPTS.duration.map((d) => `
              <button class="g-builder-chip ${builder.duration === d ? 'is-active' : ''}"
                      data-field="duration" data-val="${esc(d)}">${esc(d)}</button>
            `).join('')}
          </div>
        </div>

        <div class="g-builder-result ${prompt ? 'is-filled' : ''}">
          ${builder.translating
            ? `<div class="g-builder-placeholder">번역 중…</div>`
            : prompt
              ? `<div class="g-builder-prompt">${esc(prompt)}</div>
                 <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
              : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`
          }
        </div>

      </div>`;
  }

  // ── Image Builder ─────────────────────────────────────────────
  async function doImageTranslate(text) {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text }],
          systemPrompt: 'Translate the Korean noun phrase to concise cinematic English. Output ONLY the English translation, 2-8 words, lowercase, no quotes, no explanation.',
        }),
      });
      const data = await r.json().catch(() => ({}));
      img.subjectEn = (data.text || text).trim().replace(/\.$/, '');
    } catch {
      img.subjectEn = text;
    }
    img.translating = false;
    updateImagePromptResult();
    const hint = host?.querySelector('#img-subject-hint');
    if (hint) hint.textContent = img.subjectEn ? '→ ' + img.subjectEn : '';
  }

  function scheduleImageTranslate(text) {
    clearTimeout(imgTranslateTimer);
    if (!text.trim()) {
      img.subjectEn = '';
      img.translating = false;
      updateImagePromptResult();
      return;
    }
    if (!hasKorean(text)) {
      img.subjectEn = text;
      img.translating = false;
      const hint = host?.querySelector('#img-subject-hint');
      if (hint) hint.textContent = '';
      updateImagePromptResult();
      return;
    }
    img.translating = true;
    updateImagePromptResult();
    imgTranslateTimer = setTimeout(() => doImageTranslate(text), 700);
  }

  const IMAGE_OPTS = {
    medium: [
      ['cinematic photograph', '영화 스틸 사진'],
      ['editorial photography', '에디토리얼 사진'],
      ['digital concept art', '디지털 컨셉아트'],
      ['oil painting', '유화'],
      ['watercolor painting', '수채화'],
      ['3D CGI render', '3D 렌더'],
      ['ink illustration', '잉크 일러스트'],
      ['pixel art', '픽셀 아트'],
    ],
    pose: [
      ['standing, facing camera', '정면 서 있는'],
      ['sitting', '앉아 있는'],
      ['back to camera', '뒷모습'],
      ['in motion, running', '달리는'],
      ['close portrait, looking up', '클로즈 업샷'],
      ['profile side view', '옆모습'],
      ['crouching low', '웅크린'],
      ['dramatic fallen pose', '극적인 쓰러진 자세'],
    ],
    bg: [
      ['urban street at night', '도시 야경 거리'],
      ['dense forest with mist', '짙은 안개 숲'],
      ['minimalist studio white', '미니멀 흰 배경'],
      ['dark void black background', '검은 허공'],
      ['neon-lit alleyway', '네온 골목'],
      ['vast desert dunes', '광활한 사막'],
      ['abandoned industrial ruins', '폐공장'],
      ['underwater ocean depths', '심해'],
      ['outer space starfield', '우주 / 별'],
      ['cozy warm interior', '아늑한 실내'],
    ],
    composition: [
      ['rule of thirds', '삼분할 구도'],
      ['centered symmetrical', '중심 대칭'],
      ['extreme close-up face fill', '얼굴 클로즈업'],
      ['wide full body shot', '전신 와이드'],
      ['low angle heroic upshot', '영웅적 저각'],
      ['bird\'s eye top down', '조감도'],
      ['negative space minimal', '네거티브 스페이스'],
      ['bokeh shallow depth of field', '아웃포커스 보케'],
    ],
    lighting: [
      ['golden hour rim light', '황금시간대 윤곽광'],
      ['blue hour backlight', '블루아워 역광'],
      ['dramatic Rembrandt lighting', '렘브란트 조명'],
      ['soft studio diffused light', '소프트박스 확산광'],
      ['neon practical glow', '네온 실광원'],
      ['harsh single spotlight', '단일 스포트라이트'],
      ['overcast flat light', '흐린 날 평탄광'],
      ['candlelight warm glow', '촛불 따뜻한 빛'],
    ],
    color: [
      ['warm golden tones', '따뜻한 황금 톤'],
      ['cool blue tones', '차가운 블루 톤'],
      ['muted earth palette', '차분한 어스 톤'],
      ['vibrant saturated colors', '선명한 고채도'],
      ['desaturated monochrome', '탈채색 모노크롬'],
      ['soft pastel palette', '파스텔 소프트'],
      ['deep shadow noir palette', '딥 섀도우 누아르'],
      ['electric neon palette', '네온 일렉트릭'],
    ],
    look: [
      ['photorealistic ultra-detailed', '극사실 초디테일'],
      ['35mm Kodak film grain', '35mm 코닥 필름'],
      ['painterly brushstroke texture', '회화적 붓터치'],
      ['hyper-sharp 8K rendered', '하이퍼 샤프 8K'],
      ['vintage faded film', '빈티지 바랜 필름'],
      ['anamorphic cinematic look', '아나모픽 시네마틱'],
      ['anime cel-shaded style', '애니메이션 셀쉐이딩'],
      ['award-winning concept art', '수상 컨셉아트'],
    ],
    ratio: [
      ['--ar 1:1', '1:1 정방형'],
      ['--ar 4:3', '4:3 표준'],
      ['--ar 16:9', '16:9 와이드'],
      ['--ar 3:4', '3:4 세로'],
      ['--ar 9:16', '9:16 모바일'],
      ['--ar 2:3', '2:3 포트레이트'],
    ],
  };

  function assembleImagePrompt() {
    const parts = [];
    if (img.medium) parts.push(img.medium);
    const subj = (img.subjectEn || img.subjectKo || '').trim();
    if (subj) parts.push(subj + (img.pose ? ', ' + img.pose : ''));
    else if (img.pose) parts.push(img.pose);
    if (img.bg)          parts.push(img.bg);
    if (img.composition) parts.push(img.composition);
    if (img.lighting)    parts.push(img.lighting);
    if (img.color)       parts.push(img.color);
    if (img.look)        parts.push(img.look);
    if (!parts.length && !img.ratio) return '';
    const main = parts.join(', ');
    return img.ratio ? (main ? main + ' ' + img.ratio : img.ratio) : main;
  }

  function updateImagePromptResult() {
    if (!host) return;
    const result = host.querySelector('.g-img-result');
    if (!result) return;
    if (img.translating) {
      result.className = 'g-builder-result g-img-result';
      result.innerHTML = '<div class="g-builder-placeholder">번역 중…</div>';
      return;
    }
    const prompt = assembleImagePrompt();
    result.className = 'g-builder-result g-img-result' + (prompt ? ' is-filled' : '');
    result.innerHTML = prompt
      ? `<div class="g-builder-prompt">${esc(prompt)}</div>
         <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
      : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`;
    const copyBtn = result.querySelector('.g-builder-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(copyBtn.getAttribute('data-copy'))
          .then(() => window.App?.toast('복사됐어요'));
      });
    }
  }

  function imgChipRow(field, opts) {
    return opts.map(([en, ko]) => `
      <button class="g-builder-chip ${img[field] === en ? 'is-active' : ''}"
              data-img-field="${esc(field)}" data-val="${esc(en)}" title="${esc(en)}">
        ${esc(ko)}
      </button>`).join('');
  }

  function renderImageBuilder() {
    const prompt = assembleImagePrompt();
    return `
      <div class="eyebrow">Guide</div>
      <h2 class="title">Image Prompt Builder</h2>
      <p class="subtitle">정지 이미지 생성용 프롬프트 빌더입니다. Midjourney, Flux, Stable Diffusion에 최적화되어 있습니다.</p>

      <div class="g-builder-rules">
        <div class="g-builder-rules-title">Midjourney 주요 파라미터</div>
        <div class="g-builder-rules-grid">
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">스타일 / 캐릭터 유지</div>
            <div class="g-builder-rule-cmds">
              <code>--sref URL</code> 스타일 레퍼런스<br>
              <code>--cref URL</code> 캐릭터 레퍼런스<br>
              <code>--iw 0.5–2</code> 이미지 반영 강도
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">품질 / 스타일 제어</div>
            <div class="g-builder-rule-cmds">
              <code>--q 2</code> 고품질 렌더링<br>
              <code>--stylize 0–1000</code> 예술성<br>
              <code>--v 7</code> 최신 모델 지정
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">구성 제어</div>
            <div class="g-builder-rule-cmds">
              <code>--no blurry, text</code> 제외어<br>
              <code>--chaos 10–50</code> 변화량<br>
              <code>--seed 12345</code> 고정 시드
            </div>
          </div>
          <div class="g-builder-rule-card">
            <div class="g-builder-rule-tool">Flux / SDXL</div>
            <div class="g-builder-rule-cmds">
              IP-Adapter로 스타일 이식<br>
              ControlNet으로 포즈 고정<br>
              cfg_scale 5–8 권장
            </div>
          </div>
        </div>
      </div>

      <div class="g-builder">

        <div class="g-builder-row">
          <div class="g-builder-label">미디엄 / 스타일</div>
          <div class="g-builder-chips">${imgChipRow('medium', IMAGE_OPTS.medium)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">
            피사체
            <span class="g-builder-label-badge">한글 자동 번역</span>
          </div>
          <input class="input g-builder-input" id="img-subject"
                 placeholder="예: 갑옷 입은 기사 / lone astronaut"
                 value="${esc(img.subjectKo)}">
          <div id="img-subject-hint" class="g-builder-hint">${img.subjectEn && hasKorean(img.subjectKo) ? '→ ' + esc(img.subjectEn) : ''}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">포즈 / 행동</div>
          <div class="g-builder-chips">${imgChipRow('pose', IMAGE_OPTS.pose)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">배경 / 장소</div>
          <div class="g-builder-chips">${imgChipRow('bg', IMAGE_OPTS.bg)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">구도</div>
          <div class="g-builder-chips">${imgChipRow('composition', IMAGE_OPTS.composition)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">조명</div>
          <div class="g-builder-chips">${imgChipRow('lighting', IMAGE_OPTS.lighting)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">색감 / 분위기</div>
          <div class="g-builder-chips">${imgChipRow('color', IMAGE_OPTS.color)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">룩 / 마감</div>
          <div class="g-builder-chips">${imgChipRow('look', IMAGE_OPTS.look)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">비율 (--ar)</div>
          <div class="g-builder-chips">
            ${IMAGE_OPTS.ratio.map(([val, ko]) => `
              <button class="g-builder-chip ${img.ratio === val ? 'is-active' : ''}"
                      data-img-field="ratio" data-val="${esc(val)}">${esc(ko)}</button>
            `).join('')}
          </div>
        </div>

        <div class="g-builder-result g-img-result ${prompt ? 'is-filled' : ''}">
          ${img.translating
            ? `<div class="g-builder-placeholder">번역 중…</div>`
            : prompt
              ? `<div class="g-builder-prompt">${esc(prompt)}</div>
                 <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
              : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`
          }
        </div>

      </div>`;
  }

  function renderContent() {
    if (currentSection === 'builder')             return renderBuilder();
    if (currentSection === 'image-builder')       return renderImageBuilder();
    if (currentSection === 'workflow')            return renderWorkflow();
    if (currentSection === 'tools')               return renderTools();
    if (currentSection === 'glossary')            return renderGlossary();
    if (currentSection === 'tips')                return renderTips();
    if (currentSection === 'runway-beginner')     return renderRunwaySection(window.GUIDE_RUNWAY_SKILLS?.beginner);
    if (currentSection === 'runway-intermediate') return renderRunwaySection(window.GUIDE_RUNWAY_SKILLS?.intermediate);
    if (currentSection === 'runway-advanced')     return renderRunwaySection(window.GUIDE_RUNWAY_SKILLS?.advanced);
    if (currentSection === 'runway-asset')        return renderRunwaySection(window.GUIDE_RUNWAY_SITUATIONS?.asset);
    if (currentSection === 'runway-longform')     return renderRunwaySection(window.GUIDE_RUNWAY_SITUATIONS?.longform);
    if (currentSection === 'runway-story')        return renderRunwaySection(window.GUIDE_RUNWAY_SITUATIONS?.story);
    return '';
  }

  function render() {
    if (!host) return;
    host.innerHTML = `
      <div class="g-layout">
        ${renderSidebar()}
        <div class="g-body">
          <div class="tab-pad"><div class="tab-max">
            ${renderContent()}
          </div></div>
        </div>
      </div>`;

    host.querySelectorAll('[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSection = btn.getAttribute('data-section');
        render();
      });
    });

    // Builder chips
    host.querySelectorAll('.g-builder-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.getAttribute('data-field');
        const val = btn.getAttribute('data-val');
        // Action chips append to sequence rather than toggling
        if (field === 'action') {
          const ko = btn.getAttribute('data-ko') || val;
          builder.actionSeq.push({ en: val, ko });
          render();
          return;
        }
        builder[field] = builder[field] === val ? '' : val;
        if (field === 'duration' || field === 'ratio') {
          // duration/ratio are not togglable to empty
          builder[field] = val;
        }
        render();
      });
    });
    const subjectInput = host.querySelector('#builder-subject');
    if (subjectInput) {
      subjectInput.addEventListener('input', (e) => {
        builder.subjectKo = e.target.value;
        scheduleTranslate(e.target.value);
      });
    }

    // Action sequence: free-text input, add, remove, reorder
    const actionInput = host.querySelector('#builder-action-input');
    if (actionInput) {
      actionInput.addEventListener('input', (e) => {
        builder.actionInput = e.target.value;
      });
      actionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addActionFromInput();
        }
      });
    }
    const actionAddBtn = host.querySelector('#builder-action-add');
    if (actionAddBtn) {
      actionAddBtn.addEventListener('click', () => addActionFromInput());
    }
    host.querySelectorAll('[data-action-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-action-remove');
        builder.actionSeq.splice(i, 1);
        render();
      });
    });
    host.querySelectorAll('[data-action-up]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-action-up');
        if (i <= 0) return;
        const seq = builder.actionSeq;
        [seq[i - 1], seq[i]] = [seq[i], seq[i - 1]];
        render();
      });
    });
    host.querySelectorAll('[data-action-down]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-action-down');
        const seq = builder.actionSeq;
        if (i >= seq.length - 1) return;
        [seq[i + 1], seq[i]] = [seq[i], seq[i + 1]];
        render();
      });
    });

    host.querySelectorAll('.g-builder-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.getAttribute('data-copy'))
          .then(() => window.App?.toast('복사됐어요'));
      });
    });

    // Image Builder chips
    host.querySelectorAll('[data-img-field]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.getAttribute('data-img-field');
        const val = btn.getAttribute('data-val');
        img[field] = (field === 'ratio') ? val : (img[field] === val ? '' : val);
        render();
      });
    });
    const imgSubjectInput = host.querySelector('#img-subject');
    if (imgSubjectInput) {
      imgSubjectInput.addEventListener('input', (e) => {
        img.subjectKo = e.target.value;
        scheduleImageTranslate(e.target.value);
      });
    }

    const q = host.querySelector('#g-search');
    if (q) {
      q.addEventListener('input', () => {
        const s = q.value.trim().toLowerCase();
        host.querySelectorAll('.g-glossary-row').forEach((row) => {
          const m = !s || row.getAttribute('data-search').includes(s);
          row.style.display = m ? '' : 'none';
        });
        host.querySelectorAll('.g-glossary-group').forEach((group) => {
          const visible = group.querySelectorAll('.g-glossary-row:not([style*="none"])').length;
          group.style.display = visible === 0 ? 'none' : '';
        });
      });
    }
  }

  function setHost(el) { host = el; currentSection = 'workflow'; render(); }
  window.Guide = { render: setHost };
})();
