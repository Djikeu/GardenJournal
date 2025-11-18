const API_BASE_URL = 'http://localhost/botanic-journal/botanic-journal/backend/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
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
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Plants
    async getPlants() {
        return this.request('plants.php');
    }

    async getPlant(id) {
        return this.request(`plants.php?id=${id}`);
    }

    async createPlant(plantData) {
        return this.request('plants.php', {
            method: 'POST',
            body: plantData
        });
    }

    async updatePlant(id, plantData) {
        return this.request(`plants.php?id=${id}`, {
            method: 'PUT',
            body: plantData
        });
    }

    async deletePlant(id) {
        return this.request(`plants.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    async toggleFavorite(plantId, isFavorite) {
        return this.request('plants.php', {
            method: 'PATCH',
            body: { id: plantId, is_favorite: isFavorite }
        });
    }

    // Tasks
    async getTasks() {
        return this.request('tasks.php');
    }

    async getTask(id) {
        return this.request(`tasks.php?id=${id}`);
    }

    async createTask(taskData) {
        return this.request('tasks.php', {
            method: 'POST',
            body: taskData
        });
    }

    async updateTask(id, taskData) {
        return this.request(`tasks.php?id=${id}`, {
            method: 'PUT',
            body: taskData
        });
    }

    async completeTask(taskId) {
    return this.request('tasks.php', {
        method: 'PATCH',
        body: { id: taskId, completed: true }
    });
}

    async deleteTask(id) {
        return this.request(`tasks.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Journals
    async getJournals() {
        return this.request('journals.php');
    }

    async getJournal(id) {
        return this.request(`journals.php?id=${id}`);
    }

    async createJournal(journalData) {
        return this.request('journals.php', {
            method: 'POST',
            body: journalData
        });
    }

    async updateJournal(id, journalData) {
        return this.request(`journals.php?id=${id}`, {
            method: 'PUT',
            body: journalData
        });
    }

    async deleteJournal(id) {
        return this.request(`journals.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Stats
    async getStats() {
        return this.request('stats.php');
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
        return this.request('analytics.php');
    }

    // User
    async getUserProfile() {
        return this.request('user.php');
    }

    async updateUserProfile(userData) {
        return this.request('user.php', {
            method: 'PUT',
            body: userData
        });
    }

    async getPlantsEncyclopedia() {
        return this.request('plants-encyclopedia.php');
    }
}

export const apiService = new ApiService();