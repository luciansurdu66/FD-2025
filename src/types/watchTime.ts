export interface SiteData {
    domain: string;
    totalTime: number;
    sessions: Session[];
    lastVisit: number;
    visitCount: number;
}

export interface Session {
    startTime: number;
    endTime?: number;
    duration: number;
}

export interface WatchTimeStats {
    sites: Record<string, SiteData>;
    totalWatchTime: number;
    lastUpdated: number;
}

export interface TabInfo {
    id: number;
    url: string;
    domain: string;
    startTime: number;
    isActive: boolean;
}

export interface DailyStats {
    date: string;
    totalTime: number;
    sites: Record<string, number>;
}
