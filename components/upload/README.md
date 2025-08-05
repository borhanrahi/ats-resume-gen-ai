# DocumentUploader Component

A mobile-first document uploader component for PDF and DOCX files with client-side parsing, drag-and-drop support, and comprehensive error handling.

## Features

### Mobile-First Design
- **Touch-Friendly**: All interactive elements have minimum 44px touch targets
- **Responsive Layout**: Adapts from 350px (very small phones) to desktop screens
- **Progressive Enhancement**: Basic functionality on mobile, enhanced features on desktop
- **Mobile-Optimized Interactions**: Tap to upload on mobile, drag-and-drop on desktop

### Document Processing
- **Client-Side Parsing**: PDF and DOCX files are processed entirely on the client for privacy
- **Real-Time Progress**: Shows parsing progress with visual indicators
- **Content Preview**: Optional preview of extracted document content
- **Metadata Extraction**: Word count, file size, and document information

### User Experience
- **Drag & Drop**: Desktop users can drag files directly onto the upload area
- **File Validation**: Validates file type, size, and content before processing
- **Error Handling**: Clear error messages with recovery suggestions
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

### Basic Usage

```tsx
import { DocumentUploader } from '@/components/upload';

function MyComponent() {
  const handleUploadComplete = (result) => {
    console.log('Document processed:', result);
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
  };

  return (
    <DocumentUploader
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
    />
  );
}
```

### Advanced Usage

```tsx
import { DocumentUploader } from '@/components/upload';

function AdvancedUploader() {
  return (
    <DocumentUploader
      onUploadComplete={(result) => {
        // Handle successful upload
        console.log('File:', result.file);
        console.log('Content:', result.content);
        console.log('Metadata:', result.metadata);
      }}
      onUploadError={(error) => {
        // Handle upload error
        console.error('Error:', error);
      }}
      onFileRemove={() => {
        // Handle file removal
        console.log('File removed');
      }}
      maxFileSize={10 * 1024 * 1024} // 10MB
      acceptedFileTypes={['.pdf', '.docx']}
      showPreview={true}
      disabled={false}
      className="max-w-2xl"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUploadComplete` | `(result: DocumentUploadResult) => void` | - | Called when document is successfully processed |
| `onUploadError` | `(error: string) => void` | - | Called when upload or processing fails |
| `onFileRemove` | `() => void` | - | Called when user removes the uploaded file |
| `maxFileSize` | `number` | `10485760` | Maximum file size in bytes (default: 10MB) |
| `acceptedFileTypes` | `string[]` | `['.pdf', '.docx']` | Accepted file extensions |
| `disabled` | `boolean` | `false` | Disable the uploader |
| `className` | `string` | - | Additional CSS classes |
| `showPreview` | `boolean` | `true` | Show content preview after upload |
| `allowMultiple` | `boolean` | `false` | Allow multiple file uploads |

## Types

### DocumentUploadResult

```typescript
interface DocumentUploadResult {
  file: File;
  content: string;
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'docx';
    uploadDate: Date;
    wordCount: number;
    fileSize: number;
  };
  parseResult: PDFParseResult | DOCXParseResult;
}
```

## Mobile-First Breakpoints

The component uses custom breakpoints optimized for mobile-first design:

- **xxs**: 350px (Very small phones)
- **xs**: 420px (Small phones)
- **sm**: 640px (Large phones / small tablets)
- **md**: 768px (Tablets)
- **lg**: 1024px (Small laptops)
- **xl**: 1280px (Laptops)
- **2xl**: 1536px (Large screens)
- **3xl**: 1920px (Extra large screens)

## Styling

The component uses Tailwind CSS with mobile-first responsive classes:

```css
/* Mobile base styles */
.upload-area {
  min-height: 120px; /* Mobile */
  padding: 1rem;
}

/* Progressive enhancement for larger screens */
@media (min-width: 640px) {
  .upload-area {
    min-height: 140px; /* Small screens */
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .upload-area {
    min-height: 160px; /* Medium screens */
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .upload-area {
    min-height: 180px; /* Large screens */
    padding: 2rem;
  }
}
```

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support with tab navigation
- **Focus Management**: Clear focus indicators and logical tab order
- **Error Announcements**: Screen reader announcements for errors
- **Touch Targets**: Minimum 44px touch targets for mobile accessibility

## Error Handling

The component handles various error scenarios:

- **File Size Exceeded**: Clear message with size limit
- **Invalid File Type**: Specific guidance on accepted formats
- **Parsing Errors**: Detailed error messages for document issues
- **Empty Files**: Detection and handling of empty documents
- **Network Issues**: Graceful handling of connection problems

## Performance

- **Client-Side Processing**: No server uploads for privacy and speed
- **Progressive Loading**: Visual progress indicators during processing
- **Memory Management**: Efficient handling of large documents
- **Lazy Loading**: Components load only when needed

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **File API**: Requires modern browser with File API support
- **PDF.js**: Uses PDF.js for client-side PDF parsing
- **Mammoth**: Uses Mammoth.js for DOCX parsing

## Testing

Run the component tests:

```bash
npm test components/upload/__tests__/DocumentUploader.test.tsx
```

The test suite covers:
- Mobile-first responsive behavior
- File validation and error handling
- Touch-friendly interactions
- Accessibility features
- Document processing workflows