'use client';

import { useState } from 'react';
import type { Profile, Lift, ProgramId } from '@/lib/types';
import { calcTrainingMax, getNextCycleTM, getLiftLabel } from '@/lib/wendler';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onProfilesChange: (profiles: Profile[]) => void;
  onActiveChange: (id: string) => void;
}

const LIFTS: Lift[] = ['squat', 'bench', 'deadlift', 'press'];

const PROGRAMS: Array<{ id: ProgramId; label: string; desc: string }> = [
  { id: 'wendler531',    label: '5/3/1',              desc: '4-week cycle, 4 days/week, TM = 90% 1RM' },
  { id: 'gzcl',         label: 'GZCL',               desc: '9-week T1/T2/T3 tiered training' },
  { id: 'candito6week', label: 'Candito 6-Week',      desc: '6-week strength block from true 1RM' },
];

const PROGRAM_COLORS: Record<ProgramId, string> = {
  wendler531:    '#e8ff47',
  gzcl:         '#60a5fa',
  candito6week: '#f97316',
};

function programLabel(id: ProgramId): string {
  return PROGRAMS.find((p) => p.id === id)?.label ?? id;
}

export default function ProfileManager({ profiles, activeProfileId, onProfilesChange, onActiveChange }: ProfileManagerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProgram, setNewProgram] = useState<ProgramId>('wendler531');
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
    // Candito uses true 1RM for calculations, no TM reduction
    const tmFn = newProgram === 'candito6week' ? (v: number) => v : calcTrainingMax;

    const profile: Profile = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      programId: newProgram,
      oneRepMaxes: orms,
      trainingMaxes: {
        squat: tmFn(orms.squat),
        bench: tmFn(orms.bench),
        deadlift: tmFn(orms.deadlift),
        press: tmFn(orms.press),
      },
      currentWeek: 1,
      currentCycle: 1,
      currentDayInWeek: 0,
      weightLog: [],
      workoutHistory: [],
      habitLog: [],
    };
    onProfilesChange([...profiles, profile]);
    onActiveChange(profile.id);
    setCreating(false);
    setNewName('');
    setNewORMs({ squat: '', bench: '', deadlift: '', press: '' });
    setNewProgram('wendler531');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    const updated = profiles.filter((p) => p.id !== id);
    onProfilesChange(updated);
    if (activeProfileId === id && updated.length > 0) onActiveChange(updated[0].id);
  };

  const handleNextCycle = (profile: Profile) => {
    if (!confirm(`Start next cycle for ${profile.name}? Training maxes will increase.`)) return;
    if (profile.programId === 'candito6week') {
      onProfilesChange(profiles.map((p) =>
        p.id === profile.id ? { ...p, currentWeek: 1, currentDayInWeek: 0, currentCycle: p.currentCycle + 1, canditoAdjustedMaxes: {} } : p,
      ));
      return;
    }
    const newTMs: Record<Lift, number> = {
      squat: getNextCycleTM(profile.trainingMaxes.squat, 'squat'),
      bench: getNextCycleTM(profile.trainingMaxes.bench, 'bench'),
      deadlift: getNextCycleTM(profile.trainingMaxes.deadlift, 'deadlift'),
      press: getNextCycleTM(profile.trainingMaxes.press, 'press'),
    };
    onProfilesChange(profiles.map((p) =>
      p.id === profile.id ? { ...p, trainingMaxes: newTMs, currentWeek: 1, currentCycle: p.currentCycle + 1 } : p,
    ));
  };

  // Lifts shown differ by program (Candito has no OHP)
  const liftsForProgram = (pid: ProgramId): Lift[] =>
    pid === 'candito6week' ? ['squat', 'bench', 'deadlift'] : LIFTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {profiles.map((profile) => {
        const pColor = PROGRAM_COLORS[profile.programId ?? 'wendler531'];
        const lifts = liftsForProgram(profile.programId ?? 'wendler531');
        return (
          <div
            key={profile.id}
            className="card"
            style={{ borderColor: profile.id === activeProfileId ? pColor : '#222' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {profile.name}
                  {profile.id === activeProfileId && (
                    <span style={{ fontSize: '0.7rem', background: pColor, color: '#0a0a0a', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: pColor, background: `${pColor}18`, border: `1px solid ${pColor}40`, padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                    {programLabel(profile.programId ?? 'wendler531')}
                  </span>
                </div>
                <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Week {profile.currentWeek}
                  {profile.programId === 'candito6week' && profile.currentDayInWeek !== undefined && (
                    <> · Day {(profile.currentDayInWeek) + 1}</>
                  )}
                  {' '}· Cycle {profile.currentCycle}
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
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lifts.length}, 1fr)`, gap: '0.5rem', marginTop: '1rem' }}>
              {lifts.map((lift) => (
                <div key={lift} style={{ background: '#1a1a1a', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                    {lift === 'press' ? 'OHP' : lift === 'bench' ? 'Bench' : lift === 'squat' ? 'Squat' : 'DL'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: pColor, fontSize: '1rem' }}>
                    {profile.canditoAdjustedMaxes?.[lift] ?? profile.oneRepMaxes[lift]}
                    {profile.canditoAdjustedMaxes?.[lift] && <span style={{ fontSize: '0.65rem', color: '#ff8888' }}>*</span>}
                  </div>
                  {profile.programId !== 'candito6week' && (
                    <div style={{ color: '#555', fontSize: '0.7rem' }}>TM: {profile.trainingMaxes[lift]}</div>
                  )}
                </div>
              ))}
            </div>

            {/* FSL toggle — 5/3/1 only */}
            {(!profile.programId || profile.programId === 'wendler531') && (
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
            )}
          </div>
        );
      })}

      {/* Create form */}
      {creating ? (
        <div className="card" style={{ borderColor: '#333' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>New Profile</div>

          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Isaiah" style={{ width: '100%' }} />
          </div>

          {/* Program selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.6rem' }}>Program</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PROGRAMS.map((prog) => (
                <div
                  key={prog.id}
                  onClick={() => setNewProgram(prog.id)}
                  style={{
                    padding: '0.75rem', borderRadius: '8px', cursor: 'pointer',
                    border: `1px solid ${newProgram === prog.id ? PROGRAM_COLORS[prog.id] : '#333'}`,
                    background: newProgram === prog.id ? `${PROGRAM_COLORS[prog.id]}0d` : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: 700, color: newProgram === prog.id ? PROGRAM_COLORS[prog.id] : '#ccc', fontSize: '0.9rem' }}>
                    {prog.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.15rem' }}>{prog.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 1RM inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {liftsForProgram(newProgram).map((lift) => (
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
                {newProgram !== 'candito6week' && newORMs[lift] && parseFloat(newORMs[lift]) > 0 && (
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
