/* VFX 가이드 콘텐츠 데이터 */
var GUIDE_CONTENT = {

  /* ── 1. 워크플로우 단계 ── */
  workflow: [
    {
      num: 1,
      title: '컨셉 & 레퍼런스 수집',
      desc: '만들고 싶은 장면의 분위기, 색감, 구도를 레퍼런스 이미지로 모읍니다. Pinterest, ArtStation, 영화 스틸컷 등을 활용하세요. 이 단계에서 "어떤 느낌"인지 명확히 할수록 이후 프롬프트 작성이 훨씬 쉬워집니다.',
      tools: ['Pinterest', 'ArtStation', 'Moodboard']
    },
    {
      num: 2,
      title: '스틸 이미지 생성',
      desc: '핵심 장면을 정지 이미지로 먼저 만들어 구도·색감·스타일을 확정합니다. 영상 생성 전 시각적 방향을 확인하는 체크포인트입니다. 이미지를 영상 생성의 첫 프레임으로 활용할 수도 있습니다.',
      tools: ['Midjourney', 'Flux', 'Ideogram', 'Adobe Firefly']
    },
    {
      num: 3,
      title: 'AI 영상 생성',
      desc: '확정된 이미지를 기반으로 영상을 생성합니다. Image-to-Video 기능을 활용하면 일관성이 높아집니다. 카메라 무브, 속도, 분위기를 프롬프트로 제어합니다.',
      tools: ['Runway Gen-4', 'Kling', 'Hailuo', 'Sora', 'Veo 3', 'Wan']
    },
    {
      num: 4,
      title: '소재 편집 & 합성',
      desc: '생성된 영상 클립들을 편집하고 VFX 요소를 합성합니다. 배경 교체, 오브젝트 추가, 스피드 조절 등을 합니다. 여러 클립을 자연스럽게 연결하는 것이 핵심입니다.',
      tools: ['Adobe Premiere', 'DaVinci Resolve', 'After Effects', 'CapCut']
    },
    {
      num: 5,
      title: '컬러 그레이딩',
      desc: '최종 색감과 분위기를 완성합니다. LUT(Look Up Table)를 적용하거나 직접 색보정으로 영화적 느낌을 만듭니다. 밝기·대비·채도·색온도를 조절해 일관된 무드를 만드세요.',
      tools: ['DaVinci Resolve', 'Lightroom', 'Premiere Pro']
    },
    {
      num: 6,
      title: '사운드 & 최종 출력',
      desc: '음악, 효과음, 앰비언스를 입혀 완성도를 높입니다. AI 음악 생성 도구도 활용할 수 있습니다. MOV(ProRes) 또는 MP4(H.264)로 목적에 맞는 포맷으로 출력합니다.',
      tools: ['ElevenLabs', 'Suno', 'Udio', 'Adobe Audition']
    }
  ],

  /* ── 2. 도구 비교 ── */
  tools: [
    {
      id: 'runway',
      name: 'Runway Gen-4',
      icon: '🛫',
      color: '#00c2ff',
      type: '영상 생성',
      desc: '할리우드 수준의 영화적 품질. Act One 기능으로 캐릭터 일관성이 뛰어나며, 카메라 무브 제어가 정교합니다. 프롬프트보다 레퍼런스 이미지 활용이 효과적.',
      strengths: ['영화적 품질', '카메라 제어', '캐릭터 일관성', 'Image-to-Video']
    },
    {
      id: 'kling',
      name: 'Kling AI',
      icon: '⚡',
      color: '#ff6b35',
      type: '영상 생성',
      desc: '쾌속 3D 렌더링 기술 기반. 물리 법칙을 잘 따르며 영상 품질이 안정적입니다. 한국어 프롬프트도 잘 이해하고, 가성비가 좋습니다.',
      strengths: ['물리 시뮬레이션', '안정적 품질', '가성비', '긴 클립']
    },
    {
      id: 'hailuo',
      name: 'Hailuo (MiniMax)',
      icon: '🌊',
      color: '#5b8fff',
      type: '영상 생성',
      desc: '미니맥스의 Hailuo AI. 포토리얼리스틱한 인물 영상에 강점. 무료 크레딧이 넉넉하고 영상 해상도가 높습니다.',
      strengths: ['포토리얼리스틱', '인물 영상', '무료 크레딧', '고해상도']
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      icon: '🎨',
      color: '#9b59b6',
      type: '이미지 생성',
      desc: '세계 최고 수준의 이미지 생성 AI. --style, --v 파라미터로 세밀한 제어가 가능합니다. 영상의 첫 프레임이나 컨셉 아트 생성에 최적.',
      strengths: ['예술적 품질', '다양한 스타일', '파라미터 제어', '컨셉 아트']
    },
    {
      id: 'flux',
      name: 'Flux (Black Forest)',
      icon: '⚗️',
      color: '#34d399',
      type: '이미지 생성',
      desc: 'Stable Diffusion 제작팀이 만든 차세대 이미지 AI. 텍스트 렌더링이 뛰어나고 세밀한 프롬프트 이해력을 가집니다. ComfyUI 등과 연동 가능.',
      strengths: ['텍스트 렌더링', '프롬프트 이해력', '오픈소스', '세밀한 제어']
    },
    {
      id: 'sora',
      name: 'Sora (OpenAI)',
      icon: '☀️',
      color: '#fbbf24',
      type: '영상 생성',
      desc: 'OpenAI의 영상 생성 AI. 긴 영상과 복잡한 장면 전환에 강합니다. 물리적 일관성이 뛰어나며 스토리텔링 중심 영상에 적합.',
      strengths: ['긴 영상', '장면 전환', '물리 일관성', '스토리텔링']
    },
    {
      id: 'veo',
      name: 'Veo 3 (Google)',
      icon: '🔮',
      color: '#4285f4',
      type: '영상 생성',
      desc: 'Google DeepMind의 최신 영상 생성 AI. 오디오(대화, 효과음) 동시 생성이 가능한 유일한 도구입니다. 자연스러운 모션과 물리 표현이 뛰어납니다.',
      strengths: ['오디오 동시 생성', '자연스러운 모션', '사운드 이펙트', '다이얼로그 생성']
    }
  ],

  /* ── 3. 프롬프트 용어집 ── */
  glossary: [
    {
      id: 'shot',
      icon: '🎬',
      title: '샷 타입 (Shot Types)',
      subtitle: '카메라가 피사체를 얼마나 가까이 찍는지',
      terms: [
        { en: 'ECU (Extreme Close-Up)', ko: '극단 클로즈업', desc: '눈, 입술 등 신체 일부만. 감정의 극단적 표현' },
        { en: 'CU (Close-Up)', ko: '클로즈업', desc: '얼굴 전체. 감정 전달에 가장 효과적' },
        { en: 'MCU (Medium Close-Up)', ko: '미디엄 클로즈업', desc: '가슴 위. 대화 장면에 자주 사용' },
        { en: 'MS (Medium Shot)', ko: '미디엄샷', desc: '허리 위. 인물과 주변 환경을 함께 표현' },
        { en: 'MWS (Medium Wide Shot)', ko: '미디엄 와이드샷', desc: '무릎 위. 전신에 가까운 인물 표현' },
        { en: 'WS (Wide Shot)', ko: '와이드샷', desc: '인물 전신 + 주변 환경. 공간감 전달' },
        { en: 'EWS (Extreme Wide Shot)', ko: '익스트림 와이드샷', desc: '광활한 환경. 인물이 작게. 장대한 스케일' },
        { en: 'Aerial Shot', ko: '항공샷', desc: '하늘 위에서 내려다보는 시점' },
        { en: 'POV Shot', ko: '주관적 시점', desc: '캐릭터의 눈으로 보는 시점' },
        { en: 'Over-the-Shoulder', ko: '어깨너머 샷', desc: '한 인물의 어깨 뒤에서 다른 인물을 바라봄' },
        { en: 'Dutch Angle', ko: '더치 앵글', desc: '카메라를 기울인 불안감 조성 구도' },
        { en: 'Bird\'s Eye View', ko: '버드아이뷰', desc: '정면 위에서 수직으로 내려다보는 시점' }
      ]
    },
    {
      id: 'camera',
      icon: '📹',
      title: '카메라 무브 (Camera Movements)',
      subtitle: '카메라가 어떻게 움직이는지',
      terms: [
        { en: 'Dolly In', ko: '달리인', desc: '카메라가 피사체를 향해 전진. 긴장감 상승' },
        { en: 'Dolly Out / Pull Back', ko: '달리아웃 / 풀백', desc: '카메라가 피사체에서 후퇴. 공간 확장' },
        { en: 'Pan Left / Pan Right', ko: '팬 좌/우', desc: '카메라가 좌우로 수평 회전' },
        { en: 'Tilt Up / Tilt Down', ko: '틸트 업/다운', desc: '카메라가 위아래로 수직 회전' },
        { en: 'Orbit / Arc Shot', ko: '오빗샷', desc: '피사체 주변을 원을 그리며 회전' },
        { en: 'Crane Shot', ko: '크레인샷', desc: '카메라가 크게 위아래로 이동. 웅장함 표현' },
        { en: 'Steadicam', ko: '스테디캠', desc: '부드럽고 안정된 이동. 팔로우샷에 사용' },
        { en: 'Handheld', ko: '핸드헬드', desc: '의도적인 흔들림. 현실감, 긴박감 연출' },
        { en: 'Rack Focus', ko: '랙 포커스', desc: '포커스가 한 피사체에서 다른 피사체로 이동' },
        { en: 'Zoom In / Zoom Out', ko: '줌인 / 줌아웃', desc: '렌즈를 조절해 시야각 변경. 달리와 다름' },
        { en: 'Static / Locked Off', ko: '정적 샷', desc: '카메라 움직임 없음. 절제된 연출' },
        { en: 'Tracking Shot', ko: '트래킹샷', desc: '움직이는 피사체를 따라가며 촬영' }
      ]
    },
    {
      id: 'lighting',
      icon: '💡',
      title: '조명 (Lighting)',
      subtitle: '빛의 방향, 색상, 강도',
      terms: [
        { en: 'Golden Hour', ko: '골든아워', desc: '해질녘·해뜰녘의 따뜻한 황금빛 자연광' },
        { en: 'Blue Hour', ko: '블루아워', desc: '해진 직후의 청보라빛 자연광. 신비로운 분위기' },
        { en: 'Rembrandt Lighting', ko: '렘브란트 조명', desc: '뺨에 작은 삼각형 빛. 예술적·드라마틱' },
        { en: 'High-Key Lighting', ko: '하이키 조명', desc: '밝고 그림자 적음. 밝고 경쾌한 분위기' },
        { en: 'Low-Key Lighting', ko: '로우키 조명', desc: '어둡고 강한 그림자. 스릴러·느와르' },
        { en: 'Rim Light / Backlight', ko: '림라이트', desc: '피사체 뒤에서 오는 빛. 실루엣 강조' },
        { en: 'Practical Lights', ko: '프랙티컬 라이트', desc: '화면 안에 보이는 실제 광원(램프, 화면 등)' },
        { en: 'Volumetric Light', ko: '체적 조명', desc: '빛 줄기가 보이는 효과. 안개·먼지 환경에서' },
        { en: 'Neon Lighting', ko: '네온 조명', desc: '도심의 네온 색조. 사이버펑크·야간 씬' },
        { en: 'Chiaroscuro', ko: '키아로스쿠로', desc: '강한 명암 대비. 미술적, 드라마틱 표현' },
        { en: 'Overcast / Diffused', ko: '흐린날 조명', desc: '구름 낀 날의 부드러운 분산광. 자연스러움' },
        { en: 'Motivated Lighting', ko: '모티베이티드 조명', desc: '장면 안 광원에서 논리적으로 오는 조명' }
      ]
    },
    {
      id: 'filmlook',
      icon: '🎞️',
      title: '필름 룩 & 분위기 (Film Look)',
      subtitle: '화면의 시각적 질감과 분위기',
      terms: [
        { en: 'Anamorphic Lens Flare', ko: '아나모픽 렌즈 플레어', desc: '수평으로 퍼지는 블루 빛줄기. 영화적 룩' },
        { en: 'Film Grain', ko: '필름 그레인', desc: '필름 카메라의 입자감. 복고적·따뜻한 느낌' },
        { en: 'Shallow DOF', ko: '얕은 심도', desc: '배경 흐림(보케). 피사체 강조' },
        { en: 'Deep DOF', ko: '깊은 심도', desc: '전경부터 배경까지 모두 선명' },
        { en: 'Bokeh', ko: '보케', desc: '초점 외 영역의 아름다운 빛 번짐' },
        { en: 'Motion Blur', ko: '모션 블러', desc: '빠른 움직임의 자연스러운 잔상 효과' },
        { en: 'Vignette', ko: '비네트', desc: '화면 가장자리가 어두워지는 효과' },
        { en: 'Cinematic Aspect Ratio', ko: '시네마틱 화면비', desc: '2.39:1 또는 2.35:1의 와이드 영화 비율' },
        { en: 'Desaturated', ko: '채도 낮춤', desc: '색이 빠진 듯한 차갑고 현실적인 분위기' },
        { en: 'Teal and Orange', ko: '틸&오렌지', desc: '할리우드 영화의 대표적 색보정. 차갑고 따뜻함의 대비' },
        { en: 'Hyperrealistic', ko: '하이퍼리얼리스틱', desc: '실사보다 더 실사처럼 보이는 극도의 현실감' },
        { en: 'Photorealistic', ko: '포토리얼리스틱', desc: '사진처럼 실제적인 시각 표현' }
      ]
    },
    {
      id: 'motion',
      icon: '⚡',
      title: '모션 & 효과 (Motion & VFX)',
      subtitle: '움직임과 특수 효과 관련 용어',
      terms: [
        { en: 'Slow Motion / Slo-Mo', ko: '슬로모션', desc: '극도로 느린 움직임. 감동적 순간 강조' },
        { en: 'Speed Ramp', ko: '스피드 램프', desc: '정상→슬로→빠름으로 속도 변화. 역동성' },
        { en: 'Time-Lapse', ko: '타임랩스', desc: '빠르게 흘러가는 시간 표현' },
        { en: 'Parallax Effect', ko: '패럴랙스 효과', desc: '전경과 배경의 속도 차이로 깊이감 표현' },
        { en: 'Particle System', ko: '파티클 시스템', desc: '먼지, 불꽃, 연기 등 입자 효과' },
        { en: 'Chromatic Aberration', ko: '색수차', desc: '렌즈 왜곡으로 RGB가 분리되는 효과' },
        { en: 'Glitch Effect', ko: '글리치 효과', desc: '디지털 신호 오류처럼 보이는 분열 효과' },
        { en: 'Bullet Time', ko: '불릿 타임', desc: '카메라가 피사체 주변을 회전하며 슬로모션' },
        { en: 'Match Cut', ko: '매치컷', desc: '형태나 움직임이 유사한 두 장면의 연결' },
        { en: 'Bloom / Glow', ko: '블룸 / 글로우', desc: '빛이 과다 노출되어 번지는 효과' },
        { en: 'Depth of Field Shift', ko: '피사계 심도 이동', desc: '포커스 영역이 이동하는 효과' },
        { en: 'Freeze Frame', ko: '프리즈 프레임', desc: '움직임이 멈추는 정지 효과' }
      ]
    }
  ],

  /* ── 4. 카메라 무브 빌더 ── */
  cameraBuilder: [
    {
      id: 'height',
      label: '📏 카메라 높이',
      multi: false,
      options: [
        { label: '지면 레벨', prompt: 'ground level, worm\'s eye perspective' },
        { label: '눈높이', prompt: 'eye-level shot' },
        { label: '하이앵글', prompt: 'high angle looking down' },
        { label: '버드아이뷰', prompt: 'bird\'s eye view, overhead' },
        { label: '드론 고도', prompt: 'aerial drone altitude, high above ground' }
      ]
    },
    {
      id: 'start',
      label: '🎯 시작 위치',
      multi: false,
      options: [
        { label: '왼쪽', prompt: 'starting from the left side of subject' },
        { label: '가운데', prompt: 'starting from center, directly facing subject' },
        { label: '오른쪽', prompt: 'starting from the right side of subject' },
        { label: '피사체 뒤', prompt: 'starting from behind subject' },
        { label: '피사체 앞', prompt: 'starting from in front of subject' }
      ]
    },
    {
      id: 'move',
      label: '➡️ 이동 방식',
      multi: true,
      options: [
        { label: '왼쪽 팬', prompt: 'panning left' },
        { label: '오른쪽 팬', prompt: 'panning right' },
        { label: '틸트 업', prompt: 'tilting up' },
        { label: '틸트 다운', prompt: 'tilting down' },
        { label: '달리인 (전진)', prompt: 'dolly in, pushing toward subject' },
        { label: '풀백 (후퇴)', prompt: 'pulling back away from subject' },
        { label: '시계방향 오빗', prompt: 'orbiting clockwise around subject' },
        { label: '반시계 오빗', prompt: 'orbiting counter-clockwise around subject' },
        { label: '상승', prompt: 'camera rising upward, crane up' },
        { label: '하강', prompt: 'camera descending, crane down' },
        { label: '달리줌 (버티고)', prompt: 'dolly zoom, background shifting while subject stays' }
      ]
    },
    {
      id: 'end',
      label: '🏁 끝 위치',
      multi: false,
      options: [
        { label: '가운데 정착', prompt: 'settling at center frame' },
        { label: '피사체 클로즈업', prompt: 'ending in close-up on subject' },
        { label: '왼쪽', prompt: 'ending framed left' },
        { label: '오른쪽', prompt: 'ending framed right' },
        { label: '와이드샷 리빌', prompt: 'pulling back to reveal wide establishing shot' },
        { label: '피사체 뒤', prompt: 'ending behind subject, over-shoulder view' }
      ]
    },
    {
      id: 'speed',
      label: '⏱ 속도',
      multi: false,
      options: [
        { label: '아주 느리게', prompt: 'imperceptibly slow, barely perceptible motion' },
        { label: '느리게', prompt: 'slow and deliberate' },
        { label: '보통', prompt: 'steady pace' },
        { label: '빠르게', prompt: 'swift and dynamic' },
        { label: '스피드 램프', prompt: 'speed ramping, transitioning from slow to fast motion' }
      ]
    },
    {
      id: 'feel',
      label: '🎥 장비 느낌',
      multi: false,
      options: [
        { label: '스테디캠', prompt: 'smooth steadicam, fluid stabilized motion' },
        { label: '핸드헬드', prompt: 'handheld, slight organic shake' },
        { label: '드론', prompt: 'cinematic drone, aerial vehicle movement' },
        { label: '크레인 / 짐벌', prompt: 'crane or jib arm movement' },
        { label: '슬라이더', prompt: 'camera slider, linear lateral motion' }
      ]
    }
  ],

  /* ── 5. 프롬프트 모음 ── */
  promptLibrary: [
    {
      id: 'atmosphere',
      icon: '🌫️',
      title: '분위기 & 대기',
      items: [
        { label: '볼류메트릭 안개', prompt: 'volumetric fog, atmospheric haze, god rays piercing through mist, soft depth cues' },
        { label: '열기 아지랑이', prompt: 'heat haze shimmer, thermal distortion, wavering air above hot surface' },
        { label: '먼지 & 파티클', prompt: 'floating dust particles, airborne debris, micro-particulates caught in light beams' },
        { label: '연기 흐름', prompt: 'wispy smoke tendrils rising, dissipating vapor trails, layered smoke plumes' },
        { label: '빗속 수증기', prompt: 'rain droplets, spray mist, wet surface reflections, water vapor in air' },
        { label: '눈 내림', prompt: 'gently falling snowflakes, snow drift particles, winter air, frost patterns on surface' },
        { label: '모래 & 먼지 폭풍', prompt: 'sand particles swirling, dust storm wall, gritty airborne debris, amber haze' }
      ]
    },
    {
      id: 'light',
      icon: '✨',
      title: '빛 & 발광',
      items: [
        { label: '아나모픽 렌즈 플레어', prompt: 'anamorphic lens flare, horizontal blue-tinted light streak, cinematic optical flare' },
        { label: '고드레이 (빛 산란)', prompt: 'god rays, crepuscular rays, light shafts piercing through atmosphere, volumetric light beams' },
        { label: '글로우 & 블룸', prompt: 'bloom effect, glowing overexposed highlights, soft light bloom around bright sources' },
        { label: '네온 발광', prompt: 'neon glow, electric luminescence, vivid colored light emission, iridescent halo' },
        { label: '에너지 오러', prompt: 'energy aura emanating, bioluminescent glow, magical luminescence radiating outward from subject' },
        { label: '반사 & 리플렉션', prompt: 'wet ground reflections, mirror-like surface, specular highlights, chrome-like reflectivity' },
        { label: '캐우스틱 (수면 반사광)', prompt: 'caustic light patterns, underwater light ripples, refracted light dancing on surface' }
      ]
    },
    {
      id: 'fire',
      icon: '🔥',
      title: '불 & 폭발',
      items: [
        { label: '화염', prompt: 'realistic fire simulation, dynamic flame with orange-red body and blue core, fire licking upward' },
        { label: '대형 폭발', prompt: 'massive explosion, expanding fireball, shockwave ring, debris scatter, concentric pressure wave, dust curtain' },
        { label: '불꽃 파티클', prompt: 'ember particles scattering, fire sparks drifting, glowing cinders floating upward in heat' },
        { label: '연소 연기', prompt: 'thick black smoke billowing from fire, dark rolling combustion smoke, turbulent smoke clouds' },
        { label: '작은 불씨 & 횃불', prompt: 'small flame flicker, torch fire, subtle flame detail, warm amber glow from nearby flame' },
        { label: '용암 & 마그마', prompt: 'molten lava flow, glowing magma cracks, incandescent liquid rock, red-orange heat emission' }
      ]
    },
    {
      id: 'energy',
      icon: '⚡',
      title: '전기 & 에너지',
      items: [
        { label: '번개 & 전기 아크', prompt: 'electric lightning arc, plasma discharge, branching lightning bolts, high-voltage spark, crackling electricity' },
        { label: '에너지 빔', prompt: 'concentrated energy beam, laser bolt, directional light ray, focused energy pulse traveling' },
        { label: '플라즈마', prompt: 'plasma tendrils, ionized gas discharge, purple-white plasma orb, electric plasma wisps' },
        { label: '충격파 & 압력파', prompt: 'expanding shockwave ring, pressure wave distortion, impact ripple moving outward, atmospheric concussion' },
        { label: '홀로그램', prompt: 'translucent blue holographic projection, digital ghost image, scanline overlay, light-field display flicker' },
        { label: '포털 & 워프', prompt: 'swirling portal vortex, space-time distortion, dimensional rift edge, event horizon distortion ring' }
      ]
    },
    {
      id: 'water',
      icon: '💧',
      title: '물 & 액체',
      items: [
        { label: '물 스플래시', prompt: 'water splash impact, droplets explosion, liquid crown shape, water droplets in slow motion' },
        { label: '파도 & 해양', prompt: 'ocean wave crests, white foam breaking, churning water surface, spray off wave top' },
        { label: '빗속 & 빗물', prompt: 'heavy rainfall streaks, puddle ripple rings, rain-soaked reflective surface, water running down glass' },
        { label: '흐르는 물', prompt: 'flowing water stream, river current turbulence, water cascading over rocks, liquid flow simulation' },
        { label: '수증기 & 김', prompt: 'steam rising from surface, vapor clouds, hot spring mist curling upward, condensation wisps' },
        { label: '빙하 & 얼음', prompt: 'ice crystal formation, frost spreading, glacial surface, translucent ice with internal cracks and bubbles' }
      ]
    },
    {
      id: 'composition',
      icon: '🎞️',
      title: '컴포지션 & 레이어',
      items: [
        { label: '전경 레이어', prompt: 'out-of-focus foreground elements, near-field bokeh, blurred leaves or debris in extreme foreground' },
        { label: '전경-중경-배경 분리', prompt: 'distinct foreground midground background separation, depth layering, three-plane composition' },
        { label: '얕은 피사계 심도', prompt: 'shallow depth of field, selective focus on subject, smooth creamy bokeh background, f/1.4 aperture look' },
        { label: '대기 원근 (거리감)', prompt: 'atmospheric perspective, aerial haze at distance, far objects desaturated and blue-shifted, depth fog layers' },
        { label: '프레임 인 프레임', prompt: 'natural framing with foreground arch or window, frame within frame composition, environmental framing element' },
        { label: '대칭 & 반영', prompt: 'perfect symmetrical composition, reflective surface doubling scene, mirror axis alignment' },
        { label: '실루엣 컷', prompt: 'strong silhouette against bright background, rim lighting only, figure as dark shape against glowing sky' }
      ]
    },
    {
      id: 'cut',
      icon: '✂️',
      title: '영상 전환 효과 (편집 트랜지션)',
      items: [
        { label: '하드컷', prompt: 'hard cut, abrupt scene change, instantaneous cut to next shot, no transition' },
        { label: '스매시컷', prompt: 'smash cut, sudden jarring cut to contrasting scene, impact cut for comedic or dramatic effect' },
        { label: '디졸브', prompt: 'cross dissolve transition, scenes blending together, soft fade overlap between two shots' },
        { label: '페이드 인 / 아웃', prompt: 'fade from black, gradual exposure increase from darkness, fade to black at end of scene' },
        { label: '매치컷', prompt: 'match cut, visual continuity between two scenes sharing shape or motion, graphic match edit' },
        { label: '점프컷', prompt: 'jump cut, temporal ellipsis, same subject slightly repositioned between cuts, time skip effect' },
        { label: 'J컷 / L컷', prompt: 'L-cut audio overlap, previous scene audio continues over new visual, smooth narrative transition' },
        { label: '와이프 트랜지션', prompt: 'wipe transition, new scene sweeping across frame edge, directional wipe left to right' },
        { label: '화면 분할 (스플릿)', prompt: 'split screen, two simultaneous scenes side by side, dual frame composition, parallel action' },
        { label: '아이리스 전환', prompt: 'iris in / iris out transition, circular vignette closing or opening to reveal new scene, classic film transition' }
      ]
    },
    {
      id: 'colorgrade',
      icon: '🎨',
      title: '필터 & 색감 (컬러 그레이딩)',
      items: [
        { label: '틸 & 오렌지 (할리우드)', prompt: 'teal and orange color grade, cool shadows with warm highlights, Hollywood blockbuster look, complementary contrast' },
        { label: '블리치 바이패스 (색 탈색)', prompt: 'bleach bypass look, desaturated shadows, crushed blacks, high contrast silver retention, gritty film appearance' },
        { label: '느와르 흑백', prompt: 'black and white film noir grade, high contrast monochrome, deep shadows, bright specular highlights, no color' },
        { label: '빈티지 필름', prompt: 'vintage film look, faded colors, lifted blacks, warm yellow-orange cast, film grain texture, 70s aesthetic' },
        { label: '차가운 블루 톤', prompt: 'cold blue color grade, desaturated, steel blue shadows, cool clinical tone, sterile atmosphere' },
        { label: '따뜻한 골든 톤', prompt: 'warm golden color grade, amber highlights, rich warm shadows, honeyed tones, nostalgic warmth' },
        { label: '사이버펑크 네온', prompt: 'cyberpunk color grade, vivid magenta and cyan neons, high saturation, dark midtones, electric hue contrast' },
        { label: '오렌지 & 그린 (공포)', prompt: 'horror green tint grade, sickly green shadows, pallid skin tones, unsettling desaturated cast' },
        { label: '과노출 & 화이트아웃', prompt: 'overexposed dreamy look, blown-out highlights, soft halation, ethereal white glow, overlit romantic tone' },
        { label: '크로스 프로세싱', prompt: 'cross-processed color, unexpected hue shifts, shifted color channels, experimental lo-fi film look' },
        { label: '듀오톤 (두 색상)', prompt: 'duotone color effect, image rendered in two contrasting hues, graphic poster-like color treatment' },
        { label: '인프라레드 룩', prompt: 'infrared photography look, foliage glowing white, inverted tones, surreal color shift, dreamy otherworldly feel' }
      ]
    },
    {
      id: 'framing',
      icon: '📐',
      title: '구도 & 프레이밍',
      items: [
        { label: '삼분할 법칙', prompt: 'rule of thirds composition, subject placed at intersection of thirds grid, balanced asymmetric framing' },
        { label: '황금 비율 나선', prompt: 'golden ratio spiral composition, Fibonacci spiral framing, subject at center of logarithmic spiral' },
        { label: '리딩 라인', prompt: 'leading lines drawing eye toward subject, converging perspective lines, road or path guiding gaze' },
        { label: '네거티브 스페이스', prompt: 'generous negative space, subject isolated in large empty area, minimalist breathing room composition' },
        { label: '중앙 대칭', prompt: 'centered symmetrical composition, perfectly mirrored frame, Wes Anderson style centered framing' },
        { label: '프레임 인 프레임', prompt: 'frame within a frame, subject viewed through doorway arch or window, natural environmental framing' },
        { label: '전경 클로즈업 오버랩', prompt: 'extreme foreground element overlapping subject, layered depth, blurred object in tight foreground corner' },
        { label: '대각선 구도', prompt: 'diagonal composition, dynamic lines running corner to corner, energetic tilted framing, tension through angles' },
        { label: '로우앵글 위압감', prompt: 'low angle upward shot, worm eye view, subject towering over camera, dominant imposing perspective' },
        { label: '하이앵글 조감', prompt: "high angle bird's eye looking down, overhead perspective, subject small against large ground plane" },
        { label: '깊이감 레이어링', prompt: 'depth layering foreground midground background, strong spatial separation, three-dimensional frame depth' },
        { label: '익스트림 와이드 고독감', prompt: 'extreme wide shot isolating tiny subject in vast environment, sense of solitude and scale, epic landscape dwarfing figure' }
      ]
    },
    {
      id: 'transition',
      icon: '🔄',
      title: '카메라 무브 트랜지션',
      items: [
        { label: '드론 서서히 상승', prompt: 'drone slowly ascending, camera rising from ground level revealing landscape, aerial lift-off' },
        { label: '스피드 램프', prompt: 'speed ramp transitioning from extreme slow-motion to full speed, velocity shift, dynamic tempo change' },
        { label: '360도 오빗', prompt: '360-degree orbit shot around subject, slow circular tracking, camera revolving around central figure' },
        { label: '달리 줌 (버티고)', prompt: 'dolly zoom effect, subject stays same size while background shifts, Hitchcock zoom, vertigo effect' },
        { label: '풀백 리빌', prompt: 'slow pull-back reveal, camera retreating to show wider context, gradual scene expansion' },
        { label: '핸드헬드 팔로우', prompt: 'handheld camera following subject, slight organic shake, documentary-style tracking, immersive follow cam' },
        { label: '모션 블러 전환', prompt: 'directional motion blur whip pan transition, fast lateral smear, speed-cut transition effect' }
      ]
    }
  ],

  /* ── 5. 한국어 → 영어 대응표 ── */
  lookup: [
    /* 분위기/무드 */
    { ko: '어둡고 무거운', en: 'dark and moody', tip: '드라마틱한 장면, 스릴러' },
    { ko: '밝고 화사한', en: 'bright and vibrant', tip: '광고, 밝은 분위기' },
    { ko: '신비롭고 몽환적인', en: 'mysterious and ethereal', tip: '판타지, 꿈 장면' },
    { ko: '차갑고 냉정한', en: 'cold and sterile', tip: '현대적 기업, SF' },
    { ko: '따뜻하고 아늑한', en: 'warm and cozy', tip: '가정적, 편안한 장면' },
    { ko: '긴박하고 긴장된', en: 'tense and urgent', tip: '액션, 스릴러 클라이맥스' },
    { ko: '우아하고 고급스러운', en: 'elegant and luxurious', tip: '패션, 럭셔리 브랜드' },
    { ko: '거칠고 날 것 같은', en: 'raw and gritty', tip: '다큐멘터리, 현실적 표현' },

    /* 시간대/날씨 */
    { ko: '새벽', en: 'pre-dawn, first light', tip: '어둠과 빛의 경계' },
    { ko: '일출', en: 'sunrise, golden hour', tip: '따뜻한 오렌지빛' },
    { ko: '한낮', en: 'midday, harsh sunlight', tip: '강한 그림자, 선명한 색' },
    { ko: '오후 햇살', en: 'afternoon sunlight, warm glow', tip: '부드러운 황금빛' },
    { ko: '해질녘', en: 'sunset, dusk, magic hour', tip: '가장 아름다운 빛' },
    { ko: '밤', en: 'night, nighttime', tip: '도시 불빛, 별빛' },
    { ko: '안개 낀', en: 'foggy, misty', tip: '신비로운 분위기' },
    { ko: '비오는', en: 'rainy, wet pavement', tip: '반사광 효과 포함' },
    { ko: '눈 오는', en: 'snowy, snowfall', tip: '조용하고 순수한 느낌' },

    /* 환경/배경 */
    { ko: '도시', en: 'urban cityscape', tip: '건물, 도로, 도시 불빛' },
    { ko: '자연 숲속', en: 'lush forest, dense woodland', tip: '초록빛, 자연광 산란' },
    { ko: '해변', en: 'coastal beach, oceanfront', tip: '파도, 모래, 수평선' },
    { ko: '우주', en: 'deep space, cosmos, nebula', tip: '무중력, 별, 성운' },
    { ko: '미래 도시', en: 'futuristic cityscape, cyberpunk metropolis', tip: '네온, 홀로그램' },
    { ko: '폐허', en: 'abandoned ruins, desolate wasteland', tip: '묵시록적 분위기' },
    { ko: '실내', en: 'interior, indoor setting', tip: '특정 공간 명시 권장' },

    /* 스타일 */
    { ko: '영화처럼', en: 'cinematic, film-quality', tip: '필수 키워드' },
    { ko: '사진처럼 실제적인', en: 'photorealistic, hyperrealistic', tip: '가장 현실적인 표현' },
    { ko: '애니메이션', en: 'animated, anime style', tip: '스타일 명시 권장' },
    { ko: '수채화', en: 'watercolor style, painterly', tip: '부드러운 예술 느낌' },
    { ko: '느와르', en: 'film noir, black and white', tip: '클래식 범죄 영화 스타일' },
    { ko: '사이버펑크', en: 'cyberpunk, neon-lit, dystopian', tip: '미래 디스토피아' },
    { ko: '미니멀한', en: 'minimalist, clean composition', tip: '단순하고 정제된' },

    /* 카메라/렌즈 */
    { ko: '아주 가까이', en: 'extreme close-up, macro', tip: '디테일 강조' },
    { ko: '전신', en: 'full body shot, wide shot', tip: '캐릭터 전체 표현' },
    { ko: '위에서 아래로', en: 'aerial view, top-down shot', tip: '드론 시점' },
    { ko: '눈높이', en: 'eye-level, eye-line shot', tip: '자연스러운 시점' },
    { ko: '아래에서 위로', en: 'low angle, worm\'s eye view', tip: '위압감, 장대함 표현' },
    { ko: '배경 흐릿하게', en: 'shallow depth of field, bokeh background', tip: '피사체 집중' },
    { ko: '줌인하며', en: 'slow zoom in, push in', tip: '긴장감 증가' },
    { ko: '360도 회전', en: 'orbital shot, 360-degree orbit', tip: '피사체 중심 회전' },

    /* 속도/움직임 */
    { ko: '아주 천천히', en: 'ultra slow motion, extreme slow-mo', tip: '감동적 순간 강조' },
    { ko: '빠르게', en: 'fast motion, quick pace', tip: '에너지감 표현' },
    { ko: '부드럽게', en: 'smooth, fluid motion', tip: '안정된 카메라워크' },
    { ko: '흔들리는', en: 'handheld, shaky cam', tip: '긴박감, 현실감' }
  ]
};
