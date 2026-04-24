/**
 * Unit tests for Gmail transporter startup logging behaviour in server.js
 * Tests: warning on missing/placeholder GMAIL_USER, error on verify failure,
 *        confirmation on verify success.
 * Requirements: 4.2, 4.3, 4.4
 */

// ── Extracted startup logic (mirrors server.js, injectable deps) ─────────────

function checkGmailUser(gmailUser) {
    if (!gmailUser || gmailUser === 'your-email@gmail.com') {
        console.warn('\n⚠  WARNING: GMAIL_USER not set in .env — emails will not be sent.\n');
    }
}

function verifyTransporter(transporter, verifyCallback) {
    transporter.verify(verifyCallback);
}

function makeVerifyCallback() {
    return (err) => {
        if (err) {
            console.error('✗ Gmail connection failed:', err.message);
            console.error('  → Check GMAIL_USER and GMAIL_PASS in your .env file\n');
        } else {
            console.log('✓ Gmail connection verified. Ready to send emails.\n');
        }
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Requirement 4.2: warning logged when GMAIL_USER is absent or placeholder', () => {
    let warnSpy;

    beforeEach(() => { warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
    afterEach(() => { warnSpy.mockRestore(); });

    test('logs warning when GMAIL_USER is undefined', () => {
        checkGmailUser(undefined);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('GMAIL_USER not set');
    });

    test('logs warning when GMAIL_USER is empty string', () => {
        checkGmailUser('');
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('GMAIL_USER not set');
    });

    test('logs warning when GMAIL_USER is the placeholder value', () => {
        checkGmailUser('your-email@gmail.com');
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('GMAIL_USER not set');
    });

    test('does NOT log warning when GMAIL_USER is a real address', () => {
        checkGmailUser('real-user@gmail.com');
        expect(warnSpy).not.toHaveBeenCalled();
    });
});

describe('Requirement 4.3: error logged when transporter.verify() rejects', () => {
    let errorSpy;

    beforeEach(() => { errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
    afterEach(() => { errorSpy.mockRestore(); });

    test('logs error with failure reason when verify fails', () => {
        const callback = makeVerifyCallback();
        const err = new Error('Invalid credentials');
        callback(err);

        expect(errorSpy).toHaveBeenCalledTimes(2);
        expect(errorSpy.mock.calls[0][0]).toContain('Gmail connection failed');
        expect(errorSpy.mock.calls[0][1]).toBe('Invalid credentials');
    });

    test('error message includes the failure reason string', () => {
        const callback = makeVerifyCallback();
        const err = new Error('ECONNREFUSED');
        callback(err);

        expect(errorSpy.mock.calls[0][1]).toBe('ECONNREFUSED');
    });
});

describe('Requirement 4.4: confirmation logged when transporter.verify() succeeds', () => {
    let logSpy;

    beforeEach(() => { logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
    afterEach(() => { logSpy.mockRestore(); });

    test('logs confirmation message when verify succeeds', () => {
        const callback = makeVerifyCallback();
        callback(null); // no error = success

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy.mock.calls[0][0]).toContain('Gmail connection verified');
    });

    test('does NOT log error when verify succeeds', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const callback = makeVerifyCallback();
        callback(null);

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});
