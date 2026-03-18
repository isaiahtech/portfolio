'use client';

import { useState } from 'react';
import type { SetResult } from '@/lib/types';

interface SetRowProps {
  set: SetResult;
  isAmrap: boolean;
  isWarmup?: boolean;
  label?: string;
  onToggle: (completedReps?: number) => void;
}

export default function SetRow({ set, isAmrap, isWarmup = false, label, onToggle }: SetRowProps) {
  const [amrapInput, setAmrapInput] = useState<string>(set.completedReps?.toString() ?? '');

  const handleClick = () => {
    if (set.done) {
      // Toggle off
      onToggle(undefined);
      return;
    }
    if (isAmrap) {
      // Don't auto-complete AMRAP — wait for rep count
      return;
    }
    onToggle(set.targetReps);
  };

  const handleAmrapComplete = () => {
    const reps = parseInt(amrapInput, 10);
    if (!isNaN(reps) && reps > 0) {
      onToggle(reps);
    }
  };

  return (
    <div
      className={`set-row${set.done ? ' done' : ''}`}
      onClick={!isAmrap ? handleClick : undefined}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        cursor: isAmrap ? 'default' : 'pointer',
        opacity: isWarmup ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Check indicator */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${set.done ? '#e8ff47' : '#444'}`,
            background: set.done ? '#e8ff47' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}>
            {set.done && (
              <span style={{ color: '#0a0a0a', fontSize: '0.75rem', fontWeight: 900, lineHeight: 1 }}>✓</span>
            )}
          </div>

          <div>
            {label && <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>{label}</div>}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem', color: set.done ? '#e8ff47' : '#fff' }}>
                {set.weight}
              </span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>lbs</span>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>×</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: set.done ? '#e8ff47' : '#ccc' }}>
                {isAmrap ? (set.done ? (set.completedReps ?? set.targetReps) : set.targetReps + '+') : set.targetReps}
              </span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>reps</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAmrap && (
            <span style={{
              fontSize: '0.7rem',
              background: '#e8ff47',
              color: '#0a0a0a',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}>
              AMRAP
            </span>
          )}
          {set.done && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(undefined); }}
              style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* AMRAP input — shows when not yet done */}
      {isAmrap && !set.done && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1a1a1a' }}>
          <label style={{ color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Reps achieved:</label>
          <input
            type="number"
            value={amrapInput}
            onChange={(e) => setAmrapInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAmrapComplete()}
            min="1"
            max="50"
            style={{ width: '70px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="btn-accent"
            style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
            onClick={(e) => { e.stopPropagation(); handleAmrapComplete(); }}
          >
            Log
          </button>
        </div>
      )}
    </div>
  );
}
