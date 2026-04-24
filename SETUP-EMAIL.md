# Email Notification Setup - Complete Guide

## Quick Start (Recommended Method)

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Download from [nodejs.org](https://nodejs.org/)
2. Install the LTS version
3. Verify installation: Open terminal and run `node --version`

### Step 2: Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

### Step 3: Configure Email Settings

#### For Gmail:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the 16-character password

4. Open `server.js` and update lines 11-14:
```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'youremail@gmail.com',     // Your Gmail address
        pass: 'xxxx xxxx xxxx xxxx'      // Your 16-character app password
    }
});
```

#### For Outlook/Hotmail:
```javascript
const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: 'youremail@outlook.com',
        pass: 'your-password'
    }
});
```

#### For Other Email Providers:
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.your-provider.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@domain.com',
        pass: 'your-password'
    }
});
```

### Step 4: Start the Server
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
Open http://localhost:3000/login.html in your browser
```

### Step 5: Test Email Notifications
1. Open http://localhost:3000/login.html
2. Sign up as admin
3. Post a notice
4. Check your email inbox

## Troubleshooting

### "Cannot find module 'express'"
Run: `npm install`

### "Invalid login" error
- For Gmail: Make sure you're using an App Password, not your regular password
- Enable "Less secure app access" or use App Passwords
- Check if 2-Step Verification is enabled

### Emails going to spam
- Add your email to contacts
- Check spam folder
- Use a verified email domain

### Port 3000 already in use
Change the port in `server.js`:
```javascript
const PORT = 3001; // Change to any available port
```

### CORS errors
The server already has CORS enabled. If issues persist, check browser console.

## Production Deployment

For production use:
1. Use environment variables for credentials:
```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

2. Create `.env` file:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

3. Install dotenv: `npm install dotenv`

4. Add to server.js: `require('dotenv').config();`

## Alternative: Without Backend Server

If you can't run a Node.js server, you can use:
1. EmailJS (free tier: 200 emails/month) - See `email-setup.md`
2. FormSubmit.co (free email forwarding service)
3. Web3Forms (free API for email)

## Testing Without Real Emails

For testing, you can use:
- [Mailtrap.io](https://mailtrap.io/) - Fake SMTP server for testing
- [Ethereal Email](https://ethereal.email/) - Fake SMTP service

Update `server.js` with Ethereal credentials for testing without sending real emails.
