/**
 * Main Application Logic
 * Handles screen navigation, camera, and chat functionality
 */

const App = {
    currentScreen: 'landing',
    userData: null,
    partnerData: null,
    selectedFilter: 'any',
    queueTimer: null,
    queueStartTime: null,
    cameraStream: null,

    // Initialize app
    async init() {
        await API.init();
        this.bindEvents();
        this.setupWebSocketHandlers();

        // Check if user is already registered
        try {
            const user = await API.register();
            this.userData = user;

            if (user.is_verified && user.nickname) {
                this.showScreen('dashboard');
                this.updateDashboard();
            } else if (user.is_verified) {
                this.showScreen('profile');
                document.getElementById('verified-gender').textContent = `Verified as ${user.gender}`;
            }
        } catch (e) {
            console.log('New user, starting fresh');
        }
    },

    // Bind all event listeners
    bindEvents() {
        // Landing
        document.getElementById('start-btn').addEventListener('click', () => this.showScreen('verification'));
        document.getElementById('back-to-landing').addEventListener('click', () => this.showScreen('landing'));

        // Camera
        document.getElementById('retry-camera').addEventListener('click', () => this.startCamera());
        document.getElementById('capture-btn').addEventListener('click', () => this.capturePhoto());

        // Profile
        document.getElementById('profile-form').addEventListener('submit', (e) => this.handleProfileSubmit(e));
        document.getElementById('nickname').addEventListener('input', (e) => {
            document.getElementById('nickname-count').textContent = e.target.value.length;
        });
        document.getElementById('bio').addEventListener('input', (e) => {
            document.getElementById('bio-count').textContent = e.target.value.length;
        });

        // Dashboard
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectFilter(btn.dataset.filter));
        });
        document.getElementById('find-match-btn').addEventListener('click', () => this.findMatch());

        // Queue
        document.getElementById('cancel-queue-btn').addEventListener('click', () => this.cancelQueue());

        // Chat
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('leave-btn').addEventListener('click', () => this.leaveChat());
        document.getElementById('next-btn').addEventListener('click', () => this.nextMatch());
        document.getElementById('report-btn').addEventListener('click', () => this.showReportModal());

        // Report Modal
        document.getElementById('cancel-report-btn').addEventListener('click', () => this.hideReportModal());
        document.getElementById('submit-report-btn').addEventListener('click', () => this.submitReport());
    },

    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenId}-screen`).classList.add('active');
        this.currentScreen = screenId;

        if (screenId === 'verification') {
            this.startCamera();
        } else {
            this.stopCamera();
        }
    },

    // Camera handling
    async startCamera() {
        const video = document.getElementById('camera-preview');
        const captureBtn = document.getElementById('capture-btn');
        const errorDiv = document.getElementById('camera-error');

        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            video.srcObject = this.cameraStream;
            captureBtn.disabled = false;
            errorDiv.style.display = 'none';
        } catch (e) {
            console.error('Camera error:', e);
            errorDiv.style.display = 'flex';
            captureBtn.disabled = true;
        }
    },

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    },

    async capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        const statusDiv = document.getElementById('verification-status');
        const captureBtn = document.getElementById('capture-btn');

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas (flip horizontally to match mirror view)
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        // Show loading state
        captureBtn.style.display = 'none';
        statusDiv.style.display = 'flex';

        try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

            // Send to API
            const result = await API.verifyGender(blob);

            this.showToast('success', `Verified as ${result.gender}! Image deleted.`);

            // Update user data and move to profile
            this.userData = await API.getMe();
            document.getElementById('verified-gender').textContent = `Verified as ${result.gender}`;
            this.showScreen('profile');

        } catch (e) {
            this.showToast('error', e.message);
            captureBtn.style.display = 'block';
        } finally {
            statusDiv.style.display = 'none';
        }
    },

    // Profile handling
    async handleProfileSubmit(e) {
        e.preventDefault();
        const nickname = document.getElementById('nickname').value.trim();
        const bio = document.getElementById('bio').value.trim();

        try {
            this.userData = await API.updateProfile(nickname, bio);
            this.showToast('success', 'Profile saved!');
            this.showScreen('dashboard');
            this.updateDashboard();
        } catch (e) {
            this.showToast('error', e.message);
        }
    },

    updateDashboard() {
        if (!this.userData) return;
        document.getElementById('user-nickname').textContent = this.userData.nickname || 'Anonymous';
        document.getElementById('user-karma').textContent = this.userData.karma_score;
        document.getElementById('daily-remaining').textContent = this.userData.daily_matches_remaining;
    },

    // Filter selection
    selectFilter(filter) {
        this.selectedFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    },

    // Matching
    async findMatch() {
        const btn = document.getElementById('find-match-btn');
        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-loader').style.display = 'block';

        try {
            await WebSocketManager.connect();
            WebSocketManager.joinQueue(this.selectedFilter);

            this.showScreen('queue');
            document.getElementById('queue-filter').textContent =
                this.selectedFilter === 'any' ? 'anyone' : this.selectedFilter;

            this.queueStartTime = Date.now();
            this.queueTimer = setInterval(() => this.updateQueueTime(), 1000);

        } catch (e) {
            this.showToast('error', 'Connection failed. Is the server running?');
        } finally {
            btn.querySelector('.btn-text').style.display = 'inline';
            btn.querySelector('.btn-loader').style.display = 'none';
        }
    },

    updateQueueTime() {
        const elapsed = Math.floor((Date.now() - this.queueStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        document.getElementById('queue-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    cancelQueue() {
        if (this.queueTimer) {
            clearInterval(this.queueTimer);
            this.queueTimer = null;
        }
        WebSocketManager.leaveQueue();
        this.showScreen('dashboard');
    },

    // WebSocket event handlers
    setupWebSocketHandlers() {
        WebSocketManager.on('connected', () => console.log('WS Connected'));

        WebSocketManager.on('queued', () => {
            console.log('Added to queue');
        });

        WebSocketManager.on('match_found', (data) => {
            if (this.queueTimer) {
                clearInterval(this.queueTimer);
                this.queueTimer = null;
            }

            this.partnerData = data.partner;
            document.getElementById('partner-nickname').textContent = data.partner.nickname;
            document.getElementById('chat-partner-name').textContent = data.partner.nickname;
            document.getElementById('chat-start-time').textContent = new Date().toLocaleTimeString();
            document.getElementById('chat-messages').innerHTML = `
                <div class="chat-start-message">
                    <p>You're now chatting with <strong>${data.partner.nickname}</strong></p>
                    <span class="chat-start-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;

            this.showScreen('chat');
            this.showToast('success', `Connected with ${data.partner.nickname}!`);
        });

        WebSocketManager.on('message', (data) => {
            this.appendMessage(data.content, 'received', data.timestamp);
        });

        WebSocketManager.on('partner_left', () => {
            this.showToast('warning', 'Your partner left the chat');
            this.showScreen('dashboard');
            this.updateDashboard();
        });

        WebSocketManager.on('chat_ended', () => {
            this.showScreen('dashboard');
            this.updateDashboard();
        });

        WebSocketManager.on('error', (data) => {
            this.showToast('error', data.message);
        });
    },

    // Chat functions
    sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content) return;

        WebSocketManager.sendMessage(content);
        this.appendMessage(content, 'sent');
        input.value = '';
    },

    appendMessage(content, type, timestamp) {
        const container = document.getElementById('chat-messages');
        const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.innerHTML = `
            ${content}
            <span class="message-time">${time}</span>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    },

    leaveChat() {
        WebSocketManager.leaveChat();
        this.showScreen('dashboard');
        this.updateDashboard();
    },

    nextMatch() {
        WebSocketManager.nextMatch(this.selectedFilter);
        this.showScreen('queue');
        this.queueStartTime = Date.now();
        this.queueTimer = setInterval(() => this.updateQueueTime(), 1000);
    },

    // Report functions
    showReportModal() {
        document.getElementById('report-modal').classList.add('active');
    },

    hideReportModal() {
        document.getElementById('report-modal').classList.remove('active');
    },

    async submitReport() {
        const reason = document.querySelector('input[name="report-reason"]:checked')?.value;
        const details = document.getElementById('report-details').value;

        if (!reason) {
            this.showToast('error', 'Please select a reason');
            return;
        }

        try {
            await API.submitReport(this.partnerData?.device_id || 'unknown', reason, details);
            this.showToast('success', 'Report submitted. Thank you.');
            this.hideReportModal();
            this.leaveChat();
        } catch (e) {
            this.showToast('error', e.message);
        }
    },

    // Toast notifications
    showToast(type, message) {
        const container = document.getElementById('toast-container');
        const icons = { success: '✓', error: '✕', warning: '⚠' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
