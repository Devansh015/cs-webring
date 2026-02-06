/**
 * CS Webring Widget
 * Embeddable script for webring navigation (prev , logo , next)
 *
 * Usage:
 *   <div id="cs-webring"></div>
 *   <script>
 *     window.WebringWidgetOptions = {
 *       theme: "default",
 *       logoLight: "https://cs-webring.xyz/widget/logo-light.png",
 *       logoDark: "https://cs-webring.xyz/widget/logo-dark.png",
 *       // or: logo: "https://example.com/my-logo.png"
 *     };
 *   </script>
 *   <script src="https://cs-webring.xyz/widget/webring.js"></script>
 */

(function () {
  "use strict";

  const WEBRING_BASE_URL = "https://cs-webring.xyz";
  const WEBRING_DATA_URL = WEBRING_BASE_URL + "/data/webring.json";

  function prefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function resolveLogoUrl(opts) {
    // 1) explicit custom logo always wins
    if (opts.logo) return opts.logo;

    // 2) choose based on system theme if provided
    const dark = prefersDark();
    if (dark && opts.logoDark) return opts.logoDark;
    if (!dark && opts.logoLight) return opts.logoLight;

    // 3) fallback
    return opts.logoLight || opts.logoDark || (WEBRING_BASE_URL + "/widget/logo.png");
  }

  class WebringWidget {
    constructor(options = {}) {
      const globalOptions = window.WebringWidgetOptions || {};
      const opts = { ...globalOptions, ...options };

      this.currentSiteUrl = opts.currentSite || window.location.origin;
      this.containerId = opts.containerId || "cs-webring";
      this.theme = opts.theme || "default";

      // Logo options
      this.logo = opts.logo || null;
      this.logoLight = opts.logoLight || null;
      this.logoDark = opts.logoDark || null;
      this.logoAlt = opts.logoAlt || "CS Webring";
      this.logoLink = opts.logoLink || WEBRING_BASE_URL;

      this.sites = [];
      this.currentIndex = -1;

      this.init();
    }

    async init() {
      try {
        await this.loadSites();
        this.findCurrentSite();
        this.render();
      } catch (error) {
        console.error("Webring Widget Error:", error);
      }
    }

    async loadSites() {
      const response = await fetch(WEBRING_DATA_URL);
      const data = await response.json();
      this.sites = data.sites || [];
    }

    findCurrentSite() {
      this.currentIndex = this.sites.findIndex((site) => {
        try {
          return this.currentSiteUrl.includes(new URL(site.url).hostname);
        } catch {
          return false;
        }
      });
    }

    getPrevSite() {
      if (this.currentIndex === -1 || this.sites.length === 0) return null;
      const prevIndex = (this.currentIndex - 1 + this.sites.length) % this.sites.length;
      return this.sites[prevIndex];
    }

    getNextSite() {
      if (this.currentIndex === -1 || this.sites.length === 0) return null;
      const nextIndex = (this.currentIndex + 1) % this.sites.length;
      return this.sites[nextIndex];
    }

    render() {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`Container #${this.containerId} not found`);
        return;
      }

      const prev = this.getPrevSite();
      const next = this.getNextSite();

      const prevUrl = prev ? prev.url : WEBRING_BASE_URL;
      const nextUrl = next ? next.url : WEBRING_BASE_URL;

      const prevName = prev ? prev.name : "Hub";
      const nextName = next ? next.name : "Hub";

      const logoUrl = resolveLogoUrl({
        logo: this.logo,
        logoLight: this.logoLight,
        logoDark: this.logoDark,
      });

      container.innerHTML = `
        <div class="webring-widget webring-theme-${this.theme}">
          <a href="${prevUrl}" class="webring-link webring-prev" title="Previous: ${escapeHtml(prevName)}">
            ${escapeHtml(prevName)}
          </a>

          <a href="${this.logoLink}" class="webring-logoLink" title="Webring home" aria-label="Webring home">
            <img class="webring-logo" src="${logoUrl}" alt="${escapeHtml(this.logoAlt)}" />
          </a>

          <a href="${nextUrl}" class="webring-link webring-next" title="Next: ${escapeHtml(nextName)}">
            ${escapeHtml(nextName)}
          </a>
        </div>
      `;

      // Re-render on theme change (system light/dark) if using logoLight or logoDark
      if (this.logoLight || this.logoDark) {
        const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
        if (mq && mq.addEventListener) {
          mq.addEventListener("change", () => this.render());
        }
      }
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Expose for manual initialization with options
  window.WebringWidget = WebringWidget;

  // Auto-initialize if container exists
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cs-webring")) {
      window.csWebring = new WebringWidget();
    }
  });
})();