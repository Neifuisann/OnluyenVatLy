// Settings Page JavaScript
class SettingsManager {
    constructor() {
        this.currentTab = 'profile';
        this.isLoading = false;
        this.settings = {};
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupToggleSwitches();
        this.setupPasswordStrength();
        this.loadUserData();
        this.loadDevices();
        this.loadSettings();
        this.setupEventListeners();
    }

    // Tab switching functionality
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-button, .mobile-tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button, .mobile-tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to clicked button and corresponding content
        document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(btn => {
            btn.classList.add('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');

        this.currentTab = tabId;
    }

    // Form submission handlers
    setupFormHandlers() {
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Avatar upload
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e.target.files[0]);
            });
        }

        // Remove avatar
        const removeAvatar = document.getElementById('remove-avatar');
        if (removeAvatar) {
            removeAvatar.addEventListener('click', () => {
                this.removeAvatar();
            });
        }

        // Save preferences
        const savePreferences = document.getElementById('save-preferences');
        if (savePreferences) {
            savePreferences.addEventListener('click', () => {
                this.savePreferences();
            });
        }

        // Save privacy settings
        const savePrivacy = document.getElementById('save-privacy');
        if (savePrivacy) {
            savePrivacy.addEventListener('click', () => {
                this.savePrivacySettings();
            });
        }

        // Export data
        const exportData = document.getElementById('export-data');
        if (exportData) {
            exportData.addEventListener('click', () => {
                this.exportUserData();
            });
        }

        // Delete account
        const deleteAccount = document.getElementById('delete-account');
        if (deleteAccount) {
            deleteAccount.addEventListener('click', () => {
                this.requestAccountDeletion();
            });
        }

        // Logout all devices
        const logoutAll = document.getElementById('logout-all');
        if (logoutAll) {
            logoutAll.addEventListener('click', () => {
                this.logoutAllDevices();
            });
        }
    }

    // Toggle switches
    setupToggleSwitches() {
        const toggleSwitches = document.querySelectorAll('.toggle-switch');
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const checkbox = toggle.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    toggle.classList.toggle('active', checkbox.checked);
                    
                    const setting = toggle.dataset.setting;
                    if (setting) {
                        this.settings[setting] = checkbox.checked;
                    }
                }
            });
        });
    }

    // Password strength checker
    setupPasswordStrength() {
        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let feedback = [];

        // Update requirement checklist
        const updateRequirement = (id, test) => {
            const element = document.getElementById(id);
            if (element) {
                if (test) {
                    element.classList.add('valid');
                    element.classList.remove('invalid');
                    element.querySelector('i').className = 'fas fa-check-circle';
                } else {
                    element.classList.remove('valid');
                    element.classList.add('invalid');
                    element.querySelector('i').className = 'fas fa-circle';
                }
            }
            return test;
        };

        // Length check
        if (updateRequirement('req-length', password.length >= 8)) {
            strength++;
        } else {
            feedback.push('Ít nhất 8 ký tự');
        }

        // Uppercase check
        if (updateRequirement('req-uppercase', /[A-Z]/.test(password))) {
            strength++;
        } else {
            feedback.push('Chữ hoa');
        }

        // Lowercase check
        if (updateRequirement('req-lowercase', /[a-z]/.test(password))) {
            strength++;
        } else {
            feedback.push('Chữ thường');
        }

        // Number check
        if (updateRequirement('req-number', /\d/.test(password))) {
            strength++;
        } else {
            feedback.push('Số');
        }

        // Special character check
        if (updateRequirement('req-special', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))) {
            strength++;
        } else {
            feedback.push('Ký tự đặc biệt');
        }

        // Remove all strength classes
        strengthBar.className = 'strength-bar';
        
        // Apply appropriate strength class
        if (password.length === 0) {
            strengthText.textContent = 'Nhập mật khẩu để kiểm tra độ mạnh';
            // Reset all requirements to default state
            ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.remove('valid', 'invalid');
                    element.querySelector('i').className = 'fas fa-circle';
                }
            });
        } else if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = `Yếu - Cần: ${feedback.join(', ')}`;
        } else if (strength <= 3) {
            strengthBar.classList.add('medium');
            strengthText.textContent = `Trung bình - Cần: ${feedback.join(', ')}`;
        } else if (strength <= 4) {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Mạnh';
        } else {
            strengthBar.classList.add('very-strong');
            strengthText.textContent = 'Rất mạnh';
        }
    }

    // Setup additional event listeners
    setupEventListeners() {
        // Form input validation
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
        });

        // Confirm password validation
        const confirmPassword = document.getElementById('confirm-password');
        const newPassword = document.getElementById('new-password');
        if (confirmPassword && newPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(newPassword.value, confirmPassword.value);
            });
        }
    }

    // Input validation
    validateInput(input) {
        const value = input.value.trim();
        const type = input.type;
        const required = input.hasAttribute('required');

        // Remove existing validation classes
        input.classList.remove('valid', 'invalid');
        
        // Remove existing error messages
        const existingError = input.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (required && !value) {
            isValid = false;
            errorMessage = 'Trường này là bắt buộc';
        }

        // Type-specific validation
        if (value && type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Email không hợp lệ';
            }
        }

        if (value && type === 'tel') {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Số điện thoại không hợp lệ';
            }
        }

        // Apply validation result
        input.classList.add(isValid ? 'valid' : 'invalid');
        
        if (!isValid) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            
            // Create icon element safely
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-circle';
            
            // Create text node with escaped content
            const textNode = document.createTextNode(' ' + errorMessage);
            
            errorDiv.appendChild(icon);
            errorDiv.appendChild(textNode);
            input.parentNode.appendChild(errorDiv);
        }

        return isValid;
    }

    // Password match validation
    validatePasswordMatch(password, confirmPassword) {
        const confirmInput = document.getElementById('confirm-password');
        if (!confirmInput) return;

        // Remove existing validation
        confirmInput.classList.remove('valid', 'invalid');
        const existingError = confirmInput.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            
            // Create icon element safely
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-circle';
            
            // Create text node with safe content
            const textNode = document.createTextNode(' Mật khẩu không khớp');
            
            errorDiv.appendChild(icon);
            errorDiv.appendChild(textNode);
            confirmInput.parentNode.appendChild(errorDiv);
            return false;
        } else if (confirmPassword) {
            confirmInput.classList.add('valid');
            return true;
        }
        return true;
    }

    // Load user data
    async loadUserData() {
        try {
            const response = await fetch('/api/students/profile');
            if (response.ok) {
                const data = await response.json();
                this.populateProfile(data);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showToast('Không thể tải thông tin người dùng', 'error');
        }
    }

    // Populate profile form
    populateProfile(data) {
        const profile = data.profile?.student || data.student || data;
        if (profile) {
            const fullNameInput = document.getElementById('full-name');
            const phoneInput = document.getElementById('phone-number');
            const schoolInput = document.getElementById('school-name');
            const gradeInput = document.getElementById('grade-level');
            const bioInput = document.getElementById('bio');

            if (fullNameInput) fullNameInput.value = profile.full_name || '';
            if (phoneInput) phoneInput.value = profile.phone_number || '';
            if (schoolInput) schoolInput.value = profile.school_name || '';
            if (gradeInput) gradeInput.value = profile.grade_level || '';
            if (bioInput) bioInput.value = profile.bio || '';

            // Update avatar - check both avatar_url and avatar fields
            const avatarUrl = profile.avatar_url || profile.avatar;
            this.updateAvatarDisplay(avatarUrl, profile.full_name);
        }
    }

    // Update avatar display
    updateAvatarDisplay(avatarUrl, fullName) {
        const currentAvatar = document.getElementById('current-avatar');
        if (currentAvatar) {
            if (avatarUrl) {
                currentAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
            } else {
                const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';
                currentAvatar.innerHTML = `<i class="fas fa-user"></i>`;
            }
        }
    }

    // Save profile
    async saveProfile() {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;

        // Validate all inputs
        const inputs = profileForm.querySelectorAll('.form-input');
        let isValid = true;
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Vui lòng kiểm tra và sửa các lỗi trong form', 'error');
            return;
        }

        const profileData = {
            full_name: document.getElementById('full-name').value,
            phone_number: document.getElementById('phone-number').value,
            school_name: document.getElementById('school-name').value,
            grade_level: document.getElementById('grade-level').value,
            bio: document.getElementById('bio').value
        };

        this.setButtonLoading('profile-form', true);

        try {
            // Get current student ID from session
            const sessionResponse = await fetch('/api/auth/session');
            const sessionData = await sessionResponse.json();
            const studentId = sessionData.data?.studentId;
            
            if (!studentId) {
                this.showToast('Không thể xác định ID học sinh', 'error');
                this.setButtonLoading('profile-form', false);
                return;
            }
            
            const response = await fetch(`/api/students/${studentId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Cập nhật hồ sơ thành công', 'success');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast('Không thể cập nhật hồ sơ', 'error');
        } finally {
            this.setButtonLoading('profile-form', false);
        }
    }

    // Change password
    async changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        if (!this.validatePasswordMatch(newPassword, confirmPassword)) {
            return;
        }

        // Check password strength
        if (newPassword.length < 8) {
            this.showToast('Mật khẩu mới phải có ít nhất 8 ký tự', 'error');
            return;
        }

        this.setButtonLoading('password-form', true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đổi mật khẩu thành công', 'success');
                // Clear form
                document.getElementById('password-form').reset();
                document.getElementById('strength-bar').className = 'strength-bar';
                document.getElementById('strength-text').textContent = 'Nhập mật khẩu để kiểm tra độ mạnh';
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showToast('Không thể đổi mật khẩu', 'error');
        } finally {
            this.setButtonLoading('password-form', false);
        }
    }

    // Handle avatar upload
    async handleAvatarUpload(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Vui lòng chọn file hình ảnh', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/students/avatar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.updateAvatarDisplay(result.data.avatar_url, null);
                this.showToast('Cập nhật ảnh đại diện thành công', 'success');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showToast('Không thể tải ảnh lên', 'error');
        }
    }

    // Remove avatar
    async removeAvatar() {
        const confirmed = await this.showConfirmDialog(
            'Xóa ảnh đại diện',
            'Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?'
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/students/avatar', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.updateAvatarDisplay(null, null);
                this.showToast('Đã xóa ảnh đại diện', 'success');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            this.showToast('Không thể xóa ảnh đại diện', 'error');
        }
    }

    // Load devices
    async loadDevices() {
        try {
            const response = await fetch('/api/students/devices');
            if (response.ok) {
                const data = await response.json();
                this.renderDevices(data.devices || []);
            }
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    }

    // Render devices list
    renderDevices(devices) {
        const devicesList = document.getElementById('devices-list');
        if (!devicesList) return;

        if (devices.length === 0) {
            devicesList.innerHTML = '<p>Chưa có thiết bị nào được liên kết.</p>';
            return;
        }

        devicesList.innerHTML = devices.map(device => `
            <div class="device-card ${device.is_current ? 'current' : ''}">
                <div class="device-info">
                    <div class="device-details">
                        <h4>
                            <i class="fas fa-${this.getDeviceIcon(device.user_agent)}"></i>
                            ${this.getDeviceName(device.user_agent)}
                            ${device.is_current ? '<span class="device-badge current">Hiện tại</span>' : ''}
                        </h4>
                        <p>IP: ${device.ip_address}</p>
                        <p>Liên kết: ${new Date(device.created_at).toLocaleString('vi-VN')}</p>
                        <p>Hoạt động cuối: ${new Date(device.last_activity).toLocaleString('vi-VN')}</p>
                    </div>
                </div>
                ${!device.is_current ? `
                    <div class="device-actions">
                        <button class="btn btn-danger btn-sm" onclick="settingsManager.unbindDevice('${device.id}')">
                            <i class="fas fa-unlink"></i>
                            Hủy liên kết
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Get device icon based on user agent
    getDeviceIcon(userAgent) {
        if (/Mobile|Android|iPhone/.test(userAgent)) {
            return 'mobile-alt';
        } else if (/iPad|Tablet/.test(userAgent)) {
            return 'tablet-alt';
        } else {
            return 'desktop';
        }
    }

    // Get device name based on user agent
    getDeviceName(userAgent) {
        if (/Chrome/.test(userAgent)) {
            return 'Chrome';
        } else if (/Firefox/.test(userAgent)) {
            return 'Firefox';
        } else if (/Safari/.test(userAgent)) {
            return 'Safari';
        } else if (/Edge/.test(userAgent)) {
            return 'Edge';
        } else {
            return 'Trình duyệt khác';
        }
    }

    // Unbind device
    async unbindDevice(deviceId) {
        const confirmed = await this.showConfirmDialog(
            'Hủy liên kết thiết bị',
            'Bạn có chắc chắn muốn hủy liên kết thiết bị này? Thiết bị sẽ cần được phê duyệt lại để truy cập.'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/students/devices/${deviceId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đã hủy liên kết thiết bị', 'success');
                this.loadDevices(); // Reload devices list
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error unbinding device:', error);
            this.showToast('Không thể hủy liên kết thiết bị', 'error');
        }
    }

    // Load settings
    async loadSettings() {
        try {
            const response = await fetch('/api/settings/student');
            if (response.ok) {
                const data = await response.json();
                this.settings = data.settings || {};
                this.applySettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Apply settings to UI
    applySettings() {
        // Apply settings to all toggles
        const toggleSwitches = document.querySelectorAll('.toggle-switch[data-setting]');
        toggleSwitches.forEach(toggle => {
            const setting = toggle.dataset.setting;
            const checkbox = toggle.querySelector('input[type="checkbox"]');
            
            if (setting && checkbox) {
                // Set default values if not in settings
                if (this.settings[setting] === undefined) {
                    // Default settings
                    const defaults = {
                        'sound-effects': true,
                        'animations': true,
                        'study-reminders': true,
                        'achievement-notifications': true,
                        'public-profile': true,
                        'leaderboard-visible': true,
                        'progress-visible': true
                    };
                    this.settings[setting] = defaults[setting] !== undefined ? defaults[setting] : true;
                }
                
                // Apply the setting
                checkbox.checked = this.settings[setting];
                toggle.classList.toggle('active', this.settings[setting]);
            }
        });
        
        // Apply other settings like question time
        const questionTime = document.getElementById('question-time');
        if (questionTime && this.settings['question-time']) {
            questionTime.value = this.settings['question-time'];
        }
    }

    // Save preferences
    async savePreferences() {
        this.setButtonLoading('save-preferences', true);

        // Include question time in settings
        const questionTime = document.getElementById('question-time');
        if (questionTime) {
            this.settings['question-time'] = questionTime.value;
        }

        try {
            const response = await fetch('/api/settings/student', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings: this.settings })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đã lưu tùy chọn', 'success');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            this.showToast('Không thể lưu tùy chọn', 'error');
        } finally {
            this.setButtonLoading('save-preferences', false);
        }
    }

    // Save privacy settings
    async savePrivacySettings() {
        this.setButtonLoading('save-privacy', true);

        try {
            const response = await fetch('/api/settings/student/privacy', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings: this.settings })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đã lưu cài đặt quyền riêng tư', 'success');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error saving privacy settings:', error);
            this.showToast('Không thể lưu cài đặt', 'error');
        } finally {
            this.setButtonLoading('save-privacy', false);
        }
    }

    // Export user data
    async exportUserData() {
        this.setButtonLoading('export-data', true);

        try {
            const response = await fetch('/api/students/export-data');
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `du-lieu-hoc-tap-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showToast('Đã tải xuống dữ liệu', 'success');
            } else {
                const result = await response.json();
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Không thể xuất dữ liệu', 'error');
        } finally {
            this.setButtonLoading('export-data', false);
        }
    }

    // Request account deletion
    async requestAccountDeletion() {
        const confirmed = await this.showConfirmDialog(
            'Xóa tài khoản',
            'Bạn có chắc chắn muốn yêu cầu xóa tài khoản? Thao tác này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả dữ liệu của bạn.',
            'danger'
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/students/delete-request', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đã gửi yêu cầu xóa tài khoản. Quản trị viên sẽ xử lý trong vòng 24h.', 'info');
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error requesting account deletion:', error);
            this.showToast('Không thể gửi yêu cầu xóa tài khoản', 'error');
        }
    }

    // Logout from all devices
    async logoutAllDevices() {
        const confirmed = await this.showConfirmDialog(
            'Đăng xuất khỏi tất cả thiết bị',
            'Bạn có chắc chắn muốn đăng xuất khỏi tất cả thiết bị? Bạn sẽ cần đăng nhập lại.'
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/auth/logout-all', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Đã đăng xuất khỏi tất cả thiết bị', 'success');
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error logging out from all devices:', error);
            this.showToast('Không thể đăng xuất', 'error');
        }
    }

    // Utility functions
    setButtonLoading(formId, loading) {
        const form = document.getElementById(formId);
        if (!form) return;

        const button = form.querySelector('button[type="submit"], .btn-primary');
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = this.getToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    getToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Show confirmation dialog
    showConfirmDialog(title, message, type = 'primary') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            modal.innerHTML = `
                <div class="confirmation-content">
                    <div class="confirmation-icon">
                        <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'question-circle'}"></i>
                    </div>
                    <h3 class="confirmation-title">${title}</h3>
                    <p class="confirmation-message">${message}</p>
                    <div class="confirmation-actions">
                        <button class="btn btn-secondary" data-action="cancel">Hủy</button>
                        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" data-action="confirm">Xác nhận</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show modal
            setTimeout(() => modal.classList.add('active'), 10);

            // Handle actions
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('confirmation-modal') || 
                    e.target.dataset.action === 'cancel') {
                    modal.classList.remove('active');
                    setTimeout(() => modal.remove(), 300);
                    resolve(false);
                } else if (e.target.dataset.action === 'confirm') {
                    modal.classList.remove('active');
                    setTimeout(() => modal.remove(), 300);
                    resolve(true);
                }
            });
        });
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});

// Make functions globally available for onclick handlers
window.unbindDevice = (deviceId) => {
    if (window.settingsManager) {
        window.settingsManager.unbindDevice(deviceId);
    }
};