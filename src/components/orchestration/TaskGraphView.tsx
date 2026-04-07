import { useMemo, useState } from 'react';
import type { OrchestrationTask, TaskGraphEdge } from '../../types';
import { LANE_CONFIG, LANE_ORDER } from './constants';

interface TaskGraphViewProps {
  tasks: OrchestrationTask[];
  edges: TaskGraphEdge[];
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
  task: OrchestrationTask;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const COL_GAP = 40;
const ROW_GAP = 30;
const PADDING = 40;

export default function TaskGraphView({ tasks, edges, selectedTaskId, onSelectTask }: TaskGraphViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { positions, svgWidth, svgHeight } = useMemo(() => {
    if (tasks.length === 0) return { positions: [], svgWidth: 400, svgHeight: 200 };

    // Topological sort to assign levels
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const levels = new Map<string, number>();

    function getLevel(id: string, visited = new Set<string>()): number {
      if (levels.has(id)) return levels.get(id)!;
      if (visited.has(id)) return 0; // cycle protection
      visited.add(id);

      const task = taskMap.get(id);
      if (!task || task.dependsOn.length === 0) {
        levels.set(id, 0);
        return 0;
      }

      const maxDep = Math.max(...task.dependsOn.map(dep => getLevel(dep, visited)));
      const level = maxDep + 1;
      levels.set(id, level);
      return level;
    }

    tasks.forEach(t => getLevel(t.id));

    // Group by lane, get lane order
    const activeLanes = [...new Set(tasks.map(t => t.lane))];
    const sortedLanes = LANE_ORDER.filter(l => activeLanes.includes(l));

    // Position nodes: X by lane column, Y by level
    const laneIndex = new Map(sortedLanes.map((l, i) => [l, i]));
    const maxLevel = Math.max(...Array.from(levels.values()), 0);

    // Track how many nodes are at each (lane, level) to stack them
    const slotCount = new Map<string, number>();

    for (const task of tasks) {
      const key = `${task.lane}-${levels.get(task.id) ?? 0}`;
      slotCount.set(key, (slotCount.get(key) || 0) + 1);
    }

    const countAssigned = new Map<string, number>();
    const nodePositions: NodePosition[] = tasks.map(task => {
      const level = levels.get(task.id) ?? 0;
      const col = laneIndex.get(task.lane) ?? 0;
      const key = `${task.lane}-${level}`;
      const idx = countAssigned.get(key) || 0;
      countAssigned.set(key, idx + 1);

      const yOffset = idx * (NODE_HEIGHT + 10);

      return {
        x: PADDING + col * (NODE_WIDTH + COL_GAP),
        y: PADDING + level * (NODE_HEIGHT + ROW_GAP) + yOffset,
        task,
      };
    });

    const w = PADDING * 2 + sortedLanes.length * (NODE_WIDTH + COL_GAP) - COL_GAP;
    const h = PADDING * 2 + (maxLevel + 1) * (NODE_HEIGHT + ROW_GAP) +
      Math.max(...Array.from(slotCount.values()).map(v => v - 1), 0) * (NODE_HEIGHT + 10);

    return { positions: nodePositions, svgWidth: Math.max(w, 400), svgHeight: Math.max(h, 200) };
  }, [tasks, edges]);

  const posMap = useMemo(() => new Map(positions.map(p => [p.task.id, p])), [positions]);

  // Determine which edges are connected to hovered/selected node
  const highlightedEdges = useMemo(() => {
    const active = hoveredId || selectedTaskId;
    if (!active) return new Set<number>();
    const set = new Set<number>();
    edges.forEach((e, i) => {
      if (e.fromTaskId === active || e.toTaskId === active) set.add(i);
    });
    return set;
  }, [hoveredId, selectedTaskId, edges]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No tasks to visualize
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-muted/20">
      <svg width={svgWidth} height={svgHeight} className="min-w-full">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = posMap.get(edge.fromTaskId);
          const to = posMap.get(edge.toTaskId);
          if (!from || !to) return null;

          const x1 = from.x + NODE_WIDTH / 2;
          const y1 = from.y + NODE_HEIGHT;
          const x2 = to.x + NODE_WIDTH / 2;
          const y2 = to.y;

          const midY = (y1 + y2) / 2;
          const isHighlighted = highlightedEdges.has(i);

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              stroke={isHighlighted ? (edge.type === 'blocks' ? '#ef4444' : '#6b7280') : '#d1d5db'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={edge.type === 'informs' ? '4 4' : undefined}
              opacity={highlightedEdges.size > 0 && !isHighlighted ? 0.2 : 1}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Nodes */}
        {positions.map(({ x, y, task }) => {
          const config = LANE_CONFIG[task.lane];
          const isSelected = task.id === selectedTaskId;
          const isHovered = task.id === hoveredId;
          const highRisk = task.riskFlags.some(rf => rf.severity === 'high');

          return (
            <g
              key={task.id}
              onClick={() => onSelectTask?.(task.id)}
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                className={`
                  ${isSelected || isHovered ? 'fill-primary/10 stroke-primary' : 'fill-card stroke-border'}
                  ${highRisk ? 'stroke-red-400' : ''}
                `}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Lane color bar */}
              <rect
                x={x}
                y={y}
                width={4}
                height={NODE_HEIGHT}
                rx={2}
                className={config.color}
              />
              {/* Title */}
              <text
                x={x + 12}
                y={y + 20}
                className="text-xs font-medium fill-foreground"
                style={{ fontSize: 11 }}
              >
                {task.title.length > 22 ? task.title.slice(0, 22) + '...' : task.title}
              </text>
              {/* Service */}
              <text
                x={x + 12}
                y={y + 36}
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {task.serviceId !== 'none' ? task.serviceId : task.lane}
              </text>
              {/* Badges */}
              <text
                x={x + 12}
                y={y + 52}
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {task.acceptanceCriteria.length} AC
                {task.dependsOn.length > 0 ? ` · ${task.dependsOn.length} deps` : ''}
                {highRisk ? ' · RISK' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
