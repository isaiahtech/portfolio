'use client';

import { useState } from 'react';
import type { Profile, Lift } from '@/lib/types';
import { calcTrainingMax, getNextCycleTM, getLiftLabel } from '@/lib/wendler';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onProfilesChange: (profiles: Profile[]) => void;
  onActiveChange: (id: string) => void;
}

const LIFTS: Lift[] = ['squat', 'bench', 'deadlift', 'press'];

export default function ProfileManager({ profiles, activeProfileId, onProfilesChange, onActiveChange }: ProfileManagerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newORMs, setNewORMs] = useState<Record<Lift, string>>({
    squat: '', bench: '', deadlift: '', press: '',
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const orms = {
      squat: parseFloat(newORMs.squat) || 0,
      bench: parseFloat(newORMs.bench) || 0,
      deadlift: parseFloat(newORMs.deadlift) || 0,
      press: parseFloat(newORMs.press) || 0,
    };
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      oneRepMaxes: orms,
      trainingMaxes: {
        squat: calcTrainingMax(orms.squat),
        bench: calcTrainingMax(orms.bench),
        deadlift: calcTrainingMax(orms.deadlift),
        press: calcTrainingMax(orms.press),
      },
      currentWeek: 1,
      currentCycle: 1,
      currentDayIndex: 0,
      weightLog: [],
      workoutHistory: [],
      habitLog: [],
    };
    onProfilesChange([...profiles, profile]);
    onActiveChange(profile.id);
    setCreating(false);
    setNewName('');
    setNewORMs({ squat: '', bench: '', deadlift: '', press: '' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    const updated = profiles.filter((p) => p.id !== id);
    onProfilesChange(updated);
    if (activeProfileId === id && updated.length > 0) onActiveChange(updated[0].id);
  };

  const handleNextCycle = (profile: Profile) => {
    if (!confirm(`Start next cycle for ${profile.name}? Training maxes will increase.`)) return;
    const newTMs: Record<Lift, number> = {
      squat: getNextCycleTM(profile.trainingMaxes.squat, 'squat'),
      bench: getNextCycleTM(profile.trainingMaxes.bench, 'bench'),
      deadlift: getNextCycleTM(profile.trainingMaxes.deadlift, 'deadlift'),
      press: getNextCycleTM(profile.trainingMaxes.press, 'press'),
    };
    onProfilesChange(profiles.map((p) =>
      p.id === profile.id ? { ...p, trainingMaxes: newTMs, currentWeek: 1, currentDayIndex: 0, currentCycle: p.currentCycle + 1 } : p,
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {profiles.map((profile) => (
        <div key={profile.id} className="card" style={{ borderColor: profile.id === activeProfileId ? '#e8ff47' : '#222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.name}
                {profile.id === activeProfileId && (
                  <span style={{ fontSize: '0.7rem', background: '#e8ff47', color: '#0a0a0a', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>
                )}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Week {profile.currentWeek} · Day {(profile.currentDayIndex ?? 0) + 1}/4 · Cycle {profile.currentCycle}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {profile.id !== activeProfileId && (
                <button className="btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onActiveChange(profile.id)}>
                  Set Active
                </button>
              )}
              <button className="btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleNextCycle(profile)}>
                Next Cycle
              </button>
              <button className="btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDelete(profile.id)}>
                Delete
              </button>
            </div>
          </div>

          {/* Lift stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            {LIFTS.map((lift) => (
              <div key={lift} style={{ background: '#1a1a1a', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  {lift === 'press' ? 'OHP' : lift === 'bench' ? 'Bench' : lift === 'squat' ? 'Squat' : 'DL'}
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#e8ff47', fontSize: '1rem' }}>
                  {profile.oneRepMaxes[lift]}
                </div>
                <div style={{ color: '#555', fontSize: '0.7rem' }}>TM: {profile.trainingMaxes[lift]}</div>
              </div>
            ))}
          </div>

          {/* FSL toggle */}
          <div
            onClick={() => onProfilesChange(profiles.map((p) => p.id === profile.id ? { ...p, fslEnabled: !p.fslEnabled } : p))}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '0.85rem', padding: '0.6rem 0.75rem', background: '#1a1a1a',
              borderRadius: '8px', cursor: 'pointer',
              border: profile.fslEnabled ? '1px solid rgba(232,255,71,0.25)' : '1px solid transparent',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: profile.fslEnabled ? '#e8ff47' : '#ccc' }}>First Set Last (FSL)</div>
              <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.1rem' }}>Appends 5×5 at the first working set weight</div>
            </div>
            <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: profile.fslEnabled ? '#e8ff47' : '#333', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: '3px', left: profile.fslEnabled ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: profile.fslEnabled ? '#0a0a0a' : '#666', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>
      ))}

      {creating ? (
        <div className="card" style={{ borderColor: '#333' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>New Profile</div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Isaiah" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {LIFTS.map((lift) => (
              <div key={lift}>
                <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>
                  {getLiftLabel(lift)} 1RM (lbs)
                </label>
                <input
                  type="number"
                  value={newORMs[lift]}
                  onChange={(e) => setNewORMs((prev) => ({ ...prev, [lift]: e.target.value }))}
                  placeholder="0"
                  min="0"
                  style={{ width: '100%' }}
                />
                {newORMs[lift] && parseFloat(newORMs[lift]) > 0 && (
                  <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    TM: {calcTrainingMax(parseFloat(newORMs[lift]))} lbs
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-accent" onClick={handleCreate}>Create Profile</button>
            <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-ghost" style={{ width: '100%', padding: '0.75rem' }} onClick={() => setCreating(true)}>
          + New Profile
        </button>
      )}
    </div>
  );
}
