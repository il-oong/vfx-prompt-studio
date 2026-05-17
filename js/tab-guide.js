/* ───────────────────────────────────────────────────────────────
   js/tab-guide.js
   Static guide content. Workflow / tools / Korean→English glossary.
   Public: window.Guide = { render }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let host = null;

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  function stars(n) {
    return '★'.repeat(n) + '<span class="g-star-off">' + '★'.repeat(5 - n) + '</span>';
  }

  function render() {
    if (!host) return;
    host.innerHTML = `
      <div class="tab-pad"><div class="tab-max">
        <div class="eyebrow">Guide</div>
        <h1 class="title">AI VFX 워크플로우, 도구, 그리고 어휘</h1>
        <p class="subtitle">생성 AI VFX 의 흐름과 자주 쓰는 영어 표현을 한 곳에 모았어요. Studio 에서 봇을 부를 때 이 어휘를 활용하면 결과가 안정적입니다.</p>

        <!-- Workflow -->
        <div class="g-section">
          <div class="g-section-head">
            <span class="eyebrow eyebrow--amber">Volume One</span>
            <h2 class="g-section-title">Workflow</h2>
          </div>
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
        </div>

        <!-- Tools -->
        <div class="g-section">
          <div class="g-section-head">
            <span class="eyebrow eyebrow--amber">Volume Two</span>
            <h2 class="g-section-title">AI Tools</h2>
          </div>
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
        </div>

        <!-- Glossary -->
        <div class="g-section">
          <div class="g-section-head">
            <span class="eyebrow eyebrow--amber">Volume Three</span>
            <h2 class="g-section-title">Korean → English vocabulary</h2>
          </div>
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
        </div>

        <!-- Tips -->
        <div class="g-section">
          <div class="g-section-head">
            <span class="eyebrow eyebrow--amber">Volume Four</span>
            <h2 class="g-section-title">Prompting Tips</h2>
          </div>
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
        </div>
      </div></div>
    `;

    // Search behavior
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

  function setHost(el) { host = el; render(); }
  window.Guide = { render: setHost };
})();
