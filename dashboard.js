// ── Auth ─────────────────────────────────────────────────────────
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) window.location.href = 'login.html';

const isAdmin = currentUser.role === 'admin';

// ── Navbar ───────────────────────────────────────────────────────
document.getElementById('userName').textContent = currentUser.name;
const badge = document.getElementById('roleBadge');
badge.textContent = isAdmin ? 'Administrator' : 'User';
if (!isAdmin) badge.classList.add('user-role');

document.getElementById('noticeBoardLink').href = isAdmin ? 'admin.html' : 'user.html';

// ── Settings fields ───────────────────────────────────────────────
document.getElementById('settingName').value  = currentUser.name;
document.getElementById('settingEmail').value = currentUser.email;
document.getElementById('settingRole').value  = isAdmin ? 'Administrator' : 'User';

const prefs = JSON.parse(localStorage.getItem(`prefs_${currentUser.email}`) || '{}');
if (prefs.email        !== undefined) document.getElementById('toggleEmail').checked        = prefs.email;
if (prefs.highPriority !== undefined) document.getElementById('toggleHighPriority').checked = prefs.highPriority;
if (prefs.expiry       !== undefined) document.getElementById('toggleExpiry').checked        = prefs.expiry;
if (prefs.pinnedFirst  !== undefined) document.getElementById('togglePinnedFirst').checked   = prefs.pinnedFirst;
if (prefs.compact      !== undefined) document.getElementById('toggleCompact').checked        = prefs.compact;

// ── Dashboard titles ──────────────────────────────────────────────
document.getElementById('dashboardTitle').textContent    = isAdmin ? 'Administrator Dashboard' : 'User Dashboard';
document.getElementById('dashboardSubtitle').textContent = isAdmin ? 'System overview and notice statistics' : 'Your notice board overview';

// ── Helpers ───────────────────────────────────────────────────────
function getNotices()  { return JSON.parse(localStorage.getItem('notices') || '[]'); }
function getUsers()    { return JSON.parse(localStorage.getItem('users')   || '[]'); }
function isExpired(n)  { return new Date(n.expiry) < new Date(); }
function getActive()   { return getNotices().filter(n => !isExpired(n)); }

function pct(val, total) { return total > 0 ? Math.round((val / total) * 100) : 0; }

// Horizontal bar row
function barRow(label, value, total, colorClass, extra = '') {
    return `
    <div class="priority-row">
        <div class="priority-row-label"><span>${label}${extra}</span><span>${value}</span></div>
        <div class="priority-bar-bg"><div class="priority-bar ${colorClass}" style="width:${pct(value,total)}%"></div></div>
    </div>`;
}

// ── Dashboard Tab ─────────────────────────────────────────────────
function loadDashboard() {
    const active = getActive();
    const high   = active.filter(n => n.priority === 'high').length;
    const medium = active.filter(n => n.priority === 'medium').length;
    const low    = active.filter(n => n.priority === 'low').length;
    const total  = active.length;

    document.getElementById('statTotal').textContent  = total;
    document.getElementById('statHigh').textContent   = high;
    document.getElementById('statMedium').textContent = medium;
    document.getElementById('statLow').textContent    = low;

    // Recent activity
    const recent = [...active].sort((a,b) => new Date(b.created)-new Date(a.created)).slice(0,5);
    const actEl  = document.getElementById('recentActivity');
    actEl.innerHTML = recent.length === 0
        ? '<div class="empty-state" style="padding:30px 0;"><p>No recent notices</p></div>'
        : recent.map(n => `
            <div class="activity-item">
                <div class="activity-dot ${n.priority}"></div>
                <div>
                    <div class="activity-text">${n.title}</div>
                    <div class="activity-time">By ${n.author} · ${new Date(n.created).toLocaleDateString()}</div>
                </div>
            </div>`).join('');

    // Priority breakdown
    document.getElementById('priorityBreakdown').innerHTML =
        barRow('High Priority',   high,   total, 'high')   +
        barRow('Medium Priority', medium, total, 'medium') +
        barRow('Low Priority',    low,    total, 'low');
}

// ── Tab Switching ─────────────────────────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

if (window.location.hash === '#settings') switchTab('settings');

// ── Init ──────────────────────────────────────────────────────────
loadDashboard();

// ── Auth actions ──────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function showToast(message, type = 'success') {
    const t = document.createElement('div');
    t.className = `notification ${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 50);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function saveProfile() {
    const name = document.getElementById('settingName').value.trim();
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx   = users.findIndex(u => u.email === currentUser.email);
    if (idx !== -1) { users[idx].name = name; localStorage.setItem('users', JSON.stringify(users)); }
    currentUser.name = name;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('userName').textContent = name;
    showToast('Profile updated successfully.');
}

function savePreferences() {
    const p = {
        email:        document.getElementById('toggleEmail').checked,
        highPriority: document.getElementById('toggleHighPriority').checked,
        expiry:       document.getElementById('toggleExpiry').checked,
        pinnedFirst:  document.getElementById('togglePinnedFirst').checked,
        compact:      document.getElementById('toggleCompact').checked
    };
    localStorage.setItem(`prefs_${currentUser.email}`, JSON.stringify(p));
    showToast('Preferences saved.');
}

function saveDisplay() { savePreferences(); }

function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const next    = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const users   = JSON.parse(localStorage.getItem('users') || '[]');
    const user    = users.find(u => u.email === currentUser.email);
    if (!user || user.password !== current) { showToast('Current password is incorrect.', 'error'); return; }
    if (next.length < 6)                    { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (next !== confirm)                   { showToast('Passwords do not match.', 'error'); return; }
    user.password = next;
    localStorage.setItem('users', JSON.stringify(users));
    ['currentPassword','newPassword','confirmPassword'].forEach(id => document.getElementById(id).value = '');
    showToast('Password updated successfully.');
}
