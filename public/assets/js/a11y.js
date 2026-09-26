/* Wish Craft accessibility layer — additive, visual identity preserved. */
(() => {
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  if (!body) return;

  // Skip link for keyboard and switch users.
  if (!document.querySelector('.wc-skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'wc-skip-link';
    skip.href = '#main-content';
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
  }
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  // Keep a single, non-invasive live region available for status/error announcements.
  let live = $('wc-a11y-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'wc-a11y-live';
    live.className = 'wc-visually-hidden';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(live);
  }
  window.wcA11yAnnounce = (message, priority = 'polite') => {
    live.setAttribute('aria-live', priority);
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = String(message || ''); });
  };

  // Creator labels that were previously visual-only.
  const labels = {
    recipient: 'Recipient name',
    sender: 'Your name',
    personalDetails: 'Personal message',
    photo: 'Optional recipient photo',
    wcCropZoom: 'Photo zoom',
    occasion: 'Occasion', name: 'Recipient name', age: 'Age', from: 'From',
    customTitle: 'Custom title (optional)', message: 'Message', font: 'Font',
    customNote: 'Thank-you note', customFrom: 'From', key: 'Admin panel key',
    notice: 'Site notice'
  };
  Object.entries(labels).forEach(([id, text]) => {
    const el = $(id);
    if (!el || el.type === 'hidden') return;
    const existing = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (!existing && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      el.setAttribute('aria-label', text);
    }
  });

  // Range inputs need an explicit current value for screen readers.
  document.querySelectorAll('input[type="range"]').forEach((range) => {
    const sync = () => {
      if (!range.getAttribute('aria-valuetext')) range.setAttribute('aria-valuetext', `${range.value}`);
    };
    sync();
    range.addEventListener('input', sync);
  });

  // Buttons used as selectors expose state instead of relying on color.
  document.querySelectorAll('.template, .cd-theme, .cd-toggle, .cd-chip, [data-sticker], [data-align]').forEach((button) => {
    if (button.tagName !== 'BUTTON') return;
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  });
  const syncPressed = () => document.querySelectorAll('.template, .cd-theme, .cd-toggle, .cd-chip, [data-sticker], [data-align]').forEach((button) => {
    if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  });
  new MutationObserver(syncPressed).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // Dialog focus management for photo crop dialogs.
  document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
    if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
    const modal = dialog.closest('[aria-hidden]') || dialog;
    let previousFocus = null;
    const isOpen = () => !modal.hasAttribute('aria-hidden') || modal.getAttribute('aria-hidden') === 'false' || modal.classList.contains('open');
    const focusables = () => [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
    const observer = new MutationObserver(() => {
      if (isOpen() && !previousFocus) {
        previousFocus = document.activeElement;
        setTimeout(() => focusables()[0]?.focus() || dialog.focus(), 0);
      } else if (!isOpen() && previousFocus) {
        const target = previousFocus; previousFocus = null; setTimeout(() => target?.focus?.(), 0);
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['aria-hidden', 'class'] });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        const close = dialog.querySelector('[aria-label*="Close"], [data-close], .wc-photo-close');
        close?.click();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables(); if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });


  // Move focus when creator panels swap so keyboard users do not remain in hidden content.
  const panelObserver = new MutationObserver(() => {
    const previewPanel = $('previewPanel');
    if (previewPanel && previewPanel.hidden === false && document.activeElement?.closest?.('#formPanel')) {
      setTimeout(() => $('backForm')?.focus(), 0);
    }
  });
  panelObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  // Make loading/disabled controls announce meaningful progress where available.
  document.querySelectorAll('[aria-busy="true"]').forEach((el) => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (text) window.wcA11yAnnounce(text);
  });
})();
