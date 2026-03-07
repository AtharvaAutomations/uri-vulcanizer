import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { MachineSelector } from "../components/MachineSelector";

interface DashboardLayoutProps {
  children: ReactNode;
  page: string;
  setPage: (p: string) => void;
}

export default function DashboardLayout({
  children,
  page,
  setPage,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Machine Selector */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow z-40 flex items-center justify-between px-8 py-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-gray-800">Vulcanizer System</h1>

        <MachineSelector />
      </header>

      <div className="flex flex-1 pt-20">
        {/* Fixed Sidebar */}
        <div
          className={`fixed top-20 left-0 h-screen bg-white shadow z-40 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
          }`}
        >
          <Sidebar page={page} setPage={setPage} />
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <main className="p-8 space-y-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
