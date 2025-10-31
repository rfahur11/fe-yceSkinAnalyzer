"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { useCallback, useEffect, useState } from "react";

interface Ingredient {
  id: number;
  name: string;
  generic_name: string;
  benefit: string;
  warnings: string;
  created_at?: string;
  updated_at?: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    benefit: "",
    warnings: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `${apiUrl}/api/v2/admin/ingredients?search=${encodeURIComponent(searchTerm)}`
        : `${apiUrl}/api/v2/admin/ingredients`;
      
      const response = await fetch(url);
      const result = await response.json();
      setIngredients(result.data || []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      alert("Failed to fetch ingredients");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, apiUrl]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      generic_name: "",
      benefit: "",
      warnings: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      generic_name: item.generic_name,
      benefit: item.benefit,
      warnings: item.warnings,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: Ingredient) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/ingredients/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete ingredient");
      }

      alert("Ingredient deleted successfully");
      fetchIngredients();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Failed to delete ingredient");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `${apiUrl}/api/v2/admin/ingredients/${editingItem.id}`
        : `${apiUrl}/api/v2/admin/ingredients`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save ingredient");
      }

      alert(
        editingItem
          ? "Ingredient updated successfully"
          : "Ingredient created successfully"
      );
      setModalOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error("Error saving ingredient:", error);
      alert("Failed to save ingredient");
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
      key: "generic_name",
      label: "Generic Name",
    },
    {
      key: "benefit",
      label: "Benefit",
      render: (item: Ingredient) => (
        <span className="line-clamp-2">{item.benefit}</span>
      ),
    },
    {
      key: "warnings",
      label: "Warnings",
      render: (item: Ingredient) => (
        <span className="line-clamp-2">{item.warnings || "-"}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ingredients</h1>
            <p className="text-gray-600 mt-2">
              Kelola data bahan aktif untuk rekomendasi skincare
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
            Add Ingredient
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={ingredients}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No ingredients found"
        />

        {/* Form Modal */}
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Ingredient" : "Add New Ingredient"}
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
                placeholder="e.g., Niacinamide"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Generic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.generic_name}
                onChange={(e) =>
                  setFormData({ ...formData, generic_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Vitamin B3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Benefit <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.benefit}
                onChange={(e) =>
                  setFormData({ ...formData, benefit: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the benefits..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Warnings
              </label>
              <textarea
                rows={3}
                value={formData.warnings}
                onChange={(e) =>
                  setFormData({ ...formData, warnings: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any warnings or precautions (optional)..."
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
