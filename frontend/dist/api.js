"use strict";
/**
 * API service for Wealth Tracker
 */
const API_BASE_URL = 'http://localhost:3000';
class ApiService {
    async getWealthSummary(userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wealth/summary`);
        if (!response.ok) {
            throw new Error(`Failed to fetch summary: ${response.statusText}`);
        }
        return response.json();
    }
    async getAccountViews(userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wealth/accounts`);
        if (!response.ok) {
            throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }
        return response.json();
    }
    async getTimeline(userId, limit = 50, cursor = null) {
        let url = `${API_BASE_URL}/users/${userId}/wealth/timeline?limit=${limit}`;
        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch timeline: ${response.statusText}`);
        }
        return response.json();
    }
    async sendWebhook(payload) {
        const response = await fetch(`${API_BASE_URL}/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to send webhook: ${response.statusText}`);
        }
        return response.json();
    }
}
// Create and expose global instance
const apiService = new ApiService();
window.apiService = apiService;
//# sourceMappingURL=api.js.map