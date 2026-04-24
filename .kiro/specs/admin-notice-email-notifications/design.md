# Design Document

## Admin Notice Email Notifications

---

## Overview

This feature completes the end-to-end flow for admin notice creation and email delivery on the
Digital Notice Board. The infrastructure (Express server, Nodemailer Gmail transporter,
`/api/send-notification` endpoint, `sendEmailNotifications()` client method) already exists.
The design addresses two known gaps and formalises the full behaviour:

1. **Email preference filter** — `sendEmailNotifications()` currently sends all registered users
   to the server without checking `prefs_<email>` in localStorage. Users who have opted out must
   be excluded before the POST request is made.
2. **Past-expiry validation** — the notice form has no guard against an expiry datetime that is
   already in the past. This must be validated client-side before the notice is saved.

No new backend infrastructure is required. All changes are confined to `portal.js` (client logic)
and `server.js` (minor hardening), with no schema changes to localStorage.

---

## Architecture

The system follows a thin-client / lightweight-backend split:

```
┌─────────────────────────────────────────────────────────┐
│  Browser (admin.html + portal.js)                       │
│                                                         │
│  NoticeBoard                                            │
│  ├── addNotice()          ← form submit handler         │
│  │   ├── validateForm()   ← title, content, expiry      │
│  │   ├── save()           ← localStorage "notices"      │
│  │   └── sendEmailNotifications(notice)                 │
│  │       ├── filter users by prefs_<email>              │
│  │       └── POST /api/send-notification                │
│  └── showToast()          ← delivery feedback           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP POST (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js / Express  (server.js)                         │
│                                                         │
│  POST /api/send-notification                            │
│  ├── validate request body                              │
│  ├── Promise.allSettled(users.map(sendMail))            │
│  │   └── buildEmailHtml(user, notice)                   │
│  └── return { success, sent, total }                    │
└─────────────────────────────────────────────────────────┘
```

Data flow:
1. Admin submits notice form → `addNotice()` validates, saves to localStorage, calls
   `sendEmailNotifications(notice)`.
2. `sendEmailNotifications` reads all users from localStorage, filters out opted-out users,
   POSTs `{ users, notice }` to the server.
3. Server sends one email per user concurrently via `Promise.allSettled`, returns counts.
4. Client shows a success or warning toast based on the response.

---

## Components and Interfaces

### 1. `NoticeBoard.addNotice(e)` — portal.js

Responsibilities:
- Prevent default form submission.
- Call `validateNoticeForm()` before saving; abort if invalid.
- Build the notice object with `Date.now()` id and ISO 8601 `created`.
- Save to localStorage, re-render, reset form.
- Call `sendEmailNotifications(notice)`.
- Show success toast only after the email call resolves (move toast into
  `sendEmailNotifications` response handling).

Current gap: toast is shown unconditionally before the async email call resolves.
Fix: remove the `showToast` call from `addNotice` and let `sendEmailNotifications` own all
feedback.

### 2. `NoticeBoard.validateNoticeForm()` — portal.js (new helper)

```
validateNoticeForm() → boolean
```

Checks:
- `title.trim()` is non-empty.
- `content.trim()` is non-empty.
- `expiry` parses to a valid date that is strictly in the future (`new Date(expiry) > new Date()`).

Returns `true` if valid. On failure, displays an inline validation message and returns `false`.

### 3. `NoticeBoard.sendEmailNotifications(notice)` — portal.js

Current signature: `async sendEmailNotifications(notice)`

Changes:
- Read `prefs_<email>` for each user and exclude those with `{ email: false }`.
- On `result.success === true` → `showToast('Notice posted. Email notifications dispatched.')`.
- On `result.success === false` or non-2xx → `showToast('Notice posted. Email delivery failed.', 'warning')`.
- On network error (catch) → suppress silently; notice is already on the board.

### 4. `POST /api/send-notification` — server.js

Existing endpoint. No structural changes needed. Behaviour already matches requirements:
- Empty `users` array → `{ success: true, message: 'No users to notify.' }`.
- `Promise.allSettled` for concurrent delivery.
- Per-failure console logging.
- Returns `{ success: true, sent, total }`.

### 5. `buildEmailHtml(user, notice)` — server.js

Existing function. Already implements all Requirement 3 criteria:
- Personalised salutation with `user.name`.
- Subject line: `[Notice Board] <title> — <PRIORITY> Priority`.
- Priority-specific colours (red / amber / blue).
- Formatted `created` and `expiry` dates.

No changes required.

### 6. Gmail Transporter — server.js

Existing startup behaviour already satisfies Requirement 4:
- Reads `GMAIL_USER` / `GMAIL_PASS` from `process.env`.
- Warns if `GMAIL_USER` is absent or placeholder.
- Logs success/failure of `transporter.verify()`.

No changes required.

---

## Data Models

### Notice object (localStorage key: `"notices"`)

```ts
interface Notice {
  id:       number;   // Date.now() at creation time
  title:    string;   // non-empty
  content:  string;   // non-empty
  priority: 'high' | 'medium' | 'low';
  expiry:   string;   // ISO 8601 datetime, must be in the future at creation
  created:  string;   // ISO 8601 datetime, set at creation
  author:   string;   // currentUser.name
}
```

### User object (localStorage key: `"users"`)

```ts
interface User {
  name:     string;
  email:    string;
  password: string;
  role:     'admin' | 'user';
}
```

### Email preference (localStorage key: `"prefs_<email>"`)

```ts
interface Prefs {
  email?:        boolean;  // default true when absent
  highPriority?: boolean;
  expiry?:       boolean;
  pinnedFirst?:  boolean;
  compact?:      boolean;
}
```

The `email` field is the only preference relevant to this feature. Absence of the key or absence
of the `email` field within it is treated as `true` (opted in).

### API request body — `POST /api/send-notification`

```ts
interface SendNotificationRequest {
  users:  User[];    // pre-filtered by client (opted-in users only)
  notice: Notice;
}
```

### API response body

```ts
interface SendNotificationResponse {
  success: boolean;
  sent?:   number;
  total?:  number;
  message?: string;  // "No users to notify." when users array is empty
  error?:  string;   // present on 500
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a
system — essentially, a formal statement about what the system should do. Properties serve as the
bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid notice submission always persists the notice

*For any* combination of non-empty title, non-empty content, valid priority, and future expiry
datetime, submitting the notice form should result in the notice being present in localStorage
under the key `"notices"` with the submitted field values intact.

**Validates: Requirements 1.1, 1.5**

---

### Property 2: Whitespace-only title or content is always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines) used as the
title or content field, the notice form submission should be rejected and the `"notices"` array in
localStorage should remain unchanged.

**Validates: Requirements 1.2**

---

### Property 3: Past expiry datetime is always rejected

*For any* datetime value that is strictly in the past at the time of submission, the notice form
should be rejected and the `"notices"` array in localStorage should remain unchanged.

**Validates: Requirements 1.3**

---

### Property 4: Every new notice has a numeric id and valid ISO 8601 created timestamp

*For any* valid notice submission, the resulting notice object stored in localStorage should have
a numeric `id` (typeof === 'number') and a `created` field that parses to a valid, non-NaN Date
via `new Date(created)`.

**Validates: Requirements 1.5**

---

### Property 5: Email subject always follows the required format

*For any* notice object, the subject line produced by the server should equal
`[Notice Board] <notice.title> — <notice.priority.toUpperCase()> Priority` exactly.

**Validates: Requirements 3.2**

---

### Property 6: Email is always addressed to the user's email field

*For any* user object in the recipients array, the `to` field of the outgoing email should equal
`user.email`.

**Validates: Requirements 3.1**

---

### Property 7: Email template always contains all required notice fields and personalised salutation

*For any* user and notice, the HTML string produced by `buildEmailHtml(user, notice)` should
contain the user's `name`, the notice `title`, `content`, `priority` label, `author`, a formatted
`created` date string, and a formatted `expiry` date string.

**Validates: Requirements 3.3, 3.4**

---

### Property 8: Email template always applies the correct priority colours

*For any* notice with priority `"high"`, `"medium"`, or `"low"`, the HTML produced by
`buildEmailHtml` should contain the corresponding accent colour (`#c0392b`, `#b7860b`, or
`#2471a3` respectively) and background colour (`#fdecea`, `#fef9ec`, or `#eaf4fb` respectively).

**Validates: Requirements 3.5**

---

### Property 9: Opted-out users are never included in the notification payload

*For any* list of users where some have `prefs_<email>` set to `{ email: false }` and others have
`{ email: true }` or no preference stored, the `users` array sent in the POST request to
`/api/send-notification` should contain only users whose effective email preference is `true`
(including those with no stored preference).

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 10: Batch response always reports accurate sent/total counts

*For any* batch of N users (including batches with partial or total sendMail failures), the
server response should always have `success: true`, `total` equal to N, and `sent` equal to the
number of fulfilled promises — so that `sent + (N - sent)` always equals `total`.

**Validates: Requirements 2.2, 2.5, 7.2, 7.3**

---

### Property 11: Success response always triggers a success toast

*For any* server response where `success === true` and the HTTP status is 2xx, the client should
display a toast notification with the message `"Notice posted. Email notifications dispatched."`.

**Validates: Requirements 5.1**

---

### Property 12: Failure response always triggers a warning toast

*For any* server response where `success === false` or the HTTP status is non-2xx, the client
should display a toast notification of type `"warning"`.

**Validates: Requirements 5.2**

---

## Error Handling

### Client-side (portal.js)

| Scenario | Handling |
|---|---|
| Empty / whitespace title or content | `validateNoticeForm()` returns false; inline error shown; form not submitted |
| Past expiry datetime | `validateNoticeForm()` returns false; inline error shown; form not submitted |
| Server returns `{ success: false }` | Warning toast: "Notice posted. Email delivery failed." |
| Server returns non-2xx HTTP status | Warning toast: "Notice posted. Email delivery failed." |
| `fetch` throws (server not running) | Caught silently; notice already saved and rendered |

### Server-side (server.js)

| Scenario | Handling |
|---|---|
| `users` array absent or empty | Returns `{ success: true, message: 'No users to notify.' }` immediately |
| Individual `sendMail` rejects | Logged to console with recipient email and error message; other sends continue |
| All `sendMail` calls reject | Returns `{ success: true, sent: 0, total: N }`; each failure logged |
| Unhandled exception in handler | Returns HTTP 500 `{ success: false, error: message }` |
| `GMAIL_USER` absent / placeholder at startup | Console warning; server continues |
| `transporter.verify()` fails at startup | Console error with reason; server continues |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests cover specific examples, integration points, and edge cases.
- Property-based tests verify universal correctness across randomised inputs.

### Property-Based Testing

Library: **fast-check** (JavaScript/Node.js)

Each property-based test must run a minimum of **100 iterations**.

Each test must be tagged with a comment in the format:
`// Feature: admin-notice-email-notifications, Property <N>: <property_text>`

| Property | Test description |
|---|---|
| P1 | Generate random valid notice inputs → verify localStorage contains the notice |
| P2 | Generate whitespace-only strings for title/content → verify rejection and no localStorage change |
| P3 | Generate past Date values → verify rejection and no localStorage change |
| P4 | Generate valid notice inputs → verify `id` is numeric and `created` is valid ISO 8601 |
| P5 | Generate random notice objects → verify subject string format |
| P6 | Generate random user objects → verify `to` field equals `user.email` |
| P7 | Generate random users and notices → verify HTML contains all required fields |
| P8 | Generate notices for each priority → verify correct colour codes in HTML |
| P9 | Generate user lists with mixed preferences → verify opted-out users absent from payload |
| P10 | Generate user arrays with random failure patterns → verify `sent + failures === total` and `success === true` |
| P11 | Generate success responses → verify success toast is shown |
| P12 | Generate failure responses (success:false or non-2xx) → verify warning toast is shown |

### Unit Tests

Unit tests should focus on:
- **Integration**: `addNotice()` calls `sendEmailNotifications()` with the correct notice object (Req 1.4).
- **Edge cases**: Empty `users` array returns the "No users to notify." message (Req 2.3).
- **Startup behaviour**: Warning logged when `GMAIL_USER` is absent (Req 4.2); error logged when `transporter.verify()` fails (Req 4.3); confirmation logged on success (Req 4.4).
- **Network error**: `fetch` throwing does not propagate and notice remains on board (Req 5.3).

Avoid duplicating coverage already provided by property tests.
