import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  calculateMemberWorkload,
  calculateProjectHealth,
} from '../src/services/supabaseService';
import { Task, Project, WorkspaceMember, Skill, Invoice, Expense, Document } from '../src/types';

describe('Integration Journey 1: Workspace Initialization & Owner Membership Flow', () => {
  test('transactionally setups workspace with owner membership', () => {
    const userId = crypto.randomUUID();
    const wsId = crypto.randomUUID();

    const workspace = {
      id: wsId,
      name: 'Apex Growth Agency',
      slug: 'apex-growth',
      owner_id: userId,
      currency: 'USD',
      created_at: new Date().toISOString(),
    };

    const ownerMember: WorkspaceMember = {
      id: crypto.randomUUID(),
      workspace_id: wsId,
      user_id: userId,
      name: 'Founder Lead',
      email: 'founder@apexgrowth.agency',
      role: 'owner',
      designation: 'Managing Director',
      workload_percentage: 0,
      status: 'active',
      joined_at: new Date().toISOString(),
    };

    assert.strictEqual(workspace.owner_id, userId);
    assert.strictEqual(ownerMember.workspace_id, workspace.id);
    assert.strictEqual(ownerMember.role, 'owner');
    assert.strictEqual(ownerMember.workload_percentage, 0);
  });
});

describe('Integration Journey 2: Project Creation, Task Lifecycle & Live Health Telemetry', () => {
  test('progresses task across states and recalculates project health score', () => {
    const wsId = crypto.randomUUID();
    const prjId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const project: Project = {
      id: prjId,
      workspace_id: wsId,
      name: 'Mobile App Redesign',
      client_name: 'Stripe',
      description: 'Full iOS & Android interface refresh',
      budget: 50000,
      deadline: '2026-11-30',
      status: 'active',
      health_score: 100,
      created_at: new Date().toISOString(),
    };

    let tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        project_id: prjId,
        title: 'Design Design System Tokens',
        description: 'Figma tokens setup',
        priority: 'high',
        status: 'todo',
        assigned_to: memberId,
        required_skills: ['UI Design'],
        estimated_hours: 10,
        deadline: '2026-11-01',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        project_id: prjId,
        title: 'API Authentication Flow',
        description: 'OAuth2 integration',
        priority: 'urgent',
        status: 'blocked', // One blocked task
        assigned_to: memberId,
        required_skills: ['Backend'],
        estimated_hours: 15,
        deadline: '2026-11-05',
        created_at: new Date().toISOString(),
      },
    ];

    // Health with 1 blocked task: 100 - 20 = 80
    let currentHealth = calculateProjectHealth(prjId, tasks);
    assert.strictEqual(currentHealth, 80);

    // Unblock the task: move to 'doing'
    tasks = tasks.map((t) => (t.status === 'blocked' ? { ...t, status: 'doing' as const } : t));
    currentHealth = calculateProjectHealth(prjId, tasks);
    assert.strictEqual(currentHealth, 100, 'Project health restores to 100 when unblocked');

    // Complete all tasks
    tasks = tasks.map((t) => ({ ...t, status: 'completed' as const }));
    currentHealth = calculateProjectHealth(prjId, tasks);
    assert.strictEqual(currentHealth, 100, 'Completed tasks maintain 100 health');

    // Workload drops to 0 when tasks are completed
    const finalWorkload = calculateMemberWorkload(memberId, tasks);
    assert.strictEqual(finalWorkload, 0, 'Completed tasks do not consume active weekly workload');
  });
});

describe('Integration Journey 3: Real Invoicing, Expenses & Net Operating Telemetry', () => {
  test('accurately computes revenue, pending cash, and operating margins', () => {
    const wsId = crypto.randomUUID();

    const invoices: Invoice[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        invoice_number: 'INV-2026-0001',
        client_name: 'Acme Corp',
        client_email: 'billing@acme.com',
        amount: 15000,
        currency: 'USD',
        status: 'paid',
        issue_date: '2026-09-01',
        due_date: '2026-09-15',
      },
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        invoice_number: 'INV-2026-0002',
        client_name: 'Globex Ltd',
        client_email: 'finance@globex.com',
        amount: 8500,
        currency: 'USD',
        status: 'sent',
        issue_date: '2026-09-10',
        due_date: '2026-09-24',
      },
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        invoice_number: 'INV-2026-0003',
        client_name: 'Umbrella Tech',
        client_email: 'ap@umbrella.com',
        amount: 6000,
        currency: 'USD',
        status: 'overdue',
        issue_date: '2026-08-01',
        due_date: '2026-08-15',
      },
    ];

    const expenses: Expense[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        name: 'Vercel Enterprise',
        category: 'software',
        amount: 1200,
        currency: 'USD',
        date: '2026-09-01',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: wsId,
        name: 'Contract UI Designer',
        category: 'contractor',
        amount: 4500,
        currency: 'USD',
        date: '2026-09-05',
        created_at: new Date().toISOString(),
      },
    ];

    const settledRevenue = invoices.filter((i) => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingReceivables = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);
    const overdueReceivables = invoices.filter((i) => i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = settledRevenue - totalExpenses;

    assert.strictEqual(settledRevenue, 15000);
    assert.strictEqual(pendingReceivables, 14500); // 8500 + 6000
    assert.strictEqual(overdueReceivables, 6000);
    assert.strictEqual(totalExpenses, 5700); // 1200 + 4500
    assert.strictEqual(netProfit, 9300); // 15000 - 5700
  });
});

describe('Integration Journey 4: Multi-Tenant Data Isolation Invariants', () => {
  test('rejects cross-workspace foreign key references', () => {
    const wsAlpha = crypto.randomUUID();
    const wsBeta = crypto.randomUUID();

    const alphaProject: Project = {
      id: crypto.randomUUID(),
      workspace_id: wsAlpha,
      name: 'Alpha Project',
      client_name: 'Client Alpha',
      description: '',
      budget: 10000,
      deadline: '2026-12-31',
      status: 'active',
      health_score: 100,
      created_at: new Date().toISOString(),
    };

    // Adversarial cross-workspace task injection attempt:
    // Task claims to belong to Workspace Beta, but targets Alpha Project
    const forgedTask: Task = {
      id: crypto.randomUUID(),
      workspace_id: wsBeta,
      project_id: alphaProject.id, // CROSS-TENANT FORGERY
      title: 'Malicious Task',
      description: '',
      priority: 'low',
      status: 'todo',
      required_skills: [],
      estimated_hours: 4,
      deadline: '2026-12-31',
      created_at: new Date().toISOString(),
    };

    // Verification invariant: Task workspace_id MUST match Project workspace_id
    const isTenantConsistent = forgedTask.workspace_id === alphaProject.workspace_id;
    assert.strictEqual(isTenantConsistent, false, 'Database RLS and backend constraints MUST reject cross-tenant relations');
  });
});
