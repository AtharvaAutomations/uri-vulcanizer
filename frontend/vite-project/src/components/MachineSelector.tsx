import { useMachine } from "../context/useMachine";

export const MachineSelector = () => {
  const { selectedMachine, setSelectedMachine } = useMachine();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Machine:</label>
      <select
        value={selectedMachine}
        onChange={(e) =>
          setSelectedMachine(e.target.value as "machine1" | "machine2")
        }
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <option value="machine1">Machine 1</option>
        <option value="machine2">Machine 2</option>
      </select>
    </div>
  );
};
