import { useContext, useEffect, useState } from "react";
import { PageContext } from "../PageContext";
import { useMachine } from "../context/useMachine";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type Recipe,
} from "../api";
import Modal from "../components/Modal";
import RecipeForm from "./RecipeForm";
import { useRecipesSocket } from "../hooks/useRecipesSocket";

export default function RecipesPage() {
  const pageCtx = useContext(PageContext);
  const setPage = pageCtx?.setPage;
  const { selectedMachine } = useMachine();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [filterName, setFilterName] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const { recipes, setRecipes } = useRecipesSocket(selectedMachine);

  const load = async () => {
    const allRecipes = await getRecipes(selectedMachine);
    setRecipes(allRecipes);
  };

  useEffect(() => {
    load(); // Load initial data
  }, [selectedMachine]);

  const handleSave = async (data: Recipe) => {
    try {
      if (editing && editing.id) {
        await updateRecipe(editing.id, data, selectedMachine);
      } else {
        await createRecipe(data, selectedMachine);
      }
      setOpen(false);
      setEditing(null);
      // No need to reload, socket will update
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      alert("Error saving recipe: " + msg);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (
      confirm(
        "Are you sure you want to delete this recipe? This action cannot be undone.",
      )
    ) {
      try {
        if (typeof id === "number") await deleteRecipe(id, selectedMachine);
        // No need to reload, socket will update
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

  const filteredRecipes =
    filterName === ""
      ? recipes
      : recipes.filter((r) =>
          r.name.toLowerCase().includes(filterName.toLowerCase()),
        );

  // Pagination logic
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const adjustedCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (adjustedCurrentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedRecipes = filteredRecipes.slice(startIdx, endIdx);

  const sendToPLC = async (recipe: Recipe) => {
    try {
      await fetch("http://localhost:3001/api/plc/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
      alert("Recipe sent to PLC");
    } catch {
      alert("Failed to send recipe");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Recipe Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and schedule vulcanizer recipes
          </p>
        </div>
      </div>

      {/* Filters - Matching theme */}
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
            🔍
          </span>
          Filter by Recipe Name
        </h2>
        <div className="flex gap-4">
          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- All Recipes --</option>
            {recipes
              .map((r) => r.name)
              .filter((name, idx, arr) => arr.indexOf(name) === idx)
              .sort()
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Recipes Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredRecipes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">📭 No recipes found</p>
            <button
              onClick={() => setPage && setPage("recipe-form")}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Create your first recipe
            </button>
          </div>
        ) : (
          <>
            {/* Items per page selector */}
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="itemsPerPage"
                  className="text-sm font-semibold text-gray-700"
                >
                  Show entries:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing{" "}
                {adjustedCurrentPage === 0
                  ? 0
                  : (adjustedCurrentPage - 1) * itemsPerPage + 1}{" "}
                to{" "}
                {Math.min(
                  adjustedCurrentPage * itemsPerPage,
                  filteredRecipes.length,
                )}{" "}
                of {filteredRecipes.length} recipes
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Recipe Name</th>
                  <th className="p-4 text-left font-semibold">Version</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">
                    Scheduled Activation
                  </th>
                  <th className="p-4 text-left font-semibold">Created Date</th>
                  <th className="p-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecipes.map((recipe, idx) => (
                  <tr
                    key={recipe.id}
                    className={`border-b transition hover:bg-blue-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-4 font-semibold text-gray-800">
                      {recipe.name}
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                        v{recipe.version}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(recipe.status ?? "pending")}
                    </td>
                    <td className="p-4 text-gray-600">
                      {recipe.scheduledAt
                        ? new Date(recipe.scheduledAt).toLocaleString()
                        : "Not scheduled"}
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
                          setEditing({ ...recipe });
                          setOpen(true);
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                        onClick={() => handleDelete(recipe.id)}
                      >
                        🗑️ Delete
                      </button>

                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                        onClick={() => sendToPLC(recipe)}
                      >
                        📤 Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="bg-gray-50 border-t p-4 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={adjustedCurrentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition ${
                        adjustedCurrentPage === page
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={adjustedCurrentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal for editing */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <RecipeForm
          initial={
            editing
              ? { ...editing, scheduledAt: editing.scheduledAt ?? undefined }
              : undefined
          }
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  );
}
