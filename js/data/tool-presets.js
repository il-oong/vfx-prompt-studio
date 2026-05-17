/* ───────────────────────────────────────────────────────────────
   js/data/tool-presets.js
   AI VFX tool definitions + system-prompt suffixes for each tool.
   Loaded as global window.TOOL_PRESETS and window.BASE_SYSTEM_PROMPT.
   ─────────────────────────────────────────────────────────────── */

window.TOOL_PRESETS = {
  runway: {
    id: 'runway',
    name: 'Runway',
    label: 'Runway Gen-3',
    desc: '연속 카메라 무브, 영상 10초',
    color: 'emerald',
    suffix: 'Continuous camera move with strong motion intent. Format as a single descriptive paragraph. Target length: 10 seconds.',
  },
  kling: {
    id: 'kling',
    name: 'Kling',
    label: 'Kling 1.6',
    desc: '5–10초 영상, 피사체 일관성',
    color: 'amber',
    suffix: '5–10 seconds video. Maintain subject identity and clothing consistency across frames. Include explicit duration.',
  },
  hailuo: {
    id: 'hailuo',
    name: 'Hailuo',
    label: 'Hailuo MiniMax',
    desc: '포토리얼 시네마틱, 16:9',
    color: 'accent',
    suffix: 'Photorealistic cinematic rendering, 16:9 aspect ratio, 6 seconds. Emphasize realistic lighting and texture.',
  },
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    label: 'Midjourney v6',
    desc: '정지 이미지, --ar --style --v 자동',
    color: 'pink',
    suffix: 'Still image only — no motion verbs. End the prompt with parameters: --ar 16:9 --style raw --v 6',
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    label: 'Flux Pro',
    desc: '정지 이미지 전용, 사진 톤',
    color: 'emerald',
    suffix: 'Still image only. No motion or temporal verbs. Hyperrealistic photography vocabulary. Focus on lens, lighting, composition.',
  },
  sora: {
    id: 'sora',
    name: 'Sora',
    label: 'Sora',
    desc: '물리 정확도 + 시간적 일관성',
    color: 'accent',
    suffix: 'Prioritize physical accuracy (gravity, fluid dynamics, contact, reflections) and temporal coherence across the full 20-second clip.',
  },
  veo: {
    id: 'veo',
    name: 'Veo 3',
    label: 'Google Veo 3',
    desc: '네이티브 오디오, 물리 정확도',
    color: 'amber',
    suffix: 'Include native audio cues synced to action (ambient, foley, dialog). Physical accuracy and natural motion.',
  },
};

window.TOOL_ORDER = ['runway','kling','hailuo','midjourney','flux','sora','veo'];

window.BASE_SYSTEM_PROMPT = `You convert Korean scene descriptions into English VFX prompts.

OUTPUT FORMAT
- Output ONLY the prompt. No commentary, no markdown, no "Here is your prompt", no quotes.
- Single paragraph, 50–150 words.
- Structure: Shot type → Subject → Environment → Camera move → Lighting → Film look.

VOCABULARY (use these liberally)
- Shot: high-angle, low-angle, locked-off, tracking, dolly-in, drone descent, anamorphic close-up, over-the-shoulder, wide establishing, macro
- Lens: 24mm, 35mm, 50mm, 85mm, anamorphic, tilt-shift
- Light: rim light, key light, practicals, volumetric, god rays, soft diffused, hard directional, golden hour, blue hour, dusk
- Atmosphere: volumetric fog, haze, mist, rain-slick reflections, dust motes, light leaks
- Look: 35mm film grain, anamorphic flare, teal-orange grade, bleach bypass, halation, chromatic aberration, kodak portra
- Camera move: slow push, slow pull, whip pan, rack focus, crash zoom, parallax

RULES
- Convert all Korean concepts to vivid cinematic English.
- Do not invent details that contradict the user's description.
- Use commas to chain modifiers, not full sentences.
- End cleanly without trailing punctuation beyond a single period.`;
