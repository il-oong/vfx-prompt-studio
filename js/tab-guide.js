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
    renderPromptsLib();
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

  /* ── 프롬프트 모음 ── */
  var MASTER_KEY = 'vfx_master_prompts';

  function loadMasters() {
    try { return JSON.parse(localStorage.getItem(MASTER_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveMasters(list) {
    localStorage.setItem(MASTER_KEY, JSON.stringify(list));
  }

  function renderPromptsLib() {
    var container = document.getElementById('guide-prompts-lib');

    container.innerHTML =
      '<div class="plib-master-section">' +
        '<div class="plib-master-header">' +
          '<div>' +
            '<h3 class="plib-section-title">마스터 프롬프트</h3>' +
            '<p class="plib-section-sub">내 VFX의 기준이 되는 베이스 에셋 프롬프트를 저장합니다. 새 작업을 시작할 때 복사해서 기반으로 사용하세요.</p>' +
          '</div>' +
          '<button class="btn-primary plib-add-master-btn" id="plib-add-master">+ 마스터 추가</button>' +
        '</div>' +
        '<div id="plib-master-list"></div>' +
      '</div>' +
      '<div class="plib-preset-section">' +
        '<div class="plib-section-title-row">' +
          '<h3 class="plib-section-title">효과 & 컴포지션 스니펫</h3>' +
          '<p class="plib-section-sub">필요한 효과를 골라 복사한 뒤 메인 프롬프트 뒤에 붙여넣으세요.</p>' +
        '</div>' +
        '<div id="plib-preset-list"></div>' +
      '</div>' +
      '<div id="plib-modal" class="plib-modal hidden">' +
        '<div class="plib-modal-box">' +
          '<div class="plib-modal-header">' +
            '<h4 id="plib-modal-title">마스터 프롬프트 추가</h4>' +
            '<button class="icon-btn" id="plib-modal-close">✕</button>' +
          '</div>' +
          '<label class="plib-label">이름</label>' +
          '<input type="text" id="plib-modal-name" class="plib-input" placeholder="예: 다크 씨네마틱 기준, 사이버펑크 룩...">' +
          '<label class="plib-label">프롬프트</label>' +
          '<textarea id="plib-modal-content" class="plib-textarea" placeholder="영어로 베이스 스타일 프롬프트를 입력하세요.&#10;예: photorealistic, cinematic, shot on ARRI Alexa, anamorphic lens, shallow depth of field, teal and orange color grade, film grain..." rows="7"></textarea>' +
          '<div class="plib-modal-actions">' +
            '<button class="btn-ghost" id="plib-modal-cancel">취소</button>' +
            '<button class="btn-primary" id="plib-modal-save">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    renderMasterList();
    renderPresetList();

    document.getElementById('plib-add-master').addEventListener('click', function() {
      openMasterModal(null);
    });
    document.getElementById('plib-modal-close').addEventListener('click', closeMasterModal);
    document.getElementById('plib-modal-cancel').addEventListener('click', closeMasterModal);
    document.getElementById('plib-modal').addEventListener('click', function(e) {
      if (e.target === this) closeMasterModal();
    });
    document.getElementById('plib-modal-save').addEventListener('click', saveMasterModal);
  }

  var editingMasterId = null;

  function renderMasterList() {
    var list = loadMasters();
    var el = document.getElementById('plib-master-list');
    if (!el) return;

    if (!list.length) {
      el.innerHTML =
        '<div class="plib-master-empty">' +
          '<div class="plib-empty-icon">📌</div>' +
          '<p>아직 저장된 마스터 프롬프트가 없습니다.<br>+ 마스터 추가를 눌러 첫 번째 베이스 프롬프트를 만들어보세요.</p>' +
        '</div>';
      return;
    }

    el.innerHTML = list.map(function(m) {
      return '<div class="plib-master-card" data-id="' + escHtml(m.id) + '">' +
        '<div class="plib-master-card-top">' +
          '<div class="plib-master-name">' + escHtml(m.name) + '</div>' +
          '<div class="plib-master-actions">' +
            '<button class="plib-action-btn plib-copy-master" title="복사">⎘ 복사</button>' +
            '<button class="plib-action-btn plib-edit-master" title="편집">✏ 편집</button>' +
            '<button class="plib-action-btn plib-delete-master" title="삭제">🗑</button>' +
          '</div>' +
        '</div>' +
        '<div class="plib-master-preview">' + escHtml(m.content) + '</div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('.plib-copy-master').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.closest('.plib-master-card').dataset.id;
        var m = loadMasters().find(function(x) { return x.id === id; });
        if (!m) return;
        navigator.clipboard.writeText(m.content).then(function() {
          showToast('마스터 프롬프트를 복사했습니다.');
        });
      });
    });
    el.querySelectorAll('.plib-edit-master').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.closest('.plib-master-card').dataset.id;
        openMasterModal(id);
      });
    });
    el.querySelectorAll('.plib-delete-master').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.closest('.plib-master-card').dataset.id;
        var list = loadMasters().filter(function(x) { return x.id !== id; });
        saveMasters(list);
        renderMasterList();
        showToast('삭제했습니다.');
      });
    });
  }

  function openMasterModal(id) {
    editingMasterId = id;
    var modal = document.getElementById('plib-modal');
    document.getElementById('plib-modal-title').textContent = id ? '마스터 프롬프트 편집' : '마스터 프롬프트 추가';
    if (id) {
      var m = loadMasters().find(function(x) { return x.id === id; });
      document.getElementById('plib-modal-name').value = m ? m.name : '';
      document.getElementById('plib-modal-content').value = m ? m.content : '';
    } else {
      document.getElementById('plib-modal-name').value = '';
      document.getElementById('plib-modal-content').value = '';
    }
    modal.classList.remove('hidden');
    document.getElementById('plib-modal-name').focus();
  }

  function closeMasterModal() {
    document.getElementById('plib-modal').classList.add('hidden');
    editingMasterId = null;
  }

  function saveMasterModal() {
    var name = document.getElementById('plib-modal-name').value.trim();
    var content = document.getElementById('plib-modal-content').value.trim();
    if (!name || !content) { showToast('이름과 프롬프트를 모두 입력하세요.'); return; }

    var list = loadMasters();
    if (editingMasterId) {
      list = list.map(function(m) {
        return m.id === editingMasterId ? { id: m.id, name: name, content: content } : m;
      });
    } else {
      list.push({ id: Date.now().toString(36), name: name, content: content });
    }
    saveMasters(list);
    renderMasterList();
    closeMasterModal();
    showToast(editingMasterId ? '수정했습니다.' : '마스터 프롬프트를 저장했습니다.');
  }

  function renderPresetList() {
    var el = document.getElementById('plib-preset-list');
    if (!el) return;

    var html = '<div class="plib-preset-accordions">';
    GUIDE_CONTENT.promptLibrary.forEach(function(cat) {
      html +=
        '<div class="plib-accordion" data-id="' + cat.id + '">' +
          '<div class="plib-accordion-header">' +
            '<div class="plib-accordion-left">' +
              '<div class="plib-cat-icon">' + cat.icon + '</div>' +
              '<span>' + escHtml(cat.title) + '</span>' +
              '<span class="plib-count">' + cat.items.length + '개</span>' +
            '</div>' +
            '<span class="plib-accordion-arrow">▼</span>' +
          '</div>' +
          '<div class="plib-accordion-body">' +
            cat.items.map(function(item) {
              return '<div class="plib-item">' +
                '<div class="plib-item-top">' +
                  '<span class="plib-item-label">' + escHtml(item.label) + '</span>' +
                  '<button class="plib-copy-btn" data-prompt="' + escHtml(item.prompt) + '">⎘ 복사</button>' +
                '</div>' +
                '<div class="plib-item-prompt">' + escHtml(item.prompt) + '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll('.plib-accordion-header').forEach(function(header) {
      header.addEventListener('click', function() {
        header.closest('.plib-accordion').classList.toggle('open');
      });
    });

    el.querySelectorAll('.plib-copy-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.prompt).then(function() {
          showToast('프롬프트를 복사했습니다.');
        });
      });
    });

    var first = el.querySelector('.plib-accordion');
    if (first) first.classList.add('open');
  }

  function showToast(msg) {
    if (window.VFXApp && VFXApp.showToast) {
      VFXApp.showToast(msg);
    } else {
      var t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      document.getElementById('toast-container').appendChild(t);
      setTimeout(function() { t.remove(); }, 2500);
    }
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
