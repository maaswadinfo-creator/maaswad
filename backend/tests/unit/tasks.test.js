/**
 * Unit Tests — Admin Task System
 * Covers: task creation validation · status transitions · priority sorting · role-based filtering
 * Runner: node --test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Replicated task logic (pure, no DB) ──────────────────────────────────────
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['open', 'in_progress', 'done', 'cancelled'];
const CATEGORIES = ['chef_review', 'order_issue', 'customer_support', 'content', 'finance', 'operations', 'other'];

function validateTask(data) {
  const errors = [];
  if (!data.title?.trim()) errors.push('title required');
  if (data.priority && !PRIORITIES.includes(data.priority)) errors.push(`invalid priority: ${data.priority}`);
  if (data.status && !STATUSES.includes(data.status)) errors.push(`invalid status: ${data.status}`);
  if (data.category && !CATEGORIES.includes(data.category)) errors.push(`invalid category: ${data.category}`);
  return errors;
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && !['done', 'cancelled'].includes(task.status);
}

function filterTasksForRole(tasks, activeRole, userId) {
  if (activeRole === 'operations_manager') return tasks.filter((t) => String(t.assignedTo) === String(userId));
  return tasks; // owner sees all
}

function sortByPriority(tasks) {
  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
}

// ── 1. Task validation ────────────────────────────────────────────────────────
describe('Task validation', () => {
  test('valid task has no errors', () => {
    const errors = validateTask({ title: 'Review chef app', priority: 'high', status: 'open', category: 'chef_review' });
    assert.equal(errors.length, 0);
  });

  test('missing title returns error', () => {
    assert.ok(validateTask({ title: '' }).includes('title required'));
  });

  test('whitespace-only title returns error', () => {
    assert.ok(validateTask({ title: '   ' }).includes('title required'));
  });

  test('invalid priority returns error', () => {
    const errors = validateTask({ title: 'x', priority: 'critical' });
    assert.ok(errors.some((e) => e.includes('invalid priority')));
  });

  test('valid priorities all pass', () => {
    PRIORITIES.forEach((p) => {
      const errors = validateTask({ title: 'x', priority: p });
      assert.ok(!errors.some((e) => e.includes('priority')), `${p} should be valid`);
    });
  });

  test('invalid status returns error', () => {
    const errors = validateTask({ title: 'x', status: 'pending' });
    assert.ok(errors.some((e) => e.includes('invalid status')));
  });

  test('valid statuses all pass', () => {
    STATUSES.forEach((s) => {
      const errors = validateTask({ title: 'x', status: s });
      assert.ok(!errors.some((e) => e.includes('status')), `${s} should be valid`);
    });
  });

  test('invalid category returns error', () => {
    const errors = validateTask({ title: 'x', category: 'secret_ops' });
    assert.ok(errors.some((e) => e.includes('invalid category')));
  });

  test('all valid categories pass', () => {
    CATEGORIES.forEach((c) => {
      const errors = validateTask({ title: 'x', category: c });
      assert.ok(!errors.some((e) => e.includes('category')), `${c} should be valid`);
    });
  });

  test('multiple invalid fields returns multiple errors', () => {
    const errors = validateTask({ title: '', priority: 'critical', status: 'unknown' });
    assert.ok(errors.length >= 3);
  });
});

// ── 2. Overdue detection ──────────────────────────────────────────────────────
describe('isOverdue', () => {
  test('task with past due date and open status is overdue', () => {
    const task = { dueDate: new Date(Date.now() - 86400000), status: 'open' };
    assert.ok(isOverdue(task));
  });

  test('task with past due date but done is NOT overdue', () => {
    const task = { dueDate: new Date(Date.now() - 86400000), status: 'done' };
    assert.ok(!isOverdue(task));
  });

  test('task with future due date is not overdue', () => {
    const task = { dueDate: new Date(Date.now() + 86400000), status: 'open' };
    assert.ok(!isOverdue(task));
  });

  test('task with no dueDate is never overdue', () => {
    const task = { dueDate: null, status: 'open' };
    assert.ok(!isOverdue(task));
  });

  test('in_progress task with past due is overdue', () => {
    const task = { dueDate: new Date(Date.now() - 1000), status: 'in_progress' };
    assert.ok(isOverdue(task));
  });

  test('cancelled task with past due is not overdue', () => {
    const task = { dueDate: new Date(Date.now() - 1000), status: 'cancelled' };
    assert.ok(!isOverdue(task));
  });
});

// ── 3. Role-based task filtering ──────────────────────────────────────────────
describe('filterTasksForRole', () => {
  const tasks = [
    { _id: '1', title: 'Task A', assignedTo: 'ops1' },
    { _id: '2', title: 'Task B', assignedTo: 'ops2' },
    { _id: '3', title: 'Task C', assignedTo: 'ops1' },
    { _id: '4', title: 'Task D', assignedTo: null },
  ];

  test('owner sees all tasks', () => {
    const result = filterTasksForRole(tasks, 'platform_owner', 'owner1');
    assert.equal(result.length, 4);
  });

  test('ops manager sees only their tasks', () => {
    const result = filterTasksForRole(tasks, 'operations_manager', 'ops1');
    assert.equal(result.length, 2);
    result.forEach((t) => assert.equal(t.assignedTo, 'ops1'));
  });

  test('ops manager with no tasks sees empty array', () => {
    const result = filterTasksForRole(tasks, 'operations_manager', 'ops-nobody');
    assert.equal(result.length, 0);
  });

  test('food_lover falls through to owner-level view', () => {
    // Non-admin roles not normally allowed, but filter logic defaults to all
    const result = filterTasksForRole(tasks, 'food_lover', 'u1');
    assert.equal(result.length, 4);
  });
});

// ── 4. Priority sorting ───────────────────────────────────────────────────────
describe('sortByPriority', () => {
  const tasks = [
    { title: 'Low task', priority: 'low' },
    { title: 'Urgent task', priority: 'urgent' },
    { title: 'Medium task', priority: 'medium' },
    { title: 'High task', priority: 'high' },
  ];

  test('urgent tasks sort first', () => {
    const sorted = sortByPriority(tasks);
    assert.equal(sorted[0].priority, 'urgent');
  });

  test('low tasks sort last', () => {
    const sorted = sortByPriority(tasks);
    assert.equal(sorted[sorted.length - 1].priority, 'low');
  });

  test('order is urgent > high > medium > low', () => {
    const sorted = sortByPriority(tasks);
    assert.deepEqual(sorted.map((t) => t.priority), ['urgent', 'high', 'medium', 'low']);
  });

  test('does not mutate original array', () => {
    const original = [...tasks];
    sortByPriority(tasks);
    assert.deepEqual(tasks.map((t) => t.title), original.map((t) => t.title));
  });

  test('tasks with same priority keep relative order', () => {
    const samePriority = [
      { title: 'First', priority: 'high' },
      { title: 'Second', priority: 'high' },
    ];
    const sorted = sortByPriority(samePriority);
    assert.equal(sorted[0].title, 'First');
    assert.equal(sorted[1].title, 'Second');
  });
});

// ── 5. Task status transitions ────────────────────────────────────────────────
describe('Task status transitions', () => {
  const VALID = {
    open:        ['in_progress', 'cancelled'],
    in_progress: ['done', 'open', 'cancelled'],
    done:        ['open'], // reopen
    cancelled:   ['open'], // reopen
  };

  function canTransition(from, to) {
    return VALID[from]?.includes(to) ?? false;
  }

  test('open → in_progress is valid', () => assert.ok(canTransition('open', 'in_progress')));
  test('open → cancelled is valid', () => assert.ok(canTransition('open', 'cancelled')));
  test('in_progress → done is valid', () => assert.ok(canTransition('in_progress', 'done')));
  test('in_progress → open is valid (unstart)', () => assert.ok(canTransition('in_progress', 'open')));
  test('done → open is valid (reopen)', () => assert.ok(canTransition('done', 'open')));
  test('open → done directly is invalid (must go through in_progress)', () => {
    assert.ok(!canTransition('open', 'done'));
  });
});

// ── 6. Task stats aggregation ─────────────────────────────────────────────────
describe('Task stats aggregation', () => {
  function computeStats(tasks) {
    const now = new Date();
    return {
      open: tasks.filter((t) => t.status === 'open').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => ['open', 'in_progress'].includes(t.status) && t.dueDate && new Date(t.dueDate) < now).length,
    };
  }

  const tasks = [
    { status: 'open', dueDate: new Date(Date.now() - 1000) },       // overdue
    { status: 'open', dueDate: new Date(Date.now() + 86400000) },   // not overdue
    { status: 'in_progress', dueDate: new Date(Date.now() - 1000) }, // overdue
    { status: 'done', dueDate: new Date(Date.now() - 1000) },        // done, not overdue
    { status: 'cancelled', dueDate: null },
  ];

  test('counts open tasks correctly', () => assert.equal(computeStats(tasks).open, 2));
  test('counts in_progress correctly', () => assert.equal(computeStats(tasks).inProgress, 1));
  test('counts done correctly', () => assert.equal(computeStats(tasks).done, 1));
  test('counts overdue correctly (open + in_progress past due)', () => assert.equal(computeStats(tasks).overdue, 2));
  test('done tasks are not overdue even if past due date', () => {
    const justDone = [{ status: 'done', dueDate: new Date(Date.now() - 1000) }];
    assert.equal(computeStats(justDone).overdue, 0);
  });
  test('empty task list returns all zeros', () => {
    const stats = computeStats([]);
    assert.equal(stats.open, 0);
    assert.equal(stats.inProgress, 0);
    assert.equal(stats.done, 0);
    assert.equal(stats.overdue, 0);
  });
});
