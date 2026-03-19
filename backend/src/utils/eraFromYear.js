const Era = require('../constants/Era');

/**
 * Derives the strict historical Era group given a specific numeric year.
 * @param {number|null} year
 * @returns {string} Era Enum
 */
function eraFromYear(year) {
  if (year === null || year === undefined) return Era.UNKNOWN;
  if (year < 500) return Era.ANCIENT;
  if (year < 1500) return Era.MEDIEVAL;
  if (year < 1800) return Era.COLONIAL;
  if (year < 1950) return Era.MODERN;
  return Era.CONTEMPORARY;
}

module.exports = eraFromYear;
