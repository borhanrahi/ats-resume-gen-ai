import { NextResponse } from "next/server";
import { geminiService } from "@/lib/gemini";

export async function POST() {
  try {
    const result = await geminiService.testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Gemini API connection successful",
        response: result.response,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
