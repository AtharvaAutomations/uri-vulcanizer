"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * Get all cycle numbers for a specific machine
 * Returns unique, non-null cycle numbers ordered by latest first
 */
router.get("/cycles", async (req, res) => {
    try {
        const cycles = await db_1.prisma.reading.findMany({
            where: {
                machineId: req.machineId,
                cycleNumber: {
                    not: null,
                },
            },
            select: {
                cycleNumber: true,
            },
            distinct: ["cycleNumber"],
            orderBy: {
                timestamp: "desc",
            },
        });
        // Extract unique cycle numbers and map to array
        const cycleNumbers = cycles
            .map((c) => c.cycleNumber)
            .filter((c) => c !== null && c !== undefined);
        res.json({ cycles: cycleNumbers });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching cycles:", errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Download report as Excel
 * Supports filtering by cycle number or date range
 * Supports time interval sampling
 */
router.get("/download", async (req, res) => {
    try {
        const { filterType, cycleNumber, fromDate, toDate, interval } = req.query;
        let readings = [];
        if (filterType === "cycle" && cycleNumber) {
            // Filter by cycle number
            readings = await db_1.prisma.reading.findMany({
                where: {
                    machineId: req.machineId,
                    cycleNumber: cycleNumber,
                },
                orderBy: { timestamp: "asc" },
            });
        }
        else if (filterType === "datetime" && fromDate && toDate) {
            // Filter by date range
            readings = await db_1.prisma.reading.findMany({
                where: {
                    machineId: req.machineId,
                    timestamp: {
                        gte: new Date(fromDate),
                        lte: new Date(toDate),
                    },
                },
                orderBy: { timestamp: "asc" },
            });
        }
        else {
            return res.status(400).json({
                error: "Invalid filter parameters. Provide either (cycleNumber) or (fromDate and toDate)",
            });
        }
        if (readings.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the given criteria" });
        }
        // Apply interval sampling if specified
        const sampledReadings = applyIntervalSampling(readings, interval);
        // Generate CSV content
        const csvContent = generateCSV(sampledReadings);
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Report_${req.machineId}_${timestamp}.csv`;
        // Send as downloadable file
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csvContent);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Report generation error:", errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});
/**
 * Apply time interval sampling to readings
 * Returns every Nth reading based on the interval
 */
function applyIntervalSampling(readings, interval) {
    if (!interval) {
        return readings;
    }
    const intervalMs = {
        "5s": 5000,
        "15s": 15000,
        "30s": 30000,
        "1min": 60000,
    };
    const ms = intervalMs[interval] || 0;
    if (ms === 0) {
        return readings;
    }
    const sampled = [];
    let lastTimestamp = 0;
    for (const reading of readings) {
        const currentTimestamp = new Date(reading.timestamp).getTime();
        // Always include the first reading
        if (sampled.length === 0) {
            sampled.push(reading);
            lastTimestamp = currentTimestamp;
            continue;
        }
        // Include reading if interval has passed
        if (currentTimestamp - lastTimestamp >= ms) {
            sampled.push(reading);
            lastTimestamp = currentTimestamp;
        }
    }
    return sampled;
}
/**
 * Generate CSV content from readings
 */
function generateCSV(readings) {
    const headers = [
        "Date Time",
        "Cycle Number",
        "Set Temperature",
        "Actual Temperature",
        "Set Pressure",
        "Actual Pressure",
        "Set Curing Time",
        "Actual Curing Time",
        "Set Exhaust Delay",
        "Actual Exhaust Delay",
    ];
    const rows = readings.map((r) => [
        new Date(r.timestamp).toLocaleString(),
        r.cycleNumber || "-",
        r.setTemperature ? r.setTemperature.toFixed(2) : "-",
        r.actualTemperature ? r.actualTemperature.toFixed(2) : "-",
        r.setPressure ? r.setPressure.toFixed(2) : "-",
        r.actualPressure ? r.actualPressure.toFixed(2) : "-",
        r.setCuringTime ? r.setCuringTime.toFixed(2) : "-",
        r.actualCuringTime ? r.actualCuringTime.toFixed(2) : "-",
        r.setExhaustDelay ? r.setExhaustDelay.toFixed(2) : "-",
        r.actualExhaustDelay ? r.actualExhaustDelay.toFixed(2) : "-",
    ]);
    // Build CSV
    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
        csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });
    return csv;
}
exports.default = router;
