/**
 * CS-DS Webring Widget
 * Embeddable script for webring navigation (next/prev/random)
 */

(function() {
    'use strict';

    const WEBRING_DATA_URL = 'https://your-domain.com/data/webring.json';
    
    class WebringWidget {
        constructor(options = {}) {
            this.currentSiteUrl = options.currentSite || window.location.origin;
            this.containerId = options.containerId || 'cs-ds-webring';
            this.theme = options.theme || 'default';
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
                console.error('Webring Widget Error:', error);
            }
        }

        async loadSites() {
            const response = await fetch(WEBRING_DATA_URL);
            const data = await response.json();
            this.sites = data.sites;
        }

        findCurrentSite() {
            this.currentIndex = this.sites.findIndex(site => 
                this.currentSiteUrl.includes(new URL(site.url).hostname)
            );
        }

        getPrevSite() {
            if (this.sites.length === 0) return null;
            const index = this.currentIndex <= 0 ? this.sites.length - 1 : this.currentIndex - 1;
            return this.sites[index];
        }

        getNextSite() {
            if (this.sites.length === 0) return null;
            const index = this.currentIndex >= this.sites.length - 1 ? 0 : this.currentIndex + 1;
            return this.sites[index];
        }

        getRandomSite() {
            if (this.sites.length === 0) return null;
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * this.sites.length);
            } while (randomIndex === this.currentIndex && this.sites.length > 1);
            return this.sites[randomIndex];
        }

        render() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`Container #${this.containerId} not found`);
                return;
            }

            const prev = this.getPrevSite();
            const next = this.getNextSite();

            container.innerHTML = `
                <div class="webring-widget webring-theme-${this.theme}">
                    <span class="webring-label">CS-DS Webring</span>
                    <nav class="webring-nav">
                        <a href="${prev ? prev.url : '#'}" class="webring-link webring-prev" title="Previous: ${prev ? prev.name : 'N/A'}">← Prev</a>
                        <a href="#" class="webring-link webring-random" title="Random site">Random</a>
                        <a href="${next ? next.url : '#'}" class="webring-link webring-next" title="Next: ${next ? next.name : 'N/A'}">Next →</a>
                    </nav>
                </div>
            `;

            // Add random click handler
            container.querySelector('.webring-random').addEventListener('click', (e) => {
                e.preventDefault();
                const randomSite = this.getRandomSite();
                if (randomSite) {
                    window.location.href = randomSite.url;
                }
            });
        }
    }

    // Auto-initialize if container exists
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('cs-ds-webring')) {
            window.csdsWebring = new WebringWidget();
        }
    });

    // Expose for manual initialization
    window.WebringWidget = WebringWidget;
})();
