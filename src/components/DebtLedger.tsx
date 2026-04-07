import { Card, CardContent, CardHeader, CardTitle, Badge } from '@appmirror/ui-kit';
import type { FeatureTask, DebtTag } from '../types';

interface DebtLedgerProps {
  tasks: FeatureTask[];
}

const DEBT_TAG_LABELS: Record<DebtTag, string> = {
  'mocked':            'Mocked',
  'hardcoded':         'Hardcoded',
  'no-validation':     'No Validation',
  'no-error-handling': 'No Error Handling',
  'no-tests':          'No Tests',
  'no-monitoring':     'No Monitoring',
  'skip-edge-case':    'Edge Case Skipped',
};

export default function DebtLedger({ tasks }: DebtLedgerProps) {
  const debtItems = tasks.flatMap(task =>
    task.debtTags.map(tag => ({ taskId: task.id, taskTitle: task.title, serviceId: task.serviceId, tag }))
  );

  if (debtItems.length === 0) return null;

  // Group by tag
  const grouped = debtItems.reduce<Record<string, typeof debtItems>>((acc, item) => {
    if (!acc[item.tag]) acc[item.tag] = [];
    acc[item.tag].push(item);
    return acc;
  }, {});

  return (
    <Card className="border-yellow-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Debt Ledger</span>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
            {debtItems.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Shortcuts taken during prototype. These become production tasks on promotion.
        </p>
        {Object.entries(grouped).map(([tag, items]) => (
          <div key={tag} className="space-y-1">
            <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              {DEBT_TAG_LABELS[tag as DebtTag]} ({items.length})
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="text-xs text-muted-foreground pl-3 border-l-2 border-yellow-500/30">
                {item.taskTitle}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
