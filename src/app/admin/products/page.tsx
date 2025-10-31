"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { useCallback, useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  brand: string;
  country: string;
  price_range: string;
  url: string;
  image_url: string;
  ingredient_id: number;
  ingredient?: {
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface Ingredient {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    country: "",
    price_range: "",
    url: "",
    image_url: "",
    ingredient_id: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `${apiUrl}/api/v2/admin/products?search=${encodeURIComponent(searchTerm)}`
        : `${apiUrl}/api/v2/admin/products`;
      
      const response = await fetch(url);
      const result = await response.json();
      setProducts(result.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, apiUrl]);

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v2/admin/ingredients`);
      const result = await response.json();
      setIngredients(result.data || []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchProducts();
    fetchIngredients();
  }, [fetchProducts, fetchIngredients]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      brand: "",
      country: "",
      price_range: "",
      url: "",
      image_url: "",
      ingredient_id: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (item: Product) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      brand: item.brand,
      country: item.country,
      price_range: item.price_range,
      url: item.url,
      image_url: item.image_url,
      ingredient_id: item.ingredient_id,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: Product) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/products/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      alert("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `${apiUrl}/api/v2/admin/products/${editingItem.id}`
        : `${apiUrl}/api/v2/admin/products`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      alert(
        editingItem
          ? "Product updated successfully"
          : "Product created successfully"
      );
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
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
      key: "image_url",
      label: "Image",
      render: (item: Product) => (
        item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs text-gray-400">No image</span>
          </div>
        )
      ),
    },
    {
      key: "name",
      label: "Product Name",
    },
    {
      key: "brand",
      label: "Brand",
    },
    {
      key: "country",
      label: "Country",
    },
    {
      key: "price_range",
      label: "Price Range",
    },
    {
      key: "ingredient",
      label: "Ingredient",
      render: (item: Product) => (
        <span>{item.ingredient?.name || "-"}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">
              Kelola produk skincare yang direkomendasikan
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
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name or brand..."
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
          data={products}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No products found"
        />

        {/* Form Modal */}
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Product" : "Add New Product"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Clear Gel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Acnes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Japan"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price Range <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.price_range}
                onChange={(e) =>
                  setFormData({ ...formData, price_range: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Rp 20.000 - Rp 50.000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Ingredient <span className="text-red-500">*</span>
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
                Product URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
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
