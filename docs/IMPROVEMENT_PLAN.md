# 갈피 UI/UX 리뉴얼 · 성능 최적화 개선 계획

작성일: 2026-11-12 · 기준 커밋: `7f0e761` · 상태: **분석 완료, 구현 전 (승인 대기)**

## 0. 분석 범위와 방법

- 읽은 파일: `package.json`, 설정 파일(app.json / tailwind / metro / babel / vercel), `lib/store.ts`, `lib/data-service.ts`, `lib/firebase.ts`, `lib/use-auth-sync.ts`, `lib/use-reading-goals.ts`, `lib/reading-goals.ts`, `lib/theme*.ts`, `global.css`, `app/_layout.tsx`, `app/(tabs)/*`, `app/book/[id].tsx`, `components/layout/web-frame.tsx`, `components/galpi/{book-card,bottom-nav,reading-timer-widget}.tsx`, `components/screens/library-screen.tsx`, `stats-report-screen.tsx`(일부), `book-detail-screen.tsx`(일부)
- 나머지 화면은 grep 기반 패턴 집계로만 확인
- 기존 web 빌드 산출물(`dist/`, 2026-08-23 빌드)로 번들 구성을 측정 (HEAD보다 오래됨 → 수치는 근사치)
- `npx tsc --noEmit` 통과 (타입 오류 0)

### 현재 아키텍처 요약 (유지 대상)

- Expo Router 라우트(`app/`)가 zustand 셀렉터로 데이터를 읽어 프레젠테이션 화면(`components/screens/`)에 props로 전달 — 분리가 잘 되어 있음
- Firestore `onSnapshot` 4개(books / sentences / readingLog / readingGoals)를 로그인 시 한 번 열고 스토어에 반영, 스토어는 AsyncStorage에 persist
- 테마: CSS 변수 + `useThemeColors()` 이중 체계, 폰트는 Noto Sans KR 정적 웨이트 9종

---

## 1. 우선순위 요약표

| ID | P | 항목 | 분석 영역 | 난이도 | 영향 범위 |
|---|---|---|---|---|---|
| 1 | P0 | 폰트 9종(53MB) 전부 로드 + 로드 완료까지 첫 렌더 차단 | E, F | 중 | `app/_layout.tsx`, `tailwind.config.js`, (신규) `app/+html.tsx` |
| 2 | P0 | `Alert.alert`가 웹에서 no-op → 삭제 확인·에러 안내가 웹에서 전부 무음 | A, F | 하 | 14개 파일 import 교체 + (신규) `lib/alert.ts` |
| 3 | P0 | 웹 번들 5.9MB 단일 청크 (lucide 전체 아이콘 포함, 동적 import 미분할) | E | 중 | 빌드 설정, 아이콘 import 경로 |
| 4 | P1 | 탭 레이아웃·책 상세 라우트의 불필요한 리렌더 전파 | C | 하 | `app/(tabs)/_layout.tsx`, `app/book/[id].tsx`, `add-choice-sheet.tsx` |
| 5 | P1 | `useReadingGoals` 스트릭 계산이 매 렌더 반복 | C | 하 | `lib/use-reading-goals.ts` |
| 6 | P1 | 스냅샷마다 서재 전체를 AsyncStorage에 JSON 직렬화 | D | 하 | `lib/store.ts` |
| 7 | P1 | 웹 새로고침마다 Firestore 전체 재조회 (로컬 캐시 미사용) | D | 하~중 | `lib/firebase.ts` |
| 8 | P1 | 타이포 스케일 불일치: 임의값 `text-[Npx]` 130여 곳 | A | 하 | `tailwind.config.js` + 화면 전반(기계적 치환) |
| 9 | P1 | 접근성: 아이콘 버튼 role 누락, hitSlop 없음, 폰트 배율 미대응 | F | 하~중 | 공용 `IconButton` 신설 + 화면 전반 |
| 10 | P1 | 반복 UI 패턴(원형 아이콘 버튼 등) 중복 | B | 하 | `components/galpi/` |
| 11 | P2 | 데스크톱 웹 400×860 고정 프레임, 태블릿 브레이크포인트 없음 | F | 중 | `web-frame.tsx`, `library-screen.tsx` |
| 12 | P2 | 웹 `<html lang="en">`, `<title>` 비어 있음, theme-color 없음 | F, A | 하 | (신규) `app/+html.tsx` |
| 13 | P2 | `firebase/analytics`가 네이티브 번들에도 포함 | E | 하 | `lib/firebase.ts` |
| 14 | P2 | `stats-report-screen.tsx` 1,457줄 — 순수 통계 함수와 UI 혼재 | B | 중 | `stats-report-screen.tsx` → `lib/stats.ts` 분리 |
| 15 | P2 | 책 표지 `Image` 캐시 없음 (22곳) | E | 하 | `book-card.tsx` 등 (expo-image 도입 여부는 별도 승인) |

---

## 2. 상세

### P0-1. 폰트 로딩 (E, F)

**현재 문제**
- `app/_layout.tsx`가 `useFonts`로 Noto Sans KR 9개 웨이트를 전부 로드하고, `fontsLoaded && authResolved`가 될 때까지 `null`을 반환 → 첫 화면이 폰트 다운로드에 묶임
- 각 TTF가 약 6MB, 합계 53MB. 웹에서는 매 세션 다운로드 대상
- 실제 className에서 쓰는 웨이트는 5종뿐 (`bold` 167, `black` 84, `semibold` 45, `medium` 37, `normal` 1). `thin / extralight / light / extrabold`는 **미사용인데 로드·번들됨**

| 항목 | 현재 | 목표 |
|---|---|---|
| 로드 웨이트 수 | 9 | 5 (100·200·300·800 제거) |
| 네이티브 폰트 에셋 | 53MB | ≈30MB |
| 웹 폰트 전송량 | 53MB(TTF) | 수백 KB~1MB대 (woff2 + unicode-range 서브셋) |

**개선 방향**
1. `app/_layout.tsx`의 `useFonts` 목록과 `tailwind.config.js`의 `fontWeightFamily` 플러그인에서 미사용 4종 제거
2. 웹: `app/+html.tsx`를 추가해 Google Fonts CSS(`display=swap`, 한글 unicode-range 서브셋 woff2)를 `<link>`로 로드하고, `fontFamily` 이름을 CSS `@font-face` 이름과 일치시킴. 웹에서는 `ready` 조건에서 `fontsLoaded`를 제외(시스템 폰트로 먼저 그리고 swap)하거나 `Platform.OS === 'web'`일 때 `useFonts`를 건너뜀
3. 네이티브는 기존 방식 유지(정적 에셋은 앱 번들에 포함되어 다운로드 비용 없음)

**예상 효과** 웹 첫 페인트 지연의 대부분 제거, 네이티브 앱 용량 약 24MB 감소
**검증** 브라우저 Network 탭 폰트 전송량·LCP 비교, 네이티브 `expo export` 에셋 크기, 각 화면에서 `font-black`/`font-bold` 렌더 확인
**난이도** 중 · **영향 범위** `app/_layout.tsx`, `tailwind.config.js`, `app/+html.tsx`(신규)

### P0-2. 웹에서 `Alert.alert` 무음 (A, F)

**현재 문제**
- `react-native-web`의 `Alert.alert`는 빈 함수(`static alert() {}`)로 확인됨
- `Alert.alert`를 쓰는 파일 14개: `app/(tabs)/library.tsx`, `book-detail-screen.tsx`, `edit-sentence-screen.tsx`, `add-book-screen.tsx`, `add-sentence-screen.tsx`, `data-backup-screen.tsx`, `reading-goal-screen.tsx`, `linked-accounts-screen.tsx`, `stats-report-screen.tsx`, `year-review-screen.tsx`, `badge-grid.tsx`, `change-password-modal.tsx`, `sentence-card-modal.tsx`, `delete-account-modal.tsx`
- 결과: 웹에서 **책/갈피 삭제 버튼이 아무 반응 없음**(확인 다이얼로그의 onPress가 영원히 호출되지 않음), 저장 실패·권한 거부·공유 불가 안내도 표시되지 않음

**개선 방향**
- `lib/alert.ts`에 동일 시그니처의 `alert(title, message?, buttons?)` 래퍼를 두고, 웹에서는 버튼 수에 따라 `window.alert` / `window.confirm`으로 매핑(취소 버튼 → false, 나머지 → onPress 실행), 네이티브는 `Alert.alert` 위임
- 14개 파일은 import 한 줄과 호출 이름만 교체 (로직 변경 없음)
- 나중에 디자인 일관성을 원하면 기존 `BottomSheet` 기반의 커스텀 confirm으로 교체 가능하나, 이번 단계는 최소 변경

**예상 효과** 웹에서 삭제·에러 흐름 정상화
**검증** 웹 빌드에서 책 상세 → 삭제 → confirm 노출 및 실제 삭제, 네이티브 동작 불변 확인
**난이도** 하 · **영향 범위** 14개 파일 + 신규 1개

### P0-3. 웹 번들 크기 (E)

**현재 문제** (2026-08-23 빌드 `dist/` 기준)

| 지표 | 값 |
|---|---|
| 엔트리 JS | 5.9MB (gzip 1.09MB), 단일 파일 |
| Metro 모듈 수 | 3,313 |
| `lucide-react-native` 참조 | 1,770회 (실사용 아이콘 50개) |
| `html2canvas` | `await import()`인데 엔트리에 인라인됨 |

- lucide는 named import(`import { X } from 'lucide-react-native'`)여서 Metro가 전체 아이콘 세트를 포함
- `expo-camera`, `expo-notifications`, `html2canvas` 등 특정 화면 전용 모듈이 모두 첫 청크에 포함

**개선 방향**
1. 먼저 비용 0인 검증: 최신 소스로 `expo export -p web` 재실행 후 크기 재측정. Expo SDK 54의 실험적 트리셰이킹(`EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1`)을 빌드 환경변수로 켜서 효과 측정 — 코드 변경 없이 lucide/firebase 미사용 export 제거 가능
2. 효과가 부족하면 `lib/icons.ts`에 사용 아이콘 50개를 per-file 경로(`lucide-react-native/dist/esm/icons/...`)로 re-export하고 화면들은 그 파일에서 import (import 경로만 바뀜)
3. `html2canvas` 동적 import가 분할되지 않는 원인 확인(expo-router web 설정) — 분할되면 `expo-camera`(OCR 화면)도 같은 패턴으로 지연 로드 가능

**예상 효과** 엔트리 gzip 크기 유의미한 감소(아이콘만으로도 수백 KB대 기대), 초기 파싱 시간 단축
**검증** `expo export -p web` 전후 `dist/_expo/static/js/web/*.js` 크기 비교, Lighthouse TBT/LCP
**난이도** 중 · **영향 범위** 빌드 설정, (필요 시) 아이콘 import 경로 40개 파일

### P1-4. 루트/라우트 레벨 리렌더 전파 (C)

**현재 문제**
- `app/(tabs)/_layout.tsx`가 `books`를 구독하지만 실제 사용처는 열려 있을 때만 보이는 `AddChoiceSheet`. 책 스냅샷이 올 때마다 `Tabs` 전체가 리렌더되고, 인라인 `tabBar={(props) => ...}`가 매번 새 함수라 `BottomNav`(Reanimated 애니메이션 포함)까지 리렌더
- `app/book/[id].tsx`는 매 렌더 `sentencesByBook(allSentences, book.id)`로 새 배열을 만들어 `BookDetailScreen`에 전달 → 내부 `shareCandidates` `useMemo`가 매번 무효화. 콜백 8개도 전부 인라인

**개선 방향**
- `books` 셀렉터를 `AddChoiceSheet` 내부(또는 시트가 열릴 때만 렌더되는 하위)로 이동, `tabBar` 렌더 함수는 `useCallback`
- `[id].tsx`에서 `sentencesByBook` 결과를 `useMemo([allSentences, book.id])`로 고정

**예상 효과** 책 추가/수정 때 탭바·상세 화면의 불필요 렌더 제거
**검증** React DevTools Profiler에서 책 상태 변경 시 `BottomNav` 렌더 횟수 0 확인
**난이도** 하

### P1-5. `useReadingGoals` 매 렌더 재계산 (C)

**현재 문제** `lib/use-reading-goals.ts`가 `activeReadingDays`(전체 sentences 순회 + Set 생성) → `computeStreaks`(정렬)를 메모 없이 매 렌더 실행. 서재·마이페이지·목표 화면 3곳에서 동시에 마운트되고, `new Date()`도 렌더마다 생성

**개선 방향** `useMemo`로 `[sentences, readingLog]` / `[books]` 키 묶음, 반환 객체도 메모
**예상 효과** 서재 화면 타이핑(검색)·필터 변경 때 O(n log n) 계산 반복 제거
**검증** Profiler에서 검색어 입력 시 `useReadingGoals` 호출 비용 확인
**난이도** 하

### P1-6. persist 직렬화 비용 (D)

**현재 문제** `lib/store.ts`의 `persist`가 `books`·`sentences`·`readingLog`·`readingGoals`를 partialize하므로 **스냅샷 하나마다 서재 전체를 `JSON.stringify` → AsyncStorage 쓰기**. 타이머 1분마다 오는 `readingLog` 스냅샷, 드래그 정렬의 낙관적 `set`도 모두 전체 직렬화를 유발

**개선 방향** `createJSONStorage`에 넘기는 storage의 `setItem`을 trailing debounce(300~500ms)로 감싸는 소형 래퍼 (zustand API 범위 내, 라이브러리 추가 없음)
**예상 효과** 연속 스냅샷·낙관적 업데이트 시 메인 스레드 직렬화 횟수 감소
**검증** `setItem` 호출 횟수 로그 전후 비교 (정렬 드래그 1회, 타이머 세션 1회)
**난이도** 하

### P1-7. Firestore 로컬 캐시 (D)

**현재 문제** `getFirestore(app)` 기본값은 메모리 캐시 → 웹 새로고침마다 books + sentences 전체 문서를 다시 읽음(읽기 과금·초기 로딩). AsyncStorage 캐시는 UI 선표시용이지 Firestore 읽기를 줄이진 않음
**개선 방향** 웹에서만 `initializeFirestore(app, { localCache: persistentLocalCache() })` (IndexedDB). 네이티브는 JS SDK가 IndexedDB를 요구하므로 현행 유지
**예상 효과** 웹 재방문 시 변경분만 읽음, 오프라인 열람 가능
**검증** Firebase 콘솔 Firestore 읽기 수 비교, 새로고침 직후 네트워크 탭의 Listen 응답 크기
**난이도** 하~중 (멀티 탭 동시 열림 시 `persistentMultipleTabManager` 필요 여부 확인)

### P1-8. 타이포 스케일 (A)

**현재 문제** `text-[13px]` 39, `[11px]` 31, `[10px]` 29, `[15px]` 15, `[7px]` 9, `[9px]` 7, `[6.5px]` 5 등 임의값이 Tailwind 스케일(`text-xs`, `text-sm`)과 혼재. 최근 커밋(`663919e`)에서 일부 정리 중. 제목은 `font-black`과 `font-bold`가 화면마다 다르게 쓰임
**개선 방향** `tailwind.config.js` `fontSize`에 `2xs(10px)`, `xs+(11px)`, `sm-(13px)`, `base-(15px)` 같은 이름 토큰을 정의하고 임의값을 기계적으로 치환. 제목 위계(화면 제목 `xl/black`, 섹션 `lg/black`, 카드 제목 `[15px]/bold`)를 문서화
**예상 효과** 디자인 일관성, 이후 글로벌 크기 조정 가능
**검증** `grep -c 'text-\['` 0에 수렴, 주요 화면 스크린샷 비교
**난이도** 하 (파일 수는 많으나 치환 작업)

### P1-9. 접근성 (F)

**현재 문제**
| 지표 | 값 |
|---|---|
| `<Pressable` | 168 |
| `accessibilityRole` | 11 |
| `accessibilityLabel` | 90 |
| `hitSlop` | 12 |
| `maxFontSizeMultiplier` / `allowFontScaling` | 0 |

- 36px 원형 아이콘 버튼이 role 없이 label만 가진 경우가 많고, hitSlop 없음
- OS 글꼴 확대 시 `h-9 w-9` 고정 칩과 히트맵의 `text-[7px]`·`[6.5px]` 레이블이 깨질 가능성
**개선 방향** P1-10의 `IconButton`에 `accessibilityRole="button"`, `hitSlop={8}` 기본 내장. 밀집 레이블(히트맵·배지)에 `maxFontSizeMultiplier={1.2}`
**검증** iOS VoiceOver / 웹 스크린리더로 서재·상세 탐색, 디스플레이 설정 글꼴 최대 상태 스크린샷
**난이도** 하~중

### P1-10. 반복 UI 패턴 추출 (B)

**현재 문제** `className="h-9 w-9 items-center justify-center rounded-full bg-card"` + lucide 아이콘 Pressable이 서재·상세·통계·즐겨찾기 등 6개 이상 화면에 반복. 화면 제목 행(제목 + 우측 액션)도 동일 구조 반복
**개선 방향** `components/galpi/icon-button.tsx` 1개만 신설(P1-9와 함께). 섹션 헤더 등은 중복이 3회 이상인 것만 추출, 그 외는 손대지 않음
**검증** 치환 전후 스크린샷 동일, 타입 체크
**난이도** 하

### P2-11. 반응형 레이아웃 (F)

**현재 문제** `web-frame.tsx`가 640px 이상에서 400×860 고정 프레임(높이가 작은 노트북에서는 잘림), 네이티브 태블릿은 카드 그리드 4열·`maxWidth 480` 외 대응 없음. `sm:`/`md:` 클래스 사용 2곳
**개선 방향** 프레임 높이를 `min(860, height - 48)`로, 태블릿(≥768)에서 서재 리스트를 2열 또는 `maxWidth 640`으로 완화
**난이도** 중

### P2-12. 웹 문서 메타 (F, A)

**현재 문제** 빌드된 `index.html`이 `lang="en"`, `<title>` 비어 있음, `theme-color` 없음
**개선 방향** `app/+html.tsx`(P0-1에서 신설)에 `lang="ko"`, 제목, `theme-color`(라이트/다크), 폰트 preload 추가
**난이도** 하

### P2-13. `firebase/analytics` 네이티브 포함 (E)

**현재 문제** `lib/firebase.ts` 12행에서 `isSupported`를 최상위 import → 네이티브 번들에도 analytics 모듈 포함
**개선 방향** 웹 분기 안의 `require`로 함께 이동
**난이도** 하

### P2-14. 통계 화면 분리 (B)

**현재 문제** `stats-report-screen.tsx` 1,457줄. `getTimePattern`, `buildYearHeatmap`, `getYearMetrics` 등 순수 함수 10여 개가 UI와 한 파일. `year-review-screen.tsx`도 일부 import
**개선 방향** 순수 함수만 `lib/stats.ts`로 이동(동작 변경 없음), `ReportPublishModal`(400줄)을 별도 파일로
**난이도** 중 (기계적이지만 파일 크기가 큼)

### P2-15. 표지 이미지 캐시 (E)

**현재 문제** RN `Image` 22곳. 웹/네이티브 모두 디스크 캐시·디코드 재사용 없음
**개선 방향** `expo-image`는 Expo SDK 구성 요소이지만 신규 의존성이므로 **별도 승인 후** 교체. 대안: 현행 유지
**난이도** 하

---

## 3. 수정하지 않을 것 (확인 결과 양호)

- 라우트 ↔ 화면 분리, zustand 셀렉터 사용(전체 스토어 구독 없음)
- Firestore 쓰기 경로: 트랜잭션/배치/undo 복원 모두 적절
- `useReadingTimerAutoAdvance`: 1초 인터벌이 `getState()`만 호출해 루트 리렌더 없음
- `ReadingTimerWidget`: 비활성 시 `null` 반환, `useNow`는 자체 컴포넌트에만 영향
- 테마: CSS 변수 + `useThemeColors` 동기화 구조 유지
- `ai`, `dotenv`, `@vercel/node`: `api/` 서버 함수 전용, 클라이언트 번들 미포함

## 4. 권장 작업 순서

1. P0-2 (Alert 래퍼) → 작고 독립적, 웹 치명 버그
2. P0-1 (폰트) + P2-12 (`+html.tsx`) → 같은 파일 묶음
3. P0-3 (번들) → 먼저 환경변수만으로 측정, 결과 보고 아이콘 경로 변경 결정
4. P1-4 / P1-5 / P1-6 / P1-13 → 각각 1파일 수준, 한 번에 묶어 처리 가능
5. P1-7 (Firestore 캐시) → 웹 분기만
6. P1-9 + P1-10 (`IconButton`) → P1-8 (타이포 토큰)과 함께 화면 순회 1회로 마무리
7. P2-11 / P2-14 / P2-15 → 별도 승인 후

각 단계는 독립 커밋으로 분리한다.
