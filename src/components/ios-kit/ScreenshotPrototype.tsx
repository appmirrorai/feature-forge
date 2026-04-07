import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────
export interface Hotspot {
  id: string;
  targetScreen: string;
  x: number;      // percentage from left
  y: number;      // percentage from top
  width: number;  // percentage
  height: number; // percentage
  label?: string;
}

export interface ScreenshotScreen {
  id: string;
  name: string;
  order: number;
  image: string;
  states: Record<string, { image: string }>;
  hotspots: Hotspot[];
}

export interface ScreenshotData {
  screens: ScreenshotScreen[];
  entryScreen: string | null;
}

interface ScreenshotPrototypeProps {
  data: ScreenshotData;
  onEditHotspot?: (screenId: string, hotspot: Hotspot) => void;
  editMode?: boolean;
}

// ── Component ────────────────────────────────────────────────────
export default function ScreenshotPrototype({ data, editMode, onEditHotspot }: ScreenshotPrototypeProps) {
  const [stack, setStack] = useState<string[]>([data.entryScreen || data.screens[0]?.id || '']);
  const [activeState, setActiveState] = useState<string>('default');
  const [showHotspots, setShowHotspots] = useState(false);

  // Adding new hotspots in edit mode
  const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(null);

  const currentId = stack[stack.length - 1];
  const currentScreen = data.screens.find(s => s.id === currentId);

  if (!currentScreen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: '-apple-system, sans-serif', color: '#8e8e93', padding: '32px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
          <div style={{ fontSize: '17px', fontWeight: 600, color: '#000', marginBottom: '4px' }}>No Screenshots</div>
          <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
            Run: <code style={{ background: '#f2f2f7', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>npm run screenshots /path/to/screenshots</code>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = currentScreen.states[activeState]?.image || currentScreen.image;
  const states = Object.keys(currentScreen.states);

  const navigate = (targetId: string) => {
    if (data.screens.find(s => s.id === targetId)) {
      setStack(prev => [...prev, targetId]);
    }
  };

  const goBack = () => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    }
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onEditHotspot) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!drawing) {
      setDrawing({ startX: x, startY: y });
    } else {
      const hotspot: Hotspot = {
        id: `hs_${Date.now()}`,
        targetScreen: '',
        x: Math.min(drawing.startX, x),
        y: Math.min(drawing.startY, y),
        width: Math.abs(x - drawing.startX),
        height: Math.abs(y - drawing.startY),
      };
      onEditHotspot(currentScreen.id, hotspot);
      setDrawing(null);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f2f2f7', fontFamily: '-apple-system, sans-serif' }}>
      {/* Back button overlay */}
      {stack.length > 1 && (
        <div
          onClick={goBack}
          style={{
            position: 'absolute', top: '44px', left: '8px', zIndex: 20,
            display: 'flex', alignItems: 'center', gap: '2px',
            color: '#007AFF', fontSize: '17px', cursor: 'pointer',
            padding: '4px 8px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
          }}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"><path d="M10 2L2 10L10 18"/></svg>
          Back
        </div>
      )}

      {/* Screenshot image with hotspot overlays */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: editMode ? 'crosshair' : 'default' }}
        onClick={handleScreenClick}
        onMouseEnter={() => setShowHotspots(true)}
        onMouseLeave={() => setShowHotspots(false)}
      >
        <img
          src={imageUrl}
          alt={currentScreen.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          draggable={false}
        />

        {/* Hotspot overlays */}
        {currentScreen.hotspots.map(hotspot => (
          <div
            key={hotspot.id}
            onClick={(e) => { e.stopPropagation(); navigate(hotspot.targetScreen); }}
            style={{
              position: 'absolute',
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
              background: showHotspots || editMode ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
              border: showHotspots || editMode ? '2px solid rgba(0, 122, 255, 0.4)' : 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={hotspot.label || `→ ${hotspot.targetScreen}`}
          />
        ))}

        {/* Drawing hotspot indicator */}
        {drawing && (
          <div style={{
            position: 'absolute',
            left: `${drawing.startX}%`,
            top: `${drawing.startY}%`,
            width: '8px', height: '8px',
            background: '#007AFF',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
        )}
      </div>

      {/* State switcher (if multiple states exist) */}
      {states.length > 1 && (
        <div style={{
          display: 'flex', gap: '4px', padding: '6px 8px',
          background: 'rgba(255,255,255,0.95)', borderTop: '0.5px solid #c6c6c8',
        }}>
          {states.map(state => (
            <button
              key={state}
              onClick={() => setActiveState(state)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: '6px', border: 'none',
                background: activeState === state ? '#007AFF' : '#f2f2f7',
                color: activeState === state ? '#fff' : '#000',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                fontFamily: '-apple-system, sans-serif',
              }}
            >
              {state === 'default' ? 'Default' : state.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
