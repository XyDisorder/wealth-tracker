/**
 * Initialize global scope with all required functions
 * This file imports all modules and exposes them globally
 */
import { apiService } from './api';
import { renderSummary, renderAccounts, renderTimeline, showLoading, showError, formatAmount, formatDate, } from './ui';
import { loadData, loadMoreTimeline } from './app';
import { showWebhookForm, closeWebhookForm, updateWebhookForm, } from './webhook-forms';
// Expose everything to global scope
window.apiService = apiService;
window.renderSummary = renderSummary;
window.renderAccounts = renderAccounts;
window.renderTimeline = renderTimeline;
window.showLoading = showLoading;
window.showError = showError;
window.formatAmount = formatAmount;
window.formatDate = formatDate;
window.loadData = loadData;
window.loadMoreTimeline = loadMoreTimeline;
window.showWebhookForm = showWebhookForm;
window.closeWebhookForm = closeWebhookForm;
window.updateWebhookForm = updateWebhookForm;
console.log('✅ All modules initialized and exposed to global scope');
//# sourceMappingURL=init.js.map