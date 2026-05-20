// api/vision.js — Vercel serverless function
// Receives base64 image, calls Gemini Vision, returns subject description.
// Reuses GEMINI_API_KEY from Vercel environment variables.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'NO_KEY',
      message: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { imageBase64, mimeType = 'image/jpeg' } = body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const systemPrompt = 'Describe the main visual subject of this image in 3-8 concise English words, suitable as a VFX video/image prompt subject (e.g. "armored warrior standing in ruins", "lone astronaut floating in space", "neon-lit city street at night"). Output ONLY the description, lowercase, no quotes, no explanation.';

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: imageBase64 } },
        { text: systemPrompt },
      ],
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 64 },
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
    return res.status(200).json({ text: text.trim().replace(/\.$/, '') });
  } catch (err) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: String(err) });
  }
}
