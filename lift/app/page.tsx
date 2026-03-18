'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Profile, TabId } from '@/lib/types';
import { loadProfiles, saveProfiles, loadActiveProfileId, saveActiveProfileId, getActiveProfile, updateProfile } from '@/lib/storage';
import Nav from '@/components/Nav';
import WorkoutDay from '@/components/WorkoutDay';
import HabitTracker from '@/components/HabitTracker';
import RestTimer from '@/components/RestTimer';
import WeightDashboard from '@/components/WeightDashboard';
import Charts from '@/components/Charts';
import ProfileManager from '@/components/ProfileManager';
import type { WorkoutRecord } from '@/lib/types';
import { calcE1RM, getLiftLabel } from '@/lib/wendler';

export default function HomePage() {
  const [tab, setTab] = useState<TabId>('today');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [restActive, setRestActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadProfiles();
    const id = loadActiveProfileId();
    setProfiles(p);
    setActiveId(id ?? (p[0]?.id ?? null));
    setHydrated(true);
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? getActiveProfile(profiles);

  const handleProfilesChange = useCallback((updated: Profile[]) => {
    setProfiles(updated);
    saveProfiles(updated);
  }, []);

  const handleActiveChange = useCallback((id: string) => {
    setActiveId(id);
    saveActiveProfileId(id);
  }, []);

  const handleProfileUpdate = useCallback((updated: Profile) => {
    const newProfiles = updateProfile(profiles, updated);
    setProfiles(newProfiles);
    saveProfiles(newProfiles);
  }, [profiles]);

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#e8ff47', fontFamily: 'monospace', fontSize: '1.5rem' }}>
        LIFT
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Nav
        tab={tab}
        onTabChange={setTab}
        profiles={profiles}
        activeProfileId={activeId}
        onActiveChange={handleActiveChange}
      />

      <div style={{ paddingTop: '4rem', maxWidth: '720px', margin: '0 auto', padding: '4rem 1rem 2rem' }}>

        {/* TODAY TAB */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeProfile ? (
              <>
                <HabitTracker profile={activeProfile} onUpdate={handleProfileUpdate} />
                <WorkoutDay
                  profile={activeProfile}
                  onUpdate={handleProfileUpdate}
                  onSetDone={() => setRestActive(true)}
                />
              </>
            ) : (
              <NoProfilePrompt onGoSettings={() => setTab('settings')} />
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.25rem', letterSpacing: '0.1em' }}>
              WORKOUT HISTORY
            </h2>
            {activeProfile ? (
              <HistoryTable records={activeProfile.workoutHistory} />
            ) : (
              <NoProfilePrompt onGoSettings={() => setTab('settings')} />
            )}
          </div>
        )}

        {/* WEIGHT TAB */}
        {tab === 'weight' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0', letterSpacing: '0.1em' }}>
              WEIGHT
            </h2>
            {activeProfile ? (
              <>
                <WeightDashboard profile={activeProfile} onUpdate={handleProfileUpdate} />
                <Charts profile={activeProfile} chartType="weight" />
              </>
            ) : (
              <NoProfilePrompt onGoSettings={() => setTab('settings')} />
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0', letterSpacing: '0.1em' }}>
              SETTINGS & PROFILES
            </h2>
            <ProfileManager
              profiles={profiles}
              activeProfileId={activeId}
              onProfilesChange={handleProfilesChange}
              onActiveChange={handleActiveChange}
            />
            {activeProfile && (
              <>
                <Charts profile={activeProfile} chartType="e1rm" />
                <ExportButton profiles={profiles} />
              </>
            )}
          </div>
        )}
      </div>

      {restActive && <RestTimer onDismiss={() => setRestActive(false)} />}
    </div>
  );
}

function NoProfilePrompt({ onGoSettings }: { onGoSettings: () => void }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ color: '#888', marginBottom: '1rem' }}>No profile found. Create one to get started.</div>
      <button className="btn-accent" onClick={onGoSettings}>Go to Settings</button>
    </div>
  );
}

function HistoryTable({ records }: { records: WorkoutRecord[] }) {
  if (!records.length) {
    return (
      <div className="card" style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
        No workouts logged yet. Complete your first session!
      </div>
    );
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sorted.map((rec, i) => {
        const amrapSet = rec.sets[rec.sets.length - 1];
        const e1rm = rec.amrapReps && rec.amrapWeight
          ? calcE1RM(rec.amrapWeight, rec.amrapReps)
          : amrapSet?.done && amrapSet?.completedReps
          ? calcE1RM(amrapSet.weight, amrapSet.completedReps)
          : null;

        return (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {getLiftLabel(rec.lift)}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {rec.date} — Week {rec.week}, Cycle {rec.cycle}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                {rec.sets.map((s) => `${s.weight}×${s.completedReps ?? s.targetReps}`).join(' / ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {rec.amrapReps !== undefined && (
                <div style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                  AMRAP: {rec.amrapReps} reps
                </div>
              )}
              {e1rm && (
                <div style={{ color: '#888', fontSize: '0.8rem' }}>
                  e1RM: {e1rm} lbs
                </div>
              )}
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {rec.completed
                  ? <span style={{ color: '#e8ff47' }}>✓ Done</span>
                  : <span style={{ color: '#ff4444' }}>Incomplete</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExportButton({ profiles }: { profiles: Profile[] }) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lift-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Data Export</div>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Download all your profile and workout data as JSON.
      </p>
      <button className="btn-ghost" onClick={handleExport}>
        Export JSON Backup
      </button>
    </div>
  );
}
