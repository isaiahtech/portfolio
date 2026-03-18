import type { Lift, DayConfig, AccessoryCategory } from './types';

export function calcTrainingMax(oneRM: number): number {
  return Math.round((oneRM * 0.9) / 5) * 5;
}

export function roundToNearest(weight: number, increment = 5): number {
  return Math.round(weight / increment) * increment;
}

export function getWeekSets(week: number): Array<{ percent: number; reps: number; isAmrap: boolean }> {
  const weeks: Record<number, Array<{ percent: number; reps: number; isAmrap: boolean }>> = {
    1: [
      { percent: 0.65, reps: 5, isAmrap: false },
      { percent: 0.75, reps: 5, isAmrap: false },
      { percent: 0.85, reps: 5, isAmrap: true },
    ],
    2: [
      { percent: 0.70, reps: 3, isAmrap: false },
      { percent: 0.80, reps: 3, isAmrap: false },
      { percent: 0.90, reps: 3, isAmrap: true },
    ],
    3: [
      { percent: 0.75, reps: 5, isAmrap: false },
      { percent: 0.85, reps: 3, isAmrap: false },
      { percent: 0.95, reps: 1, isAmrap: true },
    ],
    4: [
      { percent: 0.40, reps: 5, isAmrap: false },
      { percent: 0.50, reps: 5, isAmrap: false },
      { percent: 0.60, reps: 5, isAmrap: false },
    ],
  };
  return weeks[week] || weeks[1];
}

export function calcE1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function getWarmupSets(tm: number): Array<{ weight: number; reps: number }> {
  return [
    { weight: roundToNearest(tm * 0.4), reps: 5 },
    { weight: roundToNearest(tm * 0.5), reps: 5 },
    { weight: roundToNearest(tm * 0.6), reps: 3 },
  ];
}

export function getNextCycleTM(tm: number, lift: Lift): number {
  const isUpper = lift === 'bench' || lift === 'press';
  return tm + (isUpper ? 5 : 10);
}

export const SCHEDULE: DayConfig[] = [
  { day: 'monday',   label: 'Monday',   category: 'Lower Strength', lift: 'squat' },
  { day: 'tuesday',  label: 'Tuesday',  category: 'Upper Strength', lift: 'bench' },
  { day: 'thursday', label: 'Thursday', category: 'Lower Volume',   lift: 'deadlift' },
  { day: 'friday',   label: 'Friday',   category: 'Upper Volume',   lift: 'press' },
];

// ─── Accessory System ─────────────────────────────────────────────────────────

export interface AccessoryExercise {
  id: string;
  name: string;
  category: AccessoryCategory;
  sets: number;
  reps: string;
  note?: string;
}

export const ACCESSORY_LIBRARY: AccessoryExercise[] = [
  // Push
  { id: 'dips',          name: 'Dips',               category: 'push',   sets: 5, reps: '10' },
  { id: 'db-bench',      name: 'DB Bench Press',      category: 'push',   sets: 5, reps: '10' },
  { id: 'db-incline',    name: 'DB Incline Press',    category: 'push',   sets: 5, reps: '10' },
  { id: 'db-ohp',        name: 'DB Shoulder Press',   category: 'push',   sets: 5, reps: '10' },
  { id: 'push-ups',      name: 'Push-ups',            category: 'push',   sets: 5, reps: '15' },
  // Pull
  { id: 'chin-ups',      name: 'Chin-ups',            category: 'pull',   sets: 5, reps: '10' },
  { id: 'pull-ups',      name: 'Pull-ups',            category: 'pull',   sets: 5, reps: '10' },
  { id: 'db-rows',       name: 'DB Rows',             category: 'pull',   sets: 5, reps: '10' },
  { id: 'cable-rows',    name: 'Cable Rows',          category: 'pull',   sets: 5, reps: '10' },
  { id: 'lat-pulldown',  name: 'Lat Pulldown',        category: 'pull',   sets: 5, reps: '10' },
  { id: 'face-pulls',    name: 'Face Pulls',          category: 'pull',   sets: 5, reps: '15', note: 'external rotation — high priority' },
  // Biceps
  { id: 'barbell-curls', name: 'Barbell Curls',       category: 'biceps', sets: 5, reps: '10' },
  { id: 'db-curls',      name: 'DB Curls',            category: 'biceps', sets: 5, reps: '10' },
  { id: 'hammer-curls',  name: 'Hammer Curls',        category: 'biceps', sets: 5, reps: '10' },
  { id: 'ez-curls',      name: 'EZ-Bar Curls',        category: 'biceps', sets: 5, reps: '10' },
  { id: 'cable-curls',   name: 'Cable Curls',         category: 'biceps', sets: 5, reps: '12' },
  // Core
  { id: 'ab-wheel',      name: 'Ab Wheel',            category: 'core',   sets: 5, reps: '10' },
  { id: 'hanging-lr',    name: 'Hanging Leg Raises',  category: 'core',   sets: 5, reps: '10' },
  { id: 'leg-raises',    name: 'Leg Raises',          category: 'core',   sets: 5, reps: '15' },
  { id: 'cable-crunch',  name: 'Cable Crunches',      category: 'core',   sets: 5, reps: '10' },
  { id: 'sit-ups',       name: 'Sit-ups',             category: 'core',   sets: 5, reps: '15' },
  // Legs
  { id: 'leg-curls',     name: 'Leg Curls',           category: 'legs',   sets: 5, reps: '10' },
  { id: 'leg-press',     name: 'Leg Press',           category: 'legs',   sets: 5, reps: '10' },
  { id: 'lunges',        name: 'Lunges',              category: 'legs',   sets: 5, reps: '10' },
  { id: 'good-mornings', name: 'Good Mornings',       category: 'legs',   sets: 5, reps: '10' },
  { id: 'rdl',           name: 'Romanian DL',         category: 'legs',   sets: 5, reps: '10' },
  { id: 'step-ups',      name: 'Step-ups',            category: 'legs',   sets: 5, reps: '10' },
];

export interface AccessorySlot {
  category: AccessoryCategory;
  label: string;
  defaultId: string;
}

// Wendler's recommended accessory template per training day (Triumvirate style)
export const DAY_ACCESSORY_SLOTS: Record<string, AccessorySlot[]> = {
  monday: [
    { category: 'pull',   label: 'Pull',   defaultId: 'chin-ups' },
    { category: 'legs',   label: 'Legs',   defaultId: 'leg-curls' },
    { category: 'core',   label: 'Core',   defaultId: 'ab-wheel' },
  ],
  tuesday: [
    { category: 'push',   label: 'Push',   defaultId: 'dips' },
    { category: 'pull',   label: 'Pull',   defaultId: 'db-rows' },
    { category: 'biceps', label: 'Biceps', defaultId: 'barbell-curls' },
  ],
  thursday: [
    { category: 'pull',   label: 'Pull',   defaultId: 'pull-ups' },
    { category: 'legs',   label: 'Legs',   defaultId: 'good-mornings' },
    { category: 'core',   label: 'Core',   defaultId: 'hanging-lr' },
  ],
  friday: [
    { category: 'push',   label: 'Push',   defaultId: 'db-incline' },
    { category: 'pull',   label: 'Pull',   defaultId: 'face-pulls' },
    { category: 'biceps', label: 'Biceps', defaultId: 'hammer-curls' },
  ],
};

export function getAccessoryById(id: string): AccessoryExercise | undefined {
  return ACCESSORY_LIBRARY.find((a) => a.id === id);
}

export function getAccessoriesByCategory(category: AccessoryCategory): AccessoryExercise[] {
  return ACCESSORY_LIBRARY.filter((a) => a.category === category);
}

// Resolve effective accessory id for a slot (saved selection or default)
export function resolveAccessoryId(
  day: string,
  slotIndex: number,
  selections: Record<string, Record<number, string>> | undefined
): string {
  return selections?.[day]?.[slotIndex] ?? DAY_ACCESSORY_SLOTS[day]?.[slotIndex]?.defaultId ?? '';
}

export function getLiftLabel(lift: Lift): string {
  const labels: Record<Lift, string> = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
    press: 'Overhead Press',
  };
  return labels[lift];
}

export function getTodayDayId(): 'monday' | 'tuesday' | 'thursday' | 'friday' | null {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const map: Record<number, 'monday' | 'tuesday' | 'thursday' | 'friday' | null> = {
    0: null,
    1: 'monday',
    2: 'tuesday',
    3: null, // Wednesday — rest
    4: 'thursday',
    5: 'friday',
    6: null,
  };
  return map[day] ?? null;
}

export function getNextWorkoutDay(): DayConfig {
  const today = new Date().getDay();
  // Find the next scheduled day
  const dayNumbers: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    thursday: 4,
    friday: 5,
  };
  let best = SCHEDULE[0];
  let bestDiff = 8;
  for (const cfg of SCHEDULE) {
    const d = dayNumbers[cfg.day];
    let diff = d - today;
    if (diff <= 0) diff += 7;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cfg;
    }
  }
  return best;
}
