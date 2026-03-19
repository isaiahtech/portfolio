'use client';

import { useState, useMemo } from 'react';
import type { Profile } from '@/lib/types';
import {
  CANDITO_SCHEMA, CANDITO_LIFT_MAP, CANDITO_UPPER_SLOTS, CANDITO_LOWER_OPTIONS,
  getCanditoDayCount, getCanditoDayData, isLowerDay, isUpperDay,
  parseCanditoSpec, canditoWeight, applyFailurePenalty, calcWeek6Projection,
  type CanditoLiftKey,
} from '@/lib/candito';
import { getAccessoryById } from '@/lib/wendler';
import { todayISO } from '@/lib/storage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function card(extra?: React.CSSProperties): React.CSSProperties {
  return { background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '1.25rem', ...extra };
}

function getEffectiveMax(profile: Profile, liftKey: CanditoLiftKey): number {
  const lift = CANDITO_LIFT_MAP[liftKey];
  return profile.canditoAdjustedMaxes?.[lift] ?? profile.oneRepMaxes[lift];
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  profile: Profile;
  onUpdate: (p: Profile) => void;
  onSetDone: () => void;
}

export default function CanditoWorkout({ profile, onUpdate, onSetDone }: Props) {
  const week = profile.currentWeek;
  const dayIndex = profile.currentDayInWeek ?? 0;
  const totalDays = getCanditoDayCount(week);
  const dayKey = `day${dayIndex + 1}`;
  const weekData = CANDITO_SCHEMA[`Week ${week}`];

  // Week 6 = projection view
  if (week === 6) {
    return <Week6View profile={profile} onUpdate={onUpdate} />;
  }

  if (!weekData || !totalDays) {
    return (
      <div style={card({ textAlign: 'center', color: '#888', padding: '3rem' })}>
        Week {week} has no sessions. Advance to next cycle in Settings.
      </div>
    );
  }

  const dayData = getCanditoDayData(week, dayKey);
  const isLower = isLowerDay(week, dayKey);
  const isUpper = isUpperDay(week, dayKey);

  // Pre-leg warning: abs trained yesterday?
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];
  const absWarning = isLower && (profile.absTrainedDates ?? []).includes(yesterdayISO);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
              Candito 6-Week — Week {week}: {weekData.label}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace' }}>
              Day {dayIndex + 1} / {totalDays}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.15rem' }}>
              {isLower ? 'Lower Body' : isUpper ? 'Upper Body' : 'Mixed'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: '#555' }}>
            Cycle {profile.currentCycle}
          </div>
        </div>
        {absWarning && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#ffaa00' }}>
            ⚠ Abs were trained yesterday — monitor lower back fatigue during squats/deadlifts.
          </div>
        )}
      </div>

      {/* Main lifts */}
      {dayData && Object.entries(dayData.lifts).map(([liftKey, specs]) => (
        <LiftBlock
          key={liftKey}
          liftKey={liftKey as CanditoLiftKey}
          specs={specs}
          profile={profile}
          onUpdate={onUpdate}
          onSetDone={onSetDone}
        />
      ))}

      {/* Accessories */}
      {isUpper && <UpperAccessories profile={profile} onUpdate={onUpdate} />}
      {isLower && <LowerAccessories profile={profile} onUpdate={onUpdate} />}

      {/* Abs tracking */}
      <AbsLogger profile={profile} onUpdate={onUpdate} />

      {/* Complete Day */}
      <button
        className="btn-accent"
        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.1em' }}
        onClick={() => advanceDay(profile, onUpdate)}
      >
        {dayIndex + 1 < totalDays ? `COMPLETE DAY ${dayIndex + 1} →` : `COMPLETE WEEK ${week} ✓`}
      </button>
    </div>
  );
}

function advanceDay(profile: Profile, onUpdate: (p: Profile) => void) {
  const week = profile.currentWeek;
  const dayIndex = profile.currentDayInWeek ?? 0;
  const totalDays = getCanditoDayCount(week);
  const isLastDay = dayIndex + 1 >= totalDays;

  onUpdate({
    ...profile,
    currentDayInWeek: isLastDay ? 0 : dayIndex + 1,
    currentWeek: isLastDay ? week + 1 : week,
    currentCycle: isLastDay && week === 6 ? profile.currentCycle + 1 : profile.currentCycle,
  });
}

// ─── Lift Block ───────────────────────────────────────────────────────────────

interface LiftBlockProps {
  liftKey: CanditoLiftKey;
  specs: string[];
  profile: Profile;
  onUpdate: (p: Profile) => void;
  onSetDone: () => void;
}

function LiftBlock({ liftKey, specs, profile, onUpdate, onSetDone }: LiftBlockProps) {
  const oneRM = getEffectiveMax(profile, liftKey);
  const parsedSets = useMemo(() => specs.map(parseCanditoSpec), [specs]);

  // Compute actual weights, resolving "Add 5lbs" relative to previous set
  const setsWithWeights = useMemo(() => {
    let lastPctWeight = 0;
    return parsedSets.map((ps) => {
      if (ps.addLbs !== undefined) {
        return { ...ps, computedWeight: lastPctWeight + ps.addLbs };
      }
      if (ps.percent !== undefined) {
        const w = canditoWeight(ps.percent, oneRM);
        lastPctWeight = w;
        return { ...ps, computedWeight: w };
      }
      return { ...ps, computedWeight: 0 };
    });
  }, [parsedSets, oneRM]);

  const totalRows = setsWithWeights.reduce((sum, ps) => sum + (ps.isConditional ? 1 : ps.sets), 0);
  const [done, setDone] = useState<boolean[]>(() => Array(totalRows).fill(false));
  const [mrInputs, setMrInputs] = useState<Record<number, string>>({});
  const [failures, setFailures] = useState<Record<number, boolean>>({});

  // Flatten into individual set rows for rendering
  let rowIdx = 0;
  const rows: Array<{
    rowIdx: number;
    weight: number;
    repsDisplay: string;
    isMR: boolean;
    isConditional: boolean;
    note: string;
    setNumLabel: string;
  }> = [];

  for (const ps of setsWithWeights) {
    if (ps.isConditional) {
      rows.push({ rowIdx: rowIdx++, weight: ps.computedWeight, repsDisplay: ps.repsDisplay, isMR: false, isConditional: true, note: ps.note, setNumLabel: '!' });
    } else {
      for (let s = 0; s < ps.sets; s++) {
        rows.push({
          rowIdx: rowIdx++,
          weight: ps.computedWeight,
          repsDisplay: ps.repsDisplay,
          isMR: ps.isMR,
          isConditional: false,
          note: ps.note,
          setNumLabel: ps.sets > 1 ? `${s + 1}/${ps.sets}` : '',
        });
      }
    }
  }

  const handleFailure = (ri: number, weight: number) => {
    setFailures((prev) => ({ ...prev, [ri]: true }));
    const lift = CANDITO_LIFT_MAP[liftKey];
    const newAdjusted = applyFailurePenalty(oneRM);
    if (confirm(`Failed set at ${weight} lbs. Apply 2.5% penalty? New 1RM: ${newAdjusted} lbs`)) {
      const newAdj = { ...profile.canditoAdjustedMaxes, [lift]: newAdjusted };
      onUpdate({ ...profile, canditoAdjustedMaxes: newAdj });
    }
  };

  return (
    <div style={card()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{liftKey}</div>
        <div style={{ fontSize: '0.72rem', color: '#555', fontFamily: 'monospace' }}>
          1RM: {oneRM} lbs{profile.canditoAdjustedMaxes?.[CANDITO_LIFT_MAP[liftKey]] ? ' (adj)' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {rows.map((row) => {
          const isDone = done[row.rowIdx] ?? false;
          const hasFailed = failures[row.rowIdx] ?? false;

          if (row.isConditional) {
            return (
              <div key={row.rowIdx} style={{
                padding: '0.6rem 0.75rem', borderRadius: '8px',
                background: 'rgba(232,255,71,0.05)', border: '1px dashed #333',
                fontSize: '0.75rem', color: '#888',
              }}>
                <span style={{ color: '#e8ff47', fontWeight: 700, marginRight: '0.5rem' }}>NOTE</span>
                {row.note}
              </div>
            );
          }

          return (
            <div key={row.rowIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.75rem', borderRadius: '8px',
                  border: `1px solid ${hasFailed ? '#ff4444' : isDone ? '#e8ff47' : '#222'}`,
                  background: hasFailed ? 'rgba(255,68,68,0.07)' : isDone ? 'rgba(232,255,71,0.08)' : 'transparent',
                  cursor: row.isMR ? 'default' : 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => { if (!row.isMR && !isDone) { setDone((p) => p.map((v, i) => i === row.rowIdx ? true : v)); onSetDone(); } }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${hasFailed ? '#ff4444' : isDone ? '#e8ff47' : '#444'}`,
                  background: isDone && !hasFailed ? '#e8ff47' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone && !hasFailed && <span style={{ color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                  {hasFailed && <span style={{ color: '#ff4444', fontSize: '0.65rem', fontWeight: 900 }}>✗</span>}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: hasFailed ? '#ff4444' : isDone ? '#e8ff47' : '#fff' }}>
                  {row.weight > 0 ? `${row.weight} lbs` : '—'}
                  {' × '}
                  {row.isMR ? <span style={{ color: '#f97316' }}>{row.repsDisplay}</span> : row.repsDisplay}
                </span>
                {row.setNumLabel && (
                  <span style={{ color: '#555', fontSize: '0.72rem', marginLeft: 'auto' }}>{row.setNumLabel}</span>
                )}
              </div>
              {/* MR input + fail button */}
              {row.isMR && (
                <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                  <input
                    type="number"
                    value={mrInputs[row.rowIdx] ?? ''}
                    onChange={(e) => setMrInputs((p) => ({ ...p, [row.rowIdx]: e.target.value }))}
                    placeholder="reps done"
                    min="0"
                    style={{ width: '110px', fontSize: '0.9rem' }}
                  />
                  {mrInputs[row.rowIdx] && parseInt(mrInputs[row.rowIdx]) > 0 && (
                    <button
                      style={{ background: '#e8ff47', color: '#0a0a0a', fontWeight: 700, padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => { setDone((p) => p.map((v, i) => i === row.rowIdx ? true : v)); onSetDone(); }}
                    >
                      Log
                    </button>
                  )}
                  {!isDone && (
                    <button
                      style={{ background: 'transparent', color: '#ff4444', fontWeight: 600, padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ff4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => handleFailure(row.rowIdx, row.weight)}
                    >
                      Failed
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

// ─── Upper Accessories ────────────────────────────────────────────────────────

function UpperAccessories({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const selections = profile.canditoUpperAccessories ?? {};

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, marginBottom: '0.85rem', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Accessories — Upper Body
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CANDITO_UPPER_SLOTS.map((slot) => {
          const selId = selections[slot.id] ?? slot.options[0];
          const ex = getAccessoryById(selId);
          return (
            <div key={slot.id}>
              <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: '0.3rem' }}>{slot.label} · 4 sets · 8–12 reps</div>
              <select
                value={selId}
                onChange={(e) => onUpdate({ ...profile, canditoUpperAccessories: { ...selections, [slot.id]: e.target.value } })}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ccc', fontSize: '0.85rem', padding: '0.3rem 0.5rem', width: '100%' }}
              >
                {slot.options.map((id) => {
                  const e = getAccessoryById(id);
                  return <option key={id} value={id}>{e?.name ?? id}</option>;
                })}
              </select>
              {ex?.note && <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.2rem', fontStyle: 'italic' }}>{ex.note}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#555' }}>
        + 2 optional exercises (8–12 reps, 4 sets max) — choose freely
      </div>
    </div>
  );
}

// ─── Lower Accessories ────────────────────────────────────────────────────────

function LowerAccessories({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const selected = profile.canditoLowerType ?? 'hypertrophy';
  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Accessories — Lower Body (Optional)
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {CANDITO_LOWER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onUpdate({ ...profile, canditoLowerType: opt.id as 'hypertrophy' | 'explosive' })}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
              border: `1px solid ${selected === opt.id ? '#e8ff47' : '#333'}`,
              background: selected === opt.id ? 'rgba(232,255,71,0.08)' : 'transparent',
              color: selected === opt.id ? '#e8ff47' : '#888',
              fontSize: '0.82rem', fontWeight: 600,
            }}
          >
            <div>{opt.label}</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: '0.2rem', color: selected === opt.id ? '#b8cc30' : '#555' }}>
              {opt.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Abs Logger ───────────────────────────────────────────────────────────────

function AbsLogger({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const today = todayISO();
  const absToday = (profile.absTrainedDates ?? []).includes(today);

  const toggle = () => {
    const dates = profile.absTrainedDates ?? [];
    const next = absToday ? dates.filter((d) => d !== today) : [...dates, today];
    onUpdate({ ...profile, absTrainedDates: next });
  };

  return (
    <div
      style={{
        ...card(),
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
        border: absToday ? '1px solid rgba(232,255,71,0.3)' : '1px solid #222',
        background: absToday ? 'rgba(232,255,71,0.05)' : '#111',
      }}
      onClick={toggle}
    >
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: absToday ? '#e8ff47' : '#ccc' }}>Trained Abs Today</div>
        <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.1rem' }}>Warns you before tomorrow's lower-body session</div>
      </div>
      <div style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: absToday ? '#e8ff47' : '#333', position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '3px', left: absToday ? '19px' : '3px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: absToday ? '#0a0a0a' : '#666', transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

// ─── Week 6 Projection ────────────────────────────────────────────────────────

function Week6View({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const week5Records = profile.workoutHistory.filter(
    (r) => r.week === 5 && r.programId === 'candito6week',
  );

  const projections: Array<{ lift: string; weight: number; reps: number; projected: number }> = [];
  for (const rec of week5Records) {
    const lastSet = rec.sets[rec.sets.length - 1];
    if (lastSet?.completedReps) {
      projections.push({
        lift: rec.lift,
        weight: lastSet.weight,
        reps: lastSet.completedReps,
        projected: calcWeek6Projection(lastSet.weight, lastSet.completedReps),
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={card()}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e8ff47', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
          WEEK 6 — Projected Max
        </div>
        <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5 }}>
          {CANDITO_SCHEMA['Week 6'].instructions}
        </div>
      </div>

      {projections.length > 0 ? (
        <div style={card()}>
          <div style={{ fontWeight: 700, marginBottom: '0.85rem', color: '#ccc' }}>Your Projections</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {projections.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#1a1a1a', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.lift}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {p.weight} lbs × {p.reps} reps
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.15rem', color: '#e8ff47' }}>
                    {p.projected} lbs
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#555' }}>projected 1RM</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={card({ color: '#888', textAlign: 'center', padding: '2rem' })}>
          No Week 5 records found. Complete Week 5 to see projections.
        </div>
      )}

      <button
        className="btn-accent"
        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.1em' }}
        onClick={() => {
          if (!confirm('Start new Candito cycle? Projected maxes will become your new 1RMs if you confirm.')) return;
          const newORMs = { ...profile.oneRepMaxes };
          for (const p of projections) {
            newORMs[p.lift as keyof typeof newORMs] = p.projected;
          }
          onUpdate({
            ...profile,
            oneRepMaxes: newORMs,
            canditoAdjustedMaxes: {},
            currentWeek: 1,
            currentDayInWeek: 0,
            currentCycle: profile.currentCycle + 1,
          });
        }}
      >
        START NEW CYCLE →
      </button>
    </div>
  );
}
