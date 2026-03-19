import type { Lift } from './types';

// ─── Raw Schema (exact from spec) ────────────────────────────────────────────

export type CanditoLiftKey = 'Squat' | 'Deadlift' | 'Bench Press';

export interface CanditoDayData {
  lifts: Partial<Record<CanditoLiftKey, string[]>>;
}

export interface CanditoWeekData {
  label: string;
  days: Record<string, CanditoDayData>;
  instructions?: string;
}

export const CANDITO_SCHEMA: Record<string, CanditoWeekData> = {
  'Week 1': {
    label: 'Muscular Conditioning',
    days: {
      day1: { lifts: { Squat: ['80% 4x6'], Deadlift: ['80% 2x6'] } },
      day2: { lifts: { 'Bench Press': ['50% x10', '68% x10', '75% x8', '78% x6'] } },
      day3: { lifts: { 'Bench Press': ['50% x10', '68% x10', '75% x8', '78% x6'] } },
      day4: { lifts: { Squat: ['70% 4x8'], Deadlift: ['70% 2x8'] } },
      day5: { lifts: { 'Bench Press': ['80% 1xMR'] } },
    },
  },
  'Week 2': {
    label: 'Hypertrophy',
    days: {
      day1: { lifts: { Squat: ['80% 1xMR10', 'Add 5lbs: 5x3'] } },
      day2: { lifts: { 'Bench Press': ['73% x10', '78% x8', '81% 1x(6-8)'] } },
      day3: { lifts: { Squat: ['81.5% 1xMR10', 'Backoff -10lbs: 10x3 (if 10 reps), 8x3 (if 8-9 reps), 5x3 (if 7 reps)'] } },
      day4: { lifts: { 'Bench Press': ['73% x10', '78% x8', '81% 1x(6-8)'] } },
      day5: { lifts: { 'Bench Press': ['78% 1xMR'] } },
    },
  },
  'Week 3': {
    label: 'Linear Max OT',
    days: {
      day1: { lifts: { Squat: ['86.5% 3x(4-6)'], Deadlift: ['88% 2x(3-6)'] } },
      day2: { lifts: { 'Bench Press': ['86% 3x(4-6)'] } },
      day3: { lifts: { Squat: ['87.5% 1x(4-6)'] } },
      day4: { lifts: { 'Bench Press': ['87.5% 3x(4-6)'] } },
    },
  },
  'Week 4': {
    label: 'Heavy Weight Acclimation',
    days: {
      day1: { lifts: { Squat: ['89% x3', '90% x3', '91.5% x3'] } },
      day2: { lifts: { 'Bench Press': ['86% x3', '89% x3', '90.5% x3'] } },
      day3: { lifts: { Squat: ['91.5% x3', '95% 1x(1-2)'], Deadlift: ['91% x3', '95% 1x(1-2)'] } },
      day4: { lifts: { 'Bench Press': ['87.5% x3', '90.5% 1x(2-4)', '95% 1x(1-2)'] } },
    },
  },
  'Week 5': {
    label: 'Intense Strength',
    days: {
      day1: { lifts: { Squat: ['97.5% 1x(1-4)'], Deadlift: ['67.5% x4', '70% x4', '72.5% x2'] } },
      day2: { lifts: { 'Bench Press': ['97% 1x(1-4)'] } },
      day3: { lifts: { Deadlift: ['98% 1x(1-4)'] } },
    },
  },
  'Week 6': {
    label: 'Projected Max',
    days: {},
    instructions:
      'Calculate projected 1RM based on Week 5 reps: ×1.03 for 2 reps, ×1.06 for 3 reps, ×1.09 for 4 reps. ' +
      'Review new projected maxes below, then start a new cycle.',
  },
};

// ─── Set Parser ───────────────────────────────────────────────────────────────

export interface ParsedSet {
  percent?: number;     // fraction of 1RM (e.g. 0.80)
  sets: number;
  repsDisplay: string;  // human-readable: "6", "4-6", "MR", "MR (max 10)"
  isMR: boolean;        // max-reps set
  mrCap?: number;       // MR capped at N (MR10 → 10)
  isConditional: boolean; // backoff set with conditional logic
  addLbs?: number;      // "Add 5lbs: 5x3" — relative to previous set's weight
  note: string;         // original spec string
}

export function parseCanditoSpec(spec: string): ParsedSet {
  // "Add Xlbs: NxM"
  const addMatch = spec.match(/^Add (\d+(?:\.\d+)?)lbs:\s*(\d+)x(\d+)/);
  if (addMatch) {
    return {
      sets: parseInt(addMatch[2]),
      repsDisplay: addMatch[3],
      isMR: false,
      isConditional: false,
      addLbs: parseFloat(addMatch[1]),
      note: spec,
    };
  }
  // "Backoff …" conditional
  if (spec.startsWith('Backoff')) {
    return { sets: 1, repsDisplay: 'see note', isMR: false, isConditional: true, note: spec };
  }
  // "X% [N]xY" or "X% xY"
  const m = spec.match(/^(\d+(?:\.\d+)?)%\s+(?:(\d+)x)?(.+)$/);
  if (m) {
    const percent = parseFloat(m[1]) / 100;
    const sets = m[2] ? parseInt(m[2]) : 1;
    const repsRaw = m[3].trim().replace(/[()]/g, '');
    if (repsRaw === 'MR10') return { percent, sets, repsDisplay: 'MR (max 10)', isMR: true, mrCap: 10, isConditional: false, note: spec };
    if (repsRaw === 'MR')   return { percent, sets, repsDisplay: 'Max Reps', isMR: true, isConditional: false, note: spec };
    return { percent, sets, repsDisplay: repsRaw, isMR: false, isConditional: false, note: spec };
  }
  return { sets: 1, repsDisplay: spec, isMR: false, isConditional: true, note: spec };
}

// ─── Weight Calculation ───────────────────────────────────────────────────────

export function canditoWeight(percent: number, oneRM: number): number {
  return Math.round((oneRM * percent) / 5) * 5;
}

export function applyFailurePenalty(oneRM: number): number {
  return Math.round((oneRM * 0.975) / 5) * 5;
}

// ─── Week 6 Projection ───────────────────────────────────────────────────────

export function calcWeek6Projection(weight: number, reps: number): number {
  const mult: Record<number, number> = { 1: 1.0, 2: 1.03, 3: 1.06, 4: 1.09 };
  return Math.round((weight * (mult[Math.min(reps, 4)] ?? 1.0)) / 5) * 5;
}

// ─── Day Helpers ─────────────────────────────────────────────────────────────

export function getCanditoDayCount(week: number): number {
  return ({ 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 0 } as Record<number, number>)[week] ?? 0;
}

export function getCanditoDayData(week: number, dayKey: string): CanditoDayData | null {
  const w = CANDITO_SCHEMA[`Week ${week}`];
  return w?.days[dayKey] ?? null;
}

/** Returns true if any lift in the day is Squat or Deadlift */
export function isLowerDay(week: number, dayKey: string): boolean {
  const d = getCanditoDayData(week, dayKey);
  if (!d) return false;
  return 'Squat' in d.lifts || 'Deadlift' in d.lifts;
}

/** Returns true if the only lift is Bench Press */
export function isUpperDay(week: number, dayKey: string): boolean {
  const d = getCanditoDayData(week, dayKey);
  if (!d) return false;
  return 'Bench Press' in d.lifts && !('Squat' in d.lifts) && !('Deadlift' in d.lifts);
}

// ─── Lift key → Lift type mapping ────────────────────────────────────────────

export const CANDITO_LIFT_MAP: Record<CanditoLiftKey, Lift> = {
  Squat: 'squat',
  Deadlift: 'deadlift',
  'Bench Press': 'bench',
};

// ─── Accessory Config ─────────────────────────────────────────────────────────

/** Upper body: 3 required slots */
export const CANDITO_UPPER_SLOTS = [
  { id: 'horiz-pull', label: 'Horizontal Pull',   options: ['cable-rows', 'db-rows'] },
  { id: 'vert-pull',  label: 'Vertical Pull',      options: ['lat-pulldown', 'pull-ups', 'chin-ups'] },
  { id: 'shoulders',  label: 'Shoulders',          options: ['db-ohp', 'face-pulls'] },
] as const;

/** Lower body type options */
export const CANDITO_LOWER_OPTIONS = [
  { id: 'hypertrophy', label: 'Hypertrophy', desc: '8–12 reps · 1–2 min rest' },
  { id: 'explosive',   label: 'Explosive',   desc: '4 reps strict · 3–8 min rest' },
] as const;
