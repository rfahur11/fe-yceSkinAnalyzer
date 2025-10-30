import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Create analysis task v2 dan polling status
 * POST /api/analyze-v2
 * 
 * Flow:
 * 1. Create analysis task dengan file_id/image_url
 * 2. Poll status hingga success atau error
 * 3. Return hasil analisis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      file_id, 
      image_url,
      dst_actions = ["wrinkle", "pore", "texture", "acne"],
      miniserver_args = {
        enable_dark_background_hd_pore: true,
        color_dark_background_hd_pore: "3D3D3D",
        opacity_dark_background_hd_pore: 0.4
      },
      max_attempts = 60, // Max 5 menit polling (60 x 5s)
      poll_interval = 5000 // Poll setiap 5 detik
    } = body;

    if (!file_id && !image_url) {
      return NextResponse.json(
        { error: "Either file_id or image_url is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    // Step 1: Create analysis task
    console.log("[API] Creating analysis task...");
    const createTaskUrl = `${backendUrl}/v2/task`;
    
    const createResponse = await fetch(createTaskUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: file_id,
        src_file_url: image_url,
        dst_actions,
        miniserver_args,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("[API] Failed to create task:", errorData);
      return NextResponse.json(
        { error: errorData.detail || "Failed to create analysis task" },
        { status: createResponse.status }
      );
    }

    const createResult = await createResponse.json();
    const taskId = createResult.task_id;
    
    console.log("[API] Task created:", taskId);

    // Step 2: Poll status hingga selesai
    let attempts = 0;
    let taskStatus = "running";
    let statusResult: Record<string, unknown> | null = null;

    while (attempts < max_attempts && taskStatus === "running") {
      attempts++;
      
      // Wait before polling (kecuali attempt pertama)
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, poll_interval));
      }

      console.log(`[API] Polling attempt ${attempts}/${max_attempts}...`);

      const statusUrl = `${backendUrl}/v2/task/${taskId}`;
      const statusResponse = await fetch(statusUrl, {
        method: "GET",
      });

      if (!statusResponse.ok) {
        console.error(`[API] Failed to check status (attempt ${attempts})`);
        continue; // Try again
      }

      statusResult = await statusResponse.json();
      taskStatus = (statusResult?.task_status as string) || "running";

      console.log(`[API] Task status: ${taskStatus}`);

      if (taskStatus === "success" || taskStatus === "error") {
        break;
      }
    }

    // Step 3: Return hasil
    if (taskStatus === "success" && statusResult) {
      return NextResponse.json({
        success: true,
        status: "completed",
        task_id: taskId,
        result_url: statusResult.result_url,
        results: statusResult.results,
        attempts,
        message: "Analysis completed successfully",
      });
    } else if (taskStatus === "error" && statusResult) {
      return NextResponse.json({
        success: false,
        status: "error",
        task_id: taskId,
        error_code: statusResult.error_code,
        error_message: statusResult.error_message,
        attempts,
      }, { status: 400 });
    } else {
      // Timeout
      return NextResponse.json({
        success: false,
        status: "timeout",
        task_id: taskId,
        attempts,
        message: `Analysis timed out after ${attempts} attempts (${(attempts * poll_interval / 1000).toFixed(0)}s)`,
      }, { status: 408 });
    }

  } catch (error) {
    console.error("[API] Analysis error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        detail: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
