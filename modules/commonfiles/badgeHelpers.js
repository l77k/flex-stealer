/**
 * Badge Helpers Module
 * Calculates Discord Nitro badge variants based on subscription duration.
 * Part of the Flex Stealer | 2026 suite.
 */

/**
 * Calculates the appropriate Nitro duration badge based on a start date.
 * @param {string|number|Date} nitroStartDate - The date the user subscribed to Nitro.
 * @returns {string} The name/emoji string representing the Nitro badge.
 */
function getNitroBadge(nitroStartDate) {
    if (!nitroStartDate) {
        return "";
    }

    try {
        const currentDate = Date.now();
        const startDate = new Date(nitroStartDate).getTime();
        const msInMonth = 1000 * 60 * 60 * 24 * 30; // Approximation of a month in ms

        const monthsSubscribed = Math.floor((currentDate - startDate) / msInMonth);

        if (monthsSubscribed >= 72) {
            return "Nitro 72 Months";
        }
        if (monthsSubscribed >= 60) {
            return "Nitro 60 Months";
        }
        if (monthsSubscribed >= 48) {
            return "Nitro 48 Months";
        }
        if (monthsSubscribed >= 36) {
            return "Nitro 36 Months";
        }
        if (monthsSubscribed >= 24) {
            return "Nitro 24 Months";
        }
        if (monthsSubscribed >= 18) {
            return "Nitro 18 Months";
        }
        if (monthsSubscribed >= 12) {
            return "Nitro 12 Months";
        }
        if (monthsSubscribed >= 1) {
            return "Nitro 1 Month";
        }

        return "";
    } catch (e) {
        return "";
    }
}

/**
 * Validates or returns the base emoji for early supporter/developer badges.
 */
function getBaseBadge(flag) {
    // Example placeholder, returns generic badges based on flags
    return "🚀"; 
}

module.exports = {
    getNitroBadge,
    getBaseBadge
};