import { StorageManager } from "./storage";
import type { TabInfo } from "../types/watchTime";

export class TimeTracker {
    private activeTabs: Map<number, TabInfo> = new Map();
    private lastActiveTime: number = Date.now();
    private isTracking: boolean = false;
    private updateInterval: number = 1000; // 1 second
    private intervalId?: number;

    constructor() {
        this.initializeTracking();
    }

    private async initializeTracking(): Promise<void> {
        const settings = await StorageManager.getSettings();
        this.isTracking = settings.trackingEnabled;

        if (this.isTracking) {
            this.startTracking();
        }
    }

    public startTracking(): void {
        if (this.intervalId) return;

        this.isTracking = true;
        this.lastActiveTime = Date.now();

        this.intervalId = window.setInterval(() => {
            this.updateTracking();
        }, this.updateInterval);
    }

    public stopTracking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.isTracking = false;
    }

    public updateTab(tabId: number, url: string, isActive: boolean): void {
        const domain = this.extractDomain(url);
        const now = Date.now();

        if (isActive) {
            // If this tab is now active, start tracking it
            this.activeTabs.set(tabId, {
                id: tabId,
                url,
                domain,
                startTime: now,
                isActive: true,
            });
            this.lastActiveTime = now;
        } else {
            // If this tab is no longer active, remove it from tracking
            this.activeTabs.delete(tabId);
        }
    }

    public removeTab(tabId: number): void {
        this.activeTabs.delete(tabId);
    }

    private async updateTracking(): Promise<void> {
        if (!this.isTracking || this.activeTabs.size === 0) return;

        const now = Date.now();
        const timeDiff = now - this.lastActiveTime;

        if (timeDiff < this.updateInterval) return;

        const settings = await StorageManager.getSettings();

        // Check if we should pause tracking due to inactivity
        if (settings.autoPause && timeDiff > settings.pauseThreshold) {
            return;
        }

        // Update time for all active tabs
        for (const [tabId, tabInfo] of this.activeTabs) {
            if (tabInfo.isActive) {
                await this.updateSiteTime(tabInfo.domain, timeDiff);
            }
        }

        this.lastActiveTime = now;
    }

    private async updateSiteTime(
        domain: string,
        timeSpent: number
    ): Promise<void> {
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

    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace("www.", "");
        } catch {
            return "unknown";
        }
    }

    public getActiveTabs(): TabInfo[] {
        return Array.from(this.activeTabs.values());
    }

    public isCurrentlyTracking(): boolean {
        return this.isTracking;
    }

    public async toggleTracking(): Promise<void> {
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
