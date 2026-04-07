import type { ReactNode } from 'react';

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '2.5rem',
          padding: '12px',
          width: '375px',
          maxWidth: '100%',
          background: '#1a1a1a',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          width: '100px', height: '28px', borderRadius: '14px', background: '#000', zIndex: 10,
        }} />
        {/* Power button */}
        <div style={{ position: 'absolute', right: '-3px', top: '120px', width: '3px', height: '60px', borderRadius: '0 2px 2px 0', background: '#2a2a2a' }} />
        {/* Volume */}
        <div style={{ position: 'absolute', left: '-3px', top: '100px', width: '3px', height: '30px', borderRadius: '2px 0 0 2px', background: '#2a2a2a' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '140px', width: '3px', height: '30px', borderRadius: '2px 0 0 2px', background: '#2a2a2a' }} />

        {/* Screen */}
        <div style={{
          borderRadius: '2rem',
          overflow: 'hidden',
          background: '#F2F2F7',
          height: '680px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '38px 24px 8px',
            background: '#fff',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#000', fontFamily: '-apple-system, sans-serif' }}>9:41</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="#000">
                <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.3"/>
                <rect x="4.5" y="5" width="3" height="7" rx="0.5" opacity="0.5"/>
                <rect x="9" y="2" width="3" height="10" rx="0.5" opacity="0.7"/>
                <rect x="13" y="0" width="3" height="12" rx="0.5"/>
              </svg>
              <svg width="24" height="12" viewBox="0 0 24 12" fill="#000">
                <rect x="0" y="1" width="20" height="10" rx="2" stroke="#000" strokeWidth="1" fill="none"/>
                <rect x="2" y="3" width="14" height="6" rx="1" fill="#34C759"/>
                <rect x="21" y="4" width="2" height="4" rx="0.5"/>
              </svg>
            </div>
          </div>

          {/* App content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', background: '#fff', flexShrink: 0 }}>
            <div style={{ width: '134px', height: '5px', background: '#d1d1d6', borderRadius: '3px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
