import type { Lift, DayConfig } from './types';

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
  {
    day: 'monday',
    label: 'Monday',
    category: 'Lower Strength',
    lift: 'squat',
    supplementary: [
      'Core: 3×15 Plank + Leg Raises',
      'HIIT Bike: 10 min',
      'Recruitment Pulls: 3–5s Max',
    ],
  },
  {
    day: 'tuesday',
    label: 'Tuesday',
    category: 'Upper Strength',
    lift: 'bench',
    supplementary: [
      'Core: 3×15',
      'Shakeout Run: 20 min easy',
    ],
  },
  {
    day: 'thursday',
    label: 'Thursday',
    category: 'Lower Volume',
    lift: 'deadlift',
    supplementary: [
      'Core: 3×15',
      'Light Row: 20 min Z2',
    ],
  },
  {
    day: 'friday',
    label: 'Friday',
    category: 'Upper Volume',
    lift: 'press',
    supplementary: [
      'Core: 3×15',
      'Long Bike: 45 min Z2',
      'Density Hangs: 20–40s to failure',
    ],
  },
];

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
