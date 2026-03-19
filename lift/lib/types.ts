export type Lift = 'squat' | 'bench' | 'deadlift' | 'press';

export type ProgramId = 'wendler531' | 'gzcl' | 'candito6week';

export interface Profile {
  id: string;
  name: string;
  programId: ProgramId;
  oneRepMaxes: Record<Lift, number>; // true 1RMs
  trainingMaxes: Record<Lift, number>; // 90% of 1RM (used by 531 + GZCL)
  currentWeek: number; // 1–4 for 531, 1–9 for GZCL, 1–6 for Candito
  currentCycle: number;
  currentDayInWeek?: number; // 0-indexed session within week (Candito)
  weightLog: WeightEntry[];
  workoutHistory: WorkoutRecord[];
  habitLog: HabitEntry[];
  // 5/3/1 options
  fslEnabled?: boolean;
  accessorySelections?: AccessorySelections;
  // GZCL
  runningDown?: boolean;
  gzclT3Selections?: AccessorySelections; // keyed by day
  // Candito
  canditoAdjustedMaxes?: Partial<Record<Lift, number>>; // after failure penalty
  canditoLowerType?: 'hypertrophy' | 'explosive';
  canditoUpperAccessories?: Record<string, string>; // slotId → exerciseId
  absTrainedDates?: string[]; // ISO dates when abs were trained
}

export interface WorkoutRecord {
  date: string; // ISO
  week: number;
  cycle: number;
  day: string; // DayId for 531/GZCL, 'day1'/'day2'/… for Candito
  lift: Lift;
  sets: SetResult[];
  amrapReps?: number;
  amrapWeight?: number;
  completed: boolean;
  programId?: ProgramId;
  failedSets?: number[]; // set indices that failed (Candito penalty tracking)
}

export interface SetResult {
  setIndex: number;
  weight: number;
  targetReps: number;
  completedReps?: number;
  done: boolean;
  failed?: boolean;
}

export interface WeightEntry {
  date: string; // ISO
  weight: number; // lbs
}

export interface HabitEntry {
  date: string; // ISO
  walk: boolean;
  creatine: boolean;
}

export type TabId = 'today' | 'program' | 'history' | 'weight' | 'settings';

export type DayId = 'monday' | 'tuesday' | 'thursday' | 'friday';

export interface DayConfig {
  day: DayId;
  label: string;
  category: string;
  lift: Lift;
}

export type AccessoryCategory = 'push' | 'pull' | 'biceps' | 'core' | 'legs';

// Per day: slot index → chosen exercise id
export type AccessorySelections = Partial<Record<string, Record<number, string>>>;
