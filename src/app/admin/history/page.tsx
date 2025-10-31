"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import { useCallback, useEffect, useState } from "react";

interface ScoreSummary {
  overall_score?: number;
  [key: string]: unknown;
}

interface AnalysisHistory {
  id: string;
  created_at: string;
  image_path?: string;
  overlay_path?: string;
  score_summary?: ScoreSummary | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<AnalysisHistory | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/v2/admin/analysis-history`);
      const result = await response.json();
      setHistory(result.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      alert("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (item: AnalysisHistory) => {
    if (!confirm(`Are you sure you want to delete this analysis record?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/v2/admin/analysis-history/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete analysis history");
      }

      alert("Analysis history deleted successfully");
      fetchHistory();
    } catch (error) {
      console.error("Error deleting analysis history:", error);
      alert("Failed to delete analysis history");
    }
  };

  // Optional: hook up a row click to view details in future

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (item: AnalysisHistory) => (
        <span className="text-xs font-mono">{item.id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (item: AnalysisHistory) => {
        const path = item.overlay_path || item.image_path;
        const imageUrl = path ? `${apiUrl}${path}` : null;
        return imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Analysis" className="w-16 h-16 object-cover rounded" />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs text-gray-400">No image</span>
          </div>
        );
      },
    },
    {
      key: "created_at",
      label: "Date",
      render: (item: AnalysisHistory) => (
        <span className="text-sm">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: "overall",
      label: "Overall Score",
      render: (item: AnalysisHistory) => {
        const overall = item.score_summary?.overall_score ?? null;
        return <span className="font-semibold text-lg">{overall ?? "-"}</span>;
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
            <p className="text-gray-600 mt-2">
              Riwayat hasil analisis kulit pengguna
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {history.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Overall Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {history.length > 0
                    ? (() => {
                        const scores = history
                          .map((h) => h.score_summary?.overall_score)
                          .filter((v): v is number => typeof v === "number");
                        return scores.length > 0
                          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                          : "-";
                      })()
                    : "-"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          onDelete={handleDelete}
          emptyMessage="No analysis history found"
        />

  {/* Detail Modal */}
        {viewingItem && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingItem(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Analysis Details</h2>
                  <button
                    onClick={() => setViewingItem(null)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(viewingItem.overlay_path || viewingItem.image_path) && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${apiUrl}${viewingItem.overlay_path || viewingItem.image_path}`}
                      alt="Analysis"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(viewingItem.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingItem.score_summary?.overall_score ?? "-"}
                    </p>
                  </div>
                </div>

                {viewingItem.score_summary && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Score Summary</p>
                    <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
{JSON.stringify(viewingItem.score_summary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
