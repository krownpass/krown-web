// lib/formatDate.ts

/**
 * Formats a UTC timestamp (from backend) to Indian Standard Time (IST)
 * and returns it as a human-readable string.
 *
 * Example:
 *   formatIST("2025-11-07T01:08:21.991Z")
 *   → "7 Nov 2025, 6:38 am"
 */
export function formatIST(dateString?: string): string {
    if (!dateString) return "--";

    try {
        const date = new Date(dateString); // Automatically parses UTC (Z suffix)
        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return "--";
    }
}
