import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@appmirror/ui-kit';
import type { Hotspot, ScreenshotScreen } from '../ios-kit/ScreenshotPrototype';

interface ScreenFlowEditorProps {
  screens: ScreenshotScreen[];
  onUpdateScreen: (screenId: string, updates: Partial<ScreenshotScreen>) => void;
  onReorder?: (screenIds: string[]) => void;
}

export default function ScreenFlowEditor({ screens, onUpdateScreen }: ScreenFlowEditorProps) {
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<string | null>(null);

  const selected = screens.find(s => s.id === selectedScreen);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Screen Flow</span>
            <Badge variant="secondary">{screens.length} screens</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Screen strip — horizontal scrollable thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {screens.map((screen, idx) => (
              <div
                key={screen.id}
                onClick={() => setSelectedScreen(screen.id)}
                className={`
                  flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                  ${selectedScreen === screen.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}
                `}
                style={{ width: '100px' }}
              >
                <div style={{ width: '100px', height: '180px', background: '#f2f2f7', position: 'relative' }}>
                  {screen.image ? (
                    <img src={screen.image} alt={screen.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8e8e93', fontSize: '24px' }}>
                      {idx + 1}
                    </div>
                  )}
                  {/* Hotspot count badge */}
                  {screen.hotspots.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '4px', right: '4px',
                      background: '#007AFF', color: '#fff', borderRadius: '10px',
                      fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                    }}>
                      {screen.hotspots.length}
                    </div>
                  )}
                </div>
                <div className="p-1.5 text-center">
                  <div className="text-[10px] font-medium truncate">{screen.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Connection lines visualization */}
          {screens.length > 0 && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-xs font-medium text-muted-foreground mb-2">Navigation Flow</div>
              <div className="flex flex-wrap gap-2 items-center">
                {screens.map((screen, idx) => (
                  <div key={screen.id} className="flex items-center gap-2">
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${selectedScreen === screen.id ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border border-border'}
                    `}>
                      {screen.name}
                    </div>
                    {screen.hotspots.length > 0 && (
                      <div className="flex gap-1">
                        {screen.hotspots.map(h => (
                          <span key={h.id} className="text-xs text-muted-foreground">
                            → {h.targetScreen}
                          </span>
                        ))}
                      </div>
                    )}
                    {idx < screens.length - 1 && <span className="text-muted-foreground">|</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected screen editor */}
          {selected && (
            <div className="p-4 rounded-lg border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{selected.name}</h3>
                <Button variant="secondary" onClick={() => setSelectedScreen(null)} className="text-xs">
                  Close
                </Button>
              </div>

              {/* Screen name edit */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Screen Name</label>
                <Input
                  value={selected.name}
                  onChange={(e) => onUpdateScreen(selected.id, { name: e.target.value })}
                />
              </div>

              {/* Hotspots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Hotspots (tap zones)</label>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => {
                      const newHotspot: Hotspot = {
                        id: `hs_${Date.now()}`,
                        targetScreen: screens[0]?.id || '',
                        x: 10, y: 70, width: 80, height: 12,
                        label: 'New hotspot',
                      };
                      onUpdateScreen(selected.id, {
                        hotspots: [...selected.hotspots, newHotspot],
                      });
                    }}
                  >
                    + Add Hotspot
                  </Button>
                </div>

                {selected.hotspots.map(hotspot => (
                  <div
                    key={hotspot.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      editingHotspot === hotspot.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">
                        {hotspot.label || `→ ${hotspot.targetScreen}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingHotspot(editingHotspot === hotspot.id ? null : hotspot.id)}
                          className="text-xs text-primary"
                        >
                          {editingHotspot === hotspot.id ? 'Done' : 'Edit'}
                        </button>
                        <button
                          onClick={() => {
                            onUpdateScreen(selected.id, {
                              hotspots: selected.hotspots.filter(h => h.id !== hotspot.id),
                            });
                          }}
                          className="text-xs text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {editingHotspot === hotspot.id && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Links to</label>
                          <select
                            value={hotspot.targetScreen}
                            onChange={(e) => {
                              const updated = selected.hotspots.map(h =>
                                h.id === hotspot.id ? { ...h, targetScreen: e.target.value } : h
                              );
                              onUpdateScreen(selected.id, { hotspots: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                          >
                            {screens.filter(s => s.id !== selected.id).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(['x', 'y', 'width', 'height'] as const).map(prop => (
                            <div key={prop} className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">{prop}%</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round(hotspot[prop])}
                                onChange={(e) => {
                                  const updated = selected.hotspots.map(h =>
                                    h.id === hotspot.id ? { ...h, [prop]: parseInt(e.target.value) || 0 } : h
                                  );
                                  onUpdateScreen(selected.id, { hotspots: updated });
                                }}
                                className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Label</label>
                          <Input
                            value={hotspot.label || ''}
                            onChange={(e) => {
                              const updated = selected.hotspots.map(h =>
                                h.id === hotspot.id ? { ...h, label: e.target.value } : h
                              );
                              onUpdateScreen(selected.id, { hotspots: updated });
                            }}
                            placeholder="Button label..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {selected.hotspots.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No hotspots. Add tap zones to connect this screen to others.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
