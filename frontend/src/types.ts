/**
 * Type definitions for frontend
 */

export interface WealthSummary {
  userId: string;
  balancesByCurrency: Record<string, string>;
  cryptoPositions: Record<string, string>;
  valuation: {
    status: 'FULL' | 'PARTIAL';
    missingCryptoValuations: number;
  };
  lastUpdatedAt: string;
}

export interface AccountView {
  accountId: string;
  provider: string;
  balancesByCurrency: Record<string, string>;
  cryptoPositions: Record<string, string>;
  lastUpdatedAt: string;
}

export interface TimelineEvent {
  eventId: string;
  occurredAt: string;
  provider: string;
  accountId: string;
  kind: string;
  description: string | null;
  fiatCurrency: string | null;
  fiatAmountMinor: string | null;
  assetSymbol: string | null;
  assetAmount: string | null;
  status: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  nextCursor?: string;
}

export interface WebhookResponse {
  accepted: boolean;
  rawEventId: string;
  jobId: string;
}

export interface WebhookPayload {
  userId: string;
  [key: string]: string | number | undefined;
}

export interface ApiService {
  getWealthSummary(userId: string): Promise<WealthSummary>;
  getAccountViews(userId: string): Promise<AccountView[]>;
  getTimeline(userId: string, limit?: number, cursor?: string | null): Promise<TimelineResponse>;
  sendWebhook(payload: WebhookPayload): Promise<WebhookResponse>;
}

declare global {
  interface Window {
    apiService: ApiService;
    renderSummary: (summary: WealthSummary | null) => void;
    renderAccounts: (accounts: AccountView[]) => void;
    renderTimeline: (timeline: TimelineResponse) => void;
    showLoading: (sectionId: string) => void;
    showError: (sectionId: string, error: Error) => void;
    formatAmount: (amountMinor: string | null, currency?: string) => string;
    formatDate: (dateString: string) => string;
    loadData: () => Promise<void>;
    loadMoreTimeline: (cursor: string) => Promise<void>;
    showWebhookForm: () => void;
    closeWebhookForm: () => void;
    updateWebhookForm: () => void;
  }
}
