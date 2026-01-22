# Virtual Human Tutor

## Overview

Virtual Human Tutor is an AI-powered educational platform that provides personalized mathematics tutoring for Year 9-12 students (ages 14-18). The application features a virtual teacher avatar (Ms. Eleanor Chen) that uses the Socratic method to guide students through problem-solving rather than providing direct answers. The platform includes student classrooms, parent portals for progress monitoring, and an owner dashboard with AI-powered growth/marketing tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful endpoints under `/api/*`
- **Build**: esbuild for production bundling with selective dependency bundling for cold start optimization

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` with models in `shared/models/`
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication
- **Provider**: Replit OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL store
- **Implementation**: Passport.js with custom Replit strategy in `server/replit_integrations/auth/`

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**:
  - Chat completions for Socratic tutoring responses
  - Text-to-speech for voice interactions
  - Speech-to-text for student voice input
  - Image generation for educational content
- **Audio Processing**: WebM to WAV conversion via ffmpeg, AudioWorklet for browser playback

### Key Design Patterns
- **Shared Types**: Common schemas in `shared/` directory accessible by both client (`@shared/*`) and server
- **Integration Modules**: Reusable AI features organized in `server/replit_integrations/` (auth, chat, audio, image, batch)
- **Storage Pattern**: Interface-based storage classes for database operations
- **Client Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## External Dependencies

### AI Services
- **OpenAI API**: Chat completions, text-to-speech, speech-to-text, image generation (via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`)

### Database
- **PostgreSQL**: Primary data store (via `DATABASE_URL`)
- **Drizzle ORM**: Database queries and migrations

### Authentication
- **Replit OIDC**: User authentication (via `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`)

### Audio Processing
- **ffmpeg**: Server-side WebM to WAV conversion (available by default on Replit)

### Key NPM Packages
- `openai`: AI API client
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `express-session` / `connect-pg-simple`: Session management
- `passport` / `openid-client`: Authentication
- `p-limit` / `p-retry`: Batch processing utilities

## Recent Changes

### January 2026 - Learning Orchestration System
Added admin-only Learning Orchestration System (`/orchestration`) with:
- **Learning Plan Manager**: Create/edit learning plans with subjects, hours, intensity, modalities
- **Session Orchestrator**: Configure session limits, cooldowns, burnout protection (persisted to localStorage)
- **Parent Interaction Panel**: AI-generated plan proposals with trade-off explanations
- **Workflow Monitor**: Alerts for stuck students, overuse patterns, escalation flags
- **Autonomous Agents Dashboard**: Marketing, Admissions, Operations, Academic Quality agents with:
  - Mandate display
  - Actions taken with reasoning
  - Confidence scores
  - Human override controls (Pause/Resume/Override)
- **AI Admin Agent**: Plan generation, parent negotiation with explainable decisions
- **Role-based access control**: Only owner/teacher roles can access orchestration

### UX Refinements - Focus + Flow + Workspace Model
- Role-based navigation hiding admin features from students
- Classroom header with Focus Session, Quick Help, Show My Work CTAs
- Session Compass panel in Focus mode
- Calm, encouraging, non-evaluative copy throughout (no scores/rankings)

### January 2026 - Marketing Agent Phase 1 (AI-Powered Proposal Engine)
Added AI-powered proposal generation system for Marketing Agent:
- **Data Models**: MarketingPolicy, MarketingProposal, MarketingStrategyMemory, DecisionLog with localStorage persistence
- **Settings UI**: 5-tab modal with System Prompt editor, Policy fields (brand voice, autonomy, channels, guardrails), Budget limits, Strategy Memory, AI Controls (model selection, token limits)
- **Intent Narrative Generator**: Context-aware headline generator based on capacity/retention/outcomes signals
- **Proposal Generation API**: `/api/marketing/proposals/generate` endpoint with OpenAI integration
- **Server-side Validation**: Zod schemas for PolicySchema, ProposalRequestSchema, AIProposalResponseSchema
- **Safety Controls**: Rate limiting (10/hour per user), emergency stop endpoint, compliance checklist enforcement
- **UI Components**: IntentNarrativePanel, ProposalQueue with approve/reject/archive actions
- **Key Files**: `server/routes/marketingAgent.ts`, `client/src/lib/marketingAgentModels.ts`, `client/src/components/MarketingAgentSettings.tsx`, `client/src/components/IntentNarrativePanel.tsx`, `client/src/components/ProposalQueue.tsx`
- **Phase 1 Constraints**: Propose-only mode (AI never executes), all proposals include decision logs with what/why/alternatives/confidence, confidence threshold 70%

### January 2026 - Operations Agent Phase 1 (AI-Powered Monitoring & Alerting)
Added AI-powered operations monitoring and alerting system:
- **Data Models**: OpsPolicy, TelemetrySnapshot, OpsAlert, MitigationCatalog, OpsActionLog, HumanHandoffCase with localStorage persistence
- **Settings UI**: 5-tab modal with Autonomy levels (0-3), SLA targets (uptime, latency, error rate, CSAT), Load guardrails (CPU, memory, session limits), Quality guardrails (quiz pass rate, engagement, escalation rate), Mitigation permissions
- **Telemetry Simulator**: Real-time mock telemetry generation (15s intervals) with manual incident injection buttons (latency spike, error spike, capacity overload, quality drop)
- **Detector/Recommender Engine**: Automated anomaly detection when telemetry breaches policy thresholds, generates alerts with severity levels and recommended mitigations
- **Ops Control Room UI**: `/ops-agent` with health dashboard (CPU, Memory, Sessions, Latency gauges), alerts queue with approve/reject actions, handoff queue with SLA tracking, decision log, intent narrative panel
- **Key Files**: `client/src/lib/opsAgentModels.ts`, `client/src/lib/telemetrySimulator.ts`, `client/src/components/OpsAgentSettings.tsx`, `client/src/pages/OpsAgent.tsx`
- **Phase 1 Constraints**: Alert/propose-only mode (no auto-execution without approval), autonomy level 0-1 by default, human-in-the-loop for all mitigations, confidence threshold 70%

### January 2026 - Role-Based Access Control (RBAC) Refactoring
Implemented comprehensive authentication and authorization system:
- **Role Namespaced Routes**: Routes now organized by role namespace (`/student/*`, `/parent/*`, `/tutor/*`, `/admin/*`)
- **ProtectedRoute Component**: Client-side route guard with role validation and redirect logic (`client/src/components/ProtectedRoute.tsx`)
- **Role-Specific Layouts**: Separate navigation layouts for each role:
  - `StudentLayout`: Blue theme, My Learning + Classroom + Practice
  - `ParentLayout`: Green theme, Portal + Progress + Messages
  - `TutorLayout`: Purple theme, Dashboard + Students + Sessions + Notes
  - `AdminLayout`: Red theme, 360° Dashboard + Students + Growth + Orchestration + Marketing + Ops
- **Dedicated Pages**:
  - `/login` - Student/Parent/Tutor login
  - `/admin/login` - Admin-only login with access code verification
  - `/logout` - Proper session cleanup (clears localStorage, sessionStorage, server session)
  - `/unauthorized` - Access denied page with role-appropriate home redirect
- **Admin 360° Dashboard** (`/admin`): Platform overview with student search, stats, alerts, quick links
- **Student 360° View** (`/admin/students/:id`): Admin-only detailed student profile with activity timeline, learning signals, notes, billing
- **Server-side Role Middleware**: `server/middleware/roleAuth.ts` with `requireRole()`, `requireAdmin`, `requireTeacher` helpers
- **Legacy Route Redirects**: Old routes (`/classroom`, `/dashboard`, `/growth`, etc.) redirect to new namespaced routes
- **Key Files**: `client/src/layouts/*Layout.tsx`, `client/src/pages/admin/*.tsx`, `client/src/components/ProtectedRoute.tsx`, `server/middleware/roleAuth.ts`

### January 2026 - Student Learning Loop MVP
Added structured learning experience with mastery tracking:
- **Student Today Page** (`/student`): Personalized dashboard with 5 core cards:
  - Warmup Quiz: Quick review of prior session concepts
  - Continue Learning: Resume last topic with progress tracking
  - Quick Help: Direct access to AI tutor assistance
  - Daily Goal: Progress indicator with streak tracking
  - Next Session: Scheduled session display
- **Session Flow** (`/student/session/:subject/:topic`): 6-step guided learning experience:
  1. Warmup: 3 review questions from last session
  2. Lesson: Key concept explanation with multiple explanation styles
  3. Practice: 4 problems with hint feature and immediate feedback
  4. Reflection: Open-ended reflection prompts
  5. Exit Ticket: 2 assessment questions to verify understanding
  6. Next Steps: Session summary with scores and recommendations
- **API Endpoints**: 
  - `GET /api/student/dashboard` - Dashboard data with memory and session info
  - `GET/POST /api/student/sessions` - Session management
  - `PATCH /api/student/sessions/:id` - Update session progress
  - `GET/POST /api/student/mastery` - Topic mastery tracking
- **Onboarding Flow**: Role-based redirect after profile creation
- **Key Files**: `client/src/pages/student/StudentToday.tsx`, `client/src/pages/student/SessionFlow.tsx`, `server/routes.ts`