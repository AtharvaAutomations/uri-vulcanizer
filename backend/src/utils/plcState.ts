import { Recipe } from "@prisma/client";

const currentRecipes: Map<string, Recipe | null> = new Map();

export function setCurrentRecipe(recipe: Recipe) {
  currentRecipes.set(recipe.machineId, recipe);
}

export function getCurrentRecipe(machineId: string) {
  return currentRecipes.get(machineId) || null;
}
