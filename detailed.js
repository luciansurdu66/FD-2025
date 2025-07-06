// Detailed statistics page script
class DetailedStatsManager {
    constructor() {
        this.stats = null;
        this.dailyStats = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.updateSummaryCards();
        this.createCharts();
        this.updateSitesTable();
    }

    async loadData() {
        try {
            // Load overall stats
            this.stats = await this.sendMessage({ action: "getStats" });

            // Load last 7 days of daily stats
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0];
                this.dailyStats[dateStr] = await this.sendMessage({
                    action: "getDailyStats",
                    date: dateStr,
                });
            }
        } catch (error) {
            console.error("Error loading detailed data:", error);
        }
    }

    updateSummaryCards() {
        if (!this.stats) return;

        const totalTime = this.stats.totalWatchTime;
        const sitesCount = Object.keys(this.stats.sites).length;
        const totalVisits = Object.values(this.stats.sites).reduce(
            (sum, site) => sum + site.visitCount,
            0
        );

        const avgSessionTime = totalVisits > 0 ? totalTime / totalVisits : 0;

        document.getElementById("totalTime").textContent =
            this.formatTime(totalTime);
        document.getElementById("sitesCount").textContent = sitesCount;
        document.getElementById("totalVisits").textContent = totalVisits;
        document.getElementById("avgSession").textContent =
            this.formatTime(avgSessionTime);
    }

    createCharts() {
        this.createTimeDistributionChart();
        this.createDailyActivityChart();
    }

    createTimeDistributionChart() {
        if (!this.stats) return;

        const sites = Object.values(this.stats.sites)
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 10);

        console.log("Sites for chart:", sites);

        const ctx = document.getElementById("timeChart").getContext("2d");
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: sites.map((site) => site.domain),
                datasets: [
                    {
                        data: sites.map((site) => site.totalTime / 60000), // Convert to minutes
                        backgroundColor: [
                            "#3B82F6",
                            "#10B981",
                            "#F59E0B",
                            "#EF4444",
                            "#8B5CF6",
                            "#06B6D4",
                            "#84CC16",
                            "#F97316",
                            "#EC4899",
                            "#6B7280",
                        ],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const minutes = context.parsed;
                                const hours = Math.floor(minutes / 60);
                                const mins = minutes % 60;
                                return `${context.label}: ${hours}h ${mins}m`;
                            },
                        },
                    },
                },
            },
        });
    }

    createDailyActivityChart() {
        const dates = Object.keys(this.dailyStats).sort();
        const data = dates.map(
            (date) => this.dailyStats[date].totalTime / 60000
        ); // Convert to minutes

        const ctx = document.getElementById("dailyChart").getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: dates.map((date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    });
                }),
                datasets: [
                    {
                        label: "Minutes per Day",
                        data: data,
                        borderColor: "#3B82F6",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                const hours = Math.floor(value / 60);
                                const mins = value % 60;
                                return hours > 0
                                    ? `${hours}h ${mins}m`
                                    : `${mins}m`;
                            },
                        },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const minutes = context.parsed.y;
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            return `${hours}h ${mins}m`;
                        },
                    },
                },
            },
        });
    }

    updateSitesTable() {
        if (!this.stats) return;

        const tableBody = document.getElementById("sitesTableBody");
        const sites = Object.values(this.stats.sites).sort(
            (a, b) => b.totalTime - a.totalTime
        );

        tableBody.innerHTML = sites
            .map((site) => {
                const avgSessionTime =
                    site.visitCount > 0 ? site.totalTime / site.visitCount : 0;
                const lastVisit = new Date(site.lastVisit).toLocaleDateString();

                return `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${site.domain}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${this.formatTime(
                site.totalTime
            )}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${site.visitCount}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${lastVisit}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${this.formatTime(
                avgSessionTime
            )}</div>
          </td>
        </tr>
      `;
            })
            .join("");
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

// Initialize detailed stats when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new DetailedStatsManager();
});

// Add event listener for close button
const closeBtn = document.getElementById("closeBtn");
if (closeBtn) {
    closeBtn.addEventListener("click", () => window.close());
}
