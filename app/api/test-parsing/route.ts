import { NextRequest, NextResponse } from "next/server";
import { pdfParser } from "../../../lib/parsers/pdfParser";
import { docxParser } from "../../../lib/parsers/docxParser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("Testing file parsing:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Parse the uploaded file
    let parseResult;
    const fileExtension = file.name.toLowerCase().split(".").pop();

    try {
      if (file.type === "application/pdf" || fileExtension === "pdf") {
        console.log("Attempting PDF parsing...");
        parseResult = await pdfParser.parse(file);
        console.log("PDF parsing successful");
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileExtension === "docx"
      ) {
        console.log("Attempting DOCX parsing...");
        parseResult = await docxParser.parse(file);
        console.log("DOCX parsing successful");
      } else {
        throw new Error(
          `Unsupported file type: ${file.type} with extension: ${fileExtension}`
        );
      }
    } catch (parseError) {
      console.error("Parsing error:", parseError);
      return NextResponse.json(
        {
          error: "Parsing failed",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
          stack: parseError instanceof Error ? parseError.stack : undefined,
        },
        { status: 400 }
      );
    }

    // Return successful result
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      parseResult: {
        content:
          parseResult.content.substring(0, 1000) +
          (parseResult.content.length > 1000 ? "..." : ""),
        metadata: parseResult.metadata,
        contentLength: parseResult.content.length,
      },
    });
  } catch (error) {
    console.error("Test parsing failed:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
