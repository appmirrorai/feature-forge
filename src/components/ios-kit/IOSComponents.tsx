import type { CSSProperties, ReactNode } from 'react';
import { IOS, text } from './styles';

// ── Screen wrapper ───────────────────────────────────────────────
export function Screen({ children, bg }: { children: ReactNode; bg?: string }) {
  return (
    <div style={{ background: bg || IOS.groupedBg, minHeight: '100%', fontFamily: IOS.font }}>
      {children}
    </div>
  );
}

// ── Navigation Bar ───────────────────────────────────────────────
export function NavBar({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <div style={{ padding: '8px 16px 12px', background: IOS.cardBg, borderBottom: `0.5px solid ${IOS.separator}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '32px' }}>
        {back ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: IOS.blue, ...text.body, cursor: 'pointer' }}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke={IOS.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10L10 18"/></svg>
            {back}
          </div>
        ) : <div />}
        <div style={text.title}>{title}</div>
        <div>{right || <div style={{ width: '60px' }} />}</div>
      </div>
    </div>
  );
}

// ── Large Title ──────────────────────────────────────────────────
export function LargeTitle({ title }: { title: string }) {
  return (
    <div style={{ padding: '0 16px 8px', background: IOS.cardBg }}>
      <div style={text.largeTitle}>{title}</div>
    </div>
  );
}

// ── Section (grouped list) ───────────────────────────────────────
export function Section({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <div style={{ margin: '0 16px 24px' }}>
      {header && (
        <div style={{ ...text.sectionHeader, padding: '0 0 6px 16px' }}>{header}</div>
      )}
      <div style={{ background: IOS.cardBg, borderRadius: '12px', overflow: 'hidden' }}>
        {children}
      </div>
      {footer && (
        <div style={{ ...text.caption, padding: '6px 16px 0' }}>{footer}</div>
      )}
    </div>
  );
}

// ── Row (list cell) ──────────────────────────────────────────────
export function Row({ icon, iconColor, label, detail, chevron, toggle, toggleOn, subtitle, image, onTap }: {
  icon?: string; iconColor?: string; label: string; detail?: string; chevron?: boolean;
  toggle?: boolean; toggleOn?: boolean; subtitle?: string; image?: string; onTap?: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px',
        borderBottom: `0.5px solid ${IOS.separator}`, cursor: onTap ? 'pointer' : 'default',
        background: IOS.cardBg,
      }}
    >
      {icon && (
        <div style={{
          width: '29px', height: '29px', borderRadius: '6px',
          background: iconColor || IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: IOS.white, fontSize: '15px', flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      {image && (
        <div style={{
          width: '40px', height: '40px', borderRadius: '20px', background: IOS.gray5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
        }}>
          {image}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={text.body}>{label}</div>
        {subtitle && <div style={{ ...text.caption, marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {detail && <div style={{ ...text.body, color: IOS.gray }}>{detail}</div>}
      {toggle && (
        <div style={{
          width: '51px', height: '31px', borderRadius: '16px',
          background: toggleOn ? IOS.green : IOS.gray5,
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
          <div style={{
            width: '27px', height: '27px', borderRadius: '14px', background: IOS.white,
            position: 'absolute', top: '2px', left: toggleOn ? '22px' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
          }} />
        </div>
      )}
      {chevron && (
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke={IOS.gray3} strokeWidth="2" strokeLinecap="round"><path d="M1 1L7 7L1 13"/></svg>
      )}
    </div>
  );
}

// ── Text Field ───────────────────────────────────────────────────
export function TextField({ placeholder, value, secure }: { placeholder: string; value?: string; secure?: boolean }) {
  return (
    <div style={{ padding: '11px 16px', borderBottom: `0.5px solid ${IOS.separator}`, background: IOS.cardBg }}>
      <input
        type={secure ? 'password' : 'text'}
        placeholder={placeholder}
        defaultValue={value}
        style={{
          ...text.body, border: 'none', outline: 'none', width: '100%', background: 'transparent', color: IOS.black,
        }}
      />
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────
export function IOSButton({ label, style: variant, destructive, full }: {
  label: string; style?: 'filled' | 'tinted' | 'plain'; destructive?: boolean; full?: boolean;
}) {
  const color = destructive ? IOS.red : IOS.blue;
  const styles: Record<string, CSSProperties> = {
    filled: { background: color, color: IOS.white, padding: '14px 20px', borderRadius: '12px', border: 'none', fontSize: '17px', fontWeight: 600, fontFamily: IOS.font, cursor: 'pointer', width: full ? '100%' : 'auto', textAlign: 'center' },
    tinted: { background: `${color}18`, color, padding: '14px 20px', borderRadius: '12px', border: 'none', fontSize: '17px', fontWeight: 600, fontFamily: IOS.font, cursor: 'pointer', width: full ? '100%' : 'auto', textAlign: 'center' },
    plain: { background: 'transparent', color, padding: '8px 0', border: 'none', fontSize: '17px', fontWeight: 400, fontFamily: IOS.font, cursor: 'pointer' },
  };
  return <button style={styles[variant || 'filled']}>{label}</button>;
}

// ── Search Bar ───────────────────────────────────────────────────
export function SearchBar({ placeholder }: { placeholder?: string }) {
  return (
    <div style={{ padding: '0 16px 12px', background: IOS.cardBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: IOS.gray6, borderRadius: '10px', padding: '8px 10px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.gray} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          placeholder={placeholder || 'Search'}
          style={{ ...text.body, fontSize: '15px', border: 'none', outline: 'none', background: 'transparent', color: IOS.black, flex: 1 }}
        />
      </div>
    </div>
  );
}

// ── Tab Bar ──────────────────────────────────────────────────────
export function TabBar({ tabs, activeIndex }: { tabs: { icon: string; label: string }[]; activeIndex?: number }) {
  return (
    <div style={{
      display: 'flex', borderTop: `0.5px solid ${IOS.separator}`, background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)', padding: '6px 0 20px',
    }}>
      {tabs.map((tab, i) => (
        <div key={i} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer',
          color: i === (activeIndex ?? 0) ? IOS.blue : IOS.gray,
        }}>
          <span style={{ fontSize: '22px' }}>{tab.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 500, fontFamily: IOS.font }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Segmented Control ────────────────────────────────────────────
export function SegmentedControl({ segments, activeIndex }: { segments: string[]; activeIndex?: number }) {
  return (
    <div style={{ display: 'flex', background: IOS.gray6, borderRadius: '8px', padding: '2px', margin: '0 16px 12px' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: 1, padding: '6px 12px', borderRadius: '6px', textAlign: 'center',
          background: i === (activeIndex ?? 0) ? IOS.cardBg : 'transparent',
          boxShadow: i === (activeIndex ?? 0) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          ...text.caption, fontWeight: 500, color: IOS.black, cursor: 'pointer',
        }}>
          {seg}
        </div>
      ))}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────
export function IOSCard({ children, padding }: { children: ReactNode; padding?: boolean }) {
  return (
    <div style={{
      background: IOS.cardBg, borderRadius: '12px', margin: '0 16px 12px',
      padding: padding ? '16px' : undefined, overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────────
export function Alert({ title, message, buttons }: { title: string; message?: string; buttons: { label: string; style?: 'default' | 'cancel' | 'destructive' }[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 50 }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '14px', width: '100%', maxWidth: '270px', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ ...text.title, marginBottom: '4px' }}>{title}</div>
          {message && <div style={{ ...text.caption, color: IOS.black }}>{message}</div>}
        </div>
        <div style={{ marginTop: '16px' }}>
          {buttons.map((btn, i) => (
            <div key={i} style={{
              padding: '11px', borderTop: `0.5px solid ${IOS.separator}`, cursor: 'pointer',
              ...text.body,
              color: btn.style === 'destructive' ? IOS.red : IOS.blue,
              fontWeight: btn.style === 'cancel' ? 600 : 400,
            }}>
              {btn.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────
export function EmptyState({ icon, title, message, buttonLabel }: { icon: string; title: string; message: string; buttonLabel?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>{icon}</div>
      <div style={{ ...text.title, fontSize: '20px', marginBottom: '6px' }}>{title}</div>
      <div style={{ ...text.body, color: IOS.gray, lineHeight: '1.5' }}>{message}</div>
      {buttonLabel && (
        <button style={{ marginTop: '20px', background: IOS.blue, color: IOS.white, padding: '12px 32px', borderRadius: '12px', border: 'none', ...text.title, cursor: 'pointer' }}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

// ── Spacer ───────────────────────────────────────────────────────
export function Spacer({ height }: { height?: number }) {
  return <div style={{ height: `${height || 16}px` }} />;
}
