"use client";

import { useEffect, useState } from "react";

interface LoadingProgressProps {
  stage: "upload" | "processing" | "analyzing" | "downloading" | "complete" | "error";
  progress?: number;
  message?: string;
  debugInfo?: Record<string, unknown>;
}

type StageColor = "blue" | "indigo" | "purple" | "green" | "red";

/**
 * Komponen Loading dengan Progress Tracking dan Debug Info
 * Menampilkan proses upload → preprocessing → analysis → download result
 */
export default function LoadingProgress({ 
  stage, 
  progress = 0, 
  message,
  debugInfo 
}: LoadingProgressProps) {
  const [dots, setDots] = useState(".");
  const [showDebug, setShowDebug] = useState(false);

  // Animated dots untuk loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Stage configuration
  const stages: Record<LoadingProgressProps["stage"], { title: string; icon: string; color: StageColor; description: string }> = {
    upload: {
      title: "Mengupload Foto",
      icon: "📤",
      color: "blue",
      description: "Mengirim foto ke server untuk preprocessing..."
    },
    processing: {
      title: "Memproses Gambar",
      icon: "⚙️",
      color: "indigo",
      description: "Resize dan optimasi gambar untuk analisis..."
    },
    analyzing: {
      title: "Menganalisis Kulit",
      icon: "🔬",
      color: "purple",
      description: "Perfect Corp AI sedang menganalisis kondisi kulit..."
    },
    downloading: {
      title: "Mengunduh Hasil",
      icon: "💾",
      color: "green",
      description: "Download hasil analisis dari server..."
    },
    complete: {
      title: "Analisis Selesai!",
      icon: "✅",
      color: "green",
      description: "Hasil analisis siap ditampilkan"
    },
    error: {
      title: "Terjadi Kesalahan",
      icon: "❌",
      color: "red",
      description: "Gagal memproses analisis"
    }
  };

  const currentStage = stages[stage];
  const isLoading = !["complete", "error"].includes(stage);

  // Color classes
  const colorClasses: Record<StageColor, string> = {
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    red: "bg-red-500"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">
            {currentStage.icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {currentStage.title}
            {isLoading && <span className="text-blue-600">{dots}</span>}
          </h2>
          <p className="text-gray-600 text-lg">
            {message || currentStage.description}
          </p>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full ${colorClasses[currentStage.color]} transition-all duration-500 ease-out relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
              </div>
            </div>
            <div className="text-center mt-2 text-sm font-medium text-gray-600">
              {progress}%
            </div>
          </div>
        )}

        {/* Stage Progress Indicators */}
        <div className="flex justify-between items-center mb-6 px-4">
          {["upload", "processing", "analyzing", "downloading"].map((s, idx) => {
            const stageOrder = ["upload", "processing", "analyzing", "downloading"];
            const currentIndex = stageOrder.indexOf(stage);
            const isActive = stageOrder.indexOf(s) === currentIndex;
            const isCompleted = stageOrder.indexOf(s) < currentIndex;

            return (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted ? "bg-green-500 text-white" :
                  isActive ? `${colorClasses[currentStage.color]} text-white animate-pulse` :
                  "bg-gray-300 text-gray-600"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? "text-gray-800" : "text-gray-500"
                }`}>
                  {stages[s as keyof typeof stages].title.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Debug Info Toggle */}
        {debugInfo && Object.keys(debugInfo).length > 0 && (
          <div className="mt-6 border-t pt-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 mx-auto"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showDebug ? "rotate-90" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDebug ? "Sembunyikan" : "Tampilkan"} Debug Info
            </button>

            {showDebug && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner (fallback) */}
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
