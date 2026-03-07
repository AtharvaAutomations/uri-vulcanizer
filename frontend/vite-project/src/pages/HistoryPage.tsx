import { useEffect, useState, useCallback } from "react";
import LiveChart from "../components/LiveChart";
import { useMachine } from "../context/useMachine";
import { getHistory, type HistoryReading } from "../api";

type ChartPoint = {
  time: number;
  temperature?: number;
  pressure?: number;
};

export default function HistoryPage() {
  const { selectedMachine } = useMachine();
  const [historyData, setHistoryData] = useState<HistoryReading[]>([]);
  const [chartTempData, setChartTempData] = useState<ChartPoint[]>([]);
  const [chartPressureData, setChartPressureData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [cycleNumber, setCycleNumber] = useState<number | "">("");

  // Default to last 24 hours
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString().slice(0, 16);
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });

  const fetchHistory = useCallback(
    async (from: string, to: string, cycle?: number) => {
      setLoading(true);
      try {
        const data = await getHistory(selectedMachine, from, to, cycle);
        setHistoryData(data);

        // Transform data for charts
        const tempPoints: ChartPoint[] = data.map((reading) => ({
          time: new Date(reading.timestamp).getTime(),
          temperature: reading.temperature,
        }));

        const pressurePoints: ChartPoint[] = data.map((reading) => ({
          time: new Date(reading.timestamp).getTime(),
          pressure: reading.pressure,
        }));

        setChartTempData(tempPoints);
        setChartPressureData(pressurePoints);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedMachine],
  );

  // Load initial data
  useEffect(() => {
    fetchHistory(
      fromDate,
      toDate,
      cycleNumber !== "" ? cycleNumber : undefined,
    );
  }, [fromDate, toDate, cycleNumber, selectedMachine, fetchHistory]);

  const handleApplyFilter = () => {
    if (fromDate && toDate) {
      fetchHistory(
        fromDate,
        toDate,
        cycleNumber !== "" ? cycleNumber : undefined,
      );
    }
  };

  const handleQuickFilter = (hours: number) => {
    const from = new Date();
    from.setHours(from.getHours() - hours);
    const to = new Date();

    setFromDate(from.toISOString().slice(0, 16));
    setToDate(to.toISOString().slice(0, 16));

    fetchHistory(
      from.toISOString(),
      to.toISOString(),
      cycleNumber !== "" ? cycleNumber : undefined,
    );
  };

  return (
    <>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">History</h2>

      {/* Filter Bar - Matching RecipeForm Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
            📅
          </span>
          Filter by Date, Time & Cycle
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          {/* From Date-Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date-Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cycle Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cycle No <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              value={cycleNumber}
              onChange={(e) =>
                setCycleNumber(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="All cycles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors"
          >
            {loading ? "Loading..." : "Apply"}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => handleApplyFilter()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">
            Quick filters:
          </span>
          <button
            onClick={() => handleQuickFilter(1)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 1h
          </button>
          <button
            onClick={() => handleQuickFilter(6)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 6h
          </button>
          <button
            onClick={() => handleQuickFilter(24)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 24h
          </button>
        </div>

        {/* Data count info and View Toggle */}
        <div className="mt-4 flex justify-between items-center">
          {historyData.length > 0 && (
            <p className="text-sm text-gray-600 font-medium">
              📊 Showing{" "}
              <span className="text-blue-600 font-semibold">
                {historyData.length}
              </span>{" "}
              readings
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "chart"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📊 Chart
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📋 Table
            </button>
          </div>
        </div>
      </div>

      {/* Charts or Table */}
      {chartTempData.length > 0 ? (
        <>
          {viewMode === "chart" ? (
            <div className="space-y-6">
              <LiveChart
                title="Historical Temperature"
                data={chartTempData}
                dataKey="temperature"
                color="#ef4444"
              />

              <LiveChart
                title="Historical Pressure"
                data={chartPressureData}
                dataKey="pressure"
                color="#3b82f6"
              />
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Cycle No
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Temperature (°C)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Pressure (bar)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((reading, index) => (
                      <tr
                        key={reading.id}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {new Date(reading.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                          {reading.cycleNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                            {reading.temperature.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {reading.pressure.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center border-l-4 border-gray-300">
          <p className="text-gray-600 text-lg">
            {loading
              ? "⏳ Loading historical data..."
              : "📭 No data available for the selected period"}
          </p>
        </div>
      )}
    </>
  );
}
