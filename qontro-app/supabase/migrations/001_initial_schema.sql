-- Migration 001: Initial Schema - Qontro SaaS Core Tables
-- Run against a fresh Supabase project.
-- RLS enabled on all tables; policies added in migration 004.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- WORKSPACES
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

-- WORKSPACE MEMBERS
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

-- SKILLS
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

-- PROJECTS
-- NOTE: total_tasks and completed_tasks are NOT stored columns.
-- They must be computed at query time via COUNT on the tasks table.
CREATE TABLE IF NOT EXISTS public.projects (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  client_name    text          NOT NULL DEFAULT '',
  client_id      uuid,
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

-- TASKS
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

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid          NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number text          NOT NULL,
  client_name    text          NOT NULL,
  client_email   text          NOT NULL DEFAULT '',
  client_id      uuid,
  project_id     uuid          REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name   text,
  amount         numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount     numeric(14,2) NOT NULL DEFAULT 0,
  currency       text          NOT NULL DEFAULT 'USD',
  status         text          NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','overdue')),
  issue_date     date          NOT NULL DEFAULT CURRENT_DATE,
  due_date       date          NOT NULL,
  items          jsonb         NOT NULL DEFAULT '[]',
  notes          text          NOT NULL DEFAULT '',
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- DOCUMENTS (Company Memory)
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

-- AI RECOMMENDATIONS
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

-- AUTO-UPDATE updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workspaces_updated_at  BEFORE UPDATE ON public.workspaces  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_projects_updated_at    BEFORE UPDATE ON public.projects    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_tasks_updated_at       BEFORE UPDATE ON public.tasks       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_invoices_updated_at    BEFORE UPDATE ON public.invoices    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_documents_updated_at   BEFORE UPDATE ON public.documents   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_skills_updated_at      BEFORE UPDATE ON public.skills      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();