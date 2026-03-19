export class AdManager {
  constructor() {
    this._initialized = false;
    this._slots = [];
  }

  init() {
    // AdSense script injection — replace with real publisher ID
    if (this._initialized) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    // script.dataset.adClient = 'ca-pub-XXXXXXXXXXXXXXXX'; // TODO: add real publisher ID
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    this._initialized = true;
  }

  showBanner() {
    const slot = document.querySelector('.ad-slot-banner');
    if (!slot) return;
    slot.innerHTML = `
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-format="auto"
        data-full-width-responsive="true"
        aria-label="Advertisement"></ins>
    `;
    this._pushAd();
    this._slots.push(slot);
  }

  showSidebar() {
    const slot = document.querySelector('.ad-slot-sidebar');
    if (!slot) return;
    slot.innerHTML = `
      <ins class="adsbygoogle"
        style="display:inline-block;width:300px;height:250px"
        aria-label="Advertisement"></ins>
    `;
    this._pushAd();
    this._slots.push(slot);
  }

  hideAll() {
    this._slots.forEach((s) => { s.style.display = 'none'; });
  }

  refresh() {
    // AdSense auto-refreshes; this is a hook for future ad providers
  }

  _pushAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded (dev/localhost) — silently ignore
    }
  }
}
