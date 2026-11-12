# 갈피 디자인 시스템 (DESIGN_SYSTEM)

작성일 2026-11-12 · 상태: 승인됨. Phase A 토큰 적용 완료, 이후 단계는 DESIGN_TASKS.md 참조
원칙: 기존 토큰(`tailwind.config.js`, `global.css`, `lib/theme.ts`)을 재사용한다. 새 추상화는 중복이 3곳 이상 확인된 것만 만든다.

## 0. 콘셉트 — "종이 위의 갈피"

배경(`paper`)이 곧 지면이다. 콘텐츠는 지면 위에 직접 놓고, 카드는 **눌러서 들어가는 묶음**(설정 그룹, 입력, 갈피 항목)에만 쓴다. 섹션은 여백과 hairline으로 나눈다. 잉크(`ink`)는 선택·강조 하나의 역할만, 파스텔 3색은 책의 spine과 히어로 표면에만 쓴다. 시각 중심은 항상 2:3 비율의 책 표지와 인용문이다.

## 1. 컬러

### 1.1 브랜드 (고정, 테마 비반응) — 변경 없음

| 토큰 | 값 | 용도 |
|---|---|---|
| `galpi-ink` | `#202020` | 선택 필, 파스텔 위 텍스트, spine `ink` |
| `galpi-paper` | `#F4F4F6` | 잉크 위 텍스트 |
| `galpi-blue` | `#D8DBE9` | spine, 프로필 히어로 |
| `galpi-green` | `#CFE9C9` | spine, "지금 읽는 중" 히어로, 휴식 상태 |
| `galpi-yellow` | `#EFF092` | spine, 하이라이트, 스트릭/목표 히어로 |

규칙: 파스텔 표면 위 텍스트는 항상 `text-galpi-ink`(+ `/60`, `/70` 허용). 브랜드 색을 UI 상태색(성공/경고)으로 쓰지 않는다.

### 1.2 시맨틱 (CSS 변수, `global.css`) — 값 보정 2개, 역할 명시

| 토큰 | Light | Dark | 역할 (이것만) |
|---|---|---|---|
| `background` | `244 244 246` | `24 24 27` | 지면 |
| `foreground` | `32 32 32` | `236 236 238` | 본문·제목 |
| `card` | `255 255 255` | `35 35 38` | 묶음 표면(설정 그룹, 입력, 갈피 항목, 시트) |
| `secondary` | `236 236 239` | `44 44 48` | 인셋 채움(칩 기본, 아이콘 버튼, 진행 트랙, 썸네일 바탕) |
| `muted` | = `secondary` | = `secondary` | **사용 금지** (`secondary`와 동일값, 1회 사용 → 치환) |
| `muted-foreground` | `119 119 125` → **`107 107 114`** (`#6B6B72`) | `154 154 162` | 보조 텍스트. 배경 대비 4.8:1, 카드 위 5.3:1 (적용됨) |
| `primary` / `primary-foreground` | `32 32 32` / `244 244 246` | `236 236 238` / `24 24 27` | 테마 반응 CTA, 탭 추가 버튼, **단독 검정 블록** |
| `accent` | `216 219 233` | `53 65 90` | 선택 배경(캘린더 활성 등) |
| `destructive` | `220 38 38` | `248 113 113` | 삭제·오류 텍스트/아이콘 |
| `border` | `227 227 232` | `49 49 54` | hairline 구분선 |
| `input` | = `border` | = `border` | 입력 테두리 |
| `ring` | = `foreground` | = `foreground` | 포커스 테두리 |

규칙
- 텍스트 위계는 `foreground` / `muted-foreground` 2단만 쓴다. `text-muted-foreground/50`, `/70` 같은 **opacity 위계 금지** (파스텔·잉크 표면 위는 예외).
- 배경 위 단독 검정 블록은 `bg-primary text-primary-foreground` (다크에서 반전). `bg-galpi-ink`는 파스텔/paper 표면 **안쪽**에서만. → `TodayProgressCard` 수정 대상.
- 카드 위 카드 금지. 카드 안에서 묶음이 더 필요하면 `secondary` 인셋 또는 hairline.

## 2. 타이포그래피

폰트: Noto Sans KR 정적 웨이트 — 사용 웨이트 `400 / 500 / 600 / 700 / 900`. `100·200·300·800` 미사용(로딩 제거는 IMPROVEMENT_PLAN P0-1).
숫자: `tabular-nums`(`fontVariant`)로 정렬. `font-mono`(Courier) **폐지** → 페이지 번호도 Noto + tabular.

### 2.1 스케일 (`tailwind.config.js` `fontSize` 확장, 기존 키 값은 유지)

| 토큰 | 크기/행간 | 웨이트 | 용도 | 치환 대상 |
|---|---|---|---|---|
| `text-display` | 26 / 32, `tracking-tight` | 900 | 서재 에디토리얼 헤드라인, 연말 결산 숫자 | `text-[26px]` |
| `text-xl` | 20 / 26 | 900 `tracking-tight` | 화면 제목 | 유지 |
| `text-lg` | 18 / 24 | **700** | 섹션 제목 ("내 서재", "수집한 갈피 목록") | `text-lg font-black` → `font-bold` |
| `text-md` | 15 / 22 | 600 | 카드 제목, 책 제목(리스트), 인용문 본문 | `text-[15px]` |
| `text-base` | 16 / 24 | 400 | 긴 본문(약관), 시트 본문 | 유지 |
| `text-sm` | 14 / 20 | 400·500 | 기본 UI 텍스트, 입력, 버튼 라벨, 폼 라벨 | `text-[13px]` 대부분 |
| `text-xs` | 12 / 16 | 400·500 | 캡션, 날짜, 보조 설명 | 일부 `text-[13px]`, `text-[11px]` |
| `text-2xs` | 11 / 14 | 600·700 | 뱃지·칩 내부 숫자, 진행률 % | `text-[11px]`, `text-[10px]` |
| `text-micro` | 9 / 10 | 500 | 히트맵·캘린더 축 라벨 **전용** | `text-[9px]`~`[6.5px]` |

규칙
- 10px 미만 텍스트는 `text-micro` 외 금지. 8px 이하는 삭제하거나 라벨을 숨긴다.
- `font-black`은 `display`·`xl`·히어로 숫자에만. 섹션·카드 제목은 `bold`/`semibold`.
- 인용문: `text-md leading-relaxed font-medium`(상세) / `text-sm leading-relaxed font-semibold`(검색 결과). 큰따옴표는 텍스트에 포함(현행 유지).
- 행간: 본문 `leading-relaxed`, 제목 `leading-tight`, 그 외 토큰 기본값.
- `maxFontSizeMultiplier={1.3}`을 `text-2xs`·`micro`·고정 높이 칩 텍스트에 적용.

## 3. 간격

4px 그리드. Tailwind 기본 스케일 사용.

| 역할 | 값 | 클래스 |
|---|---|---|
| 화면 거터 | 20 | `px-5` (전 화면 통일. `px-6/7/8` 루트 → `px-5`) |
| 헤더 높이 | 44 + `pt-1 pb-3` | `ScreenHeader` 고정 |
| 섹션 간 | 32 | `mt-8` |
| 섹션 제목 ↔ 콘텐츠 | 12 | `mb-3` |
| 리스트 항목 간 | 12 | `gap-3` / `ItemSeparator h-3` (현 16 → 12) |
| 카드 내부 | 16 | `p-4` |
| 히어로 내부 | 20 | `p-5` |
| 인라인 아이콘-텍스트 | 6 / 8 | `gap-1.5` / `gap-2` |
| 플로팅 요소 하단 여유 | 112 | `pb-28` (콘텐츠 컨테이너) |
| 와이드 컨테이너 | §8 | |

## 4. 모서리 반경 (`tailwind.config.js` 기존 값 유지, 역할만 고정)

| 클래스 | px | 역할 |
|---|---|---|
| `rounded-sm` | 6 | 페이지 뱃지, 작은 태그, 리스트 표지(≤56px) |
| `rounded-md` | 8 | 그리드 타일 표지(57–100px), 썸네일 |
| `rounded-lg` | 10 | 히어로 표지(>100px), 설정 행 아이콘 바탕 |
| `rounded-xl` | 14 | **카드·입력·리스트 그룹·버튼(full-width CTA)** |
| `rounded-2xl` | 18 | 히어로 표면("지금 읽는 중", 프로필, 스트릭) |
| `rounded-3xl` | 22 | 바텀시트 상단 (`rounded-t-3xl`) |
| `rounded-full` | — | 칩, 아이콘 버튼, 플로팅 필 FAB, 진행 트랙, 아바타 |

핵심 변경: 카드·입력·CTA `rounded-2xl` → `rounded-xl`, 히어로 `rounded-3xl` → `rounded-2xl`, 표지 `rounded-xl/2xl` → 크기별 `sm/md/lg`. `rounded-4xl`은 미사용 → 삭제 가능.

## 5. 테두리와 그림자

테두리
- 카드(`bg-card`)는 배경 위에 **테두리 없음**. 테두리는 입력(`border-input`), 카드 위 구분(`border-border` hairline), 보조 버튼(`border-input bg-card`)에만.
- `border-dashed`는 빈 상태·"추가하기" 어포던스 전용 (현행 유지).
- 포커스: `focus:border-ring` (현행) + 웹 `outline-none`.

그림자 — `lib/theme.ts`에 상수 2개로 집약, 인라인 6곳 치환

| 상수 | 값 | 사용처 |
|---|---|---|
| `SHADOW.floating` | color `ink`, opacity 0.18, radius 14, offset (0, 6), elevation 6 | 탭 추가 버튼, 플로팅 필 FAB, 타이머 위젯, 하단 고정 CTA 바 |
| `SHADOW.cover` | color `ink`, opacity 0.10, radius 16, offset (0, 8) | 상세·타이머·공유 카드의 히어로 표지만 |

그 외 정적 표면에는 그림자 없음. 웹 데스크톱 컨테이너 베젤 그림자는 제거.

## 6. 공통 컴포넌트 스타일

새로 만드는 것은 아래 5개뿐이며 모두 기존 클래스 조합을 고정하는 얇은 래퍼다. 범용 `Card`는 만들지 않는다.

| 컴포넌트 | 파일 | 규격 | 흡수하는 중복 |
|---|---|---|---|
| `BookCover` | `components/galpi/book-cover.tsx` | 비율 **2:3** 고정(`aspect-[2/3]`), 크기 `sm 44` / `md 56` / `lg 112` / `fill`, 반경 §4, 안쪽 hairline `border border-galpi-ink/5`(흰 표지 경계), 실패 시 spine 색 + 북마크 폴백(`useCoverFallback` 재사용) | `book-card`, `library` 타일, `book-detail` 히어로, `reading-timer` 썸네일, `add-choice-sheet`, `stats` 표지 셀 |
| `IconButton` | `components/galpi/icon-button.tsx` | 36×36 `rounded-full`, variant `surface`(bg-card) / `primary` / `ghost`, 아이콘 16, `accessibilityRole="button"`, `hitSlop={8}`, 라벨 필수 | 36px 원형 Pressable 22곳, 뒤로 가기 14곳 |
| `Chip` | `components/galpi/chip.tsx` | `rounded-full px-4 py-2 text-sm font-medium`, selected `bg-galpi-ink text-galpi-paper`, default `bg-card text-muted-foreground`, 카운트 슬롯 `text-2xs`(opacity 대신 `muted-foreground`) | `StatusFilter`, `FilterChipRow`, 상세 상태 필, 타이머 프리셋 |
| `Button` | `components/galpi/button.tsx` | `primary`: `rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground` · `secondary`: `border border-input bg-card` · `pill`: `rounded-full py-3`(히어로 내부) · disabled `opacity-60` · pressed scale 0.98 · 로딩 시 `ActivityIndicator` 슬롯 | 로그인/가입/저장/삭제 CTA 9곳 |
| `ScreenHeader` | `components/galpi/screen-header.tsx` | 좌 `IconButton`(뒤로) · 제목 `text-xl font-black tracking-tight` · 선택적 부제 `text-xs text-muted-foreground` · 우측 액션 슬롯, 높이 44, `px-5 pt-1 pb-3` | 스택 화면 14곳 |

기존 유지: `BottomSheet`(반경만 §4), `Skeleton`, `TagInput`, `TodayProgressCard`(색상 규칙 §1.2 적용), `BottomNav`.

표면 규칙 요약
- 리스트 항목(책, 갈피, 설정 행): 배경 위 직접 + `border-b border-border` 또는 `gap-3`. 카드 금지.
- 입력: `bg-card border border-input rounded-xl px-4 py-3.5 text-sm`, 라벨 `text-sm font-semibold mb-1.5`.
- 통계 지표 행: 카드 대신 구분선(`h-8 w-px bg-border`)으로 분할.

## 7. 책 표지 표현

- 비율 2:3, `resizeMode="cover"`. 정사각/4:3 크롭 금지.
- 반경은 크기에 비례(§4). 표지에 그림자는 히어로에만(§5).
- 폴백: spine 색 블록 + 좌측 `w-px bg-galpi-ink/10` 책등선 + 북마크 아이콘(현행 유지).
- 표지 위 오버레이 뱃지(갈피 수)는 `bg-galpi-ink/60 text-galpi-paper text-2xs` 1종만.

## 8. 반응형 기준

컨테이너 전략 (`components/layout/web-frame.tsx` 교체 대상, 네이티브 태블릿 동일 적용)

| 뷰포트 | 레이아웃 |
|---|---|
| < 640 | 풀블리드, 거터 20 |
| 640 – 1023 | 중앙 1열, `max-w 480`, 바깥 `bg-secondary`, **베젤·고정 높이 없음**(세로 100%) |
| ≥ 1024 | 중앙 1열 `max-w 560`, 거터 24. 하단 탭바는 컨테이너 폭에 맞춤 |

그리드: 서재 카드 뷰 열 수 = 컨테이너 폭 기준 `<420: 3` / `420–559: 4` / `≥560: 5`. 타일 최소 폭 88.
브레이크포인트 클래스는 NativeWind `sm:`(640) `md:`(768) `lg:`(1024)만 사용.
키보드: 입력 화면은 현행 `KeyboardAvoidingView` 유지.

## 9. 인터랙션 원칙

- 눌림: `scale 0.98`(큰 버튼·카드) 또는 `opacity 0.85`(필·텍스트 버튼). 둘 중 하나만.
- 전환: 150–220ms, `Easing.out(cubic)`. 바운스 없음. 등장 애니메이션 없음(시트 슬라이드, 탭 리프트, 토글 인디케이터만 유지).
- 로딩: 스켈레톤(기존 `Skeleton`) 우선, 버튼 내부는 `ActivityIndicator`.
- 파괴적 동작: `destructive` 색 + 확인 단계 필수(웹 Alert 문제는 IMPROVEMENT_PLAN P0-2).
- 접근성: 터치 타깃 ≥ 40(`hitSlop` 포함), 모든 아이콘 버튼 `accessibilityLabel` + `role`, 선택 상태 `accessibilityState.selected`, 텍스트 대비 ≥ 4.5:1(§1.2).
- 다크 모드: 파스텔은 고정, 검정 블록은 `primary`로 반전. 신규 색은 반드시 Light/Dark 쌍으로 추가.
