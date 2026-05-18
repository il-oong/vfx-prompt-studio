/* ───────────────────────────────────────────────────────────────
   js/bot.js
   Studio tab. The bot is the *home* of the app.
   - Renders the conversation feed + composer + tool selector
   - Posts to /api/gemini (Vercel serverless using env var key)
   - Persists messages to IndexedDB `chat` store keyed by project
   - History sidebar: past messages on left, current session on right
   Exposes: window.Bot = { render(host), open(), reset() }
   ─────────────────────────────────────────────────────────────── */

(function () {
  let state = {
    msgs: [],      // current session messages (empty on open)
    history: [],   // messages loaded from DB on open
    pending: false,
    toolId: 'runway',
    projectId: null,
    composerDraft: '',
  };

  let elContent = null;

  async function loadHistory(projectId) {
    if (!projectId) return [];
    const rows = await window.VFXDB.all('chat', 'projectId', projectId);
    return rows.sort((a, b) => a.ts - b.ts);
  }

  async function persistMsg(m) {
    if (!state.projectId) return;
    return window.VFXDB.put('chat', { ...m, projectId: state.projectId });
  }

  async function callGemini(messages, toolId) {
    const tool = window.TOOL_PRESETS[toolId];
    const sys =
      window.BASE_SYSTEM_PROMPT +
      '\n\n[TOOL: ' + tool.label + ']\n' + tool.suffix;

    // Vercel function
    const r = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt: sys }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const code = data.error || ('HTTP ' + r.status);
      const detail = data.message || data.detail || '';
      throw new Error(code + (detail ? ' — ' + detail : ''));
    }
    return data.text || '';
  }

  async function send(text) {
    text = (text || '').trim();
    if (!text || state.pending) return;
    if (!state.projectId) {
      window.App?.toast('먼저 프로젝트를 만들어 주세요');
      window.App?.openNewProjectModal?.();
      return;
    }
    const userMsg = { id: window.VFXDB.uid(), role: 'user', text, ts: Date.now() };
    state.msgs.push(userMsg);
    state.composerDraft = '';
    state.pending = true;
    await persistMsg(userMsg);
    render();

    try {
      // include history for context
      const contextMsgs = [...state.history, ...state.msgs];
      const reply = await callGemini(contextMsgs, state.toolId);
      const botMsg = {
        id: window.VFXDB.uid(),
        role: 'bot',
        text: reply,
        tool: state.toolId,
        ts: Date.now(),
      };
      state.msgs.push(botMsg);
      await persistMsg(botMsg);
    } catch (err) {
      const botMsg = {
        id: window.VFXDB.uid(),
        role: 'bot',
        text: '⚠ ' + err.message,
        tool: state.toolId,
        ts: Date.now(),
        error: true,
      };
      state.msgs.push(botMsg);
      await persistMsg(botMsg);
    } finally {
      state.pending = false;
      render();
    }
  }

  function escape(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return '오늘';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return '어제';
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  // Build exchange pairs (user + bot) from a flat message list
  function toExchanges(msgs) {
    const exchanges = [];
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].role === 'user') {
        const bot = msgs[i + 1]?.role === 'bot' ? msgs[i + 1] : null;
        exchanges.push({ user: msgs[i], bot });
        if (bot) i++;
      }
    }
    return exchanges;
  }

  function renderHistoryPanel() {
    if (!state.projectId) return '';
    const exchanges = toExchanges(state.history);

    if (exchanges.length === 0) {
      return `
        <aside class="bot-hist">
          <div class="bot-hist-head">History</div>
          <div class="bot-hist-empty">이전 대화 없음</div>
        </aside>`;
    }

    // Group exchanges by date
    const groups = {};
    const groupOrder = [];
    exchanges.forEach((ex) => {
      const key = fmtDate(ex.user.ts);
      if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
      groups[key].push(ex);
    });

    const listHtml = groupOrder.map((key) => `
      <div class="bot-hist-date">${escape(key)}</div>
      ${groups[key].map((ex) => {
        const preview = ex.user.text.length > 28
          ? ex.user.text.slice(0, 28) + '…'
          : ex.user.text;
        const botPreview = ex.bot
          ? (ex.bot.error
            ? `<div class="bot-hist-bot is-error">⚠ 오류</div>`
            : `<div class="bot-hist-bot">${escape(ex.bot.text.slice(0, 32))}…</div>`)
          : '';
        return `
          <div class="bot-hist-item">
            <div class="bot-hist-time">${fmtTime(ex.user.ts)}</div>
            <div class="bot-hist-user">${escape(preview)}</div>
            ${botPreview}
          </div>`;
      }).join('')}
    `).join('');

    return `
      <aside class="bot-hist">
        <div class="bot-hist-head">History</div>
        <div class="bot-hist-list">${listHtml}</div>
      </aside>`;
  }

  function renderMsg(m, idx) {
    const tool = window.TOOL_PRESETS[m.tool] || window.TOOL_PRESETS.runway;
    if (m.role === 'user') {
      return `
        <div class="msg msg--user">
          <div class="msg-avatar msg-avatar--user">나</div>
          <div class="msg-body">
            <div class="msg-meta"><span>You</span><span class="msg-time">${fmtTime(m.ts)}</span></div>
            <div class="msg-text">${escape(m.text)}</div>
          </div>
        </div>`;
    }
    return `
      <div class="msg msg--bot">
        <div class="msg-avatar msg-avatar--bot"></div>
        <div class="msg-body">
          <div class="msg-meta">
            <span>Gemini</span>
            <span class="chip chip--accent" style="font-size:10px;padding:2px 7px;">${escape(tool.name.toUpperCase())}</span>
            <span class="msg-time">${fmtTime(m.ts)}</span>
          </div>
          <div class="msg-prompt ${m.error ? 'msg-prompt--error' : ''}">${escape(m.text)}</div>
          ${m.error ? '' : `
          <div class="msg-actions">
            <button class="btn btn--sm" data-act="copy" data-i="${idx}">⎘ Copy</button>
            <button class="btn btn--sm" data-act="save" data-i="${idx}">+ Prompts 에 저장</button>
            <button class="btn btn--sm btn--ghost" data-act="regen" data-i="${idx}">↺ 다시 생성</button>
          </div>`}
        </div>
      </div>`;
  }

  function renderToolButtons() {
    return window.TOOL_ORDER.map((id) => {
      const t = window.TOOL_PRESETS[id];
      const active = id === state.toolId;
      return `<button class="chip ${active ? 'is-active' : ''}" data-tool="${id}" title="${escape(t.desc)}">${escape(t.name)}</button>`;
    }).join('');
  }

  function renderConversation() {
    if (!state.projectId) {
      return `
        <div class="empty">
          <div class="empty-icon">✦</div>
          <h3>프로젝트 먼저 만들어 볼까요</h3>
          <p>대화를 프로젝트별로 저장합니다. 좌상단에서 새 프로젝트를 만드세요.</p>
          <button class="btn btn--primary" id="bot-make-project">+ 새 프로젝트</button>
        </div>`;
    }
    if (state.msgs.length === 0) {
      return `
        <div class="bot-empty">
          <div class="eyebrow eyebrow--amber">✦ Studio · Gemini 2.0 Flash</div>
          <h1 class="hero">What are we shooting today?</h1>
          <p class="subtitle">한국어로 장면을 묘사하면, 선택한 툴에 맞는 영어 VFX 프롬프트로 변환해 줘요.</p>
          <div class="bot-suggest">
            <div class="eyebrow eyebrow--muted">시도해 보기</div>
            <div class="bot-suggest-row">
              ${[
                '야간 도심 드론샷, 비 내린 직후 네온 반사',
                '메카닉 풀샷 스튜디오 라이팅',
                '안개 낀 새벽 산자락 드론',
                '네온사인 깜빡임 매크로',
                '도쿄 시부야 횡단보도 인파',
                '황금시간대 해안가 파도 슬로우모션',
                '빙하 위 탐험가 항공샷',
                '실험실 유리 파편 폭발 클로즈업',
              ].map((s) => `<button class="chip" data-suggest="${escape(s)}">${escape(s)}</button>`).join('')}
            </div>
          </div>
        </div>`;
    }
    return `<div class="bot-feed">${state.msgs.map(renderMsg).join('')}${state.pending ? renderPending() : ''}</div>`;
  }

  function renderPending() {
    const tool = window.TOOL_PRESETS[state.toolId];
    return `
      <div class="msg msg--bot">
        <div class="msg-avatar msg-avatar--bot"></div>
        <div class="msg-body">
          <div class="msg-meta"><span>Gemini</span><span class="chip chip--accent" style="font-size:10px;padding:2px 7px;">${escape(tool.name.toUpperCase())}</span></div>
          <div class="msg-pending"><span></span><span></span><span></span></div>
        </div>
      </div>`;
  }

  function render() {
    if (!elContent) return;
    elContent.innerHTML = `
      <div class="bot-shell">
        ${renderHistoryPanel()}
        <div class="bot-main">
          <div class="bot-scroll" id="bot-scroll">
            <div class="bot-inner">
              ${renderConversation()}
            </div>
          </div>
          <div class="bot-composer">
            <div class="bot-inner">
              <div class="composer">
                <textarea
                  class="composer-input"
                  id="composer-input"
                  placeholder="장면을 한국어로 묘사하세요…  ⌘ + Enter 로 전송"
                  rows="2">${escape(state.composerDraft)}</textarea>
                <div class="composer-row">
                  <div class="composer-tools">
                    ${renderToolButtons()}
                  </div>
                  <button class="btn btn--primary" id="composer-send" ${state.pending ? 'disabled' : ''}>
                    ${state.pending ? '생성 중…' : '전송 →'}
                  </button>
                </div>
              </div>
              <div class="bot-shortcuts">
                <span class="kbd">⌘ Enter</span> 전송
                <span class="bot-shortcut-sep">·</span>
                <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span><span class="kbd">4</span> 탭 전환
                <span class="bot-shortcut-sep">·</span>
                <span class="kbd">⌘ K</span> 포커스
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const scroll = elContent.querySelector('#bot-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;

    elContent.querySelectorAll('[data-suggest]').forEach((el) => {
      el.addEventListener('click', () => send(el.getAttribute('data-suggest')));
    });

    elContent.querySelectorAll('[data-tool]').forEach((el) => {
      el.addEventListener('click', () => {
        state.toolId = el.getAttribute('data-tool');
        render();
      });
    });

    const ta = elContent.querySelector('#composer-input');
    if (ta) {
      ta.addEventListener('input', (e) => { state.composerDraft = e.target.value; });
      ta.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          send(ta.value);
        }
      });
      if (state.msgs.length === 0) ta.focus();
    }

    const sendBtn = elContent.querySelector('#composer-send');
    if (sendBtn) sendBtn.addEventListener('click', () => {
      const ta = elContent.querySelector('#composer-input');
      send(ta ? ta.value : '');
    });

    const mk = elContent.querySelector('#bot-make-project');
    if (mk) mk.addEventListener('click', () => window.App?.openNewProjectModal?.());

    elContent.querySelectorAll('[data-act]').forEach((el) => {
      const i = +el.getAttribute('data-i');
      const act = el.getAttribute('data-act');
      const m = state.msgs[i];
      if (!m) return;
      el.addEventListener('click', () => {
        if (act === 'copy') {
          navigator.clipboard?.writeText(m.text).then(() => window.App?.toast('복사됐어요'));
        } else if (act === 'save') {
          window.Prompts?.saveFromBot({
            content: m.text,
            tool: m.tool,
            originalKorean: state.msgs[i - 1]?.text || '',
          });
          window.App?.toast('Prompts 에 저장됨');
        } else if (act === 'regen') {
          const prev = state.msgs[i - 1];
          state.msgs = state.msgs.slice(0, i);
          render();
          if (prev && prev.role === 'user') send(prev.text);
        }
      });
    });
  }

  async function open(projectId) {
    state.projectId = projectId || null;
    const all = state.projectId ? await loadHistory(state.projectId) : [];
    state.history = all;  // past messages → sidebar
    state.msgs = [];       // current session starts fresh
    state.pending = false;
    const lastTool = await window.VFXDB.getSetting('lastTool');
    if (lastTool && window.TOOL_PRESETS[lastTool]) state.toolId = lastTool;
  }

  function setHost(host) { elContent = host; render(); }

  async function reset() {
    if (!state.projectId) return;
    if (!confirm('이 프로젝트의 대화 기록을 모두 지울까요?')) return;
    const all = await window.VFXDB.all('chat', 'projectId', state.projectId);
    for (const m of all) await window.VFXDB.delete('chat', m.id);
    state.history = [];
    state.msgs = [];
    render();
  }

  window.Bot = {
    render: setHost,
    open,
    reset,
    setTool: (id) => { if (window.TOOL_PRESETS[id]) { state.toolId = id; render(); } },
  };
})();
