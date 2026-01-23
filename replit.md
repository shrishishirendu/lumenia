# Lumenia

## Overview

Lumenia is an AI-powered educational platform designed for personalized tutoring in Mathematics and English for students in Years 6-12, adhering to the Australian Curriculum. Its core feature is Mentora, an AI virtual learning guide that utilizes the Socratic method to foster problem-solving skills. The platform includes student classrooms, parent portals for progress monitoring, and an admin dashboard equipped with AI-powered growth and marketing tools. The project aims to provide comprehensive learning support and has integrated sophisticated AI agents for various operational aspects like marketing and operations, alongside a robust curriculum system and role-based access controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4, shadcn/ui (New York style)
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful endpoints (`/api/*`)
- **Build**: esbuild for production bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: `shared/schema.ts` with models in `shared/models/`
- **Session Storage**: PostgreSQL-backed sessions

### Authentication
- **Provider**: Replit OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL store
- **Implementation**: Passport.js with custom Replit strategy
- **Access Control**: Role-Based Access Control (RBAC) with role-namespaced routes (`/student/*`, `/parent/*`, `/tutor/*`, `/admin/*`) and `ProtectedRoute` component.

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**: Chat completions (Socratic tutoring), text-to-speech, speech-to-text, image generation.
- **Audio Processing**: WebM to WAV conversion (ffmpeg), AudioWorklet.
- **AI Agents**:
    - **Learning Orchestration System**: Manages learning plans, session limits, and monitors student engagement.
    - **Marketing Agent**: AI-powered proposal generation for marketing campaigns; reads from Growth Engine.
    - **Operations Agent**: AI-powered monitoring, anomaly detection, and alerting for platform health.
    - **Admissions Agent**: AI-powered lead qualification, expectation alignment analysis, and enrollment decisions.

### Admissions Agent (v0.1)
- **Purpose**: Automate lead qualification, set clear expectations, and ensure student-platform fit before enrollment.
- **Location**: `/admin/admissions` (accessible via UserCheck icon in admin sidebar)
- **Data Models**: AdmissionsAssessment, AdmissionsSettings (in `shared/schema.ts`)
- **AI Service**: `server/services/admissionsAgent.ts` - OpenAI-powered assessment with qualification scoring
- **Assessment Criteria**:
    - Year Level: 6-12 validation
    - Subject: Mathematics/English alignment
    - Expectation Keywords: Detects unrealistic expectations (urgent, immediate, quick fix)
    - Fit Score: 0-100 based on lead data quality and alignment
- **Autonomy Levels**:
    - Level 1: Recommend only - human approves all decisions
    - Level 2: Auto-qualify high-confidence (>90%), flag rest for review
    - Level 3: Full autonomy - auto-qualify and auto-reject
- **API Routes** (admin-only `/api/admissions/*`):
    - `GET /api/admissions/stats` - Dashboard statistics
    - `GET /api/admissions/queue` - Pending review assessments
    - `GET /api/admissions/assessments` - All assessments
    - `GET /api/admissions/lead/:leadId` - Assessment by lead
    - `POST /api/admissions/assess/:leadId` - Run AI assessment
    - `POST /api/admissions/decision/:id` - Record human decision
    - `GET/PUT /api/admissions/settings` - Settings management
- **UI Tabs**: Dashboard (stats), Queue (pending reviews), Leads (unassessed), Settings (configuration)
- **Growth Engine Integration**: Updates lead status and adds events on assessment decisions
- **RBAC**: Accessible by owner, admin, teacher roles.

### Growth Engine (v0.1)
- **Purpose**: Single source of truth for lead management, attribution tracking, and conversion funnel analytics.
- **Data Models**: Lead, LeadEvent, GrowthCampaign, IntegrationConfig, GrowthMetricSnapshot (in `shared/schema.ts`).
- **Lead Lifecycle**: NEW → CONTACTED → ENGAGED → CONVERTED (or DORMANT/LOST).
- **Lead Scoring**: 0-100 points, default 10 for landing form leads.
- **Attribution**: UTM params (source, medium, campaign), referrer tracking.
- **API Routes** (admin-only `/api/growth/*`):
    - `GET /api/growth/leads` - List leads with filters, pagination
    - `GET /api/growth/leads/:id` - Lead detail with events
    - `PATCH /api/growth/leads/:id` - Update lead (Zod validated)
    - `POST /api/growth/leads/:id/events` - Add lead event
    - `GET /api/growth/metrics` - Dashboard metrics
    - `GET /api/growth/campaigns` - Campaign list
- **UI**: Tabbed interface at `/admin/growth` with Dashboard, Leads, Pipeline (kanban), Sources, Settings.
- **RBAC**: Accessible by owner, admin, teacher roles.

### BI Dashboard (Preview)
- **Location**: `/admin/bi` (accessible via "BI Dashboard (Preview)" button in Growth Engine)
- **Purpose**: Exploratory data analysis with mock data (to be wired to real data later)
- **Features**:
    - **Filters**: Date Range (7/30/90 days), Segment (All/A/B), Metric (Revenue/Leads/Conversion/Retention)
    - **KPI Row**: Total metric, % change vs previous period, best channel, best segment
    - **Charts**: Line (growth comparison), Bar (by channel), Pie (by segment) - using Recharts
    - **Data Table**: Sortable columns, search filter, first 50 rows
    - **Export Data**: CSV/JSON download of filtered data
    - **Adjust Strategy**: Modal with goal slider, budget cap, risk tolerance (saves to localStorage)
- **Modularity**: Located in `client/src/features/bi/` for easy future integration with real data sources
    - `mockData.ts` - Mock data generator, filtering, aggregation, export functions
    - `BiDashboard.tsx` - Main dashboard component
    - Replace `generateMockData()` with API calls to wire to real data

### Key Design Patterns
- **Shared Types**: Common schemas and types in `shared/` for client and server.
- **Integration Modules**: Reusable AI features in `server/replit_integrations/`.
- **Storage Pattern**: Interface-based database operations.
- **Client Path Aliases**: `@/` for `client/src/`, `@shared/` for `shared/`.

### Core Features
- **Curriculum System**: Comprehensive year-level curriculum (Years 6-12) for Mathematics and English, aligned with ACARA.
- **Student Learning Loop**: Structured learning experience with warmup quizzes, lessons, practice, reflection, and exit tickets.
- **Branding**: "Lumenia" platform name, "Mentora" for AI tutor.
- **UI/UX**: Role-based navigation and layouts (blue for student, green for parent, purple for tutor, red for admin), focus on calm and encouraging tone.

## External Dependencies

### AI Services
- **OpenAI API**: For chat completions, text-to-speech, speech-to-text, and image generation.

### Database
- **PostgreSQL**: Primary data store.
- **Drizzle ORM**: For database interactions and migrations.

### Authentication
- **Replit OIDC**: For user authentication.

### Audio Processing
- **ffmpeg**: Server-side WebM to WAV conversion.

### Key NPM Packages
- `openai`: OpenAI API client.
- `drizzle-orm` / `drizzle-kit`: ORM and migrations.
- `express-session` / `connect-pg-simple`: Session management.
- `passport` / `openid-client`: Authentication.
- `p-limit` / `p-retry`: Batch processing utilities.