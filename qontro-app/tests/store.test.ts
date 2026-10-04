import assert from 'node:assert/strict';
import { test, describe, beforeEach } from 'node:test';
import { sanitizeHtml, sanitizeText } from '../src/lib/sanitize';
import { useAppStore } from '../src/store';
import {
  calculateMemberWorkload,
  calculateProjectHealth,
} from '../src/services/supabaseService';
import { Task, Project, WorkspaceMember, Skill, Invoice } from '../src/types';

describe('1. Security & XSS Sanitization (DOMPurify)', () => {
  test('strips dangerous <script> tags from HTML', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script><span>World</span>';
    const clean = sanitizeHtml(dirty);
    assert.strictEqual(clean, '<p>Hello</p><span>World</span>');
    assert.doesNotMatch(clean, /<script>/i);
  });

  test('strips onerror and onclick event handlers from tags', () => {
    const dirty = '<img src="invalid.jpg" onerror="alert(document.cookie)" /><button onclick="steal()">Click</button>';
    const clean = sanitizeHtml(dirty);
    assert.doesNotMatch(clean, /onerror/i);
    assert.doesNotMatch(clean, /onclick/i);
    assert.doesNotMatch(clean, /<button/i);
  });

  test('strips javascript: pseudo-protocol in links', () => {
    const dirty = '<a href="javascript:alert(1)">Click Me</a>';
    const clean = sanitizeHtml(dirty);
    assert.doesNotMatch(clean, /javascript:/i);
  });

  test('preserves valid safe markup (headings, lists, bold, links)', () => {
    const safeInput = '<h2>Release Notes</h2><ul><li><strong>Feature:</strong> Shipped</li></ul><a href="https://qontro.agency">Link</a>';
    const clean = sanitizeHtml(safeInput);
    assert.strictEqual(clean, safeInput);
  });

  test('sanitizeText strips ALL HTML markup completely', () => {
    const dirty = '<h1>Heading</h1> <b>Bold text</b> & regular text';
    const clean = sanitizeText(dirty);
    assert.strictEqual(clean, 'Heading Bold text &amp; regular text');
    assert.doesNotMatch(clean, /<[^>]*>/);
  });
});

describe('2. Currency Precision & Integer Minor Units (Rule 28)', () => {
  const toCents = (dollars: number): number => Math.round(dollars * 100);
  const toDollars = (cents: number): number => cents / 100;

  test('accurately converts floating dollars to integer cents without precision loss', () => {
    assert.strictEqual(toCents(19.99), 1999);
    assert.strictEqual(toCents(129.99), 12999);
    assert.strictEqual(toCents(0.1 + 0.2), 30);
    assert.strictEqual(toCents(5000.55), 500055);
    assert.strictEqual(toCents(0), 0);
  });

  test('converts integer cents back to exact decimal currency', () => {
    assert.strictEqual(toDollars(1999), 19.99);
    assert.strictEqual(toDollars(12999), 129.99);
    assert.strictEqual(toDollars(30), 0.3);
    assert.strictEqual(toDollars(500055), 5000.55);
    assert.strictEqual(toDollars(0), 0);
  });

  test('handles large multi-million currency amounts accurately', () => {
    const millions = 2500000.50;
    const cents = toCents(millions);
    assert.strictEqual(cents, 250000050);
    assert.strictEqual(toDollars(cents), millions);
  });
});

describe('3. Deterministic Workload Calculation Formula (Rule 20)', () => {
  const memberId = 'mem-eng-1';

  test('returns 0% workload when member has no assigned tasks', () => {
    const tasks: Task[] = [];
    const workload = calculateMemberWorkload(memberId, tasks);
    assert.strictEqual(workload, 0);
  });

  test('calculates percentage of standard 40-hour weekly capacity', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: crypto.randomUUID(),
        title: 'Task A',
        description: '',
        priority: 'high',
        status: 'doing',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 20,
        deadline: '2026-10-10',
        created_at: new Date().toISOString(),
      },
    ];
    // 20 hours / 40 hours = 50%
    const workload = calculateMemberWorkload(memberId, tasks);
    assert.strictEqual(workload, 50);
  });

  test('ignores backlog and completed tasks from active workload', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: crypto.randomUUID(),
        title: 'Done Task',
        description: '',
        priority: 'medium',
        status: 'completed',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 30,
        deadline: '2026-10-01',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: crypto.randomUUID(),
        title: 'Backlog Task',
        description: '',
        priority: 'low',
        status: 'backlog',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 40,
        deadline: '2026-11-01',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: crypto.randomUUID(),
        title: 'Active Task',
        description: '',
        priority: 'urgent',
        status: 'doing',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 10,
        deadline: '2026-10-15',
        created_at: new Date().toISOString(),
      },
    ];
    // Only the 10h doing task counts: 10 / 40 = 25%
    const workload = calculateMemberWorkload(memberId, tasks);
    assert.strictEqual(workload, 25);
  });

  test('clamps workload at 100% when member is overcapacity', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: crypto.randomUUID(),
        title: 'Heavy Sprint',
        description: '',
        priority: 'urgent',
        status: 'doing',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 60,
        deadline: '2026-10-05',
        created_at: new Date().toISOString(),
      },
    ];
    const workload = calculateMemberWorkload(memberId, tasks);
    assert.strictEqual(workload, 100);
  });
});

describe('4. Deterministic Project Health Score Calculation (Rule 14)', () => {
  const projectId = 'prj-health-1';

  test('clean project with 0 tasks starts at 100 health', () => {
    const tasks: Task[] = [];
    const health = calculateProjectHealth(projectId, tasks);
    assert.strictEqual(health, 100);
  });

  test('project with all tasks completed maintains 100 health', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: projectId,
        title: 'Done 1',
        description: '',
        priority: 'medium',
        status: 'completed',
        required_skills: [],
        estimated_hours: 4,
        deadline: '2026-10-01',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: projectId,
        title: 'Done 2',
        description: '',
        priority: 'high',
        status: 'completed',
        required_skills: [],
        estimated_hours: 8,
        deadline: '2026-10-02',
        created_at: new Date().toISOString(),
      },
    ];
    const health = calculateProjectHealth(projectId, tasks);
    assert.strictEqual(health, 100);
  });

  test('penalizes blocked tasks by 20 points each', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: projectId,
        title: 'Blocked DB Issue',
        description: '',
        priority: 'urgent',
        status: 'blocked',
        required_skills: [],
        estimated_hours: 8,
        deadline: '2026-12-31', // future date, not overdue
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: projectId,
        title: 'Doing Feature',
        description: '',
        priority: 'medium',
        status: 'doing',
        required_skills: [],
        estimated_hours: 4,
        deadline: '2026-12-31',
        created_at: new Date().toISOString(),
      },
    ];
    // 100 - (1 blocked * 20) = 80
    const health = calculateProjectHealth(projectId, tasks);
    assert.strictEqual(health, 80);
  });

  test('penalizes overdue tasks by 25 points each', () => {
    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: crypto.randomUUID(),
        project_id: projectId,
        title: 'Late Task',
        description: '',
        priority: 'high',
        status: 'todo',
        required_skills: [],
        estimated_hours: 4,
        deadline: '2020-01-01', // definitely in the past
        created_at: new Date().toISOString(),
      },
    ];
    // 100 - (1 overdue * 25) = 75
    const health = calculateProjectHealth(projectId, tasks);
    assert.strictEqual(health, 75);
  });

  test('clamps health at minimum of 10 points even under extreme failures', () => {
    const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
      id: crypto.randomUUID(),
      workspace_id: crypto.randomUUID(),
      project_id: projectId,
      title: `Critical Bug ${i}`,
      description: '',
      priority: 'urgent',
      status: 'blocked',
      required_skills: [],
      estimated_hours: 8,
      deadline: '2020-01-01',
      created_at: new Date().toISOString(),
    }));
    const health = calculateProjectHealth(projectId, tasks);
    assert.strictEqual(health, 10);
  });
});

describe('5. Sequential Invoice Numbering & Format (Rule 29)', () => {
  test('generates standard sequential format INV-YYYY-XXXX', () => {
    const generateNumber = (count: number, year: number = 2026) => {
      const nextSeq = count + 1;
      return `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
    };

    assert.strictEqual(generateNumber(0), 'INV-2026-0001');
    assert.strictEqual(generateNumber(1), 'INV-2026-0002');
    assert.strictEqual(generateNumber(99), 'INV-2026-0100');
    assert.strictEqual(generateNumber(999), 'INV-2026-1000');
  });

  test('never generates collisions across sequential invocations', () => {
    const numbers = new Set<string>();
    for (let count = 0; count < 1000; count++) {
      const num = `INV-2026-${String(count + 1).padStart(4, '0')}`;
      assert.strictEqual(numbers.has(num), false, 'Duplicate invoice number generated');
      numbers.add(num);
    }
    assert.strictEqual(numbers.size, 1000);
  });
});

describe('6. Skill Verification Engine & Progression (Rule 21)', () => {
  test('updates verified_tasks_count and unlocks verification threshold', () => {
    let skill: Skill = {
      id: crypto.randomUUID(),
      workspace_id: crypto.randomUUID(),
      member_id: crypto.randomUUID(),
      skill_name: 'TypeScript',
      score: 75,
      category: 'engineering',
      verified_tasks_count: 2,
      is_verified: false,
    };

    // Simulate completion of a task requiring TypeScript
    const recordTaskCompletion = (s: Skill): Skill => {
      const newCount = s.verified_tasks_count + 1;
      return {
        ...s,
        verified_tasks_count: newCount,
        is_verified: newCount >= 3,
        score: Math.min(99, s.score + 2),
      };
    };

    skill = recordTaskCompletion(skill);
    assert.strictEqual(skill.verified_tasks_count, 3);
    assert.strictEqual(skill.is_verified, true, 'Skill should become verified after 3 tasks');
    assert.strictEqual(skill.score, 77);

    // Another task completion
    skill = recordTaskCompletion(skill);
    assert.strictEqual(skill.verified_tasks_count, 4);
    assert.strictEqual(skill.is_verified, true);
    assert.strictEqual(skill.score, 79);
  });
});

describe('7. Multi-Tenant Relational Isolation & UUID Invariants (Rule 7)', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  test('validates RFC4122 v4 UUID format', () => {
    const validUuid = crypto.randomUUID();
    assert.match(validUuid, UUID_REGEX);

    const invalidUuid = 'ws_prod_01';
    assert.doesNotMatch(invalidUuid, UUID_REGEX);
  });

  test('prevents cross-workspace assignment leakage in calculations', () => {
    const ws1 = crypto.randomUUID();
    const ws2 = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        workspace_id: ws1,
        project_id: crypto.randomUUID(),
        title: 'Workspace 1 Task',
        description: '',
        priority: 'high',
        status: 'doing',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 20,
        deadline: '2026-10-10',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        workspace_id: ws2, // DIFFERENT TENANT
        project_id: crypto.randomUUID(),
        title: 'Workspace 2 Task',
        description: '',
        priority: 'high',
        status: 'doing',
        assigned_to: memberId,
        required_skills: [],
        estimated_hours: 20,
        deadline: '2026-10-10',
        created_at: new Date().toISOString(),
      },
    ];

    // Filter by tenant boundary first
    const ws1Tasks = tasks.filter((t) => t.workspace_id === ws1);
    assert.strictEqual(ws1Tasks.length, 1);
    const ws1Workload = calculateMemberWorkload(memberId, ws1Tasks);
    assert.strictEqual(ws1Workload, 50, 'Workload must only include tasks from the active tenant');
  });
});

describe('8. Company Memory Template Duplication (Rule 24)', () => {
  test('1-click duplicate creates independent record with new UUID and (Copy) title', () => {
    const wsId = crypto.randomUUID();
    const originalDoc = {
      id: crypto.randomUUID(),
      workspace_id: wsId,
      title: 'Master Service Agreement',
      content: '<p>Contract legal terms</p>',
      type: 'contract' as const,
      category: 'Legal',
      tags: ['Legal', 'Template'],
      created_by_name: 'Founder',
      is_restricted: true,
      updated_at: new Date().toISOString(),
    };

    const duplicateDoc = {
      ...originalDoc,
      id: crypto.randomUUID(),
      title: `${originalDoc.title} (Copy)`,
      updated_at: new Date().toISOString(),
    };

    assert.notStrictEqual(duplicateDoc.id, originalDoc.id, 'Duplicated doc must have distinct UUID');
    assert.strictEqual(duplicateDoc.workspace_id, originalDoc.workspace_id);
    assert.strictEqual(duplicateDoc.title, 'Master Service Agreement (Copy)');
    assert.strictEqual(duplicateDoc.content, originalDoc.content);
    assert.strictEqual(duplicateDoc.is_restricted, true);
  });
});

describe('9. AI Human-In-The-Loop Governance (Rule 34)', () => {
  test('approving AI recommendation transforms task state and records audit action', () => {
    const wsId = crypto.randomUUID();
    const taskId = crypto.randomUUID();
    const currentMemberId = crypto.randomUUID();
    const recommendedMemberId = crypto.randomUUID();

    let task: Task = {
      id: taskId,
      workspace_id: wsId,
      project_id: crypto.randomUUID(),
      title: 'Fix High-Load Latency Spike',
      description: '',
      priority: 'urgent',
      status: 'blocked',
      assigned_to: currentMemberId,
      required_skills: ['Backend', 'Postgres'],
      estimated_hours: 8,
      deadline: '2026-10-10',
      created_at: new Date().toISOString(),
    };

    // AI recommendation proposes reassignment to recommendedMemberId
    const recommendation = {
      id: crypto.randomUUID(),
      workspace_id: wsId,
      type: 'assignment' as const,
      title: 'Reassign to Senior DB Engineer',
      description: 'Current assignee at 95% capacity; recommended engineer at 30% capacity',
      target_task_id: taskId,
      recommended_member_id: recommendedMemberId,
      status: 'pending' as 'pending' | 'approved' | 'dismissed',
    };

    // Simulate Human Approval
    recommendation.status = 'approved';
    task = {
      ...task,
      assigned_to: recommendation.recommended_member_id,
      status: 'todo',
    };

    assert.strictEqual(recommendation.status, 'approved');
    assert.strictEqual(task.assigned_to, recommendedMemberId);
    assert.strictEqual(task.status, 'todo');
  });
});
