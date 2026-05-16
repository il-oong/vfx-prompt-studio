/* VFX Prompt Studio — AI 봇 (Gemini 2.0 Flash) */
var VFXBot = (function() {
  var panel = null;
  var messagesEl = null;
  var inputEl = null;
  var toolSelect = null;
  var sendBtn = null;
  var isLoading = false;
  var welcomeEl = null;

  var GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  function init() {
    panel = document.getElementById('bot-panel');
    messagesEl = document.getElementById('bot-messages');
    inputEl = document.getElementById('bot-input');
    toolSelect = document.getElementById('bot-tool-select');
    sendBtn = document.getElementById('bot-send-btn');
    welcomeEl = document.getElementById('bot-welcome');

    document.getElementById('bot-toggle').addEventListener('click', togglePanel);
    document.getElementById('bot-close').addEventListener('click', closePanel);
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    inputEl.addEventListener('input', function() {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
    });

    document.getElementById('bot-clear').addEventListener('click', clearMessages);

    // 예시 프롬프트 버튼
    var examples = document.querySelectorAll('.bot-example-btn');
    examples.forEach(function(btn) {
      btn.addEventListener('click', function() {
        inputEl.value = btn.dataset.prompt;
        inputEl.focus();
        hideWelcome();
      });
    });

    // 상태 복원
    var savedOpen = localStorage.getItem('vfxapp_bot_open') === 'true';
    if (savedOpen) panel.classList.remove('hidden');

    var savedTool = localStorage.getItem('vfxapp_bot_tool') || 'Runway';
    if (toolSelect) toolSelect.value = savedTool;

    toolSelect.addEventListener('change', function() {
      localStorage.setItem('vfxapp_bot_tool', toolSelect.value);
    });
  }

  function togglePanel() {
    var isHidden = panel.classList.toggle('hidden');
    localStorage.setItem('vfxapp_bot_open', !isHidden);
    if (!isHidden) inputEl.focus();
  }

  function closePanel() {
    panel.classList.add('hidden');
    localStorage.setItem('vfxapp_bot_open', 'false');
  }

  function hideWelcome() {
    if (welcomeEl) {
      welcomeEl.style.display = 'none';
    }
  }

  function clearMessages() {
    messagesEl.innerHTML = '';
    if (welcomeEl) {
      welcomeEl.style.display = 'flex';
    }
  }

  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || isLoading) return;

    var apiKey = localStorage.getItem('vfxapp_gemini_key');
    if (!apiKey) {
      VFXApp.showApiKeyModal(function() { handleSend(); });
      return;
    }

    hideWelcome();
    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';

    var tool = toolSelect ? toolSelect.value : 'Runway';
    sendToGemini(text, tool, apiKey);
  }

  function addMessage(role, content, isPrompt) {
    var div = document.createElement('div');
    div.className = 'bot-message ' + role;

    var bubble = document.createElement('div');
    bubble.className = 'message-bubble' + (isPrompt ? ' is-prompt' : '');
    bubble.textContent = content;
    div.appendChild(bubble);

    if (role === 'assistant' && isPrompt) {
      var actions = document.createElement('div');
      actions.className = 'message-actions';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'msg-action-btn';
      copyBtn.textContent = '복사';
      copyBtn.addEventListener('click', function() {
        VFXApp.copyText(content);
        copyBtn.textContent = '완료!';
        setTimeout(function() { copyBtn.textContent = '복사'; }, 1500);
      });

      var saveBtn = document.createElement('button');
      saveBtn.className = 'msg-action-btn';
      saveBtn.textContent = '저장';
      saveBtn.addEventListener('click', function() {
        var tool = toolSelect ? toolSelect.value : '';
        VFXApp.openSavePromptModal({ content: content, tool: tool, fromBot: true });
        saveBtn.textContent = '저장됨!';
        setTimeout(function() { saveBtn.textContent = '저장'; }, 2000);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(saveBtn);
      div.appendChild(actions);
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addTypingIndicator() {
    var div = document.createElement('div');
    div.className = 'bot-message assistant';
    div.id = 'bot-typing';
    var bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    div.appendChild(bubble);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function removeTypingIndicator() {
    var el = document.getElementById('bot-typing');
    if (el) el.remove();
  }

  function sendToGemini(userText, tool, apiKey) {
    isLoading = true;
    sendBtn.disabled = true;
    var typingEl = addTypingIndicator();

    var systemPrompt = buildSystemPrompt(tool);

    var body = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512
      }
    };

    fetch(GEMINI_ENDPOINT + '?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function(res) {
      if (!res.ok) {
        return res.json().then(function(err) {
          throw new Error(err.error && err.error.message ? err.error.message : 'API 오류 ' + res.status);
        });
      }
      return res.json();
    })
    .then(function(data) {
      removeTypingIndicator();
      var text = '';
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        var parts = data.candidates[0].content.parts;
        text = parts.map(function(p) { return p.text || ''; }).join('').trim();
      }
      if (!text) throw new Error('응답이 비어 있습니다.');
      addMessage('assistant', text, true);
    })
    .catch(function(err) {
      removeTypingIndicator();
      var msg = err.message || '알 수 없는 오류';
      if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        msg = 'API 키가 유효하지 않습니다. 설정에서 키를 다시 입력해주세요.';
        localStorage.removeItem('vfxapp_gemini_key');
      }
      addMessage('assistant', '오류: ' + msg, false);
      VFXApp.showToast(msg, 'error');
    })
    .finally(function() {
      isLoading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  return {
    init: init,
    closePanel: closePanel
  };
})();
