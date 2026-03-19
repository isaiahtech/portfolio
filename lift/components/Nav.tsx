'use client';

import type { TabId } from '@/lib/types';

interface NavProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  profiles: never[];
  activeProfileId: string | null;
  onActiveChange: (id: string) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'today',    label: 'Lift' },
  { id: 'program',  label: 'Program' },
  { id: 'history',  label: 'History' },
  { id: 'weight',   label: 'Weight' },
  { id: 'settings', label: 'Settings' },
];

export default function Nav({ tab, onTabChange }: NavProps) {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      height: '3.5rem',
      background: '#0a0a0a',
      borderBottom: '1px solid #1e1e1e',
      display: 'flex',
    }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid #e8ff47' : '2px solid transparent',
            color: tab === t.id ? '#e8ff47' : '#444',
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
