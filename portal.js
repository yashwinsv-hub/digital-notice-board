// ── Theme Manager ──────────────────────────────────────
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.btn = document.getElementById('themeToggle');
        if (this.btn) this.btn.addEventListener('click', () => this.toggle());
        this.applyTheme();
        
        // Cross-tab sync for theme
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                this.theme = e.newValue || 'light';
                this.applyTheme();
            }
        });
    }
    applyTheme() {
        if (this.theme === 'dark') document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }
    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }
}
const themeManager = new ThemeManager();

// ── Auth ──────────────────────────────────────────────
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'login.html'; return null; }

    const page = window.location.pathname.split('/').pop();
    if (page === 'admin.html' && currentUser.role !== 'admin') {
        window.location.href = 'user.html'; return null;
    }

    document.getElementById('userName').textContent = currentUser.name;
    return currentUser;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ── Calendar ──────────────────────────────────────────
class Calendar {
    constructor() {
        this.today  = new Date();
        this.cursor = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
        this.render();

        // Close modal on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    prev() { this.cursor.setMonth(this.cursor.getMonth() - 1); this.render(); }
    next() { this.cursor.setMonth(this.cursor.getMonth() + 1); this.render(); }

    getNoticesByDate() {
        const notices = JSON.parse(localStorage.getItem('notices') || '[]');
        const map = {};
        notices.forEach(n => {
            // Use Publish Date or fallback to created
            const d = new Date(n.publishDate || n.created);
            if (d.getFullYear() === this.cursor.getFullYear() &&
                d.getMonth()    === this.cursor.getMonth()) {
                const day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(n);
            }
        });
        return map;
    }

    render() {
        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        const dayNames   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

        const year  = this.cursor.getFullYear();
        const month = this.cursor.getMonth();
        const noticesByDate = this.getNoticesByDate();

        document.getElementById('calMonthYear').textContent = `${monthNames[month]} ${year}`;

        const firstDay  = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

        for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === this.today.getDate() &&
                            month === this.today.getMonth() &&
                            year  === this.today.getFullYear();
            
            const notices = noticesByDate[d] || [];
            const priorities = { high: 0, medium: 0, low: 0 };
            notices.forEach(n => priorities[n.priority]++);

            const dotsHtml = Object.entries(priorities)
                .filter(([_, count]) => count > 0)
                .map(([p, _]) => `<span class="cal-dot ${p}"></span>`)
                .join('');

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const cls = ['cal-day', isToday ? 'today' : ''].filter(Boolean).join(' ');
            
            html += `
                <div class="${cls}" onclick="calendar.handleDateClick(${d})" title="${notices.length} notices">
                    ${d}
                    <div class="cal-dots-container">${dotsHtml}</div>
                </div>`;
        }

        document.getElementById('calGrid').innerHTML = html;
    }

    handleDateClick(day) {
        const year = this.cursor.getFullYear();
        const month = this.cursor.getMonth();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const notices = (this.getNoticesByDate()[day] || []).sort((a, b) => {
            const p = { high: 1, medium: 2, low: 3 };
            return p[a.priority] - p[b.priority];
        });

        this.openModal(dateStr, notices);
    }

    openModal(dateStr, notices) {
        const modal = document.getElementById('noticeModal');
        const title = document.getElementById('modalDateTitle');
        const content = document.getElementById('modalContent');
        const footer = document.getElementById('modalFooter');
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const isAdmin = user && user.role === 'admin';

        const displayDate = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        title.textContent = `Notices for ${displayDate}`;
        
        if (notices.length === 0) {
            content.innerHTML = `
                <div class="empty-state" style="padding:20px 0;">
                    <div class="empty-icon" style="font-size:2rem;">📅</div>
                    <p>No notices scheduled for this date</p>
                </div>`;
        } else {
            content.innerHTML = notices.map(n => `
                <div class="modal-notice-item">
                    <div class="modal-notice-title">${n.title}</div>
                    <div class="notice-meta" style="margin-bottom:10px;">
                        <span class="priority-badge ${n.priority}">${n.priority}</span>
                        ${n.target && n.target !== 'all' ? `<span class="target-badge">🎯 ${n.target.toUpperCase()}</span>` : ''}
                    </div>
                    <div class="modal-notice-desc">${n.content}</div>
                    <div class="notice-meta" style="font-size:0.75rem; color:#888;">
                        <span>📅 Publish: ${new Date(n.publishDate || n.created).toLocaleString()}</span><br>
                        <span>⌛ Expiry: ${new Date(n.expiry).toLocaleString()}</span>
                    </div>
                    ${isAdmin ? `
                        <div style="margin-top:12px; display:flex; gap:8px;">
                            <button class="btn-edit" onclick="noticeBoard.editNotice(${n.id}); calendar.closeModal()">Edit</button>
                            <button class="delete-btn" onclick="noticeBoard.deleteNotice(${n.id}); calendar.closeModal()">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        // Footer buttons
        let footerHtml = '';
        if (isAdmin) {
            footerHtml += `<button class="btn-save" onclick="calendar.addNoticeForDate('${dateStr}')">+ Add Notice</button>`;
        }
        footerHtml += `<button class="btn-save" style="background:#888;" onclick="calendar.closeModal()">Close</button>`;
        footer.innerHTML = footerHtml;

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('noticeModal');
        if (modal) modal.classList.remove('active');
    }

    addNoticeForDate(dateStr) {
        this.closeModal();
        // Switch to Notices tab if needed (assuming we are already in Admin panel if we see this button)
        if (typeof adminSwitchTab === 'function') adminSwitchTab('notices');
        
        // Pre-fill the form
        const publishInput = document.getElementById('publishDate');
        if (publishInput) {
            // Set time to current time or start of day
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            publishInput.value = `${dateStr}T${timeStr}`;
        }
        
        // Scroll to form
        const form = document.getElementById('noticeForm');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }
}

// ── Users List (Admin only) ───────────────────────────
function renderUsersList() {
    const el = document.getElementById('usersList');
    if (!el) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('userCount').textContent = users.length;

    if (users.length === 0) {
        el.innerHTML = '<div class="empty-state" style="padding:20px 0;"><p>No registered users</p></div>';
        return;
    }

    el.innerHTML = users.map(u => {
        const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const isAdmin  = u.role === 'admin';
        return `
        <div class="user-item">
            <div class="user-avatar ${isAdmin ? 'admin-avatar' : ''}">${initials}</div>
            <div class="user-details">
                <div class="u-name">${u.name}</div>
                <div class="u-email">${u.email}</div>
            </div>
            <span class="user-role-tag ${u.role}">${isAdmin ? 'Admin' : 'User'}</span>
        </div>`;
    }).join('');
}

// ── Notice Board ──────────────────────────────────────
class NoticeBoard {
    constructor() {
        this.currentUser = checkAuth();
        if (!this.currentUser) return;

        this.notices = JSON.parse(localStorage.getItem('notices') || '[]');
        this.pinned  = JSON.parse(localStorage.getItem(`pinned_${this.currentUser.email}`) || '[]');
        this.board   = document.getElementById('noticeBoard');
        this.form    = document.getElementById('noticeForm');
        this.prefs   = JSON.parse(localStorage.getItem(`prefs_${this.currentUser.email}`) || '{}');

        this.init();
    }

    init() {
        if (this.form) this.form.addEventListener('submit', (e) => this.addNotice(e));
        window.addEventListener('storage', (e) => {
            if (e.key === 'notices') {
                this.notices = JSON.parse(e.newValue || '[]');
                this.renderNotices();
                this.showToast('Notice board updated!', 'success');
            }
        });
        this.renderNotices();
        this.startExpiryCheck();
        this.checkServerStatus();
        renderUsersList();
    }

    save()       { localStorage.setItem('notices', JSON.stringify(this.notices)); }
    savePinned() { localStorage.setItem(`pinned_${this.currentUser.email}`, JSON.stringify(this.pinned)); }

    saveDraft(e) {
        if (e) e.preventDefault();
        this.submitNoticeForm('draft');
    }

    addNotice(e) {
        e.preventDefault();
        this.submitNoticeForm('published');
    }

    cancelEdit() {
        if (!this.form) return;
        this.form.reset();
        document.getElementById('editNoticeId').value = '';
        document.getElementById('btnSubmitNotice').textContent = 'Publish Notice';
        document.getElementById('btnSaveDraft').style.display = 'inline-block';
        document.getElementById('btnCancelEdit').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editNotice(id) {
        const n = this.notices.find(x => x.id == id);
        if (!n || !this.form) return;
        document.getElementById('editNoticeId').value = n.id;
        document.getElementById('title').value = n.title;
        document.getElementById('content').value = n.content;
        document.getElementById('priority').value = n.priority;
        document.getElementById('expiry').value = n.expiry;
        if(document.getElementById('audience')) document.getElementById('audience').value = n.target || 'all';
        if(document.getElementById('targetYear')) document.getElementById('targetYear').value = n.targetYear || 'all';
        if(document.getElementById('publishDate')) document.getElementById('publishDate').value = n.publishDate || '';
        if(document.getElementById('attachment')) document.getElementById('attachment').value = n.attachment || '';
        
        document.getElementById('btnSubmitNotice').textContent = 'Update Notice';
        document.getElementById('btnSaveDraft').style.display = 'none';
        document.getElementById('btnCancelEdit').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    submitNoticeForm(status) {
        if (!this.validateNoticeForm()) return;
        const title   = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const priority= document.getElementById('priority').value;
        const expiry  = document.getElementById('expiry').value;
        const publishDate = document.getElementById('publishDate')?.value || null;
        const target      = document.getElementById('audience')?.value || 'all';
        const targetYear  = document.getElementById('targetYear')?.value || 'all';
        const attachment  = document.getElementById('attachment')?.value || '';
        const editId      = document.getElementById('editNoticeId')?.value;

        const noticeData = {
            title, content, priority, expiry, publishDate, target, targetYear, attachment, status,
            created: new Date().toISOString(),
            author: this.currentUser.name,
            readBy: []
        };

        if (editId) {
            const idx = this.notices.findIndex(n => n.id == editId);
            if (idx !== -1) {
                noticeData.created = this.notices[idx].created;
                noticeData.readBy = this.notices[idx].readBy || [];
                this.notices[idx] = { ...this.notices[idx], ...noticeData };
                this.showToast('Notice updated.');
            }
            this.cancelEdit();
        } else {
            noticeData.id = Date.now();
            this.notices.push(noticeData);
            this.showToast(status === 'draft' ? 'Draft saved.' : 'Notice published.');
            if (status !== 'draft' && (!publishDate || new Date(publishDate) <= new Date())) {
                this.sendEmailNotifications(noticeData);
            }
        }

        this.save();
        this.renderNotices();
        if (this.form && !editId) this.form.reset();
        calendar.render();
    }

    deleteNotice(id) {
        if (!confirm('Remove this notice from the board?')) return;
        this.notices = this.notices.filter(n => n.id !== id);
        this.pinned  = this.pinned.filter(p => p !== id);
        this.save();
        this.savePinned();
        this.renderNotices();
        calendar.render();
        this.showToast('Notice removed.');
    }

    togglePin(id) {
        const idx = this.pinned.indexOf(id);
        if (idx === -1) { this.pinned.push(id); this.showToast('Notice pinned.'); }
        else            { this.pinned.splice(idx, 1); this.showToast('Notice unpinned.'); }
        this.savePinned();
        this.renderNotices();
    }

    isExpired(expiry) { return new Date(expiry) < new Date(); }

    async checkServerStatus() {
        const el = document.getElementById('emailServerStatus');
        if (!el) return;

        try {
            // Check if server is running by fetching a static file or the root
            const res = await fetch('http://localhost:3000/package.json', { method: 'HEAD' });
            if (res.ok) {
                el.className = 'server-status online';
                el.querySelector('.status-text').textContent = 'Email Server Ready';
            } else {
                throw new Error();
            }
        } catch {
            el.className = 'server-status offline';
            el.querySelector('.status-text').textContent = 'Email Server Offline';
            console.warn('Notification server (localhost:3000) is unreachable. Emails will not be sent.');
        }
    }

    validateNoticeForm() {
        const title   = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const expiry  = document.getElementById('expiry').value;
        const errEl   = document.getElementById('formError');

        const showErr = (msg) => {
            if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
            return false;
        };

        if (errEl) errEl.style.display = 'none';

        if (!title.trim())   return showErr('Notice title cannot be empty.');
        if (!content.trim()) return showErr('Notice content cannot be empty.');
        if (!expiry || new Date(expiry) <= new Date()) return showErr('Expiry must be a future date and time.');

        return true;
    }

    markAsRead(id) {
        let n = this.notices.find(x => x.id == id);
        if(n && (!n.readBy || !n.readBy.includes(this.currentUser.email))) {
            n.readBy = n.readBy || [];
            n.readBy.push(this.currentUser.email);
            this.save();
            this.renderNotices();
        }
    }

    getActive() {
        const order = { high: 1, medium: 2, low: 3 };
        const now = new Date();
        const isAdmin = this.currentUser.role === 'admin';
        
        let active = this.notices.filter(n => {
            if (this.isExpired(n.expiry)) return false;
            if (isAdmin) return true;
            
            if (n.status === 'draft') return false;
            if (n.publishDate && new Date(n.publishDate) > now) return false;
            
            if (n.target && n.target !== 'all' && this.currentUser.department) {
                if (this.currentUser.department !== 'general' && this.currentUser.department !== n.target) return false;
            }
            if (n.targetYear && n.targetYear !== 'all' && this.currentUser.year) {
                if (this.currentUser.year !== 'na' && this.currentUser.year !== n.targetYear) return false;
            }
            return true;
        });

        const searchInput = document.getElementById('searchInput');
        const filterCat   = document.getElementById('filterCategory');
        const filterYear  = document.getElementById('filterYear');
        const filterPri   = document.getElementById('filterPriority');
        
        if (searchInput && searchInput.value) {
            const q = searchInput.value.toLowerCase();
            active = active.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
        }
        if (filterCat && filterCat.value !== 'all') {
            active = active.filter(n => n.target === filterCat.value);
        }
        if (filterYear && filterYear.value !== 'all') {
            active = active.filter(n => n.targetYear === filterYear.value);
        }
        if (filterPri && filterPri.value !== 'all') {
            active = active.filter(n => n.priority === filterPri.value);
        }

        const pinnedFirst = this.prefs.pinnedFirst !== false;
        if (pinnedFirst) {
            const pinned   = active.filter(n =>  this.pinned.includes(n.id)).sort((a,b) => order[a.priority]-order[b.priority]);
            const unpinned = active.filter(n => !this.pinned.includes(n.id)).sort((a,b) => order[a.priority]-order[b.priority]);
            return [...pinned, ...unpinned];
        }
        return active.sort((a,b) => order[a.priority]-order[b.priority]);
    }

    renderNotices() {
        const active  = this.getActive();
        const countEl = document.getElementById('noticeCount');
        if (countEl) countEl.textContent = `${active.length} Active`;

        if (active.length === 0) {
            this.board.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No active notices at this time</p>
                </div>`;
            return;
        }

        const isAdmin = this.currentUser.role === 'admin';
        const compact = this.prefs.compact === true;

        this.board.innerHTML = active.map(n => {
            const isPinned = this.pinned.includes(n.id);
            const isRead = n.readBy && n.readBy.includes(this.currentUser.email);
            const unreadClass = !isAdmin && !isRead ? 'unread' : '';
            
            let statusHtml = '';
            if (isAdmin) {
                 if (n.status === 'draft') statusHtml = '<span class="status-badge draft">Draft</span>';
                 else if (n.publishDate && new Date(n.publishDate) > new Date()) statusHtml = '<span class="status-badge scheduled" title="Scheduled to publish">Scheduled</span>';
                 else statusHtml = '<span class="status-badge live">Live</span>';
            }

            const body = compact
                ? `<p style="color:#888;font-size:0.8rem;margin-bottom:10px;">${n.content.substring(0,80)}${n.content.length>80?'...':''}</p>`
                : `<p>${n.content}</p>`;

            const attachmentHtml = n.attachment ? `<br><a href="${n.attachment}" target="_blank" class="notice-attachment">🔗 View Attachment</a>` : '';

            return `
            <div class="notice ${n.priority} ${isPinned ? 'pinned' : ''} ${unreadClass}">
                ${isPinned ? '<div class="pin-indicator">★ Pinned</div>' : ''}
                <div class="notice-header">
                    <div class="notice-title-group">
                        <h3>${!isAdmin && !isRead ? '<span class="unread-dot" title="New Notice"></span>' : ''}${n.title}</h3>
                        <div class="notice-meta">
                            <span class="priority-badge ${n.priority}">${n.priority} Priority</span>
                            ${n.target && n.target !== 'all' ? `<span class="target-badge">🎯 ${n.target.toUpperCase()}</span>` : ''}
                            ${n.targetYear && n.targetYear !== 'all' ? `<span class="target-badge">📅 Y${n.targetYear}</span>` : ''}
                            ${statusHtml}
                        </div>
                    </div>
                </div>
                ${body}
                ${attachmentHtml}
                <div class="notice-footer" style="padding-top:14px; margin-top:10px;">
                    <div class="meta-info">
                        <span>📅 Expires: ${new Date(n.expiry).toLocaleString()}</span>
                        <span>👤 ${n.author || 'Administrator'}</span>
                        ${isAdmin ? `<span>👁️ ${n.readBy ? n.readBy.length : 0} Reads</span>` : ''}
                    </div>
                    <div class="notice-actions">
                        ${!isAdmin && !isRead ? `<button class="btn-read" onclick="noticeBoard.markAsRead(${n.id})">Mark as Read</button>` : ''}
                        ${!isAdmin ? `
                        <button class="star-btn ${isPinned ? 'starred' : ''}" onclick="noticeBoard.togglePin(${n.id})" title="${isPinned ? 'Unpin notice' : 'Pin to top'}">
                            ${isPinned ? '★' : '☆'}
                        </button>` : ''}
                        ${isAdmin ? `
                        <button class="btn-edit" onclick="noticeBoard.editNotice(${n.id})">Edit</button>
                        <button class="delete-btn" onclick="noticeBoard.deleteNotice(${n.id})">Remove</button>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    showToast(message, type = 'success') {
        const t = document.createElement('div');
        t.className = `notification ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('show'), 50);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
    }

    async sendEmailNotifications(notice) {
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Filter users who should receive this notification
        const users = allUsers.filter(u => {
            // Default to 'true' if preference is missing (opt-out model)
            const prefs = JSON.parse(localStorage.getItem(`prefs_${u.email}`) || '{}');
            if (prefs.email === false) return false;
            
            // Filter by department (target)
            if (notice.target && notice.target !== 'all') {
                if (u.department && u.department !== 'general' && u.department !== notice.target) return false;
            }
            
            // Filter by year
            if (notice.targetYear && notice.targetYear !== 'all') {
                if (u.year && u.year !== 'na' && u.year !== notice.targetYear) return false;
            }
            
            return true;
        });

        if (users.length === 0) {
            console.log('No eligible users to notify for this notice.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'notification info show';
        toast.textContent = `📧 Sending notifications to ${users.length} users...`;
        document.body.appendChild(toast);

        try {
            const res = await fetch('http://localhost:3000/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users, notice })
            });

            toast.remove(); // Remove the "sending" toast

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                this.showToast(`Notice posted, but email server returned an error: ${errData.error || res.statusText}`, 'error');
                return;
            }

            const result = await res.json();
            if (result.success) {
                this.showToast(`Notice posted & emails sent to ${result.sent}/${result.total} users.`);
            } else {
                this.showToast(`Notice posted. Email service reported a problem: ${result.error}`, 'warning');
            }
        } catch (err) {
            toast.remove();
            console.error('Email Notification Error:', err);
            this.showToast('Notice posted, but email server is OFFLINE. Please start server.js.', 'error');
            this.checkServerStatus();
        }
    }

    startExpiryCheck() {
        setInterval(() => {
            const before = this.notices.length;
            this.notices = this.notices.filter(n => !this.isExpired(n.expiry));
            if (this.notices.length !== before) { this.save(); this.renderNotices(); calendar.render(); }
        }, 60000);
    }
}

// ── Init ──────────────────────────────────────────────
const calendar    = new Calendar();
const noticeBoard = new NoticeBoard();

// ── Admin Tab Switching ───────────────────────────────
function adminSwitchTab(tab) {
    // Tab buttons
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    // Tab content panels
    document.querySelectorAll('[id^="atab-"]').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById(`atab-${tab}`);
    if (panel) panel.classList.add('active');
    // Sidebar nav highlight
    document.querySelectorAll('.snav').forEach(a => a.classList.remove('active-snav'));
    const snav = document.getElementById(`snav-${tab}`);
    if (snav) snav.classList.add('active-snav');

    if (tab === 'statistics') loadAdminStatistics();
    if (tab === 'schedules')  loadAdminSchedules();
}

// ── Donut Chart (shared helper) ───────────────────────
function donutChart(svgId, centerId, legendId, segments, centerLabel, centerSub) {
    const svg    = document.getElementById(svgId);
    const center = document.getElementById(centerId);
    const legend = document.getElementById(legendId);
    if (!svg) return;

    const cx = 100, cy = 100, r = 70, stroke = 28;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const circumference = 2 * Math.PI * r;

    if (total === 0) {
        svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eee" stroke-width="${stroke}"/>`;
        center.innerHTML = `<div class="dc-val">0</div><div class="dc-lbl">No data</div>`;
        legend.innerHTML = '';
        return;
    }

    let offset = -0.25 * circumference;
    let paths  = '';
    const gap  = total > 1 ? circumference * 0.012 : 0;

    segments.forEach(seg => {
        const slice = (seg.value / total) * circumference - gap;
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${seg.color}" stroke-width="${stroke}"
            stroke-dasharray="${slice} ${circumference - slice}"
            stroke-dashoffset="${-offset}" stroke-linecap="butt" class="donut-seg">
            <title>${seg.label}: ${seg.value}</title></circle>`;
        offset += slice + gap;
    });

    svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0f0eb" stroke-width="${stroke}"/>` + paths;
    center.innerHTML = `<div class="dc-val">${centerLabel}</div><div class="dc-lbl">${centerSub}</div>`;
    legend.innerHTML = segments.map(seg => `
        <div class="donut-legend-item">
            <span class="donut-legend-dot" style="background:${seg.color}"></span>
            <span class="donut-legend-label">${seg.label}</span>
            <span class="donut-legend-val">${seg.value}</span>
        </div>`).join('');
}

// ── Admin Statistics ──────────────────────────────────
function loadAdminStatistics() {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const users   = JSON.parse(localStorage.getItem('users')   || '[]');
    const now     = new Date();
    const active  = notices.filter(n => new Date(n.expiry) > now);
    const expired = notices.filter(n => new Date(n.expiry) <= now);
    const in24h   = active.filter(n => (new Date(n.expiry) - now) < 86400000);

    const high   = active.filter(n => n.priority === 'high').length;
    const medium = active.filter(n => n.priority === 'medium').length;
    const low    = active.filter(n => n.priority === 'low').length;
    const total  = active.length;

    document.getElementById('st-total').textContent    = total;
    document.getElementById('st-high').textContent     = high;
    document.getElementById('st-medium').textContent   = medium;
    document.getElementById('st-low').textContent      = low;
    document.getElementById('st-users').textContent    = users.length;
    document.getElementById('st-expiring').textContent = in24h.length;

    // Priority donut
    donutChart('svg-priority', 'dc-priority', 'lg-priority', [
        { label: 'High',   value: high,   color: '#c0392b' },
        { label: 'Medium', value: medium, color: '#d4a017' },
        { label: 'Low',    value: low,    color: '#2471a3' }
    ], total, 'Active');

    // Status donut
    donutChart('svg-status', 'dc-status', 'lg-status', [
        { label: 'Active',    value: total,          color: '#1a2340' },
        { label: 'Expired',   value: expired.length, color: '#c0392b' },
        { label: 'Exp. 24h',  value: in24h.length,   color: '#c9a84c' }
    ], notices.length, 'Total');

    // Roles donut
    const admins  = users.filter(u => u.role === 'admin').length;
    const regular = users.filter(u => u.role === 'user').length;
    donutChart('svg-roles', 'dc-roles', 'lg-roles', [
        { label: 'Admins', value: admins,  color: '#c9a84c' },
        { label: 'Users',  value: regular, color: '#2471a3' }
    ], users.length, 'Users');

    // Author donut
    const authorMap = {};
    active.forEach(n => { authorMap[n.author] = (authorMap[n.author] || 0) + 1; });
    const colors = ['#1a2340','#c9a84c','#2471a3','#c0392b','#27ae60','#8e44ad','#d4a017'];
    const authorSegs = Object.entries(authorMap)
        .sort((a,b) => b[1]-a[1])
        .map(([name, count], i) => ({ label: name, value: count, color: colors[i % colors.length] }));
    donutChart('svg-author', 'dc-author', 'lg-author',
        authorSegs.length ? authorSegs : [{ label: 'None', value: 1, color: '#eee' }],
        authorSegs.length ? authorSegs.length : 0,
        authorSegs.length ? (authorSegs.length > 1 ? 'Authors' : 'Author') : 'No data'
    );
}

// ── Admin Schedules ───────────────────────────────────
function loadAdminSchedules() {
    const notices = JSON.parse(localStorage.getItem('notices') || '[]');
    const now     = new Date();
    const active  = notices.filter(n => new Date(n.expiry) > now)
                           .sort((a,b) => new Date(a.expiry) - new Date(b.expiry));

    // Timeline
    const timelineEl = document.getElementById('sch-timeline');
    if (active.length === 0) {
        timelineEl.innerHTML = '<div class="empty-state" style="padding:30px 0;"><p>No scheduled notices</p></div>';
    } else {
        timelineEl.innerHTML = `<div class="sch-timeline">${active.map((n, i) => {
            const expDate  = new Date(n.expiry);
            const diffMs   = expDate - now;
            const diffHrs  = Math.ceil(diffMs / 3600000);
            const diffDays = Math.ceil(diffMs / 86400000);
            const timeLeft = diffDays > 1 ? `${diffDays} days left` : diffHrs > 1 ? `${diffHrs} hours left` : 'Expires soon';
            const urgent   = diffHrs <= 24;
            return `
            <div class="sch-item ${urgent ? 'sch-urgent' : ''}">
                <div class="sch-line">
                    <div class="sch-dot ${n.priority}"></div>
                    ${i < active.length - 1 ? '<div class="sch-connector"></div>' : ''}
                </div>
                <div class="sch-body">
                    <div class="sch-title">${n.title}</div>
                    <div class="sch-meta">
                        <span class="priority-badge ${n.priority}">${n.priority}</span>
                        <span class="sch-date">📅 ${expDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                        <span class="sch-date">🕐 ${expDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                        <span class="sch-timeleft ${urgent ? 'urgent' : ''}">${timeLeft}</span>
                    </div>
                    <div class="sch-author">Posted by ${n.author}</div>
                </div>
            </div>`;
        }).join('')}</div>`;
    }

    // Expiring soon (48h)
    const soon   = active.filter(n => (new Date(n.expiry) - now) < 172800000);
    const soonEl = document.getElementById('sch-expiring-soon');
    soonEl.innerHTML = soon.length === 0
        ? '<div class="empty-state" style="padding:20px 0;"><p>None expiring soon</p></div>'
        : soon.map(n => {
            const hrs = Math.ceil((new Date(n.expiry) - now) / 3600000);
            return `<div class="activity-item">
                <div class="activity-dot ${n.priority}"></div>
                <div>
                    <div class="activity-text">${n.title}</div>
                    <div class="activity-time" style="color:${hrs<=24?'#c0392b':'#b7860b'}">
                        ⚠ ${hrs <= 24 ? hrs + 'h' : Math.ceil(hrs/24) + ' days'} remaining
                    </div>
                </div>
            </div>`;
        }).join('');

    // Summary
    const thisWeek  = active.filter(n => (new Date(n.expiry) - now) < 604800000).length;
    const thisMonth = active.filter(n => (new Date(n.expiry) - now) < 2592000000).length;
    document.getElementById('sch-summary').innerHTML = `
        <div class="sch-summary-grid">
            <div class="sch-summary-item">
                <div class="sch-summary-val">${soon.length}</div>
                <div class="sch-summary-lbl">Expiring in 48h</div>
            </div>
            <div class="sch-summary-item">
                <div class="sch-summary-val">${thisWeek}</div>
                <div class="sch-summary-lbl">This Week</div>
            </div>
            <div class="sch-summary-item">
                <div class="sch-summary-val">${thisMonth}</div>
                <div class="sch-summary-lbl">This Month</div>
            </div>
            <div class="sch-summary-item">
                <div class="sch-summary-val">${active.length}</div>
                <div class="sch-summary-lbl">Total Active</div>
            </div>
        </div>`;
}
