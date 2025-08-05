import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock window.URL.createObjectURL for file handling tests
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock FileReader for file parsing tests
Object.defineProperty(window, 'FileReader', {
  value: class MockFileReader {
    result: string | ArrayBuffer | null = null;
    error: any = null;
    readyState: number = 0;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

    readAsArrayBuffer(file: Blob) {
      setTimeout(() => {
        this.result = new ArrayBuffer(8);
        this.readyState = 2;
        if (this.onload) {
          this.onload({ target: this } as any);
        }
      }, 0);
    }

    readAsText(file: Blob) {
      setTimeout(() => {
        this.result = 'mock file content';
        this.readyState = 2;
        if (this.onload) {
          this.onload({ target: this } as any);
        }
      }, 0);
    }
  },
});

// Mock File.prototype.arrayBuffer for DOCX parsing tests
Object.defineProperty(File.prototype, 'arrayBuffer', {
  value: function() {
    return Promise.resolve(new ArrayBuffer(1024));
  },
  writable: true,
  configurable: true,
});