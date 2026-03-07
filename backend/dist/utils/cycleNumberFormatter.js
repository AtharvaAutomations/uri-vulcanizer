"use strict";
/**
 * Cycle Number Formatting Utility
 * Formats cycle numbers in the format: R[MACHINE][YYYYMMDD][CYCLE]
 * Example: R22025112012 = Machine 2, Date 2025-11-20, Cycle 12
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodaysCyclePattern = exports.parseCycleNumber = exports.formatCycleNumber = void 0;
/**
 * Format cycle number to the standard format
 * @param machineId - "machine1" or "machine2"
 * @param date - Date object or ISO date string
 * @param cycleNumber - Numeric cycle number from PLC
 * @returns Formatted cycle number string (e.g., "R22025112012")
 */
const formatCycleNumber = (machineId, date, cycleNumber) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // Get machine number (1 for machine1, 2 for machine2)
    const machineNum = machineId === "machine1" ? 1 : 2;
    // Format date as YYYYMMDD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    // Format cycle number with leading zeros (assuming up to 99 cycles per day)
    const cycleStr = String(cycleNumber).padStart(2, "0");
    return `R${machineNum}${dateStr}${cycleStr}`;
};
exports.formatCycleNumber = formatCycleNumber;
/**
 * Parse a formatted cycle number back to components
 * @param formattedCycle - Formatted cycle number (e.g., "R22025112012")
 * @returns Object with machineId, date, and cycleNumber
 */
const parseCycleNumber = (formattedCycle) => {
    // Format: R[MACHINE][YYYYMMDD][CYCLE]
    // Example: R22025112012 has length 13
    if (!formattedCycle.startsWith("R") || formattedCycle.length !== 13) {
        return null;
    }
    const machineNum = parseInt(formattedCycle[1], 10);
    const dateStr = formattedCycle.substring(2, 10);
    const cycleStr = formattedCycle.substring(10, 13);
    // Parse date
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1; // Month is 0-indexed in JS
    const day = parseInt(dateStr.substring(6, 8), 10);
    const date = new Date(year, month, day);
    // Parse cycle number
    const cycleNumber = parseInt(cycleStr, 10);
    // Map machine number to machineId
    const machineId = machineNum === 1 ? "machine1" : "machine2";
    return { machineId, date, cycleNumber };
};
exports.parseCycleNumber = parseCycleNumber;
/**
 * Get today's cycle number in the formatted format
 * Used to identify cycles recorded on a specific date
 * @param machineId - "machine1" or "machine2"
 * @returns Pattern for matching cycles from today (e.g., "R22025021*")
 */
const getTodaysCyclePattern = (machineId) => {
    const machineNum = machineId === "machine1" ? 1 : 2;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    return `R${machineNum}${dateStr}`;
};
exports.getTodaysCyclePattern = getTodaysCyclePattern;
