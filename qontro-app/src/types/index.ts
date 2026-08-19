export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  owner_id: string;
  currency: string;
  timezone?: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  role: WorkspaceRole;
  designation: string;
  workload_percentage: number;
  status: 'active' | 'busy' | 'away';
  joined_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  workspace_id: string;
  skill_name: string;
  score: number; // 1-10
  category: 'engineering' | 'design' | 'content' | 'marketing' | 'operations';
  verified_tasks_count: number;
}

export type ProjectStatus = 'planning' | 'active' | 'warning' | 'critical' | 'completed' | 'paused';

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  client_name: string;
  client_id?: string;
  description: string;
  budget: number;
  deadline: string;
  status: ProjectStatus;
  health_score: number; // 0-100
  total_tasks: number;
  completed_tasks: number;
  lead_member_id?: string;
  created_at: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'completed' | 'blocked';

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  assigned_to?: string; // member_id
  priority: TaskPriority;
  status: TaskStatus;
  required_skills: string[];
  estimated_hours: number;
  deadline: string;
  created_at: string;
  completed_at?: string;
  comments?: TaskComment[];
}

export interface TaskHistory {
  id: string;
  task_id: string;
  workspace_id?: string;
  action: string;
  actor_name: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  company_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'lead' | 'past';
  total_billed: number;
  created_at: string;
}

export interface Expense {
  id: string;
  workspace_id: string;
  name: string;
  category: 'software' | 'contractor' | 'payroll' | 'marketing' | 'office' | 'other';
  amount: number;
  currency: string;
  date: string;
  project_id?: string;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  tax_amount?: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  project_name?: string;
  items?: InvoiceItem[];
}

export type DocumentType = 'sop' | 'contract' | 'template' | 'meeting_notes' | 'guide';

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  type: DocumentType;
  category: string;
  tags: string[];
  created_by_name: string;
  is_restricted?: boolean;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  type: 'task' | 'project' | 'invoice' | 'document' | 'ai' | 'member';
  action: string;
  actor_name: string;
  details?: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  workspace_id: string;
  type: 'assignment' | 'overload' | 'deadline_risk' | 'daily_priority';
  title: string;
  description: string;
  target_task_id?: string;
  recommended_member_id?: string;
  current_member_id?: string;
  match_score?: number;
  reasons: string[];
  status: 'pending' | 'approved' | 'dismissed';
  created_at: string;
}
