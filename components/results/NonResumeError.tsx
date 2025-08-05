"use client";

import { AlertTriangle, Upload, FileText, CheckCircle } from "lucide-react";

interface NonResumeErrorProps {
  resumeDetection: {
    isResume: boolean;
    confidence: number;
    reasons: string[];
    suggestions?: string[];
  };
  fileName: string;
}

export default function NonResumeError({ resumeDetection, fileName }: NonResumeErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Document Analysis Result
          </h1>
          <p className="text-gray-300 text-lg">
            Analysis of: <span className="font-semibold text-purple-300">{fileName}</span>
          </p>
        </div>

        {/* Main Error Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              This document does not appear to be a resume or CV
            </h2>
            <p className="text-gray-300 text-lg mb-4">
              Our AI analysis indicates this document is not a resume or curriculum vitae.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 font-semibold">
                Confidence Score: {resumeDetection.confidence}% (Threshold: 60%)
              </p>
            </div>
          </div>

          {/* Analysis Details */}
          {resumeDetection.reasons.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Analysis Details
              </h3>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <ul className="space-y-2">
                  {resumeDetection.reasons.map((reason, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {resumeDetection.suggestions && resumeDetection.suggestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                What to do next
              </h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <ul className="space-y-3">
                  {resumeDetection.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-blue-200 flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/upload'}
              className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Your Resume
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Tips for a successful ATS analysis:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-300">Document Format</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Use PDF or DOCX format</li>
                <li>• Avoid scanned images</li>
                <li>• Ensure text is selectable</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-300">Content Structure</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Include contact information</li>
                <li>• Add work experience section</li>
                <li>• Include education and skills</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
