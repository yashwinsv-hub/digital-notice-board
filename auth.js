class Auth {
    constructor() {
        this.page = window.location.pathname.split('/').pop();
        this.init();
    }

    init() {
        if (this.page === 'login.html') {
            document.getElementById('loginForm').addEventListener('submit',   (e) => this.login(e));
            document.getElementById('forgotForm').addEventListener('submit',  (e) => this.findAccount(e));
            document.getElementById('newpassForm').addEventListener('submit', (e) => this.resetPassword(e));
        } else if (this.page === 'signup.html') {
            document.getElementById('signupForm').addEventListener('submit', (e) => this.signup(e));
        }
    }

    showMessage(id, text, type) {
        const el = document.getElementById(id);
        el.textContent = text;
        el.className = `message ${type}`;
        el.style.display = 'block';
    }

    signup(e) {
        e.preventDefault();
        const name     = document.getElementById('name').value.trim();
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role       = document.getElementById('role').value;
        const department = document.getElementById('department').value;
        const year       = document.getElementById('year').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showMessage('message', 'An account with this email already exists.', 'error');
            return;
        }

        users.push({ name, email, password, role, department, year });
        localStorage.setItem('users', JSON.stringify(users));
        this.showMessage('message', 'Account created successfully. Redirecting to login...', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    }

    login(e) {
        e.preventDefault();
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user  = users.find(u => u.email === email && u.password === password);

        if (!user) {
            this.showMessage('message', 'Invalid email address or password. Please try again.', 'error');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showMessage('message', 'Authentication successful. Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
        }, 1000);
    }

    findAccount(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value.trim();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user  = users.find(u => u.email === email);

        if (!user) {
            this.showMessage('forgot-message', 'No account found with this email address.', 'error');
            return;
        }

        // Store email temporarily for the next step
        sessionStorage.setItem('resetEmail', email);
        document.getElementById('resetUserDisplay').value = `${user.name} (${user.email})`;
        showNewPass();
    }

    resetPassword(e) {
        e.preventDefault();
        const newPass     = document.getElementById('newPass').value;
        const confirmPass = document.getElementById('confirmPass').value;

        if (newPass.length < 6) {
            this.showMessage('newpass-message', 'Password must be at least 6 characters.', 'error');
            return;
        }
        if (newPass !== confirmPass) {
            this.showMessage('newpass-message', 'Passwords do not match.', 'error');
            return;
        }

        const email = sessionStorage.getItem('resetEmail');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx   = users.findIndex(u => u.email === email);

        if (idx === -1) {
            this.showMessage('newpass-message', 'Session expired. Please try again.', 'error');
            return;
        }

        users[idx].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        sessionStorage.removeItem('resetEmail');

        this.showMessage('newpass-message', 'Password updated successfully. Redirecting to login...', 'success');
        setTimeout(() => showLogin(), 2000);
    }
}

// Panel switchers
function showLogin() {
    document.getElementById('panel-login').style.display  = '';
    document.getElementById('panel-forgot').style.display = 'none';
    document.getElementById('panel-newpass').style.display = 'none';
    document.getElementById('message').style.display = 'none';
}

function showForgot() {
    document.getElementById('panel-login').style.display  = 'none';
    document.getElementById('panel-forgot').style.display = '';
    document.getElementById('panel-newpass').style.display = 'none';
    document.getElementById('forgot-message').style.display = 'none';
    document.getElementById('resetEmail').value = '';
}

function showNewPass() {
    document.getElementById('panel-login').style.display   = 'none';
    document.getElementById('panel-forgot').style.display  = 'none';
    document.getElementById('panel-newpass').style.display = '';
    document.getElementById('newpass-message').style.display = 'none';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
}

new Auth();
