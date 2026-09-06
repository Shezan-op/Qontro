-- =============================================================================
-- QONTRO UNIFIED PRODUCTION DATABASE SCHEMA (MIGRATIONS 001 - 005 CONSOLIDATED)
-- Engine: PostgreSQL 15+ (Supabase)
-- Multi-Tenancy: Row Level Security (RLS) with Workspace-Level Scoping
-- Tables: 13 Core Normalized Relational Tables
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. HELPER TRIGGER & SECURITY FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify if current auth user is a member of a given workspace
CREATE OR REPLACE FUNCTION public.user_is_workspace_member(ws_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get role of current auth user in a workspace
CREATE OR REPLACE FUNCTION public.user_workspace_role(ws_id uuid)
RETURNS text AS $$
  SELECT wm.role FROM public.workspace_members wm
  WHERE wm.workspace_id = ws_id AND wm.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verify if current auth user is owner or admin in a workspace
CREATE OR REPLACE FUNCTION public.user_is_workspace_owner_or_admin(ws_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verify if current auth user is an internal member (non-client)
CREATE OR REPLACE FUNCTION public.user_is_internal_member(ws_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'member')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- 2. TABLE DEFINITIONS (13 TABLES)
-- =============================================================================

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  logo        text,
  owner_id    uuid        NOT NULL,
  currency    text        NOT NULL DEFAULT 'USD',
  timezone    text        DEFAULT 'UTC',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER set_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL,
  name                text        NOT NULL,
  email               text        NOT NULL,
  avatar              text,
  role                text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','client')),
  designation         text        NOT NULL DEFAULT 'Team Member',
  workload_percentage integer     NOT NULL DEFAULT 0 CHECK (workload_percentage >= 0 AND workload_percentage <= 100),
  status              text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','busy','away')),
  joined_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 3. SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id              uuid        NOT NULL,
  skill_name           text        NOT NULL,
  score                integer     NOT NULL DEFAULT 5 CHECK (score >= 1 AND score <= 10),
  category             text        NOT NULL DEFAULT 'engineering'
                         CHECK (category IN ('engineering','design','content','marketing','operations')),
  verified_tasks_count integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, skill_name)
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_skills_updated_at ON public.skills;
CREATE TRIGGER set_skills_updated_at BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         text          NOT NULL,
  company_name text          NOT NULL DEFAULT '',
  email        text          NOT NULL DEFAULT '',
  phone        text,
  status       text          NOT NULL DEFAULT 'active' CHECK (status IN ('active','lead','past')),
  total_billed numeric(14,2) NOT NULL DEFAULT 0,
  notes        text          NOT NULL DEFAULT '',
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  client_name    text          NOT NULL DEFAULT '',
  client_id      uuid          REFERENCES public.clients(id) ON DELETE SET NULL,
  description    text          NOT NULL DEFAULT '',
  budget         numeric(14,2) NOT NULL DEFAULT 0,
  deadline       date          NOT NULL,
  status         text          NOT NULL DEFAULT 'planning'
                   CHECK (status IN ('planning','active','warning','critical','completed','paused')),
  health_score   integer       NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  lead_member_id uuid,
  archived_at    timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id      uuid          REFERENCES public.projects(id) ON DELETE SET NULL,
  title           text          NOT NULL,
  description     text          NOT NULL DEFAULT '',
  assigned_to     uuid,
  priority        text          NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('urgent','high','medium','low')),
  status          text          NOT NULL DEFAULT 'backlog'
                    CHECK (status IN ('backlog','todo','doing','review','completed','blocked')),
  required_skills text[]        NOT NULL DEFAULT '{}',
  estimated_hours numeric(6,2)  NOT NULL DEFAULT 0,
  deadline        date,
  completed_at    timestamptz,
  archived_at     timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. TASK COMMENTS
CREATE TABLE IF NOT EXISTS public.task_comments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id      uuid        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL,
  author_name  text        NOT NULL,
  content      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER set_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TASK HISTORY (Immutable audit log per task)
CREATE TABLE IF NOT EXISTS public.task_history (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id        uuid        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_user_id  uuid,
  actor_name     text        NOT NULL,
  action         text        NOT NULL,
  previous_value text,
  new_value      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- 9. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number text          NOT NULL,
  client_name    text          NOT NULL,
  client_email   text          NOT NULL DEFAULT '',
  client_id      uuid          REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id     uuid          REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name   text,
  amount         numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount     numeric(14,2) NOT NULL DEFAULT 0,
  currency       text          NOT NULL DEFAULT 'USD',
  status         text          NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','overdue')),
  issue_date     date          NOT NULL DEFAULT CURRENT_DATE,
  due_date       date          NOT NULL,
  items          jsonb         NOT NULL DEFAULT '[]'::jsonb,
  notes          text          NOT NULL DEFAULT '',
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. EXPENSES (amount_cents stores minor currency units to eliminate float drift)
CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  category     text        NOT NULL DEFAULT 'other'
                 CHECK (category IN ('software','contractor','payroll','marketing','office','other')),
  amount_cents bigint      NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency     text        NOT NULL DEFAULT 'USD',
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  project_id   uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  notes        text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. DOCUMENTS (Company Memory)
CREATE TABLE IF NOT EXISTS public.documents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  content         text        NOT NULL DEFAULT '',
  type            text        NOT NULL DEFAULT 'sop'
                    CHECK (type IN ('sop','contract','template','meeting_notes','guide')),
  category        text        NOT NULL DEFAULT 'General',
  tags            text[]      NOT NULL DEFAULT '{}',
  created_by_id   uuid,
  created_by_name text        NOT NULL DEFAULT '',
  is_restricted   boolean     NOT NULL DEFAULT false,
  archived_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. AI RECOMMENDATIONS (Staging for Human-in-the-Loop Governance)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type                  text        NOT NULL
                          CHECK (type IN ('assignment','overload','deadline_risk','daily_priority')),
  title                 text        NOT NULL,
  description           text        NOT NULL DEFAULT '',
  target_task_id        uuid        REFERENCES public.tasks(id) ON DELETE SET NULL,
  recommended_member_id uuid,
  current_member_id     uuid,
  match_score           integer     CHECK (match_score >= 0 AND match_score <= 100),
  reasons               text[]      NOT NULL DEFAULT '{}',
  status                text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','dismissed')),
  approved_by           uuid,
  approved_at           timestamptz,
  dismissed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 13. ACTIVITY LOGS (Workspace Event Bus)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_name    text        NOT NULL,
  type          text        NOT NULL CHECK (type IN ('task','project','invoice','document','ai','member','client','expense')),
  action        text        NOT NULL,
  entity_id     uuid,
  details       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. INDEXES (B-TREE FOR OPTIMAL MULTI-TENANT QUERYING)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id      ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_workspace_id            ON public.skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_category           ON public.skills(user_id, category);
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id           ON public.clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id          ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status                ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id             ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id             ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id               ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status                   ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to              ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline                 ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_task_comments_workspace_id     ON public.task_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id          ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_workspace_id      ON public.task_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id           ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id          ON public.invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status                ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id             ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id            ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_workspace_id          ON public.expenses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id            ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category              ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id         ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_type                 ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_ai_recs_workspace_id           ON public.ai_recommendations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status                 ON public.ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id     ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at       ON public.activity_logs(created_at DESC);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- WORKSPACES
CREATE POLICY "workspaces_select_members" ON public.workspaces FOR SELECT USING (public.user_is_workspace_member(id));
CREATE POLICY "workspaces_insert_authenticated" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_update_owner" ON public.workspaces FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workspaces_delete_owner" ON public.workspaces FOR DELETE USING (owner_id = auth.uid());

-- WORKSPACE MEMBERS
CREATE POLICY "workspace_members_select" ON public.workspace_members FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members FOR INSERT WITH CHECK (public.user_is_workspace_owner_or_admin(workspace_id) OR auth.uid() = user_id);
CREATE POLICY "workspace_members_update" ON public.workspace_members FOR UPDATE USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "workspace_members_delete_admin" ON public.workspace_members FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id) AND role != 'owner');

-- SKILLS
CREATE POLICY "skills_select_members" ON public.skills FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "skills_insert_internal" ON public.skills FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "skills_update_admin" ON public.skills FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "skills_delete_admin" ON public.skills FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- CLIENTS
CREATE POLICY "clients_select_internal" ON public.clients FOR SELECT USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "clients_insert_internal" ON public.clients FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "clients_update_internal" ON public.clients FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "clients_delete_admin" ON public.clients FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- PROJECTS
CREATE POLICY "projects_select_members" ON public.projects FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "projects_insert_internal" ON public.projects FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "projects_update_internal" ON public.projects FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "projects_delete_admin" ON public.projects FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- TASKS
CREATE POLICY "tasks_select_members" ON public.tasks FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "tasks_insert_internal" ON public.tasks FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "tasks_update_internal" ON public.tasks FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "tasks_delete_admin" ON public.tasks FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- TASK COMMENTS
CREATE POLICY "task_comments_select_members" ON public.task_comments FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "task_comments_insert_internal" ON public.task_comments FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "task_comments_update_own_or_admin" ON public.task_comments FOR UPDATE USING (user_id = auth.uid() OR public.user_is_workspace_owner_or_admin(workspace_id));
CREATE POLICY "task_comments_delete_own_or_admin" ON public.task_comments FOR DELETE USING (user_id = auth.uid() OR public.user_is_workspace_owner_or_admin(workspace_id));

-- TASK HISTORY
CREATE POLICY "task_history_select_members" ON public.task_history FOR SELECT USING (public.user_is_workspace_member(workspace_id));
CREATE POLICY "task_history_insert_internal" ON public.task_history FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));

-- INVOICES
CREATE POLICY "invoices_select_internal" ON public.invoices FOR SELECT USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "invoices_insert_internal" ON public.invoices FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "invoices_update_internal" ON public.invoices FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "invoices_delete_admin" ON public.invoices FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- EXPENSES
CREATE POLICY "expenses_select_internal" ON public.expenses FOR SELECT USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "expenses_insert_internal" ON public.expenses FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "expenses_update_internal" ON public.expenses FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "expenses_delete_admin" ON public.expenses FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- DOCUMENTS
CREATE POLICY "documents_select_internal" ON public.documents FOR SELECT USING (
  public.user_is_internal_member(workspace_id)
  OR (public.user_is_workspace_member(workspace_id) AND is_restricted = false)
);
CREATE POLICY "documents_insert_internal" ON public.documents FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "documents_update_internal" ON public.documents FOR UPDATE USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "documents_delete_admin" ON public.documents FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- AI RECOMMENDATIONS
CREATE POLICY "ai_recs_select_internal" ON public.ai_recommendations FOR SELECT USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "ai_recs_insert_internal" ON public.ai_recommendations FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));
CREATE POLICY "ai_recs_update_admin" ON public.ai_recommendations FOR UPDATE USING (public.user_is_workspace_owner_or_admin(workspace_id));
CREATE POLICY "ai_recs_delete_admin" ON public.ai_recommendations FOR DELETE USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- ACTIVITY LOGS
CREATE POLICY "activity_logs_select_internal" ON public.activity_logs FOR SELECT USING (public.user_is_internal_member(workspace_id));
CREATE POLICY "activity_logs_insert_internal" ON public.activity_logs FOR INSERT WITH CHECK (public.user_is_internal_member(workspace_id));

-- =============================================================================
-- 5. SIGNUP TRIGGER & HELPER VIEWS
-- =============================================================================

-- Auto-provision workspace & owner record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id uuid;
  ws_name          text;
  user_name        text;
  ws_slug          text;
BEGIN
  ws_name   := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'workspace_name'), ''), 'My Organization');
  user_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Founder');
  ws_slug   := lower(regexp_replace(ws_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(NEW.id::text, 1, 8);

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (ws_name, ws_slug, NEW.id)
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, name, email, role, designation)
  VALUES (new_workspace_id, NEW.id, user_name, COALESCE(NEW.email, ''), 'owner', 'Managing Director');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- View: Project Task Aggregates (Health & Progress Calculation)
CREATE OR REPLACE VIEW public.project_task_counts AS
SELECT
  project_id,
  COUNT(*) FILTER (WHERE archived_at IS NULL) AS total_tasks,
  COUNT(*) FILTER (WHERE status = 'completed' AND archived_at IS NULL) AS completed_tasks,
  COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status != 'completed' AND archived_at IS NULL) AS overdue_tasks
FROM public.tasks
WHERE project_id IS NOT NULL
GROUP BY project_id;
