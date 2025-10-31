"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import LoadingProgress from "./LoadingProgress";
import AnalysisResult from "./AnalysisResult";

/**
 * TypeScript interface untuk Perfect Corp YMK SDK
 */
interface YMKInterface {
  init(config: { 
    language: string; 
    snapshotType: string;
    width?: number;
    height?: number;
  }): void;
  openSkincareCamera(): void;
  close(): void;
  addEventListener(event: string, callback: (data?: any) => void): void;
  removeEventListener(listener: any): void;
}

interface FaceQuality {
  hasFace: boolean;
  area?: "good" | "ok" | "bad";
  frontal?: "good" | "ok" | "bad";
  lighting?: "good" | "ok" | "bad";
}

declare global {
  interface Window {
    YMK?: YMKInterface;
    ymkAsyncInit?: () => void;
  }
}

/**
 * Komponen Camera untuk mengintegrasikan Perfect Corp YMK JS Camera Kit
 * Menggunakan implementasi sesuai dengan dokumentasi Perfect Corp
 * dengan integrasi lengkap ke API v2 untuk analisis kulit
 */
export default function CameraComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Face Quality States
  const [faceQuality, setFaceQuality] = useState<FaceQuality | null>(null);
  const [isQualityGood, setIsQualityGood] = useState(false);

  // Processing States
  const [loadingStage, setLoadingStage] = useState<"upload" | "processing" | "analyzing" | "downloading" | "complete" | "error" | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  // Analysis Result States
  const [showResult, setShowResult] = useState(false);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [resultImages, setResultImages] = useState<Record<string, string>>({});
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  /**
   * Helper: Convert Blob ke base64
   */
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  /**
   * Complete V2 Flow: Upload → Analyze → Download Results
   */
  const processAnalysisV2 = useCallback(async (base64Image: string) => {
    try {
      setError(null);
      setShowResult(false);

      // Stage 1: Upload
      setLoadingStage("upload");
      setLoadingProgress(0);
      setLoadingMessage("Mengupload foto ke server...");
      setDebugInfo({ stage: "upload", status: "starting" });

      const uploadResponse = await fetch("/api/upload-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mode: "sd", // Gunakan HD mode untuk kualitas terbaik
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Gagal mengupload foto");
      }

      const uploadResult = await uploadResponse.json();
      setLoadingProgress(25);
      setDebugInfo({
        stage: "upload",
        status: "completed",
        file_id: uploadResult.file_id,
        image_url: uploadResult.image_url,
        resize_info: uploadResult.resize_info,
      });

      console.log("Upload success:", uploadResult);

      // Stage 2: Processing (auto-done di backend)
      setLoadingStage("processing");
      setLoadingProgress(30);
      setLoadingMessage("Preprocessing gambar selesai");

      // Stage 3: Analyze
      setLoadingStage("analyzing");
      setLoadingProgress(40);
      setLoadingMessage("Membuat task analisis...");

      const analyzeResponse = await fetch("/api/analyze-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: uploadResult.file_id,
          image_url: uploadResult.image_url,
          dst_actions: ["wrinkle", "pore", "texture", "acne"],
          max_attempts: 60,
          poll_interval: 5000,
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "Gagal menganalisis foto");
      }

      const analyzeResult = await analyzeResponse.json();
      setLoadingProgress(80);
      setDebugInfo(prev => ({
        ...prev,
        stage: "analyzing",
        status: "completed",
        task_id: analyzeResult.task_id,
        attempts: analyzeResult.attempts,
      }));

      console.log("Analysis success:", analyzeResult);

      if (analyzeResult.status !== "completed") {
        throw new Error(analyzeResult.message || "Analisis gagal atau timeout");
      }

      // Stage 4: Download Results
      setLoadingStage("downloading");
      setLoadingProgress(85);
      setLoadingMessage("Mengunduh hasil analisis...");

      const downloadResponse = await fetch("/api/download-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result_url: analyzeResult.result_url,
          task_id: analyzeResult.task_id,
          file_id: uploadResult.file_id,
          original_image_url: uploadResult.image_url,
          // Kirim juga original image base64 sebagai fallback agar backend pasti bisa menyimpan
          original_image_base64: base64Image,
          user_id: null, // TODO: Add user authentication
        }),
      });

      if (!downloadResponse.ok) {
        const errorData = await downloadResponse.json();
        throw new Error(errorData.error || "Gagal mengunduh hasil");
      }

      const downloadResult = await downloadResponse.json();
      setLoadingProgress(95);
      setDebugInfo(prev => ({
        ...prev,
        stage: "downloading",
        status: "completed",
        files_count: downloadResult.files_count,
      }));

      console.log("Download success:", downloadResult);

      // Stage 5: Complete
      setLoadingStage("complete");
      setLoadingProgress(100);
      setLoadingMessage("Analisis selesai!");

      // Set results
      console.log("📊 Setting analysis data:", downloadResult.score_info);
      console.log("🖼️ Result images count:", Object.keys(downloadResult.result_images || {}).length);
      
      setAnalysisData(downloadResult.score_info);
      setResultImages(downloadResult.result_images);
      setResultUrl(analyzeResult.result_url);

      // Show result after a brief delay
      console.log("⏱️ Setting timeout to show result in 1 second...");
      setTimeout(() => {
        console.log("✅ Timeout fired - setting loadingStage to null and showResult to true");
        console.log("📍 Analysis data available:", downloadResult.score_info !== null);
        setLoadingStage(null);
        setShowResult(true);
      }, 1000);

    } catch (err) {
      console.error("Error in analysis flow:", err);
      setLoadingStage("error");
      setLoadingMessage((err as Error).message || "Terjadi kesalahan");
      setError((err as Error).message || "Gagal memproses analisis");
      
      setDebugInfo(prev => ({
        ...prev,
        error: (err as Error).message,
        stack: (err as Error).stack,
      }));

      // Auto-hide loading after error
      setTimeout(() => {
        setLoadingStage(null);
      }, 3000);
    }
  }, []);

  /**
   * Debug: Monitor showResult dan analysisData changes
   */
  useEffect(() => {
    console.log("🔍 State changed - showResult:", showResult, "analysisData:", analysisData !== null, "loadingStage:", loadingStage);
  }, [showResult, analysisData, loadingStage]);

  /**
   * Main: Handle foto yang sudah di-capture oleh YMK
   * Event ini otomatis dipanggil saat user mengambil foto
   */
  const handlePhotoCaptured = useCallback(async (image: string | Blob) => {
    try {
      let base64Image: string;

      // Convert image ke base64 jika berupa Blob
      if (image instanceof Blob) {
        base64Image = await blobToBase64(image);
      } else {
        // Sudah dalam format base64
        base64Image = image;
      }

      // Tampilkan preview
      setCapturedImage(base64Image);

      // Process complete analysis flow v2
      await processAnalysisV2(base64Image);

    } catch (err) {
      console.error("Error handling captured photo:", err);
      setError((err as Error).message || "Gagal memproses foto");
    }
  }, [processAnalysisV2]);

  /**
   * Step 1: Load Perfect Corp SDK secara dinamis saat komponen mount
   * dan setup event listeners
   */
  useEffect(() => {
    // Setup ymkAsyncInit callback sebelum SDK dimuat
    window.ymkAsyncInit = function() {
      console.log("YMK SDK initialized");
      
      // Event listener: saat UI module sudah loaded
      window.YMK?.addEventListener('uiLoaded', function() {
        console.log("YMK UI loaded");
        setIsCameraOpen(true);
      });

      // Event listener: saat foto berhasil di-capture
      window.YMK?.addEventListener('skinAnalysisDetectionCaptured', function(image?: string | Blob) {
        console.log("Photo captured by YMK");
        if (image) {
          handlePhotoCaptured(image);
        }
      });

      // Event listener: Face Quality Monitoring
      window.YMK?.addEventListener('faceQualityChanged', function(quality: FaceQuality) {
        console.log("Face Quality Changed:", quality);
        setFaceQuality(quality);
        
        // Cek apakah quality bagus untuk capture
        const isGood = quality.hasFace && 
                      quality.area === "good" && 
                      (quality.lighting === "good");
        setIsQualityGood(isGood);
      });

      // Event listener: Camera errors
      window.YMK?.addEventListener('cameraFailed', function() {
        console.error("Camera failed to open");
        setError("Tidak dapat mengakses kamera. Periksa izin browser Anda.");
        setIsCameraOpen(false);
      });

      setIsLoading(false);
    };

    // Load SDK script secara dinamis
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://plugins-media.makeupar.com/v1.0-skincare-camera-kit/sdk.js';
    
    script.onerror = () => {
      console.error("Failed to load Perfect Corp SDK");
      setError("Gagal memuat SDK kamera. Silakan refresh halaman.");
      setIsLoading(false);
    };

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Cleanup saat komponen unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Cleanup YMK jika ada
      if (window.YMK) {
        try {
          window.YMK.close();
        } catch (e) {
          console.log("Error closing YMK:", e);
        }
      }
    };
  }, [handlePhotoCaptured]);

  /**
   * Step 2: Initialize dan buka Skincare Camera
   * Menggunakan YMK.init() dan YMK.openSkincareCamera()
   */
  const openSkincareCamera = () => {
    try {
      setError(null);
      setCapturedImage(null);
      setShowResult(false);

      // Pastikan SDK sudah loaded
      if (!window.YMK) {
        throw new Error("SDK belum dimuat. Silakan tunggu...");
      }

      // Initialize YMK dengan konfigurasi
      window.YMK.init({
        language: 'enu', // Language: 'enu' (English), 'id' (Indonesia), etc.
        snapshotType: 'base64', // Format snapshot: 'base64' atau 'blob'
        width: 800, // Lebar kamera dalam pixels (default: 640)
        height: 800, // Tinggi kamera dalam pixels (default: 480)
      });

      // Buka Skincare Camera
      window.YMK.openSkincareCamera();
      
      console.log("Skincare camera opened");

    } catch (err) {
      console.error("Error opening camera:", err);
      setError((err as Error).message || "Gagal membuka kamera");
    }
  };

  /**
   * Tutup kamera
   */
  const closeCamera = () => {
    try {
      if (window.YMK) {
        window.YMK.close();
      }
      setIsCameraOpen(false);
      setCapturedImage(null);
      console.log("Camera closed");
    } catch (err) {
      console.error("Error closing camera:", err);
    }
  };

  /**
   * Render UI
   */
  return (
    <div className="camera-container min-h-screen bg-gray-50 py-8 px-4">
      {/* Loading Progress Overlay */}
      {loadingStage && (
        <LoadingProgress
          stage={loadingStage}
          progress={loadingProgress}
          message={loadingMessage}
          debugInfo={debugInfo}
        />
      )}

      {/* Analysis Result Modal */}
      {showResult && analysisData && capturedImage && (
        <AnalysisResult
          originalImage={capturedImage}
          analysisData={analysisData}
          resultImages={resultImages}
          onClose={() => {
            console.log("🔴 Closing AnalysisResult - resetting states");
            setShowResult(false);
            setCapturedImage(null);
            setAnalysisData(null);
            setResultImages({});
          }}
          onDownload={() => {
            if (resultUrl) {
              console.log("📥 Opening download URL:", resultUrl);
              window.open(resultUrl, "_blank");
            }
          }}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Perfect Corp Skin Analysis Camera
          </h1>
          
          <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
            Gunakan kamera untuk mengambil foto wajah Anda. Foto akan otomatis dikirim ke Perfect Corp untuk analisis kulit.
          </p>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <p className="mt-6 text-gray-600 text-lg">Memuat SDK kamera...</p>
            </div>
          )}

          {/* Error Message */}
          {error && !loadingStage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 max-w-2xl mx-auto">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Face Quality Indicator */}
          {isCameraOpen && faceQuality && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className={`border-2 rounded-lg p-4 transition-all duration-300 ${
                isQualityGood 
                  ? 'bg-green-50 border-green-400' 
                  : faceQuality.hasFace 
                    ? 'bg-yellow-50 border-yellow-400' 
                    : 'bg-red-50 border-red-400'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {isQualityGood ? (
                    <>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold text-green-800">✓ Kualitas Bagus - Siap Capture!</span>
                    </>
                  ) : faceQuality.hasFace ? (
                    <>
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-bold text-yellow-800">⚠ Sesuaikan Posisi</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold text-red-800">✗ Wajah Tidak Terdeteksi</span>
                    </>
                  )}
                </div>

                {faceQuality.hasFace && (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-semibold mb-1">Area</div>
                      <div className={`px-2 py-1 rounded ${
                        faceQuality.area === 'good' ? 'bg-green-200 text-green-800' :
                        faceQuality.area === 'ok' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {faceQuality.area === 'good' ? '✓ Bagus' : 
                         faceQuality.area === 'ok' ? '~ Cukup' : '✗ Kurang'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold mb-1">Frontal</div>
                      <div className={`px-2 py-1 rounded ${
                        faceQuality.frontal === 'good' ? 'bg-green-200 text-green-800' :
                        faceQuality.frontal === 'ok' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {faceQuality.frontal === 'good' ? '✓ Bagus' : 
                         faceQuality.frontal === 'ok' ? '~ Cukup' : '✗ Kurang'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold mb-1">Lighting</div>
                      <div className={`px-2 py-1 rounded ${
                        faceQuality.lighting === 'good' ? 'bg-green-200 text-green-800' :
                        faceQuality.lighting === 'ok' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {faceQuality.lighting === 'good' ? '✓ Bagus' : 
                         faceQuality.lighting === 'ok' ? '~ Cukup' : '✗ Kurang'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera Controls */}
          {!isLoading && (
            <>
              {!isCameraOpen ? (
                <div className="text-center py-12">
                  <button
                    onClick={openSkincareCamera}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Start Camera
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <button
                    onClick={closeCamera}
                    disabled={loadingStage !== null}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close Camera
                    </span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* YMK Module Container - Required untuk UI mode */}
          <div className="flex justify-center items-center">
            <div 
              id="YMK-module" 
            //   className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl"
            //   style={{ minHeight: isCameraOpen ? '600px' : '0px' }}
            ></div>
          </div>

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="mt-8">
              <h3 className="font-semibold text-gray-800 mb-4 text-center text-xl">Foto yang Diambil:</h3>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden relative w-full max-w-2xl mx-auto shadow-lg">
                <Image 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-auto"
                  width={800}
                  height={600}
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instruksi Penggunaan:
            </h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-2">
              <li className="pl-2">Klik tombol <strong>&quot;Start Camera&quot;</strong> untuk membuka kamera</li>
              <li className="pl-2">Posisikan wajah Anda sesuai dengan panduan di layar</li>
              <li className="pl-2">Foto akan otomatis diambil saat posisi wajah sudah sesuai</li>
              <li className="pl-2">Foto akan dikirim ke server untuk dianalisis</li>
              <li className="pl-2">Tunggu hingga proses upload selesai</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
