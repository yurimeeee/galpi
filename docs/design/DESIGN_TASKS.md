# 갈피 디자인 작업 목록 (DESIGN_TASKS)

작성일 2026-11-12 · 기준: [DESIGN_AUDIT.md](./DESIGN_AUDIT.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
상태 값: `대기` · `진행` · `완료` · `보류`. 작업은 ID 단위로 독립 커밋한다.
공통 완료 조건: `npx tsc --noEmit` 통과, 라이트/다크 스크린샷 비교, 기능·데이터 로직 변경 없음.

## Phase A. 토큰 (전역 설정 3파일)

| ID | 대상 | 파일 | 목표 | 완료 조건 | 의존 | 상태 |
|---|---|---|---|---|---|---|
| DS-01 | 타이포 토큰 | `tailwind.config.js` | `fontSize`에 `display / md / 2xs / micro` 추가(행간 포함). 기존 키 값 불변 | 새 클래스 4종 빌드 확인, 기존 화면 변화 없음 | — | 완료 `e10ae48` |
| DS-02 | 시맨틱 컬러 보정 | `global.css`, `lib/theme.ts` | `--color-muted-foreground` 라이트 `107 107 114`, `mutedForeground: '#6B6B72'`. 다크 유지 | 두 파일 값 일치, 대비 ≥ 4.5:1 (측정 4.81:1) | — | 완료 `6b75400` |
| DS-03 | 그림자 상수 | `lib/theme.ts` | `SHADOW.floating`, `SHADOW.cover` 추가 | 상수 export, 타입 확인 | — | 완료 `3fe0a61` |
| DS-04 | 반경 정리 | `tailwind.config.js` | `rounded-4xl` 제거(미사용 확인됨). 값 변경 없음 | grep `rounded-4xl` 0 | — | 완료 `ed8a4dc` |

## Phase B. 공통 컴포넌트 (신규 5개)

| ID | 대상 | 파일 | 목표 | 완료 조건 | 의존 | 상태 |
|---|---|---|---|---|---|---|
| CP-01 | `BookCover` | `components/galpi/book-cover.tsx`(신규) | 2:3 비율, 크기별 반경, hairline, 폴백 내장(`useCoverFallback` 재사용) | 단독 렌더 시 커버/폴백 2상태 정상, 스토리 없음(앱 내 확인) | DS-01 | 완료 `4f74cb9` (앱 내 확인은 GX-10에서) |
| CP-02 | `IconButton` | `components/galpi/icon-button.tsx`(신규) | 36px 원형, variant 3종, role·hitSlop 기본 | 라벨 누락 시 타입 오류 | — | 완료 `22a573d` |
| CP-03 | `Chip` | `components/galpi/chip.tsx`(신규) | 선택/기본 2상태 + 카운트 슬롯, `accessibilityState.selected` | `StatusFilter`가 Chip으로 재구성되어 동작 동일 | DS-01, DS-02 | 완료 `be09382` |
| CP-04 | `Button` | `components/galpi/button.tsx`(신규) | primary / secondary / pill, loading·disabled | 로그인 화면 CTA 1곳 교체로 검증 | DS-01 | 완료 `5c6b0d0` |
| CP-05 | `ScreenHeader` | `components/galpi/screen-header.tsx`(신규) | 뒤로 + 제목(+부제) + 우측 슬롯, 높이 44 | 알림 설정 화면 1곳 교체로 검증 | CP-02 | 완료 `1d05fa4` |

## Phase C. 전역 치환 (기계적, 레이아웃 불변)

| ID | 대상 | 파일 | 목표 | 완료 조건 | 의존 | 상태 |
|---|---|---|---|---|---|---|
| GX-01 | 임의 텍스트 크기 치환 | `components/**`, `app/**` | `text-[26px]→display`, `[15px]→md`, `[13px]→sm|xs`(역할별), `[11px]/[10px]→2xs`, `[9px]~[6.5px]→micro` | grep `text-\[` 0 | DS-01 | 완료 `31466a0` (ReportCardBody 공유 카드는 PG-11로 이월) |
| GX-02 | 섹션 제목 웨이트 | `components/screens/*` | `text-lg font-black` → `text-lg font-bold` (5곳) | 화면 제목(`xl`)은 black 유지 | — | 완료 `306b0ed` |
| GX-03 | 반경 역할 재배치 | `components/**` | 카드·입력·CTA `2xl→xl`, 히어로 `3xl→2xl`, 시트 `rounded-t-3xl` 유지 | §4 표와 일치, 시각 회귀 확인 | — | 완료 `fa532e1` |
| GX-04 | opacity 텍스트 위계 제거 | `components/**` | `text-muted-foreground/50|70` → `text-muted-foreground`(파스텔·잉크 표면 제외) | grep 결과 0(예외 주석 표기) | DS-02 | 완료 `283f8e5` |
| GX-05 | 거터 통일 | 화면 루트 컨테이너 | `px-6 / px-7 / px-8` → `px-5` | 탭 3개 + 스택 화면 좌측 정렬선 일치 | — | 완료 `ad75ccf` (year-review 스토리 슬라이드 px-8는 의도적 인셋으로 유지) |
| GX-06 | 그림자 인라인 → 상수 | `bottom-nav`, `book-detail`, `stats-report`, `reading-timer-widget`, `sentence-card-modal`, `session-summary-modal` | `SHADOW.*` 사용 | 인라인 `shadowColor` 0 | DS-03 | 완료 `b23400b` (web-frame 베젤 그림자는 RS-01, 슬라이더 썸 2px 그림자는 유지) |
| GX-07 | `font-mono` 폐지 | `components/**`, `tailwind.config.js` | 페이지 번호 `tabular-nums font-semibold`, `fontFamily.mono` 제거 | grep `font-mono` 0 | — | 완료 `27f41ad` |
| GX-08 | 아이콘 버튼 교체 | 22곳 | 36px 원형 Pressable → `IconButton` | hitSlop·role 자동 적용 | CP-02 | 완료 `682a09f` |
| GX-09 | 헤더 교체 | 스택 화면 14곳 | 자체 헤더 → `ScreenHeader` | 제목 크기·위치 통일 | CP-05 | 완료 `5035227` (15개 화면 적용) |
| GX-10 | 표지 교체 | 6곳 | `BookCover`로 교체, 정사각·4:3 제거 | 모든 표지 2:3 | CP-01 | 완료 `32db502` (달력 셀·타이머 버블·공유 카드는 제외) |

## Phase D. 화면별 (카드 다이어트·위계) — 토큰/컴포넌트 완료 후

| ID | 대상 | 파일 | 목표 | 완료 조건 | 의존 | 상태 |
|---|---|---|---|---|---|---|
| PG-01 | 서재 히어로 | `library-screen.tsx`, `today-progress-card.tsx` | 3단 → 2단: 오늘 카드를 `bg-primary` 한 줄 스트립(스트릭·분·시작 버튼)으로 축소, 다크 대비 해결(§1.2) | 서재 그리드 첫 행이 iPhone 13 높이에서 노출 | GX-01~05 | 완료 `9a660b2` |
| PG-02 | 서재 리스트/그리드 | `library-screen.tsx`, `book-card.tsx` | 항목 간격 12, 뷰 토글 터치 40, 그리드 열 수 §8 규칙 | 토글 hitSlop, 폭별 열 수 확인 | CP-01, GX-10 | 완료 `ddac5d3` |
| PG-03 | 책 상세 | `book-detail-screen.tsx` | 진행률 카드 → 구분선 행, 갈피 항목 카드 → 배경 위 spine + hairline, 표지 `SHADOW.cover` | 카드 수 3→0(갈피 항목 제외 시), 스크롤 리듬 확인 | GX-03, GX-06 | 완료 `016bead` |
| PG-04 | 독서 통계 | `stats-report-screen.tsx` | 캘린더·요일 카드 배경 제거, 플로팅 CTA → 리스트 푸터 `Button`, 헤더 공유 아이콘 1개 유지, 히트맵 `text-micro` | CTA 겹침 없음, 공유 진입 1개 | CP-04, GX-01 | 완료 `89dff3e` |
| PG-05 | 독서 목표 | `reading-goal-screen.tsx` | 목표 3카드 → 리스트 그룹 1개, 스트릭 요일 점 대비(잉크 테두리) | 카드 3→1 | GX-03 | 완료 `ec8f975` |
| PG-06 | 독서 타이머 | `reading-timer-screen.tsx` | 프리셋 선택 = `Chip` 선택 상태, 썸네일 `BookCover sm` | 선택 상태가 잉크 필 | CP-03, CP-01 | 완료 `c56fb09` |
| PG-07 | 마이페이지 | `mypage-screen.tsx` | 설정 그룹 테두리 제거, 목표 진입 카드 `py-4→py-3.5`, 프로필 아바타 `BookCover` 아님(원형 유지) | 그룹 `border` 0 | GX-03 | 완료 `6809abd` |
| PG-08 | 입력 화면 | `add-sentence-screen.tsx`, `edit-sentence-screen.tsx`, `add-book-screen.tsx`, `tag-input.tsx` | 입력 규격 §6, 라벨 `text-sm`, 저장 `Button primary` | 입력 3종 동일 높이·반경 | CP-04, GX-01 | 완료 `53fe362` |
| PG-09 | 인증/온보딩 | `login-screen.tsx`, `signup-screen.tsx`, `onboarding-screen.tsx`, `auth-field.tsx` | `Button`·입력 규격, 거터 `px-5` | 로그인/가입 CTA 동일 | CP-04, GX-05 | 완료 `fb68226` |
| PG-10 | 알림 설정 | `notification-settings-screen.tsx` | 카드 2 → 리스트 그룹 1 + 미리보기 | — | GX-03 | 완료 `156f909` |
| PG-11 | 시트·공유 카드 | `bottom-sheet.tsx`, `sentence-card-modal.tsx`, `session-summary-modal.tsx` | 인라인 스타일 → 토큰, 반경 §4 | 인라인 `style={{` 색상값 0 | DS-03 | 완료 `850587d` (카드 팔레트 인라인 색은 사용자 선택 테마라 유지) |

## Phase E. 반응형

| ID | 대상 | 파일 | 목표 | 완료 조건 | 의존 | 상태 |
|---|---|---|---|---|---|---|
| RS-01 | 웹/태블릿 컨테이너 | `components/layout/web-frame.tsx` | 베젤·고정 높이 제거, §8 컨테이너(480/560), 바깥 `bg-secondary` | 1366×768 노트북에서 잘림 없음, 모바일 웹 변화 없음 | — | 완료 `37de4bf` (폭 기준 적용, 네이티브 태블릿 동일) |
| RS-02 | 웹 문서 메타 | `app/+html.tsx`(신규) | `lang="ko"`, `<title>갈피</title>`, `theme-color` 라이트/다크 | 빌드 `index.html` 확인 | — | 완료 `ea1787a` (export index.html 확인) |
| RS-03 | 그리드 열 수 | `library-screen.tsx` | 컨테이너 폭 기준 3/4/5열 | RS-01 후 폭별 확인 | RS-01, PG-02 | 완료 `16db7c2` |

## 검증 체크리스트 (각 Phase 종료 시)

- [ ] `npx tsc --noEmit`
- [ ] iOS 시뮬레이터 라이트/다크: 서재·상세·통계·목표·타이머·마이페이지 스크린샷을 `docs/screenshots/`와 비교
- [ ] 웹 375px / 768px / 1280px 폭 렌더 확인
- [ ] 접근성: iOS 글꼴 최대 배율에서 칩·뱃지 잘림 없음, VoiceOver로 아이콘 버튼 라벨 읽힘
- [ ] 기능 회귀: 책 추가 → 갈피 저장 → 즐겨찾기 → 삭제/실행취소 → 리포트 발행 흐름
