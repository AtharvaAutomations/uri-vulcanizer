import { useEffect, useState, useContext } from "react";
import { getRecipes, deleteRecipe, type Recipe } from "../api";
import { useMachine } from "../context/useMachine";
import Modal from "../components/Modal";
import { PageContext } from "../PageContext";

export default function MainRecipesPage() {
  const pageCtx = useContext(PageContext);
  const setPage = pageCtx?.setPage;
  const { selectedMachine } = useMachine();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // function moved outside so it can be reused by handlers
  const load = async () => {
    const allRecipes = await getRecipes(selectedMachine);
    // Filter to show only main recipes (version 1)
    const mainRecipes = allRecipes.filter((r) => r.version === 1);
    setRecipes(mainRecipes);
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
    // Poll every 10 seconds to update status
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [selectedMachine]);

  const handleDelete = async (id: number | undefined) => {
    if (
      confirm(
        "Are you sure you want to delete this recipe? This action cannot be undone.",
      )
    ) {
      try {
        if (typeof id === "number") await deleteRecipe(id, selectedMachine);
        await load();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        alert("Error deleting recipe: " + msg);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏱" },
      activated: { bg: "bg-green-100", text: "text-green-800", icon: "✓" },
      expired: { bg: "bg-red-100", text: "text-red-800", icon: "✕" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Recipe Templates</h1>
          <p className="text-gray-600 mt-2">
            View and manage recipe templates (base versions)
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
          onClick={() => setPage && setPage("recipe-form")}
        >
          + New Recipe
        </button>
      </div>

      {/* Main Recipes Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {recipes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              📭 No recipe templates found
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Recipe Name</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Last Activation</th>
                <th className="p-4 text-left font-semibold">Created Date</th>
                <th className="p-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe, idx) => (
                <tr
                  key={recipe.id}
                  className={`border-b transition hover:bg-purple-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-4 font-semibold text-gray-800">
                    {recipe.name}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(recipe.status ?? "pending")}
                  </td>
                  <td className="p-4 text-gray-600">
                    {recipe.activatedAt
                      ? new Date(recipe.activatedAt).toLocaleString()
                      : "Never activated"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {recipe.createdAt
                      ? new Date(recipe.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setViewModalOpen(true);
                      }}
                    >
                      👁️ View
                    </button>

                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                      onClick={() => handleDelete(recipe.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className="bg-white p-6 rounded-lg max-w-2xl max-h-96 overflow-y-auto">
          {selectedRecipe && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedRecipe.name}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedRecipe.status}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-sm">Version</p>
                  <p className="text-lg font-semibold text-gray-800">
                    v{selectedRecipe.version}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Parameters</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Curing Temp</p>
                    <p className="font-semibold">
                      {selectedRecipe.curingTemp.toFixed(2)}°C
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Pressure</p>
                    <p className="font-semibold">
                      {selectedRecipe.pressure.toFixed(2)} PSI
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Curing Time</p>
                    <p className="font-semibold">
                      {selectedRecipe.curingTime}s
                    </p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <p className="text-gray-600">Temp Band +</p>
                    <p className="font-semibold">
                      {selectedRecipe.tempBandPlus.toFixed(2)}°C
                    </p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <p className="text-gray-600">Temp Band -</p>
                    <p className="font-semibold">
                      {selectedRecipe.tempBandMinus.toFixed(2)}°C
                    </p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <p className="text-gray-600">Pressure Band +</p>
                    <p className="font-semibold">
                      {selectedRecipe.pressureBandPlus.toFixed(2)} PSI
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded">
                    <p className="text-gray-600">Exhaust Delay</p>
                    <p className="font-semibold">
                      {selectedRecipe.exhaustDelay}s
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded">
                    <p className="text-gray-600">Purging Cycles</p>
                    <p className="font-semibold">
                      {selectedRecipe.purgingCycles}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded">
                    <p className="text-gray-600">Pressure Band -</p>
                    <p className="font-semibold">
                      {selectedRecipe.pressureBandMinus.toFixed(2)} PSI
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Pressure Bands (Zones)
                </h3>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  {[1, 2, 3, 4, 5].map((z) => {
                    const recipe = selectedRecipe as unknown as Record<
                      string,
                      number
                    >;
                    return (
                      <div key={z} className="bg-gray-50 p-2 rounded">
                        <p className="font-semibold">Zone {z}</p>
                        <p className="text-xs text-gray-600">
                          HIGH: {recipe[`high${z}`].toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          LOW: {recipe[`low${z}`].toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setViewModalOpen(false)}
                className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
