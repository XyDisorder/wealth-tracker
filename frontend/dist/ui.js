"use strict";
/**
 * UI rendering functions
 */
function formatAmount(amountMinor, currency = 'EUR') {
    if (!amountMinor)
        return '0.00';
    const amount = BigInt(amountMinor);
    const major = Number(amount) / 100;
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
    }).format(major);
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}
function renderSummary(summary) {
    const content = document.getElementById('summaryContent');
    if (!content)
        return;
    if (!summary || Object.keys(summary.balancesByCurrency || {}).length === 0) {
        content.innerHTML = '<p class="empty">Aucune donnée disponible</p>';
        return;
    }
    let html = '<div class="summary-grid">';
    html += '<div class="summary-item"><h3>Balances par devise</h3><ul class="balance-list">';
    for (const [currency, amountMinor] of Object.entries(summary.balancesByCurrency || {})) {
        html += `<li>${formatAmount(amountMinor, currency)}</li>`;
    }
    html += '</ul></div>';
    html += '<div class="summary-item"><h3>Positions crypto</h3>';
    if (Object.keys(summary.cryptoPositions || {}).length === 0) {
        html += '<p class="empty">Aucune position crypto</p>';
    }
    else {
        html += '<ul class="crypto-list">';
        for (const [asset, amount] of Object.entries(summary.cryptoPositions || {})) {
            html += `<li><strong>${asset}</strong>: ${amount}</li>`;
        }
        html += '</ul>';
    }
    html += '</div>';
    html += '<div class="summary-item"><h3>Statut de valorisation</h3>';
    const statusClass = summary.valuation?.status === 'FULL' ? 'status-full' : 'status-partial';
    html += `<p class="status ${statusClass}">${summary.valuation?.status || 'PARTIAL'}</p>`;
    if (summary.valuation?.missingCryptoValuations > 0) {
        html += `<p class="warning">${summary.valuation.missingCryptoValuations} valorisation(s) manquante(s)</p>`;
    }
    html += '</div>';
    html += '</div>';
    html += `<p class="last-updated">Dernière mise à jour: ${formatDate(summary.lastUpdatedAt)}</p>`;
    content.innerHTML = html;
}
function renderAccounts(accounts) {
    const content = document.getElementById('accountsContent');
    if (!content)
        return;
    if (!accounts || accounts.length === 0) {
        content.innerHTML = '<p class="empty">Aucun compte disponible</p>';
        return;
    }
    let html = '<div class="accounts-grid">';
    for (const account of accounts) {
        html += `<div class="account-card"><h3>${account.provider} - ${account.accountId}</h3>`;
        html += '<div class="account-balances"><h4>Balances:</h4><ul>';
        for (const [currency, amountMinor] of Object.entries(account.balancesByCurrency || {})) {
            html += `<li>${formatAmount(amountMinor, currency)}</li>`;
        }
        html += '</ul></div>';
        if (Object.keys(account.cryptoPositions || {}).length > 0) {
            html += '<div class="account-crypto"><h4>Crypto:</h4><ul>';
            for (const [asset, amount] of Object.entries(account.cryptoPositions || {})) {
                html += `<li><strong>${asset}</strong>: ${amount}</li>`;
            }
            html += '</ul></div>';
        }
        html += `<p class="last-updated">Mise à jour: ${formatDate(account.lastUpdatedAt)}</p></div>`;
    }
    html += '</div>';
    content.innerHTML = html;
}
function renderTimeline(timeline) {
    const content = document.getElementById('timelineContent');
    if (!content)
        return;
    if (!timeline || !timeline.events || timeline.events.length === 0) {
        content.innerHTML = '<p class="empty">Aucun événement dans la timeline</p>';
        return;
    }
    let html = '<div class="timeline">';
    for (const event of timeline.events) {
        html += '<div class="timeline-item">';
        html += `<div class="timeline-header">`;
        html += `<span class="provider-badge ${event.provider.toLowerCase()}">${event.provider}</span>`;
        html += `<span class="event-kind">${event.kind}</span>`;
        html += `<span class="event-date">${formatDate(event.occurredAt)}</span></div>`;
        if (event.description) {
            html += `<p class="event-description">${event.description}</p>`;
        }
        html += '<div class="event-details">';
        if (event.fiatAmountMinor && event.fiatCurrency) {
            html += `<span class="amount">${formatAmount(event.fiatAmountMinor, event.fiatCurrency)}</span>`;
        }
        if (event.assetSymbol && event.assetAmount) {
            html += `<span class="crypto">${event.assetAmount} ${event.assetSymbol}</span>`;
        }
        html += '</div>';
        html += `<p class="event-account">Compte: ${event.accountId}</p></div>`;
    }
    if (timeline.nextCursor) {
        html += `<button onclick="loadMoreTimeline('${timeline.nextCursor}')">Charger plus</button>`;
    }
    html += '</div>';
    content.innerHTML = html;
}
function showLoading(sectionId) {
    const content = document.getElementById(sectionId);
    if (content) {
        content.innerHTML = '<p class="loading">Chargement...</p>';
    }
}
function showError(sectionId, error) {
    const content = document.getElementById(sectionId);
    if (content) {
        content.innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
    }
}
// Expose to global scope
window.renderSummary = renderSummary;
window.renderAccounts = renderAccounts;
window.renderTimeline = renderTimeline;
window.showLoading = showLoading;
window.showError = showError;
window.formatAmount = formatAmount;
window.formatDate = formatDate;
//# sourceMappingURL=ui.js.map