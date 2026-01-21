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