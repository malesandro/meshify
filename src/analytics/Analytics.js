const PLAUSIBLE_DOMAIN = 'meshify.app';

export class Analytics {
  constructor() {
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = PLAUSIBLE_DOMAIN;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
    this._initialized = true;

    // Plausible function fallback
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  }

  track(eventName, props) {
    if (window.plausible) {
      window.plausible(eventName, { props });
    }
  }

  trackFilterChange(filter) {
    this.track('Filter Change', { filter });
  }

  trackRecording(durationMs) {
    this.track('Recording', { duration_seconds: Math.round(durationMs / 1000) });
  }

  trackShare() {
    this.track('Share');
  }

  trackPresetLoad(name) {
    this.track('Preset Load', { preset: name });
  }
}
