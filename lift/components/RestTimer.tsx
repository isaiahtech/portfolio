'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RestTimerProps {
  onDismiss: () => void;
  initialSeconds?: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 42; // radius 42

export default function RestTimer({ onDismiss, initialSeconds = 180 }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (running) startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, startTimer]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const progress = seconds / initialSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const handleAddMinute = () => {
    setSeconds((s) => s + 60);
    setRunning(true);
  };

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onDismiss();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 100,
      background: '#111',
      border: '1px solid #333',
      borderRadius: '16px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      minWidth: '160px',
    }}>
      {/* Progress ring */}
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#222"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={seconds === 0 ? '#ff4444' : '#e8ff47'}
            strokeWidth="6"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: seconds === 0 ? '#ff4444' : '#e8ff47',
          }}>
            {mm}:{ss}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {running ? 'REST' : 'DONE'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleAddMinute}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#ccc',
            padding: '0.35rem 0.7rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          +1:00
        </button>
        <button
          onClick={handleSkip}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#888',
            padding: '0.35rem 0.7rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
