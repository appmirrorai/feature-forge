import { useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Button } from '@appmirror/ui-kit';
import type { Service } from '../types';

// Default services — in production these would come from the API
const DEFAULT_SERVICES: Service[] = [
  { id: 'user-service',         name: 'User Service',         repo: 'user-service',         type: 'backend',        description: 'Auth, profiles, permissions' },
  { id: 'notification-service', name: 'Notification Service', repo: 'notification-service', type: 'backend',        description: 'Email, push, SMS' },
  { id: 'payment-service',      name: 'Payment Service',      repo: 'payment-service',      type: 'backend',        description: 'Billing, subscriptions' },
  { id: 'api-gateway',          name: 'API Gateway',          repo: 'api-gateway',          type: 'backend',        description: 'Request routing, rate limiting' },
  { id: 'ios-app',              name: 'iOS App',              repo: 'ios-app',              type: 'mobile-ios',     description: 'iPhone & iPad app' },
  { id: 'android-app',          name: 'Android App',          repo: 'android-app',          type: 'mobile-android', description: 'Android app' },
  { id: 'web-app',              name: 'Web App',              repo: 'web-app',              type: 'frontend',       description: 'Main web frontend' },
  { id: 'shared-lib',           name: 'Shared Library',       repo: 'shared-lib',           type: 'shared-lib',     description: 'Shared types, utils, protos' },
];

const TYPE_COLORS: Record<Service['type'], string> = {
  'backend':        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'frontend':       'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'mobile-ios':     'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'mobile-android': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'shared-lib':     'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'infra':          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

interface ServicePickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  services?: Service[];
}

export default function ServicePicker({ selectedIds, onChange, services = DEFAULT_SERVICES }: ServicePickerProps) {
  const [filter, setFilter] = useState('');

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.type.toLowerCase().includes(filter.toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Services Affected</span>
          <Badge variant="secondary">{selectedIds.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter services..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {filtered.map(service => {
            const selected = selectedIds.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggle(service.id)}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all
                  ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}
                `}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                  {selected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{service.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[service.type]}`}>
                      {service.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <Button variant="secondary" onClick={() => onChange(services.map(s => s.id))} className="text-xs">
          Select All
        </Button>
      </CardContent>
    </Card>
  );
}
