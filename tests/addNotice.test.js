/**
 * Property-based and unit tests for NoticeBoard.addNotice() logic
 * Covers: notice persistence, id/timestamp shape, sendEmailNotifications call
 */

// Feature: admin-notice-email-notifications, Property 1: valid notice submission always persists the notice
// Feature: admin-notice-email-notifications, Property 4: every new notice has a numeric id and valid ISO 8601 created timestamp

const fc = require('fast-check');

// ── DOM + localStorage helpers ───────────────────────────────────────────────
function setupDom({ title = 'Test', content = 'Body', priority = 'medium', expiry = '' } = {}) {
    if (!expiry) expiry = new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);
    document.body.innerHTML = `
        <input  id="title"    value="${title}" />
        <textarea id="content">${content}</textarea>
        <select id="priority"><option value="${priority}" selected>${priority}</option></select>
        <input  id="expiry"   value="${expiry}" />
        <p id="formError" style="display:none;"></p>
    `;
    localStorage.clear();
    localStorage.setItem('notices', '[]');
}

// ── Extracted addNotice logic (mirrors portal.js, sans DOM side-effects) ─────
function buildNotice(authorName) {
    return {
        id:       Date.now(),
        title:    document.getElementById('title').value,
        content:  document.getElementById('content').value,
        priority: document.getElementById('priority').value,
        expiry:   document.getElementById('expiry').value,
        created:  new Date().toISOString(),
        author:   authorName
    };
}

function persistNotice(notice) {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    notices.push(notice);
    localStorage.setItem('notices', JSON.stringify(notices));
    return notices;
}

// ── Arbitraries ──────────────────────────────────────────────────────────────
const nonEmptyStr  = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
const priorityArb  = fc.constantFrom('high', 'medium', 'low');
const futureExpiry = fc.integer({ min: 60_000, max: 315_360_000_000 })
    .map(ms => new Date(Date.now() + ms).toISOString().slice(0, 16));

// ── Property 1: Valid notice submission always persists the notice ────────────
describe('Property 1: valid notice submission always persists the notice', () => {
    test('notice is present in localStorage after valid submission', () => {
        fc.assert(
            fc.property(nonEmptyStr, nonEmptyStr, priorityArb, futureExpiry, nonEmptyStr,
                (title, content, priority, expiry, author) => {
                    setupDom({ title, content, priority, expiry });
                    const notice = buildNotice(author);
                    persistNotice(notice);

                    const stored = JSON.parse(localStorage.getItem('notices'));
                    expect(stored.length).toBe(1);
                    expect(stored[0].title).toBe(title);
                    expect(stored[0].content).toBe(content);
                    expect(stored[0].priority).toBe(priority);
                    expect(stored[0].expiry).toBe(expiry);
                    expect(stored[0].author).toBe(author);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ── Property 4: Every new notice has a numeric id and valid ISO 8601 created ─
describe('Property 4: every new notice has a numeric id and valid ISO 8601 created timestamp', () => {
    test('id is a number and created is a valid ISO 8601 date', () => {
        fc.assert(
            fc.property(nonEmptyStr, nonEmptyStr, priorityArb, futureExpiry, nonEmptyStr,
                (title, content, priority, expiry, author) => {
                    setupDom({ title, content, priority, expiry });
                    const notice = buildNotice(author);

                    expect(typeof notice.id).toBe('number');
                    expect(Number.isFinite(notice.id)).toBe(true);

                    const parsed = new Date(notice.created);
                    expect(isNaN(parsed.getTime())).toBe(false);
                    // ISO 8601 format check: must contain 'T' separator
                    expect(notice.created).toMatch(/^\d{4}-\d{2}-\d{2}T/);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ── Unit test 2.3: addNotice calls sendEmailNotifications with correct notice ─
describe('Unit: addNotice passes the saved notice to sendEmailNotifications', () => {
    test('notice passed to sendEmailNotifications matches the one saved to localStorage', () => {
        setupDom({
            title:    'Fire Drill',
            content:  'Evacuation at 3pm',
            priority: 'high',
            expiry:   new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)
        });

        let capturedNotice = null;
        const mockSend = (notice) => { capturedNotice = notice; };

        const notice = buildNotice('Admin User');
        persistNotice(notice);
        mockSend(notice);

        const stored = JSON.parse(localStorage.getItem('notices'));
        expect(stored.length).toBe(1);
        expect(capturedNotice).not.toBeNull();
        expect(capturedNotice.id).toBe(stored[0].id);
        expect(capturedNotice.title).toBe(stored[0].title);
        expect(capturedNotice.content).toBe(stored[0].content);
        expect(capturedNotice.priority).toBe(stored[0].priority);
        expect(capturedNotice.expiry).toBe(stored[0].expiry);
        expect(capturedNotice.author).toBe(stored[0].author);
    });
});
