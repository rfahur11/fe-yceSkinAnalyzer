import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Upload image v2 dengan preprocessing
 * POST /api/upload-v2
 * 
 * Flow:
 * 1. Terima base64 image dari client
 * 2. Convert ke file buffer
 * 3. Kirim ke backend Python /v2/upload/direct
 * 4. Return file_id dan image_url
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mode = "sd" } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Determine content type from base64
    const matches = image.match(/^data:image\/(\w+);base64,/);
    const contentType = matches ? `image/${matches[1]}` : "image/jpeg";

    // Create FormData untuk multipart upload
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append("file", blob, "capture.jpg");

    // Backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const uploadUrl = `${backendUrl}/v2/upload/direct?mode=${mode}`;

    console.log(`[API] Uploading to backend: ${uploadUrl}`);
    console.log(`[API] Image size: ${buffer.length} bytes, mode: ${mode}`);

    // Send to Python backend
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[API] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.detail || "Failed to upload to backend" },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("[API] Upload success:", result);

    return NextResponse.json({
      success: true,
      file_id: result.file_id,
      image_url: result.image_url,
      resize_info: result.resize_info,
      debug: {
        original_size: result.original_size,
        processed_size: result.processed_size,
        content_type: result.content_type,
      },
    });

  } catch (error) {
    console.error("[API] Upload error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        detail: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
