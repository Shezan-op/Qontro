-- Migration 003: Performance Indexes
-- All FK columns and common query filters indexed.

-- workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id         ON public.workspaces(owner_id);

-- workspace_members
CREATE INDEX IF NOT EXISTS idx_wm_workspace_id             ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user_id                  ON public.workspace_members(user_id);

-- skills
CREATE INDEX IF NOT EXISTS idx_skills_workspace_id         ON public.skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id              ON public.skills(user_id);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id       ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status             ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline           ON public.projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_client_id          ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_member_id     ON public.projects(lead_member_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id          ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id            ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to           ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status                ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority              ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline              ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at            ON public.tasks(created_at DESC);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id       ON public.invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status             ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id          ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date           ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at         ON public.invoices(created_at DESC);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id      ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_type              ON public.documents(type);

-- ai_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_recs_workspace_id        ON public.ai_recommendations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status              ON public.ai_recommendations(status);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id        ON public.clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_status              ON public.clients(status);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_workspace_id       ON public.expenses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id         ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date               ON public.expenses(date DESC);

-- task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_workspace_id  ON public.task_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id       ON public.task_comments(task_id);

-- task_history
CREATE INDEX IF NOT EXISTS idx_task_history_workspace_id   ON public.task_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id        ON public.task_history(task_id);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id  ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at    ON public.activity_logs(created_at DESC);