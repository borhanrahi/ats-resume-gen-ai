'use client';

import React, { useState } from 'react';

export default function BasicTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      setSelectedFile(file);
      setMessage(`Selected: ${file.name} (${file.type}, ${file.size} bytes)`);
      console.log('File selected:', file);
    } else {
      setSelectedFile(null);
      setMessage('No file selected');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Basic File Upload Test</h1>
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-medium">Select a file</h2>
              
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              <p className="text-sm text-gray-500">
                Choose a PDF or DOCX file
              </p>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium">Status:</p>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {selectedFile && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">File Details:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
                <p><strong>Size:</strong> {selectedFile.size} bytes</p>
                <p><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</p>
              </div>
              
              <button
                onClick={async () => {
                  try {
                    const text = await selectedFile.text();
                    console.log('File content (first 200 chars):', text.substring(0, 200));
                    setMessage(`File read successfully! Content length: ${text.length} characters`);
                  } catch (error) {
                    console.error('Error reading file:', error);
                    setMessage(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Read File Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}