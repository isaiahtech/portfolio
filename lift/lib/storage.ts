import type { Profile, ProgramId } from './types';

const PROFILES_KEY = 'lift_profiles';
const ACTIVE_PROFILE_KEY = 'lift_active_profile';

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Migrate a profile from storage that may be missing newer fields */
function migrateProfile(p: unknown): Profile {
  const raw = p as Profile;
  return {
    ...raw,
    programId: raw.programId ?? 'wendler531',
    currentDayInWeek: raw.currentDayInWeek ?? 0,
  };
}

export function loadProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    return parsed.map(migrateProfile);
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function loadActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function saveActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function getActiveProfile(profiles: Profile[]): Profile | null {
  const id = loadActiveProfileId();
  if (!id) return profiles[0] ?? null;
  return profiles.find((p) => p.id === id) ?? profiles[0] ?? null;
}

export function updateProfile(profiles: Profile[], updated: Profile): Profile[] {
  return profiles.map((p) => (p.id === updated.id ? updated : p));
}

export function createDefaultProfile(
  name: string,
  orm: Record<string, number>,
  programId: ProgramId = 'wendler531',
): Profile {
  const { calcTrainingMax } = require('./wendler');
  // For Candito, TM = 1RM (no 90% reduction — percentages are of true 1RM)
  const tmFn = programId === 'candito6week'
    ? (v: number) => v
    : calcTrainingMax;

  return {
    id: crypto.randomUUID(),
    name,
    programId,
    oneRepMaxes: {
      squat: orm.squat ?? 0,
      bench: orm.bench ?? 0,
      deadlift: orm.deadlift ?? 0,
      press: orm.press ?? 0,
    },
    trainingMaxes: {
      squat: tmFn(orm.squat ?? 0),
      bench: tmFn(orm.bench ?? 0),
      deadlift: tmFn(orm.deadlift ?? 0),
      press: tmFn(orm.press ?? 0),
    },
    currentWeek: 1,
    currentCycle: 1,
    currentDayInWeek: 0,
    weightLog: [],
    workoutHistory: [],
    habitLog: [],
  };
}

export function exportProfilesJSON(profiles: Profile[]): void {
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lift-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
