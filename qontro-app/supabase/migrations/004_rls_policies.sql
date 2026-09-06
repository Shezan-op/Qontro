-- Migration 004: RLS Policies
-- Membership-based tenant isolation for all tables.
-- NO policy = no access (default deny is already the RLS default).
-- Every policy explicitly checks workspace membership.

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if the current auth user is a member of a given workspace.
CREATE OR REPLACE FUNCTION public.user_is_workspace_member(ws_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the role of the current auth user in a workspace.
CREATE OR REPLACE FUNCTION public.user_workspace_role(ws_id uuid)
RETURNS text AS $$
  SELECT wm.role FROM public.workspace_members wm
  WHERE wm.workspace_id = ws_id
    AND wm.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current auth user is owner or admin in a workspace.
CREATE OR REPLACE FUNCTION public.user_is_workspace_owner_or_admin(ws_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current auth user is a non-client member of a workspace.
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
-- WORKSPACES POLICIES
-- =============================================================================

-- Members can view their own workspace(s).
CREATE POLICY "workspaces_select_members"
  ON public.workspaces FOR SELECT
  USING (public.user_is_workspace_member(id));

-- Any authenticated user can create a workspace (signup flow).
CREATE POLICY "workspaces_insert_authenticated"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only the workspace owner can update workspace settings.
CREATE POLICY "workspaces_update_owner"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only the workspace owner can delete the workspace.
CREATE POLICY "workspaces_delete_owner"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================================================
-- WORKSPACE MEMBERS POLICIES
-- =============================================================================

-- Members can see other members in their workspace.
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

-- Owner/admin can add new members.
CREATE POLICY "workspace_members_insert_admin"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    -- Either this is the first row (signup trigger via service role),
    -- or the inserting user is an owner/admin.
    public.user_is_workspace_owner_or_admin(workspace_id)
    OR auth.uid() = user_id  -- Allow self-join via invite (checked at app level)
  );

-- Owner can change any member role. Members can update only their own status.
CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (public.user_is_workspace_member(workspace_id))
  WITH CHECK (
    -- Owner can update anything in their workspace
    (SELECT owner_id FROM public.workspaces WHERE id = workspace_id) = auth.uid()
    OR
    -- Admins can update non-owner members
    (public.user_workspace_role(workspace_id) = 'admin' AND role != 'owner')
    OR
    -- Members can only update their own record (status field only - enforced at app level)
    (user_id = auth.uid() AND role = (SELECT role FROM public.workspace_members WHERE workspace_id = workspace_members.workspace_id AND user_id = auth.uid()))
  );

-- Owner/admin can remove members. Cannot remove owner.
CREATE POLICY "workspace_members_delete_admin"
  ON public.workspace_members FOR DELETE
  USING (
    public.user_is_workspace_owner_or_admin(workspace_id)
    AND role != 'owner'  -- Cannot delete the owner record
  );

-- =============================================================================
-- SKILLS POLICIES
-- =============================================================================
CREATE POLICY "skills_select_members"
  ON public.skills FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

CREATE POLICY "skills_insert_internal"
  ON public.skills FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "skills_update_admin"
  ON public.skills FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "skills_delete_admin"
  ON public.skills FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- PROJECTS POLICIES
-- =============================================================================
CREATE POLICY "projects_select_members"
  ON public.projects FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

CREATE POLICY "projects_insert_internal"
  ON public.projects FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "projects_update_internal"
  ON public.projects FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "projects_delete_admin"
  ON public.projects FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- TASKS POLICIES
-- =============================================================================
CREATE POLICY "tasks_select_members"
  ON public.tasks FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

CREATE POLICY "tasks_insert_internal"
  ON public.tasks FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "tasks_update_internal"
  ON public.tasks FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "tasks_delete_admin"
  ON public.tasks FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- INVOICES POLICIES
-- =============================================================================
CREATE POLICY "invoices_select_internal"
  ON public.invoices FOR SELECT
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "invoices_insert_internal"
  ON public.invoices FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "invoices_update_internal"
  ON public.invoices FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "invoices_delete_admin"
  ON public.invoices FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- DOCUMENTS POLICIES
-- Clients can only see non-restricted documents.
-- =============================================================================
CREATE POLICY "documents_select_internal"
  ON public.documents FOR SELECT
  USING (
    public.user_is_internal_member(workspace_id)
    OR (
      public.user_is_workspace_member(workspace_id)
      AND is_restricted = false
    )
  );

CREATE POLICY "documents_insert_internal"
  ON public.documents FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "documents_update_internal"
  ON public.documents FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "documents_delete_admin"
  ON public.documents FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- AI RECOMMENDATIONS POLICIES
-- Clients cannot see AI operational data.
-- =============================================================================
CREATE POLICY "ai_recs_select_internal"
  ON public.ai_recommendations FOR SELECT
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "ai_recs_insert_internal"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

-- Only owner/admin can approve or dismiss AI recommendations.
CREATE POLICY "ai_recs_update_admin"
  ON public.ai_recommendations FOR UPDATE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

CREATE POLICY "ai_recs_delete_admin"
  ON public.ai_recommendations FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- CLIENTS POLICIES
-- =============================================================================
CREATE POLICY "clients_select_internal"
  ON public.clients FOR SELECT
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "clients_insert_internal"
  ON public.clients FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "clients_update_internal"
  ON public.clients FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "clients_delete_admin"
  ON public.clients FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- EXPENSES POLICIES
-- =============================================================================
CREATE POLICY "expenses_select_internal"
  ON public.expenses FOR SELECT
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "expenses_insert_internal"
  ON public.expenses FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

CREATE POLICY "expenses_update_internal"
  ON public.expenses FOR UPDATE
  USING (public.user_is_internal_member(workspace_id));

CREATE POLICY "expenses_delete_admin"
  ON public.expenses FOR DELETE
  USING (public.user_is_workspace_owner_or_admin(workspace_id));

-- =============================================================================
-- TASK COMMENTS POLICIES
-- =============================================================================
CREATE POLICY "task_comments_select_members"
  ON public.task_comments FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

CREATE POLICY "task_comments_insert_internal"
  ON public.task_comments FOR INSERT
  WITH CHECK (public.user_is_internal_member(workspace_id));

-- Authors can update their own comments; admins can update any.
CREATE POLICY "task_comments_update_own_or_admin"
  ON public.task_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_is_workspace_owner_or_admin(workspace_id)
  );

CREATE POLICY "task_comments_delete_own_or_admin"
  ON public.task_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.user_is_workspace_owner_or_admin(workspace_id)
  );

-- =============================================================================
-- TASK HISTORY POLICIES (immutable audit)
-- =============================================================================
CREATE POLICY "task_history_select_members"
  ON public.task_history FOR SELECT
  USING (public.user_is_workspace_member(workspace_id));

-- Task history is written by backend only (service role bypasses RLS).
-- No INSERT policy for regular users.

-- =============================================================================
-- ACTIVITY LOGS POLICIES (immutable audit)
-- =============================================================================
CREATE POLICY "activity_logs_select_internal"
  ON public.activity_logs FOR SELECT
  USING (public.user_is_internal_member(workspace_id));

-- Activity logs are written by backend only (service role bypasses RLS).
-- No INSERT policy for regular users.