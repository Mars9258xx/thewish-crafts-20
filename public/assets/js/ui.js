/* Wish Craft — shared UI helpers. Keeps existing callers/API intact. */
window.WishCraftUI = (() => {
  function toast(title, message = "", type = "default") {
    let el = document.querySelector("[data-wc-toast]");
    if (!el) {
      el = document.createElement("div");
      el.className = "wc-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.dataset.wcToast = "";
      document.body.appendChild(el);
    }
    el.dataset.type = type;
    el.innerHTML = `<p class="wc-toast__title"></p><p class="wc-toast__message"></p>`;
    el.querySelector(".wc-toast__title").textContent = title;
    el.querySelector(".wc-toast__message").textContent = message;
    el.hidden = false;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.hidden = true; }, 3400);
    window.wcA11yAnnounce?.(`${title}${message ? ` — ${message}` : ''}`);
  }

  function setLoading(button, loading, label = "Working…") {
    if (!button) return;
    if (loading) {
      button.dataset.originalLabel = button.innerHTML;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.innerHTML = `<span aria-hidden="true" class="wc-loading-dot">• • •</span><span>${label}</span>`;
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (button.dataset.originalLabel) button.innerHTML = button.dataset.originalLabel;
    }
  }

  function copy(text, successMessage = "Link copied ✨") {
    if (!navigator.clipboard) return Promise.reject(new Error("Clipboard unavailable"));
    return navigator.clipboard.writeText(text).then(() => toast("Copied!", successMessage, "success"));
  }

  return { toast, setLoading, copy };
})();
