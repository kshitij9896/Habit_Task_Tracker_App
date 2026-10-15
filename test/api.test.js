const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;

describe('Habit & Task Tracker API', () => {
  before(() => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('GET /api/tasks should return list of tasks', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 3);
  });

  test('POST /api/tasks should create a new task successfully', async () => {
    const payload = {
      title: 'Practice coding for 30 minutes',
      category: 'habit'
    };

    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.title, 'Practice coding for 30 minutes');
    assert.strictEqual(data.completed, false);
    assert.strictEqual(data.category, 'habit');
    assert.ok(data.id);
  });

  test('POST /api/tasks should fail with 400 if title is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  test('PATCH /api/tasks/:id/toggle should toggle completion status', async () => {
    // Fetch current tasks
    const listRes = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await listRes.json();
    const task = tasks[0];
    const initialStatus = task.completed;

    const toggleRes = await fetch(`${baseUrl}/api/tasks/${task.id}/toggle`, {
      method: 'PATCH'
    });

    assert.strictEqual(toggleRes.status, 200);
    const updated = await toggleRes.json();
    assert.strictEqual(updated.completed, !initialStatus);
  });

  test('PATCH /api/tasks/:id/toggle should return 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/tasks/nonexistent-id-9999/toggle`, {
      method: 'PATCH'
    });

    assert.strictEqual(res.status, 404);
  });

  test('DELETE /api/tasks/:id should remove the task', async () => {
    // Create a task to delete
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Temporary task to delete' })
    });
    const created = await createRes.json();

    const deleteRes = await fetch(`${baseUrl}/api/tasks/${created.id}`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);

    // Verify it is gone
    const listRes = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await listRes.json();
    const found = tasks.find(t => t.id === created.id);
    assert.strictEqual(found, undefined);
  });

  test('DELETE /api/tasks/:id should return 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/tasks/nonexistent-id-8888`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
  });
});
