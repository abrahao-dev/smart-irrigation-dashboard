/**
 * Utility functions for statistical calculations
 */

/**
 * Calculate the mean (average) of an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} - The mean value
 */
export const calculateMean = (values) => {
  if (!values || values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate the standard deviation of an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} - The standard deviation
 */
export const calculateStandardDeviation = (values) => {
  if (!values || values.length <= 1) return 0;
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
};

/**
 * Format a number to a specified number of decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(decimals);
};
