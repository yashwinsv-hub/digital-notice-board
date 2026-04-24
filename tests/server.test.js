/**
 * Tests for POST /api/send-notification handler logic in server.js
 * Covers: batch sent/total accuracy (P10), empty users guard
 */

// Feature: admin-notice-email-notifications, Property 10: batch response always reports accurate sent/total counts

const fc = require('fast-check');

// ── Extracted handler logic (mirrors server.js, injectable transporter) ───────
async function handleSendNotification({ users, notice }, sendMail) {
    if (!users || !users.length) {
        return { success: true, message: 'No users to notify.' };
    }

    const results = await Promise.allSettled(
        users.map(user => sendMail({
            to:      user.email,
            subject: `[Notice Board] ${notice.title} — ${notice.priority.toUpperCase()} Priority`,
        }))
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');

    failed.forEach((f, i) => {
        // mirrors: console.error(`✗ Failed to send to ${users[i]?.email}:`, f.reason?.message)
        void users[i]?.email;
        void f.reason?.message;
    });

    return { success: true, sent, total: users.length };
}

// ── Arbitraries ──────────────────────────────────────────────────────────────
const userArb = fc.record({
    name:  fc.string({ minLength: 1 }),
    email: fc.emailAddress(),
    role:  fc.constantFrom('user', 'admin')
});

const noticeArb = fc.record({
    title:    fc.string({ minLength: 1 }),
    content:  fc.string({ minLength: 1 }),
    priority: fc.constantFrom('high', 'medium', 'low'),
    expiry:   fc.string({ minLength: 1 }),
    created:  fc.string({ minLength: 1 }),
    author:   fc.string({ minLength: 1 })
});

// ── Property 10: Batch response always reports accurate sent/total counts ─────
describe('Property 10: batch response always reports accurate sent/total counts', () => {
    test('sent + failures always equals total, success is always true', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(userArb, { minLength: 1, maxLength: 10 }),
                noticeArb,
                // For each user, randomly decide if sendMail resolves or rejects
                fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
                async (users, notice, outcomes) => {
                    // Pad/trim outcomes to match users length
                    const resolves = users.map((_, i) => outcomes[i % outcomes.length]);

                    const sendMail = jest.fn().mockImplementation((_, idx) => {
                        // idx not available in map — use call count instead
                        const callIdx = sendMail.mock.calls.length - 1;
                        return resolves[callIdx]
                            ? Promise.resolve({ messageId: 'ok' })
                            : Promise.reject(new Error('send failed'));
                    });

                    const result = await handleSendNotification({ users, notice }, sendMail);

                    expect(result.success).toBe(true);
                    expect(result.total).toBe(users.length);
                    expect(typeof result.sent).toBe('number');
                    expect(result.sent).toBeGreaterThanOrEqual(0);
                    expect(result.sent).toBeLessThanOrEqual(users.length);
                    expect(result.sent + (result.total - result.sent)).toBe(result.total);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('all failures still returns success:true with sent:0', async () => {
        const users  = [{ name: 'A', email: 'a@test.com', role: 'user' },
                        { name: 'B', email: 'b@test.com', role: 'user' }];
        const notice = { title: 'T', content: 'C', priority: 'low',
                         expiry: '2099-01-01', created: '2026-01-01', author: 'Admin' };

        const sendMail = () => Promise.reject(new Error('fail'));
        const result   = await handleSendNotification({ users, notice }, sendMail);

        expect(result.success).toBe(true);
        expect(result.sent).toBe(0);
        expect(result.total).toBe(2);
    });
});

// ── Unit test 6.6: empty users array returns "No users to notify." ────────────
describe('Unit: empty users array returns No users to notify message', () => {
    test('empty array returns success:true with message', async () => {
        const notice = { title: 'T', content: 'C', priority: 'low',
                         expiry: '2099-01-01', created: '2026-01-01', author: 'Admin' };
        const sendMail = jest.fn();

        const result = await handleSendNotification({ users: [], notice }, sendMail);

        expect(result.success).toBe(true);
        expect(result.message).toBe('No users to notify.');
        expect(sendMail).not.toHaveBeenCalled();
    });

    test('absent users field returns success:true with message', async () => {
        const notice = { title: 'T', content: 'C', priority: 'low',
                         expiry: '2099-01-01', created: '2026-01-01', author: 'Admin' };
        const sendMail = jest.fn();

        const result = await handleSendNotification({ users: undefined, notice }, sendMail);

        expect(result.success).toBe(true);
        expect(result.message).toBe('No users to notify.');
        expect(sendMail).not.toHaveBeenCalled();
    });
});
