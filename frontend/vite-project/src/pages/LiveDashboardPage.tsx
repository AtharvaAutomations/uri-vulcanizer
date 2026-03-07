import { useState } from "react";

import LiveChart from "../components/LiveChart";
import ValueCard from "../components/ValueCard";
import { useMachine } from "../context/useMachine";
import { useLiveData } from "../hooks/useLiveSocket";

export default function LiveDashboardPage() {
  const { selectedMachine } = useMachine();

  const {
    liveData,
    tempSeries: liveChartTemp,
    pressureSeries: liveChartPressure,
  } = useLiveData(selectedMachine);

  // user-specified limits
  const [tempLower, setTempLower] = useState<number | "">("");
  const [tempUpper, setTempUpper] = useState<number | "">("");
  const [presLower, setPresLower] = useState<number | "">("");
  const [presUpper, setPresUpper] = useState<number | "">("");

  return (
    <>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        Live Dashboard
      </h2>

      {/* Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ValueCard
          label="Temperature"
          value={liveData?.temperature}
          unit="°C"
        />
        <ValueCard label="Pressure" value={liveData?.pressure} unit="PSI" />
      </div>

      {/* Limit inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">
            Temperature bounds
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Lower"
              value={tempLower}
              onChange={(e) =>
                setTempLower(e.target.value === "" ? "" : +e.target.value)
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Upper"
              value={tempUpper}
              onChange={(e) =>
                setTempUpper(e.target.value === "" ? "" : +e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Pressure bounds</h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Lower"
              value={presLower}
              onChange={(e) =>
                setPresLower(e.target.value === "" ? "" : +e.target.value)
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Upper"
              value={presUpper}
              onChange={(e) =>
                setPresUpper(e.target.value === "" ? "" : +e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <LiveChart
          title="Live Temperature Chart"
          data={liveChartTemp}
          dataKey="temperature"
          color="#ef4444"
          lowerLimit={typeof tempLower === "number" ? tempLower : undefined}
          upperLimit={typeof tempUpper === "number" ? tempUpper : undefined}
          target={
            typeof tempLower === "number" && typeof tempUpper === "number"
              ? (tempLower + tempUpper) / 2
              : undefined
          }
        />

        <LiveChart
          title="Live Pressure Chart"
          data={liveChartPressure}
          dataKey="pressure"
          color="#3b82f6"
          lowerLimit={typeof presLower === "number" ? presLower : undefined}
          upperLimit={typeof presUpper === "number" ? presUpper : undefined}
          target={
            typeof presLower === "number" && typeof presUpper === "number"
              ? (presLower + presUpper) / 2
              : undefined
          }
        />
      </div>
    </>
  );
}
