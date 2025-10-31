"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { useCallback, useEffect, useState } from "react";

interface SeverityLevel {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SeverityLevelsPage() {
  const [severityLevels, setSeverityLevels] = useState<SeverityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SeverityLevel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    min_score: 0,
    max_score: 0,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSeverityLevels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/v2/admin/severity-levels`);
      const result = await response.json();
      setSeverityLevels(result.data || []);
    } catch (error) {
      console.error("Error fetching severity levels:", error);
      alert("Failed to fetch severity levels");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchSeverityLevels();
  }, [fetchSeverityLevels]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      min_score: 0,
      max_score: 0,
      description: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (item: SeverityLevel) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      min_score: item.min_score,
      max_score: item.max_score,
      description: item.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: SeverityLevel) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/severity-levels/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete severity level");
      }

      alert("Severity level deleted successfully");
      fetchSeverityLevels();
    } catch (error) {
      console.error("Error deleting severity level:", error);
      alert("Failed to delete severity level");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `${apiUrl}/api/v2/admin/severity-levels/${editingItem.id}`
        : `${apiUrl}/api/v2/admin/severity-levels`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save severity level");
      }

      alert(
        editingItem
          ? "Severity level updated successfully"
          : "Severity level created successfully"
      );
      setModalOpen(false);
      fetchSeverityLevels();
    } catch (error) {
      console.error("Error saving severity level:", error);
      alert("Failed to save severity level");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "name",
      label: "Level Name",
    },
    {
      key: "min_score",
      label: "Min Score",
    },
    {
      key: "max_score",
      label: "Max Score",
    },
    {
      key: "description",
      label: "Description",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Severity Levels</h1>
            <p className="text-gray-600 mt-2">
              Kelola tingkat keparahan untuk kondisi kulit
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Severity Level
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={severityLevels}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No severity levels found"
        />

        {/* Form Modal */}
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Severity Level" : "Add New Severity Level"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Level Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mild"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.min_score}
                  onChange={(e) =>
                    setFormData({ ...formData, min_score: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.max_score}
                  onChange={(e) =>
                    setFormData({ ...formData, max_score: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description for this severity level"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingItem
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </FormModal>
      </div>
    </AdminLayout>
  );
}
