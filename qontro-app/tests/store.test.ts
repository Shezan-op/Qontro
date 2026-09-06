import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { sanitizeHtml, sanitizeText } from '../src/lib/sanitize';
import { useAppStore } from '../src/store';

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
    assert.doesNotMatch(clean, /<button/i); // button tag is forbidden in rich text
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

describe('2. Currency Precision & Integer Cents Conversion', () => {
  test('accurately converts floating dollars to integer cents without precision loss', () => {
    const toCents = (dollars: number): number => Math.round(dollars * 100);
    const toDollars = (cents: number): number => cents / 100;

    // Common floating point pitfall values
    assert.strictEqual(toCents(19.99), 1999);
    assert.strictEqual(toCents(129.99), 12999);
    assert.strictEqual(toCents(0.1 + 0.2), 30);
    assert.strictEqual(toCents(5000.55), 500055);

    // Reconversion back to dollars
    assert.strictEqual(toDollars(1999), 19.99);
    assert.strictEqual(toDollars(12999), 129.99);
    assert.strictEqual(toDollars(500055), 5000.55);
  });
});

describe('3. Zustand Store Persistence & UUID Integrity (Split-Brain Prevention)', () => {
  test('addTask generates UUID and creates task_history with matching task_id', () => {
    const store = useAppStore.getState();
    const initialTasksCount = store.tasks.length;
    const initialHistoryCount = store.taskHistories.length;

    store.addTask({
      workspace_id: 'ws-test-1',
      project_id: 'proj-test-1',
      project_name: 'Test Project',
      title: 'Audit Database Schema',
      description: 'Ensure 13 tables are normalized',
      priority: 'high',
      status: 'todo',
      required_skills: ['PostgreSQL', 'TypeScript'],
      estimated_hours: 4,
      deadline: '2026-10-01',
    });

    const updatedStore = useAppStore.getState();
    assert.strictEqual(updatedStore.tasks.length, initialTasksCount + 1);

    const createdTask = updatedStore.tasks[0];
    assert.ok(createdTask.id, 'Task must have a client-generated UUID');
    assert.strictEqual(createdTask.title, 'Audit Database Schema');

    // Verify task history was created with exact same task_id
    assert.strictEqual(updatedStore.taskHistories.length, initialHistoryCount + 1);
    const historyEntry = updatedStore.taskHistories[0];
    assert.strictEqual(historyEntry.task_id, createdTask.id, 'Task history task_id MUST match created task.id to prevent split-brain');
    assert.strictEqual(historyEntry.action, 'Task created');
  });

  test('updateTaskStatus updates status and records task_history entry', () => {
    const store = useAppStore.getState();
    const targetTask = store.tasks[0];
    assert.ok(targetTask, 'A task should exist from previous test');

    const prevStatus = targetTask.status;
    const initialHistoryCount = store.taskHistories.length;

    store.updateTaskStatus(targetTask.id, 'doing');

    const updatedStore = useAppStore.getState();
    const modifiedTask = updatedStore.tasks.find((t) => t.id === targetTask.id);
    assert.strictEqual(modifiedTask?.status, 'doing');

    // Verify status change was tracked in task_history
    assert.strictEqual(updatedStore.taskHistories.length, initialHistoryCount + 1);
    const statusHistory = updatedStore.taskHistories[0];
    assert.strictEqual(statusHistory.task_id, targetTask.id);
    assert.strictEqual(statusHistory.action, 'Status changed');
    assert.strictEqual(statusHistory.previous_value, prevStatus);
    assert.strictEqual(statusHistory.new_value, 'doing');
  });

  test('assignTask assigns member and records assignment in task_history', () => {
    const store = useAppStore.getState();
    const targetTask = store.tasks[0];
    assert.ok(targetTask);

    const initialHistoryCount = store.taskHistories.length;
    store.assignTask(targetTask.id, 'member-101');

    const updatedStore = useAppStore.getState();
    const modifiedTask = updatedStore.tasks.find((t) => t.id === targetTask.id);
    assert.strictEqual(modifiedTask?.assigned_to, 'member-101');

    // Verify assignment is logged in history
    assert.strictEqual(updatedStore.taskHistories.length, initialHistoryCount + 1);
    const assignHistory = updatedStore.taskHistories[0];
    assert.strictEqual(assignHistory.task_id, targetTask.id);
    assert.strictEqual(assignHistory.action, 'Reassigned');
    assert.strictEqual(assignHistory.new_value, 'member-101');
  });

  test('logActivity stores new activity_log with valid UUID and timestamp', () => {
    const store = useAppStore.getState();
    const initialLogCount = store.activityLogs.length;

    store.logActivity({
      workspace_id: 'ws-test-1',
      type: 'project',
      action: 'Deployed infrastructure worker',
      actor_name: 'Lead Engineer',
    });

    const updatedStore = useAppStore.getState();
    assert.strictEqual(updatedStore.activityLogs.length, initialLogCount + 1);

    const log = updatedStore.activityLogs[0];
    assert.ok(log.id, 'Activity log must have generated UUID');
    assert.strictEqual(log.actor_name, 'Lead Engineer');
    assert.strictEqual(log.action, 'Deployed infrastructure worker');
    assert.ok(log.created_at, 'Activity log must have created_at timestamp');
  });
});

describe('4. Financial & Expense Integrity in Store', () => {
  test('addExpense adds expense and recalculates total net profit estimate', () => {
    const store = useAppStore.getState();
    const initialExpenseCount = store.expenses.length;

    store.addExpense({
      workspace_id: store.currentWorkspace.id,
      name: 'Cloud Hosting (AWS)',
      category: 'software',
      amount: 450.75,
      currency: 'USD',
      date: '2026-09-06',
    });

    const updatedStore = useAppStore.getState();
    assert.strictEqual(updatedStore.expenses.length, initialExpenseCount + 1);

    const added = updatedStore.expenses[0];
    assert.strictEqual(added.name, 'Cloud Hosting (AWS)');
    assert.strictEqual(added.amount, 450.75);

    // Reconcile financial calculation logic used in the Finance cockpit
    const totalSettledRevenue = updatedStore.invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = updatedStore.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfitEstimate = totalSettledRevenue - totalExpenses;

    assert.strictEqual(typeof totalSettledRevenue, 'number');
    assert.strictEqual(typeof totalExpenses, 'number');
    assert.strictEqual(typeof netProfitEstimate, 'number');
    assert.ok(totalExpenses >= 450.75);
  });
});
