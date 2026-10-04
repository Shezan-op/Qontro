import { 
  Workspace, 
  WorkspaceMember, 
  Project, 
  Task, 
  Skill, 
  Invoice, 
  Document, 
  AIRecommendation,
  Client,
  Expense,
  ActivityLog,
  TaskHistory
} from '@/types';

export const DEFAULT_CLEAN_WORKSPACE: Workspace = {
  id: '00000000-0000-4000-a000-000000000001',
  name: 'My Organization',
  slug: 'my-org',
  owner_id: '00000000-0000-4000-a000-000000000002',
  currency: 'USD',
  timezone: 'UTC+05:30 (IST)',
  created_at: new Date().toISOString(),
};

export const DEFAULT_CLEAN_MEMBERS: WorkspaceMember[] = [
  {
    id: '00000000-0000-4000-a000-000000000003',
    workspace_id: '00000000-0000-4000-a000-000000000001',
    user_id: '00000000-0000-4000-a000-000000000002',
    name: 'Founder & Admin',
    email: 'admin@organization.com',
    role: 'owner',
    designation: 'Managing Director',
    workload_percentage: 0,
    status: 'active',
    joined_at: new Date().toISOString(),
  },
];

export const DEFAULT_CLEAN_CLIENTS: Client[] = [];
export const DEFAULT_CLEAN_EXPENSES: Expense[] = [];
export const DEFAULT_CLEAN_SKILLS: Skill[] = [];
export const DEFAULT_CLEAN_PROJECTS: Project[] = [];
export const DEFAULT_CLEAN_TASKS: Task[] = [];
export const DEFAULT_CLEAN_INVOICES: Invoice[] = [];
export const DEFAULT_CLEAN_DOCUMENTS: Document[] = [];
export const DEFAULT_CLEAN_AI_RECOMMENDATIONS: AIRecommendation[] = [];
export const DEFAULT_CLEAN_ACTIVITY_LOGS: ActivityLog[] = [];
export const DEFAULT_CLEAN_TASK_HISTORIES: TaskHistory[] = [];
