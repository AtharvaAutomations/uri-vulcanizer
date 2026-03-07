interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
}

export default function Sidebar({ page, setPage }: SidebarProps) {
  const btn = (p: string, label: string) => (
    <button
      onClick={() => setPage(p)}
      className={`w-full text-left text-lg font-medium p-2 rounded 
        ${page === p ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
    >
      {label}
    </button>
  );

  return (
    <aside className="h-full bg-white shadow p-5 overflow-y-auto flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Vulcanizer</h1>

      <nav className="space-y-3 flex-1">
        {btn("live", "Live Dashboard")}
        {btn("history", "History")}
        {btn("reports", "Reports")}
        {btn("recipe-form", "Recipe Form")}
        {btn("main-recipes", "Recipes")}
        {btn("recipes", "Recipes Scheduler")}
        {btn("scheduler", "Scheduler")}
        {btn("monitor", "Monitor")}
      </nav>
    </aside>
  );
}
