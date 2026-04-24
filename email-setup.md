# Email Notification Setup Guide

This guide will help you set up email notifications for the Digital Notice Board application using EmailJS.

## Step 1: Create EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Email Service

1. Go to the [Email Services](https://dashboard.emailjs.com/admin) page
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. Note down your **Service ID** (e.g., `service_abc123`)

## Step 3: Create Email Template

1. Go to the [Email Templates](https://dashboard.emailjs.com/admin/templates) page
2. Click "Create New Template"
3. Use this template content:

**Subject:**
```
New Notice Posted: {{notice_title}}
```

**Body:**
```
Hello {{to_name}},

A new notice has been posted on the Digital Notice Board:

Title: {{notice_title}}
Priority: {{notice_priority}}
Content: {{notice_content}}

Expires: {{notice_expiry}}
Posted by: {{posted_by}}

Please check the notice board for more details.

Best regards,
Digital Notice Board System
```

4. Save the template and note down your **Template ID** (e.g., `template_xyz789`)

## Step 4: Get Your Public Key

1. Go to [Account Settings](https://dashboard.emailjs.com/admin/account)
2. Find your **Public Key** (e.g., `abcdefghijklmnop`)

## Step 5: Update portal.js

Open `portal.js` and replace the placeholders:

```javascript
// Line 3: Replace YOUR_PUBLIC_KEY
emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your actual public key

// Line 68: Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
```

**Example:**
```javascript
emailjs.init("abcdefghijklmnop");
emailjs.send('service_abc123', 'template_xyz789', templateParams)
```

## Step 6: Test

1. Open `admin.html` in your browser
2. Post a new notice
3. Check the email inbox of all registered users
4. You should receive an email notification

## Troubleshooting

- **Emails not sending?** Check browser console for errors
- **Wrong email content?** Verify template variable names match
- **Rate limits?** Free EmailJS accounts have 200 emails/month limit
- **Spam folder?** Check spam/junk folder for test emails

## Alternative: Backend Email Service

For production use, consider implementing a backend server with:
- Node.js + Nodemailer
- Python + Flask/Django with SMTP
- PHP mail() function
- SendGrid, Mailgun, or AWS SES

This would provide better security and reliability than client-side email sending.

## Security Note

The current implementation stores user emails in localStorage and sends them via client-side code. For production:
- Use a backend server to handle email sending
- Store user data in a secure database
- Implement proper authentication and authorization
- Use environment variables for API keys
