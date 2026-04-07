import type { ExecutionLane, AffectedSurface } from '../../types';

// ── Lane Configuration ──────────────────────────────────────────
export interface LaneConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  defaultServices: string[];
}

export const LANE_CONFIG: Record<ExecutionLane, LaneConfig> = {
  design: {
    label: 'Design',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    textColor: 'text-pink-700 dark:text-pink-300',
    description: 'UI/UX design tasks, mockups, prototypes',
    defaultServices: [],
  },
  backend: {
    label: 'Backend',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    description: 'API, database, business logic',
    defaultServices: ['user-service', 'notification-service', 'payment-service', 'api-gateway'],
  },
  web: {
    label: 'Web',
    color: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300',
    description: 'Web frontend changes',
    defaultServices: ['web-app'],
  },
  ios: {
    label: 'iOS',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    description: 'iPhone & iPad app',
    defaultServices: ['ios-app'],
  },
  android: {
    label: 'Android',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    description: 'Android app',
    defaultServices: ['android-app'],
  },
  qa: {
    label: 'QA',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300',
    description: 'Testing, regression plans',
    defaultServices: [],
  },
  analytics: {
    label: 'Analytics',
    color: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    description: 'Event tracking, dashboards',
    defaultServices: [],
  },
  docs: {
    label: 'Docs',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-700 dark:text-amber-300',
    description: 'Documentation updates',
    defaultServices: [],
  },
  infra: {
    label: 'Infra',
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-300',
    description: 'Infrastructure, CI/CD, deployment',
    defaultServices: [],
  },
  release: {
    label: 'Release',
    color: 'bg-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    textColor: 'text-violet-700 dark:text-violet-300',
    description: 'Rollout coordination, feature flags',
    defaultServices: [],
  },
};

export const LANE_ORDER: ExecutionLane[] = [
  'design', 'backend', 'web', 'ios', 'android', 'qa', 'analytics', 'docs', 'infra', 'release',
];

// ── Surface Options ─────────────────────────────────────────────
export interface SurfaceOption {
  id: AffectedSurface;
  label: string;
  description: string;
}

export const SURFACE_OPTIONS: SurfaceOption[] = [
  { id: 'backend',  label: 'Backend',   description: 'APIs, services, database' },
  { id: 'ios',      label: 'iOS',       description: 'iPhone & iPad app' },
  { id: 'android',  label: 'Android',   description: 'Android app' },
  { id: 'web',      label: 'Web',       description: 'Web frontend' },
  { id: 'design',   label: 'Design',    description: 'UI/UX mockups' },
  { id: 'analytics',label: 'Analytics', description: 'Events, dashboards' },
  { id: 'qa',       label: 'QA',        description: 'Testing, regression' },
  { id: 'docs',     label: 'Docs',      description: 'Documentation' },
  { id: 'release',  label: 'Release',   description: 'Rollout, feature flags' },
  { id: 'infra',    label: 'Infra',     description: 'Infrastructure, CI/CD' },
  { id: 'auth',     label: 'Auth',      description: 'Authentication, SSO' },
  { id: 'billing',  label: 'Billing',   description: 'Payments, subscriptions' },
  { id: 'security', label: 'Security',  description: 'Security review needed' },
];
