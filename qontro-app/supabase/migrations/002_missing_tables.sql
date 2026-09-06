-- Migration 002: Missing Tables
-- clients, expenses, task_comments, task_history, activity_logs

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  company_name text        NOT NULL DEFAULT '',
  email        text        NOT NULL DEFAULT '',
  phone        text,
  status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','lead','past')),
  total_billed numeric(14,2) NOT NULL DEFAULT 0,
  notes        text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- EXPENSES
-- amount_cents stores value in minor currency units (e.g. cents for USD).
-- Divide by 100 for display. This avoids IEEE-754 float precision issues.
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
CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TASK COMMENTS
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
CREATE TRIGGER set_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TASK HISTORY (immutable audit trail)
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

-- ACTIVITY LOGS (workspace-level audit trail, immutable)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_name    text        NOT NULL,
  type          text        NOT NULL CHECK (type IN ('task','project','invoice','document','ai','member','client','expense')),
  action        text        NOT NULL,
  entity_id     uuid,
  details       jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;