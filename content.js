// Content script for detecting page visibility and user activity
let lastActivityTime = Date.now();
let isPageVisible = true;

// Track user activity
function updateActivity() {
    lastActivityTime = Date.now();
}

// Track page visibility changes
function handleVisibilityChange() {
    isPageVisible = !document.hidden;

    if (isPageVisible) {
        updateActivity();
    }
}

// Track user interactions
function handleUserActivity() {
    updateActivity();
}

// Set up event listeners
document.addEventListener("visibilitychange", handleVisibilityChange);
document.addEventListener("mousemove", handleUserActivity, { passive: true });
document.addEventListener("keydown", handleUserActivity, { passive: true });
document.addEventListener("click", handleUserActivity, { passive: true });
document.addEventListener("scroll", handleUserActivity, { passive: true });

// Send activity updates to background script
setInterval(() => {
    if (isPageVisible) {
        chrome.runtime
            .sendMessage({
                action: "updateActivity",
                timestamp: lastActivityTime,
            })
            .catch(() => {
                // Ignore errors when extension is not available
            });
    }
}, 5000); // Update every 5 seconds

// Notify background script when page loads
chrome.runtime
    .sendMessage({
        action: "pageLoaded",
        url: window.location.href,
        domain: window.location.hostname,
    })
    .catch(() => {
        // Ignore errors when extension is not available
    });
