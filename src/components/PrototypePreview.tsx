import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@appmirror/ui-kit';
import type { Feature } from '../types';
import type { PrototypeSchema } from './ios-kit/schema';
import type { ScreenshotData } from './ios-kit/ScreenshotPrototype';
import IOSRenderer from './ios-kit/IOSRenderer';
import ScreenshotPrototype from './ios-kit/ScreenshotPrototype';
import PhoneFrame from './ios-kit/PhoneFrame';
import ScreenFlowEditor from './builder/ScreenFlowEditor';

// Import generated files — these are created by the mirror/screenshot scripts
import generatedMirror from '../generated/prototype-schema.json';

import generatedScreenshots from '../generated/screenshots.json';

type ProtoMode = 'screenshots' | 'mirror' | 'interactive';

interface PrototypePreviewProps {
  feature: Feature;
  onApprove?: (notes: string) => void;
  onFeedback?: (feedback: string) => void;
}

const MODE_INFO: Record<ProtoMode, { label: string; desc: string; icon: string }> = {
  screenshots:  { label: 'Screenshots',  desc: 'Real app screenshots with hotspot navigation', icon: '📸' },
  mirror:       { label: 'SwiftUI Mirror', desc: 'Auto-generated from SwiftUI source files',    icon: '🪞' },
  interactive:  { label: 'Interactive',   desc: 'React prototype with demo data',               icon: '⚡' },
};

export default function PrototypePreview({ feature, onApprove, onFeedback }: PrototypePreviewProps) {
  const [mode, setMode] = useState<ProtoMode>(generatedScreenshots.screens.length > 0 ? 'screenshots' : 'mirror');
  const [feedbackText, setFeedbackText] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApproval, setShowApproval] = useState(false);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Local screenshot data state (for editing hotspots)
  const [screenshotData, setScreenshotData] = useState<ScreenshotData>(
    generatedScreenshots as ScreenshotData
  );

  // Mirror schema
  const hasMirror = generatedMirror && Object.keys((generatedMirror as PrototypeSchema).screens || {}).length > 0;
  const mirrorSchema: PrototypeSchema = hasMirror ? (generatedMirror as PrototypeSchema) : {
    id: feature.id,
    name: feature.name,
    screens: {
      main: {
        type: 'Screen',
        children: [
          { type: 'NavBar', title: feature.name },
          { type: 'LargeTitle', title: feature.name },
          { type: 'EmptyState', icon: '🪞', title: 'No SwiftUI Mirror', message: 'Run: npm run mirror /path/to/ios-app/Sources', buttonLabel: 'Learn More' },
        ],
      },
    },
    entryScreen: 'main',
  };

  // Interactive schema — built from feature data
  const interactiveSchema: PrototypeSchema = {
    id: feature.id,
    name: feature.name,
    screens: {
      home: {
        type: 'Screen',
        children: [
          { type: 'NavBar', title: feature.name },
          { type: 'LargeTitle', title: feature.name },
          { type: 'SearchBar', placeholder: 'Search...' },
          {
            type: 'Section',
            header: 'Overview',
            children: [
              { type: 'Row', label: feature.description || 'Feature description' },
            ],
          },
          {
            type: 'Section',
            header: `Services (${feature.services.length})`,
            children: feature.services.map(id => ({
              type: 'Row' as const,
              icon: '●',
              iconColor: `hsl(${id.charCodeAt(0) * 15}, 55%, 50%)`,
              label: id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              chevron: true,
            })),
          },
          ...(feature.tasks.length > 0 ? [{
            type: 'Section' as const,
            header: `Tasks (${feature.tasks.filter(t => t.status === 'done').length}/${feature.tasks.length})`,
            children: feature.tasks.slice(0, 5).map(t => ({
              type: 'Row' as const,
              icon: t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔵' : '⚪',
              label: t.title,
              subtitle: t.serviceId,
            })),
          }] : []),
          { type: 'Spacer', height: 16 },
          { type: 'Button', label: 'Start Building', style: 'filled' as const, full: true },
        ],
        tabBar: {
          type: 'TabBar',
          tabs: [
            { icon: '🏠', label: 'Home' },
            { icon: '📋', label: 'Tasks' },
            { icon: '👤', label: 'Profile' },
          ],
          activeIndex: 0,
        },
      },
    },
    entryScreen: 'home',
  };

  const handleUpdateScreen = (screenId: string, updates: Partial<ScreenshotData['screens'][0]>) => {
    setScreenshotData(prev => ({
      ...prev,
      screens: prev.screens.map(s => s.id === screenId ? { ...s, ...updates } : s),
    }));
  };

  const availableModes = [
    ...(screenshotData.screens.length > 0 ? ['screenshots' as const] : []),
    'mirror' as const,
    'interactive' as const,
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Prototype Preview</span>
              <Badge variant="primary">{feature.currentMode}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'screenshots' && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`text-xs px-2 py-1 rounded ${editMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {editMode ? 'Done Editing' : 'Edit Hotspots'}
                </button>
              )}
              {mode === 'screenshots' && (
                <button
                  onClick={() => setShowFlowEditor(!showFlowEditor)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showFlowEditor ? 'Hide Flow' : 'Flow Editor'}
                </button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode selector */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {availableModes.map(m => {
              const info = MODE_INFO[m];
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all flex-1 justify-center
                    ${mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode description */}
          <div className="text-xs text-muted-foreground text-center">
            {MODE_INFO[mode].desc}
          </div>

          {/* Flow editor (screenshots mode) */}
          {showFlowEditor && mode === 'screenshots' && (
            <ScreenFlowEditor
              screens={screenshotData.screens}
              onUpdateScreen={handleUpdateScreen}
              onReorder={() => {}}
            />
          )}

          {/* Phone frame with active renderer */}
          <PhoneFrame>
            {mode === 'screenshots' && (
              <ScreenshotPrototype
                data={screenshotData}
                editMode={editMode}
                onEditHotspot={(screenId, hotspot) => {
                  const screen = screenshotData.screens.find(s => s.id === screenId);
                  if (screen) {
                    handleUpdateScreen(screenId, {
                      hotspots: [...screen.hotspots, hotspot],
                    });
                  }
                }}
              />
            )}
            {mode === 'mirror' && (
              <IOSRenderer schema={mirrorSchema} />
            )}
            {mode === 'interactive' && (
              <IOSRenderer schema={interactiveSchema} />
            )}
          </PhoneFrame>

          {/* CLI hints */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {mode === 'screenshots' && <span>Run <code className="px-1 py-0.5 bg-background rounded">npm run screenshots /path/to/screenshots --watch</code> for live sync</span>}
            {mode === 'mirror' && <span>Run <code className="px-1 py-0.5 bg-background rounded">npm run mirror /path/to/ios/Sources --watch</code> for live sync</span>}
            {mode === 'interactive' && <span>Interactive prototype built from feature data. Edit tasks and services to update.</span>}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Leave feedback on this prototype..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[80px] resize-y"
            />
            <div className="flex gap-2">
              {onFeedback && (
                <Button
                  variant="secondary"
                  onClick={() => { onFeedback(feedbackText); setFeedbackText(''); }}
                  disabled={!feedbackText.trim()}
                >
                  Send Feedback
                </Button>
              )}
              {onApprove && (
                <Button variant="primary" onClick={() => setShowApproval(!showApproval)}>
                  Approve Prototype
                </Button>
              )}
            </div>
          </div>

          {/* Approval */}
          {showApproval && onApprove && (
            <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5 space-y-3">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Approving this prototype means the feature moves to the next stage.
              </div>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Approval notes (optional)..."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[60px] resize-y"
              />
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => { onApprove(approvalNotes); setShowApproval(false); setApprovalNotes(''); }}>
                  Confirm Approval
                </Button>
                <Button variant="secondary" onClick={() => setShowApproval(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
