import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { Layout } from "./components/Layout";
import { HiveDashboard } from "./pages/HiveDashboard";
import { PropertyDetail } from "./pages/PropertyDetail";
import { BookingDetail } from "./pages/BookingDetail";
// AgentChat moved to floating BeeChat widget in Layout
import { AddProperty } from "./pages/AddProperty";
import { Login } from "./pages/Login";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-600">Jamii</h1>
          <p className="text-gray-400 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HiveDashboard />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/booking/:id" element={<BookingDetail />} />
        {/* AI Agent is now the floating BeeChat widget */}
        <Route path="/add-property" element={<AddProperty />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
