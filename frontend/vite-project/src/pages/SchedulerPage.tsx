import { useEffect } from "react";
import { useMachine } from "../context/useMachine";
import { getScheduler, type SchedulerData, type Recipe } from "../api";
import { useSchedulerSocket } from "../hooks/useSchedulerSocket";

// Recipe interface now exported as SchedulerRecipe

export default function SchedulerPage() {
  const { selectedMachine } = useMachine();
  const { scheduler, setScheduler } = useSchedulerSocket(selectedMachine);

  // Load initial data
  const loadData = async () => {
    try {
      const data: SchedulerData = await getScheduler(selectedMachine);
      setScheduler({
        running: data.running as Recipe | null,
        upcoming: data.upcoming as Recipe[],
        completed: data.completed as Recipe[],
      });
    } catch (err) {
      // Failed to load scheduler data - will show empty state
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMachine]);

  const { upcoming, completed, running } = scheduler;

  return (
    <div className="space-y-10 p-6">
      {/* Running Now */}
      {running && (
        <div className="bg-green-100 border border-green-300 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            ▶ Running Now
          </h2>
          <p className="text-lg font-semibold">
            {running.name} (v{running.version})
          </p>
          <p className="text-gray-700">
            Activated at: {new Date(running.activatedAt!).toLocaleString()}
          </p>
        </div>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-blue-800">
          Upcoming Schedule
        </h2>

        {upcoming.length === 0 ? (
          <p className="text-gray-500">No upcoming recipes scheduled.</p>
        ) : (
          <div className="border-l-4 border-blue-600 pl-6 space-y-6">
            {upcoming.map((r) => (
              <div key={r.id} className="relative">
                <div className="absolute -left-3 top-2 w-4 h-4 bg-blue-600 rounded-full"></div>

                <div className="bg-white shadow p-4 rounded-lg">
                  <p className="font-bold text-lg text-blue-700">
                    {new Date(r.scheduledAt!).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {r.name} (v{r.version})
                  </p>
                  <p className="text-gray-600">
                    Starts at: {new Date(r.scheduledAt!).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Completed Recipes
        </h2>

        {completed.length === 0 ? (
          <p className="text-gray-500">No completed recipes yet.</p>
        ) : (
          <div className="border-l-4 border-gray-400 pl-6 space-y-6">
            {completed.map((r) => (
              <div key={r.id} className="relative">
                <div className="absolute -left-3 top-2 w-4 h-4 bg-gray-600 rounded-full"></div>

                <div className="bg-gray-50 shadow p-4 rounded-lg">
                  <p className="font-bold text-lg text-gray-800">
                    ✓ {r.name} (v{r.version})
                  </p>
                  <p className="text-gray-600">
                    Finished at: {new Date(r.finishedAt!).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
