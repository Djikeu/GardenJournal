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


    async uploadAvatar(formData) {
    const user_id = this.getCurrentUserId();
    // Change "upload-avatar.php" → "update-avatar.php"
    const url = `${this.baseURL}/update-avatar.php?user_id=${user_id}`;

    const config = {
        method: 'POST',
        body: formData,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Avatar upload failed');
        }

        return data;
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        throw error;
    }
}

    // Update profile - with user ID
    async updateProfile(userId, userData) {
        const url = `${this.baseURL}/user-dashboard.php?user_id=${userId}`;
        const config = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: userData.name,  // Map 'name' to 'username' for backend
                email: userData.email,
                avatar: userData.avatar
            })
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Profile update failed');
            }

            return data;
        } catch (error) {
            console.error('Profile Update Error:', error);
            throw error;
        }
    }

    // Get user statistics (totals, completion rate, streak, recent activity)
    async getUserStats() {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/user-stats.php?user_id=${user_id}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch stats');
            }

            return data;
        } catch (error) {
            console.error('Get User Stats Error:', error);
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



    // Admin methods
    async getAdminUsers(page = 1, limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/users.php?user_id=${user_id}&page=${page}&limit=${limit}`);
    }

    async getAdminStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/stats.php?user_id=${user_id}`);
    }


    // In your apiService.js, replace these admin methods:

    async getAdminPlants(page = 1, limit = 50, search = '') {
        const user_id = this.getCurrentUserId();
        let url = `admin/plants.php?user_id=${user_id}&page=${page}&limit=${limit}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return this.request(url);
    }

    async createAdminPlant(formData) {
        // This method should accept FormData, not JSON
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/admin/plants.php?user_id=${user_id}`;

        const config = {
            method: 'POST',
            body: formData, // Don't set Content-Type, browser will set it with boundary
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Plant creation failed');
            }

            return data;
        } catch (error) {
            console.error('Create Admin Plant Error:', error);
            throw error;
        }
    }

    async updateAdminPlant(plantId, formData) {
        // This method should also accept FormData
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/admin/plants.php?id=${plantId}&user_id=${user_id}`;

        const config = {
            method: 'POST', // Use POST with _method=PUT for form data
            body: formData,
        };

        // Add _method field to formData to indicate PUT
        formData.append('_method', 'PUT');

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Plant update failed');
            }

            return data;
        } catch (error) {
            console.error('Update Admin Plant Error:', error);
            throw error;
        }
    }

    async deleteAdminPlant(plantId) {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/plants.php?id=${plantId}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async toggleUserStatus(userId, isActive) {
        const user_id = this.getCurrentUserId();
        return this.request('admin/users.php', {
            method: 'PATCH',
            body: { id: userId, is_active: isActive, user_id: user_id }
        });
    }

    async updateUserRole(userId, role) {
        const user_id = this.getCurrentUserId();
        return this.request('admin/users.php', {
            method: 'PATCH',
            body: { id: userId, role: role, user_id: user_id }
        });
    }

    // ============================================
    // PLANT REQUESTS METHODS (NEW)
    // ============================================

    // Submit a new plant request
    async submitPlantRequest(formData) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-requests.php?user_id=${user_id}`; // add user_id here
        const config = {
            method: 'POST',
            body: formData,
        };
        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Plant request submission failed');
            }

            return data;
        } catch (error) {
            console.error('Submit Plant Request Error:', error);
            throw error;
        }
    }

    // Get user's own plant requests
    async getMyPlantRequests(filter = 'all') {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-requests.php?user_id=${user_id}&filter=${filter}&my_requests=true`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load your requests');
            }

            return data;
        } catch (error) {
            console.error('Get My Plant Requests Error:', error);
            throw error;
        }
    }

    // Get all plant requests (admin only)
    async getPlantRequests(filter = 'pending') {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-requests.php?user_id=${user_id}&filter=${filter}&admin=true`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load plant requests');
            }

            return data;
        } catch (error) {
            console.error('Get Plant Requests Error:', error);
            throw error;
        }
    }

    // Approve a plant request (admin only)
    async approvePlantRequest(requestId, data) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-requests.php?id=${requestId}&user_id=${user_id}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'approve',
                    status: data.status,
                    admin_notes: data.admin_notes
                })
            });
            const responseData = await response.json();

            if (!response.ok || !responseData.success) {
                throw new Error(responseData.message || 'Approval failed');
            }

            return responseData;
        } catch (error) {
            console.error('Approve Plant Request Error:', error);
            throw error;
        }
    }

    // Reject a plant request (admin only)
    async rejectPlantRequest(requestId, data) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-requests.php?id=${requestId}&user_id=${user_id}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reject',
                    status: data.status,
                    admin_notes: data.admin_notes
                })
            });
            const responseData = await response.json();

            if (!response.ok || !responseData.success) {
                throw new Error(responseData.message || 'Rejection failed');
            }

            return responseData;
        } catch (error) {
            console.error('Reject Plant Request Error:', error);
            throw error;
        }
    }

    // ============================================
    // END OF PLANT REQUESTS METHODS
    // ============================================

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

    // ============================================
    // PLANT DOCTOR (AI image diagnosis)
    // ============================================

    // Submit an image (and optional notes / plant_id) for AI diagnosis
    async diagnosePlant({ imageFile, notes = '', plantId = null }) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plant-doctor.php?user_id=${user_id}`;

        const formData = new FormData();
        formData.append('image', imageFile);
        if (notes) formData.append('notes', notes);
        if (plantId) formData.append('plant_id', plantId);

        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Diagnosis failed');
            }
            return data;
        } catch (error) {
            console.error('Diagnose Plant Error:', error);
            throw error;
        }
    }

    async getDiagnoses() {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-doctor.php?user_id=${user_id}`);
    }

    async getDiagnosis(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-doctor.php?id=${id}&user_id=${user_id}`);
    }

    async deleteDiagnosis(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-doctor.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // PLANT CHAT (Gemini assistant — multi-conversation)
    // ============================================
    async getChatConversations() {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-chat.php?user_id=${user_id}`);
    }

    async getChatMessages(conversationId) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-chat.php?user_id=${user_id}&conversation_id=${conversationId}`);
    }

    async sendChatMessage(message, conversationId = null) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-chat.php?user_id=${user_id}`, {
            method: 'POST',
            body: { message, conversation_id: conversationId }
        });
    }

    async renameChatConversation(conversationId, title) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-chat.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { conversation_id: conversationId, title }
        });
    }

    async deleteChatConversation(conversationId) {
        const user_id = this.getCurrentUserId();
        return this.request(`plant-chat.php?user_id=${user_id}&conversation_id=${conversationId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // DAILY CARE NOTE (Gemini-generated)
    // ============================================
    async getDailyCareNote({ weather = '', temp = '', humidity = '', force = false } = {}) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id });
        if (weather)  params.append('weather', weather);
        if (temp !== '' && temp != null)         params.append('temp', temp);
        if (humidity !== '' && humidity != null) params.append('humidity', humidity);
        if (force) params.append('force', '1');
        return this.request(`daily-care-note.php?${params}`);
    }

    // ============================================
    // GARDEN MAP DESIGNER (drag-and-drop placements per zone)
    // ============================================
    async getGardenMap(zone) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id });
        if (zone) params.append('zone', zone);
        return this.request(`garden-map.php?${params}`);
    }

    async saveGardenMap(zone, placements) {
        const user_id = this.getCurrentUserId();
        return this.request(`garden-map.php?user_id=${user_id}`, {
            method: 'POST',
            body: { zone, placements }
        });
    }

    async clearGardenMapZone(zone) {
        const user_id = this.getCurrentUserId();
        return this.request(`garden-map.php?user_id=${user_id}&zone=${zone}`, {
            method: 'DELETE'
        });
    }

    // AI Garden Designer — generate plant list + layout from space description
    async generateGardenDesign({ zone, spaceDescription, preferences = '', count = 6 }) {
        const user_id = this.getCurrentUserId();
        return this.request(`garden-map-design.php?user_id=${user_id}`, {
            method: 'POST',
            body: {
                zone,
                space_description: spaceDescription,
                preferences,
                count,
            },
        });
    }

    // AI microclimate tip for a single (plant, zone) pair
    async getGardenMapTip(plantId, zone, force = false) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id, plant_id: plantId, zone });
        if (force) params.append('force', '1');
        return this.request(`garden-map-tip.php?${params}`);
    }

    // ============================================
    // SOCIAL — discover, follow, public profiles
    // ============================================
    async discoverGardeners(query = '') {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id, action: 'discover' });
        if (query) params.append('q', query);
        return this.request(`social.php?${params}`);
    }

    async getFollowing() {
        const user_id = this.getCurrentUserId();
        return this.request(`social.php?user_id=${user_id}&action=following`);
    }

    async getFollowers() {
        const user_id = this.getCurrentUserId();
        return this.request(`social.php?user_id=${user_id}&action=followers`);
    }

    async getPublicProfile(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social.php?user_id=${user_id}&action=profile&target=${targetUserId}`);
    }

    async followUserById(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social.php?user_id=${user_id}`, {
            method: 'POST',
            body: { target_user_id: targetUserId }
        });
    }

    async unfollowUserById(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social.php?user_id=${user_id}&target=${targetUserId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // DIRECT MESSAGES
    // ============================================
    async getConversations() {
        const user_id = this.getCurrentUserId();
        return this.request(`direct-messages.php?user_id=${user_id}`);
    }

    async getConversation(otherUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`direct-messages.php?user_id=${user_id}&with=${otherUserId}`);
    }

    async sendDirectMessage(toUserId, content) {
        const user_id = this.getCurrentUserId();
        return this.request(`direct-messages.php?user_id=${user_id}`, {
            method: 'POST',
            body: { to: toUserId, content }
        });
    }

    async markMessagesRead(fromUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`direct-messages.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { from: fromUserId }
        });
    }

    // ============================================
    // JOURNAL VISIBILITY
    // ============================================
    // ============================================
    // USER NOTIFICATIONS (follows, DMs, etc.)
    // ============================================
    async getUserNotifications(limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`user-notifications.php?user_id=${user_id}&limit=${limit}`);
    }

    async getUnreadCount() {
        const user_id = this.getCurrentUserId();
        return this.request(`user-notifications.php?user_id=${user_id}&unread=1`);
    }

    async markAllNotificationsRead() {
        const user_id = this.getCurrentUserId();
        return this.request(`user-notifications.php?user_id=${user_id}`, { method: 'PATCH' });
    }

    async deleteNotification(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`user-notifications.php?user_id=${user_id}&id=${id}`, { method: 'DELETE' });
    }

    async setJournalVisibility(journalId, isPublic) {
        const user_id = this.getCurrentUserId();
        return this.request(`journals.php?id=${journalId}&user_id=${user_id}`, {
            method: 'PATCH',
            body: { id: journalId, is_public: isPublic ? 1 : 0, user_id }
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