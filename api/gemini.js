// api/gemini.js — Vercel serverless function
// Proxies the browser to Gemini 2.0 Flash. API key stays server-side.
// Set GEMINI_API_KEY in Vercel project env vars.

export default async function handler(req, res) {
  // CORS — same-origin in production, useful for local dev too
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'NO_KEY',
      message: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다. Vercel 프로젝트 → Settings → Environment Variables에서 추가하세요.',
    });
  }

  // Parse body (Vercel auto-parses JSON if Content-Type is set)
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { messages = [], systemPrompt = '', model = 'gemini-2.5-flash' } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] required' });
  }

  const contents = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'bot' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
  };
  if (systemPrompt) {
    payload.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'UPSTREAM',
        status: upstream.status,
        detail: data?.error?.message || JSON.stringify(data).slice(0, 400),
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const finishReason = data?.candidates?.[0]?.finishReason;

    return res.status(200).json({ text, finishReason });
  } catch (err) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: String(err) });
  }
}
