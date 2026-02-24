const { isValidPhoneNumber } = require('libphonenumber-js');

/**
 * Validates a given phone number by cleaning it, blocking obvious fake patterns,
 * and verifying its mathematical structure via Google's libphonenumber-js.
 * @param {string} phone - The raw phone number input
 * @returns {string|boolean} - The cleaned/normalized number if valid, or false if invalid
 */
function validateGlobalPhone(phone) {
    if (!phone) return false;

    try {
        // Assume India (+91) as default if no international code is provided
        const numStr = phone.startsWith('+') ? phone : `+91${phone}`;

        // Extract just the raw digits without the '+' to check for spam patterns
        const digitsOnly = numStr.replace(/\D/g, '');

        // Reject obvious fake repeating patterns (e.g., 0000000000, 1111111111, 2222222222)
        // Checks if all digits in the string are identical to the first digit.
        if (/^(\d)\1{7,}$/.test(digitsOnly)) {
            return false;
        }

        // Validate structure geometrically via Google's library
        if (!isValidPhoneNumber(numStr)) {
            return false;
        }

        return numStr;
    } catch (err) {
        return false;
    }
}

module.exports = validateGlobalPhone;
