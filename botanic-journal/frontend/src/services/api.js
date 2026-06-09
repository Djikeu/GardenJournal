// Centralni servis za svu komunikaciju s backendom
const API_BASE_URL = 'http://localhost/botanic-journal/botanic-journal/backend/api';

if (typeof window !== 'undefined' && !window.__bjFetchPatched) {
    window.__bjFetchPatched = true;
    const __origFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        try {
            const url = typeof input === 'string' ? input : (input && input.url) || '';
            const token = localStorage.getItem('token');
            if (token && url.indexOf('/backend/api/') !== -1) {
                init = { ...init, headers: { ...(init && init.headers), Authorization: `Bearer ${token}` } };
            }
        } catch (e) { /* ignore */ }
        return __origFetch(input, init);
    };
}

class ApiService {

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    checkCommunityAuth() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            throw new Error('You must be logged in to access community features');
        }
        return user;
    }

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

            const responseText = await response.text();

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
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

    async getPlants() {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/plants.php?user_id=${user_id}`);
    }

    async createPlant(plantData) {
        const user_id = this.getCurrentUserId();
        return this.request('plants/plants.php', {
            method: 'POST',
            body: { ...plantData, user_id }
        });
    }

    async updatePlant(id, plantData) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/plants.php?id=${id}`, {
            method: 'PUT',
            body: { ...plantData, user_id }
        });
    }

    async deletePlant(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/plants.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async toggleFavorite(plantId, isFavorite) {
        const user_id = this.getCurrentUserId();
        return this.request('plants/plants.php', {
            method: 'PATCH',
            body: { id: plantId, is_favorite: isFavorite, user_id }
        });
    }

    async getTasks() {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/tasks.php?user_id=${user_id}`);
    }

    async getTask(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/tasks.php?id=${id}&user_id=${user_id}`);
    }

    async createTask(taskData) {
        const user_id = this.getCurrentUserId();
        return this.request('plants/tasks.php', {
            method: 'POST',
            body: {
                ...taskData,
                user_id: user_id
            }
        });
    }

    async updateTask(id, taskData) {
        const user_id = this.getCurrentUserId();
        return this.request('plants/tasks.php', {
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
        return this.request('plants/tasks.php', {
            method: 'PATCH',
            body: { id: taskId, completed: true, user_id }
        });
    }

    async deleteTask(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/tasks.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async getJournals() {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/journals.php?user_id=${user_id}`);
    }

    async getJournal(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/journals.php?id=${id}&user_id=${user_id}`);
    }

    async createJournal(journalData) {
        const user_id = this.getCurrentUserId();
        return this.request('plants/journals.php', {
            method: 'POST',
            body: { ...journalData, user_id }
        });
    }

    async updateJournal(id, journalData) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/journals.php?id=${id}`, {
            method: 'PUT',
            body: { ...journalData, user_id }
        });
    }

    async deleteJournal(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/journals.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async uploadJournalImage(file) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/journals.php?user_id=${user_id}&action=upload-image`;
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(url, { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
        return data.data.image_path;
    }

    async getStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`insights/stats.php?user_id=${user_id}`);
    }

    async getWeather() {
        return this.request('insights/weather.php');
    }

    async updateWeather(weatherData) {
        return this.request('insights/weather.php', {
            method: 'POST',
            body: weatherData
        });
    }

    async getAnalytics() {
        const user_id = this.getCurrentUserId();
        return this.request(`insights/analytics.php?user_id=${user_id}`);
    }

    async getUserProfile() {
        const user_id = this.getCurrentUserId();
        return this.request(`users/user.php?user_id=${user_id}`);
    }

    async updateUserProfile(userData) {
        const user_id = this.getCurrentUserId();
        return this.request('users/user.php', {
            method: 'PUT',
            body: { ...userData, user_id }
        });
    }

    async getPlantsEncyclopedia() {
        return this.request('plants/plants-encyclopedia.php');
    }

    async getPlantDetails(plantId) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/plants.php?id=${plantId}&user_id=${user_id}`);
    }

    async getProfile() {
        const user_id = this.getCurrentUserId();
        return this.request(`users/profile.php?user_id=${user_id}`);
    }

    async uploadAvatar(formData) {
    const user_id = this.getCurrentUserId();
    const url = `${this.baseURL}/users/update-avatar.php?user_id=${user_id}`;

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

    async updateProfile(userId, userData) {
        const url = `${this.baseURL}/users/user-dashboard.php?user_id=${userId}`;
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

    async getUserStats() {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/users/user-stats.php?user_id=${user_id}`;
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

    async login(loginData) {
        return this.request('users/auth.php', {
            method: 'POST',
            body: { ...loginData, action: 'login' }
        });
    }

    async register(registerData) {
        const { confirmPassword, ...dataToSend } = registerData;
        return this.request('users/auth.php', {
            method: 'POST',
            body: { ...dataToSend, action: 'register' }
        });
    }

    async resetPassword(email, password) {
        return this.request('users/auth.php', {
            method: 'POST',
            body: { action: 'reset_password', email, password }
        });
    }

    async logout() {
        return this.request('users/auth.php', {
            method: 'POST',
            body: { action: 'logout' }
        });
    }

    async changePassword(passwordData) {
        const user_id = this.getCurrentUserId();
        return this.request('users/user.php', {
            method: 'PATCH',
            body: { ...passwordData, user_id }
        });
    }

    async getActivityHistory() {
        const user_id = this.getCurrentUserId();
        return this.request(`activity.php?user_id=${user_id}`);
    }

    async getAdminUsers(page = 1, limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/users.php?user_id=${user_id}&page=${page}&limit=${limit}`);
    }

    async getAdminStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/stats.php?user_id=${user_id}`);
    }

    async getAdminPlants(page = 1, limit = 50, search = '') {
        const user_id = this.getCurrentUserId();
        let url = `admin/plants.php?user_id=${user_id}&page=${page}&limit=${limit}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return this.request(url);
    }

    async createAdminPlant(formData) {
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
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/admin/plants.php?id=${plantId}&user_id=${user_id}`;

        const config = {
            method: 'POST', // Use POST with _method=PUT for form data
            body: formData,
        };

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
        return this.request(`admin/users.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { id: userId, is_active: isActive, user_id: user_id }
        });
    }

    async updateUserRole(userId, role) {
        const user_id = this.getCurrentUserId();
        return this.request(`admin/users.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { id: userId, role: role, user_id: user_id }
        });
    }

    async submitPlantRequest(formData) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/plant-requests.php?user_id=${user_id}`; // add user_id here
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

    async getMyPlantRequests(filter = 'all') {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/plant-requests.php?user_id=${user_id}&filter=${filter}&my_requests=true`;

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

    async getPlantRequests(filter = 'pending') {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/plant-requests.php?user_id=${user_id}&filter=${filter}&admin=true`;

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

    async approvePlantRequest(requestId, data) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/plant-requests.php?id=${requestId}&user_id=${user_id}`;

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

    async rejectPlantRequest(requestId, data) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/plants/plant-requests.php?id=${requestId}&user_id=${user_id}`;

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

    async getSampleTasks() {
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

    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/plants/tasks.php?user_id=1`);
            const text = await response.text();
            console.log('API Test Response:', text.substring(0, 200));
            return text;
        } catch (error) {
            console.error('API Connection Test Failed:', error);
            throw error;
        }
    }

    async getCommunityCategories() {
        return this.request('community/categories.php');
    }

    async getDiscussions(params = {}) {
        const user_id = this.getCurrentUserId();
        const queryParams = new URLSearchParams({
            user_id: user_id,
            ...params
        });
        return this.request(`community/discussions.php?${queryParams}`);
    }

    async getDiscussion(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}&user_id=${user_id}`);
    }

    async createDiscussion(discussionData) {
        const user_id = this.getCurrentUserId();
        return this.request('community/discussions.php', {
            method: 'POST',
            body: { ...discussionData, user_id }
        });
    }

    async getReplies(discussionId, page = 1, limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?discussion_id=${discussionId}&page=${page}&limit=${limit}&user_id=${user_id}`);
    }

    async createReply(replyData) {
        const user_id = this.getCurrentUserId();
        return this.request('community/replies.php', {
            method: 'POST',
            body: { ...replyData, user_id }
        });
    }

    async getCommunityStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/stats.php?user_id=${user_id}`);
    }

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

    async addBookmark(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request('community/bookmarks.php', {
            method: 'POST',
            body: { discussion_id: discussionId, user_id }
        });
    }

    async removeBookmark(discussionId) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/bookmarks.php?discussion_id=${discussionId}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async getBookmarks() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/bookmarks.php?user_id=${user_id}`);
    }

    async searchDiscussions(query, category = null) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ q: query, user_id });
        if (category) params.append('category', category);

        return this.request(`community/search.php?${params}`);
    }

    async getUserDiscussions() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/user-discussions.php?user_id=${user_id}`);
    }

    async updateDiscussion(id, discussionData) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}`, {
            method: 'PUT',
            body: { ...discussionData, user_id }
        });
    }

    async deleteDiscussion(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/discussions.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async updateReply(id, replyData) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?id=${id}`, {
            method: 'PUT',
            body: { ...replyData, user_id }
        });
    }

    async deleteReply(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/replies.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async getTrendingDiscussions() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/trending.php?user_id=${user_id}`);
    }

    async getLatestActivity() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/activity.php?user_id=${user_id}`);
    }

    async markNotificationsAsRead() {
        const user_id = this.getCurrentUserId();
        return this.request('community/notifications.php', {
            method: 'PATCH',
            body: { user_id, action: 'mark_all_read' }
        });
    }

    async getNotifications() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/notifications.php?user_id=${user_id}`);
    }

    async followUser(userIdToFollow) {
        const user_id = this.getCurrentUserId();
        return this.request('community/follow.php', {
            method: 'POST',
            body: { user_id, follow_user_id: userIdToFollow }
        });
    }

    async unfollowUser(userIdToUnfollow) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/follow.php?follow_user_id=${userIdToUnfollow}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async getFollowData() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/follow.php?user_id=${user_id}`);
    }

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

    async getUserBadges() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/badges.php?user_id=${user_id}`);
    }

    async getDiscussionTags() {
        return this.request('community/tags.php');
    }

    async getDiscussionsByTag(tagName) {
        const user_id = this.getCurrentUserId();
        return this.request(`community/tags.php?tag=${encodeURIComponent(tagName)}&user_id=${user_id}`);
    }

    async getUserCommunityStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`community/user-stats.php?user_id=${user_id}`);
    }

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

    async diagnosePlant({ imageFile, notes = '', plantId = null }) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/ai/plant-doctor.php?user_id=${user_id}`;

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
        return this.request(`ai/plant-doctor.php?user_id=${user_id}`);
    }

    async getDiagnosis(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-doctor.php?id=${id}&user_id=${user_id}`);
    }

    async deleteDiagnosis(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-doctor.php?id=${id}&user_id=${user_id}`, {
            method: 'DELETE'
        });
    }

    async getChatConversations() {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-chat.php?user_id=${user_id}`);
    }

    async getChatMessages(conversationId) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-chat.php?user_id=${user_id}&conversation_id=${conversationId}`);
    }

    async sendChatMessage(message, conversationId = null) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-chat.php?user_id=${user_id}`, {
            method: 'POST',
            body: { message, conversation_id: conversationId }
        });
    }

    async renameChatConversation(conversationId, title) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-chat.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { conversation_id: conversationId, title }
        });
    }

    async deleteChatConversation(conversationId) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-chat.php?user_id=${user_id}&conversation_id=${conversationId}`, {
            method: 'DELETE'
        });
    }

    async getDetectiveSnapshot() {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-detective.php?user_id=${user_id}`);
    }

    async getDetectiveStats() {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-detective.php?user_id=${user_id}&action=stats`);
    }

    async getDetectiveHistory(limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-detective.php?user_id=${user_id}&action=history&limit=${limit}`);
    }

    async newDetectiveCase(difficulty = null) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-detective.php?user_id=${user_id}&action=new`, {
            method: 'POST',
            body: difficulty ? { difficulty } : {},
        });
    }

    async submitDetectiveAnswer(caseId, chosenIndex) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/plant-detective.php?user_id=${user_id}&action=submit`, {
            method: 'POST',
            body: { case_id: caseId, chosen_index: chosenIndex },
        });
    }

    async getDailyCareNote({ weather = '', temp = '', humidity = '', force = false } = {}) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id });
        if (weather)  params.append('weather', weather);
        if (temp !== '' && temp != null)         params.append('temp', temp);
        if (humidity !== '' && humidity != null) params.append('humidity', humidity);
        if (force) params.append('force', '1');
        return this.request(`ai/daily-care-note.php?${params}`);
    }

    async getGardenMap(zone) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id });
        if (zone) params.append('zone', zone);
        return this.request(`plants/garden-map.php?${params}`);
    }

    async saveGardenMap(zone, placements) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/garden-map.php?user_id=${user_id}`, {
            method: 'POST',
            body: { zone, placements }
        });
    }

    async clearGardenMapZone(zone) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/garden-map.php?user_id=${user_id}&zone=${zone}`, {
            method: 'DELETE'
        });
    }

    async generateGardenDesign({ zone, spaceDescription, preferences = '', count = 6 }) {
        const user_id = this.getCurrentUserId();
        return this.request(`ai/garden-map-design.php?user_id=${user_id}`, {
            method: 'POST',
            body: {
                zone,
                space_description: spaceDescription,
                preferences,
                count,
            },
        });
    }

    async getGardenMapTip(plantId, zone, force = false) {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id, plant_id: plantId, zone });
        if (force) params.append('force', '1');
        return this.request(`ai/garden-map-tip.php?${params}`);
    }

    async discoverGardeners(query = '') {
        const user_id = this.getCurrentUserId();
        const params = new URLSearchParams({ user_id, action: 'discover' });
        if (query) params.append('q', query);
        return this.request(`social/social.php?${params}`);
    }

    async getFollowing() {
        const user_id = this.getCurrentUserId();
        return this.request(`social/social.php?user_id=${user_id}&action=following`);
    }

    async getFollowers() {
        const user_id = this.getCurrentUserId();
        return this.request(`social/social.php?user_id=${user_id}&action=followers`);
    }

    async getPublicProfile(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/social.php?user_id=${user_id}&action=profile&target=${targetUserId}`);
    }

    async followUserById(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/social.php?user_id=${user_id}`, {
            method: 'POST',
            body: { target_user_id: targetUserId }
        });
    }

    async unfollowUserById(targetUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/social.php?user_id=${user_id}&target=${targetUserId}`, {
            method: 'DELETE'
        });
    }

    async getConversations() {
        const user_id = this.getCurrentUserId();
        return this.request(`social/direct-messages.php?user_id=${user_id}`);
    }

    async getConversation(otherUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/direct-messages.php?user_id=${user_id}&with=${otherUserId}`);
    }

    async sendDirectMessage(toUserId, content, attachment = null) {
        const user_id = this.getCurrentUserId();
        const body = { to: toUserId, content };
        if (attachment) {
            body.attachment_path = attachment.path;
            body.attachment_type = attachment.type;
        }
        return this.request(`social/direct-messages.php?user_id=${user_id}`, {
            method: 'POST',
            body,
        });
    }

    async uploadMessageAttachment(file) {
        const user_id = this.getCurrentUserId();
        const url = `${this.baseURL}/social/direct-messages.php?user_id=${user_id}&action=upload`;
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(url, { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
        return data;
    }

    async editDirectMessage(messageId, content) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/direct-messages.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { action: 'edit', message_id: messageId, content },
        });
    }

    async deleteDirectMessage(messageId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/direct-messages.php?user_id=${user_id}&message_id=${messageId}`, {
            method: 'DELETE',
        });
    }

    async markMessagesRead(fromUserId) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/direct-messages.php?user_id=${user_id}`, {
            method: 'PATCH',
            body: { from: fromUserId }
        });
    }

    async getUserNotifications(limit = 20) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/user-notifications.php?user_id=${user_id}&limit=${limit}`);
    }

    async getUnreadCount() {
        const user_id = this.getCurrentUserId();
        return this.request(`social/user-notifications.php?user_id=${user_id}&unread=1`);
    }

    async markAllNotificationsRead() {
        const user_id = this.getCurrentUserId();
        return this.request(`social/user-notifications.php?user_id=${user_id}`, { method: 'PATCH' });
    }

    async deleteNotification(id) {
        const user_id = this.getCurrentUserId();
        return this.request(`social/user-notifications.php?user_id=${user_id}&id=${id}`, { method: 'DELETE' });
    }

    async setJournalVisibility(journalId, isPublic) {
        const user_id = this.getCurrentUserId();
        return this.request(`plants/journals.php?id=${journalId}&user_id=${user_id}`, {
            method: 'PATCH',
            body: { id: journalId, is_public: isPublic ? 1 : 0, user_id }
        });
    }

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
