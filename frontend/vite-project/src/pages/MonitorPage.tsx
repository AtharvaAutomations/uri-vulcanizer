import { useEffect, useState } from "react";
import { useMachine } from "../context/useMachine";
import { getPlcMonitor, type PlcMonitorData } from "../api";

// types for readings and recipes are now defined inside PlcMonitorData

export default function PlcMonitorPage() {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState<PlcMonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await getPlcMonitor(selectedMachine);
        setData(json);
      } catch (error) {
        console.error("Error loading PLC monitor data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [selectedMachine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading PLC status...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500 text-lg">Failed to load PLC status</p>
      </div>
    );
  }

  // Prepare objects for comparison: intended (backend activeRecipe) and sent (plc-service lastWrite)
  const intendedObj: Record<string, number | string | undefined> | null =
    data.activeRecipe
      ? (data.activeRecipe as unknown as Record<
          string,
          number | string | undefined
        >)
      : null;
  const sentObj: Record<string, number | string | undefined> | null = data
    .lastWrite?.data
    ? (data.lastWrite.data as unknown as Record<
        string,
        number | string | undefined
      >)
    : null;
  const writeSource = data.lastWrite
    ? "PLC Service"
    : data.activeRecipe
      ? "Backend (intended)"
      : null;
  const writeTimestamp =
    data.lastWrite?.timestamp ?? data.activeRecipe?.activatedAt ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800">PLC Monitor</h1>
        <p className="text-gray-600 mt-1">
          Real-time PLC status, sensor readings, and active recipe parameters
        </p>
      </div>

      {/* Connection Status Card */}
      <div
        className={`rounded-lg shadow-lg p-6 ${
          data.connected
            ? "bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400"
            : "bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Connection Status
            </h2>
            <p
              className={`text-lg font-semibold mt-2 ${
                data.connected ? "text-green-700" : "text-red-700"
              }`}
            >
              {data.connected ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-green-600 rounded-full animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-red-600 rounded-full"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">Last updated</p>
            <p className="text-gray-800 font-semibold">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Active Recipe Section */}
      {data.activeRecipe && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Active Recipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Recipe Name</p>
              <p className="text-xl font-bold text-blue-700 mt-1">
                {data.activeRecipe.name}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Version</p>
              <p className="text-xl font-bold text-blue-700 mt-1">
                v{data.activeRecipe.version}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Status</p>
              <p className="text-xl font-bold text-green-700 mt-1 capitalize">
                {data.activeRecipe.status}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Activated At</p>
              <p className="text-sm font-bold text-blue-700 mt-1">
                {data.activeRecipe.activatedAt
                  ? new Date(data.activeRecipe.activatedAt).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Read Values from PLC */}
      {data.lastRead && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-cyan-600">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Last Read Values from PLC
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
              <p className="text-gray-600 text-sm font-medium">Temperature</p>
              {writeSource && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 italic">
                    Source: <span className="font-semibold">{writeSource}</span>
                  </div>
                  {writeSource === "Backend (intended)" && (
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded border border-yellow-300">
                      Not sent — PLC disconnected
                    </div>
                  )}
                </div>
              )}
              <p className="text-gray-500 text-sm mt-1">°C</p>
            </div>
            <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
              <p className="text-gray-600 text-sm font-medium">Pressure</p>
              <p className="text-4xl font-bold text-cyan-700 mt-2">
                {typeof data.lastRead.pressure === "number"
                  ? data.lastRead.pressure.toFixed(2)
                  : "N/A"}
              </p>
              <p className="text-gray-500 text-sm mt-1">PSI</p>
            </div>
            <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
              <p className="text-gray-600 text-sm font-medium">Timestamp</p>
              <p className="text-lg font-bold text-cyan-700 mt-2">
                {new Date(data.lastRead.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(data.lastRead.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Write Values (Recipe Parameters Sent to PLC) */}
      {/** Comparison table: Intended (backend active recipe) vs Sent (plc-service lastWrite) */}
      {(intendedObj || sentObj) && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Recipe Parameters — Intended vs Sent
            </h2>
            {writeSource && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 italic">
                  Source: <span className="font-semibold">{writeSource}</span>
                </div>
                {writeSource === "Backend (intended)" && (
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded border border-yellow-300">
                    Not sent — PLC disconnected
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "curingTemp", label: "Curing Temp", unit: "°C" },
                  { key: "tempBandPlus", label: "Temp Band +", unit: "°C" },
                  { key: "tempBandMinus", label: "Temp Band -", unit: "°C" },
                  { key: "pressure", label: "Pressure", unit: "PSI" },
                  {
                    key: "pressureBandPlus",
                    label: "Pressure Band +",
                    unit: "PSI",
                  },
                  { key: "curingTime", label: "Curing Time", unit: "s" },
                  { key: "exhaustDelay", label: "Exhaust Delay", unit: "s" },
                  {
                    key: "purgingCycles",
                    label: "Purging Cycles",
                    unit: "count",
                  },
                ].map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {p.label}
                      </div>
                      <div className="text-xs text-gray-500">{p.unit}</div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Intended</div>
                        <div className="font-semibold text-gray-800">
                          {typeof intendedObj?.[p.key] === "number"
                            ? (intendedObj![p.key] as number).toFixed(
                                p.key.includes("Time") ||
                                  p.key === "purgingCycles"
                                  ? 0
                                  : 2,
                              )
                            : "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">Sent</div>
                        <div className="font-semibold text-gray-800">
                          {typeof sentObj?.[p.key] === "number"
                            ? (sentObj![p.key] as number).toFixed(
                                p.key.includes("Time") ||
                                  p.key === "purgingCycles"
                                  ? 0
                                  : 2,
                              )
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Pressure Bands (Zones)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((z) => (
                      <div key={z} className="p-3 rounded border bg-gray-50">
                        <div className="text-sm font-medium text-gray-700">
                          Zone {z}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          HIGH / LOW
                        </div>
                        <div className="mt-1">
                          <div className="text-xs text-gray-500">
                            Intended:{" "}
                            <span className="font-semibold">
                              {typeof intendedObj?.[`high${z}`] === "number"
                                ? (intendedObj![`high${z}`] as number).toFixed(
                                    2,
                                  )
                                : "—"}
                            </span>{" "}
                            /{" "}
                            <span className="font-semibold">
                              {typeof intendedObj?.[`low${z}`] === "number"
                                ? (intendedObj![`low${z}`] as number).toFixed(2)
                                : "—"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Sent:{" "}
                            <span className="font-semibold">
                              {typeof sentObj?.[`high${z}`] === "number"
                                ? (sentObj![`high${z}`] as number).toFixed(2)
                                : "—"}
                            </span>{" "}
                            /{" "}
                            <span className="font-semibold">
                              {typeof sentObj?.[`low${z}`] === "number"
                                ? (sentObj![`low${z}`] as number).toFixed(2)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white p-4 rounded border">
                <h4 className="text-sm font-semibold text-gray-700">
                  Metadata
                </h4>
                <div className="mt-3 text-sm text-gray-600">
                  <div>
                    Source:{" "}
                    <span className="font-semibold">{writeSource ?? "—"}</span>
                  </div>
                  <div className="mt-2">
                    Last write:{" "}
                    <span className="font-semibold">
                      {writeTimestamp
                        ? new Date(writeTimestamp).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="mt-2">
                    PLC Connected:{" "}
                    <span
                      className={`font-semibold ${data.connected ? "text-green-700" : "text-red-700"}`}
                    >
                      {data.connected ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Available Message */}
      {!data.lastRead && !data.lastWrite && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <p className="text-yellow-800 text-center font-semibold">
            ⚠️ No data available yet. Connect the PLC and run a recipe to see
            values here.
          </p>
        </div>
      )}
    </div>
  );
}
