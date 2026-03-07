import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import type { Recipe } from "../api";

interface SchedulerData {
  running: Recipe | null;
  upcoming: Recipe[];
  completed: Recipe[];
}

export function useSchedulerSocket(machineId: string | undefined) {
  const [scheduler, setScheduler] = useState<SchedulerData>({
    running: null,
    upcoming: [],
    completed: [],
  });

  useEffect(() => {
    if (!machineId) return;

    const newSocket: Socket = io({
      query: { machine: machineId },
    });

    // Listen to scheduler events
    newSocket.on(
      "scheduler-updated",
      (data: {
        machineId: string;
        action: string;
        recipe?: Recipe;
        recipeId?: number;
      }) => {
        if (data.machineId !== machineId) return;

        setScheduler((prev) => {
          const newState = { ...prev };

          if (data.action === "created" && data.recipe) {
            if (data.recipe.status === "pending") {
              newState.upcoming = [...newState.upcoming, data.recipe].sort(
                (a, b) =>
                  new Date(a.scheduledAt!).getTime() -
                  new Date(b.scheduledAt!).getTime(),
              );
            }
          } else if (data.action === "updated" && data.recipe) {
            // Update in lists
            if (data.recipe.status === "activated") {
              newState.running = data.recipe;
              newState.upcoming = newState.upcoming.filter(
                (r) => r.id !== data.recipe!.id,
              );
            } else if (data.recipe.status === "pending") {
              newState.upcoming = newState.upcoming.map((r) =>
                r.id === data.recipe!.id ? data.recipe! : r,
              );
            } else if (data.recipe.status === "expired") {
              newState.completed = [data.recipe!, ...newState.completed];
              newState.running = null;
            }
          } else if (data.action === "activated" && data.recipe) {
            newState.running = data.recipe;
            newState.upcoming = newState.upcoming.filter(
              (r) => r.id !== data.recipe!.id,
            );
          } else if (data.action === "deleted" && data.recipeId) {
            newState.upcoming = newState.upcoming.filter(
              (r) => r.id !== data.recipeId,
            );
            newState.completed = newState.completed.filter(
              (r) => r.id !== data.recipeId,
            );
            if (newState.running?.id === data.recipeId) {
              newState.running = null;
            }
          }

          return newState;
        });
      },
    );

    return () => {
      newSocket.disconnect();
    };
  }, [machineId]);

  return { scheduler, setScheduler };
}
