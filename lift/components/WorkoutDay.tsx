'use client';

import { useState, useMemo } from 'react';
import type { Profile, WorkoutRecord, SetResult } from '@/lib/types';
import {
  SCHEDULE,
  getWeekSets,
  getWarmupSets,
  getLiftLabel,
  getTodayDayId,
  getNextWorkoutDay,
  roundToNearest,
  calcE1RM,
} from '@/lib/wendler';
import { todayISO } from '@/lib/storage';
import SetRow from './SetRow';

interface WorkoutDayProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onSetDone: () => void;
}

export default function WorkoutDay({ profile, onUpdate, onSetDone }: WorkoutDayProps) {
  const todayDayId = getTodayDayId();
  const dayConfig = todayDayId ? SCHEDULE.find((d) => d.day === todayDayId) : null;
  const displayConfig = dayConfig ?? getNextWorkoutDay();

  const isToday = !!dayConfig;
  const lift = displayConfig.lift;
  const tm = profile.trainingMaxes[lift];

  const warmupSets = useMemo(() => getWarmupSets(tm), [tm]);
  const mainSets = useMemo(() => getWeekSets(profile.currentWeek), [profile.currentWeek]);
  const fslWeight = useMemo(() => roundToNearest(tm * (mainSets[0]?.percent ?? 0.65)), [tm, mainSets]);

  const today = todayISO();
  const existingRecord = profile.workoutHistory.find(
    (r) => r.date === today && r.day === displayConfig.day
  );

  // Build initial set state from existing record or fresh
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
    existingRecord ? warmupSets.map(() => true) : warmupSets.map(() => false)
  );
  const [suppDone, setSuppDone] = useState<boolean[]>(
    displayConfig.supplementary.map(() => false)
  );
  const [fslDone, setFslDone] = useState<boolean[]>([false, false, false, false, false]);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [bodyweightInput, setBodyweightInput] = useState('');
  const [bwLogged, setBwLogged] = useState(() => {
    return profile.weightLog.some((w) => w.date === todayISO());
  });

  const allMainDone = sets.every((s) => s.done);
  const amrapSet = mainSets[mainSets.length - 1];

  const handleToggleSet = (index: number, completedReps?: number) => {
    setSets((prev) => {
      const updated = prev.map((s) =>
        s.setIndex === index
          ? { ...s, done: completedReps !== undefined, completedReps }
          : s
      );
      return updated;
    });
    if (completedReps !== undefined) {
      onSetDone();
    }
    // Persist immediately
    persistRecord({ sets: sets.map((s) =>
      s.setIndex === index ? { ...s, done: completedReps !== undefined, completedReps } : s
    )});
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
      (r) => !(r.date === today && r.day === displayConfig.day)
    );
    history.push(record);

    onUpdate({ ...profile, workoutHistory: history });
  };

  const handleCompleteWorkout = () => {
    const allDone = sets.every((s) => s.done);
    persistRecord({ completed: allDone });

    // Advance week
    let nextWeek = profile.currentWeek + 1;
    let nextCycle = profile.currentCycle;
    if (nextWeek > 4) {
      // After deload, bump cycle — user can manually advance TMs from Settings
      nextWeek = 1;
      nextCycle = profile.currentCycle + 1;
    }

    // Only advance if all 4 days done this week (simplified: advance week after each Friday)
    if (displayConfig.day === 'friday' && allDone) {
      onUpdate({
        ...profile,
        workoutHistory: [...profile.workoutHistory.filter(
          (r) => !(r.date === today && r.day === displayConfig.day)
        ), {
          date: today,
          week: profile.currentWeek,
          cycle: profile.currentCycle,
          day: displayConfig.day,
          lift,
          sets,
          amrapReps: sets[sets.length - 1]?.completedReps,
          amrapWeight: sets[sets.length - 1]?.weight,
          completed: true,
        }],
        currentWeek: nextWeek,
        currentCycle: nextCycle,
      });
    } else {
      persistRecord({ completed: true });
    }
  };

  const handleLogBodyweight = () => {
    const w = parseFloat(bodyweightInput);
    if (!w || w <= 0) return;
    const entry = { date: today, weight: w };
    const log = profile.weightLog.filter((e) => e.date !== today);
    log.push(entry);
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
              {!isToday && <span style={{ color: '#e8ff47', marginRight: '0.5rem' }}>NEXT:</span>}
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
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#888',
            padding: '0.9rem 1.25rem',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
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
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${warmupDone[i] ? '#e8ff47' : '#444'}`,
                  background: warmupDone[i] ? '#e8ff47' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
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

        {/* e1RM estimate after AMRAP */}
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

      {/* FSL — First Set Last */}
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
                  setFslDone((prev) => prev.map((v, j) => (j === i ? !v : v)));
                  if (!done) onSetDone();
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${done ? '#e8ff47' : '#444'}`,
                  background: done ? '#e8ff47' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done && <span style={{ color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: done ? '#e8ff47' : '#ccc' }}>
                  {fslWeight} lbs × 5
                </span>
                <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  FSL {i + 1}/5
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: '#444', fontFamily: 'monospace' }}>
            {Math.round((mainSets[0]?.percent ?? 0) * 100)}% of TM · same as first working set
          </div>
        </div>
      )}

      {/* Supplementary work */}
      <div className="card">
        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
          Supplementary Work
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {displayConfig.supplementary.map((item, i) => (
            <div
              key={i}
              onClick={() => setSuppDone((prev) => prev.map((v, j) => j === i ? !v : v))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                background: suppDone[i] ? 'rgba(232,255,71,0.05)' : '#1a1a1a',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${suppDone[i] ? '#e8ff47' : '#444'}`,
                background: suppDone[i] ? '#e8ff47' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {suppDone[i] && <span style={{ color: '#0a0a0a', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ color: suppDone[i] ? '#888' : '#ccc', fontSize: '0.9rem', textDecoration: suppDone[i] ? 'line-through' : 'none' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

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
            <button className="btn-accent" onClick={handleLogBodyweight} style={{ padding: '0.5rem 1rem' }}>
              Log
            </button>
          </div>
        </div>
      )}

      {/* Complete workout button */}
      {isToday && (
        <button
          className="btn-accent"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.1em' }}
          onClick={handleCompleteWorkout}
          disabled={!sets.some((s) => s.done)}
        >
          {allMainDone ? 'COMPLETE WORKOUT ✓' : 'SAVE PROGRESS'}
        </button>
      )}
    </div>
  );
}
