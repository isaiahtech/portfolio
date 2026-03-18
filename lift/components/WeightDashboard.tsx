'use client';

import { useState } from 'react';
import type { Profile, WeightEntry } from '@/lib/types';
import { todayISO } from '@/lib/storage';

interface WeightDashboardProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
}

const TARGET_WEIGHT = 205;

export default function WeightDashboard({ profile, onUpdate }: WeightDashboardProps) {
  const today = todayISO();
  const todayEntry = profile.weightLog.find((e) => e.date === today);
  const [input, setInput] = useState(todayEntry?.weight?.toString() ?? '');
  const [saved, setSaved] = useState(false);

  const handleLog = () => {
    const w = parseFloat(input);
    if (!w || w <= 0) return;
    const entry: WeightEntry = { date: today, weight: w };
    const log = profile.weightLog.filter((e) => e.date !== today);
    log.push(entry);
    log.sort((a, b) => a.date.localeCompare(b.date));
    onUpdate({ ...profile, weightLog: log });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Last 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const recent = [...profile.weightLog]
    .filter((e) => e.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const latestWeight = profile.weightLog.length > 0
    ? [...profile.weightLog].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const diff = latestWeight ? TARGET_WEIGHT - latestWeight.weight : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Log input */}
      <div className="card">
        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
          Morning Weight
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
            placeholder="lbs"
            min="50"
            max="500"
            step="0.1"
            style={{ width: '100px' }}
          />
          <button className="btn-accent" onClick={handleLog}>
            {saved ? 'Saved ✓' : 'Log Weight'}
          </button>
          {latestWeight && (
            <div style={{ color: '#888', fontSize: '0.85rem' }}>
              Latest: <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{latestWeight.weight}</span> lbs
            </div>
          )}
        </div>

        {/* Target info */}
        <div style={{
          marginTop: '0.75rem',
          padding: '0.65rem',
          background: '#1a1a1a',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>
            Target: <span style={{ color: '#e8ff47', fontFamily: 'monospace', fontWeight: 700 }}>{TARGET_WEIGHT} lbs</span>
          </div>
          {diff !== null && (
            <div style={{ fontSize: '0.8rem', color: diff <= 0 ? '#4ade80' : '#888' }}>
              {diff <= 0
                ? `✓ Goal reached! +${Math.abs(diff).toFixed(1)} over`
                : `${diff.toFixed(1)} lbs to go`}
            </div>
          )}
        </div>
      </div>

      {/* Recent log table */}
      <div className="card">
        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
          Last 30 Days
        </div>
        {recent.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
            No weight entries yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '300px', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.3rem 0.5rem', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
              <span style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Weight</span>
              <span style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>vs Target</span>
            </div>
            {recent.map((entry, i) => {
              const delta = entry.weight - TARGET_WEIGHT;
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '4px',
                  background: entry.date === today ? 'rgba(232,255,71,0.05)' : 'transparent',
                }}>
                  <span style={{ color: entry.date === today ? '#e8ff47' : '#888', fontSize: '0.85rem' }}>
                    {entry.date}
                  </span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: '0.9rem' }}>
                    {entry.weight}
                  </span>
                  <span style={{
                    textAlign: 'right',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: delta >= 0 ? '#4ade80' : '#888',
                  }}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
