import { createClient } from '@/lib/supabase/client';
import { Project, Task, Invoice, Document, WorkspaceMember, Skill, AIRecommendation } from '@/types';

export class QontroSupabaseService {
  private static supabase = createClient();

  // 1. Projects
  static async fetchProjects(workspaceId: string): Promise<Project[]> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Project[];
    } catch {
      return [];
    }
  }

  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'health_score' | 'total_tasks' | 'completed_tasks'>): Promise<Project | null> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          ...project,
          health_score: 100,
          total_tasks: 0,
          completed_tasks: 0,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as Project;
    } catch {
      return null;
    }
  }

  // 2. Tasks
  static async fetchTasks(workspaceId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Task[];
    } catch {
      return [];
    }
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error || !data) return null;
      return data as Task;
    } catch {
      return null;
    }
  }

  static async updateTaskStatus(taskId: string, status: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      return !error;
    } catch {
      return false;
    }
  }

  // 3. Invoices
  static async fetchInvoices(workspaceId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Invoice[];
    } catch {
      return [];
    }
  }

  static async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice | null> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

      if (error || !data) return null;
      return data as Invoice;
    } catch {
      return null;
    }
  }

  // 4. Documents
  static async fetchDocuments(workspaceId: string): Promise<Document[]> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error || !data) return [];
      return data as Document[];
    } catch {
      return [];
    }
  }

  static async createDocument(doc: Omit<Document, 'id' | 'updated_at'>): Promise<Document | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .insert(doc)
        .select()
        .single();

      if (error || !data) return null;
      return data as Document;
    } catch {
      return null;
    }
  }
}
