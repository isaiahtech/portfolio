'use client';

import { useState, useMemo } from 'react';
import type { Profile, WorkoutRecord, SetResult } from '@/lib/types';
import {
  SCHEDULE,
  getWeekSets,
  getWarmupSets,
  getLiftLabel,
  roundToNearest,
  calcE1RM,
  DAY_ACCESSORY_SLOTS,
  getAccessoryById,
  getAccessoriesByCategory,
  resolveAccessoryId,
} from '@/lib/wendler';
import type { AccessoryCategory } from '@/lib/types';
import { todayISO } from '@/lib/storage';
import SetRow from './SetRow';

interface WorkoutDayProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onSetDone: () => void;
}

export default function WorkoutDay({ profile, onUpdate, onSetDone }: WorkoutDayProps) {
  const dayIndex = profile.currentDayIndex ?? 0;
  const displayConfig = SCHEDULE[dayIndex % SCHEDULE.length];
  const lift = displayConfig.lift;
  const tm = profile.trainingMaxes[lift];

  const warmupSets = useMemo(() => getWarmupSets(tm), [tm]);
  const mainSets = useMemo(() => getWeekSets(profile.currentWeek), [profile.currentWeek]);
  const fslWeight = useMemo(() => roundToNearest(tm * (mainSets[0]?.percent ?? 0.65)), [tm, mainSets]);

  const today = todayISO();
  const existingRecord = profile.workoutHistory.find(
    (r) => r.date === today && r.day === displayConfig.day,
  );

  const buildSets = (): SetResult[] => {
    if (existingRecord) return existingRecord.sets;
    return mainSets.map((s, i) => ({
      setIndex: i,
      weight: roundToNearest(tm * s.percent),
      targetReps: s.reps,
      done: false,
    }));
  };

  const [sets, setSets] = useState<SetResult[]>(buildSets);
  const [warmupDone, setWarmupDone] = useState<boolean[]>(
    existingRecord ? warmupSets.map(() => true) : warmupSets.map(() => false),
  );
  const accessorySlots = DAY_ACCESSORY_SLOTS[displayConfig.day] ?? [];
  const [accessoryDone, setAccessoryDone] = useState<boolean[][]>(
    () => accessorySlots.map((slot) => {
      const ex = getAccessoryById(resolveAccessoryId(displayConfig.day, accessorySlots.indexOf(slot), profile.accessorySelections));
      return Array(ex?.sets ?? 5).fill(false);
    }),
  );
  const [fslDone, setFslDone] = useState<boolean[]>([false, false, false, false, false]);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [bodyweightInput, setBodyweightInput] = useState('');
  const [bwLogged, setBwLogged] = useState(() => profile.weightLog.some((w) => w.date === todayISO()));

  const allMainDone = sets.every((s) => s.done);
  const amrapSet = mainSets[mainSets.length - 1];

  const handleToggleSet = (index: number, completedReps?: number) => {
    const updated = sets.map((s) =>
      s.setIndex === index ? { ...s, done: completedReps !== undefined, completedReps } : s,
    );
    setSets(updated);
    if (completedReps !== undefined) onSetDone();
    persistRecord({ sets: updated });
  };

  const persistRecord = (overrides?: Partial<WorkoutRecord>) => {
    const record: WorkoutRecord = {
      date: today,
      week: profile.currentWeek,
      cycle: profile.currentCycle,
      day: displayConfig.day,
      lift,
      sets: overrides?.sets ?? sets,
      completed: overrides?.completed ?? allMainDone,
      ...(overrides ?? {}),
    };
    const lastSet = record.sets[record.sets.length - 1];
    if (lastSet.done && lastSet.completedReps) {
      record.amrapReps = lastSet.completedReps;
      record.amrapWeight = lastSet.weight;
    }
    const history = profile.workoutHistory.filter(
      (r) => !(r.date === today && r.day === displayConfig.day),
    );
    history.push(record);
    onUpdate({ ...profile, workoutHistory: history });
  };

  const handleCompleteWorkout = () => {
    const allDone = sets.every((s) => s.done);

    // Build the completed record
    const record: WorkoutRecord = {
      date: today,
      week: profile.currentWeek,
      cycle: profile.currentCycle,
      day: displayConfig.day,
      lift,
      sets,
      amrapReps: sets[sets.length - 1]?.completedReps,
      amrapWeight: sets[sets.length - 1]?.weight,
      completed: allDone,
    };
    const history = profile.workoutHistory.filter(
      (r) => !(r.date === today && r.day === displayConfig.day),
    );
    history.push(record);

    // Advance to next day in sequence
    const nextDayIndex = dayIndex + 1;
    const isEndOfWeek = nextDayIndex >= SCHEDULE.length;
    const nextWeek = isEndOfWeek ? profile.currentWeek + 1 : profile.currentWeek;
    const isEndOfCycle = nextWeek > 4;

    onUpdate({
      ...profile,
      workoutHistory: history,
      currentDayIndex: isEndOfWeek ? 0 : nextDayIndex,
      currentWeek: isEndOfCycle ? 1 : nextWeek,
      currentCycle: isEndOfCycle ? profile.currentCycle + 1 : profile.currentCycle,
    });
  };

  const handleLogBodyweight = () => {
    const w = parseFloat(bodyweightInput);
    if (!w || w <= 0) return;
    const log = profile.weightLog.filter((e) => e.date !== today);
    log.push({ date: today, weight: w });
    onUpdate({ ...profile, weightLog: log });
    setBwLogged(true);
    setBodyweightInput('');
  };

  const weekLabel = profile.currentWeek === 4 ? 'Deload' : `Week ${profile.currentWeek}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Day header */}
      <div className="card" style={{ paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
              {displayConfig.label} — {displayConfig.category}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {getLiftLabel(lift).toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#ccc' }}>
              {weekLabel}
            </span>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#888' }}>
              Cycle {profile.currentCycle}
            </span>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#e8ff47' }}>
              TM: {tm} lbs
            </span>
          </div>
        </div>
      </div>

      {/* Warm-up accordion */}
      <div className="card" style={{ padding: '0' }}>
        <button
          onClick={() => setWarmupOpen((v) => !v)}
          style={{
            width: '100%', background: 'transparent', border: 'none', color: '#888',
            padding: '0.9rem 1.25rem', textAlign: 'left', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}
        >
          <span>Warm-Up Sets</span>
          <span style={{ fontSize: '0.7rem', color: warmupDone.every(Boolean) ? '#e8ff47' : '#555' }}>
            {warmupDone.filter(Boolean).length}/{warmupSets.length} {warmupOpen ? '▲' : '▼'}
          </span>
        </button>
        {warmupOpen && (
          <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {warmupSets.map((ws, i) => (
              <div
                key={i}
                className={`set-row${warmupDone[i] ? ' done' : ''}`}
                onClick={() => setWarmupDone((prev) => prev.map((v, j) => j === i ? !v : v))}
                style={{ opacity: 0.75 }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${warmupDone[i] ? '#e8ff47' : '#444'}`,
                  background: warmupDone[i] ? '#e8ff47' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {warmupDone[i] && <span style={{ color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: warmupDone[i] ? '#e8ff47' : '#ccc' }}>
                  {ws.weight} lbs × {ws.reps}
                </span>
                <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto' }}>warm-up</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main sets */}
      <div className="card">
        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
          Main Sets
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sets.map((set, i) => (
            <SetRow
              key={i}
              set={set}
              isAmrap={mainSets[i]?.isAmrap ?? false}
              label={`Set ${i + 1}`}
              onToggle={(completedReps) => handleToggleSet(i, completedReps)}
            />
          ))}
        </div>
        {(() => {
          const lastSet = sets[sets.length - 1];
          if (lastSet?.done && lastSet?.completedReps && lastSet.completedReps > 1) {
            const e1rm = calcE1RM(lastSet.weight, lastSet.completedReps);
            return (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(232,255,71,0.07)', borderRadius: '6px', borderLeft: '3px solid #e8ff47' }}>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>Estimated 1RM: </span>
                <span style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700 }}>{e1rm} lbs</span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* FSL */}
      {profile.fslEnabled && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              FSL — First Set Last
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e8ff47' }}>
              {fslWeight} lbs × 5 · 5 sets
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fslDone.map((done, i) => (
              <div
                key={i}
                className={`set-row${done ? ' done' : ''}`}
                onClick={() => {
                  setFslDone((prev) => prev.map((v, j) => j === i ? !v : v));
                  if (!done) onSetDone();
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${done ? '#e8ff47' : '#444'}`,
                  background: done ? '#e8ff47' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && <span style={{ color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: done ? '#e8ff47' : '#ccc' }}>
                  {fslWeight} lbs × 5
                </span>
                <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto' }}>FSL {i + 1}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessory Work */}
      {accessorySlots.length > 0 && (
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
            Accessory Work
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {accessorySlots.map((slot, slotIdx) => {
              const selectedId = resolveAccessoryId(displayConfig.day, slotIdx, profile.accessorySelections);
              const exercise = getAccessoryById(selectedId);
              const options = getAccessoriesByCategory(slot.category);
              const done = accessoryDone[slotIdx] ?? [];
              const allDone = done.every(Boolean);
              const catColors: Record<AccessoryCategory, string> = {
                push: '#f97316', pull: '#60a5fa', biceps: '#a78bfa', core: '#e8ff47', legs: '#4ade80',
              };
              const color = catColors[slot.category];

              const handleSelectChange = (newId: string) => {
                const newSelections = {
                  ...profile.accessorySelections,
                  [displayConfig.day]: {
                    ...(profile.accessorySelections?.[displayConfig.day] ?? {}),
                    [slotIdx]: newId,
                  },
                };
                const newEx = getAccessoryById(newId);
                setAccessoryDone((prev) => prev.map((row, i) => i === slotIdx ? Array(newEx?.sets ?? 5).fill(false) : row));
                onUpdate({ ...profile, accessorySelections: newSelections });
              };

              return (
                <div key={slotIdx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700,
                      color, background: `${color}18`, border: `1px solid ${color}40`,
                      borderRadius: '4px', padding: '0.15rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{slot.label}</span>
                    <select
                      value={selectedId}
                      onChange={(e) => handleSelectChange(e.target.value)}
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ccc', fontSize: '0.82rem', padding: '0.25rem 0.5rem', cursor: 'pointer', flex: 1 }}
                    >
                      {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: allDone ? color : '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {done.filter(Boolean).length}/{exercise?.sets ?? 5}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {done.map((setDone, setIdx) => (
                      <div
                        key={setIdx}
                        className={`set-row${setDone ? ' done' : ''}`}
                        onClick={() => {
                          setAccessoryDone((prev) => prev.map((row, i) =>
                            i === slotIdx ? row.map((v, j) => j === setIdx ? !v : v) : row,
                          ));
                          if (!setDone) onSetDone();
                        }}
                        style={{ opacity: 0.9 }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${setDone ? color : '#444'}`,
                          background: setDone ? color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {setDone && <span style={{ color: '#0a0a0a', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: setDone ? color : '#ccc' }}>
                          {exercise?.reps ?? '10'} reps
                        </span>
                        <span style={{ color: '#444', fontSize: '0.72rem', marginLeft: 'auto' }}>set {setIdx + 1}</span>
                      </div>
                    ))}
                  </div>
                  {exercise?.note && (
                    <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.3rem', fontStyle: 'italic' }}>{exercise.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick bodyweight log */}
      {!bwLogged && (
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
            Log Bodyweight
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="number"
              value={bodyweightInput}
              onChange={(e) => setBodyweightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogBodyweight()}
              placeholder="lbs"
              min="50"
              max="500"
              style={{ width: '90px' }}
            />
            <button className="btn-accent" onClick={handleLogBodyweight} style={{ padding: '0.5rem 1rem' }}>Log</button>
          </div>
        </div>
      )}

      {/* Complete workout */}
      <button
        className="btn-accent"
        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.1em' }}
        onClick={handleCompleteWorkout}
        disabled={!sets.some((s) => s.done)}
      >
        {allMainDone ? 'COMPLETE WORKOUT ✓' : 'SAVE & NEXT DAY'}
      </button>
    </div>
  );
}
