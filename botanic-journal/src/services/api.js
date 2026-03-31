const API_BASE_URL = 'http://localhost/botanic-journal/botanic-journal/backend/api';

class ApiService {

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper method to check if user is authenticated for community
    checkCommunityAuth() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            throw new Error('You must be logged in to access community features');
        }
        return user;
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

    // Get community categories
    async getCommunityCategories() {
        return this.request('community/categories.php');
    }

    // Get discussions with optional filters
    async getDiscussions(params = {}) {
        const user_id = this.getCurrentUserId();
        const queryParams = new URLSearchParams({
            user_id: user_id,
            ...params
        });
        return this.request(`community/discussions.php?${queryParams}`);
    }

    // Get single discussion by ID
    async getDiscussion(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}&user_id=${user_id}`);
    }

    // Create new discussion
    async createDiscussion(discussionData) {
        const user_id = this.getCurrentUserId();
        return this.request('community/discussions.php', {
            method: 'POST',
            body: { ...discussionData, user_id }
        });
    }

    // Get replies for a discussion
    async getReplies(discussionId, page = 1, limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?discussion_id=${discussionId}&page=${page}&limit=${limit}&user_id=${user_id}`);
    }

    // Create reply to a discussion
    async createReply(replyData) {
        const user_id = this.getCurrentUserId();
        return this.request('community/replies.php', {
            method: 'POST',
            body: { ...replyData, user_id }
        });
    }

    // Get community statistics
    async getCommunityStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/stats.php?user_id=${user_id}`);
    }

    // Add these methods to your ApiService class in apiService.js

    // Like/unlike discussion
    async likeDiscussion(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request('community/likes.php', {
            method: 'POST',
            body: { discussion_id: discussionId, user_id }
        });
    }

    async unlikeDiscussion(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/likes.php?discussion_id=${discussionId}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Like/unlike reply
    async likeReply(replyId) {
        const user_id = this.getCurrentUserId();
        return this.request('community/likes.php', {
            method: 'POST',
            body: { reply_id: replyId, user_id }
        });
    }

    async unlikeReply(replyId) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/likes.php?reply_id=${replyId}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Bookmark a discussion
    async addBookmark(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request('community/bookmarks.php', {
            method: 'POST',
            body: { discussion_id: discussionId, user_id }
        });
    }

    // Remove bookmark from a discussion
    async removeBookmark(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/bookmarks.php?discussion_id=${discussionId}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Get user's bookmarked discussions
    async getBookmarks() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/bookmarks.php?user_id=${user_id}`);
    }

    // Search discussions
    async searchDiscussions(query, category = null) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ q: query, user_id });
        if (category) params.append('category', category);

        return this.request(`community/search.php?${params}`);
    }

    // Get user's discussions
    async getUserDiscussions() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/user-discussions.php?user_id=${user_id}`);
    }

    // Update discussion (edit)
    async updateDiscussion(id, discussionData) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}`, {
            method: 'PUT',
            body: { ...discussionData, user_id }
        });
    }

    // Delete discussion
    async deleteDiscussion(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Update reply (edit)
    async updateReply(id, replyData) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?id=${id}`, {
            method: 'PUT',
            body: { ...replyData, user_id }
        });
    }

    // Delete reply
    async deleteReply(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Get trending discussions
    async getTrendingDiscussions() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/trending.php?user_id=${user_id}`);
    }

    // Get latest activity
    async getLatestActivity() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/activity.php?user_id=${user_id}`);
    }

    // Mark all notifications as read
    async markNotificationsAsRead() {
        const user_id = this.getCurrentUserId();
        return this.request('community/notifications.php', {
            method: 'PATCH',
            body: { user_id, action: 'mark_all_read' }
        });
    }

    // Get user notifications
    async getNotifications() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/notifications.php?user_id=${user_id}`);
    }

    // Follow a user
    async followUser(userIdToFollow) {
        const user_id = this.getCurrentUserId();
        return this.request('community/follow.php', {
            method: 'POST',
            body: { user_id, follow_user_id: userIdToFollow }
        });
    }

    // Unfollow a user
    async unfollowUser(userIdToUnfollow) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/follow.php?follow_user_id=${userIdToUnfollow}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // Get user's followed users and followers
    async getFollowData() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/follow.php?user_id=${user_id}`);
    }

    // Report content
    async reportContent(contentType, contentId, reason) {
        const user_id = this.getCurrentUserId();
        return this.request('community/reports.php', {
            method: 'POST',
            body: {
                user_id,
                content_type: contentType, // 'discussion' or 'reply'
                content_id: contentId,
                reason: reason
            }
        });
    }

    // Get user badges/achievements
    async getUserBadges() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/badges.php?user_id=${user_id}`);
    }

    // Get discussion tags
    async getDiscussionTags() {
        return this.request('community/tags.php');
    }

    // Get discussions by tag
    async getDiscussionsByTag(tagName) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/tags.php?tag=${encodeURIComponent(tagName)}&user_id=${user_id}`);
    }

    // Get user statistics for community
    async getUserCommunityStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/user-stats.php?user_id=${user_id}`);
    }

    // Pin/Unpin discussion (admin/moderator)
    async togglePinDiscussion(discussionId, pinStatus) {
        const user_id = this.getCurrentUserId();
        return this.request('community/moderate.php', {
            method: 'POST',
            body: {
                user_id,
                discussion_id: discussionId,
                action: pinStatus ? 'pin' : 'unpin'
            }
        });
    }

    // Lock/Unlock discussion (admin/moderator)
    async toggleLockDiscussion(discussionId, lockStatus) {
        const user_id = this.getCurrentUserId();
        return this.request('community/moderate.php', {
            method: 'POST',
            body: {
                user_id,
                discussion_id: discussionId,
                action: lockStatus ? 'lock' : 'unlock'
            }
        });
    }

    // Upload image for discussion or reply
    async uploadCommunityImage(formData) {
        const url = `${this.baseURL}/community/upload.php`;
        const config = {
            method: 'POST',
            body: formData,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Image upload failed');
            }

            return data;
        } catch (error) {
            console.error('Community Image Upload Error:', error);
            throw error;
        }
    }

}

export const apiService = new ApiService();  