import { Link, Outlet, useLocation } from "react-router-dom";
import { SyncStatus } from "./SyncStatus";
import { BeeChat } from "./BeeChat";
import { useAuth } from "@/lib/auth/AuthContext";

export function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-amber-600">
            Jamii
          </Link>
          <nav className="flex gap-1">
            <Link
              to="/"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === "/"
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Hive
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SyncStatus />
          <span className="text-xs text-gray-400 hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>

      {/* Floating Bee Chat */}
      <BeeChat />
    </div>
  );
}
