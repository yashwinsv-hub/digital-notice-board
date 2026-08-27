# 📢 Digital Notice Board

A full-stack web-based Digital Notice Board designed to replace traditional paper-based notice circulation with a centralized, responsive, and easy-to-manage online platform.

The system provides separate Admin and User roles, allowing administrators to create and manage notices while users can view active announcements.

## 📂 GitHub Repository

[View Source Code](https://github.com/yashwinsv-hub/digital-notice-board)

---

## 📌 Project Overview

The Digital Notice Board provides a centralized platform for publishing and accessing institutional announcements.

Administrators can create, edit, manage, prioritize, and expire notices, while registered users can securely log in and view relevant announcements.

The application also supports email notifications for newly published notices.

---

## ⚙️ Features

### 👤 User Features
- User registration and login
- Secure authentication
- View active notices
- View notices based on priority
- Receive important announcements

### 👨‍💼 Admin Features
- Admin authentication
- Create new notices
- Edit existing notices
- Delete notices
- Set notice priority
- Set notice expiry date
- Manage announcements
- Send email notifications

### 🔔 Notice Management
- Priority-based announcements
- Automatic expiry of outdated notices
- Centralized notice management
- Real-time-style updates through the web application

### 🔐 Security

- Environment variables for sensitive credentials
- Role-based access
- Authentication for protected areas
- `.env` excluded from GitHub using `.gitignore`

### 📱 Responsive Design

- Desktop-friendly interface
- Mobile-friendly interface
- Simple and accessible navigation

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure of web pages |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime environment |
| Express.js | Server-side application framework |
| MySQL | Database management |
| Nodemailer | Email notification system |
| dotenv | Environment variable management |
| Jest | Application testing |
| Nodemon | Development server |

---

## 📁 Project Structure

```text
digital-notice-board/
├── admin.html              # Admin dashboard
├── user.html               # User notice board
├── login.html              # Login page
├── signup.html             # Registration page
├── index.html              # Main application page
├── dashboard.js            # Dashboard functionality
├── portal.js               # Portal functionality
├── auth.js                 # Authentication logic
├── app.js                  # Application logic
├── server.js               # Node.js / Express server
├── styles.css              # Main styling
├── auth.css                # Authentication page styling
├── package.json            # Project dependencies
├── package-lock.json       # Dependency lock file
├── SETUP-EMAIL.md          # Email configuration guide
├── .gitignore              # Git ignored files
└── README.md               # Project documentation
```
### ⚠️ Important

Notice that there is **only one set of triple backticks around the project structure**.

Do **not** put another ` ```text ` inside a ` ```markdown ` block. That's what caused the formatting problem you showed me earlier.

---

## 🔄 Application Workflow

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
             Create & Manage   View Active
                  Notices        Notices
                    │             │
                    ▼             ▼
             Set Priority      Search / View
             & Expiry Date       Notices
                    │             │
                    └──────┬──────┘
                           ▼
                    Published Notice
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              Users View       Email
                 Notice      Notification
                    │
                    ▼
               Notice Expires
                    │
                    ▼
             Removed from Active
                  Notices
```
## 👥 User Roles

### 👨‍💼 Administrator
The administrator has full control over the notice board and can:
- Create notices
- Edit notices
- Delete notices
- Set notice priority
- Set expiry dates
- Manage announcements
- Trigger email notifications

### 👤 User
Users can:
- Register and log in
- Access the digital notice board
- View active announcements
- Identify high-priority notices
- Receive important notifications
---
## 🗄️ Database

The application uses **MySQL** to store and manage application data.

The database is responsible for storing:
- User account information
- Authentication-related data
- Notice details
- Notice priority
- Notice creation and expiry dates
- Other application records

The Node.js backend communicates with MySQL using the `mysql2` package.

## 🎯 Key Highlights

- 📢 Centralized digital platform for managing institutional notices
- 👨‍💼 Separate Admin and User roles
- 📝 Admin can create, edit, delete, and manage notices
- ⭐ Priority-based notice management
- ⏳ Automatic notice expiry based on expiry dates
- 🔍 Search functionality for quickly finding notices
- 📧 Email notifications for newly published notices
- 🔐 Environment-based configuration for sensitive credentials
- 📱 Responsive interface for desktop and mobile devices
- ☁️ Deployed using Render
- 🔗 GitHub-based version control

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yashwinsv-hub/digital-notice-board.git
cd digital-notice-board
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

> ⚠️ Never commit your `.env` file or Gmail App Password to GitHub.

### 4. Start the application

```bash
node server.js
```

### 5. Open the application

```text
http://localhost:3000
```

---

## 📧 Email Notifications

The application uses Gmail SMTP through Nodemailer to send notification emails when new notices are published.

Sensitive Gmail credentials are stored using environment variables rather than being hard-coded into the source code.

Example:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

For production deployment, these variables should be configured securely through the hosting platform.

---

## 🌐 Deployment

The application is deployed using Render.

### Deployment Flow

```text
GitHub Repository
       ↓
     Render
       ↓
Node.js + Express Server
       ↓
Public Web Application
```

### Live Application

[https://digital-notice-board-eerb.onrender.com](https://digital-notice-board-eerb.onrender.com)

---

## 🔮 Future Enhancements

- 🗄️ Integrate MongoDB for scalable and persistent data storage
- 🔐 Implement JWT-based authentication and secure password hashing
- 📊 Add an analytics dashboard for notice views and user activity
- 🔔 Introduce browser push notifications
- 📎 Support file and image attachments in notices
- 🔎 Add advanced filtering by category, priority, and date
- 👥 Implement more granular role-based permissions
- 🧪 Add automated unit and integration testing
- ⚙️ Implement CI/CD using GitHub Actions
- 📈 Add application monitoring and performance tracking

---

## 👨‍💻 Author

**Yashwin Sannidhi**

B.Tech – Computer Science Engineering  
**Artificial Intelligence & Machine Learning**

[GitHub Profile](https://github.com/yashwinsv-hub)

---

## 📄 License

This project is developed for educational and portfolio purposes.
