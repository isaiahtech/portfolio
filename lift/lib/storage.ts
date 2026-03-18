import type { Profile } from './types';

const PROFILES_KEY = 'lift_profiles';
const ACTIVE_PROFILE_KEY = 'lift_active_profile';

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Profile[];
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

export function createDefaultProfile(name: string, orm: Record<string, number>): Profile {
  const { calcTrainingMax } = require('./wendler');
  return {
    id: crypto.randomUUID(),
    name,
    oneRepMaxes: {
      squat: orm.squat,
      bench: orm.bench,
      deadlift: orm.deadlift,
      press: orm.press,
    },
    trainingMaxes: {
      squat: calcTrainingMax(orm.squat),
      bench: calcTrainingMax(orm.bench),
      deadlift: calcTrainingMax(orm.deadlift),
      press: calcTrainingMax(orm.press),
    },
    currentWeek: 1,
    currentCycle: 1,
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
