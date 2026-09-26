(function () {
  "use strict";
  const cfg = window.WISHCRAFT_ADS || {};
  const id = String(cfg.publisherId || "").trim();
  if (!cfg.enabled || !/^ca-pub-\d{10,32}$/.test(id)) return;
  if (!document.querySelector('meta[name="google-adsense-account"]')) {
    const meta = document.createElement("meta");
    meta.name = "google-adsense-account";
    meta.content = id;
    document.head.appendChild(meta);
  }
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(id);
  document.head.appendChild(script);
  document.querySelectorAll(".wc-ad-slot").forEach(function (slot) {
    if (slot.querySelector("ins.adsbygoogle")) return;
    slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  });
})();
