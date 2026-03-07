import React, { useState, useCallback } from "react";
import { MachineContext, type MachineId } from "./useMachine";

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedMachine, setSelectedMachineState] = useState<MachineId>(() => {
    const saved = localStorage.getItem("selectedMachine");
    return (saved as MachineId) || "machine1";
  });

  const handleSetMachine = useCallback((machine: MachineId) => {
    setSelectedMachineState(machine);
    localStorage.setItem("selectedMachine", machine);
  }, []);

  return (
    <MachineContext.Provider
      value={{ selectedMachine, setSelectedMachine: handleSetMachine }}
    >
      {children}
    </MachineContext.Provider>
  );
};
