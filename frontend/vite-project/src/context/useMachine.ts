import React, { createContext } from "react";

export type MachineId = "machine1" | "machine2";

export interface MachineContextType {
  selectedMachine: MachineId;
  setSelectedMachine: (machine: MachineId) => void;
}

export const MachineContext = createContext<MachineContextType | undefined>(
  undefined,
);

export const useMachine = () => {
  const context = React.useContext(MachineContext);
  if (!context) {
    throw new Error("useMachine must be used within MachineProvider");
  }
  return context;
};
