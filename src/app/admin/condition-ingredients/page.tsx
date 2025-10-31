"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { useCallback, useEffect, useState } from "react";

interface ConditionIngredient {
  id: number;
  condition_id: number;
  ingredient_id: number;
  severity_id: number;
  suggested_use?: string;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

interface Condition {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
}

interface SeverityLevel {
  id: number;
  name: string;
}

export default function ConditionIngredientsPage() {
  const [conditionIngredients, setConditionIngredients] = useState<ConditionIngredient[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [severityLevels, setSeverityLevels] = useState<SeverityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConditionIngredient | null>(null);
  const [formData, setFormData] = useState({
    condition_id: 0,
    ingredient_id: 0,
    severity_id: 0,
    suggested_use: "",
    priority: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchConditionIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/v2/admin/condition-ingredients`);
      const result = await response.json();
      setConditionIngredients(result.data || []);
    } catch (error) {
      console.error("Error fetching condition ingredients:", error);
      alert("Failed to fetch condition ingredients");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchConditions = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v2/admin/conditions`);
      const result = await response.json();
      setConditions(result.data || []);
    } catch (error) {
      console.error("Error fetching conditions:", error);
    }
  }, [apiUrl]);

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v2/admin/ingredients`);
      const result = await response.json();
      setIngredients(result.data || []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }, [apiUrl]);

  const fetchSeverityLevels = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v2/admin/severity-levels`);
      const result = await response.json();
      setSeverityLevels(result.data || []);
    } catch (error) {
      console.error("Error fetching severity levels:", error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchConditionIngredients();
    fetchConditions();
    fetchIngredients();
    fetchSeverityLevels();
  }, [fetchConditionIngredients, fetchConditions, fetchIngredients, fetchSeverityLevels]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      condition_id: 0,
      ingredient_id: 0,
      severity_id: 0,
      suggested_use: "",
      priority: 1,
    });
    setModalOpen(true);
  };

  const handleEdit = (item: ConditionIngredient) => {
    setEditingItem(item);
    setFormData({
      condition_id: item.condition_id,
      ingredient_id: item.ingredient_id,
      severity_id: item.severity_id,
      suggested_use: item.suggested_use || "",
      priority: item.priority || 1,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: ConditionIngredient) => {
    if (!confirm(`Are you sure you want to delete this condition-ingredient mapping?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/condition-ingredients/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete condition-ingredient");
      }

      alert("Condition-ingredient deleted successfully");
      fetchConditionIngredients();
    } catch (error) {
      console.error("Error deleting condition-ingredient:", error);
      alert("Failed to delete condition-ingredient");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `${apiUrl}/api/v2/admin/condition-ingredients/${editingItem.id}`
        : `${apiUrl}/api/v2/admin/condition-ingredients`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save condition-ingredient");
      }

      alert(
        editingItem
          ? "Condition-ingredient updated successfully"
          : "Condition-ingredient created successfully"
      );
      setModalOpen(false);
      fetchConditionIngredients();
    } catch (error) {
      console.error("Error saving condition-ingredient:", error);
      alert("Failed to save condition-ingredient");
    } finally {
      setSubmitting(false);
    }
  };

  const conditionMap = Object.fromEntries(conditions.map((c) => [c.id, c.name]));
  const ingredientMap = Object.fromEntries(ingredients.map((i) => [i.id, i.name]));
  const severityMap = Object.fromEntries(severityLevels.map((s) => [s.id, s.name]));

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "condition",
      label: "Condition",
      render: (item: ConditionIngredient) => (
        <span>{conditionMap[item.condition_id] || "-"}</span>
      ),
    },
    {
      key: "ingredient",
      label: "Ingredient",
      render: (item: ConditionIngredient) => (
        <span>{ingredientMap[item.ingredient_id] || "-"}</span>
      ),
    },
    {
      key: "severity",
      label: "Severity Level",
      render: (item: ConditionIngredient) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
          {severityMap[item.severity_id] || "-"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
    },
    {
      key: "suggested_use",
      label: "Suggested Use",
      render: (item: ConditionIngredient) => (
        <span className="text-gray-700">
          {item.suggested_use ? (item.suggested_use.length > 60 ? `${item.suggested_use.substring(0, 60)}...` : item.suggested_use) : "-"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Condition-Ingredient Mapping</h1>
            <p className="text-gray-600 mt-2">
              Kelola hubungan antara kondisi, bahan, dan tingkat keparahan
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
            Add Mapping
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={conditionIngredients}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No condition-ingredient mappings found"
        />

        {/* Form Modal */}
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Mapping" : "Add New Mapping"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.condition_id}
                onChange={(e) =>
                  setFormData({ ...formData, condition_id: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select condition...</option>
                {conditions.map((cond) => (
                  <option key={cond.id} value={cond.id}>
                    {cond.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ingredient <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ingredient_id}
                onChange={(e) =>
                  setFormData({ ...formData, ingredient_id: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select ingredient...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Severity Level <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.severity_id}
                onChange={(e) =>
                  setFormData({ ...formData, severity_id: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select severity level...</option>
                {severityLevels.map((sev) => (
                  <option key={sev.id} value={sev.id}>
                    {sev.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1 = highest priority"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Suggested Use
              </label>
              <textarea
                value={formData.suggested_use}
                onChange={(e) => setFormData({ ...formData, suggested_use: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How to use this ingredient (optional)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Mapping ini menentukan bahan yang direkomendasikan untuk kondisi kulit tertentu dengan tingkat keparahan spesifik.
              </p>
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
