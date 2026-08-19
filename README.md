# Qontro ⚡
> **AI-Powered Multi-Tenant Founder Command Cockpit & Operations Operating System**

Qontro is an integrated operations platform engineered for modern technical agencies and digital studios. It combines five core operational pillars into a single unified workspace:

1. **Founder Command Cockpit:** High-velocity triage answering *"What needs my attention?"* (delayed deliverables, team burnout, and pending cashflow).
2. **Execution System:** Interactive Drag-and-Drop Kanban with verified skill tag routing and immutable task audit histories.
3. **Company Memory:** Centralized knowledge base for Standard Operating Procedures (SOPs), legal agreements, and contract templates with 1-click duplication.
4. **Money Flow & Receivables:** Invoicing ledger, expense tracker, net profit estimation, client directory, and printable PDF invoice generator.
5. **AI Operations Engine:** Autonomous resource allocation and workload rebalancing assistant powered by DeepSeek-V4 under human-in-the-loop governance.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Dark Contro Theme tokens + Lucide Icons
- **State & Sync:** Zustand with optimistic UI mutations and Supabase Realtime fallback
- **Database & Auth:** Supabase (PostgreSQL 15+ with Row-Level Security, `@supabase/ssr` cookies)
- **AI Inference:** DeepSeek-V4-Flash Cloud via Ollama Cloud REST APIs

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- A Supabase Project with Row-Level Security enabled

### 2. Installation & Setup

```bash
# Navigate to the app directory
cd qontro-app

# Install dependencies
npm install

# Configure environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
OLLAMA_API_KEY="your-ollama-cloud-key"
OLLAMA_MODEL="deepseek-v4-flash:cloud"

# Run local development server
npm run dev -- -p 3005
```

Open [http://localhost:3005](http://localhost:3005) to access the application.

---

## 🔒 Security & Tenant Isolation

- Multi-tenant architecture enforced via database-level **Row Level Security (RLS)**.
- Secure cookie-based authentication with automatic edge middleware session refreshing.
- Zero cross-tenant data leaks.
