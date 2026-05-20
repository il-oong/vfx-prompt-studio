// api/image.js — Vercel serverless function for Gemini image generation (Nano Banana).
// Uses the same GEMINI_API_KEY as /api/gemini. Returns a base64 image.

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
  const { prompt = '', model = 'gemini-2.5-flash-image-preview' } = body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt required' });
  }

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 0.9,
    },
  };

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

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart) {
      const textPart = parts.find((p) => p.text)?.text || '';
      return res.status(502).json({
        error: 'NO_IMAGE',
        detail: textPart || '모델이 이미지를 반환하지 않았습니다.',
      });
    }

    return res.status(200).json({
      data: imagePart.inlineData.data,
      mime: imagePart.inlineData.mimeType || 'image/png',
    });
  } catch (err) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: String(err) });
  }
}
