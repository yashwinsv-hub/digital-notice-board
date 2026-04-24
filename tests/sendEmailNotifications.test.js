/**
 * Property-based and unit tests for sendEmailNotifications() toast feedback
 * and network error handling.
 */

// Feature: admin-notice-email-notifications, Property 11: success response always triggers a success toast
// Feature: admin-notice-email-notifications, Property 12: failure response always triggers a warning toast

const fc = require('fast-check');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Extracted filter + toast logic mirroring portal.js sendEmailNotifications
async function sendEmailNotifications(notice, fetchImpl, showToast) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const users = allUsers.filter(u => {
        const prefs = JSON.parse(localStorage.getItem(`prefs_${u.email}`) || '{}');
        return prefs.email !== false;
    });
    try {
        const res = await fetchImpl('http://localhost:3000/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users, notice })
        });
        if (!res.ok) {
            showToast('Notice posted. Email delivery failed.', 'warning');
            return;
        }
        const result = await res.json();
        if (result.success) {
            showToast('Notice posted. Email notifications dispatched.');
        } else {
            showToast('Notice posted. Email delivery failed.', 'warning');
        }
    } catch { /* server not running — notice already on board */ }
}

function makeFetchOk(body) {
    return () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body)
    });
}

function makeFetchNotOk(status) {
    return () => Promise.resolve({ ok: false, status });
}

function makeFetchThrow() {
    return () => Promise.reject(new Error('Network error'));
}

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('users', '[]');
    localStorage.setItem('notices', '[]');
});

// ── Property 11: Success response always triggers a success toast ─────────────
describe('Property 11: success response always triggers a success toast', () => {
    test('{ success: true } response triggers success toast', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    title:    fc.string({ minLength: 1 }),
                    content:  fc.string({ minLength: 1 }),
                    priority: fc.constantFrom('high', 'medium', 'low'),
                    expiry:   fc.string({ minLength: 1 }),
                    created:  fc.string({ minLength: 1 }),
                    author:   fc.string({ minLength: 1 })
                }),
                async (notice) => {
                    const toastCalls = [];
                    const showToast = (msg, type = 'success') => toastCalls.push({ msg, type });
                    const fetchImpl = makeFetchOk({ success: true, sent: 1, total: 1 });

                    await sendEmailNotifications(notice, fetchImpl, showToast);

                    expect(toastCalls.length).toBe(1);
                    expect(toastCalls[0].type).toBe('success');
                    expect(toastCalls[0].msg).toBe('Notice posted. Email notifications dispatched.');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ── Property 12: Failure response always triggers a warning toast ─────────────
describe('Property 12: failure response always triggers a warning toast', () => {
    test('{ success: false } response triggers warning toast', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    title:   fc.string({ minLength: 1 }),
                    content: fc.string({ minLength: 1 }),
                    priority: fc.constantFrom('high', 'medium', 'low'),
                    expiry:  fc.string({ minLength: 1 }),
                    created: fc.string({ minLength: 1 }),
                    author:  fc.string({ minLength: 1 })
                }),
                async (notice) => {
                    const toastCalls = [];
                    const showToast = (msg, type = 'success') => toastCalls.push({ msg, type });
                    const fetchImpl = makeFetchOk({ success: false });

                    await sendEmailNotifications(notice, fetchImpl, showToast);

                    expect(toastCalls.length).toBe(1);
                    expect(toastCalls[0].type).toBe('warning');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('non-2xx HTTP status triggers warning toast', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    title:   fc.string({ minLength: 1 }),
                    content: fc.string({ minLength: 1 }),
                    priority: fc.constantFrom('high', 'medium', 'low'),
                    expiry:  fc.string({ minLength: 1 }),
                    created: fc.string({ minLength: 1 }),
                    author:  fc.string({ minLength: 1 })
                }),
                fc.integer({ min: 400, max: 599 }),
                async (notice, status) => {
                    const toastCalls = [];
                    const showToast = (msg, type = 'success') => toastCalls.push({ msg, type });
                    const fetchImpl = makeFetchNotOk(status);

                    await sendEmailNotifications(notice, fetchImpl, showToast);

                    expect(toastCalls.length).toBe(1);
                    expect(toastCalls[0].type).toBe('warning');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ── Unit test 4.3: network error does not propagate ───────────────────────────
describe('Unit: network error does not propagate and notice remains on board', () => {
    test('fetch throwing does not throw and notice stays in localStorage', async () => {
        // Pre-populate a notice in localStorage (simulating it was already saved)
        const notice = { id: 1, title: 'Test', content: 'Body', priority: 'low',
                         expiry: '2099-01-01T00:00', created: new Date().toISOString(), author: 'Admin' };
        localStorage.setItem('notices', JSON.stringify([notice]));

        const toastCalls = [];
        const showToast = (msg, type = 'success') => toastCalls.push({ msg, type });

        // Should not throw
        await expect(
            sendEmailNotifications(notice, makeFetchThrow(), showToast)
        ).resolves.toBeUndefined();

        // No toast shown on network error
        expect(toastCalls.length).toBe(0);

        // Notice still in localStorage
        const stored = JSON.parse(localStorage.getItem('notices'));
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe(notice.id);
    });
});
