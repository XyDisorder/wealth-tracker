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
        date: new Date().toISOString(),
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
        time: Date.now(),
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
        timestamp: Date.now(),
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
        const inputType = key === 'date' || key === 'timestamp' || key === 'time' ? 'datetime-local' : typeof value === 'number' ? 'number' : 'text';
        let inputValue = value;
        if (key === 'date' && typeof value === 'string') {
            inputValue = new Date(value).toISOString().slice(0, 16);
        }
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
        if (key === 'amount' || key === 'fiatValue' || key === 'time' || key === 'timestamp') {
            payload[key] = parseFloat(stringValue) || parseInt(stringValue, 10);
        }
        else {
            payload[key] = stringValue;
        }
    });
    if (payload.date && typeof payload.date === 'string') {
        payload.date = new Date(payload.date).toISOString();
    }
    const apiService = window.apiService;
    const loadData = window.loadData;
    try {
        const result = await apiService.sendWebhook(payload);
        alert(`Webhook envoyé avec succès!\nRawEvent ID: ${result.rawEventId}\nJob ID: ${result.jobId}`);
        closeWebhookForm();
        setTimeout(() => loadData(), 2000);
    }
    catch (error) {
        alert(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
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
export {};
//# sourceMappingURL=webhook-forms.js.map