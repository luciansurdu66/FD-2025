// ---- Type Definitions ----
// (from src/types/watchTime.ts)

/** @typedef {Object} SiteData
 *  @property {string} domain
 *  @property {number} totalTime
 *  @property {Session[]} sessions
 *  @property {number} lastVisit
 *  @property {number} visitCount
 */
/** @typedef {Object} Session
 *  @property {number} startTime
 *  @property {number} [endTime]
 *  @property {number} duration
 */
/** @typedef {Object} WatchTimeStats
 *  @property {Record<string, SiteData>} sites
 *  @property {number} totalWatchTime
 *  @property {number} lastUpdated
 */
/** @typedef {Object} TabInfo
 *  @property {number} id
 *  @property {string} url
 *  @property {string} domain
 *  @property {number} startTime
 *  @property {boolean} isActive
 */
/** @typedef {Object} DailyStats
 *  @property {string} date
 *  @property {number} totalTime
 *  @property {Record<string, number>} sites
 */

// ---- StorageManager ----
const STORAGE_KEYS = {
    WATCH_TIME_STATS: "watchTimeStats",
    DAILY_STATS: "dailyStats",
    SETTINGS: "settings",
};

const StorageManager = {
    async getWatchTimeStats() {
        const result = await chrome.storage.local.get(
            STORAGE_KEYS.WATCH_TIME_STATS
        );
        return (
            result[STORAGE_KEYS.WATCH_TIME_STATS] || {
                sites: {},
                totalWatchTime: 0,
                lastUpdated: Date.now(),
            }
        );
    },
    async saveWatchTimeStats(stats) {
        await chrome.storage.local.set({
            [STORAGE_KEYS.WATCH_TIME_STATS]: stats,
        });
    },
    async updateSiteData(domain, timeSpent) {
        const stats = await this.getWatchTimeStats();
        const now = Date.now();
        if (!stats.sites[domain]) {
            stats.sites[domain] = {
                domain,
                totalTime: 0,
                sessions: [],
                lastVisit: now,
                visitCount: 0,
            };
        }
        const siteData = stats.sites[domain];
        siteData.totalTime += timeSpent;
        siteData.lastVisit = now;
        siteData.visitCount += 1;
        siteData.sessions.push({
            startTime: now - timeSpent,
            endTime: now,
            duration: timeSpent,
        });
        if (siteData.sessions.length > 100) {
            siteData.sessions = siteData.sessions.slice(-100);
        }
        stats.totalWatchTime += timeSpent;
        stats.lastUpdated = now;
        await this.saveWatchTimeStats(stats);
    },
    async getDailyStats(date) {
        const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
        const dailyStats = result[STORAGE_KEYS.DAILY_STATS] || {};
        return (
            dailyStats[date] || {
                date,
                totalTime: 0,
                sites: {},
            }
        );
    },
    async updateDailyStats(date, domain, timeSpent) {
        const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
        const dailyStats = result[STORAGE_KEYS.DAILY_STATS] || {};
        if (!dailyStats[date]) {
            dailyStats[date] = {
                date,
                totalTime: 0,
                sites: {},
            };
        }
        dailyStats[date].totalTime += timeSpent;
        dailyStats[date].sites[domain] =
            (dailyStats[date].sites[domain] || 0) + timeSpent;
        await chrome.storage.local.set({
            [STORAGE_KEYS.DAILY_STATS]: dailyStats,
        });
    },
    async getSettings() {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
        return (
            result[STORAGE_KEYS.SETTINGS] || {
                trackingEnabled: true,
                autoPause: true,
                pauseThreshold: 300000, // 5 minutes in milliseconds
            }
        );
    },
    async saveSettings(settings) {
        await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
    },
    async clearAllData() {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
    },
};

// ---- TimeTracker ----
class TimeTracker {
    constructor() {
        this.activeTabs = new Map();
        this.lastActiveTime = Date.now();
        this.isTracking = false;
        this.updateInterval = 1000;
        this.intervalId = undefined;
        this.initializeTracking();
    }
    async initializeTracking() {
        const settings = await StorageManager.getSettings();
        this.isTracking = settings.trackingEnabled;
        if (this.isTracking) {
            this.startTracking();
        }
    }
    startTracking() {
        if (this.intervalId) return;
        this.isTracking = true;
        this.lastActiveTime = Date.now();
        this.intervalId = setInterval(() => {
            this.updateTracking();
        }, this.updateInterval);
    }
    stopTracking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.isTracking = false;
    }
    updateTab(tabId, url, isActive) {
        const domain = this.extractDomain(url);
        const now = Date.now();
        if (isActive) {
            this.activeTabs.set(tabId, {
                id: tabId,
                url,
                domain,
                startTime: now,
                isActive: true,
            });
            this.lastActiveTime = now;
        } else {
            this.activeTabs.delete(tabId);
        }
    }
    removeTab(tabId) {
        this.activeTabs.delete(tabId);
    }
    async updateTracking() {
        if (!this.isTracking || this.activeTabs.size === 0) return;
        const now = Date.now();
        const timeDiff = now - this.lastActiveTime;
        if (timeDiff < this.updateInterval) return;
        const settings = await StorageManager.getSettings();
        if (settings.autoPause && timeDiff > settings.pauseThreshold) {
            return;
        }
        for (const [tabId, tabInfo] of this.activeTabs) {
            if (tabInfo.isActive) {
                await this.updateSiteTime(tabInfo.domain, timeDiff);
            }
        }
        this.lastActiveTime = now;
    }
    async updateSiteTime(domain, timeSpent) {
        try {
            const today = new Date().toISOString().split("T")[0];
            await Promise.all([
                StorageManager.updateSiteData(domain, timeSpent),
                StorageManager.updateDailyStats(today, domain, timeSpent),
            ]);
        } catch (error) {
            console.error("Error updating site time:", error);
        }
    }
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace("www.", "");
        } catch {
            return "unknown";
        }
    }
    getActiveTabs() {
        return Array.from(this.activeTabs.values());
    }
    isCurrentlyTracking() {
        return this.isTracking;
    }
    async toggleTracking() {
        if (this.isTracking) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
        const settings = await StorageManager.getSettings();
        settings.trackingEnabled = this.isTracking;
        await StorageManager.saveSettings(settings);
    }
}

// ---- Main Background Script ----
// Initialize time tracker
const timeTracker = new TimeTracker();

// Track active tabs
let activeTabId = null;
let activeWindowId = null;

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Mark previous tab as inactive
    if (activeTabId !== null) {
        timeTracker.updateTab(activeTabId, "", false);
    }
    // Update to new active tab
    activeTabId = activeInfo.tabId;
    activeWindowId = activeInfo.windowId;
    const tab = await chrome.tabs.get(activeTabId);
    if (tab.url && tab.url.startsWith("http")) {
        timeTracker.updateTab(activeTabId, tab.url, true);
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && tab.url && tab.url.startsWith("http")) {
        timeTracker.updateTab(tabId, tab.url, true);
    }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    timeTracker.removeTab(tabId);
    if (tabId === activeTabId) {
        activeTabId = null;
    }
});

// Handle window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // All Chrome windows lost focus
        timeTracker.stopTracking();
    } else {
        // A Chrome window gained focus
        chrome.tabs.query({ active: true, windowId }, (tabs) => {
            if (tabs.length > 0) {
                if (activeTabId !== null && activeTabId !== tabs[0].id) {
                    timeTracker.updateTab(activeTabId, "", false);
                }
                activeTabId = tabs[0].id;
                if (tabs[0].url && tabs[0].url.startsWith("http")) {
                    timeTracker.updateTab(activeTabId, tabs[0].url, true);
                }
                timeTracker.startTracking();
            }
        });
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Site Watch Time Tracker installed");
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "getStats":
            StorageManager.getWatchTimeStats().then(sendResponse);
            return true; // Keep message channel open for async response
        case "getDailyStats":
            const requestedDate =
                request.date || new Date().toISOString().split("T")[0];
            StorageManager.getDailyStats(requestedDate).then(sendResponse);
            return true;
        case "toggleTracking":
            timeTracker.toggleTracking().then(() => {
                sendResponse({
                    success: true,
                    isTracking: timeTracker.isCurrentlyTracking(),
                });
            });
            return true;
        case "getSettings":
            StorageManager.getSettings().then(sendResponse);
            return true;
        case "updateSettings":
            StorageManager.saveSettings(request.settings).then(() => {
                sendResponse({ success: true });
            });
            return true;
        case "clearData":
            StorageManager.clearAllData().then(() => {
                sendResponse({ success: true });
            });
            return true;
        case "getActiveTabs":
            sendResponse(timeTracker.getActiveTabs());
            return false;
        case "getTrackingStatus":
            sendResponse({
                isTracking: timeTracker.isCurrentlyTracking(),
            });
            return false;
        default:
            sendResponse({ error: "Unknown action" });
            return false;
    }
});

// Set up alarm for periodic data cleanup
chrome.alarms.create("cleanup", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanup") {
        // Clean up old session data (keep only last 30 days)
        cleanupOldData();
    }
});

async function cleanupOldData() {
    try {
        const stats = await StorageManager.getWatchTimeStats();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        for (const [domain, siteData] of Object.entries(stats.sites)) {
            siteData.sessions = siteData.sessions.filter(
                (session) => session.startTime > thirtyDaysAgo
            );
        }
        await StorageManager.saveWatchTimeStats(stats);
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}
