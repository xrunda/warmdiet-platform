import assert from 'node:assert/strict';
import test from 'node:test';

test('notifies subscribers when the patient session expires', async () => {
  const sessionModule = await import('./authSession').catch(() => null);

  assert.ok(sessionModule, 'auth session notification module should exist');

  let notified = false;
  const unsubscribe = sessionModule.subscribeToAuthExpired(() => {
    notified = true;
  });

  sessionModule.notifyAuthExpired();
  unsubscribe();

  assert.equal(notified, true);
});

test('refreshes demo sessions only for the local demo patient in development', async () => {
  const sessionModule = await import('./authSession');

  assert.equal(sessionModule.shouldRefreshDemoSession('patient_test_001', true), true);
  assert.equal(sessionModule.shouldRefreshDemoSession('patient_test_001', false), false);
  assert.equal(sessionModule.shouldRefreshDemoSession('patient_real_001', true), false);
});
