import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join as joinPath } from 'path';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Static files ────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.use(express.static(join(__dirname, 'dist/assets')));

// ── Health check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Orchestration API ───────────────────────────────────────────

// Lazy-load SDK clients (only initialized when first called)
let anthropicClient = null;
let linearClient = null;

async function getAnthropicClient() {
  if (!anthropicClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

async function getLinearClient() {
  if (!linearClient) {
    const { LinearClient } = await import('@linear/sdk');
    linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
  }
  return linearClient;
}

function generateId() {
  return `ot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── GitNexus service auto-detection ────────────────────────────

// Surface → keywords to match against repo names/descriptions/topics
const SURFACE_REPO_PATTERNS = {
  backend:   ['service', 'api', 'server', 'backend', 'grpc', 'worker', 'gateway', 'queue',
               'users', 'user', 'chat', 'notifications', 'notification', 'recommender',
               'websocket', 'socket', 'reports', 'report', 'counters', 'counter',
               'trails', 'monitoring', 'monitor', 'download', 'video', 'calls'],
  ios:       ['ios', 'iphone', 'swift', 'apple', 'xcode'],
  android:   ['android', 'kotlin', 'gradle'],
  web:       ['web', 'frontend', 'dashboard', 'portal', 'admin', 'webapp', 'react'],
  auth:      ['auth', 'identity', 'login', 'oauth', 'sso', 'session', 'cognito', 'jwt'],
  billing:   ['billing', 'payment', 'subscription', 'stripe', 'revenue', 'purchase',
               'purchases', 'in-app', 'iap'],
  analytics: ['analytics', 'tracking', 'tracker', 'metrics', 'data', 'events',
               'event', 'appsflyer', 'facebook', 'collector', 'lake', 'bridge'],
  infra:     ['infra', 'infrastructure', 'k8s', 'kubernetes', 'terraform', 'helm',
               'ops', 'deploy', 'pipeline', 'ci', 'scripts', 'certs', 'certs'],
  docs:      ['docs', 'documentation', 'wiki', 'guide', 'contributing'],
  security:  ['security', 'vault', 'secret', 'crypt', 'certs', 'certificates'],
  design:    ['design', 'figma', 'ui-kit', 'storybook', 'components', 'icons'],
  qa:        ['test', 'qa', 'e2e', 'selenium', 'playwright', 'cypress'],
  release:   ['release', 'cd', 'ci', 'pipeline', 'fastlane'],
  shared:    ['shared', 'lib', 'libs', 'common', 'proto', 'protobuf', 'types', 'sdk', 'utils'],
};

// Scan a local monorepo directory to discover services (fast, no API needed)
async function detectServicesFromLocalPath(localPath, affectedSurfaces) {
  if (!localPath || !existsSync(localPath)) return null;

  try {
    const entries = readdirSync(localPath, { withFileTypes: true });
    const services = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = joinPath(localPath, entry.name);

      // Read package.json for name/description
      let pkgName = entry.name;
      let pkgDescription = '';
      let pkgKeywords = [];
      const pkgPath = joinPath(dir, 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
          pkgName = pkg.name || entry.name;
          pkgDescription = pkg.description || '';
          pkgKeywords = pkg.keywords || [];
        } catch { /* ignore parse errors */ }
      }

      // Read CLAUDE.md for richer description
      let claudeDesc = '';
      const claudePath = joinPath(dir, 'CLAUDE.md');
      if (existsSync(claudePath)) {
        try {
          const content = readFileSync(claudePath, 'utf8');
          // Grab first non-empty line after the title
          const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
          claudeDesc = lines[0]?.trim().slice(0, 120) || '';
        } catch { /* ignore */ }
      }

      const description = claudeDesc || pkgDescription || '';
      const text = [entry.name, pkgName, description, ...pkgKeywords].join(' ').toLowerCase();

      // Infer lane from name/description
      let lane = 'backend';
      if (/ios|swift|iphone|apple/.test(text)) lane = 'ios';
      else if (/android|kotlin|gradle/.test(text)) lane = 'android';
      else if (/web|frontend|dashboard|admin|react/.test(text)) lane = 'web';
      else if (/infra|infrastructure|k8s|terraform|scripts|certs/.test(text)) lane = 'infra';
      else if (/lib|libs|shared|proto|sdk|icons/.test(text)) lane = 'shared-lib';

      services.push({ id: entry.name, name: pkgName, description, lane, repoUrl: '' });
    }

    // Return all services — let Claude determine which are relevant to the feature
    return services.length > 0 ? services : null;
  } catch (err) {
    console.warn('Local path scan failed:', err.message);
    return null;
  }
}

async function detectServicesFromGitNexus(affectedSurfaces) {
  // Try local path first (faster, no network)
  const localPath = process.env.GITNEXUS_LOCAL_PATH;
  if (localPath) {
    const local = await detectServicesFromLocalPath(localPath, affectedSurfaces);
    if (local) return local;
  }

  const baseUrl = process.env.GITNEXUS_URL;
  const token = process.env.GITNEXUS_TOKEN;
  const org = process.env.GITNEXUS_ORG;

  if (!baseUrl || !token) return null; // Not configured — fall back to hardcoded services

  try {
    const headers = { Authorization: `token ${token}`, Accept: 'application/json' };

    // Fetch all repos (paginate up to 3 pages of 50)
    let allRepos = [];
    for (let page = 1; page <= 3; page++) {
      const url = org
        ? `${baseUrl}/api/v1/orgs/${org}/repos?limit=50&page=${page}`
        : `${baseUrl}/api/v1/repos/search?limit=50&page=${page}`;
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!resp.ok) break;
      const json = await resp.json();
      const repos = Array.isArray(json) ? json : (json.data || []);
      if (!repos.length) break;
      allRepos = allRepos.concat(repos);
      if (repos.length < 50) break;
    }

    if (!allRepos.length) return null;

    // Build relevance keywords from the selected surfaces
    const surfaceKeywords = new Set();
    for (const surface of (affectedSurfaces || [])) {
      const patterns = SURFACE_REPO_PATTERNS[surface] || [];
      patterns.forEach(p => surfaceKeywords.add(p));
    }
    // Always include shared/lib repos — they're always potentially relevant
    SURFACE_REPO_PATTERNS.shared.forEach(p => surfaceKeywords.add(p));

    // Score each repo by how many keywords match its name/description/topics
    const scored = allRepos.map(repo => {
      const text = [
        repo.name || '',
        repo.description || '',
        ...(repo.topics || []),
      ].join(' ').toLowerCase();

      let score = 0;
      let matchedKeywords = [];
      for (const kw of surfaceKeywords) {
        if (text.includes(kw)) {
          score++;
          matchedKeywords.push(kw);
        }
      }
      return { repo, score, matchedKeywords };
    });

    // Keep repos with at least 1 keyword match, sorted by score desc.
    // If fewer than 5 matched (narrow org with non-standard names), return all repos —
    // Claude can infer relevance better than keyword matching can.
    const matched = scored.filter(s => s.score > 0);
    const relevant = (matched.length >= 5 ? matched : scored)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    // Map to service descriptors
    const services = relevant.map(({ repo, matchedKeywords }) => {
      // Infer lane from keywords
      let lane = 'backend';
      if (matchedKeywords.some(k => ['ios', 'swift', 'iphone', 'apple'].includes(k))) lane = 'ios';
      else if (matchedKeywords.some(k => ['android', 'kotlin'].includes(k))) lane = 'android';
      else if (matchedKeywords.some(k => ['web', 'frontend', 'dashboard', 'portal', 'admin', 'webapp'].includes(k))) lane = 'web';
      else if (matchedKeywords.some(k => ['infra', 'k8s', 'terraform', 'helm', 'ops'].includes(k))) lane = 'infra';
      else if (matchedKeywords.some(k => ['shared', 'lib', 'common', 'proto', 'types', 'sdk'].includes(k))) lane = 'shared-lib';

      return {
        id: repo.name,
        name: repo.name,
        description: repo.description || '',
        lane,
        repoUrl: repo.html_url || repo.clone_url || '',
        defaultBranch: repo.default_branch || 'main',
        stars: repo.stars_count || 0,
      };
    });

    return services;
  } catch (err) {
    console.warn('GitNexus detection failed, falling back to defaults:', err.message);
    return null;
  }
}

const FALLBACK_SERVICES = [
  { id: 'user-service', name: 'user-service', description: 'Authentication, profiles, permissions', lane: 'backend' },
  { id: 'notification-service', name: 'notification-service', description: 'Email, push, SMS notifications', lane: 'backend' },
  { id: 'payment-service', name: 'payment-service', description: 'Billing, subscriptions, payments', lane: 'backend' },
  { id: 'api-gateway', name: 'api-gateway', description: 'Request routing, rate limiting, API contracts', lane: 'backend' },
  { id: 'ios-app', name: 'ios-app', description: 'iPhone & iPad application', lane: 'ios' },
  { id: 'android-app', name: 'android-app', description: 'Android application', lane: 'android' },
  { id: 'web-app', name: 'web-app', description: 'Main web frontend', lane: 'web' },
  { id: 'shared-lib', name: 'shared-lib', description: 'Shared types, utilities, protocol buffers', lane: 'shared-lib' },
];

function buildSystemPrompt(services) {
  const serviceLines = services.map(s =>
    `- ${s.id} (${s.lane}): ${s.description}${s.repoUrl ? ` — ${s.repoUrl}` : ''}`
  ).join('\n');

  return `You are a senior engineering manager who decomposes work items (features, bugs, maintenance, migrations, improvements, infrastructure) into execution plans across a multi-service tech stack. Adapt your decomposition style to the work type — a bug fix needs precise root-cause tasks, a migration needs data safety steps, a feature needs full user-flow coverage.

## Available Services
${serviceLines}

## Execution Lanes
- backend: API, database, business logic changes
- ios: iOS app changes
- android: Android app changes
- web: Web frontend changes
- design: UI/UX design tasks
- qa: Testing, regression plans, test automation
- analytics: Event tracking, dashboards, metrics
- docs: Documentation updates
- infra: Infrastructure, CI/CD, deployment changes
- release: Rollout coordination, feature flags, staged release

## Important context
Tasks generated here will be pushed to Linear where **Cyrus**, an AI coding agent, picks them up and implements them autonomously. This means every task must be written for an AI executor, not a human:
- **No vague instructions** like "update the backend" — every task must state WHAT to change, WHERE (repo + file path if known), and WHAT the expected behavior is
- **Description must be a brief implementation guide**: mention the endpoint/function/schema to create or modify, the expected input/output, and any constraints
- **Acceptance criteria must be testable assertions** that Cyrus can verify programmatically (e.g. "GET /api/users/:id returns 404 when user is soft-deleted", not "users are handled correctly")
- If a task involves a database change, describe the migration in the description
- If a task involves an API change, describe the new endpoint signature

## Rules
1. Every task MUST have at least 2 acceptance criteria — both human-readable and machine-testable
2. Dependencies must form a DAG — no cycles
3. Backend tasks come before frontend/mobile tasks that depend on them
4. Design tasks are unblocked (can start immediately, in parallel)
5. QA tasks depend on the implementation tasks they verify
6. Release tasks depend on all other tasks
7. Docs tasks depend on implementation being finalized
8. Analytics tasks can often run in parallel with implementation
9. Each task needs a concrete serviceId from the available services (use "none" for design/qa/docs/release/analytics tasks that don't map to a service)
10. Flag any task touching auth, billing, data migrations, or shared libraries as high-risk
11. Keep tasks focused — one task should not span multiple services
12. Descriptions must include: which repo/service to edit, what function/endpoint/file to create or modify, exact behavior

## Platform coverage — CRITICAL
- If the feature description mentions iOS, Android, or mobile: you MUST generate separate implementation tasks for EACH platform (ios lane + android lane). Do NOT skip a platform.
- QA tasks should be split per platform (iOS QA, Android QA) rather than a single generic QA task.
- If the feature changes pricing/subscription logic, include a separate task for each payment provider (Apple, Google, Stripe).

## Lane inclusion rules
- **DO NOT include release lane** — release coordination is handled separately outside this system
- **DO NOT include web lane** unless the feature explicitly requires web app changes (admin dashboard or web-app)
- **Design lane**: Only include if the feature introduces a NEW screen, a new user-facing component, or a major visual change. Pure backend logic, rate limiting, data migration, or API changes do NOT need design tasks. When included, design tasks should be the FIRST unblocked tasks (everything else depends on design being approved).
- Focus on: backend, ios, android, qa, analytics, infra, docs. Only add other lanes when the feature genuinely requires them.

## Output Format
Return a JSON object with this exact structure:
{
  "laneDecisions": [
    { "lane": "backend", "needed": true, "reasoning": "...", "services": ["user-service"], "repos": ["user-service"], "files": [] }
  ],
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "serviceId": "user-service",
      "lane": "backend",
      "acceptanceCriteria": ["..."],
      "riskFlags": [{ "type": "breaking-change", "description": "...", "severity": "high" }],
      "dependsOn": [],
      "order": 0
    }
  ],
  "taskGraph": [
    { "fromTaskId": "TASK_0", "toTaskId": "TASK_1", "type": "blocks" }
  ]
}

Use TASK_0, TASK_1, TASK_2, etc. as placeholder task IDs — the server will replace them with real IDs.
For taskGraph, reference tasks by their placeholder IDs.
Only include lanes that are actually needed.`;
}

app.post('/api/orchestrate/decompose', async (req, res) => {
  try {
    const { intake, featureId } = req.body;

    if (!intake?.title || !intake?.problem) {
      return res.status(400).json({ error: 'Intake must include at least title and problem' });
    }

    // Auto-detect services from GitNexus based on affected surfaces
    const detectedServices = await detectServicesFromGitNexus(intake.affectedSurfaces);
    const services = detectedServices || FALLBACK_SERVICES;
    const systemPrompt = buildSystemPrompt(services);

    const client = await getAnthropicClient();

    const workType = intake.workType || 'feature';
    const userMessage = `Decompose this ${workType} into an execution plan:

## ${workType.charAt(0).toUpperCase() + workType.slice(1)} Intake
- Title: ${intake.title}
- Type: ${workType}
- Problem: ${intake.problem}
- Goal: ${intake.goal}
- User Impact: ${intake.userImpact || '(not specified)'}
- Business Impact: ${intake.businessImpact || '(not specified)'}
- Success Metric: ${intake.successMetric || '(not specified)'}
- In Scope: ${(intake.inScope || []).join(', ') || '(not specified)'}
- Out of Scope: ${(intake.outOfScope || []).join(', ') || '(not specified)'}
- Affected Surfaces: ${(intake.affectedSurfaces || []).join(', ')}
${intake.linkedReferences?.length ? `- References: ${intake.linkedReferences.map(r => `${r.label}: ${r.url}`).join(', ')}` : ''}
${detectedServices ? `- Services detected from GitNexus: ${detectedServices.map(s => s.id).join(', ')}` : ''}

For each task: write the description as a concise implementation brief (what to build, in which service, with what exact behavior). Acceptance criteria must be specific and testable by an AI agent. Generate the complete execution plan as JSON.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract JSON from response
    const textContent = response.content.find(c => c.type === 'text');
    const jsonMatch = textContent?.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const aiPlan = JSON.parse(jsonMatch[0]);

    // Replace placeholder IDs with real IDs and build the plan
    const idMap = {};
    const tasks = (aiPlan.tasks || []).map((task, i) => {
      const realId = generateId();
      idMap[`TASK_${i}`] = realId;
      return {
        ...task,
        id: realId,
        status: 'pending',
        mode: 'production',
        debtTags: [],
        blockedBy: [],
        dependsOn: [],
        acceptanceCriteria: task.acceptanceCriteria || [],
        riskFlags: task.riskFlags || [],
        order: task.order ?? i,
      };
    });

    // Resolve dependency placeholder IDs
    const taskGraph = (aiPlan.taskGraph || []).map(edge => ({
      fromTaskId: idMap[edge.fromTaskId] || edge.fromTaskId,
      toTaskId: idMap[edge.toTaskId] || edge.toTaskId,
      type: edge.type || 'blocks',
    }));

    // Set dependsOn/blockedBy from the graph
    for (const edge of taskGraph) {
      if (edge.type === 'blocks') {
        const blocked = tasks.find(t => t.id === edge.toTaskId);
        const blocker = tasks.find(t => t.id === edge.fromTaskId);
        if (blocked && blocker) {
          if (!blocked.dependsOn.includes(edge.fromTaskId)) blocked.dependsOn.push(edge.fromTaskId);
          if (!blocked.blockedBy.includes(edge.fromTaskId)) blocked.blockedBy.push(edge.fromTaskId);
        }
      }
    }

    // Also resolve dependsOn placeholder references in tasks
    for (const task of tasks) {
      task.dependsOn = task.dependsOn.map(id => idMap[id] || id);
      task.blockedBy = task.blockedBy.map(id => idMap[id] || id);
    }

    const plan = {
      id: generateId(),
      featureId: featureId || generateId(),
      step: 'review',
      intake,
      laneDecisions: aiPlan.laneDecisions || [],
      tasks,
      taskGraph,
      reviewNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ plan });
  } catch (err) {
    console.error('Decompose error:', err);
    res.status(500).json({ error: err.message || 'Decomposition failed' });
  }
});

// ── Enrich: expand a plain-text description into a full intake ──
app.post('/api/orchestrate/enrich', async (req, res) => {
  try {
    const { description, workType } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const client = await getAnthropicClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a product engineering assistant. Given a plain-text description of work, produce a structured feature intake brief. Return ONLY valid JSON matching this shape:
{
  "title": "short imperative title",
  "workType": "feature|bug|improvement|maintenance|migration|infrastructure|other",
  "problem": "clear problem statement",
  "goal": "what success looks like when shipped",
  "userImpact": "how end users are affected",
  "businessImpact": "revenue, retention, compliance, etc.",
  "successMetric": "one measurable signal of success",
  "inScope": ["thing 1", "thing 2"],
  "outOfScope": ["thing 1"],
  "affectedSurfaces": [],
  "linkedReferences": []
}
Be concise but specific. Infer workType from context if not given.`,
      messages: [{
        role: 'user',
        content: `Work type hint: ${workType || 'auto-detect'}\n\nDescription:\n${description}`,
      }],
    });

    const text = response.content.find(c => c.type === 'text')?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse AI response' });

    const intake = JSON.parse(match[0]);
    res.json({ intake });
  } catch (err) {
    console.error('Enrich error:', err);
    res.status(500).json({ error: err.message || 'Enrichment failed' });
  }
});

// ── Refine: modify plan based on human feedback ─────────────────
app.post('/api/orchestrate/refine', async (req, res) => {
  try {
    const { plan, feedback } = req.body;

    if (!plan || !feedback) {
      return res.status(400).json({ error: 'Plan and feedback are required' });
    }

    const client = await getAnthropicClient();

    const userMessage = `Here is the current execution plan:

${JSON.stringify(plan, null, 2)}

The reviewer provided this feedback:
${feedback}

Update the plan based on this feedback. Return the complete updated plan as JSON with the same structure (laneDecisions, tasks, taskGraph).`;

    // Rebuild prompt using the same services that were used during decomposition
    const detectedServices = await detectServicesFromGitNexus(plan.intake?.affectedSurfaces);
    const services = detectedServices || FALLBACK_SERVICES;
    const systemPrompt = buildSystemPrompt(services);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const jsonMatch = textContent?.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const refined = JSON.parse(jsonMatch[0]);

    // Rebuild with fresh IDs for any new tasks
    const idMap = {};
    const tasks = (refined.tasks || []).map((task, i) => {
      const realId = task.id?.startsWith('ot_') ? task.id : generateId();
      idMap[`TASK_${i}`] = realId;
      if (task.id) idMap[task.id] = realId;
      return {
        ...task,
        id: realId,
        status: task.status || 'pending',
        mode: task.mode || 'production',
        debtTags: task.debtTags || [],
        blockedBy: [],
        dependsOn: [],
        acceptanceCriteria: task.acceptanceCriteria || [],
        riskFlags: task.riskFlags || [],
        order: task.order ?? i,
      };
    });

    const taskGraph = (refined.taskGraph || []).map(edge => ({
      fromTaskId: idMap[edge.fromTaskId] || edge.fromTaskId,
      toTaskId: idMap[edge.toTaskId] || edge.toTaskId,
      type: edge.type || 'blocks',
    }));

    for (const edge of taskGraph) {
      if (edge.type === 'blocks') {
        const blocked = tasks.find(t => t.id === edge.toTaskId);
        const blocker = tasks.find(t => t.id === edge.fromTaskId);
        if (blocked && blocker) {
          if (!blocked.dependsOn.includes(edge.fromTaskId)) blocked.dependsOn.push(edge.fromTaskId);
          if (!blocked.blockedBy.includes(edge.fromTaskId)) blocked.blockedBy.push(edge.fromTaskId);
        }
      }
    }

    for (const task of tasks) {
      task.dependsOn = task.dependsOn.map(id => idMap[id] || id);
      task.blockedBy = task.blockedBy.map(id => idMap[id] || id);
    }

    const updatedPlan = {
      ...plan,
      laneDecisions: refined.laneDecisions || plan.laneDecisions,
      tasks,
      taskGraph,
      reviewNotes: [...(plan.reviewNotes || []), feedback],
      updatedAt: new Date().toISOString(),
    };

    res.json({ plan: updatedPlan });
  } catch (err) {
    console.error('Refine error:', err);
    res.status(500).json({ error: err.message || 'Refinement failed' });
  }
});

// ── GitNexus: preview detected services ────────────────────────
app.post('/api/orchestrate/detect-services', async (req, res) => {
  const { affectedSurfaces } = req.body || {};
  const detected = await detectServicesFromGitNexus(affectedSurfaces);
  res.json({
    source: detected ? 'gitnexus' : 'fallback',
    configured: !!(process.env.GITNEXUS_URL && process.env.GITNEXUS_TOKEN),
    services: detected || FALLBACK_SERVICES,
  });
});

// ── Linear: get configuration / available teams ─────────────────
app.get('/api/orchestrate/linear-config', async (req, res) => {
  try {
    if (!process.env.LINEAR_API_KEY) {
      return res.json({ configured: false, teams: [] });
    }

    const client = await getLinearClient();
    const teamsResponse = await client.teams();
    const teams = teamsResponse.nodes.map(t => ({
      id: t.id,
      name: t.name,
      key: t.key,
    }));

    res.json({ configured: true, teams });
  } catch (err) {
    console.error('Linear config error:', err);
    res.json({ configured: false, teams: [], error: err.message });
  }
});

// ── Linear: push approved plan ──────────────────────────────────

// Map execution lanes to Linear team keys
// Tasks go to the team that owns the lane, not all to one team
const LANE_TO_TEAM_KEY = {
  backend:   'BAC',
  ios:       'IOS',
  android:   'AND',
  qa:        'QA',
  design:    'UXU',
  web:       'BAC',      // web frontend tasks go to backend team for now
  analytics: 'BAC',      // analytics tasks go to backend
  docs:      'BAC',      // docs tasks go to backend
  infra:     'BAC',      // infra tasks go to backend
  release:   'BAC',      // release tasks go to backend
};

app.post('/api/orchestrate/push-to-linear', async (req, res) => {
  try {
    const { plan, teamId, projectId } = req.body;

    if (!plan || !teamId) {
      return res.status(400).json({ error: 'Plan and teamId are required' });
    }

    const client = await getLinearClient();
    const results = [];

    // ── Build team key → ID map so we can route tasks to the right team ──
    const teamKeyMap = {};
    try {
      const teamsResp = await client.teams();
      for (const t of teamsResp.nodes) {
        teamKeyMap[t.key] = t.id;
      }
    } catch (err) {
      console.warn('Could not fetch teams, all issues go to selected team:', err.message);
    }

    function getTeamIdForLane(lane) {
      const teamKey = LANE_TO_TEAM_KEY[lane];
      return (teamKey && teamKeyMap[teamKey]) || teamId; // fallback to selected team
    }

    // ── Create a Linear project (the project IS the container — no parent issue) ──
    const workType = plan.intake.workType || 'feature';
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      try {
        // Collect all team IDs that will receive issues
        const involvedTeamIds = new Set([teamId]);
        for (const task of plan.tasks) {
          involvedTeamIds.add(getTeamIdForLane(task.lane));
        }

        // Build a rich project description from the full intake
        const activeLanes = plan.laneDecisions.filter(l => l.needed);
        const projectDescription = [
          `## Problem`,
          plan.intake.problem || '(not specified)',
          '',
          `## Goal`,
          plan.intake.goal || '(not specified)',
          '',
          plan.intake.userImpact ? `## User Impact\n${plan.intake.userImpact}\n` : '',
          plan.intake.businessImpact ? `## Business Impact\n${plan.intake.businessImpact}\n` : '',
          plan.intake.successMetric ? `## Success Metric\n${plan.intake.successMetric}\n` : '',
          `## Execution Plan`,
          `**${plan.tasks.length} tasks** across **${activeLanes.length} lanes**`,
          '',
          ...activeLanes.map(l => {
            const laneTasks = plan.tasks.filter(t => t.lane === l.lane);
            const teamKey = LANE_TO_TEAM_KEY[l.lane] || 'BAC';
            return `### ${l.lane.charAt(0).toUpperCase() + l.lane.slice(1)} (${teamKey}) — ${laneTasks.length} tasks\n${l.reasoning}\n${laneTasks.map(t => `- ${t.title}`).join('\n')}`;
          }),
          '',
          plan.intake.inScope?.length ? `## In Scope\n${plan.intake.inScope.map(s => `- ${s}`).join('\n')}\n` : '',
          plan.intake.outOfScope?.length ? `## Out of Scope\n${plan.intake.outOfScope.map(s => `- ${s}`).join('\n')}\n` : '',
          plan.intake.linkedReferences?.length ? `## References\n${plan.intake.linkedReferences.map(r => `- [${r.label}](${r.url})`).join('\n')}\n` : '',
          '---',
          '*Generated by Feature Forge Orchestration*',
        ].filter(Boolean).join('\n');

        const project = await client.createProject({
          name: plan.intake.title,
          description: projectDescription,
          teamIds: [...involvedTeamIds],
        });
        const projectData = await project.project;
        resolvedProjectId = projectData?.id;
        // Linear projects use slugified URL: /project/<slug>-<short-id>
        const projectUrl = projectData?.url || (projectData?.slugId ? `https://linear.app/appmirror/project/${projectData.slugId}` : null);
        results.push({ type: 'project', id: resolvedProjectId, url: projectUrl, success: true });
      } catch (err) {
        console.warn('Could not create Linear project, continuing with issues only:', err.message);
      }
    }

    // ── Ensure lane labels exist ──
    const laneLabels = {};
    try {
      // Fetch existing labels for this team
      const labelsResp = await client.issueLabels({ filter: { team: { id: { eq: teamId } } } });
      const existingLabels = new Map(labelsResp.nodes.map(l => [l.name.toLowerCase(), l.id]));

      const LANE_COLORS = {
        backend: '#3B82F6', ios: '#6B7280', android: '#10B981', web: '#22C55E',
        design: '#EC4899', qa: '#F97316', analytics: '#06B6D4', docs: '#EAB308',
        infra: '#EF4444', release: '#8B5CF6',
      };

      const activeLanes = [...new Set(plan.tasks.map(t => t.lane))];
      for (const lane of activeLanes) {
        const labelName = `lane:${lane}`;
        if (existingLabels.has(labelName)) {
          laneLabels[lane] = existingLabels.get(labelName);
        } else {
          try {
            const created = await client.createIssueLabel({
              name: labelName,
              color: LANE_COLORS[lane] || '#6B7280',
              teamId,
            });
            const labelData = await created.issueLabel;
            laneLabels[lane] = labelData?.id;
          } catch { /* label might already exist from race condition */ }
        }
      }
    } catch (err) {
      console.warn('Could not create lane labels:', err.message);
    }

    // Create tasks directly in the project (no parent issue — the project IS the container)
    const linearIdMap = {};
    for (const task of plan.tasks) {
      try {
        const acList = task.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join('\n');
        const riskList = task.riskFlags.map(rf => `- **${rf.severity.toUpperCase()}** [${rf.type}]: ${rf.description}`).join('\n');

        const description = [
          task.description,
          '',
          `### Acceptance Criteria`,
          acList,
          riskList ? `\n### Risk Flags\n${riskList}` : '',
          '',
          `**Lane:** ${task.lane}`,
          task.serviceId !== 'none' ? `**Service:** ${task.serviceId}` : '',
        ].filter(Boolean).join('\n');

        // Map risk severity to Linear priority
        const maxRisk = task.riskFlags.reduce((max, rf) =>
          rf.severity === 'high' ? 'high' : (rf.severity === 'medium' && max !== 'high') ? 'medium' : max
        , 'low');
        const priority = maxRisk === 'high' ? 1 : maxRisk === 'medium' ? 2 : 3;

        const taskTeamId = getTeamIdForLane(task.lane);
        // Lane labels are per-team — get or create in the task's team
        let labelIds = [];
        if (laneLabels[task.lane]) {
          labelIds = [laneLabels[task.lane]];
        }

        const childIssue = await client.createIssue({
          teamId: taskTeamId,
          projectId: resolvedProjectId || undefined,
          title: task.title,
          description,
          priority,
          labelIds: labelIds.length > 0 ? labelIds : undefined,
        });

        const childData = await childIssue.issue;
        linearIdMap[task.id] = childData.id;
        results.push({ type: 'task', taskId: task.id, linearId: childData.id, url: childData.url, success: true });
      } catch (err) {
        results.push({ type: 'task', taskId: task.id, success: false, error: err.message });
      }
    }

    // Create dependency relations
    for (const edge of plan.taskGraph) {
      if (edge.type === 'blocks' && linearIdMap[edge.fromTaskId] && linearIdMap[edge.toTaskId]) {
        try {
          await client.createIssueRelation({
            issueId: linearIdMap[edge.toTaskId],
            relatedIssueId: linearIdMap[edge.fromTaskId],
            type: 'blocks',
          });
        } catch (err) {
          console.error('Failed to create relation:', err.message);
        }
      }
    }

    // Find the project result to return its URL
    const projectResult = results.find(r => r.type === 'project');
    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      project: projectResult ? { id: projectResult.id, url: projectResult.url } : null,
      results,
      summary: `Created ${successCount}/${results.length} items`,
    });
  } catch (err) {
    console.error('Linear push error:', err);
    res.status(500).json({ error: err.message || 'Failed to push to Linear' });
  }
});

// ── Start server ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tool server running on port ${PORT}`);
  console.log(`remoteEntry.js available at:`);
  console.log(`  - http://localhost:${PORT}/remoteEntry.js`);
  console.log(`  - http://localhost:${PORT}/assets/remoteEntry.js`);
  console.log(`Orchestration API at http://localhost:${PORT}/api/orchestrate/`);
});
