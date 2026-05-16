/* VFX Prompt Studio — 프롬프트 탭 */
var VFXPrompts = (function() {
  var state = {
    allPrompts: [],
    filterProject: 'all',
    filterTool: 'all',
    filterCategory: 'all',
    searchText: '',
    editTags: []
  };

  var CATEGORIES = [
    { id: 'scene', label: '장면' },
    { id: 'asset', label: '에셋' },
    { id: 'character', label: '캐릭터' },
    { id: 'bg', label: '배경' },
    { id: 'fx', label: 'FX' }
  ];

  function init() {
    document.getElementById('prompts-search').addEventListener('input', onSearchChange);
    document.getElementById('prompts-filter-project').addEventListener('change', onProjectFilter);
    document.getElementById('prompts-filter-tool').addEventListener('change', onToolFilter);
    document.getElementById('prompts-filter-category').addEventListener('change', onCategoryFilter);
    document.getElementById('btn-new-prompt').addEventListener('click', function() {
      openEditModal(null);
    });

    loadAndRender();
  }

  function loadAndRender() {
    return VFXDb.getPrompts().then(function(prompts) {
      state.allPrompts = prompts;
      updateProjectFilter();
      render();
    });
  }

  function reload() {
    return loadAndRender();
  }

  /* ── 필터 ── */
  function onSearchChange(e) {
    state.searchText = e.target.value.toLowerCase();
    render();
  }
  function onProjectFilter(e) {
    state.filterProject = e.target.value;
    render();
  }
  function onToolFilter(e) {
    state.filterTool = e.target.value;
    render();
  }
  function onCategoryFilter(e) {
    state.filterCategory = e.target.value;
    render();
  }

  function updateProjectFilter() {
    VFXDb.getProjects().then(function(projects) {
      var sel = document.getElementById('prompts-filter-project');
      var prev = sel.value;
      sel.innerHTML = '<option value="all">전체 프로젝트</option>';
      projects.forEach(function(p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      if (prev) sel.value = prev;
    });
  }

  function filteredPrompts() {
    return state.allPrompts.filter(function(p) {
      if (state.filterProject !== 'all' && p.projectId !== state.filterProject) return false;
      if (state.filterTool !== 'all' && p.tool !== state.filterTool) return false;
      if (state.filterCategory !== 'all' && p.category !== state.filterCategory) return false;
      if (state.searchText) {
        var haystack = (p.title + ' ' + p.content + ' ' + p.originalKorean + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (!haystack.includes(state.searchText)) return false;
      }
      return true;
    });
  }

  /* ── 렌더링 ── */
  function render() {
    var list = filteredPrompts();
    var container = document.getElementById('prompts-list');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<div class="no-results empty-state"><div class="empty-icon">📋</div><h4>프롬프트가 없습니다</h4><p>AI 봇에서 생성한 프롬프트를 저장하거나<br>직접 추가해보세요.</p></div>';
      return;
    }

    // 즐겨찾기 먼저
    var sorted = list.slice().sort(function(a, b) {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.createdAt - a.createdAt;
    });

    sorted.forEach(function(prompt) {
      container.appendChild(createCard(prompt));
    });
  }

  function createCard(p) {
    var card = document.createElement('div');
    card.className = 'prompt-card' + (p.isFavorite ? ' favorite' : '');
    card.dataset.id = p.id;

    var toolPreset = TOOL_PRESETS[p.tool];
    var toolColor = toolPreset ? toolPreset.color : '#888';
    var catLabel = (CATEGORIES.find(function(c) { return c.id === p.category; }) || {}).label || p.category;

    var tagsHtml = (p.tags || []).map(function(t) {
      return '<span class="tag">' + escHtml(t) + '</span>';
    }).join('');

    var origHtml = p.originalKorean
      ? '<div class="prompt-original"><strong>원문:</strong> ' + escHtml(p.originalKorean) + '</div>'
      : '';

    card.innerHTML =
      '<div class="prompt-card-header">' +
        '<div>' +
          '<div class="prompt-card-title-row">' +
            '<span class="prompt-title">' + escHtml(p.title || '제목 없음') + '</span>' +
            (p.tool ? '<span class="prompt-tool-badge badge" style="background:' + toolColor + '20;color:' + toolColor + ';border:1px solid ' + toolColor + '40">' + escHtml(p.tool) + '</span>' : '') +
            '<span class="prompt-category-badge">' + escHtml(catLabel) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="prompt-card-actions">' +
          '<button class="prompt-action-btn fav-btn' + (p.isFavorite ? ' fav-active' : '') + '" title="즐겨찾기">★</button>' +
          '<button class="prompt-action-btn copy-btn" title="복사">⎘</button>' +
          '<button class="prompt-action-btn edit-btn" title="수정">✎</button>' +
          '<button class="prompt-action-btn del-btn" title="삭제">✕</button>' +
        '</div>' +
      '</div>' +
      origHtml +
      '<div class="prompt-content" id="pc-' + p.id + '">' +
        escHtml(p.content) +
        '<div class="prompt-content-fade"><span class="expand-btn">더 보기</span></div>' +
      '</div>' +
      '<div class="prompt-tags">' + tagsHtml + '</div>';

    // 이벤트
    card.querySelector('.fav-btn').addEventListener('click', function() { toggleFavorite(p); });
    card.querySelector('.copy-btn').addEventListener('click', function() {
      VFXApp.copyText(p.content);
      VFXApp.showToast('복사됨!', 'success');
    });
    card.querySelector('.edit-btn').addEventListener('click', function() { openEditModal(p); });
    card.querySelector('.del-btn').addEventListener('click', function() { deletePrompt(p); });

    var contentEl = card.querySelector('.prompt-content');
    var expandBtn = card.querySelector('.expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', function() {
        contentEl.classList.toggle('expanded');
        var fade = contentEl.querySelector('.prompt-content-fade');
        if (contentEl.classList.contains('expanded')) {
          expandBtn.textContent = '접기';
          if (fade) fade.style.background = 'none';
        } else {
          expandBtn.textContent = '더 보기';
          if (fade) fade.style.background = '';
        }
      });
    }

    return card;
  }

  /* ── 즐겨찾기 ── */
  function toggleFavorite(p) {
    VFXDb.updatePrompt(p.id, { isFavorite: !p.isFavorite }).then(function() {
      return loadAndRender();
    });
  }

  /* ── 삭제 ── */
  function deletePrompt(p) {
    if (!confirm('"' + (p.title || '이 프롬프트') + '"를 삭제할까요?')) return;
    VFXDb.deletePrompt(p.id).then(function() {
      VFXApp.showToast('삭제됨', 'success');
      return loadAndRender();
    });
  }

  /* ── 편집 모달 ── */
  function openEditModal(p) {
    state.editTags = p ? (p.tags || []).slice() : [];
    var isEdit = !!p;

    VFXDb.getProjects().then(function(projects) {
      var projectsHtml = '<option value="global">프로젝트 없음</option>' +
        projects.map(function(proj) {
          return '<option value="' + proj.id + '"' + (p && p.projectId === proj.id ? ' selected' : '') + '>' + escHtml(proj.name) + '</option>';
        }).join('');

      var toolsHtml = '<option value="">툴 선택 안 함</option>' +
        Object.keys(TOOL_PRESETS).map(function(k) {
          return '<option value="' + k + '"' + (p && p.tool === k ? ' selected' : '') + '>' + TOOL_PRESETS[k].name + '</option>';
        }).join('');

      var catHtml = CATEGORIES.map(function(c) {
        return '<option value="' + c.id + '"' + (p && p.category === c.id ? ' selected' : '') + '>' + c.label + '</option>';
      }).join('');

      var html =
        '<div class="modal-overlay" id="prompt-edit-modal">' +
          '<div class="modal modal-lg">' +
            '<div class="modal-header"><h3>' + (isEdit ? '프롬프트 수정' : '프롬프트 추가') + '</h3><button class="icon-btn" id="prompt-modal-close">✕</button></div>' +
            '<div class="modal-body">' +
              '<div class="form-group"><label>제목</label><input type="text" id="pm-title" placeholder="프롬프트 제목" value="' + escHtml(p ? (p.title || '') : '') + '"></div>' +
              '<div class="form-group"><label>프롬프트 (영어)</label><textarea id="pm-content" rows="5" placeholder="영어 프롬프트 내용...">' + escHtml(p ? (p.content || '') : '') + '</textarea></div>' +
              '<div class="form-group"><label>원문 한국어 (선택)</label><input type="text" id="pm-korean" placeholder="원래 한국어 설명" value="' + escHtml(p ? (p.originalKorean || '') : '') + '"></div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
                '<div class="form-group"><label>AI 툴</label><select id="pm-tool">' + toolsHtml + '</select></div>' +
                '<div class="form-group"><label>카테고리</label><select id="pm-category">' + catHtml + '</select></div>' +
                '<div class="form-group"><label>프로젝트</label><select id="pm-project">' + projectsHtml + '</select></div>' +
              '</div>' +
              '<div class="form-group"><label>태그</label>' +
                '<div class="tag-input-row"><input type="text" id="pm-tag-input" placeholder="태그 입력 후 Enter"><button class="btn-secondary" id="pm-tag-add" style="padding:7px 12px">추가</button></div>' +
                '<div class="tags-preview" id="pm-tags-preview"></div>' +
              '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn-secondary" id="pm-cancel">취소</button>' +
              '<button class="btn-primary" id="pm-save">저장</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.insertAdjacentHTML('beforeend', html);
      renderEditTags();

      document.getElementById('prompt-modal-close').addEventListener('click', closeEditModal);
      document.getElementById('pm-cancel').addEventListener('click', closeEditModal);

      var tagInput = document.getElementById('pm-tag-input');
      document.getElementById('pm-tag-add').addEventListener('click', function() { addEditTag(tagInput.value); tagInput.value = ''; });
      tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); addEditTag(tagInput.value); tagInput.value = ''; }
      });

      document.getElementById('pm-save').addEventListener('click', function() {
        savePromptModal(p ? p.id : null);
      });

      document.getElementById('prompt-edit-modal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
      });
    });
  }

  function renderEditTags() {
    var preview = document.getElementById('pm-tags-preview');
    if (!preview) return;
    preview.innerHTML = '';
    state.editTags.forEach(function(tag, i) {
      var span = document.createElement('span');
      span.className = 'tag';
      span.innerHTML = escHtml(tag) + '<button class="tag-remove" data-i="' + i + '">✕</button>';
      span.querySelector('.tag-remove').addEventListener('click', function() {
        state.editTags.splice(i, 1);
        renderEditTags();
      });
      preview.appendChild(span);
    });
  }

  function addEditTag(val) {
    val = val.trim();
    if (!val || state.editTags.includes(val)) return;
    state.editTags.push(val);
    renderEditTags();
  }

  function closeEditModal() {
    var modal = document.getElementById('prompt-edit-modal');
    if (modal) modal.remove();
  }

  function savePromptModal(existingId) {
    var title = document.getElementById('pm-title').value.trim();
    var content = document.getElementById('pm-content').value.trim();
    if (!content) { VFXApp.showToast('프롬프트 내용을 입력해주세요.', 'error'); return; }

    var data = {
      title: title || content.substring(0, 40) + '...',
      content: content,
      originalKorean: document.getElementById('pm-korean').value.trim(),
      tool: document.getElementById('pm-tool').value,
      category: document.getElementById('pm-category').value,
      projectId: document.getElementById('pm-project').value || 'global',
      tags: state.editTags.slice()
    };

    var op = existingId ? VFXDb.updatePrompt(existingId, data) : VFXDb.savePrompt(data);
    op.then(function() {
      closeEditModal();
      VFXApp.showToast(existingId ? '수정됨' : '저장됨!', 'success');
      return loadAndRender();
    });
  }

  /* ── 외부에서 호출: 봇에서 직접 저장 ── */
  function openSaveFromBot(data) {
    openEditModal({
      title: '',
      content: data.content || '',
      originalKorean: '',
      tool: data.tool || '',
      category: 'scene',
      projectId: 'global',
      tags: []
    });
    // 실제 insert가 아니라 modal을 edit 모드 없이 열어야 하므로 null id로 재처리
    // openEditModal은 p가 있으면 update, 없으면 insert
    // 여기선 data를 기본값으로 채운 insert 모달이 필요 → 아래 패치
    var saveBtn = document.getElementById('pm-save');
    if (saveBtn) {
      saveBtn.onclick = function() { savePromptModal(null); };
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

  return {
    init: init,
    reload: reload,
    openSaveFromBot: openSaveFromBot,
    openEditModal: openEditModal,
    updateProjectFilter: updateProjectFilter
  };
})();
