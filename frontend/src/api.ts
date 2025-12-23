/**
 * API service for Wealth Tracker
 */

import type { WealthSummary, AccountView, TimelineResponse, WebhookResponse, WebhookPayload } from './types';

const API_BASE_URL = 'http://localhost:3000';

class ApiService {
  async getWealthSummary(userId: string): Promise<WealthSummary> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/wealth/summary`);
    if (!response.ok) {
      throw new Error(`Failed to fetch summary: ${response.statusText}`);
    }
    return response.json() as Promise<WealthSummary>;
  }

  async getAccountViews(userId: string): Promise<AccountView[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/wealth/accounts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    return response.json() as Promise<AccountView[]>;
  }

  async getTimeline(userId: string, limit: number = 50, cursor: string | null = null): Promise<TimelineResponse> {
    let url = `${API_BASE_URL}/users/${userId}/wealth/timeline?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch timeline: ${response.statusText}`);
    }
    return response.json() as Promise<TimelineResponse>;
  }

  async sendWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
    const response = await fetch(`${API_BASE_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error((error as { message?: string }).message || `Failed to send webhook: ${response.statusText}`);
    }

    return response.json() as Promise<WebhookResponse>;
  }
}

// Create and expose global instance
const apiService = new ApiService();
window.apiService = apiService;
