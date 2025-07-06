import type { WatchTimeStats, SiteData, DailyStats } from "../types/watchTime";

const STORAGE_KEYS = {
    WATCH_TIME_STATS: "watchTimeStats",
    DAILY_STATS: "dailyStats",
    SETTINGS: "settings",
} as const;

export class StorageManager {
    static async getWatchTimeStats(): Promise<WatchTimeStats> {
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
    }

    static async saveWatchTimeStats(stats: WatchTimeStats): Promise<void> {
        await chrome.storage.local.set({
            [STORAGE_KEYS.WATCH_TIME_STATS]: stats,
        });
    }

    static async updateSiteData(
        domain: string,
        timeSpent: number
    ): Promise<void> {
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

        // Add session data
        siteData.sessions.push({
            startTime: now - timeSpent,
            endTime: now,
            duration: timeSpent,
        });

        // Keep only last 100 sessions to prevent storage bloat
        if (siteData.sessions.length > 100) {
            siteData.sessions = siteData.sessions.slice(-100);
        }

        stats.totalWatchTime += timeSpent;
        stats.lastUpdated = now;

        await this.saveWatchTimeStats(stats);
    }

    static async getDailyStats(date: string): Promise<DailyStats> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
        const dailyStats = result[STORAGE_KEYS.DAILY_STATS] || {};
        return (
            dailyStats[date] || {
                date,
                totalTime: 0,
                sites: {},
            }
        );
    }

    static async updateDailyStats(
        date: string,
        domain: string,
        timeSpent: number
    ): Promise<void> {
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
    }

    static async getSettings(): Promise<{
        trackingEnabled: boolean;
        autoPause: boolean;
        pauseThreshold: number;
    }> {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
        return (
            result[STORAGE_KEYS.SETTINGS] || {
                trackingEnabled: true,
                autoPause: true,
                pauseThreshold: 300000, // 5 minutes in milliseconds
            }
        );
    }

    static async saveSettings(settings: {
        trackingEnabled: boolean;
        autoPause: boolean;
        pauseThreshold: number;
    }): Promise<void> {
        await chrome.storage.sync.set({
            [STORAGE_KEYS.SETTINGS]: settings,
        });
    }

    static async clearAllData(): Promise<void> {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
    }
}
