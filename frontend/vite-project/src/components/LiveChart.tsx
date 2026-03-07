import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ChartPoint {
  time: number;
  [key: string]: number | string | undefined | null;
}

interface LiveChartProps {
  title: string;
  data: ChartPoint[];
  dataKey: string;
  color: string;
  lowerLimit?: number;
  upperLimit?: number;
  target?: number;
}

export default function LiveChart({
  title,
  data,
  dataKey,
  color,
  lowerLimit,
  upperLimit,
  target,
}: LiveChartProps) {
  // derive two series so segments can be colored differently depending on range
  const hasLimits = lowerLimit !== undefined && upperLimit !== undefined;

  const inRangeData: ChartPoint[] = data.map((pt) => {
    if (!hasLimits) return pt;
    const val = pt[dataKey] as number | null | undefined;
    if (val !== null && val !== undefined) {
      return val >= (lowerLimit as number) && val <= (upperLimit as number)
        ? pt
        : { ...pt, [dataKey]: null };
    }
    return pt;
  });

  const outOfRangeData: ChartPoint[] = data.map((pt) => {
    if (!hasLimits) return { ...pt, [dataKey]: null };
    const val = pt[dataKey] as number | null | undefined;
    if (val !== null && val !== undefined) {
      return val < (lowerLimit as number) || val > (upperLimit as number)
        ? pt
        : { ...pt, [dataKey]: null };
    }
    return { ...pt, [dataKey]: null };
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-6 h-[350px] border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => new Date(t).toLocaleTimeString()}
            stroke="#6b7280"
          />
          <YAxis stroke="#6b7280" />
          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleTimeString()}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          />

          {/* horizontal lines showing configured limits/target */}
          {lowerLimit !== undefined && (
            <ReferenceLine
              y={lowerLimit}
              stroke="#f59e0b"
              strokeDasharray="3 3"
            />
          )}
          {upperLimit !== undefined && (
            <ReferenceLine
              y={upperLimit}
              stroke="#f59e0b"
              strokeDasharray="3 3"
            />
          )}
          {target !== undefined && (
            <ReferenceLine y={target} stroke="#3b82f6" />
          )}

          {/* if limits provided, split series into in/out segments otherwise render single line */}
          {hasLimits ? (
            <>
              <Line
                type="monotone"
                data={inRangeData}
                dataKey={dataKey}
                stroke="#10b981" /* green */
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                data={outOfRangeData}
                dataKey={dataKey}
                stroke="#ef4444" /* red */
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
