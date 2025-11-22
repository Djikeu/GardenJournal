const API_BASE_URL = 'http://localhost/botanic-journal/botanic-journal/backend/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper method to get current user ID with validation
    getCurrentUserId() {
        const user_id = localStorage.getItem('user_id');
        console.log('🔍 Getting current user ID:', user_id);
        
        if (!user_id || user_id === 'null' || user_id === 'undefined') {
            console.error('❌ No valid user_id found in localStorage');
            // Don't redirect automatically, let the component handle it
            throw new Error('User not authenticated. Please log in.');
        }
        
        return user_id;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        // DEBUG: Log the request
        console.log('🔧 API Request:', {
            url: url,
            method: config.method || 'GET',
            body: config.body
        });

        try {
            const response = await fetch(url, config);

            // Check if response is HTML error instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned HTML instead of JSON. Response: ${text.substring(0, 100)}`);
            }

            const data = await response.json();

            // DEBUG: Log the response
            console.log('✅ API Response:', {
                url: url,
                status: response.status,
                data: data
            });

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // Plants - DYNAMIC user_id
    async getPlants() {
        const user_id = this.getCurrentUserId();
        console.log('🌿 Getting plants for user:', user_id);
        return this.request(`plants.php?user_id=${user_id}`);
    }

    async createPlant(plantData) {
        const user_id = this.getCurrentUserId();
        console.log('➕ Creating plant for user:', user_id, plantData);
        return this.request('plants.php', {
            method: 'POST',
            body: { ...plantData, user_id }
        });
    }

    async updatePlant(id, plantData) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants.php?id=${id}`, {
            method: 'PUT',
            body: { ...plantData, user_id }
        });
    }

    async deletePlant(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async toggleFavorite(plantId, isFavorite) {
        const user_id = this.getCurrentUserId();
        return this.request('plants.php', {
            method: 'PATCH',
            body: { id: plantId, is_favorite: isFavorite, user_id }
        });
    }

    // Plants Encyclopedia - DYNAMIC user_id
    async getPlantsEncyclopedia() {
        const user_id = this.getCurrentUserId();
        console.log('📚 Getting encyclopedia plants for user:', user_id);
        return this.request(`plants.php?encyclopedia=1&user_id=${user_id}`);
    }

    // Tasks - DYNAMIC user_id
    async getTasks() {
        const user_id = this.getCurrentUserId();
        return this.request(`tasks.php?user_id=${user_id}`);
    }

    async getTask(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`tasks.php?id=${id}&user_id=${user_id}`);
    }

    async createTask(taskData) {
        const user_id = this.getCurrentUserId();
        return this.request('tasks.php', {
            method: 'POST',
            body: { ...taskData, user_id }
        });
    }

    async updateTask(id, taskData) {
        const user_id = this.getCurrentUserId();
        return this.request(`tasks.php?id=${id}`, {
            method: 'PUT',
            body: { ...taskData, user_id }
        });
    }

    async completeTask(taskId) {
        const user_id = this.getCurrentUserId();
        return this.request('tasks.php', {
            method: 'PATCH',
            body: { id: taskId, completed: true, user_id }
        });
    }

    async deleteTask(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`tasks.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Journals - DYNAMIC user_id
    async getJournals() {
        const user_id = this.getCurrentUserId();
        return this.request(`journals.php?user_id=${user_id}`);
    }

    async getJournal(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`journals.php?id=${id}&user_id=${user_id}`);
    }

    async createJournal(journalData) {
        const user_id = this.getCurrentUserId();
        return this.request('journals.php', {
            method: 'POST',
            body: { ...journalData, user_id }
        });
    }

    async updateJournal(id, journalData) {
        const user_id = this.getCurrentUserId();
        return this.request(`journals.php?id=${id}`, {
            method: 'PUT',
            body: { ...journalData, user_id }
        });
    }

    async deleteJournal(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`journals.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Stats - DYNAMIC user_id
    async getStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`stats.php?user_id=${user_id}`);
    }

    // Weather - No user_id needed
    async getWeather() {
        return this.request('weather.php');
    }

    async updateWeather(weatherData) {
        return this.request('weather.php', {
            method: 'POST',
            body: weatherData
        });
    }

    // Analytics - DYNAMIC user_id
    async getAnalytics() {
        const user_id = this.getCurrentUserId();
        return this.request(`analytics.php?user_id=${user_id}`);
    }

    // User - DYNAMIC user_id
    async getUserProfile() {
        const user_id = this.getCurrentUserId();
        return this.request(`user.php?user_id=${user_id}`);
    }

    async updateUserProfile(userData) {
        const user_id = this.getCurrentUserId();
        return this.request('user.php', {
            method: 'PUT',
            body: { ...userData, user_id }
        });
    }

    // Profile - DYNAMIC user_id
    async getProfile() {
        const user_id = this.getCurrentUserId();
        return this.request(`profile.php?user_id=${user_id}`);
    }

    async updateProfile(profileData) {
        const user_id = this.getCurrentUserId();
        return this.request('profile.php', {
            method: 'PUT',
            body: { ...profileData, user_id }
        });
    }

    async uploadAvatar(formData) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/upload-avatar.php?user_id=${user_id}`;
        const config = {
            method: 'POST',
            body: formData,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Avatar upload failed');
            }

            return data;
        } catch (error) {
            console.error('Avatar Upload Error:', error);
            throw error;
        }
    }

    // AUTHENTICATION METHODS - No user_id needed for login/register
    async login(loginData) {
        return this.request('auth.php', {
            method: 'POST',
            body: { ...loginData, action: 'login' }
        });
    }

    async register(registerData) {
        const { confirmPassword, ...dataToSend } = registerData;
        return this.request('auth.php', {
            method: 'POST',
            body: { ...dataToSend, action: 'register' }
        });
    }

    async logout() {
        const user_id = this.getCurrentUserId();
        return this.request('auth.php', {
            method: 'POST',
            body: { action: 'logout', user_id }
        });
    }

    // Additional user-related methods - DYNAMIC user_id
    async changePassword(passwordData) {
        const user_id = this.getCurrentUserId();
        return this.request('user.php', {
            method: 'PATCH',
            body: { ...passwordData, user_id }
        });
    }

    async getActivityHistory() {
        const user_id = this.getCurrentUserId();
        return this.request(`activity.php?user_id=${user_id}`);
    }

    async getUserStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`user-stats.php?user_id=${user_id}`);
    }

    // Admin methods - No user_id needed (admin endpoints)
    async getAdminUsers() {
        return this.request('admin/users.php');
    }

    async getAdminStats() {
        return this.request('admin/stats.php');
    }

    async toggleUserStatus(userId, isActive) {
        return this.request('admin/users.php', {
            method: 'PATCH',
            body: { id: userId, is_active: isActive }
        });
    }

    async updateUserRole(userId, role) {
        return this.request('admin/users.php', {
            method: 'PATCH',
            body: { id: userId, role: role }
        });
    }
}

export const apiService = new ApiService();