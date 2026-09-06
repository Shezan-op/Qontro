import { createClient } from '@/lib/supabase/client';
import {
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  TaskComment,
  TaskHistory,
  Skill,
  Invoice,
  Document,
  Client,
  Expense,
  AIRecommendation,
  ActivityLog,
} from '@/types';

/**
 * QontroSupabaseService
 *
 * All methods communicate directly with Supabase under Row Level Security.
 * Do NOT call these from React render -- call from store actions or useEffect.
 * Errors are thrown so the caller can decide how to handle them.
 *
 * Note: total_tasks and completed_tasks are NOT columns in the projects table.
 * They must be computed by the caller from the tasks array or project_task_counts view.
 */
export class QontroSupabaseService {
  private static getClient() {
    return createClient();
  }

  // --------------------------------------------------------------------------
  // WORKSPACES
  // --------------------------------------------------------------------------
  static async fetchUserWorkspaces(): Promise<Workspace[]> {
    const supabase = this.getClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('fetchUserWorkspaces: User not authenticated');

    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace:workspaces(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true });

    if (error) throw new Error('fetchUserWorkspaces: ' + error.message);
    const workspaces = (data ?? [])
      .map((row: Record<string, unknown>) => row.workspace)
      .filter(Boolean) as Workspace[];

    return workspaces;
  }

  static async createWorkspace(name: string, currency: string = 'USD'): Promise<Workspace | null> {
    const supabase = this.getClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('createWorkspace: User not authenticated');

    const cleanName = name.trim() || 'My Agency';
    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase || 'ws'}-${user.id.substring(0, 8)}`;

    // 1. Insert into workspaces
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: cleanName,
        slug,
        owner_id: user.id,
        currency,
      })
      .select()
      .single();

    if (wsError) throw new Error('createWorkspace: ' + wsError.message);

    // 2. Insert into workspace_members as owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        name: user.user_metadata?.full_name || 'Founder',
        email: user.email || '',
        role: 'owner',
        designation: 'Managing Director',
        workload_percentage: 0,
      });

    if (memberError) {
      console.warn('[SupabaseService] Member record insertion warning:', memberError.message);
    }

    return workspace as Workspace;
  }

  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  static async fetchProjects(workspaceId: string): Promise<Project[]> {
    const { data, error } = await this.getClient()
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchProjects: ' + error.message);
    return (data ?? []) as Project[];
  }

  static async createProject(
    project: Omit<Project, 'id' | 'created_at' | 'health_score' | 'updated_at' | 'archived_at'>
  ): Promise<Project | null> {
    const { data, error } = await this.getClient()
      .from('projects')
      .insert({ ...project, health_score: 100 })
      .select()
      .single();

    if (error) throw new Error('createProject: ' + error.message);
    return data as Project;
  }

  static async updateProject(
    projectId: string,
    patch: Partial<Omit<Project, 'id' | 'created_at' | 'workspace_id'>>
  ): Promise<boolean> {
    const { error } = await this.getClient()
      .from('projects')
      .update(patch)
      .eq('id', projectId);

    if (error) throw new Error('updateProject: ' + error.message);
    return true;
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error('deleteProject: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // TASKS
  // --------------------------------------------------------------------------
  static async fetchTasks(workspaceId: string): Promise<Task[]> {
    const { data, error } = await this.getClient()
      .from('tasks')
      .select('*, comments:task_comments(*)')
      .eq('workspace_id', workspaceId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchTasks: ' + error.message);
    return (data ?? []) as Task[];
  }

  /**
   * createTask: preserves client-generated task.id if provided to eliminate
   * split-brain ID divergence between Zustand and child foreign keys.
   */
  static async createTask(
    task: Partial<Pick<Task, 'id'>> & Omit<Task, 'id' | 'created_at'>
  ): Promise<Task | null> {
    const { comments: _comments, ...taskData } = task as Task & { comments?: unknown };
    const { data, error } = await this.getClient()
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw new Error('createTask: ' + error.message);
    return data as Task;
  }

  static async updateTaskStatus(taskId: string, status: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('tasks')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) throw new Error('updateTaskStatus: ' + error.message);
    return true;
  }

  static async updateTask(
    taskId: string,
    patch: Partial<Omit<Task, 'id' | 'created_at' | 'workspace_id'>>
  ): Promise<boolean> {
    const { error } = await this.getClient()
      .from('tasks')
      .update(patch)
      .eq('id', taskId);

    if (error) throw new Error('updateTask: ' + error.message);
    return true;
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error('deleteTask: ' + error.message);
    return true;
  }

  static async createTaskComment(
    comment: Omit<TaskComment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TaskComment | null> {
    const { data, error } = await this.getClient()
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw new Error('createTaskComment: ' + error.message);
    return data as TaskComment;
  }

  // --------------------------------------------------------------------------
  // TASK HISTORY (Immutable Audit Trail)
  // --------------------------------------------------------------------------
  static async fetchTaskHistory(workspaceId: string, taskId?: string): Promise<TaskHistory[]> {
    let query = this.getClient()
      .from('task_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query;
    if (error) throw new Error('fetchTaskHistory: ' + error.message);
    return (data ?? []) as TaskHistory[];
  }

  static async createTaskHistory(
    entry: Omit<TaskHistory, 'id' | 'created_at'>
  ): Promise<TaskHistory | null> {
    const { data, error } = await this.getClient()
      .from('task_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw new Error('createTaskHistory: ' + error.message);
    return data as TaskHistory;
  }

  // --------------------------------------------------------------------------
  // INVOICES
  // --------------------------------------------------------------------------
  static async fetchInvoices(workspaceId: string): Promise<Invoice[]> {
    const { data, error } = await this.getClient()
      .from('invoices')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchInvoices: ' + error.message);
    return (data ?? []) as Invoice[];
  }

  static async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice | null> {
    const { data, error } = await this.getClient()
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) throw new Error('createInvoice: ' + error.message);
    return data as Invoice;
  }

  static async updateInvoiceStatus(invoiceId: string, status: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);

    if (error) throw new Error('updateInvoiceStatus: ' + error.message);
    return true;
  }

  static async deleteInvoice(invoiceId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw new Error('deleteInvoice: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------------------------
  static async fetchDocuments(workspaceId: string): Promise<Document[]> {
    const { data, error } = await this.getClient()
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw new Error('fetchDocuments: ' + error.message);
    return (data ?? []) as Document[];
  }

  static async createDocument(doc: Omit<Document, 'id' | 'updated_at'>): Promise<Document | null> {
    const { data, error } = await this.getClient()
      .from('documents')
      .insert(doc)
      .select()
      .single();

    if (error) throw new Error('createDocument: ' + error.message);
    return data as Document;
  }

  static async updateDocument(
    docId: string,
    patch: Partial<Pick<Document, 'title' | 'content' | 'category' | 'tags' | 'is_restricted'>>
  ): Promise<boolean> {
    const { error } = await this.getClient()
      .from('documents')
      .update(patch)
      .eq('id', docId);

    if (error) throw new Error('updateDocument: ' + error.message);
    return true;
  }

  static async deleteDocument(docId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('documents')
      .delete()
      .eq('id', docId);

    if (error) throw new Error('deleteDocument: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // CLIENTS
  // --------------------------------------------------------------------------
  static async fetchClients(workspaceId: string): Promise<Client[]> {
    const { data, error } = await this.getClient()
      .from('clients')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchClients: ' + error.message);
    return (data ?? []) as Client[];
  }

  static async createClient(
    client: Omit<Client, 'id' | 'created_at' | 'total_billed'>
  ): Promise<Client | null> {
    const { data, error } = await this.getClient()
      .from('clients')
      .insert({ ...client, total_billed: 0 })
      .select()
      .single();

    if (error) throw new Error('createClient: ' + error.message);
    return data as Client;
  }

  static async updateClient(
    clientId: string,
    patch: Partial<Omit<Client, 'id' | 'created_at' | 'workspace_id'>>
  ): Promise<boolean> {
    const { error } = await this.getClient()
      .from('clients')
      .update(patch)
      .eq('id', clientId);

    if (error) throw new Error('updateClient: ' + error.message);
    return true;
  }

  static async deleteClient(clientId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw new Error('deleteClient: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // EXPENSES (amount stored in database as amount_cents integer)
  // --------------------------------------------------------------------------
  static async fetchExpenses(workspaceId: string): Promise<Expense[]> {
    const { data, error } = await this.getClient()
      .from('expenses')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchExpenses: ' + error.message);

    // Map DB amount_cents to UI decimal amount
    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      amount: typeof row.amount_cents === 'number' || typeof row.amount_cents === 'string'
        ? Number(row.amount_cents) / 100
        : (row.amount as number) || 0,
    })) as Expense[];
  }

  static async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> {
    const { amount, ...rest } = expense;
    const amount_cents = Math.round((amount || 0) * 100);

    const { data, error } = await this.getClient()
      .from('expenses')
      .insert({
        ...rest,
        amount_cents,
      })
      .select()
      .single();

    if (error) throw new Error('createExpense: ' + error.message);

    return {
      ...(data as Record<string, unknown>),
      amount,
    } as Expense;
  }

  static async updateExpense(
    expenseId: string,
    patch: Partial<Omit<Expense, 'id' | 'created_at' | 'workspace_id'>>
  ): Promise<boolean> {
    const { amount, ...rest } = patch;
    const dbPatch: Record<string, unknown> = { ...rest };
    if (amount !== undefined) {
      dbPatch.amount_cents = Math.round(amount * 100);
    }

    const { error } = await this.getClient()
      .from('expenses')
      .update(dbPatch)
      .eq('id', expenseId);

    if (error) throw new Error('updateExpense: ' + error.message);
    return true;
  }

  static async deleteExpense(expenseId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw new Error('deleteExpense: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // WORKSPACE MEMBERS
  // --------------------------------------------------------------------------
  static async fetchMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await this.getClient()
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error('fetchMembers: ' + error.message);
    return (data ?? []) as WorkspaceMember[];
  }

  // --------------------------------------------------------------------------
  // SKILLS
  // --------------------------------------------------------------------------
  static async fetchSkills(workspaceId: string): Promise<Skill[]> {
    const { data, error } = await this.getClient()
      .from('skills')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('score', { ascending: false });

    if (error) throw new Error('fetchSkills: ' + error.message);
    return (data ?? []) as Skill[];
  }

  static async createSkill(skill: Omit<Skill, 'id'>): Promise<Skill | null> {
    const { data, error } = await this.getClient()
      .from('skills')
      .insert(skill)
      .select()
      .single();

    if (error) throw new Error('createSkill: ' + error.message);
    return data as Skill;
  }

  static async updateSkillScore(skillId: string, score: number): Promise<boolean> {
    const { error } = await this.getClient()
      .from('skills')
      .update({ score })
      .eq('id', skillId);

    if (error) throw new Error('updateSkillScore: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // AI RECOMMENDATIONS
  // --------------------------------------------------------------------------
  static async fetchAIRecommendations(workspaceId: string): Promise<AIRecommendation[]> {
    const { data, error } = await this.getClient()
      .from('ai_recommendations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error('fetchAIRecommendations: ' + error.message);
    return (data ?? []) as AIRecommendation[];
  }

  static async updateAIRecommendationStatus(
    recId: string,
    status: 'approved' | 'dismissed',
    approvedBy?: string
  ): Promise<boolean> {
    const patch: Record<string, unknown> = {
      status,
      ...(status === 'approved'
        ? { approved_at: new Date().toISOString(), approved_by: approvedBy }
        : { dismissed_at: new Date().toISOString() }),
    };

    const { error } = await this.getClient()
      .from('ai_recommendations')
      .update(patch)
      .eq('id', recId);

    if (error) throw new Error('updateAIRecommendationStatus: ' + error.message);
    return true;
  }

  // --------------------------------------------------------------------------
  // ACTIVITY LOGS
  // --------------------------------------------------------------------------
  static async fetchActivityLogs(workspaceId: string, limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await this.getClient()
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('fetchActivityLogs: ' + error.message);
    return (data ?? []) as ActivityLog[];
  }

  static async createActivityLog(
    log: Omit<ActivityLog, 'id' | 'created_at'>
  ): Promise<ActivityLog | null> {
    const { data, error } = await this.getClient()
      .from('activity_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw new Error('createActivityLog: ' + error.message);
    return data as ActivityLog;
  }
}