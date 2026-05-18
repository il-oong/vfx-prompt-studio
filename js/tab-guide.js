/* ───────────────────────────────────────────────────────────────
   js/tab-guide.js
   Guide tab with sidebar navigation.
   Sections: Workflow / AI Tools / Glossary / Tips / Runway Skills / Runway Situations
   Public: window.Guide = { render }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;
  let currentSection = 'workflow';

  // Builder state
  let builder = {
    shot: '', subject: '', env: '', camera: '', lighting: '', look: '', duration: '10 seconds',
  };

  const SECTIONS = [
    { id: 'builder',             label: '✦ Prompt Builder', group: 'GUIDE' },
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

  function renderTools() {
    return `
      <div class="eyebrow eyebrow--amber">Volume Two</div>
      <h2 class="title">AI Tools</h2>
      <p class="subtitle">각 도구의 강점과 특성을 비교합니다. 씬에 맞는 도구를 고르는 것만으로도 결과가 달라집니다.</p>
      <div class="g-section">
        <div class="g-tools">
          <div class="g-tools-row g-tools-head">
            <span>Tool</span><span>Best for</span><span>Length</span><span>Realism</span><span>Control</span>
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
            </div>`;
          }).join('')}
        </div>
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
      ['Wide / Establishing shot', '와이드 설정샷'],
      ['Medium shot', '미디엄 샷'],
      ['Close-up', '클로즈업'],
      ['Macro', '매크로 극근접'],
      ['Over-the-shoulder shot', '어깨 너머 시점'],
      ['POV shot', '1인칭 시점'],
      ['Dutch angle shot', '기울어진 앵글'],
      ['High-angle drone shot', '고각 드론샷'],
      ['Low-angle shot', '저각 샷'],
    ],
    env: [
      ['volumetric fog', '부피감 있는 안개'],
      ['rain-slick reflections', '빗물 반사'],
      ['haze', '아지랑이 / 연무'],
      ['dust motes in light', '빛 속 먼지 입자'],
      ['smoke and steam', '연기 / 수증기'],
      ['aurora borealis', '오로라'],
      ['golden hour sunlight', '황금시간대'],
      ['blue hour twilight', '블루아워 황혼'],
      ['overcast diffused light', '흐린 날 확산광'],
    ],
    camera: [
      ['slow dolly-in', '천천히 전진'],
      ['dolly out', '후진'],
      ['tracking shot', '트래킹'],
      ['crane up', '크레인 상승'],
      ['whip pan', '휙 패닝'],
      ['rack focus', '포커스 이동'],
      ['locked off', '고정 샷'],
      ['parallax move', '시차 무브'],
      ['crash zoom', '급격한 줌'],
    ],
    lighting: [
      ['golden hour rim light', '황금시간대 윤곽광'],
      ['blue hour backlight', '블루아워 역광'],
      ['hard directional key light', '강한 방향성 주광'],
      ['soft diffused light', '부드러운 확산광'],
      ['practical neon light', '네온 실광원'],
      ['volumetric god rays', '갓레이 빛줄기'],
      ['deep shadow underexposed', '깊은 그림자 노출 부족'],
      ['studio rim light', '스튜디오 윤곽광'],
    ],
    look: [
      ['35mm film grain', '필름 그레인'],
      ['teal-orange grade', '청-주황 그레이드'],
      ['anamorphic lens flare', '아나모픽 플레어'],
      ['Kodak Portra tone', '코닥 포트라 톤'],
      ['bleach bypass', '블리치 바이패스'],
      ['halation glow', '하레이션'],
      ['high contrast cinematic', '고대비 시네마틱'],
      ['desaturated muted palette', '채도 낮은 무채색'],
    ],
    duration: ['5 seconds', '10 seconds', '20 seconds'],
  };

  function assemblePrompt() {
    const parts = [];
    if (builder.camera) parts.push(builder.camera);
    if (builder.shot)   parts.push(builder.shot);
    const subj = builder.subject.trim();
    if (subj) parts.push('of ' + subj);
    if (builder.env)      parts.push(builder.env);
    if (builder.lighting) parts.push(builder.lighting);
    if (builder.look)     parts.push(builder.look);
    if (builder.duration) parts.push(builder.duration);
    if (!parts.length) return '';
    return parts.join(', ') + '.';
  }

  function chipRow(field, opts) {
    return opts.map(([en, ko]) => `
      <button class="g-builder-chip ${builder[field] === en ? 'is-active' : ''}"
              data-field="${esc(field)}" data-val="${esc(en)}" title="${esc(ko)}">
        ${esc(ko)}
      </button>`).join('');
  }

  function renderBuilder() {
    const prompt = assemblePrompt();
    return `
      <div class="eyebrow">Guide</div>
      <h2 class="title">Prompt Builder</h2>
      <p class="subtitle">항목을 선택하면 영어 VFX 프롬프트가 자동으로 완성됩니다. 피사체만 직접 입력하세요.</p>

      <div class="g-builder">

        <div class="g-builder-row">
          <div class="g-builder-label">샷 타입</div>
          <div class="g-builder-chips">${chipRow('shot', BUILDER_OPTS.shot)}</div>
        </div>

        <div class="g-builder-row">
          <div class="g-builder-label">피사체</div>
          <input class="input g-builder-input" id="builder-subject"
                 placeholder="예: lone figure, weathered mecha, burning car"
                 value="${esc(builder.subject)}">
        </div>

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
          <div class="g-builder-label">길이</div>
          <div class="g-builder-chips">
            ${BUILDER_OPTS.duration.map((d) => `
              <button class="g-builder-chip ${builder.duration === d ? 'is-active' : ''}"
                      data-field="duration" data-val="${esc(d)}">${esc(d)}</button>
            `).join('')}
          </div>
        </div>

        <div class="g-builder-result ${prompt ? 'is-filled' : ''}">
          ${prompt
            ? `<div class="g-builder-prompt">${esc(prompt)}</div>
               <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
            : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`
          }
        </div>

      </div>`;
  }

  function renderContent() {
    if (currentSection === 'builder')             return renderBuilder();
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
        builder[field] = builder[field] === val ? '' : val;
        render();
      });
    });
    const subjectInput = host.querySelector('#builder-subject');
    if (subjectInput) {
      subjectInput.addEventListener('input', (e) => {
        builder.subject = e.target.value;
        const prompt = assemblePrompt();
        const result = host.querySelector('.g-builder-result');
        if (result) {
          result.className = 'g-builder-result' + (prompt ? ' is-filled' : '');
          result.innerHTML = prompt
            ? `<div class="g-builder-prompt">${esc(prompt)}</div>
               <button class="btn btn--sm g-builder-copy" data-copy="${esc(prompt)}">⎘ Copy</button>`
            : `<div class="g-builder-placeholder">위에서 항목을 선택하면 여기에 프롬프트가 만들어져요</div>`;
          const copyBtn = result.querySelector('.g-builder-copy');
          if (copyBtn) copyBtn.addEventListener('click', (ev) => {
            navigator.clipboard?.writeText(ev.target.getAttribute('data-copy'))
              .then(() => window.App?.toast('복사됐어요'));
          });
        }
      });
    }
    host.querySelectorAll('.g-builder-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.getAttribute('data-copy'))
          .then(() => window.App?.toast('복사됐어요'));
      });
    });

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
