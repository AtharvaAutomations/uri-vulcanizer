import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import type { Recipe } from "../api";

export function useRecipesSocket(machineId: string | undefined) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!machineId) return;

    const newSocket: Socket = io({
      query: { machine: machineId },
    });

    setSocket(newSocket);

    // Listen to recipe events
    newSocket.on("recipe-created", (recipe: Recipe) => {
      if (recipe.machineId === machineId) {
        setRecipes((prev) => [recipe, ...prev]);
      }
    });

    newSocket.on("recipe-updated", (recipe: Recipe) => {
      if (recipe.machineId === machineId) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipe.id ? recipe : r)),
        );
      }
    });

    newSocket.on(
      "recipe-deleted",
      (data: { id: number; machineId: string }) => {
        if (data.machineId === machineId) {
          setRecipes((prev) => prev.filter((r) => r.id !== data.id));
        }
      },
    );

    return () => {
      newSocket.disconnect();
    };
  }, [machineId]);

  return { recipes, setRecipes, socket };
}
