# Lumenia

## Overview

Lumenia is an AI-powered educational platform offering personalized tutoring in Mathematics and English for Australian students in Years 6-12. Its primary goal is to foster problem-solving skills through Mentora, an AI virtual learning guide utilizing the Socratic method. The platform supports student classrooms, parent progress monitoring, and an admin dashboard with AI-driven growth and marketing tools. Lumenia aims to provide comprehensive learning support, integrating advanced AI agents for various operational aspects, a robust curriculum system, and role-based access controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4, shadcn/ui (New York style)

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful endpoints (`/api/*`)

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: `shared/schema.ts`

### Authentication
- **Provider**: Replit OpenID Connect (OIDC)
- **Access Control**: Role-Based Access Control (RBAC) with role-namespaced routes and a `ProtectedRoute` component.

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**: Chat completions (Socratic tutoring), text-to-speech, speech-to-text, image generation.
- **AI Agents**:
    - **Learning Orchestration System**: Manages learning plans and student engagement.
    - **Marketing Agent**: AI-powered proposal generation.
    - **Operations Agent**: AI-powered monitoring and anomaly detection.
    - **Admissions Agent**: Automates lead qualification and enrollment decisions with configurable autonomy.
    - **Academic Quality Agent**: Monitors student progress, identifies at-risk students, and recommends interventions with configurable autonomy.
    - **Question Variant Generation**: AI-generates ephemeral numeric question variants to prevent memorization.

### Core Features
- **Curriculum System**: Comprehensive, ACARA-aligned curriculum for Years 6-12 Mathematics and English.
- **Student Learning Loop**: Structured experience including quizzes, lessons, practice, and reflection.
- **Branding**: "Lumenia" platform, "Mentora" AI tutor.
- **UI/UX**: Role-based navigation and layouts (blue for student, green for parent, purple for tutor, red for admin) with a calm and encouraging tone.
- **Topic Notes**: Supplementary reference notes for database-backed topics, viewable by students in a side panel.

### Key Design Patterns
- **Shared Types**: Common schemas and types in `shared/` for client and server.
- **Integration Modules**: Reusable AI features.
- **Storage Pattern**: Interface-based database operations.

## External Dependencies

### AI Services
- **OpenAI API**

### Database
- **PostgreSQL**
- **Drizzle ORM**

### Authentication
- **Replit OIDC**

### Audio Processing
- **ffmpeg** (for WebM to WAV conversion)