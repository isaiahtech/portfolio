'use client';

import { useState, useMemo } from 'react';
import type { Profile, WorkoutRecord, SetResult } from '@/lib/types';
import {
  GZCL_SCHEDULE, GZCL_REST, GZCL_T3_SLOTS,
  getT1Sets, getT2Sets, getT3Config,
  getGZCLTodayConfig, getNextGZCLDay, getLiftLabelGZCL,
} from '@/lib/gzcl';
import { getAccessoryById, getAccessoriesByCategory, resolveAccessoryId } from '@/lib/wendler';
import { todayISO } from '@/lib/storage';

const S = {
  card: { background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '1.25rem' } as React.CSSProperties,
  sectionLabel: { fontSize: '0.72rem', color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.6rem' },
  tierBadge: (tier: 'T1' | 'T2' | 'T3'): React.CSSProperties => ({
    fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700,
    color: tier === 'T1' ? '#e8ff47' : tier === 'T2' ? '#60a5fa' : '#a78bfa',
    background: tier === 'T1' ? 'rgba(232,255,71,0.1)' : tier === 'T2' ? 'rgba(96,165,250,0.1)' : 'rgba(167,139,250,0.1)',
    border: `1px solid ${tier === 'T1' ? 'rgba(232,255,71,0.3)' : tier === 'T2' ? 'rgba(96,165,250,0.3)' : 'rgba(167,139,250,0.3)'}`,
    borderRadius: '4px', padding: '0.15rem 0.45rem',
  }),
  restBadge: { fontSize: '0.68rem', color: '#555', fontFamily: 'monospace' } as React.CSSProperties,
  setRow: (done: boolean, color = '#e8ff47'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.65rem 0.75rem', borderRadius: '8px',
    border: `1px solid ${done ? color : '#222'}`,
    background: done ? `${color}12` : 'transparent',
    cursor: 'pointer', transition: 'all 0.15s',
  }),
  dot: (done: boolean, color = '#e8ff47'): React.CSSProperties => ({
    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${done ? color : '#444'}`,
    background: done ? color : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
};

interface Props {
  profile: Profile;
  onUpdate: (p: Profile) => void;
  onSetDone: () => void;
}

export default function GZCLWorkout({ profile, onUpdate, onSetDone }: Props) {
  const todayCfg = getGZCLTodayConfig();
  const dayCfg = todayCfg ?? getNextGZCLDay();
  const isToday = !!todayCfg;

  const t1TM = profile.trainingMaxes[dayCfg.t1Lift];
  const t2TM = profile.trainingMaxes[dayCfg.t2Lift];
  const t3Config = getT3Config(profile.currentWeek);
  const t3Slots = GZCL_T3_SLOTS[dayCfg.day] ?? [];

  const t1Sets = useMemo(() => getT1Sets(t1TM), [t1TM]);
  const t2Sets = useMemo(() => getT2Sets(t2TM), [t2TM]);

  const today = todayISO();
  const existingRecord = profile.workoutHistory.find(
    (r) => r.date === today && r.day === dayCfg.day && r.programId === 'gzcl',
  );

  const [t1Done, setT1Done] = useState<boolean[]>(() =>
    existingRecord ? t1Sets.map(() => true) : t1Sets.map(() => false),
  );
  const [t2Done, setT2Done] = useState<boolean[]>(() =>
    existingRecord ? t2Sets.map(() => true) : t2Sets.map(() => false),
  );
  const [t1Amrap, setT1Amrap] = useState<string>('');
  const [t2Amrap, setT2Amrap] = useState<string>('');

  // T3: totalSets rows per slot (adjusted by runningDown)
  const effectiveT3Sets = (base: number) =>
    profile.runningDown ? Math.max(1, base - 1) : base;

  const [t3Done, setT3Done] = useState<boolean[][]>(() =>
    t3Slots.map(() => Array(effectiveT3Sets(t3Config.totalSets)).fill(false)),
  );

  const rirNote = profile.runningDown ? 'Leave 2–3 RIR' : 'Leave 1–2 RIR';

  const persistAndComplete = (completed: boolean) => {
    const record: WorkoutRecord = {
      date: today,
      week: profile.currentWeek,
      cycle: profile.currentCycle,
      day: dayCfg.day,
      lift: dayCfg.t1Lift,
      sets: t1Sets.map((s, i): SetResult => ({
        setIndex: i, weight: s.weight, targetReps: s.reps,
        completedReps: i === t1Sets.length - 1 ? parseInt(t1Amrap) || s.reps : s.reps,
        done: t1Done[i] ?? false,
      })),
      amrapReps: parseInt(t1Amrap) || undefined,
      amrapWeight: t1Sets[t1Sets.length - 1]?.weight,
      completed,
      programId: 'gzcl',
    };

    const history = profile.workoutHistory.filter(
      (r) => !(r.date === today && r.day === dayCfg.day && r.programId === 'gzcl'),
    );
    history.push(record);

    // Advance week after Friday (same logic as 531)
    let nextWeek = profile.currentWeek;
    let nextCycle = profile.currentCycle;
    if (dayCfg.day === 'friday' && completed) {
      nextWeek = profile.currentWeek >= 9 ? 1 : profile.currentWeek + 1;
      if (nextWeek === 1) nextCycle = profile.currentCycle + 1;
    }

    onUpdate({ ...profile, workoutHistory: history, currentWeek: nextWeek, currentCycle: nextCycle });
  };

  const handleToggleRunningDown = () => {
    onUpdate({ ...profile, runningDown: !profile.runningDown });
    // Reset T3 done state to reflect new set count
    setT3Done(t3Slots.map(() =>
      Array(effectiveT3Sets(t3Config.totalSets)).fill(false),
    ));
  };

  const allT1Done = t1Done.every(Boolean);
  const allT2Done = t2Done.every(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
              {!isToday && <span style={{ color: '#e8ff47', marginRight: '0.5rem' }}>NEXT:</span>}
              {dayCfg.label} — GZCL
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {getLiftLabelGZCL(dayCfg.t1Lift).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.15rem' }}>
              T2: {getLiftLabelGZCL(dayCfg.t2Lift)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
              Week {profile.currentWeek} · Cycle {profile.currentCycle}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>
              {t3Config.weekLabel} · T3 {t3Config.repRange} reps
            </div>
            {/* Feeling Run Down toggle */}
            <div
              onClick={handleToggleRunningDown}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                padding: '0.3rem 0.6rem', borderRadius: '6px',
                background: profile.runningDown ? 'rgba(255,100,100,0.1)' : '#1a1a1a',
                border: profile.runningDown ? '1px solid rgba(255,100,100,0.4)' : '1px solid #333',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: profile.runningDown ? '#ff8888' : '#666', fontWeight: 600 }}>
                {profile.runningDown ? '🟠 Run Down' : 'Run Down?'}
              </span>
              <div style={{
                width: '28px', height: '16px', borderRadius: '8px',
                background: profile.runningDown ? '#ff4444' : '#333', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: '2px',
                  left: profile.runningDown ? '14px' : '2px',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.15s',
                }} />
              </div>
            </div>
          </div>
        </div>
        {profile.runningDown && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,100,100,0.07)', borderRadius: '6px', fontSize: '0.75rem', color: '#ff9999' }}>
            Run Down mode: leave 2–3 RIR on all T1/T2 AMRAPs · one T3 set removed per movement
          </div>
        )}
      </div>

      {/* T1 */}
      <TierCard
        tier="T1"
        liftLabel={getLiftLabelGZCL(dayCfg.t1Lift)}
        tm={t1TM}
        sets={t1Sets}
        done={t1Done}
        amrapValue={t1Amrap}
        rirNote={rirNote}
        onToggle={(i) => {
          setT1Done((prev) => prev.map((v, j) => j === i ? !v : v));
          if (!t1Done[i]) onSetDone();
        }}
        onAmrapChange={setT1Amrap}
      />

      {/* T2 */}
      <TierCard
        tier="T2"
        liftLabel={getLiftLabelGZCL(dayCfg.t2Lift)}
        tm={t2TM}
        sets={t2Sets}
        done={t2Done}
        amrapValue={t2Amrap}
        rirNote={rirNote}
        onToggle={(i) => {
          setT2Done((prev) => prev.map((v, j) => j === i ? !v : v));
          if (!t2Done[i]) onSetDone();
        }}
        onAmrapChange={setT2Amrap}
      />

      {/* T3 */}
      {t3Slots.length > 0 && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={S.tierBadge('T3')}>T3</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ccc' }}>Accessories</span>
            </div>
            <span style={S.restBadge}>{GZCL_REST.T3}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {t3Slots.map((slot, slotIdx) => {
              const selectedId = profile.gzclT3Selections?.[dayCfg.day]?.[slotIdx]
                ?? slot.defaultId;
              const exercise = getAccessoryById(selectedId);
              const options = getAccessoriesByCategory(slot.category);
              const setsForSlot = t3Done[slotIdx] ?? [];
              const totalForSlot = effectiveT3Sets(t3Config.totalSets);

              const handleSelectChange = (newId: string) => {
                const newSel = {
                  ...profile.gzclT3Selections,
                  [dayCfg.day]: { ...(profile.gzclT3Selections?.[dayCfg.day] ?? {}), [slotIdx]: newId },
                };
                setT3Done((prev) => prev.map((row, i) => i === slotIdx ? Array(totalForSlot).fill(false) : row));
                onUpdate({ ...profile, gzclT3Selections: newSel });
              };

              const catColor = ({ push: '#f97316', pull: '#60a5fa', biceps: '#a78bfa', core: '#e8ff47', legs: '#4ade80' } as Record<string, string>)[slot.category];

              return (
                <div key={slotIdx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, color: catColor,
                      background: `${catColor}18`, border: `1px solid ${catColor}40`,
                      borderRadius: '4px', padding: '0.1rem 0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{slot.label}</span>
                    <select
                      value={selectedId}
                      onChange={(e) => handleSelectChange(e.target.value)}
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ccc', fontSize: '0.82rem', padding: '0.25rem 0.5rem', flex: 1, cursor: 'pointer' }}
                    >
                      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <span style={{ fontSize: '0.7rem', color: setsForSlot.every(Boolean) ? catColor : '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {setsForSlot.filter(Boolean).length}/{totalForSlot}
                    </span>
                  </div>
                  {/* Top set label */}
                  <div style={{ fontSize: '0.68rem', color: '#555', marginBottom: '0.35rem', fontFamily: 'monospace' }}>
                    Set 1 = top set ({t3Config.repRange} reps){t3Config.backdownSets > 0 ? ` · Sets 2+ = backdown` : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {Array.from({ length: totalForSlot }, (_, setIdx) => {
                      const done = setsForSlot[setIdx] ?? false;
                      const isTopSet = setIdx === 0;
                      return (
                        <div
                          key={setIdx}
                          style={S.setRow(done, catColor)}
                          onClick={() => {
                            setT3Done((prev) => prev.map((row, ri) =>
                              ri === slotIdx ? row.map((v, ci) => ci === setIdx ? !v : v) : row,
                            ));
                            if (!done) onSetDone();
                          }}
                        >
                          <div style={S.dot(done, catColor)}>
                            {done && <span style={{ color: '#0a0a0a', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: done ? catColor : '#ccc' }}>
                            {isTopSet ? `${t3Config.repRange} reps` : `${exercise?.reps ?? '10'} reps`}
                          </span>
                          <span style={{ color: '#444', fontSize: '0.72rem', marginLeft: 'auto' }}>
                            {isTopSet ? 'top set' : `backdown ${setIdx}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete */}
      {isToday && (
        <button
          className="btn-accent"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.1em' }}
          disabled={!allT1Done}
          onClick={() => persistAndComplete(allT1Done && allT2Done)}
        >
          {allT1Done && allT2Done ? 'COMPLETE SESSION ✓' : 'SAVE PROGRESS'}
        </button>
      )}
    </div>
  );
}

// ─── TierCard sub-component ───────────────────────────────────────────────────

interface TierCardProps {
  tier: 'T1' | 'T2';
  liftLabel: string;
  tm: number;
  sets: Array<{ weight: number; reps: number; isAmrap: boolean }>;
  done: boolean[];
  amrapValue: string;
  rirNote: string;
  onToggle: (i: number) => void;
  onAmrapChange: (v: string) => void;
}

function TierCard({ tier, liftLabel, tm, sets, done, amrapValue, rirNote, onToggle, onAmrapChange }: TierCardProps) {
  const color = tier === 'T1' ? '#e8ff47' : '#60a5fa';
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color,
            background: `${color}12`, border: `1px solid ${color}30`, borderRadius: '4px', padding: '0.15rem 0.45rem',
          }}>{tier}</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{liftLabel}</span>
        </div>
        <span style={{ fontSize: '0.68rem', color: '#555', fontFamily: 'monospace' }}>
          {GZCL_REST[tier]} · TM {tm} lbs
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {sets.map((s, i) => {
          const isDone = done[i] ?? false;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.75rem', borderRadius: '8px',
                  border: `1px solid ${isDone ? color : '#222'}`,
                  background: isDone ? `${color}10` : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => !s.isAmrap && onToggle(i)}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isDone ? color : '#444'}`,
                  background: isDone ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone && <span style={{ color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: isDone ? color : '#fff' }}>
                  {s.weight} lbs × {s.reps}{s.isAmrap ? '+' : ''}
                </span>
                {s.isAmrap && (
                  <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: 'auto' }}>{rirNote}</span>
                )}
              </div>
              {/* AMRAP input */}
              {s.isAmrap && (
                <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                  <input
                    type="number"
                    value={amrapValue}
                    onChange={(e) => onAmrapChange(e.target.value)}
                    placeholder="reps done"
                    min="0"
                    style={{ width: '110px', fontSize: '0.9rem' }}
                  />
                  {amrapValue && parseInt(amrapValue) > 0 && (
                    <button
                      style={{
                        background: color, color: '#0a0a0a', fontWeight: 700, padding: '0.4rem 0.75rem',
                        borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                      }}
                      onClick={() => { onToggle(i); }}
                    >
                      Log
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
