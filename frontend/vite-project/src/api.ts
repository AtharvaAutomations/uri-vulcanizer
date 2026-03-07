const API = "";

// Helper to add machine parameter to URLs
const withMachine = (url: string, machineId: string): string => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}machine=${machineId}`;
};

export interface Recipe {
  id?: number;
  machineId?: string;
  name: string;

  curingTemp: number;
  tempBandPlus: number;
  tempBandMinus: number;

  pressure: number;
  pressureBandPlus: number;
  pressureBandMinus: number;

  curingTime: number;
  exhaustDelay: number;
  purgingCycles: number;

  high1: number;
  low1: number;
  high2: number;
  low2: number;
  high3: number;
  low3: number;
  high4: number;
  low4: number;
  high5: number;
  low5: number;

  scheduledAt?: string | null;
  status?: string;
  createdAt?: string;

  /** 🔥 Add missing backend fields */
  version?: number;
  activatedAt?: string | null;
  finishedAt?: string | null;
}

export interface ChangeLog {
  id: number;
  timestamp: string;
  user?: string | null;
  action: string;
  details: unknown;
}

export const getRecipes = (machineId: string): Promise<Recipe[]> =>
  fetch(withMachine(`${API}/api/recipes`, machineId)).then((r) => r.json());

// ----- additional helpers & types for other pages -----

export interface HistoryReading {
  id: number;
  temperature: number;
  pressure: number;
  cycleNumber: number;
  timestamp: string;
}

export const getHistory = (
  machineId: string,
  from: string,
  to: string,
  cycleNumber?: number,
): Promise<HistoryReading[]> => {
  let url = withMachine(
    `${API}/api/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    machineId,
  );
  if (cycleNumber !== undefined && cycleNumber !== null) {
    url += `&cycleNumber=${cycleNumber}`;
  }
  return fetch(url).then((r) => r.json());
};

export interface SchedulerRecipe {
  id: number;
  name: string;
  version: number;
  status: string;
  scheduledAt: string | null;
  activatedAt: string | null;
  finishedAt: string | null;
}

export interface SchedulerData {
  upcoming: SchedulerRecipe[];
  completed: SchedulerRecipe[];
  running?: SchedulerRecipe | null;
}

export const getScheduler = (machineId: string): Promise<SchedulerData> =>
  fetch(withMachine(`${API}/api/scheduler`, machineId)).then((r) => r.json());

export interface PlcMonitorData {
  connected: boolean;
  lastRead: {
    temperature: number;
    pressure: number;
    timestamp: string;
  } | null;
  lastWrite: {
    recipe: string;
    data: Record<string, number>;
    timestamp: string;
  } | null;
  activeRecipe: Recipe | null;
}

export const getPlcMonitor = (machineId: string): Promise<PlcMonitorData> =>
  fetch(withMachine(`${API}/api/plc/monitor`, machineId)).then((r) => r.json());

export const getReportCycles = (
  machineId: string,
): Promise<{ cycles: string[] }> =>
  fetch(withMachine(`${API}/api/reports/cycles`, machineId)).then((r) =>
    r.json(),
  );

export const createRecipe = (
  data: Recipe,
  machineId: string,
): Promise<Recipe> =>
  fetch(withMachine(`${API}/api/recipes`, machineId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const updateRecipe = (
  id: number,
  data: Partial<Recipe>,
  machineId: string,
): Promise<Recipe> =>
  fetch(withMachine(`${API}/api/recipes/${id}`, machineId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const deleteRecipe = (
  id: number,
  machineId: string,
): Promise<{ status: string }> =>
  fetch(withMachine(`${API}/api/recipes/${id}`, machineId), {
    method: "DELETE",
  }).then((r) => r.json());

export const getLogs = (): Promise<ChangeLog[]> =>
  fetch(`${API}/api/logs`).then((r) => r.json());
