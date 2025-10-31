import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js API Route untuk menerima base64 image dan upload ke Perfect Corp API
 * 
 * Endpoint: POST /api/upload
 * Body: { image: "base64string", mode: "sd" | "hd" }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse request body
    const body = await request.json();
    const { image, mode = "sd" } = body;

    // Step 2: Validasi input
    if (!image) {
      return NextResponse.json(
        { error: "Image data is required", detail: "Parameter 'image' tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validasi mode
    if (mode !== "sd" && mode !== "hd") {
      return NextResponse.json(
        { error: "Invalid mode", detail: "Mode harus 'sd' atau 'hd'" },
        { status: 400 }
      );
    }

    console.log(`Received image upload request with mode: ${mode}`);

    // Step 3: Convert base64 ke Blob/File
    // Hapus prefix data:image/...;base64, jika ada
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    // Convert base64 ke buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Buat FormData untuk kirim ke backend FastAPI
    const formData = new FormData();
    
    // Buat Blob dari buffer
    const blob = new Blob([buffer], { type: "image/jpeg" });
    
    // Tambahkan ke FormData dengan nama file
    formData.append("file", blob, "camera-capture.jpg");

    // Step 4: Dapatkan backend URL dari environment variable
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const uploadEndpoint = `${backendUrl}/upload?mode=${mode}`;

    console.log(`Uploading to backend: ${uploadEndpoint}`);

    // Step 5: Kirim ke backend FastAPI
    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: formData,
    });

    // Step 6: Handle response dari backend
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error:", errorData);
      
      return NextResponse.json(
        { 
          error: "Upload failed", 
          detail: errorData.detail || "Gagal mengupload ke Perfect Corp API"
        },
        { status: response.status }
      );
    }

    // Step 7: Return hasil sukses
    const result = await response.json();
    console.log("Upload successful:", result);

    return NextResponse.json({
      success: true,
      message: "Foto berhasil diupload ke Perfect Corp",
      file_id: result.file_id,
      filename: result.filename,
      size: result.size,
      resize_info: result.resize_info,
    });

  } catch (error: unknown) {
    console.error("Error in upload API route:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses upload";
    return NextResponse.json(
      { 
        error: "Internal server error", 
        detail: message
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS request untuk CORS
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
