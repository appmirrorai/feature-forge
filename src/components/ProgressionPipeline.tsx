import { Badge } from '@appmirror/ui-kit';
import { FeatureMode, MODE_CONFIG, MODE_ORDER } from '../types';

interface ProgressionPipelineProps {
  currentMode: FeatureMode;
  targetMode: FeatureMode;
  approvals: { mode: FeatureMode; approvedAt: string }[];
  onPromote?: () => void;
}

export default function ProgressionPipeline({ currentMode, targetMode, approvals, onPromote }: ProgressionPipelineProps) {
  const currentIdx = MODE_ORDER.indexOf(currentMode);
  const targetIdx = MODE_ORDER.indexOf(targetMode);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Feature Pipeline</label>

      {/* Pipeline visualization */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {MODE_ORDER.map((mode, idx) => {
          const config = MODE_CONFIG[mode];
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isTarget = idx === targetIdx;
          const isFuture = idx > currentIdx;
          const isApproved = approvals.some(a => a.mode === mode);

          return (
            <div key={mode} className="flex items-center">
              {/* Node */}
              <div className={`
                flex flex-col items-center min-w-[80px] sm:min-w-[100px]
              `}>
                {/* Circle */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone ? `${config.color} border-transparent` : ''}
                  ${isCurrent ? `${config.color} border-transparent ring-4 ring-primary/20` : ''}
                  ${isFuture ? 'bg-muted border-border' : ''}
                `}>
                  {isDone ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 bg-muted-foreground/30 rounded-full" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-medium mt-1.5 ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {config.label}
                </span>

                {/* Status badges */}
                {isApproved && <Badge variant="primary" className="text-[10px] mt-1">Approved</Badge>}
                {isTarget && !isCurrent && <Badge variant="secondary" className="text-[10px] mt-1">Target</Badge>}
              </div>

              {/* Connector line */}
              {idx < MODE_ORDER.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 -mx-1 ${idx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Promote button */}
      {onPromote && currentIdx < targetIdx && (
        <button
          onClick={onPromote}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Promote to {MODE_CONFIG[MODE_ORDER[currentIdx + 1]]?.label}
        </button>
      )}
    </div>
  );
}
