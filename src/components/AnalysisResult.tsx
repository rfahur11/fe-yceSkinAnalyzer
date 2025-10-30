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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">🔬 Hasil Analisis Kulit</h2>
              <p className="text-blue-100">Powered by Perfect Corp AI</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overall Score */}
          {analysisData?.all && (
            <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
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
          <div className="mt-6 flex gap-4 justify-center">
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
