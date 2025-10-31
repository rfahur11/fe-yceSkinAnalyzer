"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SkinScore {
  raw_score: number;
  ui_score: number;
  output_mask_name: string;
}

interface ScoreInfo {
  pore?: SkinScore;
  age_spot?: SkinScore;
  wrinkle?: SkinScore;
  acne?: SkinScore;
  texture?: SkinScore;
  redness?: SkinScore;
  dark_spot?: SkinScore;
  oiliness?: SkinScore;
  firmness?: SkinScore;
  all?: { score: number };
  skin_age?: number;
}

interface Ingredient {
  id: number;
  name: string;
  generic_name: string;
  benefit: string;
  warnings: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  country: string;
  url: string | null;
  image_url: string | null;
  price_range: string;
}

interface RecommendationItem {
  ingredient: Ingredient;
  suggested_use: string;
  priority: number;
  products: Product[];
}

interface Recommendation {
  condition: string;
  score: number;
  severity: string;
  severity_description: string;
  recommendations: RecommendationItem[];
}

interface HistoryDetail {
  id: string;
  task_id: string;
  file_id: string | null;
  user_id: string | null;
  image_path: string;
  overlay_path: string | null;
  result_json: {
    score_info: ScoreInfo;
  };
  created_at: string;
  updated_at: string;
}

interface HistoryDetailModalProps {
  historyId: string;
  onClose: () => void;
}

export default function HistoryDetailModal({
  historyId,
  onClose,
}: HistoryDetailModalProps) {
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scores" | "recommendations">("scores");
  const [imageError, setImageError] = useState(false);

  const fetchHistoryDetail = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v2/history/${historyId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch history detail");
      }

      const result = await response.json();
      setDetail(result.data);
      
      // Try to load recommendations from localStorage (if available from recent analysis)
      const cachedRecs = localStorage.getItem("skincare_recommendations");
      if (cachedRecs) {
        try {
          setRecommendations(JSON.parse(cachedRecs));
        } catch (e) {
          console.warn("Failed to parse cached recommendations:", e);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching history detail:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "poor":
        return "bg-red-100 text-red-800 border-red-300";
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "good":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderScoreCard = (label: string, scoreData: SkinScore | undefined) => {
    if (!scoreData) return null;

    const score = scoreData.ui_score;

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800 capitalize">
            {label.replace("_", " ")}
          </h4>
          <span
            className={`text-2xl font-bold ${getScoreColor(score)}`}
          >
            {score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Memuat detail analisis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h3>
            <p className="text-gray-600 mb-6">{error || "Data tidak ditemukan"}</p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoreInfo = detail.result_json?.score_info || {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Detail Analisis Kulit</h2>
              <p className="text-blue-100 text-sm">{formatDate(detail.created_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
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

        {/* Content */}
        <div className="p-6">
          {/* Image Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Foto Analisis</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative h-64 bg-linear-to-br from-blue-100 to-indigo-100 rounded-xl overflow-hidden">
                {!imageError ? (
                  <Image
                    src={`${apiUrl}/api/v2/history/${detail.id}/image?type=original`}
                    alt="Original"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">Gambar tidak tersedia</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-semibold">Foto Original</p>
                </div>
              </div>

              {detail.overlay_path && (
                <div className="relative h-64 bg-linear-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden">
                  <Image
                    src={`${apiUrl}/api/v2/history/${detail.id}/image?type=overlay`}
                    alt="Overlay"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-semibold">Analisis Overlay</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("scores")}
                className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
                  activeTab === "scores"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Skor Kondisi Kulit
              </button>
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
                  activeTab === "recommendations"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Rekomendasi ({recommendations.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "scores" && (
            <div>
              {/* Overall Score */}
              {scoreInfo.all && (
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Skor Keseluruhan
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Kondisi kesehatan kulit secara umum
                      </p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-5xl font-bold ${getScoreColor(
                          scoreInfo.all.score
                        )}`}
                      >
                        {scoreInfo.all.score}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">dari 100</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skin Age */}
              {scoreInfo.skin_age && (
                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Usia Kulit</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {scoreInfo.skin_age} tahun
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Scores Grid */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Kondisi Detail
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderScoreCard("Pori-pori", scoreInfo.pore)}
                {renderScoreCard("Kerutan", scoreInfo.wrinkle)}
                {renderScoreCard("Jerawat", scoreInfo.acne)}
                {renderScoreCard("Noda Hitam", scoreInfo.dark_spot || scoreInfo.age_spot)}
                {renderScoreCard("Tekstur", scoreInfo.texture)}
                {renderScoreCard("Kemerahan", scoreInfo.redness)}
                {renderScoreCard("Minyak", scoreInfo.oiliness)}
                {renderScoreCard("Kekencangan", scoreInfo.firmness)}
              </div>
            </div>
          )}

          {activeTab === "recommendations" && (
            <div>
              {recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium mb-2">
                    Tidak Ada Rekomendasi
                  </p>
                  <p className="text-gray-500 text-sm">
                    Rekomendasi produk akan tersedia untuk analisis yang lebih baru
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Recommendation Header */}
                      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg capitalize">
                              {rec.condition.replace("_", " ")}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {rec.severity_description}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityBadgeColor(
                                rec.severity
                              )}`}
                            >
                              {rec.severity}
                            </span>
                            <p className="text-gray-600 text-sm mt-1">
                              Skor: {rec.score}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div className="p-4">
                        <h5 className="font-semibold text-gray-800 mb-3">
                          Bahan Aktif yang Direkomendasikan:
                        </h5>
                        <div className="space-y-3">
                          {rec.recommendations.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h6 className="font-semibold text-gray-800">
                                    {item.ingredient.name}
                                  </h6>
                                  <p className="text-gray-600 text-sm">
                                    {item.ingredient.generic_name}
                                  </p>
                                </div>
                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                  Prioritas #{item.priority}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm mb-2">
                                <strong>Manfaat:</strong> {item.ingredient.benefit}
                              </p>
                              <p className="text-gray-700 text-sm mb-2">
                                <strong>Cara Pakai:</strong> {item.suggested_use}
                              </p>
                              {item.ingredient.warnings && (
                                <p className="text-orange-700 text-sm bg-orange-50 rounded p-2 border border-orange-200">
                                  <strong>⚠️ Perhatian:</strong>{" "}
                                  {item.ingredient.warnings}
                                </p>
                              )}

                              {/* Products */}
                              {item.products.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-gray-700 font-semibold text-sm mb-2">
                                    Produk Rekomendasi:
                                  </p>
                                  <div className="grid md:grid-cols-2 gap-2">
                                    {item.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                                      >
                                        <h6 className="font-semibold text-gray-800 text-sm">
                                          {product.name}
                                        </h6>
                                        <p className="text-gray-600 text-xs">
                                          {product.brand} • {product.country}
                                        </p>
                                        <p className="text-blue-600 font-semibold text-sm mt-1">
                                          {product.price_range}
                                        </p>
                                        {product.url && (
                                          <a
                                            href={product.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 text-xs inline-flex items-center gap-1 mt-2"
                                          >
                                            Lihat Produk
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                              />
                                            </svg>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                const url = `${apiUrl}/api/v2/history/${detail.id}/coco`;
                window.open(url, "_blank");
              }}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download JSON
            </button>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
