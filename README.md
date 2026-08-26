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
5. **Access app**: Open https://digital-notice-board-eerb.onrender.com/login.html

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
## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database/Storage:** Local Storage
- **Authentication:** Role-based authentication
- **Deployment:** Render
- **Version Control:** Git & GitHub
## Project Structure

```text
digital-notice-board/
├── admin.html          # Admin dashboard
├── user.html           # User notice board
├── login.html          # Login page
├── signup.html         # Registration page
├── dashboard.js        # Dashboard functionality
├── portal.js           # Portal functionality
├── auth.js             # Authentication logic
├── app.js              # Application logic
├── server.js           # Node.js/Express server
├── styles.css          # Main styling
├── auth.css            # Authentication page styling
├── package.json        # Project dependencies
└── README.md           # Project documentation

##  Application Workflow

```text
                    User / Admin
                         │
                         ▼
                Registration / Login
                         │
                         ▼
                  Authentication
                         │
                         ▼
                  Role Verification
                    ┌────┴────┐
                    │         │
                  Admin      User
                    │         │
                    ▼         ▼
             Admin Dashboard  User Dashboard
                    │         │
                    ▼         ▼
             Create / Manage   View Active
                 Notices        Notices
                    │             │
                    ▼             ▼
             Set Priority     Search / View
             & Expiry Date       Notices
                    │             │
                    └──────┬──────┘
                           ▼
                  Published Notice
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              Notice Visible   Email
                to Users      Notification
                    │             │
                    └──────┬──────┘
                           ▼
                    Notice Expires
                           │
                           ▼
                  Removed from Active
                       Notices
##  Key Highlights

- 📢 Centralized digital platform for managing institutional notices
- 👨‍💼 Separate Admin and User roles with role-based access
- 📝 Admin can create, edit, delete, and manage notices
- ⭐ Priority-based notice management
- ⏳ Automatic notice expiry based on expiry dates
- 🔍 Search functionality for quickly finding notices
- 📧 Automated email notifications for newly published notices
- 🔐 Environment-based configuration for sensitive credentials
- 📱 Responsive interface for desktop and mobile devices
- ☁️ Deployed and accessible through a public URL using Render
- 🔗 GitHub-based version control and deployment workflow

##Future Enhancements

- 🗄️ Integrate MongoDB for scalable and persistent data storage
- 🔐 Implement JWT-based authentication and secure password hashing
- 📊 Add an analytics dashboard for notice views and user activity
- 🔔 Introduce browser push notifications for important announcements
- 📎 Support file and image attachments in notices
- 🔎 Add advanced filtering by category, priority, and date
- 👥 Implement more granular role-based permissions
- 📱 Develop a dedicated mobile application
- 🧪 Add automated unit and integration testing
- ⚙️ Implement CI/CD using GitHub Actions
- 📈 Add monitoring and application performance tracking

## 👨‍💻 Author

**Yashwin Sannidhi**  
B.Tech – Computer Science Engineering (Artificial Intelligence & Machine Learning)

[GitHub](https://github.com/yashwinsv-hub)
