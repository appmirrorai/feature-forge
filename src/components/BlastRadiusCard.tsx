import { Card, CardContent, CardHeader, CardTitle } from '@appmirror/ui-kit';
import type { BlastRadius } from '../types';

interface BlastRadiusCardProps {
  radius: BlastRadius;
}

function scoreColor(score: number): string {
  if (score <= 3) return 'text-green-500';
  if (score <= 6) return 'text-yellow-500';
  return 'text-red-500';
}

function scoreBg(score: number): string {
  if (score <= 3) return 'bg-green-500';
  if (score <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function BlastRadiusCard({ radius }: BlastRadiusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Blast Radius</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${scoreColor(radius.score)}`}>
              {radius.score}
            </span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${scoreBg(radius.score)}`}
            style={{ width: `${radius.score * 10}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{radius.servicesAffected}</div>
            <div className="text-xs text-muted-foreground">Services</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{radius.migrationsNeeded}</div>
            <div className="text-xs text-muted-foreground">Migrations</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{radius.sharedLibChanges}</div>
            <div className="text-xs text-muted-foreground">Shared Lib</div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">{radius.summary}</p>

        {radius.score >= 7 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-500 font-medium">High risk — consider a design review before starting</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
