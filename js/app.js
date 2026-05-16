/* VFX Prompt Studio — 앱 메인 */
var VFXApp = (function() {

  /* ── 탭 전환 ── */
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchTab(btn.dataset.tab);
      });
    });

    var savedTab = localStorage.getItem('vfxapp_active_tab') || 'guide';
    switchTab(savedTab);
  }

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === tab + '-panel');
    });
    localStorage.setItem('vfxapp_active_tab', tab);
  }

  /* ── 토스트 ── */
  function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2800);
  }

  /* ── 클립보드 복사 (file:// 폴백 포함) ── */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(function() { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  /* ── API 키 모달 ── */
  function showApiKeyModal(onSuccess) {
    if (document.getElementById('api-key-modal')) return;

    var html =
      '<div class="modal-overlay" id="api-key-modal">' +
        '<div class="modal modal-sm">' +
          '<div class="modal-header"><h3>Gemini API 키 설정</h3></div>' +
          '<div class="modal-body">' +
            '<div class="api-key-info">' +
              '<strong>⚠️ 보안 안내</strong><br>' +
              'API 키는 이 브라우저에만 저장됩니다. 공용 PC에서 사용 후 반드시 키를 삭제해주세요.' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Gemini API Key</label>' +
              '<input type="password" id="api-key-input" placeholder="AIza...">' +
            '</div>' +
            '<p style="font-size:12px;color:var(--text3)">Google AI Studio (aistudio.google.com)에서 무료로 발급받을 수 있습니다.</p>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn-secondary" id="api-key-cancel">취소</button>' +
            '<button class="btn-primary" id="api-key-confirm">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    setTimeout(function() { document.getElementById('api-key-input').focus(); }, 50);

    document.getElementById('api-key-cancel').addEventListener('click', function() {
      document.getElementById('api-key-modal').remove();
    });

    document.getElementById('api-key-confirm').addEventListener('click', function() {
      var key = document.getElementById('api-key-input').value.trim();
      if (!key) { showToast('API 키를 입력해주세요.', 'error'); return; }
      localStorage.setItem('vfxapp_gemini_key', key);
      document.getElementById('api-key-modal').remove();
      showToast('API 키 저장됨!', 'success');
      if (typeof onSuccess === 'function') onSuccess();
    });
  }

  /* ── 설정 모달 ── */
  function showSettingsModal() {
    var hasKey = !!localStorage.getItem('vfxapp_gemini_key');
    var html =
      '<div class="modal-overlay" id="settings-modal">' +
        '<div class="modal modal-sm">' +
          '<div class="modal-header"><h3>설정</h3><button class="icon-btn" id="settings-close">✕</button></div>' +
          '<div class="modal-body">' +
            '<div class="form-group">' +
              '<label>Gemini API 키</label>' +
              '<div style="display:flex;gap:8px">' +
                '<input type="password" id="settings-api-key" placeholder="AIza..." value="' + (hasKey ? '••••••••••••••••' : '') + '" style="flex:1">' +
                (hasKey ? '<button class="btn-danger" id="settings-del-key" style="white-space:nowrap;padding:7px 12px;border:1px solid var(--red)">삭제</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn-secondary" id="settings-cancel">취소</button>' +
            '<button class="btn-primary" id="settings-save">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    function close() { document.getElementById('settings-modal').remove(); }
    document.getElementById('settings-close').addEventListener('click', close);
    document.getElementById('settings-cancel').addEventListener('click', close);
    document.getElementById('settings-modal').addEventListener('click', function(e) { if (e.target === this) close(); });

    var delBtn = document.getElementById('settings-del-key');
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        if (confirm('API 키를 삭제할까요?')) {
          localStorage.removeItem('vfxapp_gemini_key');
          close();
          showToast('API 키 삭제됨', 'success');
        }
      });
    }

    document.getElementById('settings-save').addEventListener('click', function() {
      var val = document.getElementById('settings-api-key').value.trim();
      if (val && val !== '••••••••••••••••') {
        localStorage.setItem('vfxapp_gemini_key', val);
        showToast('저장됨!', 'success');
      }
      close();
    });
  }

  /* ── 봇에서 프롬프트 저장 ── */
  function openSavePromptModal(data) {
    VFXPrompts.openEditModal({
      title: '',
      content: data.content || '',
      originalKorean: '',
      tool: data.tool || '',
      category: 'scene',
      projectId: 'global',
      tags: [],
      isFavorite: false
    });
    // insert 모드로: id가 없으면 savePromptModal(null) 동작
    setTimeout(function() {
      var saveBtn = document.getElementById('pm-save');
      if (saveBtn) {
        var original = saveBtn.onclick;
        saveBtn.onclick = function() {
          // null id → insert
          var title = document.getElementById('pm-title').value.trim();
          var content = document.getElementById('pm-content').value.trim();
          if (!content) { showToast('프롬프트 내용을 입력해주세요.', 'error'); return; }
          VFXDb.savePrompt({
            title: title || content.substring(0, 40) + '...',
            content: content,
            originalKorean: document.getElementById('pm-korean').value.trim(),
            tool: document.getElementById('pm-tool').value,
            category: document.getElementById('pm-category').value,
            projectId: document.getElementById('pm-project').value || 'global',
            tags: VFXPrompts._editTags || []
          }).then(function() {
            document.getElementById('prompt-edit-modal').remove();
            showToast('프롬프트 저장됨!', 'success');
            VFXPrompts.reload();
          });
        };
      }
    }, 100);
  }

  /* ── 초기화 ── */
  function init() {
    VFXDb.open().then(function() {
      initTabs();
      VFXGuide.init();
      VFXArchive.init();
      VFXPrompts.init();
      VFXBot.init();

      document.getElementById('btn-settings').addEventListener('click', showSettingsModal);

      // API 키 없으면 첫 안내
      if (!localStorage.getItem('vfxapp_gemini_key')) {
        setTimeout(function() {
          showToast('하단 AI 봇을 사용하려면 Gemini API 키를 설정해주세요.', 'warning');
        }, 1000);
      }
    }).catch(function(err) {
      document.body.innerHTML = '<div style="padding:40px;color:#f87171;font-family:sans-serif">IndexedDB 초기화 실패: ' + err.message + '<br>Chrome 또는 Edge 브라우저를 사용해주세요.</div>';
    });
  }

  return {
    init: init,
    showToast: showToast,
    copyText: copyText,
    showApiKeyModal: showApiKeyModal,
    openSavePromptModal: openSavePromptModal,
    switchTab: switchTab
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  VFXApp.init();
});
