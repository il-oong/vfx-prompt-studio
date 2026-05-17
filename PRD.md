# VFX Prompt Studio — Product Requirements Document

**버전**: 1.0  
**작성일**: 2026-05-17  
**작성자**: kww29

---

## 1. 제품 개요

### 1.1 제품명
VFX Prompt Studio

### 1.2 목적
AI 영상·이미지 생성 도구를 활용하는 VFX 작업자가 프롬프트를 효율적으로 작성하고, 작업물을 체계적으로 관리할 수 있도록 돕는 로컬 웹 앱.

### 1.3 실행 방식
`index.html` 더블클릭 → Chrome/Edge 브라우저에서 즉시 실행. 설치 불필요, 서버 불필요.

### 1.4 대상 사용자
AI 생성 도구(Runway, Kling, Hailuo, Midjourney 등)를 사용하는 VFX 작업자. 개발 지식 불필요.

---

## 2. 핵심 문제 정의

| # | 문제 | 영향 |
|---|---|---|
| 1 | AI 도구마다 프롬프트 작성법이 달라 매번 찾아봐야 함 | 작업 시간 낭비 |
| 2 | 좋은 프롬프트를 만들어도 따로 저장하지 않으면 잃어버림 | 반복 작업 발생 |
| 3 | 생성한 이미지·영상이 로컬 폴더에 흩어져 관리가 어려움 | 프로젝트별 파악 불가 |
| 4 | 한국어로 장면을 설명해도 AI가 이해하기 좋은 영어 프롬프트로 변환하기 어려움 | 품질 저하 |

---

## 3. 기능 요구사항

### F1. 가이드 탭

| ID | 기능 | 우선순위 |
|---|---|---|
| F1-1 | AI VFX 워크플로우 단계별 설명 (컨셉→이미지→영상→합성→컬러그레이딩→사운드) | 높음 |
| F1-2 | 주요 AI 도구 비교 카드 (Runway, Kling, Hailuo, Midjourney, Flux, Sora, Veo 3) | 높음 |
| F1-3 | VFX 프롬프트 용어집 (Shot type / Camera move / Lighting / Film look / Motion) | 높음 |
| F1-4 | 한국어 설명 → 영어 프롬프트 용어 대응 검색 테이블 | 높음 |

### F2. 프로젝트 아카이브 탭

| ID | 기능 | 우선순위 |
|---|---|---|
| F2-1 | 프로젝트 생성·수정·삭제 (이름, 설명, 색상 배지) | 높음 |
| F2-2 | 로컬 폴더 연결 — File System Access API로 바탕화면 폴더 선택 후 미디어 자동 로드 | 높음 |
| F2-3 | 서브폴더 탐색 — 연결된 폴더의 하위 폴더를 트리로 탐색 | 중간 |
| F2-4 | 썸네일 그리드 뷰 — 이미지(PNG/JPG/WEBP), 영상(MP4/MOV/WEBM) 모두 표시 | 높음 |
| F2-5 | 파일 클릭 시 미리보기 + 메모(사용 툴, 세팅) 편집 모달 | 중간 |
| F2-6 | 폴더 핸들을 IndexedDB에 저장해 다음 실행 시 자동 재연결 | 중간 |

### F3. 프롬프트 저장 탭

| ID | 기능 | 우선순위 |
|---|---|---|
| F3-1 | 프로젝트별 프롬프트 관리 | 높음 |
| F3-2 | 카테고리 분류 — scene / asset / character / bg / fx | 높음 |
| F3-3 | 태그 추가 및 필터링 | 중간 |
| F3-4 | 사용 AI 툴 배지 표시 | 높음 |
| F3-5 | 프롬프트 복사, 수정, 삭제, 즐겨찾기 | 높음 |
| F3-6 | AI 봇에서 생성된 프롬프트 원클릭 저장 연동 | 높음 |

### F4. AI 봇 (오른쪽 하단 고정 패널)

| ID | 기능 | 우선순위 |
|---|---|---|
| F4-1 | Gemini 2.0 Flash API 연동 | 높음 |
| F4-2 | 한국어 장면·에셋 설명 → 영어 VFX 프롬프트 자동 변환 | 높음 |
| F4-3 | 툴 선택 드롭다운 — 선택한 AI 툴에 최적화된 프롬프트 생성 | 높음 |
| F4-4 | 생성된 프롬프트 [복사] [저장] 버튼 | 높음 |
| F4-5 | 대화 히스토리 유지 (세션 내) | 중간 |
| F4-6 | API 키 최초 입력 모달 + localStorage 저장 | 높음 |

---

## 4. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| 실행 방식 | index.html 더블클릭, 설치 불필요 |
| 오프라인 지원 | 가이드·아카이브·프롬프트는 인터넷 없이 동작. 봇만 API 필요 |
| 데이터 저장 | 서버 없음. 모든 데이터 브라우저 로컬 (IndexedDB, localStorage) |
| 브라우저 지원 | Chrome/Edge 최신 버전 (File System Access API 필요) |
| 언어 | 한국어 UI |
| 보안 | API 키 로컬 저장. 공용 PC 사용 시 키 삭제 안내 표시 |

---

## 5. 제외 범위 (v1.0)

- 그린/블루스크린 편집 툴
- 다중 사용자 / 클라우드 동기화
- 영상 타임라인 편집
- 모바일 대응

---

## 6. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | 순수 HTML/CSS/JS | 빌드 도구 없이 실행, 비개발자도 바로 사용 |
| 스타일 | 커스텀 CSS (다크 테마) | CDN 프레임워크 불필요, 일관된 VFX 툴 느낌 |
| 데이터베이스 | IndexedDB | 브라우저 내 영구 로컬 저장, 대용량 지원 |
| 폴더 접근 | File System Access API | 로컬 파일을 서버 없이 직접 읽기 |
| AI API | Gemini 2.0 Flash | 빠른 응답, 무료 크레딧, 브라우저 직접 호출 가능 |
| 폰트 | Noto Sans KR (Google Fonts CDN) | 한국어 최적화 |

---

## 7. 파일 구조

```
VFX/
├── index.html                  # 앱 진입점, 전체 레이아웃
├── PRD.md                      # 이 문서
├── css/
│   ├── main.css                # 전체 레이아웃, CSS 변수, 공통 컴포넌트
│   ├── guide.css               # 가이드 탭 스타일
│   ├── archive.css             # 아카이브 탭 스타일
│   ├── prompts.css             # 프롬프트 탭 스타일
│   └── bot.css                 # AI 봇 패널 스타일
└── js/
    ├── app.js                  # 앱 초기화, 탭 라우팅, 공통 유틸
    ├── db.js                   # IndexedDB CRUD 추상화
    ├── tab-guide.js            # 가이드 탭 렌더링
    ├── tab-archive.js          # 아카이브 탭 (File System Access API)
    ├── tab-prompts.js          # 프롬프트 탭 CRUD
    ├── bot.js                  # Gemini API + 봇 UI
    └── data/
        ├── guide-content.js    # 가이드 정적 데이터 (워크플로우, 도구, 용어집)
        └── tool-presets.js     # AI 툴별 Gemini 시스템 프롬프트
```

---

## 8. 데이터 구조 (IndexedDB)

### projects
```json
{
  "id": "uuid",
  "name": "프로젝트명",
  "description": "설명",
  "color": "#8b5cf6",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### file_memos
```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "filePath": "filename.png",
  "memo": "사용 세팅 메모",
  "tool": "Runway",
  "createdAt": 1700000000000
}
```

### prompts
```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "title": "프롬프트 제목",
  "content": "English VFX prompt content...",
  "originalKorean": "원래 한국어 설명",
  "tool": "Runway",
  "category": "scene",
  "tags": ["slow-motion", "cinematic"],
  "isFavorite": false,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

---

## 9. AI 봇 시스템 프롬프트 구조

**공통 베이스**: 한국어 입력 → 영어 VFX 프롬프트 출력. Shot type + Subject + Environment + Camera move + Lighting + Film look 순서. 60~150단어 권장. 설명 없이 프롬프트만 출력.

**툴별 최적화 suffix**:

| 툴 | 핵심 최적화 포인트 |
|---|---|
| Runway Gen-4 | 모션 강도 힌트, 연속 카메라 무브 동사 사용 |
| Kling AI | 영상 길이 힌트 (예: "5-second clip"), 물리 정확도 강조 |
| Hailuo (MiniMax) | 포토리얼리스틱, 화면비율 힌트 (16:9) |
| Midjourney | `--ar 16:9 --v 7 --style raw` suffix 자동 추가 |
| Flux | 정지 이미지 전용, 모션 용어 제외 |
| Sora | 장면 전환 서술 가능, 물리 일관성 강조 |
| Veo 3 | 오디오 생성 힌트 [AUDIO: ...] 포함 가능 |
| Wan | 단순·명확한 구조, 피사체-배경 분리 강조 |

---

## 10. 향후 개선 계획 (v2.0+)

| 기능 | 설명 |
|---|---|
| 프롬프트 버전 관리 | 동일 프롬프트의 수정 히스토리 추적 |
| 프롬프트 템플릿 | 자주 쓰는 구조를 템플릿으로 저장 |
| 배치 프롬프트 생성 | 여러 장면을 한 번에 변환 |
| 이미지→프롬프트 역변환 | 이미지를 분석해 프롬프트 추출 |
| 협업 내보내기 | 프롬프트 세트를 JSON/CSV로 내보내기 |
| 모바일 반응형 | 태블릿 지원 |
