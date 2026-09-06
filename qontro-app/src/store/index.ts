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
  TaskComment
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
  DEFAULT_CLEAN_TASK_HISTORIES
} from '@/lib/default-clean-data';
import {
  ENABLE_MOCK_PROFILE,
  LEADLINKED_WORKSPACE,
  LEADLINKED_MEMBERS,
  LEADLINKED_PROJECTS,
  LEADLINKED_TASKS,
  LEADLINKED_SKILLS,
  LEADLINKED_INVOICES,
  LEADLINKED_EXPENSES,
  LEADLINKED_DOCUMENTS,
  LEADLINKED_AI_RECOMMENDATIONS,
  LEADLINKED_CLIENTS,
  LEADLINKED_ACTIVITY_LOGS,
  LEADLINKED_TASK_HISTORIES,
} from '@/lib/mock-profile';
import { QontroSupabaseService } from '@/services/supabaseService';

/**
 * Generate a UUID using Web Crypto API.
 */
function newId(): string {
  return crypto.randomUUID();
}

interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface AppState {
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
  loadingState: LoadingState;

  // Data loading (DB -> Store)
  loadWorkspaceData: (workspaceId: string) => Promise<void>;

  // Workspace Actions
  setWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, currency?: string) => Promise<void>;

  // Tasks Actions
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  assignTask: (taskId: string, memberId: string) => void;
  addTaskComment: (taskId: string, content: string, authorName?: string) => void;

  // Projects Actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'health_score'>) => void;
  deleteProject: (projectId: string) => void;

  // Clients Actions
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'total_billed'>) => void;
  deleteClient: (clientId: string) => void;

  // Invoices & Expenses
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Company Memory Documents
  addDocument: (doc: Omit<Document, 'id' | 'updated_at'>) => void;
  deleteDocument: (docId: string) => void;
  updateDocument: (id: string, title: string, content: string) => void;

  // Members & Skills
  addMember: (member: Omit<WorkspaceMember, 'id' | 'joined_at'>) => void;
  deleteMember: (memberId: string) => void;
  addSkill: (skill: Omit<Skill, 'id'>) => void;

  // AI Actions
  approveAIRecommendation: (recommendationId: string) => void;
  dismissAIRecommendation: (recommendationId: string) => void;
  generateAIRecommendation: (rec: Omit<AIRecommendation, 'id' | 'created_at' | 'status'>) => void;

  // Activity Logging & Cleanup
  logActivity: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  clearWorkspaceData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentWorkspace: ENABLE_MOCK_PROFILE ? LEADLINKED_WORKSPACE : DEFAULT_CLEAN_WORKSPACE,
  workspaces: [ENABLE_MOCK_PROFILE ? LEADLINKED_WORKSPACE : DEFAULT_CLEAN_WORKSPACE],
  members: ENABLE_MOCK_PROFILE ? LEADLINKED_MEMBERS : DEFAULT_CLEAN_MEMBERS,
  clients: ENABLE_MOCK_PROFILE ? LEADLINKED_CLIENTS : DEFAULT_CLEAN_CLIENTS,
  projects: ENABLE_MOCK_PROFILE ? LEADLINKED_PROJECTS : DEFAULT_CLEAN_PROJECTS,
  tasks: ENABLE_MOCK_PROFILE ? LEADLINKED_TASKS : DEFAULT_CLEAN_TASKS,
  taskHistories: ENABLE_MOCK_PROFILE ? LEADLINKED_TASK_HISTORIES : DEFAULT_CLEAN_TASK_HISTORIES,
  skills: ENABLE_MOCK_PROFILE ? LEADLINKED_SKILLS : DEFAULT_CLEAN_SKILLS,
  invoices: ENABLE_MOCK_PROFILE ? LEADLINKED_INVOICES : DEFAULT_CLEAN_INVOICES,
  expenses: ENABLE_MOCK_PROFILE ? LEADLINKED_EXPENSES : DEFAULT_CLEAN_EXPENSES,
  documents: ENABLE_MOCK_PROFILE ? LEADLINKED_DOCUMENTS : DEFAULT_CLEAN_DOCUMENTS,
  activityLogs: ENABLE_MOCK_PROFILE ? LEADLINKED_ACTIVITY_LOGS : DEFAULT_CLEAN_ACTIVITY_LOGS,
  aiRecommendations: ENABLE_MOCK_PROFILE ? LEADLINKED_AI_RECOMMENDATIONS : DEFAULT_CLEAN_AI_RECOMMENDATIONS,
  loadingState: { isLoading: false, isLoaded: true, error: null },

  /**
   * Load all workspace data from Supabase in parallel across all 13 domains.
   * DATABASE is the source of truth -- Zustand is the local optimistic cache.
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
      ]);

      set({
        projects,
        tasks,
        invoices,
        documents,
        members,
        skills,
        clients,
        expenses,
        taskHistories: taskHistories.length > 0 ? taskHistories : get().taskHistories,
        activityLogs: activityLogs.length > 0 ? activityLogs : get().activityLogs,
        aiRecommendations: aiRecommendations.length > 0 ? aiRecommendations : get().aiRecommendations,
        loadingState: { isLoading: false, isLoaded: true, error: null },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workspace data.';
      set({ loadingState: { isLoading: false, isLoaded: false, error: message } });
    }
  },

  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  createWorkspace: async (name, currency = 'USD') => {
    try {
      const newWs = await QontroSupabaseService.createWorkspace(name, currency);
      if (newWs) {
        set((state) => ({
          workspaces: [...state.workspaces.filter((w) => w.id !== newWs.id), newWs],
          currentWorkspace: newWs,
        }));
        await get().loadWorkspaceData(newWs.id);
        return;
      }
    } catch (err) {
      console.warn('[Store] createWorkspace DB error, using optimistic local state:', err);
    }

    // Local fallback
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const fallbackWs: Workspace = {
      id: newId(),
      name,
      slug: slug || ('ws-' + newId().substring(0, 8)),
      owner_id: 'usr_founder',
      currency,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      workspaces: [...state.workspaces, fallbackWs],
      currentWorkspace: fallbackWs,
    }));
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

  /**
   * addTask: Passes client UUID to Supabase so child taskHistories and task_comments
   * maintain 100% foreign key relational integrity.
   */
  addTask: (newTask) => {
    const id = newId();
    const task: Task = {
      ...newTask,
      id,
      created_at: new Date().toISOString(),
      comments: [],
    };

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
      tasks: [task, ...state.tasks],
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    get().logActivity({
      workspace_id: task.workspace_id,
      type: 'task',
      action: 'Created task: ' + task.title,
      actor_name: 'Founder / Admin',
    });

    // 1. Persist task preserving client id
    QontroSupabaseService.createTask({ ...newTask, id })
      .then((saved) => {
        if (saved) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...saved } : t)),
          }));
        }
      })
      .catch((err) => console.error('[Store] addTask DB error:', err));

    // 2. Persist task history
    QontroSupabaseService.createTaskHistory({
      workspace_id: task.workspace_id,
      task_id: task.id,
      action: 'Task created',
      actor_name: 'Founder / Admin',
      new_value: task.title,
    }).catch((err) => console.warn('[Store] createTaskHistory DB warning:', err.message));
  },

  deleteTask: (taskId) => {
    const target = get().tasks.find((t) => t.id === taskId);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'task',
        action: 'Deleted task: ' + target.title,
        actor_name: 'Founder / Admin',
      });
    }

    QontroSupabaseService.deleteTask(taskId).catch((err) =>
      console.error('[Store] deleteTask DB error:', err)
    );
  },

  updateTaskStatus: (taskId, status) => {
    const targetTask = get().tasks.find((t) => t.id === taskId);
    const prevStatus = targetTask?.status;

    const historyEntry: TaskHistory = {
      id: newId(),
      task_id: taskId,
      workspace_id: targetTask?.workspace_id,
      action: 'Status changed',
      actor_name: 'Founder / Member',
      previous_value: prevStatus,
      new_value: status,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    if (targetTask) {
      get().logActivity({
        workspace_id: targetTask.workspace_id,
        type: 'task',
        action: 'Moved task "' + targetTask.title + '" to ' + status.toUpperCase(),
        actor_name: 'Team Member',
      });
    }

    QontroSupabaseService.updateTaskStatus(taskId, status).catch((err) =>
      console.error('[Store] updateTaskStatus DB error:', err)
    );

    if (targetTask) {
      QontroSupabaseService.createTaskHistory({
        workspace_id: targetTask.workspace_id,
        task_id: taskId,
        action: 'Status changed',
        actor_name: 'Founder / Member',
        previous_value: prevStatus,
        new_value: status,
      }).catch((err) => console.warn('[Store] updateTaskStatus history DB warning:', err.message));
    }
  },

  assignTask: (taskId, memberId) => {
    const member = get().members.find((m) => m.id === memberId);
    const targetTask = get().tasks.find((t) => t.id === taskId);

    const historyEntry: TaskHistory = {
      id: newId(),
      task_id: taskId,
      workspace_id: targetTask?.workspace_id,
      action: 'Reassigned',
      actor_name: 'Founder',
      previous_value: targetTask?.assigned_to || 'Unassigned',
      new_value: member ? member.name : (memberId || 'Unassigned'),
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, assigned_to: memberId } : t)),
      taskHistories: [historyEntry, ...state.taskHistories],
    }));

    if (targetTask) {
      get().logActivity({
        workspace_id: targetTask.workspace_id,
        type: 'task',
        action: 'Assigned task "' + targetTask.title + '" to ' + (member ? member.name : (memberId || 'Unassigned')),
        actor_name: 'Founder',
      });
    }

    QontroSupabaseService.updateTask(taskId, { assigned_to: memberId }).catch((err) =>
      console.error('[Store] assignTask DB error:', err)
    );

    if (targetTask) {
      QontroSupabaseService.createTaskHistory({
        workspace_id: targetTask.workspace_id,
        task_id: taskId,
        action: 'Reassigned',
        actor_name: 'Founder',
        previous_value: targetTask.assigned_to || 'Unassigned',
        new_value: member ? member.name : (memberId || 'Unassigned'),
      }).catch((err) => console.warn('[Store] assignTask history DB warning:', err.message));
    }
  },

  addTaskComment: (taskId, content, authorName = 'Founder') => {
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

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
    }));

    QontroSupabaseService.createTaskComment(comment).then((saved) => {
      if (saved) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? {
              ...t,
              comments: t.comments?.map((c) => (c.id === id ? { ...c, ...saved } : c)) || [],
            } : t
          ),
        }));
      }
    }).catch((err) => console.error('[Store] addTaskComment DB error:', err));
  },

  addProject: (newPrj) => {
    const id = newId();
    const project: Project = {
      ...newPrj,
      id,
      health_score: 100,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ projects: [project, ...state.projects] }));

    get().logActivity({
      workspace_id: newPrj.workspace_id,
      type: 'project',
      action: 'Created project: ' + project.name,
      actor_name: 'Founder',
    });

    QontroSupabaseService.createProject(newPrj).then((saved) => {
      if (saved) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...saved } : p)),
        }));
      }
    }).catch((err) => console.error('[Store] addProject DB error:', err));
  },

  deleteProject: (projectId) => {
    const target = get().projects.find((p) => p.id === projectId);
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

    QontroSupabaseService.deleteProject(projectId).catch((err) =>
      console.error('[Store] deleteProject DB error:', err)
    );
  },

  addClient: (newClient) => {
    const id = newId();
    const client: Client = {
      ...newClient,
      id,
      total_billed: 0,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ clients: [client, ...state.clients] }));
    get().logActivity({
      workspace_id: newClient.workspace_id,
      type: 'member',
      action: 'Added client: ' + client.company_name + ' (' + client.name + ')',
      actor_name: 'Founder',
    });

    QontroSupabaseService.createClient(newClient).then((saved) => {
      if (saved) {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...saved } : c)),
        }));
      }
    }).catch((err) => console.error('[Store] addClient DB error:', err));
  },

  deleteClient: (clientId) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
    }));

    QontroSupabaseService.deleteClient(clientId).catch((err) =>
      console.error('[Store] deleteClient DB error:', err)
    );
  },

  addInvoice: (newInv) => {
    const id = newId();
    const invoice: Invoice = { ...newInv, id };
    set((state) => ({ invoices: [invoice, ...state.invoices] }));

    get().logActivity({
      workspace_id: newInv.workspace_id,
      type: 'invoice',
      action: 'Dispatched invoice ' + invoice.invoice_number + ' for $' + invoice.amount,
      actor_name: 'Finance Lead',
    });

    QontroSupabaseService.createInvoice(newInv).then((saved) => {
      if (saved) {
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...saved } : i)),
        }));
      }
    }).catch((err) => console.error('[Store] addInvoice DB error:', err));
  },

  deleteInvoice: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== invoiceId),
    }));
    QontroSupabaseService.deleteInvoice(invoiceId).catch((err) =>
      console.error('[Store] deleteInvoice DB error:', err)
    );
  },

  updateInvoiceStatus: (invId, status) => {
    const target = get().invoices.find((i) => i.id === invId);
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
    QontroSupabaseService.updateInvoiceStatus(invId, status).catch((err) =>
      console.error('[Store] updateInvoiceStatus DB error:', err)
    );
  },

  addExpense: (newExp) => {
    const expense: Expense = {
      ...newExp,
      id: newId(),
      created_at: new Date().toISOString(),
    };
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    get().logActivity({
      workspace_id: newExp.workspace_id,
      type: 'invoice',
      action: 'Recorded expense: ' + expense.name + ' ($' + expense.amount + ')',
      actor_name: 'Finance Lead',
    });

    QontroSupabaseService.createExpense(newExp).then((saved) => {
      if (saved) {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === expense.id ? { ...e, ...saved } : e)),
        }));
      }
    }).catch((err) => console.error('[Store] addExpense DB error:', err));
  },

  deleteExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    }));

    QontroSupabaseService.deleteExpense(expenseId).catch((err) =>
      console.error('[Store] deleteExpense DB error:', err)
    );
  },

  addDocument: (newDoc) => {
    const id = newId();
    const doc: Document = {
      ...newDoc,
      id,
      updated_at: new Date().toISOString(),
    };
    set((state) => ({ documents: [doc, ...state.documents] }));

    get().logActivity({
      workspace_id: newDoc.workspace_id,
      type: 'document',
      action: 'Created company SOP / template: ' + doc.title,
      actor_name: 'Founder',
    });

    QontroSupabaseService.createDocument(newDoc).then((saved) => {
      if (saved) {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...saved } : d)),
        }));
      }
    }).catch((err) => console.error('[Store] addDocument DB error:', err));
  },

  deleteDocument: (docId) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
    }));
    QontroSupabaseService.deleteDocument(docId).catch((err) =>
      console.error('[Store] deleteDocument DB error:', err)
    );
  },

  updateDocument: (id, title, content) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, title, content, updated_at: new Date().toISOString() } : d
      ),
    }));
    QontroSupabaseService.updateDocument(id, { title, content }).catch((err) =>
      console.error('[Store] updateDocument DB error:', err)
    );
  },

  addMember: (newMem) => {
    const member: WorkspaceMember = {
      ...newMem,
      id: newId(),
      joined_at: new Date().toISOString(),
    };
    set((state) => ({ members: [...state.members, member] }));
    get().logActivity({
      workspace_id: newMem.workspace_id,
      type: 'member',
      action: 'Invited team member: ' + member.name + ' (' + member.email + ')',
      actor_name: 'Founder',
    });
  },

  deleteMember: (memberId) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    }));
  },

  addSkill: (newSkill) => {
    const skill: Skill = { ...newSkill, id: newId() };
    set((state) => ({ skills: [...state.skills, skill] }));
    QontroSupabaseService.createSkill(newSkill).catch((err) =>
      console.warn('[Store] createSkill DB sync warning:', err.message)
    );
  },

  approveAIRecommendation: (recId) => {
    const { aiRecommendations, tasks } = get();
    const rec = aiRecommendations.find((r) => r.id === recId);
    if (!rec) return;

    if (rec.type === 'assignment' && rec.target_task_id && rec.recommended_member_id) {
      set({
        tasks: tasks.map((t) =>
          t.id === rec.target_task_id
            ? { ...t, assigned_to: rec.recommended_member_id, status: 'todo' as TaskStatus }
            : t
        ),
      });
      get().logActivity({
        workspace_id: rec.workspace_id,
        type: 'ai',
        action: 'Approved AI assignment recommendation for task ' + rec.target_task_id,
        actor_name: 'Founder',
      });
      QontroSupabaseService.updateTask(rec.target_task_id, {
        assigned_to: rec.recommended_member_id,
        status: 'todo'
      }).catch(console.error);
    }

    set({
      aiRecommendations: aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'approved' } : r
      ),
    });

    QontroSupabaseService.updateAIRecommendationStatus(recId, 'approved').catch((err) =>
      console.error('[Store] approveAIRecommendation DB error:', err)
    );
  },

  dismissAIRecommendation: (recId) => {
    set((state) => ({
      aiRecommendations: state.aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'dismissed' } : r
      ),
    }));

    QontroSupabaseService.updateAIRecommendationStatus(recId, 'dismissed').catch((err) =>
      console.error('[Store] dismissAIRecommendation DB error:', err)
    );
  },

  generateAIRecommendation: (rec) => {
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
    });
  },
}));