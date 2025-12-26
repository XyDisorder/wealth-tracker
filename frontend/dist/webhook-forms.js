"use strict";
/**
 * Webhook form generation and handling
 */
const INSURER_MOVEMENT_TYPES = [
    { value: 'premium', label: 'Premium (Prime)' },
    { value: 'claim', label: 'Claim (Sinistre)' },
    { value: 'refund', label: 'Refund (Remboursement)' },
    { value: 'commission', label: 'Commission' },
    { value: 'fee', label: 'Fee (Frais)' },
    { value: 'adjustment', label: 'Adjustment (Ajustement)' },
];
const WEBHOOK_TEMPLATES = {
    BANK: {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-' + Date.now(),
        // date field removed - backend will use Date.now() automatically
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
        description: 'Test transaction',
    },
    CRYPTO: {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-' + Date.now(),
        // time field removed - backend will use Date.now() automatically
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.01,
        fiatValue: 400,
        currency: 'EUR',
        walletId: 'acc-03',
    },
    INSURER: {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-' + Date.now(),
        // timestamp field removed - backend will use Date.now() automatically
        movementType: 'premium',
        amount: 100,
        currency: 'EUR',
        policyNumber: 'acc-04',
    },
};
function updateWebhookForm() {
    const providerSelect = document.getElementById('providerSelect');
    const fieldsContainer = document.getElementById('webhookFields');
    if (!providerSelect || !fieldsContainer)
        return;
    const provider = providerSelect.value;
    const template = WEBHOOK_TEMPLATES[provider];
    let html = '';
    for (const [key, value] of Object.entries(template)) {
        if (provider === 'INSURER' && key === 'movementType') {
            html += `<label>${key}:<select name="${key}" required>`;
            for (const type of INSURER_MOVEMENT_TYPES) {
                html += `<option value="${type.value}" ${value === type.value ? 'selected' : ''}>${type.label}</option>`;
            }
            html += '</select></label>';
            continue;
        }
        // Skip date/timestamp/time fields - backend will use Date.now() automatically
        if (key === 'date' || key === 'timestamp' || key === 'time') {
            continue; // Don't show these fields in the form
        }
        const inputType = typeof value === 'number' ? 'number' : 'text';
        const inputValue = value;
        html += `<label>${key}:<input type="${inputType}" name="${key}" value="${inputValue}" required /></label>`;
    }
    fieldsContainer.innerHTML = html;
}
function showWebhookForm() {
    const modal = document.getElementById('webhookModal');
    if (modal) {
        modal.style.display = 'block';
        updateWebhookForm();
    }
}
function closeWebhookForm() {
    const modal = document.getElementById('webhookModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
async function handleWebhookSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = { userId: '' };
    formData.forEach((value, key) => {
        const stringValue = value;
        // Skip date/timestamp/time fields - backend will use Date.now() automatically
        if (key === 'date' || key === 'time' || key === 'timestamp') {
            return; // Don't include these fields in payload
        }
        if (key === 'amount' || key === 'fiatValue') {
            payload[key] = parseFloat(stringValue) || parseInt(stringValue, 10);
        }
        else {
            payload[key] = stringValue;
        }
    });
    const apiService = window.apiService;
    const loadData = window.loadData;
    try {
        const result = await apiService.sendWebhook(payload);
        window.showToast({
            message: `Webhook envoyé avec succès! RawEvent: ${result.rawEventId.substring(0, 8)}...`,
            type: 'success',
            duration: 4000,
        });
        closeWebhookForm();
        setTimeout(() => loadData(), 2000);
    }
    catch (error) {
        window.showToast({
            message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
            type: 'error',
            duration: 5000,
        });
    }
}
// Expose to global scope
window.showWebhookForm = showWebhookForm;
window.closeWebhookForm = closeWebhookForm;
window.updateWebhookForm = updateWebhookForm;
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('webhookForm');
    if (form) {
        form.addEventListener('submit', handleWebhookSubmit);
    }
    const modal = document.getElementById('webhookModal');
    if (modal) {
        window.onclick = (event) => {
            if (event.target === modal) {
                closeWebhookForm();
            }
        };
    }
});
//# sourceMappingURL=webhook-forms.js.map