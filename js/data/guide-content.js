/* ───────────────────────────────────────────────────────────────
   js/data/guide-content.js
   Static guide tab data. No I/O. Read on render.
   ─────────────────────────────────────────────────────────────── */

window.GUIDE_WORKFLOW = [
  { i: '01', t: 'Image',     d: 'Midjourney · Flux',           c: 'emerald',
    body: '초기 시각화 단계. 무드보드와 키 비주얼을 만든다. 한 장의 이미지가 다음 단계의 컨디셔닝이 되므로, 일관된 룩(렌즈, 라이팅, 그레이드)을 먼저 정한다.' },
  { i: '02', t: 'Video',     d: 'Runway · Kling · Hailuo · Sora · Veo',  c: 'accent',
    body: '이미지를 영상화하거나 텍스트에서 직접 생성. 5–20초 단위 클립을 누적해서 시퀀스를 만든다. 툴마다 카메라 무브 / 피사체 일관성 / 시간 길이 강점이 다르다.' },
  { i: '03', t: 'Composite', d: 'After Effects · Nuke · DaVinci Fusion', c: 'amber',
    body: '생성된 영상을 합치고 마스킹, 추가 VFX(파티클, 라이트랩, 클린업)를 입힌다. AI 결과의 약점(번쩍임, 텍스처 슬립)을 잡는 단계.' },
  { i: '04', t: 'Grade',     d: 'DaVinci Resolve · Filmic LUTs', c: 'pink',
    body: '최종 톤매핑과 컬러그레이드. 35mm 필름 그레인, halation, teal-orange 같은 룩으로 시네마틱하게 마감.' },
];

window.GUIDE_TOOLS = [
  { id: 'runway',     best: '연속 카메라 무브 · 모션 컨트롤', dur: '10초',  realism: 4, control: 5 },
  { id: 'kling',      best: '피사체 일관성 유지',           dur: '5–10초', realism: 4, control: 4 },
  { id: 'hailuo',     best: '포토리얼 시네마틱',           dur: '6초',   realism: 5, control: 3 },
  { id: 'midjourney', best: '정지 이미지 · 무드보드',        dur: '—',     realism: 5, control: 4 },
  { id: 'flux',       best: '정지 이미지 · 사진 톤',         dur: '—',     realism: 5, control: 4 },
  { id: 'sora',       best: '물리 정확도 + 긴 시간',        dur: '20초',   realism: 5, control: 5 },
  { id: 'veo',        best: '오디오 포함 영상',             dur: '8초',   realism: 5, control: 4 },
];

window.GUIDE_GLOSSARY = [
  { group: 'Shot type', items: [
    ['Wide / Establishing', '전경 · 환경 보여주기'],
    ['Medium shot',          '미디엄 샷'],
    ['Close-up',             '클로즈업'],
    ['Macro',                '극도의 근접 샷'],
    ['Over-the-shoulder',    '뒷모습 너머 시점'],
    ['POV',                  '1인칭 시점'],
    ['Dutch angle',          '기울어진 앵글'],
    ['Drone descent',        '드론 하강'],
  ]},
  { group: 'Camera move', items: [
    ['Dolly in / out',       '다가가기 / 멀어지기'],
    ['Tracking',             '피사체 따라가기'],
    ['Crane up / down',      '크레인 상승 / 하강'],
    ['Whip pan',             '휙 패닝'],
    ['Rack focus',           '초점 이동'],
    ['Crash zoom',           '급격한 줌'],
    ['Locked off',           '고정 샷'],
    ['Parallax move',        '시차 무브'],
  ]},
  { group: 'Lighting', items: [
    ['Rim light',            '윤곽 광원'],
    ['Key light',            '주광'],
    ['Practical light',      '화면 내 실광원'],
    ['Volumetric',           '빛 입자가 보이는 광원'],
    ['God rays',             '신광 / 갓레이'],
    ['Golden hour',          '황금시간대'],
    ['Blue hour',            '푸른시간대'],
    ['Hard directional',     '강한 방향성 광'],
  ]},
  { group: 'Film look', items: [
    ['35mm film grain',      '필름 그레인'],
    ['Anamorphic flare',     '아나모픽 플레어'],
    ['Teal-orange grade',    '청-주황 그레이드'],
    ['Bleach bypass',        '블리치 바이패스'],
    ['Halation',             '하레이션'],
    ['Chromatic aberration', '색수차'],
    ['Kodak Portra',         '코닥 포트라 톤'],
    ['Cinemascope 2.39:1',   '시네마스코프 화면비'],
  ]},
  { group: 'Atmosphere', items: [
    ['Volumetric fog',         '부피감 있는 안개'],
    ['Haze',                   '열기 아지랑이 / 옅은 안개'],
    ['Mist',                   '가벼운 안개'],
    ['Dust motes',             '먼지 입자 (빛 속)'],
    ['Light leaks',            '빛 새어들어오는 효과'],
    ['Rain-slick reflections', '빗물에 젖은 반사'],
    ['Smoke / steam',          '연기 / 수증기'],
    ['Aurora borealis',        '오로라'],
  ]},
  { group: 'Composition', items: [
    ['Rule of thirds',        '삼등분 구도'],
    ['Negative space',        '여백'],
    ['Leading lines',         '시선 유도선'],
    ['Foreground element',    '전경 요소'],
    ['Depth of field',        '피사계 심도'],
    ['Bokeh',                 '아웃포커스 원형 빛'],
    ['Silhouette',            '실루엣'],
    ['Symmetrical framing',   '좌우 대칭 구도'],
  ]},
  { group: 'Post-processing', items: [
    ['LUT',                   '색상 룩업 테이블'],
    ['Color grade',           '컬러 그레이딩'],
    ['Vignette',              '비네팅 (가장자리 어둡게)'],
    ['Lens flare',            '렌즈 플레어'],
    ['Motion blur',           '모션 블러'],
    ['Noise / grain',         '노이즈 / 그레인'],
    ['HDR tone mapping',      'HDR 톤 맵핑'],
    ['Bloom',                 '밝은 부분 번짐'],
  ]},
  { group: 'Action & FX', items: [
    ['Slow motion',           '슬로우 모션'],
    ['Time-lapse',            '타임랩스'],
    ['Explosion',             '폭발'],
    ['Debris',                '파편'],
    ['Sparks',                '불꽃 파편'],
    ['Water splash',          '물 튀김'],
    ['Shockwave',             '충격파'],
    ['Particle simulation',   '파티클 시뮬레이션'],
  ]},
];

window.GUIDE_TIPS = [
  {
    icon: '✦', color: 'accent',
    title: '구조 공식: 샷 → 피사체 → 환경 → 카메라 → 조명 → 룩',
    body: '이 순서로 작성하면 어떤 툴도 안정적으로 해석합니다.\n예) "High-angle drone shot of a lone figure on a rain-slick Seoul rooftop, slow push forward, blue-hour rim light, teal-orange grade, 35mm film grain."',
  },
  {
    icon: '◆', color: 'amber',
    title: '숫자와 단위로 제어하라',
    body: '모호한 표현보다 구체적인 숫자가 훨씬 잘 먹힙니다.\n"빨리" → "1/4 second shutter"  ·  "멀리" → "35mm wide establishing shot"  ·  "어둡게" → "2 stops underexposed, deep shadow"',
  },
  {
    icon: '▦', color: 'emerald',
    title: '툴별 금지어가 있다',
    body: 'Midjourney · Flux: "video", "motion" 등 영상 동사 금지 — 품질이 떨어집니다.\nRunway · Kling: "--ar", "--v 6" 같은 이미지 파라미터 금지.\nSora: "physically accurate", "gravity" 를 포함하면 물리 정확도가 올라갑니다.',
  },
  {
    icon: '✸', color: 'pink',
    title: 'Gemini 에게 의도(컨텍스트)를 함께 전달하라',
    body: '단순 묘사보다 맥락을 주면 결과가 달라집니다.\n"영화 오프닝 시퀀스 느낌으로"  ·  "광고 레벨 품질"  ·  "90년대 홍콩 느와르 무드" — 의도를 한 문장으로 먼저 설명하세요.',
  },
  {
    icon: '↺', color: 'accent',
    title: '재생성 전에 한 단어만 바꿔라',
    body: '프롬프트 전체를 다시 쓰지 마세요. "teal-orange" → "warm amber", "fog" → "haze" 처럼 한 변수씩 수정해야 무엇이 결과를 바꾸는지 파악할 수 있어요.',
  },
  {
    icon: '⎘', color: 'amber',
    title: 'Studio 응답을 Prompts 에 저장하라',
    body: 'Gemini 응답 아래 "+ Prompts 에 저장" 버튼으로 라이브러리에 바로 추가됩니다. 카테고리, 태그, 원본 한국어 설명까지 함께 저장하면 나중에 검색·재활용이 쉬워요.',
  },
];
