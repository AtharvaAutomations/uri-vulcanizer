import { useState, useEffect } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import { PageContext } from "./PageContext";
import { MachineProvider } from "./context/MachineContext";

// Pages
import LiveDashboardPage from "./pages/LiveDashboardPage";
import HistoryPage from "./pages/HistoryPage";
import RecipesPage from "./pages/RecipePage";
import ReportsPage from "./pages/ReportsPage";
import RecipeForm from "./pages/RecipeForm";
import SchedulerPage from "./pages/SchedulerPage";
import PlcMonitorPage from "./pages/MonitorPage";
import MainRecipesPage from "./pages/MainRecipesPage";

export default function App() {
  const [page, setPage] = useState<string>(() => {
    const savedPage = localStorage.getItem("currentPage");
    return savedPage || "live";
  });

  useEffect(() => {
    localStorage.setItem("currentPage", page);
  }, [page]);

  return (
    <MachineProvider>
      <PageContext.Provider value={{ setPage }}>
        <DashboardLayout page={page} setPage={setPage}>
          {page === "live" && <LiveDashboardPage />}
          {page === "history" && <HistoryPage />}
          {page === "recipes" && <RecipesPage />}
          {page === "reports" && <ReportsPage />}
          {page === "recipe-form" && (
            <RecipeForm onSubmit={() => setPage("/recipes")} />
          )}
          {page === "scheduler" && <SchedulerPage />}
          {page === "monitor" && <PlcMonitorPage />}
          {page === "main-recipes" && <MainRecipesPage />}
        </DashboardLayout>
      </PageContext.Provider>
    </MachineProvider>
  );
}
