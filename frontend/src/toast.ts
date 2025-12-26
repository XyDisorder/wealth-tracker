/**
 * Toast notification system
 * Simple toast notifications to replace alert()
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

function showToast(options: ToastOptions): void {
  const { message, type = 'info', duration = 3000 } = options;

  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${getToastColor(type)};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 500px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  `;

  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  messageEl.style.flex = '1';
  toast.appendChild(messageEl);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 24px;
    opacity: 0.8;
  `;
  closeBtn.onmouseover = () => (closeBtn.style.opacity = '1');
  closeBtn.onmouseout = () => (closeBtn.style.opacity = '0.8');
  closeBtn.onclick = () => removeToast(toast);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast: HTMLElement): void {
  toast.style.animation = 'slideOut 0.3s ease-in';
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

function getToastColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return '#27ae60';
    case 'error':
      return '#e74c3c';
    case 'warning':
      return '#f39c12';
    case 'info':
    default:
      return '#3498db';
  }
}

// Add CSS animations
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Expose to global scope
(window as any).showToast = showToast;

