# Qontro: Founder Command Cockpit & AI Operations System

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![AI Model](https://img.shields.io/badge/DeepSeek--V4--Flash-Ollama%20Cloud-purple?style=flat)](https://ollama.com/)

Qontro is an integrated operations platform engineered for modern technical agencies, boutique studios, and digital consultancies. It consolidates deliverables, team bandwidth, institutional knowledge, and billing into a single high-velocity interface.

---

## 1. Core Modules

1. **Founder Command Cockpit (`/`):** High-velocity morning triage answering *"What needs my attention today?"* across at-risk projects, overdue milestones, team burnout alerts, and pending cashflow.
2. **Execution Board & Skill Routing (`/tasks`):** Drag-and-drop Kanban board with sub-16ms optimistic UI updates, immutable task audit trails, and automated member recommendations based on verified skill scores.
3. **Company Memory (`/memory`):** Centralized repository for Standard Operating Procedures (SOPs), master service agreements (MSAs), and contract templates with 1-click duplication.
4. **Finance Lite & Invoicing (`/finance`):** Lightweight receivables ledger, expense tracking, real-time net profit estimation, client directory, and printable PDF invoice generator.
5. **AI Operations Engine (`/ai-ops`):** Autonomous resource allocation and workload rebalancing assistant powered by DeepSeek-V4 under strict human-in-the-loop governance.

---

## 2. Technology Stack

- **Frontend Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling & Design System:** Tailwind CSS v4 + Dark Contro theme tokens + Lucide Icons
- **State & Optimistic UI:** Zustand with optimistic mutations and background persistence
- **Database & Auth:** Supabase Cloud (PostgreSQL 15+ with Row Level Security, `@supabase/ssr` cookies)
- **AI Inference Gateway:** DeepSeek-V4-Flash Cloud via Ollama Cloud REST API

---

## 3. Project Directory Topology

```
qontro/
├── documentation/             # Complete 14-document technical & project suite
│   ├── 01_PROJECT_REPORT.md
│   ├── 02_SRS_DOCUMENT.md
│   ├── 03_SOFTWARE_DESIGN_DOCUMENT.md
│   ├── ...
│   └── INDEX.md
├── qontro-app/                # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/   # Cockpit, tasks, projects, team, finance, memory, ai-ops
│   │   │   ├── api/ai/        # DeepSeek-V4 Ollama route handler
│   │   │   ├── auth/callback/ # Supabase OAuth & code exchange
│   │   │   └── globals.css    # Tailwind CSS v4 design tokens
│   │   ├── components/        # Header, Sidebar, Kanban, Modals
│   │   ├── lib/               # Supabase clients, utils, mock fixtures
│   │   ├── services/          # Asynchronous Supabase service layer
│   │   ├── store/             # Zustand global state store
│   │   └── types/             # Strict TypeScript domain interfaces
│   ├── supabase-schema.sql    # Complete PostgreSQL DDL with RLS policies
│   ├── package.json           # Application dependencies & scripts
│   └── tsconfig.json          # TypeScript compiler configuration
└── README.md                  # Root project documentation
```

---

## 4. Quickstart Guide

### Prerequisites
- Node.js 18.18+ or 20.x LTS
- A Supabase Cloud account (or local PostgreSQL instance)
- An Ollama Cloud API key (for DeepSeek-V4 AI features)

### Installation Steps

```bash
# 1. Clone repository & navigate to web app
git clone https://github.com/your-org/qontro.git
cd qontro/qontro-app

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env.local)
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
OLLAMA_API_KEY="your-ollama-cloud-key"
OLLAMA_MODEL="deepseek-v4-flash:cloud"
```

### Run the Development Server
```bash
npm run dev -- -p 3005
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 5. Security & Tenant Isolation

- **Database-Level Isolation:** Every table enables PostgreSQL Row Level Security (RLS). Cross-tenant queries are blocked at the database kernel level based on JWT claims.
- **Edge Cookie Authentication:** User sessions are refreshed at the edge using `@supabase/ssr` with secure `HttpOnly` cookie handling.
- **Human-in-the-Loop AI:** The AI Operations Engine cannot execute database state modifications without explicit human approval.

---

## 6. Available Scripts

- `npm run dev -- -p 3005`: Starts the Next.js development server on port 3005.
- `npm run build`: Compiles production TypeScript bundle and generates optimized static/server routes.
- `npm run start`: Launches production server.
- `npm run lint`: Runs ESLint code quality checks.
