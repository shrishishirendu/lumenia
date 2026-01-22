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
    - **Marketing Agent**: AI-powered proposal generation for marketing campaigns.
    - **Operations Agent**: AI-powered monitoring, anomaly detection, and alerting for platform health.

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