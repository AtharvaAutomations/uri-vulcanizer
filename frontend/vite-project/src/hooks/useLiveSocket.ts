import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

export type ChartPoint = {
  time: number;
  temperature?: number | null;
  pressure?: number | null;
};

export interface LiveData {
  temperature: number;
  pressure: number;
  timestamp?: string | number;
}

const MAX_POINTS = 60;

/**
 * Hook that manages a socket.io connection and provides live data
 * and two chart series (temperature / pressure) for the given machine.
 *
 * The connection is automatically closed when the component unmounts
 * or when `machine` changes.
 */
export function useLiveData(machine: string | undefined) {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [tempSeries, setTempSeries] = useState<ChartPoint[]>([]);
  const [pressureSeries, setPressureSeries] = useState<ChartPoint[]>([]);

  useEffect(() => {
    if (!machine) return;

    const socket: Socket = io({
      query: { machine },
    });

    function handle(data: LiveData) {
      setLiveData(data);

      setTempSeries((prev) => {
        const next = [
          ...prev,
          { time: Date.now(), temperature: data.temperature },
        ];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });

      setPressureSeries((prev) => {
        const next = [...prev, { time: Date.now(), pressure: data.pressure }];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    }

    socket.on(`live-data:${machine}`, handle);
    return () => {
      socket.off(`live-data:${machine}`, handle);
      socket.disconnect();
    };
  }, [machine]);

  return {
    liveData,
    tempSeries,
    pressureSeries,
  } as const;
}
