// api/analyze-style.js
// Fetches a YouTube thumbnail, analyzes its visual style with Gemini Vision,
// and returns JSON filter params for the Travel Video tab.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NO_KEY' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { videoUrl } = body;
  if (!videoUrl) return res.status(400).json({ error: 'videoUrl required' });

  let thumbnailBase64 = null;
  let thumbnailMime = 'image/jpeg';
  let platformHint = '';

  try {
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        platformHint = `YouTube: "${oembed.title}" by ${oembed.author_name}`;
        if (oembed.thumbnail_url) {
          const thumbRes = await fetch(oembed.thumbnail_url);
          if (thumbRes.ok) {
            const buf = await thumbRes.arrayBuffer();
            thumbnailBase64 = Buffer.from(buf).toString('base64');
            thumbnailMime = thumbRes.headers.get('content-type') || 'image/jpeg';
          }
        }
      }
    } else if (videoUrl.includes('instagram.com')) {
      platformHint = 'Instagram reel/video';
    } else if (videoUrl.includes('tiktok.com')) {
      platformHint = 'TikTok video';
    } else if (videoUrl.includes('vimeo.com')) {
      platformHint = 'Vimeo video';
    }
  } catch (_) {
    // proceed without thumbnail
  }

  const stylePrompt = `Analyze the visual/color style of this travel video${platformHint ? ` (${platformHint})` : ''}.
Return ONLY valid JSON — no markdown, no explanation, no code block.

{
  "brightness": 100,
  "contrast": 100,
  "saturation": 100,
  "hue": 0,
  "warmth": 0,
  "filterName": "Natural",
  "mood": "따뜻하고 자연스러운",
  "colorGrade": "warm film",
  "textColor": "#ffffff",
  "textFont": "serif",
  "transitionStyle": "fade"
}

Ranges:
- brightness 80–130  (100=neutral, 110=slightly bright)
- contrast   80–120  (100=neutral, 90=soft)
- saturation 60–120  (100=neutral, 80=muted film)
- hue        -20 to 20  (color shift in degrees)
- warmth     -30 to 30  (negative=cool/blue, positive=warm/orange)
- filterName: short English name like "Film Fade", "Golden Hour", "Cinematic Teal"
- mood: Korean 2–4 word vibe description
- colorGrade: brief English description
- textColor: #ffffff or #000000 or #f5e6d3 etc
- textFont: "serif" or "sans-serif"`;

  const parts = [];
  if (thumbnailBase64) {
    parts.push({ inline_data: { mime_type: thumbnailMime, data: thumbnailBase64 } });
  }
  parts.push({ text: stylePrompt });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'UPSTREAM' });

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ style: defaultStyle() });

    const style = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ style, platformHint });
  } catch (err) {
    return res.status(200).json({ style: defaultStyle(), error: String(err) });
  }
}

function defaultStyle() {
  return {
    brightness: 105, contrast: 92, saturation: 82, hue: 0, warmth: 12,
    filterName: 'Warm Memory', mood: '따뜻하고 필름 감성',
    colorGrade: 'warm desaturated film', textColor: '#ffffff',
    textFont: 'serif', transitionStyle: 'fade',
  };
}
