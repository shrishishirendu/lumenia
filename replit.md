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
    - **Mentora Variant Engine**: Rule-driven AI variant generation system for Mathematics questions with per-difficulty constraints, structural validation, and answer verification.
    - **Question Engine**: Template-based algorithmic question generator (`server/services/questionEngine/`) for deterministic, parameterised question generation without AI calls. Currently supports Linear Equations, Inequalities (30 archetypes each across 4 difficulty levels, with sign-flip logic for inequalities), Fractional Indices (30 archetypes covering radical conversion, index law application, negative indices, and rationalisation), Introduction to Surds (30 archetypes covering surd identification, simplification, combining like surds, multiplying, expanding brackets, difference of squares, and denominator rationalisation including conjugate method), Simplifying Surds (30 archetypes covering perfect square factor extraction, coefficient simplification, combining like surds after simplification, unlike surd recognition, multi-term expressions, expand-then-simplify, and surd fractions), Operations with Surds (30 archetypes covering addition/subtraction of like surds, multiplication with simplification, simplify-before-combine, expand brackets with FOIL, difference of squares, squaring binomials, product of conjugates, and multi-term mixed expressions), Expanding Binomial Products (30 archetypes across 4 difficulty levels covering monic FOIL, perfect squares, difference of squares, non-monic binomials, triple products, and combined expressions with answers in canonical polynomial form x^2+Bx+C), Perfect Squares and Difference of Squares (30 archetypes across 4 difficulty levels covering perfect square identities (x+a)^2/(x-a)^2, difference of squares (x+a)(x-a), non-monic variants, mixed sign expressions, nested simplification, multi-step combinations, and structural pattern recognition), Gradient and Parallel Lines (30 archetypes across 4 difficulty levels covering gradient from two points, gradient from equation y=mx+c, parallel lines with equal gradients, perpendicular lines in challenge, and visual questions with inline SVG coordinate diagrams), and Factorising Common Factors (30 archetypes across 4 difficulty levels covering numerical GCF extraction, variable common factors, monomial factorisation, negative common factors, multi-term expressions, higher powers, and mixed-variable factorisation). Integrated into Warm-up and Exit Ticket flows with a "Regenerate" button.
    - **Visual Questions**: Questions with inline SVG diagrams rendered via `metadata.visual` field. Supported in SessionFlow warmup/practice/exit and question engine endpoints. SVG is rendered inline with accessible alt text.

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