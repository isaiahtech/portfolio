'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { Profile, Lift } from '@/lib/types';
import { calcE1RM, getLiftLabel } from '@/lib/wendler';

interface ChartsProps {
  profile: Profile;
  chartType: 'e1rm' | 'weight';
}

const LIFT_COLORS: Record<Lift, string> = {
  squat: '#e8ff47',
  bench: '#4ae8ff',
  deadlift: '#ff7e47',
  press: '#d47eff',
};

const LIFTS: Lift[] = ['squat', 'bench', 'deadlift', 'press'];

// Custom dark tooltip
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '0.65rem 0.9rem',
      fontSize: '0.8rem',
    }}>
      <div style={{ color: '#888', marginBottom: '0.4rem' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontFamily: 'monospace', fontWeight: 700 }}>
          {p.name}: {p.value} lbs
        </div>
      ))}
    </div>
  );
};

export function E1RMChart({ profile }: { profile: Profile }) {
  const data = useMemo(() => {
    // Collect e1RM data points per date per lift
    const byDate: Record<string, Partial<Record<Lift, number>>> = {};

    for (const rec of profile.workoutHistory) {
      if (!rec.amrapReps || !rec.amrapWeight) continue;
      const e1rm = calcE1RM(rec.amrapWeight, rec.amrapReps);
      if (!byDate[rec.date]) byDate[rec.date] = {};
      byDate[rec.date][rec.lift] = e1rm;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5), // MM-DD
        ...vals,
      }));
  }, [profile.workoutHistory]);

  if (data.length < 2) {
    return (
      <div style={{ color: '#555', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
        Log AMRAP sets to see estimated 1RM trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="date" stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
        <YAxis stroke="#444" tick={{ fill: '#666', fontSize: 11 }} unit=" lbs" width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
          formatter={(value) => <span style={{ color: '#888' }}>{value}</span>}
        />
        {LIFTS.map((lift) => (
          <Line
            key={lift}
            type="monotone"
            dataKey={lift}
            name={getLiftLabel(lift)}
            stroke={LIFT_COLORS[lift]}
            strokeWidth={2}
            dot={{ fill: LIFT_COLORS[lift], r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeightChart({ profile }: { profile: Profile }) {
  const data = useMemo(() => {
    const sorted = [...profile.weightLog].sort((a, b) => a.date.localeCompare(b.date));
    // 7-day moving average
    return sorted.map((entry, i) => {
      const window = sorted.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((sum, e) => sum + e.weight, 0) / window.length;
      return {
        date: entry.date.slice(5),
        weight: entry.weight,
        avg7: parseFloat(avg.toFixed(1)),
      };
    });
  }, [profile.weightLog]);

  if (data.length < 2) {
    return (
      <div style={{ color: '#555', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
        Log weight daily to see your trend chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="date" stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
        <YAxis stroke="#444" tick={{ fill: '#666', fontSize: 11 }} unit=" lbs" width={60} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={205} stroke="#e8ff47" strokeDasharray="6 3" label={{ value: 'Target 205', fill: '#e8ff47', fontSize: 11 }} />
        <Legend
          wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
          formatter={(value) => <span style={{ color: '#888' }}>{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="weight"
          name="Daily Weight"
          stroke="#4ae8ff"
          strokeWidth={1.5}
          dot={{ fill: '#4ae8ff', r: 2 }}
          opacity={0.6}
        />
        <Line
          type="monotone"
          dataKey="avg7"
          name="7-Day Avg"
          stroke="#e8ff47"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Charts({ profile, chartType }: ChartsProps) {
  return (
    <div className="card">
      <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 600 }}>
        {chartType === 'e1rm' ? 'Estimated 1RM Progress' : 'Bodyweight Trend'}
      </div>
      {chartType === 'e1rm' ? <E1RMChart profile={profile} /> : <WeightChart profile={profile} />}
    </div>
  );
}
