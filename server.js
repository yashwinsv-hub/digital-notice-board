require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Validate env vars on startup ──────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

if (!GMAIL_USER || GMAIL_USER === 'your-email@gmail.com') {
    console.warn('\n⚠  WARNING: GMAIL_USER not set in .env — emails will not be sent.\n');
}

// ── Gmail transporter ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
    }
});

// ── Verify connection on startup ──────────────────────────────────
transporter.verify((err) => {
    if (err) {
        console.error('✗ Gmail connection failed:', err.message);
        console.error('  → Check GMAIL_USER and GMAIL_PASS in your .env file\n');
    } else {
        console.log('✓ Gmail connection verified. Ready to send emails.\n');
    }
});

// ── Priority colours for email ────────────────────────────────────
const PRIORITY_STYLES = {
    high:   { color: '#c0392b', bg: '#fdecea', label: 'HIGH — URGENT'        },
    medium: { color: '#b7860b', bg: '#fef9ec', label: 'MEDIUM — STANDARD'    },
    low:    { color: '#2471a3', bg: '#eaf4fb', label: 'LOW — INFORMATIONAL'   }
};

// ── Email HTML template ───────────────────────────────────────────
function buildEmailHtml(user, notice) {
    const p   = PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.medium;
    const exp = new Date(notice.expiry).toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const posted = new Date(notice.created).toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0eb;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1a2340;padding:28px 36px;border-bottom:4px solid #c9a84c;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:1.1rem;font-weight:700;color:#ffffff;letter-spacing:2px;font-family:Georgia,serif;">
                    📋 Digital Notice Board
                  </div>
                  <div style="font-size:0.65rem;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">
                    Official Communication System
                  </div>
                </td>
                <td align="right">
                  <span style="background:${p.color};color:#fff;padding:5px 12px;font-size:0.65rem;
                    font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;">
                    ${p.label}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;">

            <p style="margin:0 0 6px;font-size:0.78rem;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;">
              New Notice Posted
            </p>
            <h1 style="margin:0 0 24px;font-size:1.4rem;color:#1a2340;font-family:Georgia,serif;font-weight:normal;
              border-bottom:2px solid #f0f0eb;padding-bottom:18px;">
              ${notice.title}
            </h1>

            <p style="margin:0 0 24px;font-size:0.92rem;color:#444;line-height:1.8;">
              Dear ${user.name},
            </p>
            <p style="margin:0 0 24px;font-size:0.92rem;color:#444;line-height:1.8;">
              A new official notice has been posted on the Digital Notice Board. Please review the details below.
            </p>

            <!-- Notice content box -->
            <div style="background:${p.bg};border-left:4px solid ${p.color};padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0;font-size:0.92rem;color:#333;line-height:1.8;">${notice.content}</p>
            </div>

            <!-- Meta table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #eee;border-radius:2px;margin-bottom:28px;">
              <tr style="background:#f8f8f5;">
                <td style="padding:12px 16px;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:#888;width:40%;border-bottom:1px solid #eee;">Priority</td>
                <td style="padding:12px 16px;font-size:0.88rem;color:#333;border-bottom:1px solid #eee;">
                  <span style="color:${p.color};font-weight:700;">${notice.priority.toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:#888;border-bottom:1px solid #eee;">Posted By</td>
                <td style="padding:12px 16px;font-size:0.88rem;color:#333;border-bottom:1px solid #eee;">
                  ${notice.author}
                </td>
              </tr>
              <tr style="background:#f8f8f5;">
                <td style="padding:12px 16px;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:#888;border-bottom:1px solid #eee;">Date Posted</td>
                <td style="padding:12px 16px;font-size:0.88rem;color:#333;border-bottom:1px solid #eee;">
                  ${posted}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:#888;">Expires On</td>
                <td style="padding:12px 16px;font-size:0.88rem;color:#c0392b;font-weight:600;">
                  ${exp}
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:0.88rem;color:#666;line-height:1.7;">
              Please log in to the notice board to view the full notice and take any required action before the expiry date.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a2340;padding:20px 36px;">
            <p style="margin:0;font-size:0.72rem;color:rgba(255,255,255,0.4);letter-spacing:0.5px;text-align:center;">
              This is an automated notification from the Digital Notice Board System.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── API endpoint ──────────────────────────────────────────────────
app.post('/api/send-notification', async (req, res) => {
    try {
        const { users, notice } = req.body;

        if (!users || !users.length) {
            return res.json({ success: true, message: 'No users to notify.' });
        }

        const results = await Promise.allSettled(
            users.map(user =>
                transporter.sendMail({
                    from:    `"Digital Notice Board" <${GMAIL_USER}>`,
                    to:      user.email,
                    subject: `[Notice Board] ${notice.title} — ${notice.priority.toUpperCase()} Priority`,
                    html:    buildEmailHtml(user, notice)
                })
            )
        );

        const sent   = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected');

        failed.forEach((f, i) => {
            console.error(`✗ Failed to send to ${users[i]?.email}:`, f.reason?.message);
        });

        console.log(`✓ Emails sent: ${sent}/${users.length}`);
        res.json({ success: true, sent, total: users.length });

    } catch (error) {
        console.error('Email error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✓ Server running → http://localhost:${PORT}`);
    console.log(`  Open: http://localhost:${PORT}/login.html\n`);
});
