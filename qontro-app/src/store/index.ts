import { create } from 'zustand';
import {
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  Skill,
  Invoice,
  Document,
  AIRecommendation,
  TaskStatus,
  Client,
  Expense,
  ActivityLog,
  TaskHistory,
  TaskComment,
  Invitation,
  AppNotification,
  InvoiceStatus,
} from '@/types';
import {
  DEFAULT_CLEAN_WORKSPACE,
  DEFAULT_CLEAN_MEMBERS,
  DEFAULT_CLEAN_PROJECTS,
  DEFAULT_CLEAN_TASKS,
  DEFAULT_CLEAN_SKILLS,
  DEFAULT_CLEAN_INVOICES,
  DEFAULT_CLEAN_DOCUMENTS,
  DEFAULT_CLEAN_AI_RECOMMENDATIONS,
  DEFAULT_CLEAN_CLIENTS,
  DEFAULT_CLEAN_EXPENSES,
  DEFAULT_CLEAN_ACTIVITY_LOGS,
  DEFAULT_CLEAN_TASK_HISTORIES,
} from '@/lib/default-clean-data';
import {
  QontroSupabaseService,
  calculateMemberWorkload,
  calculateProjectHealth,
} from '@/services/supabaseService';

function newId(): string {
  return crypto.randomUUID();
}

interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

export interface AppState {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  taskHistories: TaskHistory[];
  skills: Skill[];
  invoices: Invoice[];
  expenses: Expense[];
  documents: Document[];
  activityLogs: ActivityLog[];
  aiRecommendations: AIRecommendation[];
  invitations: Invitation[];
  notifications: AppNotification[];
  loadingState: LoadingState;

  // Data loading (DB -> Store)
  loadWorkspaceData: (workspaceId: string) => Promise<void>;

  // Workspace Actions
  setWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, currency?: string) => Promise<Workspace | null>;

  // Tasks Actions
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  assignTask: (taskId: string, memberId: string) => Promise<void>;
  addTaskComment: (taskId: string, content: string, authorName?: string) => Promise<void>;

  // Projects Actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'health_score'>) => Promise<void>;
  updateProject: (projectId: string, patch: Partial<Omit<Project, 'id' | 'created_at' | 'workspace_id'>>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Clients Actions
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'total_billed'>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;

  // Invoices & Expenses
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  // Company Memory Documents
  addDocument: (doc: Omit<Document, 'id' | 'updated_at'>) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  updateDocument: (id: string, title: string, content: string) => Promise<void>;
  duplicateDocument: (docId: string) => Promise<void>;

  // Members, Invitations & Skills
  addMember: (member: Omit<WorkspaceMember, 'id' | 'joined_at'>) => Promise<void>;
  updateMember: (memberId: string, patch: Partial<Omit<WorkspaceMember, 'id' | 'workspace_id' | 'joined_at'>>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  addInvitation: (invitation: Omit<Invitation, 'id' | 'created_at' | 'status'>) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  addSkill: (skill: Omit<Skill, 'id'>) => Promise<void>;

  // AI Actions
  approveAIRecommendation: (recommendationId: string) => Promise<void>;
  dismissAIRecommendation: (recommendationId: string) => Promise<void>;
  generateAIRecommendation: (rec: Omit<AIRecommendation, 'id' | 'created_at' | 'status'>) => Promise<void>;

  // Activity Logging & Cleanup
  logActivity: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  clearWorkspaceData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentWorkspace: DEFAULT_CLEAN_WORKSPACE,
  workspaces: [DEFAULT_CLEAN_WORKSPACE],
  members: DEFAULT_CLEAN_MEMBERS,
  clients: DEFAULT_CLEAN_CLIENTS,
  projects: DEFAULT_CLEAN_PROJECTS,
  tasks: DEFAULT_CLEAN_TASKS,
  taskHistories: DEFAULT_CLEAN_TASK_HISTORIES,
  skills: DEFAULT_CLEAN_SKILLS,
  invoices: DEFAULT_CLEAN_INVOICES,
  expenses: DEFAULT_CLEAN_EXPENSES,
  documents: DEFAULT_CLEAN_DOCUMENTS,
  activityLogs: DEFAULT_CLEAN_ACTIVITY_LOGS,
  aiRecommendations: DEFAULT_CLEAN_AI_RECOMMENDATIONS,
  invitations: [],
  notifications: [],
  loadingState: { isLoading: false, isLoaded: true, error: null },

  /**
   * Load all workspace data from Supabase in parallel across all core domains.
   * DATABASE is the authoritative source of truth.
   */
  loadWorkspaceData: async (workspaceId: string) => {
    set({ loadingState: { isLoading: true, isLoaded: false, error: null } });

    try {
      const [
        projects,
        tasks,
        invoices,
        documents,
        members,
        skills,
        clients,
        expenses,
        taskHistories,
        activityLogs,
        aiRecommendations,
        invitations,
      ] = await Promise.all([
        QontroSupabaseService.fetchProjects(workspaceId).catch(() => []),
        QontroSupabaseService.fetchTasks(workspaceId).catch(() => []),
        QontroSupabaseService.fetchInvoices(workspaceId).catch(() => []),
        QontroSupabaseService.fetchDocuments(workspaceId).catch(() => []),
        QontroSupabaseService.fetchMembers(workspaceId).catch(() => []),
        QontroSupabaseService.fetchSkills(workspaceId).catch(() => []),
        QontroSupabaseService.fetchClients(workspaceId).catch(() => []),
        QontroSupabaseService.fetchExpenses(workspaceId).catch(() => []),
        QontroSupabaseService.fetchTaskHistory(workspaceId).catch(() => []),
        QontroSupabaseService.fetchActivityLogs(workspaceId).catch(() => []),
        QontroSupabaseService.fetchAIRecommendations(workspaceId).catch(() => []),
        QontroSupabaseService.fetchInvitations(workspaceId).catch(() => []),
      ]);

      // Calculate real dynamic workload for every member
      const membersWithWorkload = members.map((m) => ({
        ...m,
        workload_percentage: calculateMemberWorkload(m.id, tasks),
      }));

      // Calculate real dynamic health score for every project
      const projectsWithHealth = projects.map((p) => ({
        ...p,
        health_score: calculateProjectHealth(p.id, tasks),
      }));

      set({
        projects: projectsWithHealth,
        tasks,
        invoices,
        documents,
        members: membersWithWorkload,
        skills,
        clients,
        expenses,
        taskHistories,
        activityLogs,
        aiRecommendations,
        invitations,
        loadingState: { isLoading: false, isLoaded: true, error: null },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workspace data.';
      set({ loadingState: { isLoading: false, isLoaded: false, error: message } });
    }
  },

  setWorkspace: (workspace) => {
    // Purge stale tenant-bound state when switching workspace
    if (get().currentWorkspace?.id !== workspace.id) {
      get().clearWorkspaceData();
    }
    set({ currentWorkspace: workspace });
  },

  createWorkspace: async (name: string, currency: string = 'USD') => {
    const newWs = await QontroSupabaseService.createWorkspace(name, currency);
    if (newWs) {
      set((state) => ({
        workspaces: [...state.workspaces.filter((w) => w.id !== newWs.id), newWs],
        currentWorkspace: newWs,
      }));
      await get().loadWorkspaceData(newWs.id);
      return newWs;
    }
    return null;
  },

  logActivity: (newLog) => {
    const log: ActivityLog = {
      ...newLog,
      id: newId(),
      created_at: new Date().toISOString(),
    };
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    QontroSupabaseService.createActivityLog(newLog).catch((err) =>
      console.warn('[Store] logActivity DB sync warning:', err.message)
    );
  },

  addTask: async (newTask) => {
    const id = newId();
    const task: Task = {
      ...newTask,
      id,
      created_at: new Date().toISOString(),
      comments: [],
    };

    const prevTasks = get().tasks;
    const prevProjects = get().projects;
    const prevMembers = get().members;

    const updatedTasks = [task, ...prevTasks];
    const updatedMembers = prevMembers.map((m) => ({
      ...m,
      workload_percentage: calculateMemberWorkload(m.id, updatedTasks),
    }));
    const updatedProjects = prevProjects.map((p) =>
      p.id === task.project_id
        ? { ...p, health_score: calculateProjectHealth(p.id, updatedTasks) }
        : p
    );

    const historyEntry: TaskHistory = {
      id: newId(),
      task_id: task.id,
      workspace_id: task.workspace_id,
      action: 'Task created',
      actor_name: 'Founder / Admin',
      new_value: task.title,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: updatedTasks,
      members: updatedMembers,
      projects: updatedProjects,
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    get().logActivity({
      workspace_id: task.workspace_id,
      type: 'task',
      action: 'Created task: ' + task.title,
      actor_name: 'Founder / Admin',
    });

    try {
      const saved = await QontroSupabaseService.createTask({ ...newTask, id });
      if (saved) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...saved } : t)),
        }));
      }
      await QontroSupabaseService.createTaskHistory({
        workspace_id: task.workspace_id,
        task_id: task.id,
        action: 'Task created',
        actor_name: 'Founder / Admin',
        new_value: task.title,
      }).catch(() => null);
    } catch (err: unknown) {
      set({
        tasks: prevTasks,
        members: prevMembers,
        projects: prevProjects,
      });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addTask rollback:', msg);
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevProjects = get().projects;
    const prevMembers = get().members;
    const target = prevTasks.find((t) => t.id === taskId);

    const updatedTasks = prevTasks.filter((t) => t.id !== taskId);
    const updatedMembers = prevMembers.map((m) => ({
      ...m,
      workload_percentage: calculateMemberWorkload(m.id, updatedTasks),
    }));
    const updatedProjects = prevProjects.map((p) =>
      target && p.id === target.project_id
        ? { ...p, health_score: calculateProjectHealth(p.id, updatedTasks) }
        : p
    );

    set({
      tasks: updatedTasks,
      members: updatedMembers,
      projects: updatedProjects,
    });

    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'task',
        action: 'Deleted task: ' + target.title,
        actor_name: 'Founder / Admin',
      });
    }

    try {
      await QontroSupabaseService.deleteTask(taskId);
    } catch (err: unknown) {
      set({
        tasks: prevTasks,
        members: prevMembers,
        projects: prevProjects,
      });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteTask rollback:', msg);
      throw err;
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const targetTask = get().tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const prevTasks = get().tasks;
    const prevProjects = get().projects;
    const prevMembers = get().members;
    const prevStatus = targetTask.status;

    const updatedTasks = prevTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          }
        : t
    );

    const updatedMembers = prevMembers.map((m) => ({
      ...m,
      workload_percentage: calculateMemberWorkload(m.id, updatedTasks),
    }));
    const updatedProjects = prevProjects.map((p) =>
      p.id === targetTask.project_id
        ? { ...p, health_score: calculateProjectHealth(p.id, updatedTasks) }
        : p
    );

    const historyEntry: TaskHistory = {
      id: newId(),
      task_id: taskId,
      workspace_id: targetTask.workspace_id,
      action: 'Status changed',
      actor_name: 'Founder / Member',
      previous_value: prevStatus,
      new_value: status,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: updatedTasks,
      members: updatedMembers,
      projects: updatedProjects,
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    get().logActivity({
      workspace_id: targetTask.workspace_id,
      type: 'task',
      action: `Moved task "${targetTask.title}" to ${status.toUpperCase()}`,
      actor_name: 'Team Member',
    });

    try {
      await QontroSupabaseService.updateTaskStatus(taskId, status);

      // Rule 21: Auto-update skill verification on task completion
      if (status === 'completed' && targetTask.assigned_to) {
        const skillsList = targetTask.required_skills || [];
        if (skillsList.length > 0) {
          await QontroSupabaseService.updateSkillVerificationOnTaskComplete(
            targetTask.workspace_id,
            targetTask.assigned_to,
            skillsList
          ).catch(() => null);

          const refreshedSkills = await QontroSupabaseService.fetchSkills(targetTask.workspace_id).catch(() => []);
          if (refreshedSkills.length > 0) {
            set({ skills: refreshedSkills });
          }
        }
      }

      await QontroSupabaseService.createTaskHistory({
        workspace_id: targetTask.workspace_id,
        task_id: taskId,
        action: 'Status changed',
        actor_name: 'Founder / Member',
        previous_value: prevStatus,
        new_value: status,
      }).catch(() => null);
    } catch (err: unknown) {
      set({
        tasks: prevTasks,
        members: prevMembers,
        projects: prevProjects,
      });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] updateTaskStatus rollback:', msg);
      throw err;
    }
  },

  assignTask: async (taskId, memberId) => {
    const targetTask = get().tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const prevTasks = get().tasks;
    const prevMembers = get().members;
    const member = prevMembers.find((m) => m.id === memberId);

    const updatedTasks = prevTasks.map((t) =>
      t.id === taskId ? { ...t, assigned_to: memberId } : t
    );
    const updatedMembers = prevMembers.map((m) => ({
      ...m,
      workload_percentage: calculateMemberWorkload(m.id, updatedTasks),
    }));

    const historyEntry: TaskHistory = {
      id: newId(),
      task_id: taskId,
      workspace_id: targetTask.workspace_id,
      action: 'Reassigned',
      actor_name: 'Founder',
      previous_value: targetTask.assigned_to || 'Unassigned',
      new_value: member ? member.name : (memberId || 'Unassigned'),
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: updatedTasks,
      members: updatedMembers,
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    get().logActivity({
      workspace_id: targetTask.workspace_id,
      type: 'task',
      action: `Assigned task "${targetTask.title}" to ${member ? member.name : memberId || 'Unassigned'}`,
      actor_name: 'Founder',
    });

    try {
      await QontroSupabaseService.updateTask(taskId, { assigned_to: memberId });
      await QontroSupabaseService.createTaskHistory({
        workspace_id: targetTask.workspace_id,
        task_id: taskId,
        action: 'Reassigned',
        actor_name: 'Founder',
        previous_value: targetTask.assigned_to || 'Unassigned',
        new_value: member ? member.name : (memberId || 'Unassigned'),
      }).catch(() => null);
    } catch (err: unknown) {
      set({ tasks: prevTasks, members: prevMembers });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] assignTask rollback:', msg);
      throw err;
    }
  },

  addTaskComment: async (taskId, content, authorName = 'Founder') => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const id = newId();
    const comment: TaskComment = {
      id,
      workspace_id: task.workspace_id,
      task_id: taskId,
      user_id: get().currentWorkspace?.owner_id || newId(),
      author_name: authorName,
      content,
      created_at: new Date().toISOString(),
    };

    const prevTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
    }));

    try {
      const saved = await QontroSupabaseService.createTaskComment(comment);
      if (saved) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: t.comments?.map((c) => (c.id === id ? { ...c, ...saved } : c)) || [],
                }
              : t
          ),
        }));
      }
    } catch (err: unknown) {
      set({ tasks: prevTasks });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addTaskComment rollback:', msg);
      throw err;
    }
  },

  addProject: async (newPrj) => {
    const id = newId();
    const project: Project = {
      ...newPrj,
      id,
      health_score: 100,
      created_at: new Date().toISOString(),
    };

    const prevProjects = get().projects;
    set((state) => ({ projects: [project, ...state.projects] }));

    get().logActivity({
      workspace_id: newPrj.workspace_id,
      type: 'project',
      action: 'Created project: ' + project.name,
      actor_name: 'Founder',
    });

    try {
      const saved = await QontroSupabaseService.createProject(newPrj);
      if (saved) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...saved } : p)),
        }));
      }
    } catch (err: unknown) {
      set({ projects: prevProjects });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addProject rollback:', msg);
      throw err;
    }
  },

  updateProject: async (projectId, patch) => {
    const prevProjects = get().projects;
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
    }));

    try {
      await QontroSupabaseService.updateProject(projectId, patch);
    } catch (err: unknown) {
      set({ projects: prevProjects });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] updateProject rollback:', msg);
      throw err;
    }
  },

  deleteProject: async (projectId) => {
    const prevProjects = get().projects;
    const prevTasks = get().tasks;
    const target = prevProjects.find((p) => p.id === projectId);

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      tasks: state.tasks.filter((t) => t.project_id !== projectId),
    }));

    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'project',
        action: 'Deleted project: ' + target.name,
        actor_name: 'Founder',
      });
    }

    try {
      await QontroSupabaseService.deleteProject(projectId);
    } catch (err: unknown) {
      set({ projects: prevProjects, tasks: prevTasks });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteProject rollback:', msg);
      throw err;
    }
  },

  addClient: async (newClient) => {
    const id = newId();
    const client: Client = {
      ...newClient,
      id,
      total_billed: 0,
      created_at: new Date().toISOString(),
    };
    const prevClients = get().clients;
    set((state) => ({ clients: [client, ...state.clients] }));

    get().logActivity({
      workspace_id: newClient.workspace_id,
      type: 'member',
      action: 'Added client: ' + client.company_name + ' (' + client.name + ')',
      actor_name: 'Founder',
    });

    try {
      const saved = await QontroSupabaseService.createClient(newClient);
      if (saved) {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...saved } : c)),
        }));
      }
    } catch (err: unknown) {
      set({ clients: prevClients });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addClient rollback:', msg);
      throw err;
    }
  },

  deleteClient: async (clientId) => {
    const prevClients = get().clients;
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
    }));

    try {
      await QontroSupabaseService.deleteClient(clientId);
    } catch (err: unknown) {
      set({ clients: prevClients });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteClient rollback:', msg);
      throw err;
    }
  },

  addInvoice: async (newInv) => {
    const id = newId();
    const invoice: Invoice = { ...newInv, id };
    const prevInvoices = get().invoices;
    set((state) => ({ invoices: [invoice, ...state.invoices] }));

    get().logActivity({
      workspace_id: newInv.workspace_id,
      type: 'invoice',
      action: 'Dispatched invoice ' + invoice.invoice_number + ' for $' + invoice.amount,
      actor_name: 'Finance Lead',
    });

    try {
      const saved = await QontroSupabaseService.createInvoice(newInv);
      if (saved) {
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...saved } : i)),
        }));
      }
    } catch (err: unknown) {
      set({ invoices: prevInvoices });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addInvoice rollback:', msg);
      throw err;
    }
  },

  deleteInvoice: async (invoiceId) => {
    const prevInvoices = get().invoices;
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== invoiceId),
    }));

    try {
      await QontroSupabaseService.deleteInvoice(invoiceId);
    } catch (err: unknown) {
      set({ invoices: prevInvoices });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteInvoice rollback:', msg);
      throw err;
    }
  },

  updateInvoiceStatus: async (invId, status) => {
    const prevInvoices = get().invoices;
    const target = prevInvoices.find((i) => i.id === invId);

    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === invId ? { ...inv, status } : inv)),
    }));

    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'invoice',
        action: 'Updated ' + target.invoice_number + ' status to ' + status.toUpperCase(),
        actor_name: 'Finance Lead',
      });
    }

    try {
      await QontroSupabaseService.updateInvoiceStatus(invId, status);
    } catch (err: unknown) {
      set({ invoices: prevInvoices });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] updateInvoiceStatus rollback:', msg);
      throw err;
    }
  },

  addExpense: async (newExp) => {
    const id = newId();
    const expense: Expense = {
      ...newExp,
      id,
      created_at: new Date().toISOString(),
    };
    const prevExpenses = get().expenses;
    set((state) => ({ expenses: [expense, ...state.expenses] }));

    get().logActivity({
      workspace_id: newExp.workspace_id,
      type: 'invoice',
      action: 'Recorded expense: ' + expense.name + ' ($' + expense.amount + ')',
      actor_name: 'Finance Lead',
    });

    try {
      const saved = await QontroSupabaseService.createExpense(newExp);
      if (saved) {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...saved } : e)),
        }));
      }
    } catch (err: unknown) {
      set({ expenses: prevExpenses });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addExpense rollback:', msg);
      throw err;
    }
  },

  deleteExpense: async (expenseId) => {
    const prevExpenses = get().expenses;
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    }));

    try {
      await QontroSupabaseService.deleteExpense(expenseId);
    } catch (err: unknown) {
      set({ expenses: prevExpenses });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteExpense rollback:', msg);
      throw err;
    }
  },

  addDocument: async (newDoc) => {
    const id = newId();
    const doc: Document = {
      ...newDoc,
      id,
      updated_at: new Date().toISOString(),
    };
    const prevDocs = get().documents;
    set((state) => ({ documents: [doc, ...state.documents] }));

    get().logActivity({
      workspace_id: newDoc.workspace_id,
      type: 'document',
      action: 'Created company SOP / template: ' + doc.title,
      actor_name: 'Founder',
    });

    try {
      const saved = await QontroSupabaseService.createDocument(newDoc);
      if (saved) {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...saved } : d)),
        }));
      }
    } catch (err: unknown) {
      set({ documents: prevDocs });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addDocument rollback:', msg);
      throw err;
    }
  },

  deleteDocument: async (docId) => {
    const prevDocs = get().documents;
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
    }));

    try {
      await QontroSupabaseService.deleteDocument(docId);
    } catch (err: unknown) {
      set({ documents: prevDocs });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteDocument rollback:', msg);
      throw err;
    }
  },

  updateDocument: async (id, title, content) => {
    const prevDocs = get().documents;
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, title, content, updated_at: new Date().toISOString() } : d
      ),
    }));

    try {
      await QontroSupabaseService.updateDocument(id, { title, content });
    } catch (err: unknown) {
      set({ documents: prevDocs });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] updateDocument rollback:', msg);
      throw err;
    }
  },

  duplicateDocument: async (docId) => {
    const original = get().documents.find((d) => d.id === docId);
    if (!original) return;

    const id = newId();
    const duplicatedDoc: Document = {
      ...original,
      id,
      title: `${original.title} (Copy)`,
      updated_at: new Date().toISOString(),
    };

    const prevDocs = get().documents;
    set((state) => ({ documents: [duplicatedDoc, ...state.documents] }));

    get().logActivity({
      workspace_id: original.workspace_id,
      type: 'document',
      action: `Duplicated template: ${original.title}`,
      actor_name: 'Founder / Admin',
    });

    try {
      const saved = await QontroSupabaseService.createDocument({
        workspace_id: original.workspace_id,
        title: `${original.title} (Copy)`,
        content: original.content,
        type: original.type,
        category: original.category,
        tags: original.tags,
        created_by_name: original.created_by_name,
        is_restricted: original.is_restricted,
      });
      if (saved) {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...saved } : d)),
        }));
      }
    } catch (err: unknown) {
      set({ documents: prevDocs });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] duplicateDocument rollback:', msg);
      throw err;
    }
  },

  addMember: async (newMem) => {
    const id = newId();
    const member: WorkspaceMember = {
      ...newMem,
      id,
      joined_at: new Date().toISOString(),
    };
    const prevMembers = get().members;
    set((state) => ({ members: [...state.members, member] }));

    get().logActivity({
      workspace_id: newMem.workspace_id,
      type: 'member',
      action: 'Added team member: ' + member.name + ' (' + member.email + ')',
      actor_name: 'Founder',
    });

    try {
      const saved = await QontroSupabaseService.addMember(newMem);
      if (saved) {
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, ...saved } : m)),
        }));
      }
    } catch (err: unknown) {
      set({ members: prevMembers });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addMember rollback:', msg);
      throw err;
    }
  },

  updateMember: async (memberId, patch) => {
    const prevMembers = get().members;
    set((state) => ({
      members: state.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
    }));

    try {
      await QontroSupabaseService.updateMember(memberId, patch);
    } catch (err: unknown) {
      set({ members: prevMembers });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] updateMember rollback:', msg);
      throw err;
    }
  },

  deleteMember: async (memberId) => {
    const prevMembers = get().members;
    const target = prevMembers.find((m) => m.id === memberId);

    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    }));

    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'member',
        action: 'Removed team member: ' + target.name,
        actor_name: 'Founder',
      });
    }

    try {
      await QontroSupabaseService.removeMember(memberId);
    } catch (err: unknown) {
      set({ members: prevMembers });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] deleteMember rollback:', msg);
      throw err;
    }
  },

  addInvitation: async (invitation) => {
    const id = newId();
    const newInv: Invitation = {
      ...invitation,
      id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const prevInvitations = get().invitations;
    set((state) => ({ invitations: [newInv, ...state.invitations] }));

    get().logActivity({
      workspace_id: invitation.workspace_id,
      type: 'member',
      action: `Issued invitation to ${invitation.email} as ${invitation.role}`,
      actor_name: 'Founder / Admin',
    });

    try {
      const saved = await QontroSupabaseService.createInvitation(invitation);
      if (saved) {
        set((state) => ({
          invitations: state.invitations.map((inv) => (inv.id === id ? { ...inv, ...saved } : inv)),
        }));
      }
    } catch (err: unknown) {
      set({ invitations: prevInvitations });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addInvitation rollback:', msg);
      throw err;
    }
  },

  cancelInvitation: async (invitationId) => {
    const prevInvitations = get().invitations;
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv
      ),
    }));

    try {
      await QontroSupabaseService.cancelInvitation(invitationId);
    } catch (err: unknown) {
      set({ invitations: prevInvitations });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] cancelInvitation rollback:', msg);
      throw err;
    }
  },

  addSkill: async (newSkill) => {
    const id = newId();
    const skill: Skill = { ...newSkill, id };
    const prevSkills = get().skills;
    set((state) => ({ skills: [...state.skills, skill] }));

    try {
      const saved = await QontroSupabaseService.createSkill(newSkill);
      if (saved) {
        set((state) => ({
          skills: state.skills.map((s) => (s.id === id ? { ...s, ...saved } : s)),
        }));
      }
    } catch (err: unknown) {
      set({ skills: prevSkills });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] addSkill rollback:', msg);
      throw err;
    }
  },

  approveAIRecommendation: async (recId) => {
    const { aiRecommendations, tasks } = get();
    const rec = aiRecommendations.find((r) => r.id === recId);
    if (!rec) return;

    const prevRecommendations = aiRecommendations;
    const prevTasks = tasks;

    // Optimistic approval
    set({
      aiRecommendations: aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'approved' } : r
      ),
    });

    if (rec.type === 'assignment' && rec.target_task_id && rec.recommended_member_id) {
      const updatedTasks = tasks.map((t) =>
        t.id === rec.target_task_id
          ? { ...t, assigned_to: rec.recommended_member_id, status: 'todo' as TaskStatus }
          : t
      );
      set({
        tasks: updatedTasks,
        members: get().members.map((m) => ({
          ...m,
          workload_percentage: calculateMemberWorkload(m.id, updatedTasks),
        })),
      });

      get().logActivity({
        workspace_id: rec.workspace_id,
        type: 'ai',
        action: 'Approved AI assignment recommendation for task ' + rec.target_task_id,
        actor_name: 'Founder',
      });
    }

    try {
      await QontroSupabaseService.updateAIRecommendationStatus(recId, 'approved');
      if (rec.type === 'assignment' && rec.target_task_id && rec.recommended_member_id) {
        await QontroSupabaseService.updateTask(rec.target_task_id, {
          assigned_to: rec.recommended_member_id,
          status: 'todo',
        });
        await QontroSupabaseService.createTaskHistory({
          workspace_id: rec.workspace_id,
          task_id: rec.target_task_id,
          action: 'AI Recommendation Approved (Reassigned)',
          actor_name: 'Founder / AI Ops',
          new_value: rec.recommended_member_id,
        }).catch(() => null);
      }
    } catch (err: unknown) {
      set({
        aiRecommendations: prevRecommendations,
        tasks: prevTasks,
      });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] approveAIRecommendation rollback:', msg);
      throw err;
    }
  },

  dismissAIRecommendation: async (recId) => {
    const prevRecommendations = get().aiRecommendations;
    set((state) => ({
      aiRecommendations: state.aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'dismissed' } : r
      ),
    }));

    try {
      await QontroSupabaseService.updateAIRecommendationStatus(recId, 'dismissed');
    } catch (err: unknown) {
      set({ aiRecommendations: prevRecommendations });
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('[Store] dismissAIRecommendation rollback:', msg);
      throw err;
    }
  },

  generateAIRecommendation: async (rec) => {
    const newRec: AIRecommendation = {
      ...rec,
      id: newId(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      aiRecommendations: [newRec, ...state.aiRecommendations],
    }));
  },

  clearWorkspaceData: () => {
    set({
      projects: [],
      tasks: [],
      taskHistories: [],
      skills: [],
      invoices: [],
      expenses: [],
      documents: [],
      clients: [],
      activityLogs: [],
      aiRecommendations: [],
      invitations: [],
      notifications: [],
    });
  },
}));