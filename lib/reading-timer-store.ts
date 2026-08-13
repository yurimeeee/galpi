import { create } from 'zustand';
import { type Book } from './data/books';

export type TimerPhase = 'focus' | 'rest';

export type TimerPreset = { key: string; label: string; focus: number; rest: number };

export const TIMER_PRESETS: TimerPreset[] = [
  { key: '25/5', label: '25분 독서 / 5분 휴식', focus: 25, rest: 5 },
  { key: '50/10', label: '50분 독서 / 10분 휴식', focus: 50, rest: 10 },
  { key: 'custom', label: '자율 설정', focus: 15, rest: 3 },
];

export const TIMER_TOTAL_SESSIONS = 4;

export function presetFor(key: string, customFocus: number): TimerPreset {
  const p = TIMER_PRESETS.find((x) => x.key === key) ?? TIMER_PRESETS[0];
  return p.key === 'custom' ? { ...p, focus: customFocus, rest: 3 } : p;
}

type ReadingTimerState = {
  /** A session has been started (may be running, paused, or awaiting its summary). */
  active: boolean;
  running: boolean;
  /** All TIMER_TOTAL_SESSIONS focus sessions finished — screen should show the summary. */
  completed: boolean;
  book: Book | null;
  /** book.galpiCount as of session start / last book switch, for "갈피 수집" delta in the summary. */
  initialGalpiCount: number;
  presetKey: string;
  customFocus: number;
  phase: TimerPhase;
  /** epoch ms the current phase ends at — set while running, null while paused. */
  phaseEndAt: number | null;
  /** seconds remaining in the current phase — valid while paused (running === false). */
  pausedRemainingSeconds: number;
  sessionsDone: number;
  /** Completed focus seconds banked from earlier phases/runs (excludes the live in-progress stretch). */
  focusSecondsBanked: number;
  /** epoch ms the current focus stretch started running — null unless running && phase === 'focus'. */
  focusPhaseRunStartedAt: number | null;

  start: (book: Book, presetKey: string, customFocus: number, initialGalpiCount: number) => void;
  toggleRunning: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Advances phase(s) if `phaseEndAt` has passed — the root ticker calls this every second. */
  advanceIfDue: () => void;
  setBook: (book: Book, galpiCount: number) => void;
  setPresetKey: (key: string) => void;
  setCustomFocus: (v: number) => void;
  /** Fully clears the session (after the summary is saved/dismissed) — keeps the last preset choice. */
  end: () => void;
};

export const useReadingTimerStore = create<ReadingTimerState>((set, get) => ({
  active: false,
  running: false,
  completed: false,
  book: null,
  initialGalpiCount: 0,
  presetKey: '25/5',
  customFocus: 15,
  phase: 'focus',
  phaseEndAt: null,
  pausedRemainingSeconds: TIMER_PRESETS[0].focus * 60,
  sessionsDone: 0,
  focusSecondsBanked: 0,
  focusPhaseRunStartedAt: null,

  start: (book, presetKey, customFocus, initialGalpiCount) => {
    const preset = presetFor(presetKey, customFocus);
    const now = Date.now();
    set({
      active: true,
      running: true,
      completed: false,
      book,
      initialGalpiCount,
      presetKey,
      customFocus,
      phase: 'focus',
      phaseEndAt: now + preset.focus * 60_000,
      pausedRemainingSeconds: 0,
      sessionsDone: 0,
      focusSecondsBanked: 0,
      focusPhaseRunStartedAt: now,
    });
  },

  toggleRunning: () => (get().running ? get().pause() : get().resume()),

  pause: () => {
    const s = get();
    if (!s.running || s.phaseEndAt === null) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.round((s.phaseEndAt - now) / 1000));
    const bankedAdd =
      s.phase === 'focus' && s.focusPhaseRunStartedAt
        ? Math.max(0, Math.round((now - s.focusPhaseRunStartedAt) / 1000))
        : 0;
    set({
      running: false,
      pausedRemainingSeconds: remaining,
      phaseEndAt: null,
      focusSecondsBanked: s.focusSecondsBanked + bankedAdd,
      focusPhaseRunStartedAt: null,
    });
  },

  resume: () => {
    const s = get();
    if (s.running || !s.active) return;
    const now = Date.now();
    set({
      running: true,
      phaseEndAt: now + s.pausedRemainingSeconds * 1000,
      focusPhaseRunStartedAt: s.phase === 'focus' ? now : null,
    });
  },

  reset: () => {
    const s = get();
    const preset = presetFor(s.presetKey, s.customFocus);
    set({
      running: false,
      completed: false,
      phase: 'focus',
      phaseEndAt: null,
      pausedRemainingSeconds: preset.focus * 60,
      sessionsDone: 0,
      focusSecondsBanked: 0,
      focusPhaseRunStartedAt: null,
    });
  },

  advanceIfDue: () => {
    const s = get();
    if (!s.running || s.phaseEndAt === null || Date.now() < s.phaseEndAt) return;
    const preset = presetFor(s.presetKey, s.customFocus);

    if (s.phase === 'focus') {
      const bankedAdd = s.focusPhaseRunStartedAt
        ? Math.max(0, Math.round((s.phaseEndAt - s.focusPhaseRunStartedAt) / 1000))
        : 0;
      const sessionsDone = s.sessionsDone + 1;
      const focusSecondsBanked = s.focusSecondsBanked + bankedAdd;

      if (sessionsDone >= TIMER_TOTAL_SESSIONS) {
        set({
          running: false,
          completed: true,
          sessionsDone,
          focusSecondsBanked,
          phaseEndAt: null,
          pausedRemainingSeconds: 0,
          focusPhaseRunStartedAt: null,
        });
        return;
      }

      set({
        phase: 'rest',
        sessionsDone,
        focusSecondsBanked,
        // Chains off the due timestamp, not `now` — keeps multi-phase catch-up
        // (e.g. after the app was backgrounded through more than one boundary)
        // from drifting the schedule forward every time it's checked.
        phaseEndAt: s.phaseEndAt + preset.rest * 60_000,
        focusPhaseRunStartedAt: null,
      });
    } else {
      set({
        phase: 'focus',
        phaseEndAt: s.phaseEndAt + preset.focus * 60_000,
        focusPhaseRunStartedAt: s.phaseEndAt,
      });
    }

    // Catches up through every boundary that elapsed while unobserved, rather
    // than only the first.
    get().advanceIfDue();
  },

  setBook: (book, galpiCount) => set({ book, initialGalpiCount: galpiCount }),

  setPresetKey: (presetKey) => {
    const s = get();
    if (s.running) {
      set({ presetKey });
      return;
    }
    const preset = presetFor(presetKey, s.customFocus);
    set({ presetKey, phase: 'focus', pausedRemainingSeconds: preset.focus * 60 });
  },

  setCustomFocus: (customFocus) => {
    const s = get();
    if (s.running) {
      set({ customFocus });
      return;
    }
    const preset = presetFor(s.presetKey, customFocus);
    set({ customFocus, phase: 'focus', pausedRemainingSeconds: preset.focus * 60 });
  },

  end: () => {
    const { presetKey, customFocus } = get();
    const preset = presetFor(presetKey, customFocus);
    set({
      active: false,
      running: false,
      completed: false,
      book: null,
      initialGalpiCount: 0,
      presetKey,
      customFocus,
      phase: 'focus',
      phaseEndAt: null,
      pausedRemainingSeconds: preset.focus * 60,
      sessionsDone: 0,
      focusSecondsBanked: 0,
      focusPhaseRunStartedAt: null,
    });
  },
}));

/** Seconds left in the current phase, as of right now — not itself reactive to the passage of time; callers that display it need their own repaint tick. */
export function timerSecondsLeft(s: ReadingTimerState): number {
  if (s.running && s.phaseEndAt !== null) {
    return Math.max(0, Math.round((s.phaseEndAt - Date.now()) / 1000));
  }
  return s.pausedRemainingSeconds;
}

/** Total focus seconds banked so far this session, including the live in-progress stretch. */
export function timerFocusSecondsTotal(s: ReadingTimerState): number {
  const live =
    s.running && s.phase === 'focus' && s.focusPhaseRunStartedAt
      ? Math.max(0, Math.round((Date.now() - s.focusPhaseRunStartedAt) / 1000))
      : 0;
  return s.focusSecondsBanked + live;
}
