"use client";

import React, { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface DebugUploaderProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

export default function DebugUploader({
  onUploadComplete,
  onUploadError,
}: DebugUploaderProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setStatus("error");
      setMessage("No file selected");
      return;
    }

    console.log("File selected:", {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });

    setFile(selectedFile);
    setStatus("processing");
    setMessage("Processing file...");

    try {
      // Test basic file reading
      const text = await selectedFile.text();
      console.log("File content preview:", text.substring(0, 200));

      // Try to import parsers
      console.log("Importing parsers...");
      const { PDFParser } = await import("@/lib/parsers/pdfParser");
      const { DOCXParser } = await import("@/lib/parsers/docxParser");
      console.log("Parsers imported successfully");

      let parseResult;
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();

      if (selectedFile.type === "application/pdf" || fileExtension === "pdf") {
        console.log("Attempting PDF parsing...");
        parseResult = await PDFParser.parse(selectedFile);
        console.log("PDF parsing successful:", parseResult);
      } else if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileExtension === "docx"
      ) {
        console.log("Attempting DOCX parsing...");
        parseResult = await DOCXParser.parse(selectedFile);
        console.log("DOCX parsing successful:", parseResult);
      } else {
        throw new Error(
          `Unsupported file type: ${selectedFile.type} with extension: ${fileExtension}`
        );
      }

      const result = {
        file: selectedFile,
        content: parseResult.content,
        metadata: {
          fileName: parseResult.metadata.fileName,
          fileType: parseResult.metadata.fileType,
          uploadDate: parseResult.metadata.uploadDate,
          wordCount: parseResult.metadata.wordCount,
          fileSize: selectedFile.size,
        },
        parseResult,
      };

      setStatus("success");
      setMessage(
        `Successfully parsed ${parseResult.metadata.wordCount} words from ${selectedFile.name}`
      );
      onUploadComplete?.(result);
    } catch (error) {
      console.error("Parsing error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatus("error");
      setMessage(`Parsing failed: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="hidden"
          id="debug-file-input"
        />

        <label htmlFor="debug-file-input" className="cursor-pointer">
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
              {status === "processing" && (
                <Upload className="w-6 h-6 text-blue-600 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
              {status === "error" && (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              {status === "idle" && (
                <FileText className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-foreground mb-2">
                Debug File Upload
              </p>
              <p className="text-sm text-muted-foreground">
                Click to select a PDF or DOCX file for testing
              </p>
            </div>
          </div>
        </label>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            status === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : status === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {file && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">File Info:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Name:</strong> {file.name}
            </p>
            <p>
              <strong>Type:</strong> {file.type}
            </p>
            <p>
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
