// Popup script for the Chrome extension
class PopupManager {
    constructor() {
        this.isTracking = false;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadData() {
        try {
            // Load settings
            const settings = await this.sendMessage({ action: "getSettings" });
            this.updateSettingsUI(settings);

            // Get current tracking status
            const statusResponse = await this.sendMessage({
                action: "getTrackingStatus",
            });
            this.isTracking = statusResponse.isTracking;

            // Load today's stats
            const dailyStats = await this.sendMessage({
                action: "getDailyStats",
            });
            this.updateDailyStats(dailyStats);

            // Load overall stats for site list
            const stats = await this.sendMessage({ action: "getStats" });
            this.updateSiteList(stats);

            // Update tracking status
            this.updateTrackingStatus();
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    setupEventListeners() {
        // Toggle tracking button
        document.getElementById("toggleBtn").addEventListener("click", () => {
            this.toggleTracking();
        });

        // Settings button
        document.getElementById("settingsBtn").addEventListener("click", () => {
            this.showSettings();
        });

        // Close settings
        document
            .getElementById("closeSettings")
            .addEventListener("click", () => {
                this.hideSettings();
            });

        // Settings form
        document.getElementById("autoPause").addEventListener("change", (e) => {
            this.updateSettings();
        });

        document
            .getElementById("pauseThreshold")
            .addEventListener("change", (e) => {
                this.updateSettings();
            });

        // Clear data button
        document
            .getElementById("clearDataBtn")
            .addEventListener("click", () => {
                this.clearData();
            });

        // View all button
        document.getElementById("viewAllBtn").addEventListener("click", () => {
            this.showDetailedView();
        });
    }

    async toggleTracking() {
        try {
            const response = await this.sendMessage({
                action: "toggleTracking",
            });
            if (response.success) {
                this.isTracking = response.isTracking;
                this.updateTrackingStatus();
            }
        } catch (error) {
            console.error("Error toggling tracking:", error);
        }
    }

    updateTrackingStatus() {
        const statusIndicator = document.getElementById("trackingStatus");
        const statusText = document.getElementById("statusText");
        const toggleBtn = document.getElementById("toggleBtn");

        if (this.isTracking) {
            statusIndicator.className = "status-dot active";
            statusText.textContent = "Tracking";
            toggleBtn.textContent = "Stop Tracking";
            toggleBtn.className = "button";
        } else {
            statusIndicator.className = "status-dot paused";
            statusText.textContent = "Paused";
            toggleBtn.textContent = "Start Tracking";
            toggleBtn.className = "button";
        }
    }

    updateDailyStats(dailyStats) {
        const totalElement = document.getElementById("todayTotal");
        const sitesElement = document.getElementById("todaySites");

        const totalMinutes = Math.floor(dailyStats.totalTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        totalElement.textContent = `${hours}h ${minutes}m`;
        sitesElement.textContent = Object.keys(dailyStats.sites).length;
    }

    updateSiteList(stats) {
        const siteList = document.getElementById("siteList");
        const sites = Object.values(stats.sites)
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 5);

        if (sites.length === 0) {
            siteList.innerHTML =
                '<div class="text-center text-gray-500 py-4">No data yet</div>';
            return;
        }

        siteList.innerHTML = sites
            .map((site) => {
                const minutes = Math.floor(site.totalTime / 60000);
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                return `
        <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">${site.domain}</div>
            <div class="text-xs text-gray-500">${site.visitCount} visits</div>
          </div>
          <div class="text-sm font-semibold text-blue-600 ml-2">${timeText}</div>
        </div>
      `;
            })
            .join("");
    }

    updateSettingsUI(settings) {
        document.getElementById("autoPause").checked = settings.autoPause;
        document.getElementById("pauseThreshold").value = Math.floor(
            settings.pauseThreshold / 60000
        );
    }

    async updateSettings() {
        const autoPause = document.getElementById("autoPause").checked;
        const pauseThreshold =
            parseInt(document.getElementById("pauseThreshold").value) * 60000;

        try {
            await this.sendMessage({
                action: "updateSettings",
                settings: {
                    trackingEnabled: this.isTracking,
                    autoPause,
                    pauseThreshold,
                },
            });
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    }

    showSettings() {
        document.getElementById("settingsModal").classList.remove("hidden");
    }

    hideSettings() {
        document.getElementById("settingsModal").classList.add("hidden");
    }

    async clearData() {
        if (
            confirm(
                "Are you sure you want to clear all tracking data? This action cannot be undone."
            )
        ) {
            try {
                await this.sendMessage({ action: "clearData" });
                this.loadData(); // Reload data after clearing
                this.hideSettings();
            } catch (error) {
                console.error("Error clearing data:", error);
            }
        }
    }

    showDetailedView() {
        // Open a new tab with detailed statistics
        chrome.tabs.create({
            url: chrome.runtime.getURL("detailed.html"),
        });
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadData();
        }, 30000);
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new PopupManager();
});
