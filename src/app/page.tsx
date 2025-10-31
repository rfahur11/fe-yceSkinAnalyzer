"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HistoryCard from "@/components/HistoryCard";
import HistoryDetailModal from "@/components/HistoryDetailModal";
import Navbar from "@/components/Navbar";

interface HistoryItem {
  id: string;
  created_at: string;
  score_summary?: {
    pore?: number;
    wrinkle?: number;
    acne?: number;
    dark_spot?: number;
    texture?: number;
    redness?: number;
  };
  image_path?: string;
}

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v2/history/?limit=6`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const result = await response.json();
      setHistory(result.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id: string) => {
    setSelectedHistoryId(id);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header / Navigation */}
      <Navbar ctaHref="/camera" ctaLabel="Mulai Analisis" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Analisis Kesehatan Kulit Anda dengan
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}
              AI Technology
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Dapatkan analisis mendalam tentang kondisi kulit Anda menggunakan teknologi Perfect Corp AI. 
            Deteksi pori-pori, kerutan, jerawat, dan dapatkan rekomendasi produk skincare yang tepat.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/camera"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Mulai Analisis Sekarang
            </Link>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center gap-3"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h3>
            <p className="text-lg text-gray-600">
              Teknologi AI terdepan untuk analisis kulit yang akurat
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
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
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Deteksi Multi-Kondisi
              </h4>
              <p className="text-gray-600">
                Analisis 8+ kondisi kulit: pori-pori, kerutan, jerawat, noda hitam, tekstur, kemerahan, dan lainnya
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-linear-to-br from-purple-50 to-pink-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Hasil Instan
              </h4>
              <p className="text-gray-600">
                Dapatkan hasil analisis lengkap dalam hitungan detik dengan visualisasi yang jelas
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Rekomendasi Produk
              </h4>
              <p className="text-gray-600">
                Dapatkan rekomendasi bahan aktif dan produk skincare yang sesuai dengan kondisi kulit Anda
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-linear-to-br from-orange-50 to-yellow-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
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
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Histori Lengkap
              </h4>
              <p className="text-gray-600">
                Simpan dan pantau perkembangan kondisi kulit Anda dari waktu ke waktu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Histori Analisis Terbaru
            </h3>
            <p className="text-lg text-gray-600">
              Lihat kembali hasil analisis kulit Anda sebelumnya
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={fetchHistory}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat histori...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
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
            <p className="text-red-700 font-medium mb-2">Gagal memuat histori</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={fetchHistory}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-blue-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Belum Ada Histori
            </h4>
            <p className="text-gray-600 mb-6">
              Mulai analisis pertama Anda untuk melihat histori di sini
            </p>
            <Link
              href="/camera"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Mulai Analisis
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onView={handleViewDetail}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Siap Untuk Menganalisis Kulit Anda?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Mulai perjalanan menuju kulit yang lebih sehat dengan analisis AI yang akurat
          </p>
          <Link
            href="/camera"
            className="inline-flex items-center gap-3 bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Mulai Analisis Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="font-bold text-white">YCE Skin Analyzer</span>
            </div>
            <p className="text-sm">
              © 2025 YCE Skin Analyzer. Powered by Perfect Corp AI Technology.
            </p>
          </div>
        </div>
      </footer>

      {/* History Detail Modal */}
      {selectedHistoryId && (
        <HistoryDetailModal
          historyId={selectedHistoryId}
          onClose={() => setSelectedHistoryId(null)}
        />
      )}
    </div>
  );
}
