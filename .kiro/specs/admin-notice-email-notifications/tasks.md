# Implementation Plan: Admin Notice Email Notifications

## Overview

Incremental implementation targeting two gaps in `portal.js` (form validation + email preference
filter) and minor hardening of `server.js`, followed by property-based and unit tests using
fast-check.

## Tasks

- [x] 1. Add `validateNoticeForm()` helper to `portal.js`
  - [x] 1.1 Implement `validateNoticeForm()` on the `NoticeBoard` class
    - Return `false` and display an inline validation message when `title.trim()` is empty
    - Return `false` and display an inline validation message when `content.trim()` is empty
    - Return `false` and display an inline validation message when `new Date(expiry) <= new Date()`
    - Return `true` when all three checks pass
    - _Requirements: 1.2, 1.3_

  - [x] 1.2 Write property tests for `validateNoticeForm()` (P2, P3)
    - **Property 2: Whitespace-only title or content is always rejected**
    - **Validates: Requirements 1.2**
    - **Property 3: Past expiry datetime is always rejected**
    - **Validates: Requirements 1.3**
    - `// Feature: admin-notice-email-notifications, Property 2: whitespace-only title or content is always rejected`
    - `// Feature: admin-notice-email-notifications, Property 3: past expiry datetime is always rejected`

- [x] 2. Wire `validateNoticeForm()` into `addNotice()` in `portal.js`
  - [x] 2.1 Update `addNotice()` to call `validateNoticeForm()` and abort on failure
    - Call `validateNoticeForm()` before building the notice object
    - Return early without saving or calling `sendEmailNotifications` if validation fails
    - Remove any unconditional `showToast` call from `addNotice()` (toast ownership moves to `sendEmailNotifications`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Write property tests for valid notice persistence (P1, P4)
    - **Property 1: Valid notice submission always persists the notice**
    - **Validates: Requirements 1.1, 1.5**
    - **Property 4: Every new notice has a numeric id and valid ISO 8601 created timestamp**
    - **Validates: Requirements 1.5**
    - `// Feature: admin-notice-email-notifications, Property 1: valid notice submission always persists the notice`
    - `// Feature: admin-notice-email-notifications, Property 4: every new notice has a numeric id and valid ISO 8601 created timestamp`

  - [x] 2.3 Write unit test: `addNotice()` calls `sendEmailNotifications()` with the correct notice object
    - Verify the notice passed to `sendEmailNotifications` matches the object saved to localStorage
    - _Requirements: 1.4_

- [x] 3. Update `sendEmailNotifications()` in `portal.js` to filter opted-out users
  - [x] 3.1 Add email preference filtering before the POST request
    - For each user in the `users` array, read `prefs_<email>` from localStorage
    - Exclude users whose stored preference has `email === false`
    - Treat absent key or absent `email` field as `true` (include the user)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.2 Write property test for opted-out user exclusion (P9)
    - **Property 9: Opted-out users are never included in the notification payload**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - `// Feature: admin-notice-email-notifications, Property 9: opted-out users are never included in the notification payload`

- [x] 4. Move toast feedback into `sendEmailNotifications()` response handling in `portal.js`
  - [x] 4.1 Add success and failure toast calls inside `sendEmailNotifications()`
    - On `result.success === true` → `showToast('Notice posted. Email notifications dispatched.')`
    - On `result.success === false` or non-2xx HTTP status → `showToast('Notice posted. Email delivery failed.', 'warning')`
    - Wrap the fetch in a try/catch; on network error, suppress silently (notice is already on the board)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Write property tests for toast feedback (P11, P12)
    - **Property 11: Success response always triggers a success toast**
    - **Validates: Requirements 5.1**
    - **Property 12: Failure response always triggers a warning toast**
    - **Validates: Requirements 5.2**
    - `// Feature: admin-notice-email-notifications, Property 11: success response always triggers a success toast`
    - `// Feature: admin-notice-email-notifications, Property 12: failure response always triggers a warning toast`

  - [x] 4.3 Write unit test: network error does not propagate and notice remains on board
    - Mock `fetch` to throw; assert no unhandled rejection and notice is present in localStorage
    - _Requirements: 5.3_

- [x] 5. Checkpoint — verify portal.js changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Harden `POST /api/send-notification` in `server.js`
  - [x] 6.1 Ensure empty `users` array returns `{ success: true, message: 'No users to notify.' }` without sending any emails
    - _Requirements: 2.3_

  - [x] 6.2 Ensure `Promise.allSettled` is used for concurrent email dispatch
    - _Requirements: 2.4_

  - [x] 6.3 Ensure per-failure console logging includes recipient email and error message
    - _Requirements: 7.1_

  - [x] 6.4 Ensure response format is `{ success: true, sent: <count>, total: <count> }` after all sends complete
    - _Requirements: 2.5, 7.2, 7.3_

  - [ ]* 6.5 Write property test for batch sent/total accuracy (P10)
    - **Property 10: Batch response always reports accurate sent/total counts**
    - **Validates: Requirements 2.2, 2.5, 7.2, 7.3**
    - `// Feature: admin-notice-email-notifications, Property 10: batch response always reports accurate sent/total counts`

  - [ ]* 6.6 Write unit test: empty `users` array returns the "No users to notify." message
    - _Requirements: 2.3_

- [x] 7. Verify email content and formatting in `server.js`
  - [x] 7.1 Confirm `buildEmailHtml()` includes personalised salutation, all notice fields, and priority colours — add any missing fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Write property test for email subject format (P5)
    - **Property 5: Email subject always follows the required format**
    - **Validates: Requirements 3.2**
    - `// Feature: admin-notice-email-notifications, Property 5: email subject always follows the required format`

  - [ ]* 7.3 Write property test for email addressing (P6)
    - **Property 6: Email is always addressed to the user's email field**
    - **Validates: Requirements 3.1**
    - `// Feature: admin-notice-email-notifications, Property 6: email is always addressed to the user's email field`

  - [x] 7.4 Write property test for email template content (P7)
    - **Property 7: Email template always contains all required notice fields and personalised salutation**
    - **Validates: Requirements 3.3, 3.4**
    - `// Feature: admin-notice-email-notifications, Property 7: email template always contains all required notice fields and personalised salutation`

  - [x] 7.5 Write property test for priority colours (P8)
    - **Property 8: Email template always applies the correct priority colours**
    - **Validates: Requirements 3.5**
    - `// Feature: admin-notice-email-notifications, Property 8: email template always applies the correct priority colours`

- [x] 8. Verify Gmail transporter startup behaviour in `server.js`
  - [x] 8.1 Confirm startup logs warning when `GMAIL_USER` is absent or placeholder, logs error on verify failure, and logs confirmation on success — add any missing log calls
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.2 Write unit tests for transporter startup logging
    - Test: warning logged when `GMAIL_USER` is absent
    - Test: error logged when `transporter.verify()` rejects
    - Test: confirmation logged when `transporter.verify()` resolves
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** with a minimum of 100 iterations each
- All property test files must include the `// Feature: admin-notice-email-notifications, Property N: ...` comment tag
