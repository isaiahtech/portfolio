'use client';

import type { Profile, HabitEntry } from '@/lib/types';
import { todayISO } from '@/lib/storage';

interface HabitTrackerProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
}

function getStreak(log: HabitEntry[], key: 'walk' | 'creatine'): number {
  const today = todayISO();
  let streak = 0;
  let cursor = new Date(today);
  // Check up to 365 days back
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().split('T')[0];
    const entry = log.find((e) => e.date === dateStr);
    if (entry && entry[key]) {
      streak++;
    } else if (i > 0) {
      // Gap — stop
      break;
    } else {
      // Today not yet logged — look back from yesterday
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HabitTracker({ profile, onUpdate }: HabitTrackerProps) {
  const today = todayISO();
  const todayEntry = profile.habitLog.find((e) => e.date === today) ?? { date: today, walk: false, creatine: false };

  const now = new Date();
  const isLate = now.getHours() >= 11 && (!todayEntry.walk || !todayEntry.creatine);

  const handleToggle = (key: 'walk' | 'creatine') => {
    const updated: HabitEntry = { ...todayEntry, [key]: !todayEntry[key] };
    const log = profile.habitLog.filter((e) => e.date !== today);
    log.push(updated);
    onUpdate({ ...profile, habitLog: log });
  };

  const walkStreak = getStreak(profile.habitLog.concat(todayEntry.walk ? [] : []), 'walk');
  const creatineStreak = getStreak(profile.habitLog.concat(todayEntry.creatine ? [] : []), 'creatine');

  const habits: { key: 'walk' | 'creatine'; label: string; desc: string; streak: number; done: boolean }[] = [
    { key: 'walk', label: '20–30 min Walk', desc: 'Daily movement', streak: walkStreak, done: todayEntry.walk },
    { key: 'creatine', label: '5g Creatine', desc: 'Daily supplement', streak: creatineStreak, done: todayEntry.creatine },
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          Daily Habits
        </div>
        <div style={{ fontSize: '0.75rem', color: '#555' }}>{today}</div>
      </div>

      {isLate && (
        <div style={{
          background: 'rgba(255,68,68,0.1)',
          border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#ff8888',
        }}>
          <span>⚠</span>
          <span>It&apos;s past 11 AM — don&apos;t forget your habits!</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {habits.map((habit) => (
          <button
            key={habit.key}
            onClick={() => handleToggle(habit.key)}
            style={{
              flex: '1 1 160px',
              background: habit.done ? 'rgba(232,255,71,0.08)' : '#1a1a1a',
              border: `1px solid ${habit.done ? '#e8ff47' : '#333'}`,
              borderRadius: '8px',
              padding: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{habit.done ? '✅' : '⬜'}</span>
              {habit.streak > 0 && (
                <span style={{
                  background: habit.done ? '#e8ff47' : '#333',
                  color: habit.done ? '#0a0a0a' : '#888',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  🔥 {habit.streak}
                </span>
              )}
            </div>
            <div style={{ color: habit.done ? '#e8ff47' : '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>{habit.label}</div>
            <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '0.15rem' }}>{habit.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
