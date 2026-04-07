import { Card, CardContent, CardHeader, CardTitle, Badge } from '@appmirror/ui-kit';
import type { Feature, FeatureTask, FeatureMode } from '../types';
import { MODE_CONFIG, MODE_ORDER } from '../types';
import ProgressionPipeline from './ProgressionPipeline';
import FigmaEmbed from './FigmaEmbed';
import TaskBreakdown from './TaskBreakdown';
import BlastRadiusCard from './BlastRadiusCard';
import DebtLedger from './DebtLedger';
import PrototypePreview from './PrototypePreview';

interface FeatureDetailProps {
  feature: Feature;
  onBack: () => void;
  onUpdate: (updates: Partial<Feature>) => void;
  onAddTask: (task: Omit<FeatureTask, 'id' | 'order'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<FeatureTask>) => void;
  onRemoveTask: (taskId: string) => void;
  onOrchestrate?: () => void;
}

export default function FeatureDetail({ feature, onBack, onUpdate, onAddTask, onUpdateTask, onRemoveTask, onOrchestrate }: FeatureDetailProps) {

  const handlePromote = () => {
    const currentIdx = MODE_ORDER.indexOf(feature.currentMode);
    const nextMode = MODE_ORDER[currentIdx + 1];
    if (!nextMode) return;

    // Generate promotion tasks from debt ledger
    const promotionTasks: Omit<FeatureTask, 'id' | 'order'>[] = feature.tasks
      .filter(t => t.debtTags.length > 0)
      .flatMap(t =>
        t.debtTags.map(tag => ({
          title: `[Promotion] Fix "${tag}" in: ${t.title}`,
          description: `Upgrade from ${feature.currentMode} shortcut. Original task had "${tag}" tag.`,
          serviceId: t.serviceId,
          status: 'pending' as const,
          dependsOn: [],
          blockedBy: [],
          mode: nextMode as FeatureMode,
          debtTags: [],
        }))
      );

    // Add promotion tasks
    promotionTasks.forEach(task => onAddTask(task));

    // Update feature mode
    onUpdate({ currentMode: nextMode as FeatureMode, status: 'in_progress' });
  };

  const handleApproval = (notes: string) => {
    const approval = {
      approvedBy: 'current-user',
      approvedAt: new Date().toISOString(),
      screenshotUrls: [],
      scope: `${MODE_CONFIG[feature.currentMode].label} phase approved`,
      notes,
    };
    onUpdate({
      approvals: [...feature.approvals, approval],
      status: 'approved',
    });
  };

  const handleFigmaChange = (url: string) => {
    onUpdate({ figma: url ? { url } : undefined });
  };

  // Compute blast radius
  const blastRadius = {
    score: Math.min(10, Math.round(
      feature.services.length * 1.5 +
      feature.tasks.filter(t => t.debtTags.length > 0).length * 0.5
    )),
    servicesAffected: feature.services.length,
    migrationsNeeded: feature.tasks.filter(t => t.title.toLowerCase().includes('migrat')).length,
    sharedLibChanges: feature.services.includes('shared-lib') ? 1 : 0,
    summary: feature.services.length > 5
      ? 'Wide-reaching feature affecting many services. Consider phased rollout.'
      : feature.services.length > 2
      ? 'Moderate scope. Standard review process recommended.'
      : 'Narrow scope. Low risk.',
  };

  const services = feature.services.map(id => ({ id, name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to features
          </button>
          <h1 className="text-2xl font-bold truncate">{feature.name}</h1>
          {feature.description && (
            <p className="text-muted-foreground text-sm mt-1">{feature.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOrchestrate && !feature.orchestrationPlanId && (
            <button
              onClick={onOrchestrate}
              className="text-xs px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
            >
              Orchestrate Tasks
            </button>
          )}
          {feature.orchestrationPlanId && (
            <Badge variant="primary">Orchestrated</Badge>
          )}
          <Badge variant={feature.status === 'approved' ? 'primary' : 'secondary'}>
            {feature.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Pipeline */}
      <Card>
        <CardContent className="p-4">
          <ProgressionPipeline
            currentMode={feature.currentMode}
            targetMode={feature.targetMode}
            approvals={feature.approvals.map(a => ({
              mode: feature.currentMode,
              approvedAt: a.approvedAt,
            }))}
            onPromote={feature.status === 'approved' ? handlePromote : undefined}
          />
        </CardContent>
      </Card>

      {/* Two column layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Figma */}
          <FigmaEmbed
            url={feature.figma?.url}
            onUrlChange={handleFigmaChange}
            editable
          />

          {/* Prototype preview — show when in prototype mode */}
          {(feature.currentMode === 'prototype' || feature.currentMode === 'spike') && (
            <PrototypePreview
              feature={feature}
              onApprove={feature.status !== 'approved' ? handleApproval : undefined}
            />
          )}

          {/* Tasks */}
          <TaskBreakdown
            tasks={feature.tasks}
            currentMode={feature.currentMode}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onRemoveTask={onRemoveTask}
            services={services}
          />
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Orchestration Intake Summary */}
          {feature.intake && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Orchestration
                  <Badge variant="primary" className="text-[10px]">AI</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div><strong>Problem:</strong> <span className="text-muted-foreground">{feature.intake.problem}</span></div>
                <div><strong>Goal:</strong> <span className="text-muted-foreground">{feature.intake.goal}</span></div>
                {feature.intake.successMetric && (
                  <div><strong>Metric:</strong> <span className="text-muted-foreground">{feature.intake.successMetric}</span></div>
                )}
                <div className="flex gap-1 flex-wrap pt-1">
                  {feature.intake.affectedSurfaces.map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blast Radius */}
          <BlastRadiusCard radius={blastRadius} />

          {/* Debt Ledger */}
          <DebtLedger tasks={feature.tasks} />

          {/* Services list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {services.map(s => (
                <div key={s.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {s.name}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Approvals history */}
          {feature.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Approval History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {feature.approvals.map((a, idx) => (
                  <div key={idx} className="text-xs border-l-2 border-green-500 pl-3 py-1">
                    <div className="font-medium">{a.scope}</div>
                    <div className="text-muted-foreground">{new Date(a.approvedAt).toLocaleDateString()}</div>
                    {a.notes && <div className="text-muted-foreground mt-0.5">{a.notes}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
