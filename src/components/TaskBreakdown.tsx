import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '@appmirror/ui-kit';
import type { FeatureTask, DebtTag, FeatureMode, TaskStatus } from '../types';
import { MODE_CONFIG } from '../types';

interface TaskBreakdownProps {
  tasks: FeatureTask[];
  currentMode: FeatureMode;
  onAddTask: (task: Omit<FeatureTask, 'id' | 'order'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<FeatureTask>) => void;
  onRemoveTask: (taskId: string) => void;
  services: { id: string; name: string }[];
}

const STATUS_STYLES: Record<TaskStatus, { bg: string; label: string }> = {
  pending:     { bg: 'bg-muted',       label: 'Pending' },
  in_progress: { bg: 'bg-blue-500',    label: 'In Progress' },
  done:        { bg: 'bg-green-500',   label: 'Done' },
  blocked:     { bg: 'bg-red-500',     label: 'Blocked' },
};

const DEBT_TAG_LABELS: Record<DebtTag, string> = {
  'mocked':            'Mocked',
  'hardcoded':         'Hardcoded',
  'no-validation':     'No Validation',
  'no-error-handling': 'No Error Handling',
  'no-tests':          'No Tests',
  'no-monitoring':     'No Monitoring',
  'skip-edge-case':    'Edge Case Skipped',
};

export default function TaskBreakdown({ tasks, currentMode, onAddTask, onUpdateTask, onRemoveTask, services }: TaskBreakdownProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle,
      description: newDesc,
      serviceId: newServiceId,
      status: 'pending',
      dependsOn: [],
      blockedBy: [],
      mode: currentMode,
      debtTags: [],
    });
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const toggleDebtTag = (taskId: string, tag: DebtTag, currentTags: DebtTag[]) => {
    const updated = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onUpdateTask(taskId, { debtTags: updated });
  };

  const cycleStatus = (taskId: string, current: TaskStatus) => {
    const order: TaskStatus[] = ['pending', 'in_progress', 'done'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    onUpdateTask(taskId, { status: order[nextIdx] });
  };

  // Group tasks by service
  const grouped = tasks.reduce<Record<string, FeatureTask[]>>((acc, task) => {
    const key = task.serviceId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const debtCount = tasks.reduce((sum, t) => sum + t.debtTags.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Tasks</span>
            <Badge variant="secondary">{doneTasks}/{totalTasks}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {debtCount > 0 && (
              <Badge variant="primary" className="bg-yellow-500 text-yellow-950">
                {debtCount} debt tags
              </Badge>
            )}
            <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)} className="text-xs">
              + Add Task
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : '0%' }}
          />
        </div>

        {/* Add task form */}
        {showAddForm && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
            />
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
            />
            <select
              value={newServiceId}
              onChange={(e) => setNewServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAdd}>Add</Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Grouped task list */}
        {Object.entries(grouped).map(([serviceId, serviceTasks]) => {
          const serviceName = services.find(s => s.id === serviceId)?.name || serviceId;
          return (
            <div key={serviceId} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {serviceName}
              </div>
              {serviceTasks.map(task => {
                const statusStyle = STATUS_STYLES[task.status];
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    {/* Status dot — clickable to cycle */}
                    <button
                      onClick={() => cycleStatus(task.id, task.status)}
                      className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${statusStyle.bg} hover:ring-2 ring-primary/30 transition-all`}
                      title={`Status: ${statusStyle.label} (click to change)`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${MODE_CONFIG[task.mode].color} text-white`}>
                          {MODE_CONFIG[task.mode].label}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      )}

                      {/* Debt tags — only show in prototype/spike mode */}
                      {(currentMode === 'prototype' || currentMode === 'spike') && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {(Object.keys(DEBT_TAG_LABELS) as DebtTag[]).map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleDebtTag(task.id, tag, task.debtTags)}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                task.debtTags.includes(tag)
                                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
                                  : 'border-border text-muted-foreground hover:border-yellow-500/30'
                              }`}
                            >
                              {DEBT_TAG_LABELS[tag]}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Show debt tags as badges in later modes */}
                      {currentMode !== 'prototype' && currentMode !== 'spike' && task.debtTags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {task.debtTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                              {DEBT_TAG_LABELS[tag]}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveTask(task.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks yet. Add your first task or let the tool generate them from the design.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
