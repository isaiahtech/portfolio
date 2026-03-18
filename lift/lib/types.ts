export type Lift = 'squat' | 'bench' | 'deadlift' | 'press';

export interface Profile {
  id: string;
  name: string;
  oneRepMaxes: Record<Lift, number>; // true 1RMs
  trainingMaxes: Record<Lift, number>; // 90% of 1RM
  currentWeek: number; // 1-4
  currentCycle: number;
  weightLog: WeightEntry[];
  workoutHistory: WorkoutRecord[];
  habitLog: HabitEntry[];
  fslEnabled?: boolean;
}

export interface WorkoutRecord {
  date: string; // ISO
  week: number;
  cycle: number;
  day: 'monday' | 'tuesday' | 'thursday' | 'friday';
  lift: Lift;
  sets: SetResult[];
  amrapReps?: number;
  amrapWeight?: number;
  completed: boolean;
}

export interface SetResult {
  setIndex: number;
  weight: number;
  targetReps: number;
  completedReps?: number;
  done: boolean;
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
  supplementary: string[];
}
