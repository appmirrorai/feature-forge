import { Badge } from '@appmirror/ui-kit';
import { FeatureMode, MODE_CONFIG, MODE_ORDER } from '../types';

interface ModeSelectorProps {
  currentMode: FeatureMode;
  targetMode: FeatureMode;
  onTargetChange: (mode: FeatureMode) => void;
  disabled?: boolean;
}

export default function ModeSelector({ currentMode, targetMode, onTargetChange, disabled }: ModeSelectorProps) {
  const currentIdx = MODE_ORDER.indexOf(currentMode);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Execution Mode</label>
      <div className="flex gap-2 flex-wrap">
        {MODE_ORDER.map((mode, idx) => {
          const config = MODE_CONFIG[mode];
          const isCurrent = mode === currentMode;
          const isTarget = mode === targetMode;
          const isPast = idx < currentIdx;
          const isSelectable = idx >= currentIdx && !disabled;

          return (
            <button
              key={mode}
              onClick={() => isSelectable && onTargetChange(mode)}
              disabled={!isSelectable}
              className={`
                flex flex-col items-start p-3 rounded-lg border-2 transition-all min-w-[120px]
                ${isTarget ? 'border-primary bg-primary/10' : 'border-border bg-card'}
                ${isPast ? 'opacity-50' : ''}
                ${isSelectable ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-sm font-semibold">{config.label}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">{config.description}</span>
              {isCurrent && (
                <Badge variant="secondary" className="mt-2 text-xs">Current</Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
