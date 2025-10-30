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
    const { result_url } = body;

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

    return NextResponse.json({
      success: true,
      score_info: scoreInfo,
      result_images: resultImages,
      files_count: Object.keys(zipContent.files).length,
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
