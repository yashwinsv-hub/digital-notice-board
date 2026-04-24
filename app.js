class NoticeBoard {
    constructor() {
        this.notices = this.loadNotices();
        this.form = document.getElementById('noticeForm');
        this.board = document.getElementById('noticeBoard');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.addNotice(e));
        this.renderNotices();
        this.startExpiryCheck();
    }

    loadNotices() {
        const stored = localStorage.getItem('notices');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotices() {
        localStorage.setItem('notices', JSON.stringify(this.notices));
    }

    addNotice(e) {
        e.preventDefault();
        
        const notice = {
            id: Date.now(),
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            priority: document.getElementById('priority').value,
            expiry: document.getElementById('expiry').value,
            created: new Date().toISOString()
        };

        this.notices.push(notice);
        this.saveNotices();
        this.renderNotices();
        this.form.reset();
    }

    deleteNotice(id) {
        this.notices = this.notices.filter(notice => notice.id !== id);
        this.saveNotices();
        this.renderNotices();
    }

    isExpired(expiryDate) {
        return new Date(expiryDate) < new Date();
    }

    sortNotices() {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return this.notices
            .filter(notice => !this.isExpired(notice.expiry))
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    renderNotices() {
        const activeNotices = this.sortNotices();
        
        if (activeNotices.length === 0) {
            this.board.innerHTML = '<p style="color: white; text-align: center;">No active notices</p>';
            return;
        }

        this.board.innerHTML = activeNotices.map(notice => `
            <div class="notice ${notice.priority}">
                <div class="notice-header">
                    <h3>${notice.title}</h3>
                    <span class="priority-badge ${notice.priority}">${notice.priority}</span>
                </div>
                <p>${notice.content}</p>
                <div class="notice-footer">
                    <span class="expiry-time">Expires: ${new Date(notice.expiry).toLocaleString()}</span>
                    <button class="delete-btn" onclick="noticeBoard.deleteNotice(${notice.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    startExpiryCheck() {
        setInterval(() => {
            const expiredCount = this.notices.filter(n => this.isExpired(n.expiry)).length;
            if (expiredCount > 0) {
                this.notices = this.notices.filter(n => !this.isExpired(n.expiry));
                this.saveNotices();
                this.renderNotices();
            }
        }, 60000); // Check every minute
    }
}

const noticeBoard = new NoticeBoard();
