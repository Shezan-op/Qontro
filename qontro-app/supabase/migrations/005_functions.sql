-- Migration 005: Functions & Triggers
-- Signup trigger: auto-creates workspace + owner membership when a new auth user registers.

-- =============================================================================
-- SIGNUP TRIGGER
-- Fires AFTER INSERT on auth.users.
-- Creates a workspace and owner membership record atomically.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id uuid;
  ws_name          text;
  user_name        text;
  ws_slug          text;
BEGIN
  -- Read metadata passed from supabase.auth.signUp({ options: { data: { ... } } })
  ws_name   := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'workspace_name'), ''), 'My Organization');
  user_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Founder');

  -- Generate slug: lowercase alphanumeric + hyphens + unique suffix from user id
  ws_slug := lower(regexp_replace(ws_name, '[^a-zA-Z0-9]+', '-', 'g'))
             || '-' || substring(NEW.id::text, 1, 8);

  -- Create the workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (ws_name, ws_slug, NEW.id)
  RETURNING id INTO new_workspace_id;

  -- Create the owner membership
  INSERT INTO public.workspace_members (workspace_id, user_id, name, email, role, designation)
  VALUES (
    new_workspace_id,
    NEW.id,
    user_name,
    COALESCE(NEW.email, ''),
    'owner',
    'Managing Director'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- WORKSPACE TASK COUNT VIEW (helper view for project health)
-- Returns task counts per project for display in the dashboard.
-- =============================================================================

CREATE OR REPLACE VIEW public.project_task_counts AS
SELECT
  project_id,
  COUNT(*) FILTER (WHERE archived_at IS NULL)                    AS total_tasks,
  COUNT(*) FILTER (WHERE status = 'completed' AND archived_at IS NULL) AS completed_tasks,
  COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status != 'completed' AND archived_at IS NULL) AS overdue_tasks
FROM public.tasks
WHERE project_id IS NOT NULL
GROUP BY project_id;