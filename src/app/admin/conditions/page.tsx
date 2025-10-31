"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { useCallback, useEffect, useState } from "react";

interface Condition {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Condition | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchConditions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/v2/admin/conditions`);
      const result = await response.json();
      setConditions(result.data || []);
    } catch (error) {
      console.error("Error fetching conditions:", error);
      alert("Failed to fetch conditions");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (item: Condition) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: Condition) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/conditions/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete condition");
      }

      alert("Condition deleted successfully");
      fetchConditions();
    } catch (error) {
      console.error("Error deleting condition:", error);
      alert("Failed to delete condition");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `${apiUrl}/api/v2/admin/conditions/${editingItem.id}`
        : `${apiUrl}/api/v2/admin/conditions`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save condition");
      }

      alert(
        editingItem
          ? "Condition updated successfully"
          : "Condition created successfully"
      );
      setModalOpen(false);
      fetchConditions();
    } catch (error) {
      console.error("Error saving condition:", error);
      alert("Failed to save condition");
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
      label: "Name",
    },
    {
      key: "description",
      label: "Description",
      render: (item: Condition) => (
        <span className="line-clamp-2">{item.description}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conditions</h1>
            <p className="text-gray-600 mt-2">
              Kelola kondisi kulit untuk sistem rekomendasi
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
            Add Condition
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={conditions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No conditions found"
        />

        {/* Form Modal */}
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Condition" : "Add New Condition"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Acne"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the skin condition..."
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
