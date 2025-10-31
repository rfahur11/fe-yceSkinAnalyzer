import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Download dan extract hasil analisis dari ZIP
 * POST /api/download-result
 * 
 * Flow:
 * 1. Download ZIP dari result_url Perfect Corp
 * 2. Extract files (score_info.json dan images)
 * 3. Convert images ke base64
 * 4. Return data untuk preview
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result_url, task_id, file_id, original_image_url, user_id, original_image_base64: originalImageBase64FromClient } = body;

    if (!result_url) {
      return NextResponse.json(
        { error: "result_url is required" },
        { status: 400 }
      );
    }

    console.log("[API] Downloading result from:", result_url);

    // Download ZIP file
    const zipResponse = await fetch(result_url);
    
    if (!zipResponse.ok) {
      console.error("[API] Failed to download ZIP:", zipResponse.status);
      return NextResponse.json(
        { error: "Failed to download result file" },
        { status: 500 }
      );
    }

    const zipBuffer = await zipResponse.arrayBuffer();
    console.log("[API] ZIP downloaded, size:", zipBuffer.byteLength);

    // Import JSZip dinamis (karena library eksternal)
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);

    console.log("[API] ZIP extracted, files:", Object.keys(zipContent.files));

    // Extract score_info.json - bisa di root atau di folder skinanalysisResult
    let scoreInfo = null;
    const scoreFilePaths = [
      "score_info.json",
      "skinanalysisResult/score_info.json"
    ];
    
    for (const path of scoreFilePaths) {
      const scoreFile = zipContent.files[path];
      if (scoreFile && !scoreFile.dir) {
        const scoreText = await scoreFile.async("text");
        scoreInfo = JSON.parse(scoreText);
        console.log("[API] Score info loaded from:", path);
        break;
      }
    }

    if (!scoreInfo) {
      console.warn("[API] score_info.json not found in ZIP!");
    }

    // Extract images dan convert ke base64
    const resultImages: Record<string, string> = {};
    
    const imageFiles = [
      { key: "pore", filename: "pore_output.png" },
      { key: "age_spot", filename: "age_spot_output.png" },
      { key: "wrinkle", filename: "wrinkle_output.png" },
      { key: "acne", filename: "acne_output.png" },
      { key: "texture", filename: "texture_output.png" },
      { key: "redness", filename: "redness_output.png" },
      { key: "oiliness", filename: "oiliness_output.png" },
      { key: "firmness", filename: "firmness_output.png" },
    ];

    for (const { key, filename } of imageFiles) {
      // Try both root and skinanalysisResult folder
      const filePaths = [filename, `skinanalysisResult/${filename}`];
      
      for (const path of filePaths) {
        const file = zipContent.files[path];
        if (file && !file.dir) {
          const buffer = await file.async("uint8array");
          const base64 = Buffer.from(buffer).toString("base64");
          
          // Determine mime type
          const ext = filename.split(".").pop();
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          
          resultImages[key] = `data:${mimeType};base64,${base64}`;
          console.log(`[API] Extracted ${filename} from ${path}`);
          break;
        }
      }
    }

    // Save to backend database (async, non-blocking)
    // We'll capture recommendations from backend save response to forward to client
    let backendRecommendations: unknown = null;
    if (task_id && original_image_url) {
      try {
        console.log("[API] Saving to backend database...");
        
        // Prefer original image base64 sent from client, fallback to downloading from URL
        let originalImageBase64 = "";

        if (originalImageBase64FromClient && typeof originalImageBase64FromClient === "string") {
          originalImageBase64 = originalImageBase64FromClient;
          console.log("[API] Using original image base64 from client payload");
        } else {
          // Download original image dan convert ke base64
          try {
            const imgResponse = await fetch(original_image_url);
            console.log("[API] Downloading original image URL status:", imgResponse.status);
            if (imgResponse.ok) {
              const imgBuffer = await imgResponse.arrayBuffer();
              originalImageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;
              console.log("[API] Original image downloaded for database save");
            } else {
              console.warn("[API] Failed to download original image. Status:", imgResponse.status);
            }
          } catch (imgError) {
            console.warn("[API] Failed to download original image:", imgError);
          }
        }

        if (originalImageBase64) {
          // Call backend to save
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const saveUrl = `${backendUrl}/api/v2/history/save-from-frontend`;
          
          console.log("[API] Calling backend save URL:", saveUrl);
          
          const saveResponse = await fetch(saveUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              task_id,
              file_id,
              result_url,
              // Ensure we pass a data URL; backend will strip prefix if present
              original_image_base64: originalImageBase64.startsWith("data:")
                ? originalImageBase64
                : `data:image/jpeg;base64,${originalImageBase64}`,
              result_data: {
                score_info: scoreInfo,
                result_images: resultImages,
              },
              user_id,
            }),
          });

          console.log("[API] Backend save response status:", saveResponse.status);

          if (saveResponse.ok) {
            type SaveResult = {
              data?: { id?: string };
              recommendations?: unknown;
            };
            const saveResult: SaveResult = await saveResponse.json();
            console.log("[API] ✅ Successfully saved to database:", saveResult.data?.id);
            console.log("[API] Full save result:", JSON.stringify(saveResult, null, 2));
            // Capture recommendations to return to client
            backendRecommendations = saveResult?.recommendations ?? null;
          } else {
            const errorText = await saveResponse.text();
            console.error("[API] ❌ Failed to save to database. Status:", saveResponse.status);
            console.error("[API] Error response:", errorText);
          }
        } else {
          console.warn("[API] ⚠️ No original image available (neither base64 from client nor downloaded). Skipping database save");
        }
      } catch (saveError) {
        // Non-blocking error, just log it
        console.warn("[API] Error saving to database (non-critical):", saveError);
      }
    }

    return NextResponse.json({
      success: true,
      score_info: scoreInfo,
      result_images: resultImages,
      files_count: Object.keys(zipContent.files).length,
      // Forward recommendations from backend if available so UI can show them immediately
      recommendations: backendRecommendations,
    });

  } catch (error) {
    console.error("[API] Download/extract error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process result file", 
        detail: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
