# Deployment & Production Setup Guide: Qontro

**Document Reference:** QONTRO-DEP-V2.0  
**Target Environment:** Production Cloud (Vercel Edge + Supabase Cloud + Ollama API)  
**Alternative Environment:** Self-Hosted Docker Container + PostgreSQL  
**Database Architecture:** 13 Normalized Relational Tables with Row Level Security  
**Application Version:** 2.0 Production  

---

## 1. Prerequisites & System Requirements

Before deploying Qontro, ensure you have the following accounts and local tools:
- **Node.js:** v18.18.0 or v20.x LTS installed locally.
- **Package Manager:** `npm` v9+ (or `pnpm` / `yarn`).
- **Database Service:** A Supabase Cloud account (free tier or pro tier) or self-hosted Supabase instance.
- **AI Inference Gateway:** An Ollama Cloud API key with access to `deepseek-v4-flash:cloud` (or compatible OpenAI-compatible inference endpoint).
- **Hosting Platform:** A Vercel account, AWS Amplify, or a Linux VPS running Docker.

---

## 2. Step 1: Database Provisioning on Supabase

1. Log in to your [Supabase Dashboard](https://app.supabase.com) and create a new project.
2. Note your **Project URL** and **API Keys** (Anon key and Service Role key) from **Project Settings** > **API**.
3. Open the **SQL Editor** tab in your Supabase project.
4. Copy the entire contents of `qontro-app/supabase-schema.sql` (the consolidated 13-table schema including all RLS policies, indexes, and triggers) and paste it into the editor.
5. Click **Run** to execute the schema script. This creates:
   - **13 Normalized Tables**: `workspaces`, `workspace_members`, `skills`, `projects`, `tasks`, `invoices`, `documents`, `ai_recommendations`, `clients`, `expenses`, `task_comments`, `task_history`, `activity_logs`.
   - **Security Helper Functions**: `user_is_workspace_member`, `user_workspace_role`, `user_is_workspace_owner_or_admin`, `user_is_internal_member`.
   - **Automated Triggers**: `handle_new_user` (provisions workspace on signup) and `handle_updated_at`.
   - **Views**: `project_task_counts` for real-time project health calculations.
   - **Indexes**: Optimized B-Tree indexes across all foreign keys and high-frequency filter queries.
6. Navigate to **Authentication** > **URL Configuration** and add your production domain to the **Redirect URLs** list:
   - Development: `http://localhost:3000/auth/callback` or `http://localhost:3005/auth/callback`
   - Production: `https://app.youragency.com/auth/callback`

---

## 3. Step 2: Local Environment Configuration

Clone the repository and install project dependencies:

```bash
# Clone the repository
git clone https://github.com/your-org/qontro.git
cd qontro/qontro-app

# Install dependencies
npm install

# Create local environment configuration
cp .env.example .env.local
```

### Configure `.env.local`
Edit `qontro-app/.env.local` with your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# DeepSeek-V4 AI Operations Configuration (Ollama Cloud)
OLLAMA_API_KEY="your-verified-ollama-api-key"
OLLAMA_MODEL="deepseek-v4-flash:cloud"
```

### Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to verify the local build.

---

## 4. Step 3: Production Cloud Deployment (Vercel)

Vercel provides native edge routing, Turbopack incremental compilation, and automated SSL for Next.js 16 applications.

### 4.1 Connecting Git Repository
1. Push your repository to GitHub or GitLab.
2. Navigate to your [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import the `qontro` repository.
4. Set the **Root Directory** to `qontro-app`.
5. Ensure the framework preset is set to **Next.js**.

### 4.2 Setting Production Environment Variables
In the Vercel project configuration, add the following environment variables:

| Key | Value Description | Exposed to Client? |
| :--- | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | **No (Server-Only)** |
| `OLLAMA_API_KEY` | Ollama Cloud authentication token | **No (Server-Only)** |
| `OLLAMA_MODEL` | `deepseek-v4-flash:cloud` | **No (Server-Only)** |

### 4.3 Triggering Build & Deployment
Click **Deploy**. Vercel will run `next build` and deploy edge middleware and serverless route handlers. Once deployed, verify that:
- `/` loads the Founder Command Cockpit.
- `/tasks` displays the Kanban execution board with optimistic drag-and-drop.
- `/finance` displays invoices, clients, expenses, and PDF generator.
- `/memory` displays SOPs and contract templates with DOMPurify sanitization.
- `/ai-ops` connects to `/api/ai` for operational triage.

---

## 5. Production Health Verification Checklist

- [ ] Supabase database has all 13 tables created and RLS enabled.
- [ ] New user signup triggers `handle_new_user` and creates initial workspace.
- [ ] User login establishes HttpOnly session cookies refreshed by `src/middleware.ts`.
- [ ] Task creation preserves client UUID in Supabase without foreign key mismatch.
- [ ] Document creation sanitizes XSS payloads before render.
- [ ] PDF download generates a clean branded invoice file via `html2canvas` + `jsPDF`.
- [ ] AI triage endpoint `/api/ai` returns structured recommendations or falls back gracefully without 500 error.
