import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/lib/auth/AuthContext";

export function AddProperty() {
  const db = usePowerSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || saving) return;

    setSaving(true);
    try {
      await db.execute(
        "INSERT INTO properties (id, name, address, description, amenities, host_id, created_at) VALUES (uuid(), ?, ?, ?, '', ?, ?)",
        [name.trim(), address.trim(), description.trim(), user!.id, new Date().toISOString()],
      );
      navigate("/");
    } catch (err) {
      console.error("Failed to add property:", err);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Property</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Seventh Haven at Leo Residences"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="e.g. C10-2, Leo Residences, Lavington, Nairobi"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description for guests..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Property"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
