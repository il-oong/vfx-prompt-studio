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

/*
  efficiency: 상황별 효율 별점 (1~5). null = 해당 상황 비대상 (이미지 전용 등).
    - asset    : 단위 VFX 에셋 (루프 텍스처, 폭발, 파티클, 배경 플레이트 등)
    - story    : 내러티브·캐릭터가 있는 스토리 영상 (다중 씬, 인물 일관성)
    - longform : 1분 이상 긴 영상 (세그먼트 이어붙이기, 드리프트 관리)
    - still    : 정지 이미지 (키비주얼, 무드보드, 컨셉아트)
  price: 월 구독 또는 크레딧 기반 참고가 (2026 기준, 약가표시).
*/
window.GUIDE_TOOLS = [
  { id: 'runway',     best: '연속 카메라 무브 · 모션 컨트롤', dur: '10초',  realism: 4, control: 5,
    price: '$15–$95/mo', priceNote: 'Standard $15 · Pro $35 · Unlimited $95',
    efficiency: { asset: 5, story: 5, longform: 4, still: 3 } },
  { id: 'kling',      best: '피사체 일관성 유지',           dur: '5–10초', realism: 4, control: 4,
    price: '무료 / $7–$30', priceNote: '무료 일일 크레딧 · Standard $7 · Pro $30',
    efficiency: { asset: 4, story: 3, longform: 3, still: null } },
  { id: 'hailuo',     best: '포토리얼 시네마틱',           dur: '6초',   realism: 5, control: 3,
    price: '무료 / $10–$25', priceNote: '무료 일일 크레딧 · Standard $10 · Premium $25',
    efficiency: { asset: 3, story: 3, longform: 2, still: null } },
  { id: 'midjourney', best: '정지 이미지 · 무드보드',        dur: '—',     realism: 5, control: 4,
    price: '$10–$120/mo', priceNote: 'Basic $10 · Standard $30 · Pro $60 · Mega $120',
    efficiency: { asset: null, story: null, longform: null, still: 5 } },
  { id: 'flux',       best: '정지 이미지 · 사진 톤',         dur: '—',     realism: 5, control: 4,
    price: 'API ~$0.05/img', priceNote: 'Replicate API 약 $0.04–0.06/장 · BFL 자체 플랜 있음',
    efficiency: { asset: null, story: null, longform: null, still: 5 } },
  { id: 'sora',       best: '물리 정확도 + 긴 시간',        dur: '20초',   realism: 5, control: 5,
    price: '$20 / $200/mo', priceNote: 'ChatGPT Plus $20 (제한적) · Pro $200 (Sora 풀억세스)',
    efficiency: { asset: 4, story: 5, longform: 5, still: 3 } },
  { id: 'veo',        best: '오디오 포함 영상',             dur: '8초',   realism: 5, control: 4,
    price: '$20 / $250/mo', priceNote: 'Google AI Pro $20 · AI Ultra $250 (헤비 사용자용)',
    efficiency: { asset: 4, story: 5, longform: 4, still: null } },
  { id: 'wan',        best: '피사체-배경 분리, 단순 명확',   dur: '4–8초', realism: 4, control: 3,
    price: '무료 (오픈웨이트)', priceNote: '오픈소스 또는 호스팅 플랫폼별 종량제',
    efficiency: { asset: 3, story: 3, longform: 3, still: null } },
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
  { group: 'One-take 안무', items: [
    ['One continuous take',  '컷 없이 한 호흡으로 진행'],
    ['Opens with → then → finally', '비트 마커로 시작·중간·끝을 명시'],
    ['0-3s / 3-7s / 7-10s',  '시간 마커로 구간 분할'],
    ['Rises into orbit',     '낮은 위치에서 궤도로 상승'],
    ['Arcs 180° around',     '피사체 주위 반원 궤도'],
    ['Settles on',           '특정 구도에 정착'],
    ['Pushes through',       '관통하듯 전진'],
    ['Ends on close-up',     '클로즈업으로 마무리'],
  ]},
  { group: 'Scene transition', items: [
    ['Hard cut',             '딱 끊는 컷'],
    ['Match cut',            '공통 요소로 매끄럽게 연결'],
    ['Smash cut',            '강한 콘트라스트의 급컷'],
    ['Dissolve / Cross-fade','겹치며 사라지는 디졸브'],
    ['Whip-pan transition',  '휙 패닝으로 장면 전환'],
    ['Fade to black',        '검정으로 페이드'],
    ['Morph cut',            '형태 변화로 이어붙임'],
    ['Wipe',                 '와이프 전환'],
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

window.GUIDE_RUNWAY_SKILLS = {
  beginner: {
    title: 'Beginner',
    subtitle: '처음 런웨이를 여는 날',
    sections: [
      {
        heading: '런웨이 Gen-4 기본 노드',
        body: '런웨이 캔버스(Canvas)는 노드 기반 워크플로우입니다. 각 노드는 하나의 작업 단위입니다.',
        items: [
          ['Text-to-Video', '텍스트 프롬프트만으로 영상을 생성합니다. 시작점으로 가장 좋습니다.'],
          ['Image-to-Video', '이미지를 첫 프레임으로 써서 영상을 만듭니다. 미드저니 이미지와 조합하세요.'],
          ['Extend', '기존 클립의 끝에서 이어지는 영상을 생성합니다. 원본 모션을 유지합니다.'],
          ['Upscale', '생성된 영상을 4K로 업스케일합니다. 마지막 단계에 연결하세요.'],
        ],
      },
      {
        heading: '첫 영상 만들기 — 단계별',
        body: '텍스트 → 비디오 노드 하나로 시작하는 가장 단순한 흐름입니다.',
        steps: [
          '새 캔버스 열기 → "+" 클릭 → Text-to-Video 노드 추가',
          'Prompt에 영어 VFX 프롬프트 입력 (Studio 탭에서 생성한 것을 붙여넣으세요)',
          'Duration: 5초, Resolution: 1280x720 (테스트용), Generate 클릭',
          '결과 확인 후 마음에 들면 Extend 노드로 이어붙이기',
          '최종 클립에 Upscale 노드 연결 → 4K 출력',
        ],
      },
      {
        heading: '프롬프트 작성 기본 규칙',
        body: '런웨이는 카메라 무브 지시어에 민감하게 반응합니다.',
        items: [
          ['카메라 지시어를 앞에', '"Slow dolly-in shot..." 처럼 카메라 무브를 프롬프트 앞에 씁니다.'],
          ['초 단위 지정', '"5-second clip", "10-second take" 명시하면 안정적입니다.'],
          ['부정어 사용', '"no camera shake", "no sudden cuts" 로 원치 않는 결과를 줄입니다.'],
          ['Negative Prompt', '런웨이 UI의 Negative 필드에 "blur, overexposed, distorted face" 등을 추가하세요.'],
        ],
      },
    ],
  },
  intermediate: {
    title: 'Intermediate',
    subtitle: '여러 클립을 이어 붙이는 법',
    sections: [
      {
        heading: '멀티 클립 체이닝',
        body: '런웨이 Gen-4는 씬 간 피사체 일관성을 캔버스에서 직접 연결해 유지할 수 있습니다.',
        steps: [
          '클립 A 생성 → 마지막 프레임 저장 (스크린샷)',
          '저장한 프레임을 Image-to-Video 노드의 첫 프레임에 입력',
          '클립 B 프롬프트는 클립 A의 분위기를 이어받도록 작성',
          '캔버스에서 A → Extend → B 순서로 노드 연결',
          '최종적으로 Merge/Concat 노드로 합쳐 하나의 타임라인으로 출력',
        ],
      },
      {
        heading: '레퍼런스 이미지 활용',
        body: 'Gen-4는 Act One 노드로 배우/피사체의 얼굴 또는 스타일을 고정할 수 있습니다.',
        items: [
          ['Act One', '레퍼런스 이미지(캐릭터, 사물)를 노드에 연결하면 다른 씬에서도 같은 피사체를 유지합니다.'],
          ['Style Reference', '특정 촬영물의 색감·텍스처를 레퍼런스로 넣으면 전체 분위기가 통일됩니다.'],
          ['First Frame Fix', 'Image-to-Video에서 첫 프레임을 고정하면 구도와 인물 위치가 흔들리지 않습니다.'],
          ['Motion Brush', '영역을 선택해 해당 영역만 다르게 움직입니다. 배경은 고정, 피사체만 움직일 때 유용합니다.'],
        ],
      },
      {
        heading: 'Camera Control 노드',
        body: '런웨이 Gen-4는 카메라 무브를 수치로 직접 제어하는 Camera Control 기능을 제공합니다.',
        items: [
          ['Pan / Tilt', '좌우·상하 카메라 회전. 값: -10 ~ +10'],
          ['Dolly', '앞뒤 이동. 양수=전진, 음수=후진'],
          ['Zoom', '광학 줌 느낌. 돌리와 혼용 주의'],
          ['Roll', '카메라 자체 회전. 기울어진 더치 앵글에 활용'],
        ],
      },
    ],
  },
  advanced: {
    title: 'Advanced',
    subtitle: '복잡한 노드 그래프 설계',
    sections: [
      {
        heading: '복잡한 노드 그래프 패턴',
        body: '대규모 프로젝트에서 쓰는 캔버스 구조 패턴입니다.',
        items: [
          ['레이어드 체인', '스타일 레퍼런스 → Act One → T2V → Extend → Upscale 순으로 직렬 연결. 각 노드가 이전 결과를 조건으로 받습니다.'],
          ['병렬 분기', '같은 레퍼런스에서 카메라 앵글만 다른 클립을 동시에 생성. 편집에서 가장 좋은 테이크를 선택합니다.'],
          ['브리지 프레임', '두 씬 사이 전환이 자연스럽지 않을 때 짧은 3초 브리지 클립을 중간에 삽입합니다.'],
          ['Seed 고정', '동일 Seed 값을 복수 노드에 쓰면 유사한 노이즈 패턴이 재현되어 씬 일관성이 올라갑니다.'],
        ],
      },
      {
        heading: '스타일 + 모션 레퍼런스 조합',
        body: '가장 강력한 Gen-4 기능. 두 레퍼런스를 동시에 쓰는 방법입니다.',
        steps: [
          'Style Reference 노드 → 원하는 색감/톤의 스틸 이미지 연결',
          'Motion Reference 노드 → 원하는 카메라 무브가 담긴 레퍼런스 영상 연결',
          '두 노드를 T2V 또는 I2V 노드의 각 입력 핀에 연결',
          'Prompt에는 피사체와 내러티브에만 집중 (스타일·무브는 레퍼런스가 처리)',
          'Weight 슬라이더로 Style과 Motion의 영향력 비율 조절 (0.6–0.8 권장)',
        ],
      },
      {
        heading: 'Director Mode',
        body: '런웨이 Director Mode는 씬 레벨 연출을 텍스트로 지시하는 고급 기능입니다.',
        items: [
          ['씬 지시어', '"Cut to close-up after 3 seconds", "Slow push in during dialogue" 같은 연출 언어를 씁니다.'],
          ['다중 피사체', '레퍼런스 이미지 여러 장을 각각 캐릭터로 지정 후 씬에서 상호작용 연출이 가능합니다.'],
          ['배경 고정', '"Static background, locked off" 지시어로 배경 드리프트를 억제합니다.'],
          ['이터레이션 전략', '한 씬을 5회 이상 생성 후 최고 테이크만 선별. Seed 고정으로 비슷한 결과에서 최적을 고릅니다.'],
        ],
      },
    ],
  },
};

window.GUIDE_RUNWAY_SITUATIONS = {
  asset: {
    title: '영상 에셋 제작',
    subtitle: 'VFX 합성에 쓸 단위 소재 만들기',
    sections: [
      {
        heading: '루프 가능한 텍스처 · 배경',
        body: '합성 툴에서 반복 재생할 수 있는 루프 소재를 만드는 패턴입니다.',
        steps: [
          'Prompt: "seamlessly looping [texture type], no camera movement, locked off, 5 seconds"',
          'Generate → Extend 노드로 동일 프롬프트로 연장',
          'Extend 결과가 첫 프레임으로 자연스럽게 이어지는지 프리뷰에서 확인',
          '필요시 After Effects의 Loop Expression으로 마감',
        ],
        examples: [
          '연기 / 수증기: "seamlessly looping volumetric smoke rising, black background, no shake"',
          '불꽃 파티클: "looping ember particles floating upward, black BG, cinematic grade"',
          '물 반사: "looping water surface reflection with caustics, overhead shot, locked off"',
        ],
      },
      {
        heading: '배경 플레이트',
        body: '인물·오브젝트를 나중에 합성할 배경 영상입니다. 카메라 움직임이 일정해야 트래킹이 쉽습니다.',
        items: [
          ['느린 돌리', '"slow dolly-in 0.5x speed, locked stabilized horizon" — 합성 후 카메라 트래킹 오류 최소화'],
          ['고정 배경', '"completely static locked-off shot" — 가장 안전. 나중에 AE에서 카메라 무브 추가 가능'],
          ['해상도', '배경 플레이트는 반드시 Upscale 노드로 4K 출력. 크롭 여유가 필요합니다.'],
          ['오버랩 프레임', '각 클립 앞뒤로 10프레임씩 여유를 두고 생성하세요. 편집 접점에서 선택지가 생깁니다.'],
        ],
      },
      {
        heading: 'VFX 요소 — 폭발 · 파편 · 광원',
        body: '합성에 올릴 개별 VFX 요소 생성 팁입니다.',
        items: [
          ['검정 배경 활용', '"explosion on pure black background, cinematic VFX element" → After Effects에서 Add 블렌드 모드로 합성'],
          ['알파채널 대체', '런웨이는 알파채널을 지원하지 않습니다. 검정 배경 + Add 모드가 사실상의 알파입니다.'],
          ['파편 방향 제어', '"debris flying toward camera" / "debris falling left-to-right" 처럼 방향을 명시합니다.'],
          ['지속시간', 'VFX 요소는 3–5초로 짧게. 필요시 Extend로 연장하세요.'],
        ],
      },
    ],
  },
  longform: {
    title: '긴 영상 제작',
    subtitle: '1분 이상 영상의 연속성 관리',
    sections: [
      {
        heading: '세그먼트 분할 전략',
        body: '런웨이 Gen-4의 최대 클립 길이는 10초입니다. 긴 영상은 세그먼트로 나눠 제작합니다.',
        steps: [
          '전체 영상을 5–10초 단위 씬으로 분할 (편집점은 자연스러운 컷 포인트에)',
          '각 씬마다 별도 노드 체인 생성 (병렬 작업 가능)',
          '씬 A의 마지막 프레임을 씬 B의 첫 프레임으로 사용 (프레임 브리지)',
          '모든 씬을 DaVinci Resolve 또는 Premiere로 임포트 후 타임라인 편집',
          '전환 프레임이 어색하면 런웨이에서 3초짜리 트랜지션 클립 추가 생성',
        ],
      },
      {
        heading: '연속성 유지 체크리스트',
        body: '긴 영상에서 가장 자주 깨지는 요소와 대처 방법입니다.',
        items: [
          ['피사체 외형', 'Act One 레퍼런스를 모든 씬에 동일하게 연결. 클로즈업 레퍼런스와 풀샷 레퍼런스를 각각 준비하세요.'],
          ['색감·톤', 'Style Reference를 단일 이미지로 고정하고 모든 씬에 같은 Weight로 적용합니다.'],
          ['카메라 높이', '씬 설명에 매번 "eye-level", "drone altitude" 등 카메라 높이를 명시하세요.'],
          ['조명 방향', '"sun at 45° camera left, hard directional" 처럼 광원 방향을 숫자로 고정합니다.'],
          ['그레이드', '마지막 단계에 DaVinci Resolve에서 전체 시퀀스를 동일 LUT로 그레이딩합니다.'],
        ],
      },
      {
        heading: 'Extend 노드 활용 극대화',
        body: 'Extend는 클립을 이어붙이는 가장 안정적인 방법입니다.',
        items: [
          ['오버랩 시작점', 'Extend는 원본 클립의 마지막 1–2초를 조건으로 씁니다. 원본 끝 부분이 정적일수록 이어붙임이 자연스럽습니다.'],
          ['프롬프트 일관성', 'Extend 노드의 프롬프트는 원본과 동일하거나 아주 조금만 변경하세요.'],
          ['연쇄 Extend', 'Extend → Extend → Extend 3단 연결로 30초 클립도 만들 수 있습니다. 단, 3회 이후 드리프트가 생깁니다.'],
          ['드리프트 리셋', '드리프트 발생 시 마지막 좋은 프레임으로 I2V 노드를 새로 시작합니다.'],
        ],
      },
    ],
  },
  story: {
    title: '스토리 영상 제작',
    subtitle: '내러티브와 캐릭터가 있는 영상',
    sections: [
      {
        heading: '프리프로덕션 — 샷 리스트 먼저',
        body: '스토리 영상은 반드시 샷 리스트를 먼저 만드세요. 런웨이 캔버스는 샷 단위로 생각합니다.',
        steps: [
          '스토리를 3–5개 씬으로 나누기 (오프닝, 전개, 클라이맥스, 해소)',
          '각 씬마다 샷 타입 결정: 설정샷(Wide) → 리액션(CU) → 액션(MS) 순 권장',
          'Gemini Studio에서 각 샷의 VFX 프롬프트 미리 생성',
          '캐릭터 레퍼런스 이미지 준비 (씬 수 × 2 장 이상)',
          '캔버스에 씬 번호 기준으로 노드 그룹 구성',
        ],
      },
      {
        heading: '캐릭터 일관성 — Act One 활용법',
        body: 'Act One은 런웨이의 캐릭터 고정 기능입니다. 올바른 레퍼런스 준비가 핵심입니다.',
        items: [
          ['레퍼런스 선택', '얼굴이 잘 보이는 정면 이미지 1장 + 전신 이미지 1장. 배경이 단순할수록 좋습니다.'],
          ['각도별 레퍼런스', '클로즈업 / 미디엄 / 풀샷 씬마다 다른 각도의 레퍼런스를 연결하면 정확도가 올라갑니다.'],
          ['레퍼런스 강도', 'Act One Weight 0.7–0.9 권장. 1.0은 움직임이 굳어버립니다.'],
          ['배경 분리', '레퍼런스 이미지에서 배경을 제거(Remove.bg 등)하면 캐릭터 인식 정확도가 높아집니다.'],
        ],
      },
      {
        heading: '샷 시퀀싱 — 편집을 염두에 둔 생성',
        body: '런웨이에서 생성할 때부터 편집을 생각하면 작업량이 줄어듭니다.',
        items: [
          ['헤드룸·풋룸', '"centered frame with headroom" 명시 — 크롭 여유가 생깁니다.'],
          ['컷 포인트', '각 클립이 자연스러운 동작의 끝에서 끝나도록 프롬프트에 "ending on a rest pose" 추가'],
          ['J컷·L컷 대비', '클립 앞뒤로 1–2초 여유 있게 생성. 편집에서 오디오 오버랩 컷을 쓸 수 있습니다.'],
          ['리액션 샷', '"character listening, subtle facial reaction, close-up" — 대화 씬 리액션 클립을 여러 개 만들어두면 편집이 유연해집니다.'],
        ],
      },
      {
        heading: '내러티브 아크 — 프롬프트 톤 변화',
        body: '씬 진행에 따라 조명·분위기를 조금씩 변화시키면 드라마틱한 흐름이 생깁니다.',
        items: [
          ['오프닝', '"bright, wide establishing, neutral tone" — 세계관과 캐릭터를 소개합니다.'],
          ['전개', '"slightly desaturated, medium shots, tension building" — 갈등이 고조됩니다.'],
          ['클라이맥스', '"high contrast, dramatic lighting, close-up, underexposed shadows" — 감정의 정점.'],
          ['해소', '"warm golden light, slow motion, wide shot" — 긴장이 풀리고 결말로 향합니다.'],
        ],
      },
    ],
  },
};

window.GUIDE_MV_WORKFLOW = {
  preproduction: {
    title: '01. Pre-Production',
    subtitle: '기획·준비 단계 (1~4주). AI는 컨셉아트·스토리보드·Pre-viz에 투입.',
    sections: [
      {
        heading: '컨셉 디벨롭',
        body: '곡 분석부터 무드보드까지. 비주얼 톤을 먼저 결정해야 후반 일관성이 잡힙니다.',
        items: [
          ['곡 분석',       'BPM·구조·가사·감정선 정리. Gemini로 가사 분석·테마 추출.'],
          ['컨셉아트',     'Midjourney / Flux로 키비주얼 5~10장 생성. 클라이언트 컨펌용.'],
          ['레퍼런스',     'Vimeo Staff Picks·Pinterest + Runway Search Reference.'],
          ['무드보드',     'Flux 키비주얼 + Figma 보드로 톤·색·구도 정리.'],
        ],
      },
      {
        heading: '시놉시스 / 컷 리스트',
        body: '곡을 4~8개 씬으로 분할하고 씬당 컷 리스트 작성. AI 통합의 핵심 출발점.',
        steps: [
          '곡 구조에 맞춰 씬 분할 (인트로 / 벌스 / 코러스 / 브릿지 / 아웃트로)',
          '각 씬마다 컷 번호·길이·샷 타입·내용 기재',
          'VFX 들어갈 컷 표시 (#vfx 태그)',
          '본인 앱 Prompts 탭에 컷별 프롬프트 미리 저장',
        ],
        examples: [
          '씬 1 — 인트로 (0:00~0:15) · 8 컷',
          '컷 1.1: 와이드 도시 야경 (3초) #vfx',
          '컷 1.2: 캐릭터 실루엣 클로즈업 (2초) #real',
          '컷 1.3: 네온 사인 인서트 (1초) #vfx',
        ],
      },
      {
        heading: '스토리보드 / Pre-viz',
        body: '컷별 키프레임 + 움직임 프리뷰 영상. 촬영 전 합의용이라 정밀도는 불필요.',
        items: [
          ['키비주얼',     'Flux / Midjourney로 컷별 첫 프레임 정지 이미지.'],
          ['끝 프레임',    '같은 캐릭터 끝 자세 (Midjourney --cref 활용).'],
          ['움직임 프리뷰', 'Wan 1.3B 로컬로 5초 저화질 영상 — 5060 8GB에서 5분/컷.'],
          ['클라이언트 컨펌', '위 영상으로 PPT 만들어 촬영 전 컷 단위 합의.'],
        ],
      },
      {
        heading: '플래닝 체크리스트',
        body: '실촬 가능한 건 무조건 실촬. 비현실·위험·예산 안 맞는 것만 AI로.',
        items: [
          ['VFX vs 실촬',    '컷마다 실촬 가능성 판단 후 분류. 실촬 디테일이 압승.'],
          ['로케이션',       '실촬 장소 헌팅. 합성 들어갈 컷은 배경 정보 미리 수집.'],
          ['캐스팅 / 의상',  '캐릭터 레퍼런스 이미지 확보 → 후반 AI 인서트에 활용.'],
          ['그린스크린',     '합성 컷 식별 → 그린/블루 배경 촬영 계획.'],
          ['추적 마커',      '카메라 트래킹 필요한 컷에 마커 위치 결정.'],
        ],
      },
    ],
  },

  production: {
    title: '02. Production',
    subtitle: '촬영 단계 (1~3일). AI 활용은 거의 없음 — VFX 합성을 염두에 둔 촬영이 핵심.',
    sections: [
      {
        heading: '촬영 당일 흐름',
        body: '실촬은 사람의 영역. 단, 후반에 합성할 컷은 더 많이 찍어두기.',
        steps: [
          '콜타임 / 메이크업 (오전)',
          '블로킹 리허설 — 카메라 움직임 정확히 합의',
          '각 컷 3~5테이크 (VFX 합성 컷은 5~8테이크)',
          '데일리 — 촬영본 SSD에 즉시 2부 백업',
        ],
      },
      {
        heading: 'VFX 합성 컷 촬영 팁',
        body: '후반 합성을 살리려면 촬영 단계에서 미리 챙길 게 있습니다.',
        items: [
          ['클린 플레이트',   '배우 없이 배경만 30초 더 촬영. 합성·페인트아웃의 기준.'],
          ['조명 방향 메모',  'AI 에셋 그림자·하이라이트 매칭에 필수.'],
          ['컬러차트 촬영',   '씬 시작에 24색 차트 1초 촬영 → 컬러 매칭 기준.'],
          ['멀티 앵글',      '같은 액션을 2개 이상 앵글로 → 편집 자유도 확보.'],
          ['추적 마커',      '모션 트래킹 필요한 컷에 노란/녹색 점 마커. 후반 제거 가능.'],
        ],
      },
      {
        heading: '촬영 후 데이터 정리',
        body: '백업 안 한 데이터는 없는 데이터. 즉시 두 곳에 복사.',
        items: [
          ['SSD 1 (작업용)',  '노트북 또는 워크스테이션 직접 연결.'],
          ['SSD 2 (백업)',    '금고 / 별도 클라우드 (Backblaze, iCloud).'],
          ['원본 카드',       '1주일 보관 후 포맷. 후반 중 사고 대비.'],
          ['폴더 구조',       'YYYYMMDD_씬번호_샷번호 형식 통일.'],
        ],
      },
    ],
  },

  offline: {
    title: '03. Offline Edit',
    subtitle: '가편집 단계 (1~2주). 음악에 맞춰 컷 배열. AI 들어갈 자리는 검은 화면으로 잡아둠.',
    sections: [
      {
        heading: 'Ingest / 프록시 / 백업',
        body: '본격 편집 전 데이터 정리. 프록시는 노트북 작업의 필수.',
        steps: [
          '모든 raw 파일 SSD에 정리 (씬/컷 폴더 구조)',
          'DaVinci에서 1/4 해상도 프록시 자동 생성',
          '본인 앱 Archive 탭에 폴더 연결 → 썸네일 관리',
          '편집 프로젝트 클라우드 백업 (DaVinci Project Library)',
        ],
      },
      {
        heading: '편집 흐름 V1 → Picture Lock',
        body: '버전 관리로 작업하고 매 단계 클라이언트 컨펌. AI는 Picture Lock 이후 투입.',
        steps: [
          '음악 import → 비트 마커 찍기 (DaVinci M 키)',
          '각 컷 OK 테이크 선별 (5테이크 중 베스트 1개)',
          'V1 러프컷 — 컷 위치 대충, 빈 컷은 검은 화면 + 메모 ("AI 배경 들어갈 자리")',
          'V2 타이트컷 — 프레임 단위로 다듬기, 컷 길이 확정',
          'V3 컨펌 — 감독·아티스트 피드백 반영',
          'V4 Picture Lock — 이 시점에 VFX 작업 시작',
        ],
      },
      {
        heading: 'AI 자동화 도구',
        body: '편집 시간 절약하는 도구들. 가편집에만 쓰고 최종 결정은 사람이.',
        items: [
          ['Premiere AutoCut',      '비트 감지 → 자동 컷 분할. 러프컷에 유용.'],
          ['DaVinci Smart Reframe', '16:9 → 9:16 자동 리프레이밍. Reels용 마스터 생성.'],
          ['Auto Caption',          '가사 자막 자동 생성 → 수정.'],
          ['Scene Detect',          '긴 클립에서 컷 포인트 자동 감지.'],
        ],
      },
    ],
  },

  vfx: {
    title: '04. VFX / Composite — AI 메인 투입',
    subtitle: '후반작업의 핵심 (1~3주). 편집 락된 V4가 기준점. 본인 앱이 가장 빛나는 단계.',
    sections: [
      {
        heading: 'VFX 컷 리스트 추출',
        body: 'Picture Lock된 편집본에서 VFX 컷을 뽑아 작업 큐 작성.',
        steps: [
          '편집본 보면서 #vfx 표시된 컷 리스트화',
          '컷별 작업 분류: 에셋 합성 / 배경 교체 / 인서트 / 트랜지션',
          '각 컷의 한국어 설명을 Studio 탭에 입력 → 영어 프롬프트 생성',
          '결과를 Prompts 탭에 저장 (씬·컷 태그 포함)',
          'Archive 탭 폴더에 생성 영상 저장 후 메모',
        ],
        examples: [
          '씬 2 컷 5: 옥상 배경을 야간 도쿄로 교체 (3초)',
          '씬 3 컷 2: 폭발 합성 (1초)',
          '씬 4 컷 8: 캐릭터 뒤로 안개 추가 (4초)',
          '씬 6 컷 3: 신호등 인서트 (1초)',
        ],
      },
      {
        heading: '컷별 AI 분기',
        body: '컷 성격에 따라 다른 AI 모델·경로 사용. 비용 최적화의 핵심.',
        items: [
          ['단순 에셋 (연기·신호등·파편)', 'Wan 1.3B 로컬 (무료) → After Effects Add 블렌드'],
          ['배경 플레이트 (도시·자연)',     'Veo Fast 5초 ($0.75) → Nuke 매트 페인팅'],
          ['캐릭터 인서트 (얼굴·손)',      'Veo Standard ($4) — 디테일 필수'],
          ['컷 사이 트랜지션',            'Wan FLF2V (첫·끝 프레임 보간)'],
          ['정지 컷 (포스터·타이틀)',     'Flux / Midjourney'],
        ],
      },
      {
        heading: '합성 체크리스트 (AE / Nuke)',
        body: 'AI 영상을 실촬에 자연스럽게 녹이는 6단계.',
        items: [
          ['1. 매트 / 로토',     '합성 대상 영역 마스킹 + 카메라 트래킹.'],
          ['2. 클린업',         '워터마크·와이어·로고 제거 (Patch Replacer / Content-Aware Fill).'],
          ['3. AI 에셋 합성',    'Add / Screen 블렌드 모드, 마스킹 정리.'],
          ['4. 그레인 매칭',     'AI의 부드러움 → 실촬 노이즈에 맞춰 그레인 추가.'],
          ['5. 조명 매칭',       '실촬 광원 방향에 AI 그림자·하이라이트 맞추기.'],
          ['6. 색온도 매칭',     '1차 그레이드로 톤 통일 (다음 단계 위해).'],
        ],
      },
      {
        heading: 'AI 영상이 어색해 보이는 4가지 원인',
        body: '대부분 이 4가지에서 티가 납니다. 합성 단계에서 의도적으로 매칭.',
        items: [
          ['너무 깨끗한 노이즈', '실촬엔 항상 노이즈가 있음. AE Add Grain으로 매칭.'],
          ['조명 방향 불일치',  '실촬 광원과 AI 그림자 방향 다르면 즉시 들킴.'],
          ['모션 블러 차이',    'AI 영상은 모션 블러 약함. CC Force Motion Blur로 추가.'],
          ['색온도 차이',       '1차 매칭 후 2차 그레이드에서 시퀀스 전체 통일.'],
        ],
      },
      {
        heading: '디테일 살리는 4가지 핵심 (이게 결정타)',
        body: 'AI 티 안 나는 결과물의 비결. 모든 컷에 적용.',
        items: [
          ['기준 프레임',       'Flux/MJ로 첫 프레임 만들고 → AI 영상은 I2V로 그 프레임에서 시작.'],
          ['캐릭터 고정',       '같은 시드 / 레퍼런스 이미지로 씬 간 캐릭터 일관성 유지.'],
          ['2단 그레이드',      '1차 톤 매칭 후 합성 → 합성 끝나면 시퀀스 전체 2차 그레이드.'],
          ['실촬 디테일 입히기', '그레인·디포커스·노이즈를 AI 영상에 추가해 실촬과 톤 통일.'],
        ],
      },
    ],
  },

  grade: {
    title: '05. Color Grade',
    subtitle: '컬러그레이딩 (3~5일). AI 컷과 실촬 톤을 통일하는 마지막 안전망.',
    sections: [
      {
        heading: 'DaVinci 컬러 페이지 워크플로우',
        body: '5단계로 마감. AI 컷은 1단계에서 별도로 정상화 후 합류.',
        steps: [
          'Normalize — 모든 컷 베이스라인 (노출·화이트밸런스) 맞춤',
          'Primary Grade — 전체 룩 결정 (teal-orange, bleach bypass, Kodak 등)',
          'Secondary Grade — 부분 마스킹 (피부톤, 하늘, 의상 색)',
          'Trim Pass — 컷별 미세 조정',
          'LUT 적용 → 익스포트 (씬별 또는 전체)',
        ],
      },
      {
        heading: 'AI 컷 vs 실촬 컷 톤 매칭',
        body: 'AI 컷이 들킬 가능성이 가장 높은 곳. 의도적으로 매칭 작업.',
        items: [
          ['Match Color 노드',  'DaVinci에서 AI 컷을 인접 실촬 컷 기준으로 자동 매칭.'],
          ['Film Grain 통일',   '시퀀스 전체에 동일 그레인 적용 (Filmic LUT + Grain).'],
          ['Halation 추가',     '하이라이트 글로우 통일 → 필름 느낌 + AI 부드러움 가림.'],
          ['Vignette 통일',     '약한 비네팅으로 프레임 가장자리 톤 일치.'],
        ],
      },
    ],
  },

  delivery: {
    title: '06. Delivery',
    subtitle: '마감·송출 (1~3일). 플랫폼별 마스터링 + AI 사용 표기 검토.',
    sections: [
      {
        heading: '플랫폼별 마스터 출력',
        body: 'DaVinci Deliver 페이지 또는 Adobe Media Encoder로 일괄 출력.',
        items: [
          ['YouTube 메인',     '4K H.264 / H.265, 24fps, 16:9, -14 LUFS'],
          ['Instagram Reels',  '1080p H.264, 30fps, 9:16, -14 LUFS'],
          ['TikTok',          '1080p H.264, 30fps, 9:16, -14 LUFS'],
          ['Spotify Canvas',   '720p 8초 루프, 9:16, 무음 또는 곡 일부'],
        ],
      },
      {
        heading: '메타데이터 / 크레딧',
        body: '검색 노출과 권리 명시. AI 사용 표기는 한국 송출 시 권장.',
        items: [
          ['제목 / 설명',      '곡명·아티스트·릴리즈 정보. 키워드 5~10개 자연스럽게.'],
          ['크레딧',          '감독·촬영·편집·VFX·컬러 — 본인이 다 했다면 한 줄 통합.'],
          ['AI 사용 표기',    '"AI 일부 활용" 또는 도구명 명시 (Veo·Wan·Midjourney 등).'],
          ['Vertex 영수증',   'API 사용 명세 백업 — 분쟁 시 합법 사용 증빙.'],
        ],
      },
      {
        heading: 'AI 표기 의무 (한국 기준)',
        body: '한국 AI 기본법(2025 시행)과 방통위 가이드라인을 따릅니다. 광고·방송용은 표기 의무, 일반 뮤비도 권장.',
      },
    ],
  },
};

window.GUIDE_COMFYUI = {
  intro: {
    title: 'ComfyUI 소개',
    subtitle: 'VFX 합성을 위한 노드 기반 AI 워크플로우 툴. Silence & Sculpture 같은 가구 비주얼 작업에 최적화.',
    sections: [
      {
        heading: 'ComfyUI가 뭔가요?',
        body: '노드(박스)를 연결해서 AI 이미지 생성·합성 파이프라인을 직접 설계하는 오픈소스 툴입니다. 버튼 하나로 되는 대신, 각 단계를 내가 제어합니다.',
        items: [
          ['노드 기반', '각 기능이 노드(박스)로 분리됨. 연결 순서가 곧 워크플로우.'],
          ['AUTOMATIC1111 vs ComfyUI', 'A1111은 UI가 쉽지만 자동화 한계. ComfyUI는 복잡하지만 배치·합성에 강함.'],
          ['무료 오픈소스', 'GPU만 있으면 무료. NVIDIA RTX 3060 이상 권장 (8GB VRAM).'],
          ['워크플로우 JSON', '만든 파이프라인을 JSON으로 저장·공유 가능. 커뮤니티 공유 워크플로우를 불러와서 쓸 수 있음.'],
        ],
      },
      {
        heading: 'VFX 합성에 ComfyUI 쓰는 이유',
        body: 'After Effects나 Photoshop 대신 ComfyUI를 쓰는 진짜 이유입니다.',
        items: [
          ['AI 기반 자동 합성', '수동 마스킹/키잉 시간을 10분의 1로 단축. AI가 자동으로 배경 분리.'],
          ['배치 작업', '100장 이미지를 같은 워크플로우로 한번에 처리 가능.'],
          ['스타일 일관성', 'IPAdapter로 참조 이미지의 스타일을 유지하며 생성.'],
          ['공간감 유지', 'ControlNet Depth로 3D 공간 구조를 분석해 합성 시 왜곡 방지.'],
        ],
      },
      {
        heading: '설치 & 시작',
        body: '처음 설치하는 경우 이 순서로 진행하세요. 총 소요 시간: 1~2시간.',
        steps: [
          'Python 3.10+ 설치 (python.org)',
          'Git으로 ComfyUI 클론: git clone https://github.com/comfyanonymous/ComfyUI',
          'requirements.txt 설치: pip install -r requirements.txt',
          'CUDA가 있다면 torch GPU 버전으로 재설치',
          'python main.py 실행 → 브라우저에서 127.0.0.1:8188 접속',
          'ComfyUI Manager 설치 (커스텀 노드 관리 필수)',
        ],
      },
      {
        heading: '학습 로드맵 — 일주일 완성',
        body: '이 순서로 익히면 일주일 안에 가구 합성 작업이 가능합니다.',
        items: [
          ['Day 1', '기본 T2I (텍스트→이미지) 워크플로우 완성. KSampler, CLIP, VAE 노드 이해.'],
          ['Day 2', 'Inpaint + ControlNet으로 특정 영역 오브젝트 추가/수정.'],
          ['Day 3', 'Rembg/SAM으로 배경 분리 + IPAdapter로 스타일 일관성.'],
          ['Day 4+', '실전 가구 합성 워크플로우 조립 & 배치 처리.'],
        ],
      },
    ],
  },

  nodes: {
    title: '핵심 노드 가이드',
    subtitle: '가구 합성 워크플로우에서 반드시 알아야 할 5가지 노드 그룹입니다.',
    sections: [
      {
        heading: 'Inpaint — 영역 지정 생성',
        body: '이미지의 특정 영역만 새로 생성하거나 교체합니다. 가구를 넣을 위치를 마스크로 지정하고 프롬프트로 내용을 채웁니다.',
        items: [
          ['마스크 방법', 'LoadImage → MaskEditor로 브러시로 영역 선택. 흰색 영역이 생성 대상.'],
          ['Denoising Strength', '0.5~0.7 권장. 1.0은 완전히 새로 생성, 0.3은 기존 내용 유지.'],
          ['Inpaint 전용 모델', '일반 SD 모델보다 Inpaint 전용 모델 사용 시 품질 향상. realistic-vision-inpaint 권장.'],
          ['컨텍스트 확장', '"only masked" 옵션 대신 전체 이미지를 컨텍스트로 주면 주변과 더 자연스럽게 합성됨.'],
        ],
        examples: [
          '빈 주방에 가구 추가: 가구 놓을 자리를 마스크 → "matte black cabinet, modern minimal" 프롬프트',
          '기존 가구 교체: 현재 가구를 마스크 → 원하는 스타일 프롬프트로 교체',
          '바닥 재질 변경: 바닥 영역을 마스크 → "white oak herringbone floor" 등 재질 프롬프트',
        ],
      },
      {
        heading: 'IPAdapter — 스타일 일관성 유지',
        body: '참조 이미지의 색감, 재질, 분위기를 새로 생성되는 이미지에 이식합니다. 가구 브랜드의 시각적 일관성 유지에 필수.',
        items: [
          ['기본 연결', 'IPAdapterModelLoader → IPAdapter 노드 → KSampler. 참조 이미지를 ClipVisionEncode에 연결.'],
          ['Weight 설정', '0.6~0.8 권장. 1.0은 참조 이미지와 너무 유사해짐. 0.4 이하는 효과 미미.'],
          ['IPAdapter Plus', '기본 IPAdapter보다 세밀한 스타일 이식. 얼굴·질감 보존에 강함.'],
          ['FaceID 변형', '제품 로고·특정 텍스처를 일관되게 유지할 때 FaceID 모델 활용 가능.'],
        ],
        examples: [
          '브랜드 스타일 유지: 기존 제품 이미지를 참조 → 새 환경에서도 같은 마감·톤 유지',
          '공간 분위기 복사: 인테리어 레퍼런스를 참조 → 생성 이미지에 동일 분위기 적용',
        ],
      },
      {
        heading: 'ControlNet (Depth / Normal) — 공간감 유지',
        body: '실사 사진의 3D 공간 구조를 분석해서 합성 시 원근감이 무너지지 않도록 합니다.',
        items: [
          ['Depth 맵', 'MiDaS Depth Estimation으로 공간의 깊이 정보 추출. 가구가 공간에 올바르게 배치됨.'],
          ['Normal 맵', '표면 방향 정보. 조명 반응을 더 정확하게 맞출 때 사용.'],
          ['ControlNet 강도', 'Depth는 0.7~0.9 권장. 너무 높으면 뻣뻣해짐.'],
          ['Lineart / Canny', '가구 윤곽선을 유지하면서 재질만 바꿀 때 사용. 형태 변형 없이 스타일 교체.'],
        ],
        steps: [
          '실사 공간 이미지를 DepthEstimator 노드에 입력',
          '출력된 Depth 맵을 ControlNet Apply 노드에 연결',
          'ControlNet 모델: control_v11f1p_sd15_depth.pth 로드',
          'KSampler에 conditioning과 함께 연결',
          'Depth 맵이 공간 구조를 올바르게 읽는지 미리보기로 확인',
        ],
      },
      {
        heading: 'Rembg / SAM — 배경 분리',
        body: '합성할 가구나 오브젝트의 배경을 자동으로 제거합니다. 수동 마스킹 없이 깔끔하게 오브젝트만 분리.',
        items: [
          ['Rembg', 'U2Net 모델 기반 배경 제거. 단순한 배경엔 빠르고 정확. ComfyUI-rembg 익스텐션으로 설치.'],
          ['SAM (Segment Anything)', 'Meta의 SAM 모델. 복잡한 배경도 클릭 한 번으로 정밀 분리. 느리지만 정확.'],
          ['출력 활용', '분리된 이미지(RGBA) → LoadImage로 다시 불러와서 Inpaint/합성에 활용.'],
          ['엣지 정리', '배경 제거 후 엣지가 거칠면 GrowMask + Feather로 자연스럽게 다듬기.'],
        ],
        examples: [
          '가구 이미지 배경 제거: 제품 사진 → Rembg → 투명 배경 가구만 추출',
          '복잡한 의자 분리: 다리 사이 배경이 복잡하면 SAM + 클릭 선택으로 정밀 마스킹',
        ],
      },
      {
        heading: 'ImageComposite / Blend — 레이어 합성',
        body: '분리된 가구 이미지를 공간 이미지 위에 자연스럽게 올립니다. 블렌드 모드와 투명도 조절로 마감.',
        items: [
          ['ImageComposite 노드', '전경(가구) + 배경(공간) + 마스크 → 합성. x/y 좌표로 위치 조절.'],
          ['Blend 모드', 'Normal: 일반 합성. Multiply: 그림자 강조. Screen: 빛 효과. Overlay: 색감 믹싱.'],
          ['그림자 추가', '합성 가구 아래에 Gaussian Blur 처리한 어두운 타원 → Multiply로 그림자 표현.'],
          ['색온도 매칭', 'Color Correct 노드로 가구 색온도를 공간 사진에 맞게 보정.'],
        ],
      },
    ],
  },

  composite: {
    title: '가구 합성 실전 워크플로우',
    subtitle: 'Silence & Sculpture 같은 가구 비주얼 작업을 ComfyUI로 완성하는 단계별 실전 가이드.',
    sections: [
      {
        heading: '전체 파이프라인',
        body: '실사 공간에 AI 생성 가구를 합성하는 전체 흐름입니다. 5단계로 나뉩니다.',
        steps: [
          'Step 1 — 재료 준비: 빈 공간 사진 + 합성할 가구 레퍼런스 이미지',
          'Step 2 — 공간 분석: ControlNet Depth로 공간 구조 파악',
          'Step 3 — 가구 생성: Inpaint + IPAdapter로 공간에 맞는 가구 생성',
          'Step 4 — 합성 & 마스킹: Rembg로 배경 제거 후 ImageComposite로 합성',
          'Step 5 — 마감: 그림자 추가, 색온도 맞추기, 최종 보정',
        ],
      },
      {
        heading: 'Step 1 — 재료 준비',
        body: '좋은 합성 결과는 좋은 재료에서 시작됩니다. 이 기준으로 사진을 준비하세요.',
        items: [
          ['공간 사진', '가구를 넣을 빈 방/공간. 조명 방향이 명확하고 바닥-벽 경계선이 보이는 각도 권장.'],
          ['가구 레퍼런스', '합성하고 싶은 가구의 이미지. 여러 각도 있으면 좋음. IPAdapter 참조용.'],
          ['해상도', '최소 1024×1024. 합성 후 다운스케일하는 방식으로 작업하면 품질 유지.'],
          ['조명 메모', '공간 사진의 빛이 어느 방향에서 오는지 메모. 합성 가구 그림자 방향에 사용.'],
        ],
      },
      {
        heading: 'Step 2 — 공간 분석 (ControlNet Depth)',
        body: '공간의 3D 구조를 읽어서 가구가 공간에 자연스럽게 놓이게 합니다.',
        steps: [
          'LoadImage 노드에 공간 사진 로드',
          'DepthEstimator 노드 연결 (DPT_Large 모델 권장)',
          'Depth 맵 미리보기로 공간 구조 확인 (가까울수록 밝게, 멀수록 어둡게)',
          'ControlNet Apply 노드에 Depth 맵 연결 (강도: 0.75)',
          'control_v11f1p_sd15_depth.pth 모델 로드',
        ],
        examples: [
          'Depth 맵에서 바닥이 밝고 벽이 어두우면 정상. 반대라면 Invert 노드 추가.',
          '가구를 놓을 바닥 영역이 Depth 맵에서 균일한 톤이어야 합성 시 안정적.',
        ],
      },
      {
        heading: 'Step 3 — 가구 생성 (Inpaint + IPAdapter)',
        body: '공간 사진 위에 가구를 직접 생성합니다. ControlNet이 공간 구조를, IPAdapter가 스타일을 잡아줍니다.',
        steps: [
          'MaskEditor로 가구를 놓을 영역에 마스크 그리기 (흰색 = 생성 영역)',
          'IPAdapter 노드에 가구 레퍼런스 이미지 연결 (Weight: 0.7)',
          'Inpaint 전용 모델 로드 (실사 작업: realistic-vision-inpaint 권장)',
          '프롬프트 작성: 가구 종류 + 재질 + 조명 방향 + photorealistic',
          'Denoising Strength: 0.65~0.75 (너무 낮으면 기존 이미지가 남음)',
          '5~10회 생성 후 가장 자연스러운 결과 선택',
        ],
        examples: [
          '"matte black sideboard, solid oak legs, minimal Japanese design, soft directional light from left, photorealistic"',
          '"white marble dining table, brushed steel base, morning light, photorealistic, 8k"',
          '"walnut lounge chair, bouclé upholstery, warm tungsten interior lighting, photorealistic"',
        ],
      },
      {
        heading: 'Step 4 — 합성 & 마스킹',
        body: '생성된 가구를 원본 공간에 붙여넣는 단계입니다. 엣지를 자연스럽게 처리하는 게 핵심.',
        steps: [
          '생성된 가구 이미지를 Rembg 노드로 배경 제거 (RGBA 출력)',
          '엣지 확인: 거친 부분은 GrowMask + Feather로 부드럽게',
          'ImageComposite 노드에 배경(원본 공간) + 전경(가구) + 마스크 연결',
          'x/y 좌표와 Scale로 가구 위치·크기 조절',
          '바닥 반사 있는 공간이면 Flip + Opacity 20~30%로 반사광 표현',
        ],
      },
      {
        heading: 'Step 5 — 마감 보정',
        body: '합성이 자연스럽게 보이려면 마지막 보정이 결정적입니다.',
        items: [
          ['그림자', '타원형 마스크 → Gaussian Blur 30~50px → Multiply 블렌드, Opacity 40~60%. 빛 방향에 맞춰 오프셋.'],
          ['색온도 매칭', 'Color Correct 노드로 합성 가구의 색온도를 공간 사진과 맞춤. 특히 화이트밸런스.'],
          ['노이즈 매칭', '공간 사진에 노이즈가 있다면 합성 가구에도 같은 강도의 Add Noise 적용.'],
          ['최종 LUT', '전체 이미지에 동일한 LUT/색보정 적용해서 공간-가구 톤 통일. DaVinci 또는 Photoshop.'],
        ],
      },
    ],
  },

  tips: {
    title: '완성도를 높이는 팁',
    subtitle: '합성이 어색해 보이는 원인과 해결법. 이 4가지만 잡으면 자연스러운 합성 완성.',
    sections: [
      {
        heading: '합성이 들키는 4가지 원인',
        body: '대부분의 어색한 합성은 이 4가지 중 하나 이상이 어긋나서 발생합니다.',
        items: [
          ['조명 방향 불일치', '공간 사진의 그림자와 생성 가구의 그림자 방향이 다르면 즉시 들킴. 생성 프롬프트에 조명 방향 명시 필수.'],
          ['노이즈/질감 차이', '공간 사진은 카메라 노이즈가 있지만 AI 생성 이미지는 너무 깨끗. Add Noise로 동일화.'],
          ['색온도 불일치', '실내 사진은 따뜻하고 AI 생성은 차가운 경우가 많음. Color Correct로 매칭.'],
          ['엣지 처리 미흡', '가구 엣지가 너무 선명하면 배경과 분리되어 보임. Feather 2~5px 기본 적용.'],
        ],
      },
      {
        heading: '조명 매칭 방법',
        body: '조명 방향을 맞추는 것이 자연스러운 합성의 핵심입니다.',
        steps: [
          '공간 사진에서 그림자 방향 파악 (어느 방향으로 그림자가 드리워지는지)',
          '프롬프트에 조명 방향 명시: "light from top-left", "warm side lighting from right"',
          '생성 후 가구의 하이라이트·그림자 방향이 공간과 일치하는지 확인',
          '불일치 시 생성 프롬프트 조정해서 재생성 (조명 관련 키워드 수정)',
          '미세 조정은 Photoshop에서 Dodge/Burn 툴로 수동 보정',
        ],
      },
      {
        heading: '배치 처리 팁',
        body: '같은 공간에 여러 가구 옵션을 만들 때 배치 처리로 시간을 절약합니다.',
        items: [
          ['워크플로우 복사', 'ComfyUI에서 같은 워크플로우를 복제하고 프롬프트만 변경해서 병렬 실행.'],
          ['Queue Prompt', '여러 프롬프트를 큐에 넣어두면 순차적으로 자동 처리됨. 자리 비워도 OK.'],
          ['Seed 변경', '같은 프롬프트로 Seed만 바꿔서 10~20개 결과 생성 후 최고 선택.'],
          ['WAS Node Suite', '설치하면 폴더 내 이미지 전체를 일괄 처리하는 배치 노드 사용 가능.'],
        ],
        examples: [
          '같은 주방 공간에 가구 색상 5가지 옵션 생성: 프롬프트에서 색상 키워드만 교체',
          '클라이언트 A/B 비교: 같은 공간에 2가지 스타일 가구를 배치 생성',
        ],
      },
      {
        heading: '워크플로우 JSON 공유',
        body: 'ComfyUI 워크플로우를 JSON으로 저장해서 재사용하거나 팀과 공유합니다.',
        items: [
          ['저장', '캔버스 우클릭 → Save (Ctrl+S) → JSON 파일로 저장.'],
          ['불러오기', '저장된 JSON을 ComfyUI에 드래그앤드롭 또는 Load 버튼으로 불러오기.'],
          ['커뮤니티 워크플로우', 'civitai.com, ComfyUI Wiki에 검증된 워크플로우 공유됨. 그대로 불러와서 쓸 수 있음.'],
          ['버전 관리', '작업 완료된 워크플로우는 날짜+프로젝트명으로 파일 저장. 롤백 가능.'],
        ],
      },
    ],
  },
};

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
