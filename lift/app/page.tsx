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
import { calcE1RM, getLiftLabel, SCHEDULE, getWeekSets, getWarmupSets, DAY_ACCESSORY_SLOTS, getAccessoryById, resolveAccessoryId } from '@/lib/wendler';

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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', overflowX: 'hidden' }}>
      <Nav tab={tab} onTabChange={setTab} />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 1rem 2rem', width: '100%', boxSizing: 'border-box' }}>

        {/* TODAY */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeProfile ? (
              <>
                <HabitTracker profile={activeProfile} onUpdate={handleProfileUpdate} />
                <WorkoutDay profile={activeProfile} onUpdate={handleProfileUpdate} onSetDone={() => setRestActive(true)} />
              </>
            ) : (
              <NoProfilePrompt onGoSettings={() => setTab('settings')} />
            )}
          </div>
        )}

        {/* PROGRAM */}
        {tab === 'program' && <ProgramView profile={activeProfile ?? undefined} />}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.25rem', letterSpacing: '0.1em' }}>
              WORKOUT HISTORY
            </h2>
            {activeProfile ? <HistoryTable records={activeProfile.workoutHistory} /> : <NoProfilePrompt onGoSettings={() => setTab('settings')} />}
          </div>
        )}

        {/* WEIGHT */}
        {tab === 'weight' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0', letterSpacing: '0.1em' }}>WEIGHT</h2>
            {activeProfile ? (
              <>
                <WeightDashboard profile={activeProfile} onUpdate={handleProfileUpdate} />
                <Charts profile={activeProfile} chartType="weight" />
              </>
            ) : <NoProfilePrompt onGoSettings={() => setTab('settings')} />}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0', letterSpacing: '0.1em' }}>SETTINGS & PROFILES</h2>
            <ProfileManager profiles={profiles} activeProfileId={activeId} onProfilesChange={handleProfilesChange} onActiveChange={handleActiveChange} />
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
          : amrapSet?.done && amrapSet?.completedReps ? calcE1RM(amrapSet.weight, amrapSet.completedReps) : null;
        return (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{getLiftLabel(rec.lift)}</div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.2rem' }}>{rec.date} — Week {rec.week}, Cycle {rec.cycle}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                {rec.sets.map((s) => `${s.weight}×${s.completedReps ?? s.targetReps}`).join(' / ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {rec.amrapReps !== undefined && (
                <div style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>AMRAP: {rec.amrapReps} reps</div>
              )}
              {e1rm && <div style={{ color: '#888', fontSize: '0.8rem' }}>e1RM: {e1rm} lbs</div>}
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {rec.completed ? <span style={{ color: '#e8ff47' }}>✓ Done</span> : <span style={{ color: '#ff4444' }}>Incomplete</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const WEEK_LABELS: Record<number, string> = {
  1: 'Week 1 — 3×5', 2: 'Week 2 — 3×3', 3: 'Week 3 — 5/3/1', 4: 'Week 4 — Deload',
};

function ProgramView({ profile }: { profile?: Profile }) {
  const [selectedWeek, setSelectedWeek] = useState<number>(profile?.currentWeek ?? 1);
  const weekSets = getWeekSets(selectedWeek);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>PROGRAM</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((w) => (
            <button key={w} onClick={() => setSelectedWeek(w)} style={{
              padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
              border: selectedWeek === w ? '1px solid #e8ff47' : '1px solid #333',
              background: selectedWeek === w ? 'rgba(232,255,71,0.1)' : 'transparent',
              color: selectedWeek === w ? '#e8ff47' : '#888',
              fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: selectedWeek === w ? 700 : 400,
            }}>
              WK {w}{profile?.currentWeek === w ? ' ●' : ''}
            </button>
          ))}
        </div>
        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
          {WEEK_LABELS[selectedWeek]}{selectedWeek === 4 ? ' — active recovery, light weights' : ''}
        </div>
      </div>

      {SCHEDULE.map((day) => {
        const tm = profile?.trainingMaxes[day.lift];
        const warmups = tm ? getWarmupSets(tm) : null;
        const currentDayIndex = profile?.currentDayIndex ?? 0;
        const isNextDay = profile?.currentWeek === selectedWeek && SCHEDULE[currentDayIndex]?.day === day.day;
        const isDone = !!profile?.workoutHistory.find(
          (r) => r.day === day.day && r.week === selectedWeek && r.cycle === profile.currentCycle && r.completed,
        );
        const accentColor = isDone ? '#60a5fa' : isNextDay ? '#e8ff47' : '#555';

        return (
          <div key={day.day} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderColor: isDone ? '#60a5fa40' : isNextDay ? '#e8ff47' : '#222', opacity: isDone ? 0.75 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: accentColor, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {day.label.toUpperCase()}
                  {isDone && <span style={{ fontSize: '0.65rem', background: '#60a5fa', color: '#0a0a0a', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>DONE</span>}
                  {!isDone && isNextDay && <span style={{ fontSize: '0.65rem', background: '#e8ff47', color: '#0a0a0a', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>NEXT</span>}
                </div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day.category}</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: isDone ? '#60a5fa' : '#fff', textAlign: 'right' }}>
                {getLiftLabel(day.lift)}
                {tm && <div style={{ color: '#555', fontSize: '0.7rem', fontWeight: 400, marginTop: '0.1rem' }}>TM: {tm} lbs</div>}
              </div>
            </div>

            <div>
              <div style={{ color: '#555', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>WARM-UP</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {warmups ? warmups.map((s, i) => (
                  <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.35rem 0.65rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                    {s.weight} × {s.reps}
                  </div>
                )) : <div style={{ color: '#444', fontSize: '0.8rem', fontFamily: 'monospace' }}>40% × 5 / 50% × 5 / 60% × 3</div>}
              </div>
            </div>

            <div>
              <div style={{ color: '#555', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>MAIN SETS</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {weekSets.map((s, i) => {
                  const weight = tm ? Math.round((tm * s.percent) / 5) * 5 : null;
                  return (
                    <div key={i} style={{
                      background: s.isAmrap ? 'rgba(232,255,71,0.07)' : '#1a1a1a',
                      border: s.isAmrap ? '1px solid rgba(232,255,71,0.3)' : '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '0.5rem 0.75rem', fontFamily: 'monospace',
                      fontSize: '0.85rem', color: s.isAmrap ? '#e8ff47' : '#ccc', minWidth: '80px', textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 700 }}>{weight ? `${weight} lbs` : `${Math.round(s.percent * 100)}%`}</div>
                      <div style={{ fontSize: '0.7rem', color: s.isAmrap ? '#b8cc30' : '#666', marginTop: '0.1rem' }}>{s.reps}{s.isAmrap ? '+' : ''} reps</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {profile?.fslEnabled && (() => {
              const fslPct = weekSets[0]?.percent ?? 0.65;
              const fslW = tm ? Math.round((tm * fslPct) / 5) * 5 : null;
              return (
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>FSL</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(232,255,71,0.07)', border: '1px solid rgba(232,255,71,0.2)', borderRadius: '6px', padding: '0.4rem 0.75rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8ff47' }}>
                    5 × 5 @ {fslW ? `${fslW} lbs` : `${Math.round(fslPct * 100)}%`}
                    <span style={{ color: '#666', fontSize: '0.7rem' }}>({Math.round(fslPct * 100)}% TM)</span>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const slots = DAY_ACCESSORY_SLOTS[day.day] ?? [];
              if (!slots.length) return null;
              const catColors: Record<string, string> = { push: '#f97316', pull: '#60a5fa', biceps: '#a78bfa', core: '#e8ff47', legs: '#4ade80' };
              return (
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>ACCESSORIES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {slots.map((slot, i) => {
                      const id = resolveAccessoryId(day.day, i, profile?.accessorySelections);
                      const ex = getAccessoryById(id);
                      const color = catColors[slot.category];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '4px', padding: '0.1rem 0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{slot.label}</span>
                          <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{ex?.name ?? slot.defaultId}</span>
                          <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{ex?.sets ?? 5}×{ex?.reps ?? '10'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

function ExportButton({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Data Export</div>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem' }}>Download all your profile and workout data as JSON.</p>
      <button className="btn-ghost" onClick={() => {
        const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lift-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }}>Export JSON Backup</button>
    </div>
  );
}
