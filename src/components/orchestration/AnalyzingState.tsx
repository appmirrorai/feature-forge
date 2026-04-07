import { useState, useEffect } from 'react';
import { Card, CardContent } from '@appmirror/ui-kit';
import { LANE_CONFIG, LANE_ORDER } from './constants';

const PROGRESS_MESSAGES = [
  'Reading system context...',
  'Analyzing affected services...',
  'Decomposing into execution lanes...',
  'Mapping dependencies...',
  'Building task graph...',
  'Generating acceptance criteria...',
  'Calculating risk flags...',
  'Finalizing plan...',
];

export default function AnalyzingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [revealedLanes, setRevealedLanes] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2000);

    const laneTimer = setInterval(() => {
      setRevealedLanes(prev => Math.min(prev + 1, LANE_ORDER.length));
    }, 800);

    return () => { clearInterval(msgTimer); clearInterval(laneTimer); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Decomposing...</h2>
        <p className="text-muted-foreground text-sm animate-pulse">
          {PROGRESS_MESSAGES[messageIndex]}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {LANE_ORDER.map((lane, i) => {
          const config = LANE_CONFIG[lane];
          const revealed = i < revealedLanes;
          return (
            <Card
              key={lane}
              className={`transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <CardContent className="p-3 text-center">
                <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-2`} />
                <div className="text-xs font-medium">{config.label}</div>
                {revealed && (
                  <div className="mt-2 space-y-1">
                    <div className="h-2 bg-muted rounded animate-pulse" />
                    <div className="h-2 bg-muted rounded animate-pulse w-3/4 mx-auto" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
