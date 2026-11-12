# 갈피 디자인 진단 (DESIGN_AUDIT)

작성일 2026-11-12 · 기준 커밋 `7f0e761` · 상태: 진단 완료, 구현 전
근거: 코드(`components/`, `app/`, `global.css`, `tailwind.config.js`, `lib/theme.ts`) + `docs/screenshots/` 6장 (실기기 iOS 렌더링)
관련 문서: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [DESIGN_TASKS.md](./DESIGN_TASKS.md) · 성능/구조 이슈는 [../IMPROVEMENT_PLAN.md](../IMPROVEMENT_PLAN.md)

## 1. 유지할 것 (디자인 정체성)

| 요소 | 현재 구현 | 판단 |
|---|---|---|
| 모노크롬 + 파스텔 3색 | `galpi.ink #202020` / `paper #F4F4F6` 와 `blue/green/yellow` 악센트, 책마다 spine 색 순환 | 유지. 가장 강한 브랜드 신호 |
| 에디토리얼 헤드라인 | 서재 상단 "지금까지 모은 문장 / **22개의 갈피**"(노란 하이라이트) | 유지. 서비스의 목소리 |
| 책 표지 중심 그리드 | 카드 뷰 4열, 표지 위 갈피 수 뱃지 | 유지, 비율·모서리만 정리 |
| 잉크 칩/필 언어 | 선택 상태 = `bg-galpi-ink` + `text-galpi-paper` 필 | 유지 (Chip 규격으로 고정) |
| 하단 탭 + 중앙 추가 버튼 | `BottomNav` 4열, 중앙 돌출 `+` | 유지 |
| Noto Sans KR 굵은 제목 | `font-black` 제목, `font-bold` 본문 강조 | 유지하되 `black` 사용처를 축소 |
| 라이트/다크 토큰 체계 | CSS 변수(`global.css`) + `useThemeColors()` | 유지. 값만 보정 |
| 절제된 모션 | 탭 리프트 3px, 눌림 scale 0.98, 시트 슬라이드 | 유지 |

## 2. 문제점

### P0 — 전 화면 공통

| # | 문제 | 근거 | 영향 |
|---|---|---|---|
| A1 | **카드 과다**: 콘텐츠 대부분이 `bg-card rounded-2xl` 박스에 들어감 | `bg-card` 127회, `rounded-2xl` 138회, `rounded-3xl` 21회. 상세/통계/목표/알림 화면은 세로로 카드가 연속 | 흰색 카드 ↔ `#F4F4F6` 배경 대비가 약해 전부 "회색 위 흰 덩어리"로 보임. 위계·리듬 없음 |
| A2 | **타이포 스케일 붕괴** | 임의값 `text-[13px]` 39, `[11px]` 31, `[10px]` 29, `[15px]` 15, `[7px]`·`[6.5px]` 14회. 제목은 `font-black`(84)과 `font-bold`(167) 혼용 | 화면마다 같은 역할의 텍스트 크기가 다름. 10px 이하 텍스트는 가독 불가 |
| A3 | **모서리 반경 6종 혼용** | `full` 150 / `2xl` 138 / `xl` 36 / `md` 22 / `3xl` 21 / `lg` 14. 같은 CTA가 폼에선 `2xl`, 오늘 카드에선 `full` | 둥글기가 역할을 설명하지 못함. 표지에 `rounded-xl~2xl`을 써서 책이 앱 아이콘처럼 보임 |
| A4 | **책 표지 비율 불일치** | 리스트 56px 폭·가변 높이, 타일 `3/4`, 상세 `112×160`, 타이머 `64×64` 정사각 크롭, 모음집 `2/3`, `4/3`도 3회 | 실제 표지(≈2:3)가 잘리거나 늘어남. 제품의 시각 중심이 일관되지 않음 |
| A5 | **좌우 여백 불일치** | 화면 루트 `px-6`(서재·상세) / `px-5`(마이페이지·입력) / `px-7`(로그인) / `px-8` | 탭 전환 시 콘텐츠 가장자리가 흔들림 |

### P1 — 컴포넌트/상태

| # | 문제 | 근거 |
|---|---|---|
| B1 | 아이콘 버튼 채움이 제각각 | 36px 원형 `bg-card` 18회, `bg-primary` 2회, `bg-secondary` 1회(통계 헤더 공유 버튼만 검정) |
| B2 | 보조 텍스트를 opacity로 만듦 | `text-muted-foreground/50`(필터 카운트), `/70`(날짜) 등 → `#F4F4F6` 위 대비 2.5:1 미만 |
| B3 | 타이머 프리셋 선택 상태가 "비활성"처럼 보임 | 스크린샷: 선택된 "25분 독서 / 5분 휴식"이 회색 `#9A9A9A`대 채움, 미선택이 흰색 |
| B4 | 페이지 번호에 `font-mono: Courier` | Noto Sans KR UI 안에서 Courier가 이질적. `P. 208` 뱃지 |
| B5 | 다크 모드에서 `bg-galpi-ink` 블록 소실 | `TodayProgressCard`(`bg-galpi-ink`)가 다크 배경 `#18181B` 위에서 거의 안 보임. `tailwind.config.js` 주석도 인지하고 있음 |
| B6 | 헤더 중복 구현 | "뒤로 가기" 버튼 14개 화면이 각자 구현. 제목 위치·크기(`lg/xl`, `black`)가 조금씩 다름 |
| B7 | 터치 타깃 미달 | 뷰 모드 토글 `p-1.5` + 13px 아이콘 ≈ 25px, hitSlop 없음. `hitSlop` 전체 12회 |
| B8 | 통계 월간: 플로팅 CTA가 콘텐츠를 가림 + 공유 진입점 2개 | 스크린샷에서 "이달의 독서 리포트 발행하기"가 "주로 기록하는 시간대" 제목 위에 겹침. 헤더 공유 아이콘과 기능 중복 |
| B9 | 그림자 6곳 인라인 객체 | 값은 절제돼 있으나 정의가 흩어짐 (`shadowColor` 인라인 6파일) |

### P2 — 레이아웃/플랫폼

| # | 문제 | 근거 |
|---|---|---|
| C1 | 데스크톱 웹 = 400×860 "폰 목업" | `web-frame.tsx`: 8px 검정 베젤, 44px 반경. 짧은 노트북 화면에서 잘림. 서비스가 아닌 데모처럼 보임 |
| C2 | 태블릿/와이드 대응 없음 | `sm:`/`md:` 클래스 2회. 카드 그리드 4열 고정(`maxWidth 480`) |
| C3 | 서재 상단 3단 히어로 | 헤드라인 → 검정 오늘 카드 → 파스텔 "지금 읽는 중" 카드가 연속, 실제 서재는 1스크롤 아래 |
| C4 | 웹 문서 메타 | `lang="en"`, `<title>` 비어 있음, `theme-color` 없음 |

## 3. 페이지별 개선 필요 사항

| 화면 | 파일 | 유지 | 개선 |
|---|---|---|---|
| 서재 (탭) | `components/screens/library-screen.tsx`, `galpi/book-card.tsx`, `galpi/today-progress-card.tsx`, `galpi/status-filter.tsx` | 헤드라인, 그리드, 필터 칩 | 히어로 3단 → 2단(오늘 카드를 한 줄 스트립으로 축소 또는 "지금 읽는 중" 카드에 흡수), 표지 2:3·`rounded-md`, 리스트 간격 16→12, 뷰 토글 터치 영역 |
| 책 상세 | `components/screens/book-detail-screen.tsx` | 히어로 구성, 상태 필 | 진행률 3분할 카드 → 구분선 행, 갈피 카드 → 좌측 spine 유지하되 배경 카드 제거(hairline 구분), 표지 그림자 토큰화, 페이지 뱃지 tabular-nums |
| 독서 통계 | `components/screens/stats-report-screen.tsx` | 월/연 토글, 캘린더 | 캘린더·요일 카드 테두리/배경 제거 → 섹션 제목 + 여백으로 구분, 플로팅 CTA → 리스트 푸터 버튼으로 이동(헤더 공유 아이콘 1개만 유지), 히트맵 라벨 최소 9px |
| 독서 목표 | `components/screens/reading-goal-screen.tsx` | 노란 스트릭 히어로 | 목표 3개 카드 → 하나의 리스트 그룹(구분선), 스트릭 요일 점 대비 보강 |
| 독서 타이머 | `components/screens/reading-timer-screen.tsx` | 원형 타이머, 하단 바 | 프리셋 선택 상태 = 잉크 필(기존 Chip 규격), 책 썸네일 2:3 |
| 마이페이지 | `components/screens/mypage-screen.tsx` | 파란 프로필 카드, 설정 그룹 | 설정 그룹 테두리 제거(배경 카드만), 노란 목표 진입 카드 높이 축소 |
| 갈피 남기기 / 수정 | `components/screens/add-sentence-screen.tsx`, `edit-sentence-screen.tsx`, `galpi/tag-input.tsx` | 하단 고정 저장 바 | 입력 공통 규격(Input), 라벨 13→14px, 문장 입력 15px 유지 |
| 로그인/회원가입/온보딩 | `login-screen.tsx`, `signup-screen.tsx`, `onboarding-screen.tsx`, `galpi/auth-field.tsx` | 로고 중심 구성 | 버튼/입력 공통 규격, 여백 `px-7`→공통 거터 |
| 알림 설정 | `notification-settings-screen.tsx` | 노란 미리보기 | 카드 2개 → 리스트 그룹 1개 + 미리보기 |
| 웹 프레임 | `components/layout/web-frame.tsx` | 중앙 정렬 | 베젤 제거, 반응형 컨테이너 (DESIGN_SYSTEM §8) |
| 공유 카드/모달 | `galpi/sentence-card-modal.tsx`, `session-summary-modal.tsx`, `bottom-sheet.tsx` | 시트 동작 | 인라인 스타일 14곳 → 토큰, 시트 반경 통일 |

## 4. 우선순위

| 순위 | 항목 | 이유 |
|---|---|---|
| 1 | 디자인 토큰 확정 (타이포·반경·간격·그림자) — `tailwind.config.js`, `lib/theme.ts`, `global.css` | 이후 모든 화면 작업의 기준. 코드 변경은 설정 파일 3개 |
| 2 | 공통 컴포넌트 5종 (`BookCover`, `IconButton`, `Chip`, `Button`, `ScreenHeader`) | 중복 18+14+3곳을 흡수, 터치 타깃·접근성 일괄 해결 |
| 3 | 카드 다이어트: 상세·통계·목표·마이페이지 | 가장 눈에 띄는 "AI UI" 패턴 제거, 위계 회복 |
| 4 | 서재 히어로 재구성 + 표지 비율 | 첫 화면 인상과 제품 정체성 |
| 5 | 웹 반응형 컨테이너 | 데스크톱 사용자 경험, 베젤 제거 |

## 5. 범위 밖 기록 (수정하지 않음)

- 웹에서 `Alert.alert` 무음, 폰트 53MB 로드, 번들 크기 → `docs/IMPROVEMENT_PLAN.md` P0 항목
- `lib/theme.ts`의 `colors`(정적 라이트 맵) 직접 사용처 정리는 디자인과 무관한 리팩터링이라 제외
