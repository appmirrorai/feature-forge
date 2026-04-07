# The Factory: End-to-End AI Production Pipeline

## Sources of Truth

```
LINEAR          = What to build        (work)
GITHUB          = How it's built       (code)
MAC MINI        = Where it runs        (execution)
CYRUS AI        = Who drives it        (agent layer)
CODERABBIT      = Who checks it        (quality gate)
GITNEXUS        = How it flows         (branch discipline)
MD FILES        = What it means        (living docs)
DESIGN SYSTEM   = What it looks like   (components)
DEV SYSTEM      = What it touches      (system map)
```

---

## The Full Pipeline Graph

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                    CYRUS AI (Cloudflare Tunnel)         │
                         │         Secure Remote Agent / Operator Layer            │
                         │         + Codex Plugin for challenge/validation         │
                         │                                                         │
                         │   Watches Linear ──► Triggers Orchestrator on Mac Mini  │
                         │   Can be invoked remotely from anywhere                 │
                         │   Handles multi-agent coordination                      │
                         └──────────────────────────┬──────────────────────────────┘
                                                    │
                                                    │ controls everything below
                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                MAC MINI (Execution Environment)                              │
│                                                                                              │
│  ┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────────────┐  │
│  │    1     │    │     2     │    │      3       │    │     4      │    │       5          │  │
│  │  IDEA /  │───►│ PROTOTYPE │───►│   DESIGN     │───►│    DEV     │───►│  ORCHESTRATOR    │  │
│  │ RESEARCH │    │           │    │   SYSTEM     │    │   SYSTEM   │    │                  │  │
│  └─────────┘    └───────────┘    └──────────────┘    └────────────┘    └────────┬─────────┘  │
│       │              │                  │                   │                    │            │
│       │              │                  │                   │                    │            │
│       ▼              ▼                  ▼                   ▼                    ▼            │
│  ┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────────────┐  │
│  │ LINEAR  │    │  Branch   │    │  Component   │    │  Repo Map  │    │  Claude Code /   │  │
│  │ Ticket  │    │  created  │    │  Library     │    │  System    │    │  AI Agent runs   │  │
│  │ created │    │  via      │    │  (Swift UI,  │    │  Boundaries│    │  the actual      │  │
│  │         │    │  GitNexus │    │   Kotlin,    │    │  Tech Defs │    │  implementation  │  │
│  │         │    │           │    │   React)     │    │  Approvals │    │                  │  │
│  └─────────┘    └───────────┘    └──────────────┘    └────────────┘    └────────┬─────────┘  │
│                                                                                 │            │
│                                                                                 │            │
│                      ┌──────────────────────────────────────────────────────────┘            │
│                      │                                                                       │
│                      ▼                                                                       │
│               ┌─────────────┐         ┌──────────────────┐                                   │
│               │      6      │         │        7         │                                   │
│               │   REVIEW    │────────►│  DOCUMENTATION   │                                   │
│               │             │         │     SYSTEM       │                                   │
│               └─────────────┘         └──────────────────┘                                   │
│                     │                          │                                             │
│                     ▼                          ▼                                             │
│               ┌─────────────┐         ┌──────────────────┐                                   │
│               │ CodeRabbit  │         │   MD files auto  │                                   │
│               │ + GitNexus  │         │   generated &    │                                   │
│               │ merge gate  │         │   committed      │                                   │
│               └─────────────┘         └──────────────────┘                                   │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage-by-Stage Breakdown

### Stage 1: Idea / Research
```
TRIGGER:  Human creates a Linear ticket OR Cyrus AI suggests one
INPUT:    Problem statement, user need, business goal
OUTPUT:   Linear ticket with: title, description, acceptance criteria, priority
TOOL:     Linear (source of truth)
```

**What happens:**
- A ticket lands in Linear with enough context for an AI to understand WHAT and WHY
- Linear labels determine routing: `platform:ios`, `platform:web`, `type:feature`, `type:bug`
- Priority + sprint assignment determine WHEN

```
LINEAR TICKET
├── Title: "Add dark mode toggle to Settings"
├── Description: "Users want dark mode..."
├── Acceptance Criteria: [list]
├── Labels: [platform:ios, platform:web, type:feature]
├── Priority: P1
└── Sprint: Current
```

---

### Stage 2: Prototype
```
TRIGGER:  Ticket moves to "Ready for Design" in Linear
INPUT:    Linear ticket
OUTPUT:   Branch created, prototype scaffolded
TOOLS:    GitNexus (branch creation), GitHub (code)
```

**What happens:**
- GitNexus creates a properly named branch: `feature/LIN-123-dark-mode-toggle`
- Branch naming convention enforced automatically
- Initial scaffold committed (empty component files, test stubs)

```
GITNEXUS RULES
├── Branch from: main (or release branch)
├── Naming: {type}/LIN-{id}-{slug}
├── Auto-link: branch ↔ Linear ticket
└── Protection: no direct push to main
```

---

### Stage 3: Design System
```
TRIGGER:  Branch exists, ready for implementation
INPUT:    Component requirements from ticket
OUTPUT:   Platform-ready component definitions
TOOL:     This tool (appmirror-tool-starter) = THE DESIGN SYSTEM
```

**What happens:**
- The orchestrator queries the design system: "What components exist for dark mode toggle?"
- Design system returns REAL components with screenshots, props, variants
- If component exists → use it. If not → flag for creation first.

```
DESIGN SYSTEM PROVIDES
├── Swift UI Components    ──► iOS native ready
│   ├── Screenshots of current state
│   ├── Component API (props, modifiers)
│   └── Usage patterns
├── Kotlin Components      ──► Android native ready
│   ├── Composable definitions
│   ├── Theme tokens
│   └── Usage patterns
└── React Components       ──► Web ready
    ├── Component library
    ├── Tailwind tokens / CSS modules
    └── Usage patterns

KEY PRINCIPLE: AI assembles from KNOWN parts, never guesses
```

---

### Stage 4: Dev System
```
TRIGGER:  Design system has confirmed available components
INPUT:    Ticket + available components
OUTPUT:   Execution plan with full system awareness
TOOL:     Dev System (repo map, tech definitions, system boundaries)
```

**What happens:**
- Dev system answers: WHERE does this code go? WHAT systems does it touch? WHAT are the constraints?
- This prevents the AI from creating files in wrong places or breaking boundaries

```
DEV SYSTEM PROVIDES
├── Repo Map
│   ├── Which repo to touch (mono vs multi)
│   ├── File structure conventions
│   └── Import/dependency rules
├── System Boundaries
│   ├── API contracts
│   ├── Database schemas
│   └── Service dependencies
├── Technical Definitions
│   ├── Naming conventions
│   ├── Architecture patterns (MVVM, etc.)
│   └── Platform-specific rules
└── Technical Approval
    ├── Required reviewers
    ├── CI/CD requirements
    └── Security constraints
```

---

### Stage 5: Orchestrator (AI Agent)
```
TRIGGER:  Design system + Dev system have provided context
INPUT:    Ticket + components + system map + execution plan
OUTPUT:   Working code, committed to branch
TOOLS:    Claude Code on Mac Mini, via Cyrus AI tunnel
```

**This is where the magic happens.**

```
ORCHESTRATOR RECEIVES
│
├── FROM LINEAR:         What to build + acceptance criteria
├── FROM DESIGN SYSTEM:  Which components to use + how they look
├── FROM DEV SYSTEM:     Where to put code + what rules to follow
│
▼
ORCHESTRATOR EXECUTES (on Mac Mini)
│
├── 1. Read ticket context
├── 2. Query design system for components
├── 3. Query dev system for constraints
├── 4. Generate implementation plan
├── 5. Write code using REAL components
├── 6. Run local tests
├── 7. Commit to feature branch
└── 8. Push + create PR via GitHub
```

```
CYRUS AI LAYER
├── Cloudflare Tunnel ──► Secure access to Mac Mini from anywhere
├── Agent coordination ──► Multiple AI agents if needed
├── Codex Plugin ──► Challenge/validate AI decisions
│   └── "Are you sure this is the right component?"
│   └── "This touches a critical system, escalate?"
└── Human-in-the-loop ──► Escalation path when confidence is low
```

---

### Stage 6: Review
```
TRIGGER:  PR created on GitHub
INPUT:    Pull request diff
OUTPUT:   Approved / changes requested / blocked
TOOLS:    CodeRabbit (AI review), GitNexus (merge discipline)
```

**Two gates, both must pass:**

```
GATE 1: CODERABBIT (Quality)
├── Code quality scan
├── Security vulnerability check
├── Pattern consistency check
├── Performance review
├── Suggests improvements
└── OUTPUT: Approve / Request Changes

GATE 2: GITNEXUS (Discipline)
├── Branch naming correct?
├── Linked to Linear ticket?
├── CI/CD passing?
├── Required reviewers assigned?
├── No merge conflicts?
└── OUTPUT: Allow merge / Block merge

GATE 3: CODEX CHALLENGE (Optional)
├── Cyrus AI can challenge the PR
├── "Why did you choose this approach?"
├── "What alternatives did you consider?"
└── Forces the orchestrator to justify decisions
```

```
REVIEW FLOW
│
├── CodeRabbit approves?
│   ├── YES ──► proceed
│   └── NO  ──► back to Stage 5 (orchestrator fixes)
│
├── GitNexus allows merge?
│   ├── YES ──► proceed
│   └── NO  ──► fix branch/CI issues
│
└── ALL PASS ──► Auto-merge OR human final approval
```

---

### Stage 7: Documentation System
```
TRIGGER:  PR merged to main
INPUT:    Merged code + Linear ticket + PR description
OUTPUT:   Auto-generated/updated MD documentation
TOOLS:    MD files (living documentation layer)
```

**What happens:**
- Documentation is generated automatically on merge
- Lives alongside the code (not in a separate wiki)
- Updates existing docs, doesn't just append

```
MD FILES GENERATED/UPDATED
├── CHANGELOG.md        ──► What changed and why
├── components/*.md     ──► Component documentation
├── architecture/*.md   ──► System architecture updates
├── api/*.md            ──► API documentation
└── decisions/*.md      ──► Architecture Decision Records (ADRs)

LINEAR UPDATED
├── Ticket moved to "Done"
├── PR link attached
├── Documentation link attached
└── Cycle time recorded
```

---

## The Complete Data Flow (One Ticket, Start to Finish)

```
Human has idea
       │
       ▼
  ┌─────────┐
  │ LINEAR   │ ◄─── Source of truth: WHAT to build
  │ Ticket   │
  └────┬─────┘
       │
       │  Cyrus AI watches Linear
       │  via Cloudflare Tunnel
       ▼
  ┌──────────┐
  │ CYRUS AI │ ◄─── Operator: WHO drives the work
  │ (remote) │
  └────┬─────┘
       │
       │  Triggers orchestrator
       │  on Mac Mini
       ▼
  ┌──────────┐
  │ MAC MINI │ ◄─── Execution: WHERE it runs
  │ (local)  │
  └────┬─────┘
       │
       ├──► GitNexus creates branch ──► GITHUB
       │
       ├──► Query DESIGN SYSTEM
       │    "What components do I have?"
       │    Returns: real components, screenshots, APIs
       │
       ├──► Query DEV SYSTEM
       │    "Where does this code go? What rules?"
       │    Returns: repo map, boundaries, constraints
       │
       ├──► ORCHESTRATOR writes code
       │    Using KNOWN components
       │    Following KNOWN rules
       │    In the CORRECT locations
       │
       ├──► Push to GITHUB ──► PR created
       │
       ├──► CODERABBIT reviews PR
       │    ├── Pass ──► continue
       │    └── Fail ──► loop back, fix, re-push
       │
       ├──► GITNEXUS validates merge
       │    ├── Pass ──► merge
       │    └── Fail ──► fix branch issues
       │
       ├──► Merge to main
       │
       ├──► MD FILES auto-generated
       │    Changelog, component docs, ADRs
       │
       └──► LINEAR ticket ──► Done
            Cycle time: measured
            Docs: linked
            Code: shipped
```

---

## The Feedback Loops (What Makes It a Factory)

A factory isn't just linear — it has feedback loops that improve quality over time:

```
LOOP 1: REVIEW → ORCHESTRATOR
CodeRabbit finds issues ──► Orchestrator auto-fixes ──► Re-review
No human needed for routine fixes

LOOP 2: DOCUMENTATION → DESIGN SYSTEM
New components documented ──► Design system updated
Next ticket already has the new component available

LOOP 3: DOCUMENTATION → DEV SYSTEM
Architecture changes documented ──► Dev system map updated
Next ticket knows about new system boundaries

LOOP 4: LINEAR METRICS → IDEA/RESEARCH
Cycle time data ──► Informs future ticket sizing
Quality metrics ──► Informs process improvements

LOOP 5: CODEX CHALLENGE → ORCHESTRATOR LEARNING
Challenges that caught real issues ──► Inform future decisions
Patterns that always pass ──► Skip challenge for those patterns

LOOP 6: DEPLOY → TEST → OPTIMIZE (every launch)
Backend deployed ──► Auto test suite runs ──► Performance profiled
Results feed back into the system so next deploy is faster/leaner
```

---

## The Deploy-Test-Optimize Cycle (Every Launch)

Every time a system is deployed (backend, service, infra), the factory doesn't just ship — it **validates and tightens**. This is not optional. It's built into the pipeline.

```
                    ┌──────────────┐
                    │    DEPLOY    │
                    │  (backend,   │
                    │   service,   │
                    │   infra)     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │FUNCTIONAL│ │PERFORMNCE│ │ SECURITY │
        │  TESTS   │ │  TESTS   │ │  TESTS   │
        │          │ │          │ │          │
        │ API      │ │ Latency  │ │ Auth     │
        │ Contract │ │ Memory   │ │ Injection│
        │ E2E      │ │ CPU      │ │ Headers  │
        │ Smoke    │ │ DB query │ │ Secrets  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   OPTIMIZE   │
                    │              │
                    │ Slow query?  │──► Fix + re-deploy
                    │ Memory leak? │──► Fix + re-deploy
                    │ Cold start?  │──► Fix + re-deploy
                    │ All green?   │──► Baseline saved
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   BASELINE   │
                    │   UPDATED    │
                    │              │
                    │ Next deploy  │
                    │ compared     │
                    │ against this │
                    └──────────────┘
```

### What this means in practice:

```
EVERY BACKEND LAUNCH TRIGGERS:

1. FUNCTIONAL VALIDATION
   ├── API contract tests     ──► Do endpoints return what they should?
   ├── Integration tests      ──► Do services talk to each other correctly?
   ├── E2E smoke tests        ──► Does the critical path work?
   └── Regression tests       ──► Did we break anything that worked before?

2. PERFORMANCE PROFILING
   ├── Response time baseline  ──► Is it faster or slower than last deploy?
   ├── Database query analysis ──► Any new N+1 queries? Slow joins?
   ├── Memory usage snapshot   ──► Leaks? Spikes? Growth over time?
   ├── CPU profiling           ──► Hot paths? Unnecessary computation?
   └── Cold start time         ──► Serverless? How fast does it boot?

3. SECURITY SCAN
   ├── Dependency audit        ──► Any known CVEs in new packages?
   ├── Auth flow validation    ──► Can you access what you shouldn't?
   ├── Input sanitization      ──► Injection vectors?
   └── Secret exposure check   ──► Any leaked keys, tokens, credentials?

4. OPTIMIZATION LOOP
   ├── Compare against previous baseline
   ├── Flag any regression > 10% threshold
   ├── Auto-create Linear ticket for regressions
   │   └── Labels: [type:performance, priority:P1, auto-generated]
   ├── If all green: save new baseline
   └── Metrics stored for trend analysis
```

### Why this matters for the factory:

```
WITHOUT test-on-deploy:
  Ship ──► hope it works ──► find out in production ──► panic fix
  (human firefighting)

WITH test-on-deploy:
  Ship ──► auto-validate ──► auto-profile ──► auto-fix or auto-ticket
  (factory self-corrects)

THE KEY INSIGHT:
  The system doesn't just BUILD faster with each cycle
  It also RUNS faster with each cycle
  Because every deploy tightens the performance baseline
```

### How this connects to the rest of the pipeline:

```
STAGE 5 (Orchestrator)
    │
    ├──► Writes code
    ├──► Pushes to GitHub
    │
STAGE 6 (Review)
    │
    ├──► CodeRabbit reviews
    ├──► GitNexus validates
    ├──► Merge to main
    │
STAGE 6.5 (Deploy + Test + Optimize)    ◄── NEW
    │
    ├──► Auto-deploy to staging/prod
    ├──► Functional tests run
    ├──► Performance profiled against baseline
    ├──► Security scanned
    ├──► Regressions? ──► Auto-ticket in Linear ──► back to Stage 1
    ├──► All green? ──► New baseline saved
    │
STAGE 7 (Documentation)
    │
    ├──► MD files updated WITH performance data
    │    "API response time: 45ms (prev: 52ms, -13%)"
    └──► Linear ticket closed with metrics attached
```

```
        ┌────────────────────────────────────────────────┐
        │                                                │
        │    ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐  │
        │    │DESIGN│◄──│ DOCS │◄──│REVIEW│◄──│ORCH. │  │
        │    │SYSTEM│──►│      │──►│      │──►│      │  │
        │    └──┬───┘   └──────┘   └──────┘   └──┬───┘  │
        │       │                                 │      │
        │       └────── FEEDS BACK INTO ──────────┘      │
        │                                                │
        │          EVERY CYCLE MAKES THE                 │
        │          NEXT CYCLE FASTER                     │
        │                                                │
        └────────────────────────────────────────────────┘
```

---

## What This Tool (appmirror-tool-starter) Must Become

This tool is the **Design System + Dev System** combined — stages 3 and 4. It's the knowledge layer that makes the orchestrator effective.

```
appmirror-tool-starter
├── DESIGN SYSTEM capabilities
│   ├── Mirror real app screenshots ──► AI sees what exists
│   ├── Component registry ──► AI knows what's available
│   ├── Platform variants ──► Swift UI / Kotlin / React
│   ├── Design tokens ──► Colors, spacing, typography
│   └── Component relationships ──► What goes with what
│
├── DEV SYSTEM capabilities
│   ├── Repo structure map ──► AI knows where files go
│   ├── System boundary definitions ──► AI respects architecture
│   ├── Technical constraints ──► AI follows the rules
│   ├── API contracts ──► AI integrates correctly
│   └── Approval routing ──► AI knows who to notify
│
└── ORCHESTRATOR INTERFACE
    ├── Query: "What toggle component exists for iOS?"
    │   Response: {component, screenshot, props, usage}
    │
    ├── Query: "Where do Settings screens live in repo X?"
    │   Response: {path, convention, related files}
    │
    └── Query: "What systems does the theme service touch?"
        Response: {dependencies, APIs, databases}
```

---

## Summary: The Factory Equation

```
LINEAR (what)
  + DESIGN SYSTEM (components)    ← this tool
  + DEV SYSTEM (rules)            ← this tool
  + ORCHESTRATOR (execution)      ← Claude Code
  + MAC MINI (environment)        ← hardware
  + CYRUS AI (remote control)     ← secure tunnel
  + CODERABBIT (quality)          ← review gate
  + GITNEXUS (discipline)         ← merge gate
  + MD FILES (memory)             ← documentation
  ─────────────────────────────
  = AUTONOMOUS PRODUCTION FACTORY
    that gets better with every cycle
```
