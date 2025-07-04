# Admin New V2 - Modern Split-Screen Editor Documentation

## Overview

The Admin New V2 interface is a complete modernization of the lesson creation system, featuring a split-screen editor with real-time preview, enhanced user experience, and advanced functionality.

## Key Features

### 🚀 Modern Split-Screen Layout
- **50/50 Split**: Resizable panels between editor and preview
- **Responsive Design**: Adapts to different screen sizes
- **Touch Support**: Full mobile and tablet compatibility

### ✨ Enhanced Text Editor
- **CodeMirror Integration**: Syntax highlighting with custom theme
- **Auto-formatting**: Smart indentation and line spacing
- **Smart Assistance**: Auto-completion for question patterns
- **Keyboard Shortcuts**: Full keyboard navigation support

### 👁️ Real-Time Preview
- **Interactive Cards**: Click-to-edit functionality
- **Multiple Modes**: List, Card, and Exam preview modes
- **Live Validation**: Real-time error detection and warnings
- **Math Rendering**: Full LaTeX support with KaTeX

### 📁 Advanced Upload System
- **Drag & Drop**: Enhanced file upload with visual feedback
- **AI Processing**: Automatic document processing for PDF/DOCX
- **Progress Tracking**: Real-time processing status
- **Error Recovery**: Robust error handling and recovery

### 🎨 Professional UI/UX
- **Material Design**: Modern, clean interface
- **Dark Theme Support**: Automatic dark mode detection
- **Notifications**: Toast notifications for user feedback
- **Accessibility**: WCAG 2.1 AA compliance

## File Structure

```
/views/admin-new-v2.html          # Main HTML interface
/public/css/admin-new-v2.css      # Modern CSS architecture
/public/js/admin-new-v2.js        # ES6 JavaScript application
```

## Access URLs

- **New Lesson Creation**: `/admin/new-v2`
- **Edit Existing Lesson**: `/admin/edit-v2/:id`
- **Legacy Interface**: `/admin/new` (still available)

## Technology Stack

### Frontend
- **HTML5**: Semantic markup with modern structure
- **CSS3**: Custom properties, Grid, Flexbox
- **ES6+**: Modern JavaScript with classes and modules
- **CodeMirror**: Advanced code editing capabilities
- **KaTeX**: Mathematical notation rendering

### Integration
- **Existing APIs**: Full compatibility with current backend
- **Session Management**: Seamless data flow to configuration
- **Document Processing**: Integration with AI document upload
- **Image Management**: Upload and gallery integration

## Features In Detail

### 1. Split-Screen Editor

The interface features a resizable split-screen layout:

**Left Panel - Editor:**
- Syntax-highlighted text editor
- Auto-completion for question patterns
- Smart indentation and formatting
- Real-time word and question counting

**Right Panel - Preview:**
- Live preview of questions as cards
- Interactive elements for quick editing
- Validation status indicators
- Multiple viewing modes

### 2. Enhanced Question Creation

**Question Types Supported:**
- Multiple Choice (ABCD)
- True/False
- Numerical Answer

**Smart Features:**
- Auto-detection of question types
- Correct answer marking with asterisk (*)
- Point value assignment
- LaTeX math formula support

### 3. Advanced Document Upload

**Supported Formats:**
- PDF documents
- Microsoft Word (.docx)
- Plain text files

**AI Processing:**
- Automatic content extraction
- Question format conversion
- Smart parsing and validation
- Error recovery and feedback

### 4. Real-Time Validation

**Error Detection:**
- Missing correct answers
- Invalid question formats
- Incomplete questions
- Syntax errors

**Visual Feedback:**
- Color-coded validation status
- Detailed error messages
- Warning indicators
- Progress tracking

### 5. Accessibility Features

**Keyboard Navigation:**
- Full keyboard shortcuts
- Tab navigation support
- Screen reader compatibility
- High contrast mode

**Mobile Support:**
- Touch-friendly interface
- Responsive breakpoints
- Gesture support
- Mobile-optimized modals

## Usage Guide

### Creating a New Lesson

1. **Access Interface**: Navigate to `/admin/new-v2`
2. **Choose Method**: 
   - Manual creation (direct typing)
   - Document upload (PDF/DOCX processing)
3. **Edit Content**: Use the split-screen editor
4. **Preview**: Review questions in real-time
5. **Validate**: Check for errors and warnings
6. **Continue**: Proceed to configuration stage

### Editing Existing Lessons

1. **Access**: Go to `/admin/edit-v2/{lesson-id}`
2. **Load Content**: Existing content loads automatically
3. **Edit**: Make changes in the editor
4. **Preview**: See changes in real-time
5. **Save**: Auto-save or manual save options

### Keyboard Shortcuts

- **Ctrl/Cmd + S**: Save content
- **Ctrl/Cmd + Enter**: Continue to configuration
- **Enter**: Smart line continuation
- **Shift + Enter**: New line without formatting
- **Tab**: Indent or auto-complete
- **Escape**: Close modals

### Modal Features

**Document Upload:**
- Drag and drop support
- File validation
- Processing progress
- AI content extraction

**Image Upload:**
- Direct file upload
- URL-based addition
- Gallery integration
- Drag and drop support

**LaTeX Editor:**
- Live preview
- Common shortcuts
- Syntax validation
- Template insertion

## CSS Architecture

The CSS uses modern techniques for maintainability:

### Custom Properties (CSS Variables)
```css
:root {
  --primary-color: #6366f1;
  --border-radius: 0.375rem;
  --spacing-md: 1rem;
  /* ... more variables */
}
```

### Component-Based Structure
- Modular component styles
- Consistent naming conventions
- Responsive design patterns
- Accessibility considerations

### Theme Support
- Light/dark mode variables
- High contrast support
- Print-friendly styles
- Mobile optimizations

## JavaScript Architecture

### ES6 Class Structure
```javascript
class AdminEditorV2 {
  constructor() {
    this.editor = null;
    this.preview = null;
    this.parser = null;
    // ...
  }
}
```

### Key Classes
- **AdminEditorV2**: Main application controller
- **CodeMirrorManager**: Editor management
- **PreviewManager**: Preview rendering
- **QuizParser**: Content parsing logic
- **NotificationManager**: User feedback
- **AutoSaveManager**: Automatic saving

### Event System
- Event-driven architecture
- Debounced content updates
- Real-time validation
- Auto-save functionality

## Performance Optimizations

### Frontend
- **Debounced Parsing**: Limits parsing frequency
- **Lazy Loading**: Components load as needed
- **Memory Management**: Proper cleanup and disposal
- **Efficient Rendering**: Optimized preview updates

### Backend Integration
- **Auto-save**: Prevents data loss
- **Session Storage**: Reliable data persistence
- **API Optimization**: Minimal API calls
- **Error Recovery**: Robust error handling

## Browser Compatibility

### Supported Browsers
- **Chrome**: 88+ (Recommended)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Mobile Support
- **iOS Safari**: 14+
- **Chrome Mobile**: 88+
- **Firefox Mobile**: 85+

## Migration from Legacy Interface

The new interface maintains full backward compatibility:

### Data Format
- Same question format structure
- Compatible with existing APIs
- Seamless session data flow
- No database changes required

### Feature Parity
- All legacy features supported
- Enhanced functionality added
- Improved user experience
- Better error handling

## Customization

### Theme Customization
Modify CSS custom properties to change the appearance:

```css
:root {
  --primary-color: #your-color;
  --font-family: 'Your Font', sans-serif;
}
```

### Extension Points
- Custom question types
- Additional upload formats
- New preview modes
- Enhanced validation rules

## Troubleshooting

### Common Issues

**Editor Not Loading:**
- Check CodeMirror CDN availability
- Verify JavaScript console for errors
- Ensure admin authentication

**Preview Not Updating:**
- Check parser functionality
- Verify content format
- Check browser console

**Upload Failures:**
- Verify file format support
- Check file size limits
- Ensure API endpoints are available

### Debug Mode
Enable debug mode by setting:
```javascript
window.DEBUG_MODE = true;
```

## Future Enhancements

### Planned Features
- **Real-time Collaboration**: Multiple editors
- **Advanced Analytics**: Usage insights
- **Template Library**: Pre-built templates
- **Version History**: Content versioning

### Integration Opportunities
- **LMS Integration**: Learning management systems
- **Assessment Tools**: Advanced grading
- **Content Libraries**: Educational resources

## Security Considerations

### Authentication
- Admin-only access control
- Session-based authentication
- CSRF protection
- Rate limiting

### Data Protection
- Input validation and sanitization
- XSS prevention
- File upload security
- API key protection

## Monitoring and Analytics

### Performance Metrics
- Page load times
- Editor responsiveness
- Upload success rates
- Error frequencies

### User Experience
- Task completion times
- Feature usage statistics
- Error patterns
- User feedback

## Support and Maintenance

### Regular Updates
- Security patches
- Browser compatibility
- Feature enhancements
- Bug fixes

### Documentation
- User guides
- Developer documentation
- API reference
- Troubleshooting guides

---

## Quick Start

1. **Access**: Navigate to `/admin/new-v2`
2. **Create**: Start typing or upload a document
3. **Preview**: See live updates in the right panel
4. **Validate**: Check for errors using the validation tool
5. **Continue**: Click "Tiếp tục" to proceed to configuration

For support or feature requests, please contact the development team.