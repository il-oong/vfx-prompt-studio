/* VFX Prompt Studio — 가이드 탭 */
var VFXGuide = (function() {
  var activeSubtab = 'workflow';

  function init() {
    document.querySelectorAll('.guide-subtab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchSubtab(btn.dataset.tab);
      });
    });

    renderWorkflow();
    renderTools();
    renderGlossary();
    renderLookup();
  }

  function switchSubtab(tab) {
    activeSubtab = tab;
    document.querySelectorAll('.guide-subtab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.guide-section').forEach(function(s) {
      s.classList.toggle('active', s.id === 'guide-' + tab);
    });
  }

  /* ── 워크플로우 ── */
  function renderWorkflow() {
    var container = document.getElementById('guide-workflow');
    var html = '<div class="workflow-steps">';
    GUIDE_CONTENT.workflow.forEach(function(step, i) {
      html +=
        '<div class="workflow-step">' +
          '<div class="step-num">' + step.num + '</div>' +
          '<div class="step-body">' +
            '<h4>' + escHtml(step.title) + '</h4>' +
            '<p>' + escHtml(step.desc) + '</p>' +
            '<div class="step-tools">' +
              step.tools.map(function(t) { return '<span class="step-tool-tag">' + escHtml(t) + '</span>'; }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      if (i < GUIDE_CONTENT.workflow.length - 1) {
        html += '<div class="workflow-arrow">↓</div>';
      }
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── 도구 비교 ── */
  function renderTools() {
    var container = document.getElementById('guide-tools');
    var html = '<div class="tools-grid">';
    GUIDE_CONTENT.tools.forEach(function(tool) {
      html +=
        '<div class="tool-card">' +
          '<div class="tool-card-header">' +
            '<div class="tool-icon" style="background:' + tool.color + '20;color:' + tool.color + '">' + tool.icon + '</div>' +
            '<div>' +
              '<h4>' + escHtml(tool.name) + '</h4>' +
              '<div class="tool-type">' + escHtml(tool.type) + '</div>' +
            '</div>' +
          '</div>' +
          '<p>' + escHtml(tool.desc) + '</p>' +
          '<div class="tool-strengths">' +
            tool.strengths.map(function(s) { return '<span class="strength-tag">' + escHtml(s) + '</span>'; }).join('') +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── 용어집 ── */
  function renderGlossary() {
    var container = document.getElementById('guide-glossary');
    var html = '<div class="glossary-sections">';

    GUIDE_CONTENT.glossary.forEach(function(section) {
      html +=
        '<div class="glossary-accordion" data-id="' + section.id + '">' +
          '<div class="glossary-header">' +
            '<div class="glossary-header-left">' +
              '<div class="glossary-cat-icon">' + section.icon + '</div>' +
              '<div>' +
                '<h4>' + escHtml(section.title) + '</h4>' +
                '<p>' + escHtml(section.subtitle) + '</p>' +
              '</div>' +
            '</div>' +
            '<span class="glossary-arrow">▼</span>' +
          '</div>' +
          '<div class="glossary-body">' +
            '<div class="glossary-terms">' +
              section.terms.map(function(t) {
                return '<div class="glossary-term">' +
                  '<div class="en">' + escHtml(t.en) + '</div>' +
                  '<div class="ko">' + escHtml(t.ko) + '</div>' +
                  '<div class="desc">' + escHtml(t.desc) + '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 아코디언 이벤트
    container.querySelectorAll('.glossary-accordion').forEach(function(acc) {
      acc.querySelector('.glossary-header').addEventListener('click', function() {
        acc.classList.toggle('open');
      });
    });

    // 첫 번째 기본 열기
    var first = container.querySelector('.glossary-accordion');
    if (first) first.classList.add('open');
  }

  /* ── 한영 대응표 ── */
  function renderLookup() {
    var container = document.getElementById('guide-lookup');
    var html =
      '<div class="lookup-search">' +
        '<span class="lookup-search-icon">🔍</span>' +
        '<input type="text" id="lookup-input" placeholder="한국어 또는 영어로 검색...">' +
      '</div>' +
      '<div class="lookup-table">' +
        '<table>' +
          '<thead><tr><th>한국어</th><th>영어 프롬프트</th><th>활용 팁</th></tr></thead>' +
          '<tbody id="lookup-tbody">' +
            GUIDE_CONTENT.lookup.map(function(row) {
              return '<tr class="lookup-row">' +
                '<td>' + escHtml(row.ko) + '</td>' +
                '<td>' + escHtml(row.en) + '</td>' +
                '<td>' + escHtml(row.tip) + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

    container.innerHTML = html;

    document.getElementById('lookup-input').addEventListener('input', function() {
      var q = this.value.toLowerCase();
      container.querySelectorAll('.lookup-row').forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }

  function escHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init: init };
})();
