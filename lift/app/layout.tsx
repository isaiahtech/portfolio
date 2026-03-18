import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIFT — 5/3/1 Tracker',
  description: '5/3/1 strength training tracker by Isaiah Dasen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}
