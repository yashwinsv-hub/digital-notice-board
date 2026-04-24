# Requirements Document

## Introduction

This feature enables administrators to post notices on the Digital Notice Board and automatically
deliver those notices to all registered users via Gmail email notifications. The system already
has a working Node.js backend (server.js) with Nodemailer and a Gmail transporter, a
`/api/send-notification` endpoint, and a client-side `sendEmailNotifications()` method in
portal.js. User accounts (including email addresses) are stored in localStorage.

This requirements document formalises the end-to-end behaviour: from an admin composing and
posting a notice, through email dispatch, to delivery confirmation and error handling.

---

## Glossary

- **Admin**: A registered user whose `role` field equals `"admin"`, with access to admin.html.
- **User**: A registered user whose `role` field equals `"user"`, with access to user.html.
- **Notice**: An object containing `id`, `title`, `content`, `priority`, `expiry`, `created`, and `author` fields, persisted in localStorage under the key `"notices"`.
- **Notice_Board**: The client-side `NoticeBoard` class in portal.js responsible for creating, displaying, and deleting notices.
- **Email_Service**: The Node.js Express server (server.js) that accepts POST requests at `/api/send-notification` and sends emails via Nodemailer using the configured Gmail transporter.
- **Transporter**: The Nodemailer Gmail transporter configured with `GMAIL_USER` and `GMAIL_PASS` from the `.env` file.
- **Registered_Users**: All user objects stored in localStorage under the key `"users"`.
- **Email_Template**: The HTML email body built by the `buildEmailHtml()` function in server.js.
- **Priority**: One of three string values — `"high"`, `"medium"`, or `"low"` — assigned to a notice by the Admin.
- **Expiry**: A datetime string representing when a notice becomes inactive.

---

## Requirements

### Requirement 1: Admin Notice Creation

**User Story:** As an Admin, I want to post a notice with a title, content, priority, and expiry date, so that all registered users are informed of important announcements.

#### Acceptance Criteria

1. WHEN an Admin submits the notice form with a non-empty title, non-empty content, a priority value of `"high"`, `"medium"`, or `"low"`, and a valid future Expiry datetime, THE Notice_Board SHALL save the notice to localStorage and render it on the board.
2. IF the Admin submits the notice form with an empty title or empty content, THEN THE Notice_Board SHALL prevent form submission and display a validation error to the Admin.
3. IF the Admin submits the notice form with an Expiry datetime that is in the past, THEN THE Notice_Board SHALL prevent form submission and display a validation error to the Admin.
4. WHEN a notice is saved successfully, THE Notice_Board SHALL immediately call `sendEmailNotifications` with the new notice object.
5. THE Notice_Board SHALL assign a unique numeric `id` (using `Date.now()`) and an ISO 8601 `created` timestamp to every new notice.

---

### Requirement 2: Email Dispatch to All Registered Users

**User Story:** As an Admin, I want every registered user to receive an email when I post a notice, so that no user misses an important announcement.

#### Acceptance Criteria

1. WHEN `sendEmailNotifications` is called with a notice, THE Notice_Board SHALL retrieve all user objects from localStorage and send them to the Email_Service via a POST request to `/api/send-notification`.
2. THE Email_Service SHALL send one email per entry in the `users` array received in the request body.
3. WHEN the `users` array in the request body is empty, THE Email_Service SHALL return a JSON response `{ "success": true, "message": "No users to notify." }` without attempting to send any emails.
4. THE Email_Service SHALL send all emails concurrently using `Promise.allSettled`, so that a failure for one recipient does not block delivery to other recipients.
5. WHEN all emails have been processed, THE Email_Service SHALL return a JSON response containing `{ "success": true, "sent": <count>, "total": <count> }`.

---

### Requirement 3: Email Content and Formatting

**User Story:** As a User, I want to receive a well-formatted email that clearly shows the notice title, content, priority, author, posted date, and expiry date, so that I can quickly understand the notice without logging in.

#### Acceptance Criteria

1. THE Email_Service SHALL address each email to the `email` field of the corresponding user object.
2. THE Email_Service SHALL set the email subject to `[Notice Board] <notice.title> — <PRIORITY> Priority`, where `<PRIORITY>` is the uppercase value of `notice.priority`.
3. THE Email_Template SHALL include the recipient's `name` in a personalised salutation.
4. THE Email_Template SHALL display the notice `title`, `content`, `priority` label, `author`, formatted `created` date, and formatted `expiry` date.
5. THE Email_Template SHALL apply a priority-specific background colour and accent colour: red (`#c0392b`) for `"high"`, amber (`#b7860b`) for `"medium"`, and blue (`#2471a3`) for `"low"`.
6. THE Email_Template SHALL render valid HTML that displays correctly in Gmail's web client.

---

### Requirement 4: Gmail Transporter Configuration

**User Story:** As a developer, I want the email sending credentials to be loaded from environment variables, so that secrets are never hard-coded in source files.

#### Acceptance Criteria

1. THE Email_Service SHALL read `GMAIL_USER` and `GMAIL_PASS` exclusively from the `.env` file via `process.env`.
2. WHEN `GMAIL_USER` is absent or equals the placeholder value `"your-email@gmail.com"` at startup, THE Email_Service SHALL log a warning message to the console and continue running.
3. WHEN the Transporter fails to verify the Gmail connection at startup, THE Email_Service SHALL log an error message that includes the failure reason and continue running without crashing.
4. WHEN the Transporter successfully verifies the Gmail connection at startup, THE Email_Service SHALL log a confirmation message to the console.

---

### Requirement 5: Delivery Feedback to Admin

**User Story:** As an Admin, I want to see confirmation or failure feedback after posting a notice, so that I know whether email notifications were dispatched successfully.

#### Acceptance Criteria

1. WHEN the Email_Service responds with `{ "success": true }`, THE Notice_Board SHALL display a toast notification with the message `"Notice posted. Email notifications dispatched."`.
2. WHEN the Email_Service responds with `{ "success": false }` or returns a non-2xx HTTP status, THE Notice_Board SHALL display a warning toast notification indicating that email delivery failed.
3. WHEN the fetch call to `/api/send-notification` throws a network error (e.g., the server is not running), THE Notice_Board SHALL silently suppress the error and still display the notice on the board.

---

### Requirement 6: Per-User Email Preference

**User Story:** As a User, I want to opt out of email notifications, so that I do not receive emails for notices I am not interested in.

#### Acceptance Criteria

1. WHEN a User sets the email notification preference to `false` in dashboard settings, THE Notice_Board SHALL persist the preference under the key `prefs_<email>` in localStorage with `{ "email": false }`.
2. WHEN `sendEmailNotifications` is called, THE Notice_Board SHALL exclude any user whose stored preference has `email` set to `false` from the `users` array sent to the Email_Service.
3. WHERE a user has no stored preference for email notifications, THE Notice_Board SHALL treat the preference as `true` and include that user in the notification list.

---

### Requirement 7: Error Handling for Individual Email Failures

**User Story:** As a developer, I want individual email send failures to be logged without stopping delivery to other users, so that a single bad address does not break the entire notification batch.

#### Acceptance Criteria

1. WHEN sending an email to a specific recipient fails, THE Email_Service SHALL log the recipient's email address and the error message to the console.
2. WHEN one or more emails fail, THE Email_Service SHALL still return `{ "success": true, "sent": <successful_count>, "total": <total_count> }` so the Admin receives accurate delivery statistics.
3. IF all emails in a batch fail, THEN THE Email_Service SHALL return `{ "success": true, "sent": 0, "total": <total_count> }` and log each failure individually.
