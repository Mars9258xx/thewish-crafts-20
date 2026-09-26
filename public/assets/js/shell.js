/* Wish Craft — one simple header, footer and gentle interaction layer. */
(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const nav = [
    ['/', 'Home'],
    ['/birthday.html', 'Create Wish'],
    ['/my-wishes.html', 'My Wishes'],
    ['/about.html', 'About'],
    ['/contact.html', 'Contact']
  ];
  const isActive = href => href === '/' ? path === '/' : path === href || path.endsWith(href);
  const links = nav.map(([href, label]) => `<a class="wc-shell-link" href="${href}" ${isActive(href) ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  const drawer = nav.map(([href, label]) => `<a href="${href}" ${isActive(href) ? 'aria-current="page"' : ''}>${label}</a>`).join('');

  const headerHost = document.querySelector('[data-wc-shell-header]');
  if (headerHost) {
    headerHost.innerHTML = `
      <header class="wc-shell-header" data-scrolled="false">
        <nav class="wc-shell-nav" aria-label="Primary navigation">
          <a class="wc-shell-logo" href="/" aria-label="Wish Craft home">
            <img src="/assets/brand/wishcraft-mark.svg" alt="" width="128" height="128">
          </a>
          <div class="wc-shell-links">${links}</div>
          <a class="wc-shell-cta" href="/birthday.html">Create a Wish <span aria-hidden="true">→</span></a>
          <button class="wc-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="wc-mobile-drawer"><span></span></button>
        </nav>
        <nav class="wc-shell-drawer" id="wc-mobile-drawer" data-open="false" aria-label="Mobile navigation" aria-hidden="true">
          ${drawer}<a class="wc-shell-drawer-cta" href="/birthday.html">Create a Wish <span aria-hidden="true">→</span></a>
        </nav>
      </header>`;

    const menu = headerHost.querySelector('.wc-shell-menu');
    const drawerEl = headerHost.querySelector('.wc-shell-drawer');
    const close = () => {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation');
      drawerEl.dataset.open = 'false';
      drawerEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('wc-menu-open');
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      menu.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      drawerEl.dataset.open = String(!open);
      drawerEl.setAttribute('aria-hidden', String(open));
      document.body.classList.toggle('wc-menu-open', !open);
    });
    drawerEl.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    window.addEventListener('scroll', () => {
      headerHost.querySelector('.wc-shell-header').dataset.scrolled = window.scrollY > 12 ? 'true' : 'false';
    }, { passive: true });
  }

  const footerHost = document.querySelector('[data-wc-shell-footer]');
  if (footerHost) {
    footerHost.innerHTML = `
      <footer class="wc-shell-footer">
        <div class="wc-shell-footer-inner">
          <div class="wc-shell-footer-grid">
            <div class="wc-shell-footer-brand">
              <img src="/assets/brand/wishcraft-mark.svg" alt="Wish Craft" width="128" height="128">
              <p>Turn your feelings into beautiful digital moments — personal, simple and made to feel like yours.</p>
            </div>
            <div><h3>Create</h3><a href="/birthday.html">Birthday</a><a href="/anniversary.html">Anniversary</a><a href="/purpose.html">Special Wish</a><a href="/thank-you-card.html">Thank You</a></div>
            <div><h3>Explore</h3><a href="/my-wishes.html">My Wishes</a><a href="/qr.html">Share & QR</a><a href="/about.html">About</a></div>
            <div><h3>Help</h3><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div>
          </div>
          <div class="wc-shell-footer-bottom"><span>© ${new Date().getFullYear()} Wish Craft</span><span>Made with care ♡</span></div>
        </div>
      </footer>`;
  }

  document.body.classList.add('wc-atmosphere-enabled');
  if (!document.querySelector('.wc-global-atmosphere')) {
    const atmosphere = document.createElement('div');
    atmosphere.className = 'wc-global-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    atmosphere.innerHTML = '<span class="wc-atmosphere-orb wc-atmosphere-orb--one"></span><span class="wc-atmosphere-orb wc-atmosphere-orb--two"></span><span class="wc-atmosphere-orb wc-atmosphere-orb--three"></span><span class="wc-atmosphere-orb wc-atmosphere-orb--four"></span>';
    document.body.appendChild(atmosphere);
  }

  const chime = new Audio('/assets/audio/wishcraft-button-chime.wav');
  chime.preload = 'auto';
  chime.volume = .28;
  document.addEventListener('click', event => {
    const target = event.target.closest('.wc-shell-cta,.wc-home-btn--primary,.primary,.cd-primary,.wc6-open,.action.primary');
    if (!target || target.disabled) return;
    try { chime.currentTime = 0; chime.play().catch(() => {}); } catch (_) {}
    if ('vibrate' in navigator) { try { navigator.vibrate(8); } catch (_) {} }
  }, { passive: true });
})();
