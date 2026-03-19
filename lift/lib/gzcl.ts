import type { Lift, AccessoryCategory } from './types';
import { roundToNearest } from './wendler';

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface GZCLDayConfig {
  day: 'monday' | 'tuesday' | 'thursday' | 'friday';
  label: string;
  t1Lift: Lift;
  t2Lift: Lift;
}

export const GZCL_SCHEDULE: GZCLDayConfig[] = [
  { day: 'monday',   label: 'Monday',   t1Lift: 'squat',     t2Lift: 'deadlift' },
  { day: 'tuesday',  label: 'Tuesday',  t1Lift: 'bench',     t2Lift: 'press' },
  { day: 'thursday', label: 'Thursday', t1Lift: 'press',     t2Lift: 'bench' },
  { day: 'friday',   label: 'Friday',   t1Lift: 'deadlift',  t2Lift: 'squat' },
];

// ─── T1 / T2 Sets ─────────────────────────────────────────────────────────────

export interface GZCLSet {
  weight: number;
  reps: number;
  isAmrap: boolean;
}

/** T1: 5×3, last set AMRAP, at 85% TM */
export function getT1Sets(tm: number): GZCLSet[] {
  const w = roundToNearest(tm * 0.85);
  return Array.from({ length: 5 }, (_, i) => ({ weight: w, reps: 3, isAmrap: i === 4 }));
}

/** T2: 3×10, last set AMRAP, at 65% TM */
export function getT2Sets(tm: number): GZCLSet[] {
  const w = roundToNearest(tm * 0.65);
  return Array.from({ length: 3 }, (_, i) => ({ weight: w, reps: 10, isAmrap: i === 2 }));
}

// ─── T3 Progression Engine ────────────────────────────────────────────────────

export interface T3Config {
  repRange: string;
  repMin: number;
  repMax: number;
  backdownSets: number;
  totalSets: number; // top set + backdown
  weekLabel: string;
}

export function getT3Config(week: number): T3Config {
  if (week <= 2) return { repRange: '12–15', repMin: 12, repMax: 15, backdownSets: 4, totalSets: 5, weekLabel: 'Weeks 1–2' };
  if (week <= 4) return { repRange: '10–12', repMin: 10, repMax: 12, backdownSets: 3, totalSets: 4, weekLabel: 'Weeks 3–4' };
  if (week <= 6) return { repRange: '8–10',  repMin: 8,  repMax: 10, backdownSets: 2, totalSets: 3, weekLabel: 'Weeks 5–6' };
  if (week <= 8) return { repRange: '6–8',   repMin: 6,  repMax: 8,  backdownSets: 1, totalSets: 2, weekLabel: 'Weeks 7–8' };
  return           { repRange: '10',    repMin: 10, repMax: 10, backdownSets: 0, totalSets: 1, weekLabel: 'Week 9' };
}

// ─── Rest Times ───────────────────────────────────────────────────────────────

export const GZCL_REST: Record<'T1' | 'T2' | 'T3', string> = {
  T1: '3–5 min',
  T2: '2–3 min',
  T3: '60–90 sec',
};

// ─── T3 Accessory Slots (3 per day) ──────────────────────────────────────────

export interface GZCLSlot {
  category: AccessoryCategory;
  label: string;
  defaultId: string;
}

export const GZCL_T3_SLOTS: Record<string, GZCLSlot[]> = {
  monday: [
    { category: 'legs',   label: 'Legs',   defaultId: 'leg-curls' },
    { category: 'core',   label: 'Core',   defaultId: 'ab-wheel' },
    { category: 'pull',   label: 'Pull',   defaultId: 'chin-ups' },
  ],
  tuesday: [
    { category: 'push',   label: 'Push',   defaultId: 'dips' },
    { category: 'pull',   label: 'Pull',   defaultId: 'cable-rows' },
    { category: 'biceps', label: 'Biceps', defaultId: 'barbell-curls' },
  ],
  thursday: [
    { category: 'push',   label: 'Push',   defaultId: 'db-incline' },
    { category: 'pull',   label: 'Pull',   defaultId: 'face-pulls' },
    { category: 'biceps', label: 'Biceps', defaultId: 'hammer-curls' },
  ],
  friday: [
    { category: 'legs',   label: 'Legs',   defaultId: 'good-mornings' },
    { category: 'core',   label: 'Core',   defaultId: 'hanging-lr' },
    { category: 'pull',   label: 'Pull',   defaultId: 'pull-ups' },
  ],
};

// ─── Navigation Helpers ───────────────────────────────────────────────────────

export function getGZCLTodayConfig(): GZCLDayConfig | null {
  const day = new Date().getDay();
  const map: Record<number, string | null> = {
    0: null, 1: 'monday', 2: 'tuesday', 3: null, 4: 'thursday', 5: 'friday', 6: null,
  };
  const s = map[day];
  return s ? (GZCL_SCHEDULE.find((d) => d.day === s) ?? null) : null;
}

export function getNextGZCLDay(): GZCLDayConfig {
  const today = new Date().getDay();
  const nums: Record<string, number> = { monday: 1, tuesday: 2, thursday: 4, friday: 5 };
  let best = GZCL_SCHEDULE[0];
  let bestDiff = 8;
  for (const cfg of GZCL_SCHEDULE) {
    let diff = nums[cfg.day] - today;
    if (diff <= 0) diff += 7;
    if (diff < bestDiff) { bestDiff = diff; best = cfg; }
  }
  return best;
}

export function getLiftLabelGZCL(lift: Lift): string {
  const map: Record<Lift, string> = {
    squat: 'Squat', bench: 'Bench Press', deadlift: 'Deadlift', press: 'Overhead Press',
  };
  return map[lift];
}
