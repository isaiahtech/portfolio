'use client';

import type { TabId, Profile } from '@/lib/types';
import { useState } from 'react';

interface NavProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  profiles: Profile[];
  activeProfileId: string | null;
  onActiveChange: (id: string) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'program', label: 'Program' },
  { id: 'history', label: 'History' },
  { id: 'weight', label: 'Weight' },
  { id: 'settings', label: 'Settings' },
];

export default function Nav({ tab, onTabChange, profiles, activeProfileId, onActiveChange }: NavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      height: '3.5rem',
      background: '#0a0a0a',
      borderBottom: '1px solid #e8ff47',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
    }}>
      {/* Left: Brand */}
      <div
        style={{
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: '1.25rem',
          color: '#e8ff47',
          letterSpacing: '0.15em',
          cursor: 'pointer',
          userSelect: 'none',
          minWidth: '60px',
        }}
        onClick={() => onTabChange('today')}
      >
        LIFT
      </div>

      {/* Center: Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-pill${tab === t.id ? ' active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Right: Profile selector */}
      <div style={{ position: 'relative', minWidth: '60px', display: 'flex', justifyContent: 'flex-end' }}>
        {activeProfile ? (
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#ccc',
              padding: '0.3rem 0.7rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProfile.name}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#888' }}>▼</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange('settings')}
            style={{
              background: 'transparent',
              border: '1px solid #e8ff47',
              borderRadius: '6px',
              color: '#e8ff47',
              padding: '0.3rem 0.7rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            + Profile
          </button>
        )}

        {dropdownOpen && profiles.length > 0 && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setDropdownOpen(false)}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              minWidth: '160px',
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onActiveChange(p.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: p.id === activeProfileId ? 'rgba(232,255,71,0.1)' : 'transparent',
                    color: p.id === activeProfileId ? '#e8ff47' : '#ccc',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    borderBottom: '1px solid #1a1a1a',
                  }}
                >
                  {p.name}
                  <span style={{ fontSize: '0.7rem', color: '#555', display: 'block' }}>
                    Wk {p.currentWeek} / Cycle {p.currentCycle}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
