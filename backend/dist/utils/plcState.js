"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentRecipe = setCurrentRecipe;
exports.getCurrentRecipe = getCurrentRecipe;
const currentRecipes = new Map();
function setCurrentRecipe(recipe) {
    currentRecipes.set(recipe.machineId, recipe);
}
function getCurrentRecipe(machineId) {
    return currentRecipes.get(machineId) || null;
}
