import { useState, useCallback } from 'react';
import { Card, CardContent, Button, Label } from '@appmirror/ui-kit';
import type { FeatureIntake, WorkType } from '../../types';

interface IntakeFormProps {
  onSubmit: (intake: FeatureIntake, services: string[], targetMode: string) => void;
  onCancel: () => void;
  apiBase?: string;
  initialIntake?: Partial<FeatureIntake>;
}

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug Fix' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'migration', label: 'Migration' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'other', label: 'Other' },
];

type InternalStep = 'describe' | 'enriching' | 'review';

export default function IntakeForm({ onSubmit, onCancel, apiBase = '', initialIntake }: IntakeFormProps) {
  const [internalStep, setInternalStep] = useState<InternalStep>('describe');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState<WorkType>((initialIntake?.workType as WorkType) || 'feature');
  const [figmaUrl, setFigmaUrl] = useState(initialIntake?.figmaUrl || '');
  const [intake, setIntake] = useState<FeatureIntake | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setInternalStep('enriching');
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/orchestrate/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, workType, figmaUrl: figmaUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrichment failed');
      setIntake({ ...data.intake, figmaUrl: figmaUrl.trim() || undefined });
      setInternalStep('review');
    } catch (err: any) {
      setError(err.message);
      setInternalStep('describe');
    }
  }, [apiBase, description, workType]);

  const updateIntake = <K extends keyof FeatureIntake>(key: K, value: FeatureIntake[K]) => {
    setIntake(prev => prev ? { ...prev, [key]: value } : prev);
  };

  // ── Describe step ────────────────────────────────────────────
  if (internalStep === 'describe') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orchestrate</h1>
            <p className="text-muted-foreground text-sm">Tell me what you want to do — I'll handle the rest.</p>
          </div>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">&times;</button>
          </div>
        )}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="description">What do you want to do?</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I want to add a rate limit for likes so free users can only like 10 posts per day, but users who were premium before should be grandfathered in..."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[140px] resize-y"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-type">Type</Label>
                <select
                  id="work-type"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as WorkType)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
                >
                  {WORK_TYPES.map(wt => (
                    <option key={wt.value} value={wt.value}>{wt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="figma-url">Figma link <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <input
                  id="figma-url"
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://figma.com/file/..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!description.trim()}
          >
            Generate Brief →
          </Button>
        </div>
      </div>
    );
  }

  // ── Enriching step ───────────────────────────────────────────
  if (internalStep === 'enriching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Generating your brief...</p>
      </div>
    );
  }

  // ── Review step ──────────────────────────────────────────────
  if (!intake) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Brief</h1>
          <p className="text-muted-foreground text-sm">Edit anything before decomposing into tasks.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInternalStep('describe')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Start over
          </button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-title">Title</Label>
              <input
                id="r-title"
                value={intake.title}
                onChange={(e) => updateIntake('title', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-type">Type</Label>
              <select
                id="r-type"
                value={intake.workType}
                onChange={(e) => updateIntake('workType', e.target.value as WorkType)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
              >
                {WORK_TYPES.map(wt => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-problem">Problem</Label>
            <textarea
              id="r-problem"
              value={intake.problem}
              onChange={(e) => updateIntake('problem', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[80px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-goal">Goal</Label>
            <textarea
              id="r-goal"
              value={intake.goal}
              onChange={(e) => updateIntake('goal', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[80px] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-user-impact">User Impact</Label>
              <textarea
                id="r-user-impact"
                value={intake.userImpact}
                onChange={(e) => updateIntake('userImpact', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[80px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-biz-impact">Business Impact</Label>
              <textarea
                id="r-biz-impact"
                value={intake.businessImpact}
                onChange={(e) => updateIntake('businessImpact', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[80px] resize-y"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-metric">Success Metric</Label>
              <input
                id="r-metric"
                value={intake.successMetric}
                onChange={(e) => updateIntake('successMetric', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-figma">Figma link <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <input
                id="r-figma"
                type="url"
                value={intake.figmaUrl || ''}
                onChange={(e) => updateIntake('figmaUrl', e.target.value || undefined)}
                placeholder="https://figma.com/file/..."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => onSubmit(intake, [], 'production')}
          disabled={!intake.title.trim() || !intake.problem.trim()}
        >
          Decompose into Tasks →
        </Button>
      </div>
    </div>
  );
}
