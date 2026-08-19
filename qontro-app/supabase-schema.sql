-- Qontro Cloud Multi-Tenant Schema
-- 100% Cloud-First PostgreSQL schema with Row-Level Security (RLS)

-- 1. Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid not null,
  currency text default 'USD',
  created_at timestamptz default now()
);

-- 2. Workspace Members
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid not null,
  name text not null,
  email text not null,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'client')),
  designation text,
  workload_percentage int default 0,
  joined_at timestamptz default now()
);

-- 3. Skills Graph
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid not null,
  skill_name text not null,
  score numeric(3, 1) not null default 5.0,
  category text not null,
  verified_tasks_count int default 0,
  created_at timestamptz default now()
);

-- 4. Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  client_name text not null,
  description text,
  budget numeric(12, 2) default 0.00,
  deadline date not null,
  status text default 'active' check (status in ('planning', 'active', 'warning', 'critical', 'completed', 'paused')),
  health_score int default 100,
  lead_member_id uuid,
  created_at timestamptz default now()
);

-- 5. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_to uuid,
  priority text default 'high' check (priority in ('urgent', 'high', 'medium', 'low')),
  status text default 'todo' check (status in ('backlog', 'todo', 'doing', 'review', 'completed', 'blocked')),
  required_skills text[] default array[]::text[],
  estimated_hours numeric(5, 1) default 4.0,
  deadline date not null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 6. Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  invoice_number text not null,
  client_name text not null,
  client_email text,
  amount numeric(12, 2) not null,
  currency text default 'USD',
  status text default 'sent' check (status in ('draft', 'sent', 'paid', 'overdue')),
  issue_date date default current_date,
  due_date date not null,
  project_name text,
  created_at timestamptz default now()
);

-- 7. Documents (Company Memory)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  content text not null,
  type text default 'sop' check (type in ('sop', 'contract', 'template', 'meeting_notes', 'guide')),
  category text default 'General',
  tags text[] default array[]::text[],
  created_by_name text not null,
  updated_at timestamptz default now()
);

-- 8. AI Recommendations
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type text not null,
  title text not null,
  description text not null,
  target_task_id uuid,
  recommended_member_id uuid,
  current_member_id uuid,
  match_score int,
  reasons text[] default array[]::text[],
  status text default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.invoices enable row level security;
alter table public.documents enable row level security;
alter table public.ai_recommendations enable row level security;
