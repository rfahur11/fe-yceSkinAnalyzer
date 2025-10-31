"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface SkinScore {
  raw_score: number;
  ui_score: number;
  output_mask_name: string;
}

interface AnalysisData {
  pore?: SkinScore;
  age_spot?: SkinScore;
  wrinkle?: SkinScore;
  acne?: SkinScore;
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

interface AnalysisResultProps {
  originalImage: string;
  analysisData: AnalysisData | null;
  resultImages: {
    pore?: string;
    age_spot?: string;
    wrinkle?: string;
    acne?: string;
  };
  onClose: () => void;
  onDownload: () => void;
}

/**
 * Komponen untuk menampilkan hasil analisis kulit
 * - Original image dengan overlay detection images
 * - Scores untuk setiap kategori (pore, acne, wrinkle, age spot)
 * - Overall skin score dan skin age
 * - Download button untuk hasil lengkap
 */
export default function AnalysisResult({ 
  originalImage, 
  analysisData, 
  resultImages,
  onClose,
  onDownload
}: AnalysisResultProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof resultImages | "original" | "all">("original");
  const [showDebug, setShowDebug] = useState(false);
  const [overlayImage, setOverlayImage] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Category labels
  const categoryLabels: Record<keyof typeof resultImages | "all", string> = {
    pore: "Pori-pori",
    age_spot: "Flek/Bintik",
    wrinkle: "Kerutan",
    acne: "Jerawat",
    all: "Semua Kondisi"
  };

  const categories: Array<keyof typeof resultImages> = useMemo(
    () => ["pore", "age_spot", "wrinkle", "acne"],
    []
  );

  // Debug log on mount
  useEffect(() => {
    console.log("🎨 AnalysisResult MOUNTED!");
    console.log("  - Original image:", originalImage ? "available" : "missing");
    console.log("  - Analysis data:", analysisData ? "available" : "missing");
    console.log("  - Result images:", Object.keys(resultImages || {}).length, "images");
    
    // Load recommendations from localStorage
    const stored = localStorage.getItem('skincare_recommendations');
    if (stored) {
      try {
        const parsed: Recommendation[] = JSON.parse(stored);
        // Use setTimeout to avoid synchronous setState
        setTimeout(() => setRecommendations(parsed), 0);
        console.log("💊 Loaded recommendations:", parsed.length, "conditions");
      } catch (err) {
        console.error("Failed to parse recommendations:", err);
      }
    }
    
    return () => {
      console.log("🎨 AnalysisResult UNMOUNTED");
    };
  }, [originalImage, analysisData, resultImages]);

  /**
   * Generate overlay image: annotation di atas gambar wajah asli
   */
  useEffect(() => {
    // Reset if original selected
    if (selectedCategory === "original") {
      // Use setTimeout to avoid synchronous setState
      const timer = setTimeout(() => setOverlayImage(originalImage), 0);
      return () => clearTimeout(timer);
    }

    if (!originalImage) {
      return;
    }

    let cancelled = false;

    const generateOverlay = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load original image
      const baseImg = new window.Image();
      baseImg.crossOrigin = "anonymous";
      
      try {
        await new Promise((resolve, reject) => {
          baseImg.onload = resolve;
          baseImg.onerror = reject;
          baseImg.src = originalImage;
        });

        if (cancelled) return;

        // Set canvas size
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        // Draw base image
        ctx.drawImage(baseImg, 0, 0);

        // Overlay annotations based on selection
        if (selectedCategory === "all") {
          // Overlay all annotations
          for (const category of categories) {
            if (cancelled) return;
            
            const annotationSrc = resultImages[category];
            if (annotationSrc) {
              const annotationImg = new window.Image();
              annotationImg.crossOrigin = "anonymous";
              
              await new Promise((resolve) => {
                annotationImg.onload = resolve;
                annotationImg.onerror = resolve; // Continue even if error
                annotationImg.src = annotationSrc;
              });

              if (cancelled) return;

              // Draw annotation with blend mode
              ctx.globalCompositeOperation = 'source-over';
              ctx.drawImage(annotationImg, 0, 0, canvas.width, canvas.height);
            }
          }
        } else {
          // Overlay single annotation
          const annotationSrc = resultImages[selectedCategory as keyof typeof resultImages];
          if (annotationSrc) {
            const annotationImg = new window.Image();
            annotationImg.crossOrigin = "anonymous";
            
            await new Promise((resolve) => {
              annotationImg.onload = resolve;
              annotationImg.onerror = resolve;
              annotationImg.src = annotationSrc;
            });

            if (cancelled) return;

            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(annotationImg, 0, 0, canvas.width, canvas.height);
          }
        }

        if (cancelled) return;

        // Convert to base64
        const overlayDataUrl = canvas.toDataURL('image/png');
        setOverlayImage(overlayDataUrl);
      } catch (err) {
        console.error("Error generating overlay:", err);
        if (!cancelled) {
          setOverlayImage(originalImage); // Fallback to original
        }
      }
    };

    generateOverlay();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, originalImage, resultImages, categories]);

  // Get current image to display
  const getCurrentImage = () => {
    return overlayImage || originalImage;
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 50) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Get score emoji
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "😊";
    if (score >= 70) return "🙂";
    if (score >= 50) return "😐";
    return "😟";
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4 overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">🔬 Hasil Analisis Kulit</h2>
              <p className="text-blue-100">Powered by Perfect Corp AI</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="hidden sm:inline-flex bg-white/15 hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-all"
              >
                ← Kembali
              </button>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                title="Tutup (Esc)"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Overall Score */}
          {analysisData?.all && (
            <div className="mb-6 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Skor Keseluruhan</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-purple-600">
                      {analysisData.all.score.toFixed(1)}
                    </span>
                    <span className="text-3xl">{getScoreEmoji(analysisData.all.score)}</span>
                  </div>
                </div>
                {analysisData.skin_age && (
                  <div className="text-right">
                    <p className="text-gray-600 mb-1">Usia Kulit</p>
                    <p className="text-4xl font-bold text-indigo-600">{analysisData.skin_age}</p>
                    <p className="text-sm text-gray-500">tahun</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Preview Gambar</h3>
              
              {/* Image Container */}
              <div className="relative rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50">
                <Image
                  src={getCurrentImage()}
                  alt={selectedCategory === "original" ? "Original" : `Detection - ${selectedCategory}`}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                  unoptimized
                />
                
                {/* Image Label */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedCategory === "original" ? "Original" : categoryLabels[selectedCategory]}
                </div>
              </div>

              {/* Category Selector */}
              <div className="mt-4 grid grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedCategory("original")}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === "original"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === "all"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Semua
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    disabled={!resultImages[cat]}
                    className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg"
                        : resultImages[cat]
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Scores */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Detail Skor</h3>
              
              <div className="space-y-3">
                {categories.map(cat => {
                  const scoreData = analysisData?.[cat];
                  if (!scoreData) return null;

                  return (
                    <div 
                      key={cat}
                      className={`border-2 rounded-xl p-4 transition-all ${getScoreColor(scoreData.ui_score)}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{categoryLabels[cat]}</span>
                        <span className="text-2xl">{getScoreEmoji(scoreData.ui_score)}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{scoreData.ui_score}</span>
                        <span className="text-gray-600">/100</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-current transition-all duration-500"
                          style={{ width: `${scoreData.ui_score}%` }}
                        />
                      </div>
                      
                      <div className="mt-2 text-xs opacity-75">
                        Raw Score: {scoreData.raw_score.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-center flex-wrap">
            <button
              onClick={onDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Hasil Lengkap
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-lg transition-all"
            >
              Tutup
            </button>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all"
            >
              {showDebug ? "Sembunyikan" : "Tampilkan"} Debug Info
            </button>
          </div>

          {/* Debug Info */}
          {showDebug && analysisData && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="font-bold text-gray-800 mb-2">Raw Analysis Data:</h4>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </div>
          )}

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="mt-6">
              <div className="sticky top-2 z-10">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    💊 Rekomendasi Perawatan ({recommendations.length} kondisi)
                  </span>
                  <div className="flex items-center gap-3">
                    {showRecommendations && (
                      <span className="hidden sm:inline text-sm text-white/90">Tutup rekomendasi</span>
                    )}
                    <svg 
                      className={`w-6 h-6 transition-transform ${showRecommendations ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
              </div>

              {showRecommendations && (
                <div className="mt-4 space-y-6">
                  {recommendations.map((rec, recIdx) => (
                    <div 
                      key={recIdx}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg"
                    >
                      {/* Condition Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-100">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 capitalize">
                            {categoryLabels[rec.condition as keyof typeof categoryLabels] || rec.condition}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              rec.severity === 'Poor' ? 'bg-red-100 text-red-700' :
                              rec.severity === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {rec.severity}
                            </span>
                            <span className="text-gray-600 text-sm">{rec.severity_description}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-sm">Skor</p>
                          <p className="text-4xl font-bold text-indigo-600">{rec.score}</p>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-4">
                        {rec.recommendations.map((item, itemIdx) => (
                          <div 
                            key={itemIdx}
                            className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200"
                          >
                            {/* Ingredient Info */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="bg-white rounded-full p-3 shadow-md">
                                <span className="text-2xl">🧪</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-xl font-bold text-gray-800">
                                    {item.ingredient.name}
                                  </h4>
                                  {item.priority === 1 && (
                                    <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                                      ⭐ Prioritas Utama
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm italic mb-2">
                                  {item.ingredient.generic_name}
                                </p>
                                
                                {/* Benefit */}
                                <div className="bg-white rounded-lg p-3 mb-2">
                                  <p className="text-sm text-gray-700">
                                    <strong className="text-green-700">✓ Manfaat:</strong> {item.ingredient.benefit}
                                  </p>
                                </div>
                                
                                {/* Suggested Use */}
                                <div className="bg-blue-100 rounded-lg p-3 mb-2">
                                  <p className="text-sm text-blue-900">
                                    <strong>📝 Cara Pakai:</strong> {item.suggested_use}
                                  </p>
                                </div>
                                
                                {/* Warnings */}
                                {item.ingredient.warnings && (
                                  <div className="bg-yellow-100 rounded-lg p-3">
                                    <p className="text-sm text-yellow-900">
                                      <strong>⚠️ Perhatian:</strong> {item.ingredient.warnings}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Products */}
                            {item.products.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <span>🛍️</span>
                                  Produk yang Mengandung Bahan Ini ({item.products.length})
                                </h5>
                                <div className="grid gap-3">
                                  {item.products.map((product) => (
                                    <div 
                                      key={product.id}
                                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-800">{product.name}</p>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-gray-600">
                                              by <strong>{product.brand}</strong>
                                            </span>
                                            {product.country && (
                                              <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded-full flex items-center gap-1">
                                                <span>🌍</span>
                                                <span>{product.country}</span>
                                              </span>
                                            )}
                                            {product.price_range && (
                                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                product.price_range === 'Budget' ? 'bg-green-100 text-green-700' :
                                                product.price_range === 'Mid-range' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'
                                              }`}>
                                                {product.price_range}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {product.url && (
                                          <a
                                            href={product.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                                          >
                                            Lihat Produk
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Disclaimer */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Disclaimer:</strong> Rekomendasi ini bersifat umum dan informatif. 
                      Konsultasikan dengan dermatologis untuk perawatan yang sesuai dengan kondisi kulit Anda. 
                      Lakukan patch test sebelum menggunakan produk baru.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>💡 Tips:</strong> Klik tombol kategori untuk melihat deteksi pada area tertentu. 
              Download hasil lengkap untuk mendapatkan semua gambar deteksi dan data analisis dalam format ZIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
