/* VFX Prompt Studio — 프로젝트 아카이브 탭 */
var VFXArchive = (function() {
  var state = {
    projects: [],
    activeProject: null,
    dirHandle: null,
    currentFolder: null,
    subfolders: [],
    allFiles: [],
    memos: {},
    fileFilter: 'all'
  };

  var MEDIA_EXTS = ['jpg','jpeg','png','gif','webp','bmp','tiff','avif','mp4','mov','webm','avi','mkv'];
  var IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','bmp','tiff','avif'];
  var VIDEO_EXTS = ['mp4','mov','webm','avi','mkv'];

  var COLORS = ['#8b5cf6','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#a78bfa','#fb923c'];

  function init() {
    document.getElementById('btn-new-project').addEventListener('click', openNewProjectModal);
    document.getElementById('btn-connect-folder').addEventListener('click', connectFolder);
    document.getElementById('btn-toggle-tree').addEventListener('click', toggleFolderTree);
    document.getElementById('archive-filter-all').addEventListener('click', function() { setFileFilter('all'); });
    document.getElementById('archive-filter-images').addEventListener('click', function() { setFileFilter('image'); });
    document.getElementById('archive-filter-videos').addEventListener('click', function() { setFileFilter('video'); });

    loadProjects();
  }

  /* ═══════════════════════════════
     프로젝트 관리
  ═══════════════════════════════ */
  function loadProjects() {
    VFXDb.getProjects().then(function(projects) {
      state.projects = projects;
      renderProjectList();

      var savedId = localStorage.getItem('vfxapp_active_project');
      if (savedId && projects.find(function(p) { return p.id === savedId; })) {
        selectProject(savedId);
      } else if (projects.length > 0) {
        selectProject(projects[0].id);
      } else {
        renderNoProject();
      }
    });
  }

  function renderProjectList() {
    var list = document.getElementById('project-list');
    list.innerHTML = '';
    state.projects.forEach(function(p) {
      var item = document.createElement('div');
      item.className = 'project-item' + (state.activeProject && state.activeProject.id === p.id ? ' active' : '');
      item.dataset.id = p.id;
      item.innerHTML =
        '<div class="project-color-dot" style="background:' + (p.color || '#8b5cf6') + '"></div>' +
        '<span class="project-name">' + escHtml(p.name) + '</span>';

      item.addEventListener('click', function() { selectProject(p.id); });
      item.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showProjectMenu(p, item);
      });
      list.appendChild(item);
    });
  }

  function selectProject(id) {
    var p = state.projects.find(function(proj) { return proj.id === id; });
    if (!p) return;
    state.activeProject = p;
    state.dirHandle = null;
    state.currentFolder = null;
    state.allFiles = [];
    state.memos = {};

    localStorage.setItem('vfxapp_active_project', id);

    document.querySelectorAll('.project-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.id === id);
    });

    document.getElementById('archive-project-title').textContent = p.name;
    document.getElementById('archive-project-desc').textContent = p.description || '';

    // 메모 로드
    VFXDb.getFileMemosByProject(id).then(function(memos) {
      state.memos = {};
      memos.forEach(function(m) { state.memos[m.filePath] = m; });

      // 저장된 폴더 핸들 복원 시도
      VFXDb.getFolderHandle(id).then(function(handle) {
        if (handle) {
          handle.queryPermission({ mode: 'read' }).then(function(perm) {
            if (perm === 'granted') {
              state.dirHandle = handle;
              state.currentFolder = handle;
              loadFolderContents(handle);
            } else {
              renderNoFolder(true);
            }
          }).catch(function() { renderNoFolder(true); });
        } else {
          renderNoFolder(false);
        }
      });
    });
  }

  function openNewProjectModal(prefill) {
    var html =
      '<div class="modal-overlay" id="project-modal">' +
        '<div class="modal modal-sm">' +
          '<div class="modal-header"><h3>' + (prefill && prefill.id ? '프로젝트 수정' : '새 프로젝트') + '</h3><button class="icon-btn" id="proj-modal-close">✕</button></div>' +
          '<div class="modal-body">' +
            '<div class="form-group"><label>프로젝트 이름</label><input type="text" id="proj-name" placeholder="이름 입력" value="' + escHtml(prefill ? (prefill.name || '') : '') + '"></div>' +
            '<div class="form-group"><label>설명 (선택)</label><input type="text" id="proj-desc" placeholder="간단한 설명" value="' + escHtml(prefill ? (prefill.description || '') : '') + '"></div>' +
            '<div class="form-group"><label>색상</label><div class="color-options" id="color-options">' +
              COLORS.map(function(c) {
                return '<div class="color-dot' + ((!prefill || prefill.color === c) && c === COLORS[0] ? ' selected' : (prefill && prefill.color === c ? ' selected' : '')) + '" data-color="' + c + '" style="background:' + c + '"></div>';
              }).join('') +
            '</div></div>' +
          '</div>' +
          '<div class="modal-footer"><button class="btn-secondary" id="proj-cancel">취소</button><button class="btn-primary" id="proj-save">저장</button></div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    var selected = prefill ? (prefill.color || COLORS[0]) : COLORS[0];
    document.querySelectorAll('.color-dot').forEach(function(dot) {
      dot.classList.toggle('selected', dot.dataset.color === selected);
      dot.addEventListener('click', function() {
        document.querySelectorAll('.color-dot').forEach(function(d) { d.classList.remove('selected'); });
        dot.classList.add('selected');
        selected = dot.dataset.color;
      });
    });

    function close() { document.getElementById('project-modal').remove(); }
    document.getElementById('proj-modal-close').addEventListener('click', close);
    document.getElementById('proj-cancel').addEventListener('click', close);
    document.getElementById('project-modal').addEventListener('click', function(e) { if (e.target === this) close(); });

    document.getElementById('proj-save').addEventListener('click', function() {
      var name = document.getElementById('proj-name').value.trim();
      if (!name) { VFXApp.showToast('이름을 입력해주세요.', 'error'); return; }
      var data = { name: name, description: document.getElementById('proj-desc').value.trim(), color: selected };
      var op = (prefill && prefill.id) ? VFXDb.updateProject(prefill.id, data) : VFXDb.saveProject(data);
      op.then(function() {
        close();
        VFXApp.showToast(prefill && prefill.id ? '수정됨' : '프로젝트 생성!', 'success');
        loadProjects();
        VFXPrompts.updateProjectFilter();
      });
    });

    setTimeout(function() { document.getElementById('proj-name').focus(); }, 50);
  }

  function showProjectMenu(p, el) {
    var existing = document.getElementById('proj-context-menu');
    if (existing) existing.remove();

    var rect = el.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.id = 'proj-context-menu';
    menu.style.cssText = 'position:fixed;left:' + rect.right + 'px;top:' + rect.top + 'px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:4px;z-index:200;box-shadow:var(--shadow);min-width:120px;';
    menu.innerHTML =
      '<button class="btn-ghost" style="width:100%;text-align:left;display:block;padding:7px 12px;font-size:12px">✎ 수정</button>' +
      '<button class="btn-danger" style="width:100%;text-align:left;display:block;padding:7px 12px;font-size:12px">✕ 삭제</button>';

    menu.querySelector('.btn-ghost').addEventListener('click', function() {
      menu.remove();
      openNewProjectModal(p);
    });
    menu.querySelector('.btn-danger').addEventListener('click', function() {
      menu.remove();
      if (!confirm('"' + p.name + '" 프로젝트를 삭제할까요? 관련 메모와 프롬프트도 삭제됩니다.')) return;
      VFXDb.deleteProject(p.id).then(function() {
        VFXApp.showToast('삭제됨', 'success');
        loadProjects();
        VFXPrompts.updateProjectFilter();
      });
    });

    document.body.appendChild(menu);
    setTimeout(function() {
      document.addEventListener('click', function handler() {
        menu.remove();
        document.removeEventListener('click', handler);
      });
    }, 50);
  }

  function renderNoProject() {
    document.getElementById('archive-project-title').textContent = '프로젝트 없음';
    document.getElementById('archive-project-desc').textContent = '';
    document.getElementById('archive-content').innerHTML =
      '<div class="no-project-state"><div class="empty-state"><div class="empty-icon">📁</div><h4>프로젝트가 없습니다</h4><p>왼쪽 상단의 + 버튼으로<br>프로젝트를 만들어보세요.</p></div></div>';
  }

  /* ═══════════════════════════════
     폴더 연결 (File System Access API)
  ═══════════════════════════════ */
  function connectFolder() {
    if (!window.showDirectoryPicker) {
      VFXApp.showToast('이 기능은 Chrome/Edge에서만 동작합니다.', 'error');
      return;
    }
    if (!state.activeProject) {
      VFXApp.showToast('프로젝트를 먼저 선택해주세요.', 'error');
      return;
    }

    window.showDirectoryPicker({ mode: 'read' })
      .then(function(handle) {
        state.dirHandle = handle;
        state.currentFolder = handle;
        VFXDb.saveFolderHandle(state.activeProject.id, handle);
        loadFolderContents(handle);
        VFXApp.showToast('폴더 연결됨: ' + handle.name, 'success');
      })
      .catch(function(err) {
        if (err.name !== 'AbortError') {
          VFXApp.showToast('폴더 열기 실패: ' + err.message, 'error');
        }
      });
  }

  function reRequestPermission() {
    if (!state.dirHandle) return;
    state.dirHandle.requestPermission({ mode: 'read' }).then(function(perm) {
      if (perm === 'granted') {
        state.currentFolder = state.dirHandle;
        loadFolderContents(state.dirHandle);
      } else {
        VFXApp.showToast('폴더 접근 권한이 필요합니다.', 'error');
      }
    });
  }

  function renderNoFolder(hasStored) {
    var content = document.getElementById('archive-content');
    content.innerHTML =
      '<div class="no-folder-state">' +
        '<div class="folder-icon-big">📂</div>' +
        '<h3>폴더를 연결해주세요</h3>' +
        '<p>바탕화면의 프로젝트 폴더를 연결하면<br>이미지와 영상을 바로 불러올 수 있어요.</p>' +
        (hasStored
          ? '<button class="btn-primary" id="btn-re-permission">폴더 권한 재요청</button>'
          : '<button class="btn-primary" id="btn-connect-folder-2">📂 폴더 연결하기</button>') +
        '<div class="browser-note">Chrome 또는 Edge 브라우저에서만 동작합니다.</div>' +
      '</div>';

    if (hasStored) {
      document.getElementById('btn-re-permission').addEventListener('click', reRequestPermission);
    } else {
      document.getElementById('btn-connect-folder-2').addEventListener('click', connectFolder);
    }
  }

  /* ═══════════════════════════════
     폴더 내용 로드
  ═══════════════════════════════ */
  function loadFolderContents(folderHandle) {
    state.allFiles = [];
    state.subfolders = [];

    var filesPromises = [];
    var subfolderHandles = [];

    var iter = folderHandle.entries ? folderHandle.entries() : null;

    function readEntries() {
      if (!iter) return Promise.resolve();
      return iter.next().then(function(result) {
        if (result.done) return;
        var name = result.value[0];
        var handle = result.value[1];
        if (handle.kind === 'directory') {
          subfolderHandles.push({ name: name, handle: handle });
        } else if (handle.kind === 'file') {
          var ext = name.split('.').pop().toLowerCase();
          if (MEDIA_EXTS.indexOf(ext) !== -1) {
            filesPromises.push(
              handle.getFile().then(function(file) {
                return { name: name, file: file, handle: handle, type: getFileType(ext), path: name };
              })
            );
          }
        }
        return readEntries();
      });
    }

    readEntries().then(function() {
      state.subfolders = subfolderHandles;
      renderFolderTree();
      return Promise.all(filesPromises);
    }).then(function(files) {
      state.allFiles = files;
      renderFiles();
    }).catch(function(err) {
      VFXApp.showToast('폴더 읽기 오류: ' + err.message, 'error');
    });
  }

  function getFileType(ext) {
    if (IMAGE_EXTS.indexOf(ext) !== -1) return 'image';
    if (VIDEO_EXTS.indexOf(ext) !== -1) return 'video';
    return 'other';
  }

  /* ═══════════════════════════════
     폴더 트리
  ═══════════════════════════════ */
  function toggleFolderTree() {
    var panel = document.getElementById('folder-tree-panel');
    panel.classList.toggle('visible');
  }

  function renderFolderTree() {
    var tree = document.getElementById('folder-tree');
    if (!tree) return;
    tree.innerHTML = '';

    var root = document.createElement('div');
    root.className = 'folder-tree-node selected';
    root.dataset.path = '';
    root.innerHTML = '<span class="folder-icon">📁</span><span class="folder-label">' + escHtml(state.dirHandle ? state.dirHandle.name : '루트') + '</span>';
    root.addEventListener('click', function() {
      document.querySelectorAll('.folder-tree-node').forEach(function(n) { n.classList.remove('selected'); });
      root.classList.add('selected');
      state.currentFolder = state.dirHandle;
      loadFolderContents(state.dirHandle);
    });
    tree.appendChild(root);

    state.subfolders.forEach(function(sf) {
      var node = document.createElement('div');
      node.className = 'folder-tree-node';
      node.style.paddingLeft = '20px';
      node.innerHTML = '<span class="folder-icon">📂</span><span class="folder-label">' + escHtml(sf.name) + '</span>';
      node.addEventListener('click', function() {
        document.querySelectorAll('.folder-tree-node').forEach(function(n) { n.classList.remove('selected'); });
        node.classList.add('selected');
        state.currentFolder = sf.handle;
        loadFolderContents(sf.handle);
      });
      tree.appendChild(node);
    });
  }

  /* ═══════════════════════════════
     파일 필터 & 렌더링
  ═══════════════════════════════ */
  function setFileFilter(filter) {
    state.fileFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(function(c) {
      c.classList.toggle('active', c.dataset.filter === filter);
    });
    renderFiles();
  }

  function renderFiles() {
    var content = document.getElementById('archive-content');

    var files = state.allFiles.filter(function(f) {
      if (state.fileFilter === 'all') return true;
      return f.type === state.fileFilter;
    });

    if (!state.dirHandle) {
      renderNoFolder(false);
      return;
    }

    content.innerHTML =
      '<div class="archive-content" style="display:flex;flex:1;overflow:hidden">' +
        '<div id="folder-tree-panel" class="folder-tree-panel">' +
          '<div class="folder-tree-header">폴더</div>' +
          '<div id="folder-tree"></div>' +
        '</div>' +
        '<div class="files-container">' +
          '<div class="files-grid" id="files-grid"></div>' +
        '</div>' +
      '</div>';

    renderFolderTree();

    if (files.length === 0) {
      document.getElementById('files-grid').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🖼️</div><h4>파일 없음</h4><p>이 폴더에 이미지나 영상 파일이 없습니다.</p></div>';
      return;
    }

    var grid = document.getElementById('files-grid');
    files.forEach(function(f) {
      grid.appendChild(createFileCard(f));
    });
  }

  function createFileCard(f) {
    var card = document.createElement('div');
    card.className = 'file-card';

    var memo = state.memos[f.path] || {};
    var toolBadge = memo.tool ? '<span class="file-tool-badge">' + escHtml(memo.tool) + '</span>' : '';

    var thumbHtml;
    if (f.type === 'image') {
      var url = URL.createObjectURL(f.file);
      thumbHtml = '<div class="file-thumb"><img src="' + url + '" alt="' + escHtml(f.name) + '" loading="lazy"></div>';
    } else {
      thumbHtml = '<div class="file-thumb"><span class="thumb-placeholder">🎬</span><span class="video-badge">VIDEO</span></div>';
    }

    card.innerHTML =
      thumbHtml +
      '<div class="file-info">' +
        '<div class="file-name">' + escHtml(f.name) + '</div>' +
        toolBadge +
      '</div>';

    card.addEventListener('click', function() { openFileModal(f); });

    if (f.type === 'video') {
      generateVideoThumb(f, card);
    }

    return card;
  }

  function generateVideoThumb(f, card) {
    var url = URL.createObjectURL(f.file);
    var video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.preload = 'metadata';
    video.addEventListener('loadeddata', function() {
      video.currentTime = 0.5;
    });
    video.addEventListener('seeked', function() {
      var canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      canvas.getContext('2d').drawImage(video, 0, 0, 320, 180);
      var thumbEl = card.querySelector('.file-thumb');
      if (thumbEl) {
        thumbEl.innerHTML = '<img src="' + canvas.toDataURL('image/jpeg', 0.7) + '" alt="thumb"><span class="video-badge">VIDEO</span>';
      }
      URL.revokeObjectURL(url);
    });
  }

  /* ═══════════════════════════════
     파일 미리보기 모달
  ═══════════════════════════════ */
  function openFileModal(f) {
    var memo = state.memos[f.path] || {};
    var url = URL.createObjectURL(f.file);

    var mediaHtml;
    if (f.type === 'image') {
      mediaHtml = '<img src="' + url + '" alt="' + escHtml(f.name) + '">';
    } else {
      mediaHtml = '<video src="' + url + '" controls style="max-width:100%;max-height:360px"></video>';
    }

    var toolOptions = '<option value="">툴 없음</option>' +
      Object.keys(TOOL_PRESETS).map(function(k) {
        return '<option value="' + k + '"' + (memo.tool === k ? ' selected' : '') + '>' + TOOL_PRESETS[k].name + '</option>';
      }).join('');

    var html =
      '<div class="modal-overlay" id="file-modal">' +
        '<div class="modal modal-lg">' +
          '<div class="modal-header"><h3>' + escHtml(f.name) + '</h3><button class="icon-btn" id="file-modal-close">✕</button></div>' +
          '<div class="modal-body">' +
            '<div class="file-preview-area">' + mediaHtml + '</div>' +
            '<div class="form-group"><label>사용 AI 툴</label><select id="fm-tool">' + toolOptions + '</select></div>' +
            '<div class="form-group"><label>메모</label><textarea id="fm-memo" rows="3" placeholder="사용한 세팅, 프롬프트 번호 등...">' + escHtml(memo.memo || '') + '</textarea></div>' +
          '</div>' +
          '<div class="modal-footer"><button class="btn-secondary" id="fm-cancel">닫기</button><button class="btn-primary" id="fm-save">저장</button></div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    function close() {
      URL.revokeObjectURL(url);
      document.getElementById('file-modal').remove();
    }

    document.getElementById('file-modal-close').addEventListener('click', close);
    document.getElementById('fm-cancel').addEventListener('click', close);
    document.getElementById('file-modal').addEventListener('click', function(e) { if (e.target === this) close(); });

    document.getElementById('fm-save').addEventListener('click', function() {
      var memoId = memo.id || (state.activeProject.id + '_' + f.path);
      VFXDb.updateFileMemo(memoId, {
        projectId: state.activeProject.id,
        filePath: f.path,
        memo: document.getElementById('fm-memo').value.trim(),
        tool: document.getElementById('fm-tool').value
      }).then(function(updated) {
        state.memos[f.path] = updated;
        close();
        VFXApp.showToast('저장됨', 'success');
        renderFiles();
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

  return {
    init: init,
    reload: loadProjects
  };
})();
