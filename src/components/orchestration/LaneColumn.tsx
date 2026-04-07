import { useState } from 'react';
import { Badge, Button } from '@appmirror/ui-kit';
import type { OrchestrationTask, LaneDecision } from '../../types';
import { LANE_CONFIG } from './constants';
import TaskNodeCard from './TaskNodeCard';

interface LaneColumnProps {
  decision: LaneDecision;
  tasks: OrchestrationTask[];
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  onToggleLane?: (lane: string, enabled: boolean) => void;
  onUpdateTask?: (task: OrchestrationTask) => void;
}

export default function LaneColumn({ decision, tasks, selectedTaskId, onSelectTask, onToggleLane, onUpdateTask }: LaneColumnProps) {
  const [expanded, setExpanded] = useState(decision.needed);
  const config = LANE_CONFIG[decision.lane];
  const highRiskCount = tasks.filter(t => t.riskFlags.some(rf => rf.severity === 'high')).length;

  return (
    <div className={`rounded-lg border ${decision.needed ? 'border-border' : 'border-dashed border-muted opacity-60'}`}>
      {/* Lane header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <span className="text-sm font-semibold">{config.label}</span>
          <Badge variant="secondary" className="text-[10px]">{tasks.length} tasks</Badge>
          {highRiskCount > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {highRiskCount} risk
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onToggleLane && (
            <Button
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onToggleLane(decision.lane, !decision.needed); }}
              className="text-[10px] px-2 py-0.5 h-auto"
            >
              {decision.needed ? 'Disable' : 'Enable'}
            </Button>
          )}
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Lane reasoning */}
      {expanded && decision.reasoning && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground italic">{decision.reasoning}</p>
          {decision.repos.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {decision.repos.map(repo => (
                <span key={repo} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{repo}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks */}
      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          {tasks.map(task => (
            <TaskNodeCard
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onClick={() => onSelectTask?.(task.id)}
              onUpdate={onUpdateTask}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks in this lane</p>
          )}
        </div>
      )}
    </div>
  );
}
