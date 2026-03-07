import { useCallback, useEffect, useMemo, useState } from "react";
import { useMachine } from "../context/useMachine";
import { type ChangeLog, getLogs, getReportCycles } from "../api";

export default function ReportsPage() {
  const { selectedMachine } = useMachine();
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [activeTab, setActiveTab] = useState<"readings" | "logs">("readings");

  // Reading Report Filters
  const [filterType, setFilterType] = useState<"cycle" | "datetime">(
    "datetime",
  );
  const [cycleNumber, setCycleNumber] = useState<string>("");
  const [cycleNumbers, setCycleNumbers] = useState<string[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [timeInterval, setTimeInterval] = useState<
    "5s" | "15s" | "30s" | "1min"
  >("5s");
  const [downloading, setDownloading] = useState(false);

  // Logs Filters (existing)
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Get unique actions and users for dropdowns
  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const users = Array.from(
    new Set(logs.map((l) => l.user).filter((u): u is string => Boolean(u))),
  );

  // Apply filters for logs
  const applyFilters = useCallback(
    (data: ChangeLog[] = logs) => {
      let result = data;

      // Filter by action
      if (actionFilter !== "all") {
        result = result.filter((l) => l.action === actionFilter);
      }

      // Filter by user
      if (userFilter !== "all") {
        result = result.filter((l) => l.user === userFilter);
      }

      return result;
    },
    [logs, actionFilter, userFilter],
  );

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getLogs();
        setLogs(data);
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    };
    fetchLogs();
  }, []);

  // Load cycle numbers when machine changes
  useEffect(() => {
    const fetchCycleNumbers = async () => {
      setLoadingCycles(true);
      try {
        const data = await getReportCycles(selectedMachine);
        setCycleNumbers(data.cycles || []);
        // Reset cycle selection when machine changes
        setCycleNumber("");
      } catch (error) {
        console.error("Error loading cycle numbers:", error);
        setCycleNumbers([]);
      } finally {
        setLoadingCycles(false);
      }
    };

    fetchCycleNumbers();
  }, [selectedMachine]);

  const filteredLogs = useMemo(() => applyFilters(), [applyFilters]);

  // Download readings report
  const downloadReadinsReport = async () => {
    setDownloading(true);
    try {
      let url = `http://localhost:3000/api/reports/download?machine=${selectedMachine}&interval=${timeInterval}`;

      if (filterType === "cycle" && cycleNumber) {
        url += `&filterType=cycle&cycleNumber=${encodeURIComponent(cycleNumber)}`;
      } else if (filterType === "datetime" && fromDate && toDate) {
        url += `&filterType=datetime&fromDate=${encodeURIComponent(
          fromDate,
        )}&toDate=${encodeURIComponent(toDate)}`;
      } else {
        alert("Please select a valid filter");
        setDownloading(false);
        return;
      }

      // Trigger download
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `readings_report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(`Error downloading report: ${error}`);
    } finally {
      setDownloading(false);
    }
  };

  // Download logs as JSON (keeping existing functionality)
  const downloadLogsJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalRecords: filteredLogs.length,
      logs: filteredLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      "recipe-created": "bg-blue-100 text-blue-800",
      "recipe-updated": "bg-yellow-100 text-yellow-800",
      "recipe-deleted": "bg-red-100 text-red-800",
      "recipe-activated": "bg-green-100 text-green-800",
      "recipe-activation-failed": "bg-red-100 text-red-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-2">
          Download machine readings and view system audit logs
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("readings")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "readings"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📊 Machine Readings
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "logs"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📋 Audit Log
        </button>
      </div>

      {/* READINGS TAB */}
      {activeTab === "readings" && (
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
                🔍
              </span>
              Filter Options
            </h2>

            {/* Filter Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter By <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterType"
                    value="datetime"
                    checked={filterType === "datetime"}
                    onChange={(e) =>
                      setFilterType(e.target.value as "cycle" | "datetime")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Date & Time Range</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterType"
                    value="cycle"
                    checked={filterType === "cycle"}
                    onChange={(e) =>
                      setFilterType(e.target.value as "cycle" | "datetime")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Cycle Number</span>
                </label>
              </div>
            </div>

            {/* Dynamic Filter Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {filterType === "datetime" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cycle Number <span className="text-red-500">*</span>
                  </label>
                  {loadingCycles ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Loading cycles...
                    </div>
                  ) : cycleNumbers.length === 0 ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      No cycles found for {selectedMachine}
                    </div>
                  ) : (
                    <select
                      value={cycleNumber}
                      onChange={(e) => setCycleNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select a cycle --</option>
                      {cycleNumbers.map((cycle) => (
                        <option key={cycle} value={cycle}>
                          {cycle}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Interval <span className="text-red-500">*</span>
                </label>
                <select
                  value={timeInterval}
                  onChange={(e) =>
                    setTimeInterval(
                      e.target.value as "5s" | "15s" | "30s" | "1min",
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="5s">Every 5 seconds</option>
                  <option value="15s">Every 15 seconds</option>
                  <option value="30s">Every 30 seconds</option>
                  <option value="1min">Every 1 minute</option>
                </select>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadReadinsReport}
              disabled={downloading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              {downloading ? "⏳ Downloading..." : "📥 Download as CSV"}
            </button>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
                🔍
              </span>
              Filter Logs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Action Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.replace(/-/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset & Download */}
            <div className="flex gap-2 justify-between flex-wrap">
              <button
                onClick={() => {
                  setActionFilter("all");
                  setUserFilter("all");
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                🔄 Reset Filters
              </button>

              <button
                onClick={downloadLogsJSON}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                📥 Download JSON
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
            <p className="text-indigo-800 font-semibold">
              📊 Showing{" "}
              <span className="text-indigo-600 font-bold">
                {filteredLogs.length}
              </span>{" "}
              of{" "}
              <span className="text-indigo-600 font-bold">{logs.length}</span>{" "}
              records
            </p>
          </div>

          {/* Logs Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600 text-lg">
                  📭 No logs matching the selected filters
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">Timestamp</th>
                    <th className="p-4 text-left font-semibold">User</th>
                    <th className="p-4 text-left font-semibold">Action</th>
                    <th className="p-4 text-center font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`border-b transition hover:bg-blue-50 cursor-pointer ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-4 text-gray-700 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-700">
                        {log.user || "System"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(
                            log.action,
                          )}`}
                        >
                          {log.action.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === log.id ? null : log.id,
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          {expandedRow === log.id ? "▼ Hide" : "▶ View"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Expanded Details Row */}
                  {expandedRow !== null && (
                    <tr className="bg-gray-100 border-b">
                      <td colSpan={4} className="p-4">
                        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                          <h3 className="font-bold text-gray-800 mb-2">
                            Full Details:
                          </h3>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                            {JSON.stringify(
                              filteredLogs.find((l) => l.id === expandedRow)
                                ?.details,
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
