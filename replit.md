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

### Academic Quality Agent (v0.1)
- **Purpose**: Monitor student progress, identify at-risk students, and ensure learning outcomes are being met.
- **Location**: `/admin/academic-quality` (accessible via GraduationCap icon in admin sidebar)
- **Data Models**: AcademicAlert, AcademicQualitySettings (in `shared/schema.ts`)
- **AI Service**: `server/services/academicQualityAgent.ts` - OpenAI-powered student analysis with intervention recommendations
- **Alert Types**:
    - low_mastery: Student mastery below threshold
    - declining_progress: Performance declining over time
    - low_engagement: Low activity or engagement score
    - struggling_topic: Difficulty with specific subject/topic
    - at_risk: Multiple critical indicators requiring intervention
    - improvement_opportunity: Positive trend that could be accelerated
- **Autonomy Levels**:
    - Level 1: Monitor only - generates alerts for human review
    - Level 2: Alert + Recommend - notifies tutors automatically
    - Level 3: Full autonomy - auto-escalates critical issues
- **API Routes** (admin-only `/api/academic-quality/*`):
    - `GET /api/academic-quality/stats` - Dashboard statistics
    - `GET /api/academic-quality/alerts` - All alerts with optional status filter
    - `GET /api/academic-quality/student/:studentId/alerts` - Student-specific alerts
    - `POST /api/academic-quality/analyze/:studentId` - Run AI analysis on student
    - `POST /api/academic-quality/scan` - Scan all students for issues
    - `PATCH /api/academic-quality/alerts/:id` - Update alert status
    - `GET/PUT /api/academic-quality/settings` - Settings management
- **UI Tabs**: Dashboard (stats, critical alerts), Alerts (all alerts list), Students (at-risk students), Settings (thresholds)
- **Settings**: Mastery threshold, engagement threshold, inactivity days, auto-notify options, scan frequency
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

### Student Course Navigation (MVP)
- **My Subjects Page** (`/student/subjects`): Lists active subjects from DB, shows "Continue" if teaching plan exists, "Start" otherwise. Reads student grade from `profiles.grade`.
- **Course Page** (`/student/course/:subjectId`): Shows curriculum for subject + student year level using `getCurriculum()` from `shared/curriculum.ts`. Units are expandable to reveal lessons. Auto-creates `teaching_plans` record on first visit.
- **API Routes**:
    - `GET /api/student/subjects` - Active subjects with teaching plan status
    - `GET /api/student/course/:subjectId` - Course curriculum + auto-create teaching plan
- **Navigation**: "My Subjects" link in StudentToday "What's next" section and sidebar nav (BookOpen icon).
- **AI Year Level**: `generateTutoringResponse()` now accepts optional `yearLevel` parameter; injected as system message "Student grade: Year {n}." for age-appropriate content.

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