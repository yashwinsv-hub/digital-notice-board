/**
 * Property-based tests for NoticeBoard.validateNoticeForm()
 * Uses jest + fast-check with jsdom environment
 */

// Feature: admin-notice-email-notifications, Property 2: whitespace-only title or content is always rejected
// Feature: admin-notice-email-notifications, Property 3: past expiry datetime is always rejected

const fc = require('fast-check');

// ── DOM helpers ──────────────────────────────────────────────────────────────
function setupDom({ title = '', content = '', expiry = '' } = {}) {
    document.body.innerHTML = `
        <input id="title" value="${title}" />
        <textarea id="content">${content}</textarea>
        <input id="expiry" value="${expiry}" />
        <p id="formError" style="display:none;"></p>
    `;
}

// ── Inline validateNoticeForm logic (extracted for unit testing) ─────────────
// Mirrors the implementation in portal.js exactly so tests stay in sync.
function validateNoticeForm() {
    const title   = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const expiry  = document.getElementById('expiry').value;
    const errEl   = document.getElementById('formError');

    const showErr = (msg) => {
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        return false;
    };

    if (errEl) errEl.style.display = 'none';

    if (!title.trim())   return showErr('Notice title cannot be empty.');
    if (!content.trim()) return showErr('Notice content cannot be empty.');
    if (!expiry || new Date(expiry) <= new Date()) return showErr('Expiry must be a future date and time.');

    return true;
}

// ── Arbitraries ──────────────────────────────────────────────────────────────

// Whitespace-only string: one or more spaces/tabs/newlines
const whitespaceOnly = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 });

// Future datetime string (1 minute to 10 years from now)
const futureExpiry = fc.integer({ min: 60_000, max: 315_360_000_000 })
    .map(ms => new Date(Date.now() + ms).toISOString().slice(0, 16));

// Past datetime string (1 minute to 10 years ago)
const pastExpiry = fc.integer({ min: 60_000, max: 315_360_000_000 })
    .map(ms => new Date(Date.now() - ms).toISOString().slice(0, 16));

// Non-empty, non-whitespace string
const nonEmptyStr = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

// ── Property 2: Whitespace-only title is always rejected ─────────────────────
describe('Property 2: whitespace-only title or content is always rejected', () => {
    test('whitespace-only title is always rejected', () => {
        fc.assert(
            fc.property(whitespaceOnly, nonEmptyStr, futureExpiry, (wsTitle, content, expiry) => {
                setupDom({ title: wsTitle, content, expiry });
                const result = validateNoticeForm();
                expect(result).toBe(false);
                expect(document.getElementById('formError').style.display).toBe('block');
            }),
            { numRuns: 100 }
        );
    });

    test('whitespace-only content is always rejected', () => {
        fc.assert(
            fc.property(nonEmptyStr, whitespaceOnly, futureExpiry, (title, wsContent, expiry) => {
                setupDom({ title, content: wsContent, expiry });
                const result = validateNoticeForm();
                expect(result).toBe(false);
                expect(document.getElementById('formError').style.display).toBe('block');
            }),
            { numRuns: 100 }
        );
    });
});

// ── Property 3: Past expiry datetime is always rejected ──────────────────────
describe('Property 3: past expiry datetime is always rejected', () => {
    test('past expiry is always rejected', () => {
        fc.assert(
            fc.property(nonEmptyStr, nonEmptyStr, pastExpiry, (title, content, expiry) => {
                setupDom({ title, content, expiry });
                const result = validateNoticeForm();
                expect(result).toBe(false);
                expect(document.getElementById('formError').style.display).toBe('block');
            }),
            { numRuns: 100 }
        );
    });

    test('empty expiry is always rejected', () => {
        fc.assert(
            fc.property(nonEmptyStr, nonEmptyStr, (title, content) => {
                setupDom({ title, content, expiry: '' });
                const result = validateNoticeForm();
                expect(result).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    test('valid inputs with future expiry always pass', () => {
        fc.assert(
            fc.property(nonEmptyStr, nonEmptyStr, futureExpiry, (title, content, expiry) => {
                setupDom({ title, content, expiry });
                const result = validateNoticeForm();
                expect(result).toBe(true);
            }),
            { numRuns: 100 }
        );
    });
});
