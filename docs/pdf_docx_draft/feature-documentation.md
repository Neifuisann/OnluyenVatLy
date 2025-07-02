# Document Upload Feature Documentation

## Overview
The Document Upload feature allows educators to quickly create lessons by uploading PDF or DOCX documents. The system uses AI to automatically format the content into the required lesson structure with questions and answers.

## Features
- **Dual Creation Mode**: Choose between manual creation or document upload
- **Supported Formats**: PDF and DOCX files (up to 10MB)
- **AI-Powered Formatting**: Automatically converts document content into structured lessons
- **Drag & Drop Interface**: User-friendly file upload with visual feedback
- **Progress Tracking**: Real-time status updates during processing
- **Seamless Integration**: Formatted content loads directly into the existing editor

## User Flow

### 1. Initial Modal
When creating a new lesson (`/admin/new`), users see:
- **Manual Creation**: Traditional workflow using the text editor
- **Document Upload**: New AI-powered document processing

### 2. Upload Interface
If choosing document upload:
- Drag & drop or browse to select a file
- File preview with name and size
- Option to remove and select different file
- Process button to start AI formatting

### 3. Processing Steps
Visual progress indicator shows:
1. **Upload**: File being uploaded to server
2. **Extract**: Text extraction from PDF/DOCX
3. **AI Processing**: Content formatting by Gemini AI
4. **Complete**: Ready to edit in CodeMirror

### 4. Editor Integration
- Formatted content automatically loads into editor
- Full editing capabilities maintained
- Preview updates in real-time
- Proceed to Stage 2 configuration as normal

## Technical Implementation

### Frontend Components

#### `document-upload.js`
- Handles modal display and user interactions
- Manages file selection and validation
- Provides drag & drop functionality
- Shows processing status and error handling
- Integrates with CodeMirror editor

#### UI Elements
- Modal overlays with smooth animations
- Responsive design for mobile devices
- Clear visual feedback for all states
- Accessibility considerations

### Backend Processing

#### API Endpoint: `/api/admin/process-document`
```javascript
POST /api/admin/process-document
Content-Type: multipart/form-data
Body: document (file)

Response: {
  success: boolean,
  formattedContent: string,
  originalFileName: string,
  extractedLength: number
}
```

#### Processing Pipeline
1. **File Validation**
   - Check MIME type and extension
   - Verify file size limit (10MB)

2. **Text Extraction**
   - PDF: Uses `pdf-parse` library
   - DOCX: Uses `mammoth` library
   - Handles errors gracefully

3. **AI Formatting**
   - Sends extracted text to Gemini API
   - Custom prompt for Vietnamese lesson formatting
   - Validates AI response format

### AI Prompt Engineering

The system uses a carefully crafted prompt that:
- Understands Vietnamese educational content
- Follows specific formatting rules
- Creates appropriate question types:
  - Multiple choice (ABCD) - 70%
  - True/False multi-statement - 20%
  - Numeric answers - 10%
- Maintains correct answer marking

### Format Specifications

#### Question Structure
```
Câu 1: [Question text]
[Optional: [X pts]]
A. Option 1
*B. Correct option
C. Option 3
D. Option 4

Câu 2: [True/False question]
*a) True statement
b) False statement
*c) Another true statement

Câu 3: [Numeric question]
Answer: 42
```

## Error Handling

### Client-Side
- File type validation
- File size validation
- Network error recovery
- Processing timeout handling
- User-friendly error messages

### Server-Side
- Graceful PDF/DOCX parsing failures
- AI API error handling
- Request size limits
- Authentication verification

## Security Considerations

1. **Authentication**: `requireAuth` middleware ensures only admins can upload
2. **File Validation**: Strict MIME type and extension checking
3. **Size Limits**: 10MB file size cap prevents abuse
4. **Content Sanitization**: AI output is text-only, no code execution
5. **Rate Limiting**: Consider implementing for production

## Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your-api-key-here  # Optional, fallback provided
```

### File Size Limits
Adjust in `server.js`:
```javascript
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

## Troubleshooting

### Common Issues

1. **"Editor not found" Error**
   - Ensure CodeMirror loads before upload
   - Check browser console for JS errors

2. **PDF/DOCX Extraction Fails**
   - Verify file isn't corrupted
   - Check if file contains actual text (not just images)

3. **AI Formatting Issues**
   - Review document structure
   - Ensure content is educational material
   - Check AI API quotas

### Debug Mode
Enable detailed logging:
```javascript
// In document-upload.js
const DEBUG = true; // Set to true for verbose logging
```

## Future Enhancements

1. **Batch Upload**: Process multiple documents
2. **Template Selection**: Choose formatting styles
3. **Language Support**: Extend beyond Vietnamese
4. **OCR Integration**: Handle image-based PDFs
5. **Progress Persistence**: Resume interrupted uploads
6. **Format Preview**: Show AI result before inserting

## Browser Compatibility

- Chrome 80+ ✓
- Firefox 75+ ✓
- Safari 13+ ✓
- Edge 80+ ✓
- Mobile browsers ✓

## Performance Considerations

- Large documents (>5000 words) may take 10-30 seconds
- AI processing time varies with content complexity
- Text extraction is generally fast (<2 seconds)
- Consider implementing progress percentage

## Maintenance

### Regular Tasks
1. Monitor AI API usage and costs
2. Update file parsing libraries
3. Review error logs for patterns
4. Test with various document formats

### Updating AI Prompt
The prompt is in `formatDocumentWithAI()` function. Modify carefully to maintain output format compatibility.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify file format and size
3. Test with a simple document first
4. Review server logs for processing errors