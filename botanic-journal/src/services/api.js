const API_BASE_URL = 'http://localhost/botanic-journal/botanic-journal/backend/api';

class ApiService {

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Add this helper method to get current user ID
    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || localStorage.getItem('user_id') || 1;
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

        try {
            const response = await fetch(url, config);
            
            // First, get the response as text to handle both JSON and HTML
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                // If it's not JSON, it's probably an HTML error
                console.error('API returned non-JSON response:', responseText.substring(0, 200));
                throw new Error(`Server error: Received HTML instead of JSON. Check your API endpoint.`);
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Plants
    async getPlants() {
        const user_id = this.getCurrentUserId();
        return this.request(`plants.php?user_id=${user_id}`);
    }

    async createPlant(plantData) {
        const user_id = this.getCurrentUserId();
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

    // TASKS - UPDATED METHODS WITH USER_ID
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
            body: { 
                ...taskData, 
                user_id: user_id
            }
        });
    }

    // FIXED: Changed from PUT to PATCH for task updates
    async updateTask(id, taskData) {
        const user_id = this.getCurrentUserId();
        return this.request('tasks.php', {
            method: 'PATCH', // Changed from PUT to PATCH
            body: { 
                id: id,
                ...taskData, 
                user_id: user_id 
            }
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

    // Journals
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

    // Stats
    async getStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`stats.php?user_id=${user_id}`);
    }

    // Weather
    async getWeather() {
        return this.request('weather.php');
    }

    async updateWeather(weatherData) {
        return this.request('weather.php', {
            method: 'POST',
            body: weatherData
        });
    }

    // Analytics
    async getAnalytics() {
        const user_id = this.getCurrentUserId();
        return this.request(`analytics.php?user_id=${user_id}`);
    }

    // User
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

    async getPlantsEncyclopedia() {
        return this.request('plants-encyclopedia.php');
    }

    async getPlantDetails(plantId) {
    const user_id = this.getCurrentUserId();
    return this.request(`plants.php?id=${plantId}&user_id=${user_id}`);
}

    // Profile
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
        const url = `${this.baseURL}/upload-avatar.php`;
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

    // AUTHENTICATION METHODS
    async login(loginData) {
        return this.request('auth.php', {
            method: 'POST',
            body: { ...loginData, action: 'login' }
        });
    }

    async register(registerData) {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...dataToSend } = registerData;
        return this.request('auth.php', {
            method: 'POST',
            body: { ...dataToSend, action: 'register' }
        });
    }

    async logout() {
        return this.request('auth.php', {
            method: 'POST',
            body: { action: 'logout' }
        });
    }

    // Additional user-related methods
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

    // Admin methods
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

    // NEW METHOD: Get sample tasks for demonstration
    async getSampleTasks() {
        // This returns sample tasks structure that matches your database
        return {
            success: true,
            data: [
                {
                    id: 1,
                    user_id: this.getCurrentUserId(),
                    plant_id: 3,
                    plant_name: 'Cherry Tomato',
                    title: 'Water Tomato Plants',
                    description: 'Tomatoes are looking dry and need immediate watering',
                    priority: 'high',
                    due_date: new Date().toISOString().split('T')[0],
                    completed: false,
                    progress: 15,
                    type: 'watering',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2,
                    user_id: this.getCurrentUserId(),
                    plant_id: 1,
                    plant_name: 'Monstera Deliciosa',
                    title: 'Check for pests on Monstera',
                    description: 'Look for signs of spider mites or aphids',
                    priority: 'high',
                    due_date: new Date().toISOString().split('T')[0],
                    completed: false,
                    progress: 5,
                    type: 'pest_control',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]
        };
    }

    // NEW METHOD: Test API connection
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/tasks.php?user_id=1`);
            const text = await response.text();
            console.log('API Test Response:', text.substring(0, 200));
            return text;
        } catch (error) {
            console.error('API Connection Test Failed:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();  