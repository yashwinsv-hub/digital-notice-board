# Digital Notice Board

A web application for managing notices with automatic expiry, priority management, and role-based access control.

## Features

- User authentication (Login/Signup)
- Role-based access control (Admin & User)
- Admin Portal: Post and manage notices
- User Portal: Read-only access to notices
- Automatic expiry checking (removes expired notices)
- Priority-based sorting (High → Medium → Low)
- Local storage persistence
- Responsive design
- Color-coded priority system

## Setup

### Email Notifications Setup
To enable email notifications when admins post notices:

1. **Install Node.js** from [nodejs.org](https://nodejs.org/)
2. **Install dependencies**: Run `npm install` in the project folder
3. **Configure email**: Open `server.js` and update email credentials (see `SETUP-EMAIL.md` for detailed instructions)
4. **Start server**: Run `npm start`
5. **Access app**: Open http://localhost:3000/login.html

For detailed setup instructions, see `SETUP-EMAIL.md`

### Usage

1. Open `index.html` (or `login.html`) in a web browser
2. Create an account by clicking "Sign Up"
3. Choose your role:
   - Admin: Can post and delete notices
   - User: Can only view notices
4. Login with your credentials
5. Access your portal based on your role
6. When admin posts a notice, all users receive email notifications

## Portals

### Admin Portal
- Post new notices with title, content, priority, and expiry
- View all active notices
- Delete notices
- Full read/write access

### User Portal
- View all active notices
- Read-only access
- Cannot post or delete notices

## Priority Levels

- **High**: Red - Urgent notices
- **Medium**: Orange - Standard notices
- **Low**: Blue - Informational notices

## Technical Details

- Pure HTML, CSS, and JavaScript
- No dependencies required
- Data stored in browser's localStorage
- Expiry check runs every minute
