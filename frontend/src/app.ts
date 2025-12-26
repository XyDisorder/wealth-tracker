/**
 * Main application logic
 */

// Type definitions (inlined for module: "None" compatibility)
interface TimelineEvent {
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

let currentUserId = 'user-001';
let timelineCursor: string | null = null;

async function loadData(): Promise<void> {
  const userIdInput = document.getElementById('userIdInput') as HTMLInputElement;
  if (!userIdInput) return;

  currentUserId = userIdInput.value.trim() || 'user-001';

  if (!currentUserId) {
    window.showToast({
      message: 'Veuillez entrer un User ID',
      type: 'warning',
      duration: 3000,
    });
    return;
  }

  const apiService = window.apiService;
  const renderSummary = window.renderSummary;
  const renderAccounts = window.renderAccounts;
  const renderTimeline = window.renderTimeline;
  const showLoading = window.showLoading;
  const showError = window.showError;

  if (!apiService || !showLoading || !renderSummary) {
    console.error('Required functions not available');
    return;
  }

  showLoading('summaryContent');
  showLoading('accountsContent');
  showLoading('timelineContent');

  try {
    const summary = await apiService.getWealthSummary(currentUserId);
    renderSummary(summary);
  } catch (error) {
    showError('summaryContent', error instanceof Error ? error : new Error(String(error)));
  }

  try {
    const accounts = await apiService.getAccountViews(currentUserId);
    renderAccounts(accounts);
  } catch (error) {
    showError('accountsContent', error instanceof Error ? error : new Error(String(error)));
  }

  try {
    const timeline = await apiService.getTimeline(currentUserId, 20);
    timelineCursor = timeline.nextCursor || null;
    renderTimeline(timeline);
  } catch (error) {
    showError('timelineContent', error instanceof Error ? error : new Error(String(error)));
  }
}

async function loadMoreTimeline(cursor: string): Promise<void> {
  const content = document.getElementById('timelineContent');
  if (!content) return;

  const apiService = window.apiService;
  const renderTimeline = window.renderTimeline;
  const showError = window.showError;

  const currentHtml = content.innerHTML;
  content.innerHTML = currentHtml.replace(/<button.*<\/button>/, '<p class="loading">Chargement...</p>');

  try {
    const timeline = await apiService.getTimeline(currentUserId, 20, cursor);
    timelineCursor = timeline.nextCursor || null;

    const existingEvents = JSON.parse(content.dataset.events || '[]') as TimelineEvent[];
    const allEvents = [...existingEvents, ...timeline.events];
    content.dataset.events = JSON.stringify(allEvents);

    renderTimeline({ events: allEvents, nextCursor: timelineCursor || undefined });
  } catch (error) {
    showError('timelineContent', error instanceof Error ? error : new Error(String(error)));
  }
}

// Expose to global scope
window.loadData = loadData;
window.loadMoreTimeline = loadMoreTimeline;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setInterval(() => loadData(), 10000);
});
