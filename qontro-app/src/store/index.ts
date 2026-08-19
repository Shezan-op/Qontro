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
import { QontroSupabaseService } from '@/services/supabaseService';

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
  
  // Workspace Actions
  setWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, currency?: string) => void;
  
  // Tasks Actions
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  assignTask: (taskId: string, memberId: string) => void;
  addTaskComment: (taskId: string, content: string, authorName?: string) => void;
  
  // Projects Actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'health_score' | 'total_tasks' | 'completed_tasks'>) => void;
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

  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  createWorkspace: (name, currency = 'USD') => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name,
      slug: slug || `ws-${Date.now()}`,
      owner_id: 'usr_founder',
      currency,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      workspaces: [...state.workspaces, newWs],
      currentWorkspace: newWs,
    }));
  },

  logActivity: (newLog) => {
    const log: ActivityLog = {
      ...newLog,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  addTask: (newTask) => {
    const task: Task = {
      ...newTask,
      id: `tsk_${Date.now()}`,
      created_at: new Date().toISOString(),
      comments: [],
    };

    const historyEntry: TaskHistory = {
      id: `th_${Date.now()}`,
      task_id: task.id,
      workspace_id: task.workspace_id,
      action: 'Task created',
      actor_name: 'Founder / Admin',
      new_value: task.title,
      created_at: new Date().toISOString(),
    };

    set((state) => {
      const updatedTasks = [task, ...state.tasks];
      const updatedProjects = state.projects.map((p) => {
        if (p.id === task.project_id) {
          const prjTasks = updatedTasks.filter((t) => t.project_id === p.id);
          const completed = prjTasks.filter((t) => t.status === 'completed').length;
          return {
            ...p,
            total_tasks: prjTasks.length,
            completed_tasks: completed,
            health_score: prjTasks.length ? Math.round((completed / prjTasks.length) * 100) : 100,
          };
        }
        return p;
      });

      return { 
        tasks: updatedTasks, 
        projects: updatedProjects,
        taskHistories: [historyEntry, ...state.taskHistories],
      };
    });

    get().logActivity({
      workspace_id: task.workspace_id,
      type: 'task',
      action: `Created task: ${task.title}`,
      actor_name: 'Founder / Admin',
    });

    QontroSupabaseService.createTask(newTask).catch(() => {});
  },

  deleteTask: (taskId) => {
    const target = get().tasks.find((t) => t.id === taskId);
    set((state) => {
      const updatedTasks = state.tasks.filter((t) => t.id !== taskId);
      return { tasks: updatedTasks };
    });
    if (target) {
      get().logActivity({
        workspace_id: target.workspace_id,
        type: 'task',
        action: `Deleted task: ${target.title}`,
        actor_name: 'Founder / Admin',
      });
    }
  },

  updateTaskStatus: (taskId, status) => {
    const targetTask = get().tasks.find((t) => t.id === taskId);
    const prevStatus = targetTask?.status;

    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });

      const updatedProjects = state.projects.map((p) => {
        if (targetTask && p.id === targetTask.project_id) {
          const prjTasks = updatedTasks.filter((t) => t.project_id === p.id);
          const completed = prjTasks.filter((t) => t.status === 'completed').length;
          return {
            ...p,
            completed_tasks: completed,
            health_score: prjTasks.length ? Math.round((completed / prjTasks.length) * 100) : 100,
          };
        }
        return p;
      });

      const historyEntry: TaskHistory = {
        id: `th_${Date.now()}`,
        task_id: taskId,
        action: 'Status changed',
        actor_name: 'Founder / Member',
        previous_value: prevStatus,
        new_value: status,
        created_at: new Date().toISOString(),
      };

      return { 
        tasks: updatedTasks, 
        projects: updatedProjects,
        taskHistories: [historyEntry, ...state.taskHistories]
      };
    });

    if (targetTask) {
      get().logActivity({
        workspace_id: targetTask.workspace_id,
        type: 'task',
        action: `Moved task "${targetTask.title}" to ${status.toUpperCase()}`,
        actor_name: 'Team Member',
      });
    }

    QontroSupabaseService.updateTaskStatus(taskId, status).catch(() => {});
  },

  assignTask: (taskId, memberId) => {
    const member = get().members.find((m) => m.id === memberId);
    const targetTask = get().tasks.find((t) => t.id === taskId);

    set((state) => {
      const historyEntry: TaskHistory = {
        id: `th_${Date.now()}`,
        task_id: taskId,
        action: 'Reassigned',
        actor_name: 'Founder',
        previous_value: targetTask?.assigned_to || 'Unassigned',
        new_value: member ? member.name : 'Unassigned',
        created_at: new Date().toISOString(),
      };
      return {
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, assigned_to: memberId } : t)),
        taskHistories: [historyEntry, ...state.taskHistories],
      };
    });

    if (targetTask) {
      get().logActivity({
        workspace_id: targetTask.workspace_id,
        type: 'task',
        action: `Assigned task "${targetTask.title}" to ${member ? member.name : 'Unassigned'}`,
        actor_name: 'Founder',
      });
    }
  },

  addTaskComment: (taskId, content, authorName = 'Founder') => {
    const comment: TaskComment = {
      id: `cmt_${Date.now()}`,
      task_id: taskId,
      author_name: authorName,
      content,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
    }));
  },

  addProject: (newPrj) => {
    const project: Project = {
      ...newPrj,
      id: `prj_${Date.now()}`,
      health_score: 100,
      total_tasks: 0,
      completed_tasks: 0,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ projects: [project, ...state.projects] }));
    
    get().logActivity({
      workspace_id: newPrj.workspace_id,
      type: 'project',
      action: `Created project: ${project.name}`,
      actor_name: 'Founder',
    });

    QontroSupabaseService.createProject(newPrj).catch(() => {});
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
        action: `Deleted project: ${target.name}`,
        actor_name: 'Founder',
      });
    }
  },

  addClient: (newClient) => {
    const client: Client = {
      ...newClient,
      id: `cli_${Date.now()}`,
      total_billed: 0,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ clients: [client, ...state.clients] }));
    get().logActivity({
      workspace_id: newClient.workspace_id,
      type: 'member',
      action: `Added client: ${client.company_name} (${client.name})`,
      actor_name: 'Founder',
    });
  },

  deleteClient: (clientId) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
    }));
  },

  addInvoice: (newInv) => {
    const invoice: Invoice = {
      ...newInv,
      id: `inv_${Date.now()}`,
    };
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    
    get().logActivity({
      workspace_id: newInv.workspace_id,
      type: 'invoice',
      action: `Dispatched invoice ${invoice.invoice_number} for $${invoice.amount}`,
      actor_name: 'Finance Lead',
    });

    QontroSupabaseService.createInvoice(newInv).catch(() => {});
  },

  deleteInvoice: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== invoiceId),
    }));
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
        action: `Updated ${target.invoice_number} status to ${status.toUpperCase()}`,
        actor_name: 'Finance Lead',
      });
    }
  },

  addExpense: (newExp) => {
    const expense: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    get().logActivity({
      workspace_id: newExp.workspace_id,
      type: 'invoice',
      action: `Recorded expense: ${expense.name} ($${expense.amount})`,
      actor_name: 'Finance Lead',
    });
  },

  deleteExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    }));
  },

  addDocument: (newDoc) => {
    const doc: Document = {
      ...newDoc,
      id: `doc_${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    set((state) => ({ documents: [doc, ...state.documents] }));
    
    get().logActivity({
      workspace_id: newDoc.workspace_id,
      type: 'document',
      action: `Created company SOP / template: ${doc.title}`,
      actor_name: 'Founder',
    });

    QontroSupabaseService.createDocument(newDoc).catch(() => {});
  },

  deleteDocument: (docId) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
    }));
  },

  updateDocument: (id, title, content) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, title, content, updated_at: new Date().toISOString() } : d
      ),
    }));
  },

  addMember: (newMem) => {
    const member: WorkspaceMember = {
      ...newMem,
      id: `mem_${Date.now()}`,
      joined_at: new Date().toISOString(),
    };
    set((state) => ({ members: [...state.members, member] }));
    get().logActivity({
      workspace_id: newMem.workspace_id,
      type: 'member',
      action: `Invited team member: ${member.name} (${member.email})`,
      actor_name: 'Founder',
    });
  },

  deleteMember: (memberId) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    }));
  },

  addSkill: (newSkill) => {
    const skill: Skill = {
      ...newSkill,
      id: `sk_${Date.now()}`,
    };
    set((state) => ({ skills: [...state.skills, skill] }));
  },

  approveAIRecommendation: (recId) => {
    const { aiRecommendations, tasks } = get();
    const rec = aiRecommendations.find((r) => r.id === recId);
    if (!rec) return;

    if (rec.type === 'assignment' && rec.target_task_id && rec.recommended_member_id) {
      set({
        tasks: tasks.map((t) =>
          t.id === rec.target_task_id ? { ...t, assigned_to: rec.recommended_member_id, status: 'todo' } : t
        ),
      });
      get().logActivity({
        workspace_id: rec.workspace_id,
        type: 'ai',
        action: `Approved AI assignment recommendation for task ${rec.target_task_id}`,
        actor_name: 'Founder',
      });
    }

    set({
      aiRecommendations: aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'approved' } : r
      ),
    });
  },

  dismissAIRecommendation: (recId) => {
    set((state) => ({
      aiRecommendations: state.aiRecommendations.map((r) =>
        r.id === recId ? { ...r, status: 'dismissed' } : r
      ),
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
