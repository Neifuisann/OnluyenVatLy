# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnluyenVatLy is a Physics Online Learning Platform built with Node.js/Express. It provides an interactive quiz-based learning system with student management, progress tracking, and AI-powered explanations.

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Start the server
npm start
# or
node api/index.js

# Run on specific port
PORT=3003 npm start
```

### Testing
```bash
# Run tests (if implemented)
npm test
```

## Architecture Overview

### Backend Structure
- **api/index.js**: Main Express server entry point with middleware setup
- **api/routes/**: RESTful API endpoints organized by feature
- **api/controllers/**: Business logic handlers
- **api/services/**: Core services (auth, database, AI, caching)
- **api/middleware/**: Auth checks, validation, error handling
- **api/utils/**: Helper functions and utilities

### Key Services
1. **Database Service** (`api/services/databaseService.js`): Supabase PostgreSQL operations
2. **Auth Service** (`api/services/authService.js`): Device fingerprinting and session management
3. **AI Service** (`api/services/aiService.js`): Google Gemini API integration
4. **Cache Service** (`api/services/cacheService.js`): In-memory caching layer

### Frontend Organization
- **views/**: HTML templates for all pages
- **public/css/**: Page-specific stylesheets
- **public/js/**: Client-side JavaScript for interactive features
- **public/images/**: Static assets

## Critical Implementation Details

### Authentication Flow
- Session-based with PostgreSQL store via connect-pg-simple
- Device fingerprinting for security (user agent + IP hash)
- Student accounts can be bound to specific devices
- Admin and student roles with separate auth middleware

### Database Schema
- Students table with device binding support
- Lessons table with quiz questions (JSON)
- Progress tracking with completion status and streaks
- ELO-based rating system for competitive elements

### API Patterns
- All API routes prefixed with `/api/`
- Consistent JSON response format: `{ success: boolean, data/message }`
- Comprehensive error handling with proper HTTP status codes
- Request/response logging for debugging

### Session Management
- Configurable timeout (default from environment)
- Automatic cleanup of orphaned sessions
- Device validation on each request if strict mode enabled

## Environment Configuration

Required environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anon key
- `SESSION_SECRET`: Express session secret
- `GEMINI_API_KEY`: Google AI API key for explanations
- `PORT`: Server port (default 3003)
- `NODE_ENV`: Environment (development/production)
- `SESSION_TIMEOUT_HOURS`: Session timeout duration
- `CACHE_VERSION`: Cache busting version

## Development Considerations

### File Upload Handling
- Uses multer for multipart form data
- Sharp for image optimization
- Supports DOCX and PDF parsing for lesson content import
- Configured upload limits in `api/config/constants.js`

### Caching Strategy
- In-memory cache for frequently accessed data
- Session-based caching for user-specific data
- Cache headers configured for static assets

### Error Handling
- Global error handler in `api/middleware/errorHandler.js`
- Structured logging with daily rotation
- Graceful shutdown handling

### Security Measures
- bcrypt for password hashing
- Input validation middleware
- Rate limiting on auth endpoints
- XSS prevention in templates

## Deployment

Deployed on Vercel with:
- Automatic API routing via vercel.json
- Environment variables configured in Vercel dashboard
- PostgreSQL database hosted on Supabase

## Common Tasks

### Adding a New Feature
1. Create route file in `api/routes/`
2. Implement controller in `api/controllers/`
3. Add service logic if needed in `api/services/`
4. Create corresponding view in `views/` and static assets in `public/`
5. Register route in `api/index.js`

### Database Migrations
Database changes should be made through Supabase dashboard or SQL editor. The schema is documented in `docs/database/`.

### Debugging
- Check logs in console output
- Use the logger utility for structured logging
- Session data accessible via `sessionService.getSessionData(req)`

## Complete API Endpoint Documentation

### Authentication Endpoints (`/api/auth/*`)
- `POST /api/auth/admin/login` - Admin login with rate limiting
- `POST /api/auth/admin/logout` - Admin logout
- `GET /api/auth/admin/check` - Check admin authentication
- `POST /api/auth/student/login` - Student login with device validation
- `POST /api/auth/student/register` - Student registration (requires approval)
- `POST /api/auth/student/logout` - Student logout
- `GET /api/auth/student/check` - Check student authentication
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/validate-device` - Validate device for student
- `GET /api/auth/session` - Get current session information
- `POST /api/auth/refresh` - Refresh session

### Student Management (`/api/students/*`)
- `GET /api/students/` - Get all students (admin only)
- `GET /api/students/pending` - Get pending approval students
- `GET /api/students/approved` - Get approved students
- `POST /api/students/:id/approve` - Approve student account
- `POST /api/students/:id/reject` - Reject student application
- `DELETE /api/students/:id` - Delete student account
- `POST /api/students/:id/reset-password` - Reset student password
- `GET /api/students/:id/profile` - Get student profile
- `PUT /api/students/:id/profile` - Update student profile
- `GET /api/students/:id/statistics` - Get student statistics
- `GET /api/students/:id/activity` - Get student activity log
- `PUT /api/students/:id/device` - Update device information

### Lesson Management (`/api/lessons/*`)
- `GET /api/lessons/` - Get lessons with pagination and filters
- `GET /api/lessons/search` - Search lessons by keywords
- `GET /api/lessons/featured` - Get featured lessons
- `GET /api/lessons/recent` - Get recently added lessons
- `GET /api/lessons/subject/:subject` - Get lessons by subject
- `GET /api/lessons/grade/:grade` - Get lessons by grade level
- `GET /api/lessons/:id` - Get specific lesson by ID
- `POST /api/lessons/` - Create new lesson (admin only)
- `PUT /api/lessons/:id` - Update lesson (admin only)
- `DELETE /api/lessons/:id` - Delete lesson (admin only)
- `POST /api/lessons/reorder` - Update lesson display order
- `POST /api/lessons/:id/duplicate` - Duplicate existing lesson
- `GET /api/lessons/:id/statistics` - Get lesson performance statistics
- `GET /api/lessons/:id/results` - Get lesson results
- `GET /api/lessons/:id/rankings` - Get student rankings for lesson

### Quiz and Results (`/api/quiz/*`, `/api/results/*`)
- `GET /api/quiz/` - Get quiz questions for lesson
- `POST /api/quiz/submit` - Submit quiz answers
- `POST /api/quiz/save` - Save quiz progress
- `POST /api/results/` - Submit complete lesson result
- `GET /api/results/:id` - Get specific result details
- `GET /api/results/lesson/:lessonId` - Get all results for lesson
- `GET /api/results/student/:studentId` - Get all results for student
- `DELETE /api/results/:id` - Delete result (admin only)
- `GET /api/results/statistics/overview` - Get result statistics overview

### Utility Endpoints
- `GET /api/gallery/` - Get gallery images
- `GET /api/history/` - Get admin history with pagination
- `DELETE /api/history/` - Clear admin history
- `GET /api/tags/` - Get available lesson tags
- `POST /api/explain/` - Get AI explanation for quiz answers
- `GET /api/ratings/` - Get rating system data
- `POST /api/uploads/` - Upload files (images, documents)
- `GET /api/progress/` - Get student progress tracking

## Frontend JavaScript Architecture

### Core JavaScript Modules
- **device-id.js**: Device fingerprinting for authentication
- **storage-recovery.js**: Session storage recovery and management
- **network-animation.js**: Network visualization components
- **lessons.js**: Main lesson browsing and interaction
- **lesson.js**: Individual lesson display and quiz functionality
- **quizgame.js**: Interactive quiz game with animations and sound
- **result.js**: Quiz result display and AI explanations
- **gallery.js**: Image gallery with pagination
- **landing.js**: Homepage interactions and animations
- **history.js**: Admin history management with pagination

### Admin Interface Modules
- **admin-list.js**: Lesson management, statistics, and bulk operations
- **admin-stage1-editor.js**: Rich text editor for lesson content
- **admin-stage2-configure.js**: Quiz configuration and question setup
- **admin-quiz-edit.js**: Quiz editing with real-time preview
- **document-upload.js**: Document processing and content import
- **lesson-statistics.js**: Detailed lesson analytics

### API Communication Patterns
- **Standard Response Format**: `{ success: boolean, data?: any, message?: string }`
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Authentication**: Session-based auth with device validation
- **Caching**: Client-side caching for frequently accessed data
- **Rate Limiting**: Automatic retry with exponential backoff

### Frontend-Backend Synchronization
- **Session Management**: Automatic session validation and renewal
- **Device Validation**: Client-side device fingerprinting matches server-side validation
- **Error Recovery**: Graceful handling of network failures and timeouts
- **Data Consistency**: Real-time validation of form data before submission

## Static File Serving Configuration

### Caching Strategy
```javascript
// CSS/JS files: No-cache for theme consistency
// Images: 1-day cache for performance
// HTML: Must-revalidate for dynamic content
```

### Directory Structure
```
public/
├── css/           # 5 stylesheets (all present)
├── js/            # 20 JavaScript modules (all present)
├── images/        # 26 lesson and UI images (all present)
├── audio/         # 17 quiz game sound effects (all present)
└── lesson_images/ # Numbered lesson content images
```

### Asset Optimization
- **Images**: Automatic SVG fallbacks for missing images
- **Audio**: Comprehensive sound system for quiz feedback
- **CSS**: Modular stylesheets with smart caching
- **JavaScript**: Module-based organization with dependency management

## Known Issues and Troubleshooting

### Recent Refactoring Issues
1. **Duplicate Route Definitions**: Some auth routes are defined in both `api/index.js` and `api/routes/auth.js`
2. **Missing Result Controller**: `api/routes/results.js` implements logic directly instead of using controller pattern
3. **Session Storage Dependencies**: Heavy reliance on sessionStorage for admin workflow
4. **Response Format Inconsistencies**: Some APIs don't follow standard response format

### Common Development Issues
1. **Session Timeout**: Check `SESSION_TIMEOUT_HOURS` environment variable
2. **Device Validation Failures**: Ensure `STRICT_DEVICE_CHECK` is properly configured
3. **Database Connection**: Verify Supabase credentials and connection pool settings
4. **Cache Invalidation**: Use `CACHE_VERSION` environment variable for cache busting

### Debugging Tips
- **API Errors**: Check both console logs and network tab in browser
- **Authentication Issues**: Verify session data in PostgreSQL session store
- **Performance**: Monitor response times in access logs
- **Database**: Use Supabase dashboard for query analysis

## Security Implementation Details

### Authentication Security
- **bcrypt**: Password hashing with salt rounds of 10
- **Device Fingerprinting**: Combines user agent, IP, and canvas fingerprinting
- **Session Management**: PostgreSQL store with automatic cleanup
- **Rate Limiting**: 5 attempts per 15 minutes on auth endpoints
- **CSRF Protection**: Session-based CSRF tokens

### Data Protection
- **Input Validation**: Comprehensive validation middleware
- **XSS Prevention**: HTML sanitization in templates
- **SQL Injection**: Parameterized queries through Supabase client
- **File Upload Security**: Type validation and size limits
- **API Key Security**: Server-side API key management (never exposed to client)

### Network Security
- **HTTPS Enforcement**: Secure cookies in production
- **Trust Proxy**: Configured for Vercel deployment
- **Headers**: Security headers for XSS and clickjacking protection
- **CORS**: Properly configured for cross-origin requests

## Performance Optimization

### Caching Layers
1. **Application Cache**: In-memory caching for frequently accessed data
2. **Session Cache**: User-specific data cached in session
3. **Static Asset Cache**: 1-day cache for images, no-cache for CSS/JS
4. **Database Cache**: Connection pooling and query optimization

### Frontend Optimization
- **Lazy Loading**: Images and components loaded on demand
- **Code Splitting**: Modular JavaScript architecture
- **Asset Compression**: Automatic compression for production
- **CDN Ready**: Static assets structured for CDN deployment

### Database Optimization
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Indexed queries for common operations
- **Session Cleanup**: Automatic cleanup of expired sessions
- **Batch Operations**: Bulk operations for admin tasks

## Development Best Practices

### Code Organization
- **MVC Pattern**: Strict separation of routes, controllers, and services
- **Modular Architecture**: Feature-based organization
- **Consistent Naming**: Clear, descriptive naming conventions
- **Error Handling**: Centralized error handling with proper logging

### API Design
- **RESTful Endpoints**: Consistent REST API design
- **Versioning**: API versioning support for future changes
- **Documentation**: Comprehensive endpoint documentation
- **Testing**: API endpoint testing with proper test coverage

### Security Practices
- **Environment Variables**: Sensitive data in environment variables
- **Input Sanitization**: All user input properly sanitized
- **Authentication**: Proper authentication and authorization
- **Audit Logging**: Comprehensive audit trails for security events

## Monitoring and Logging

### Application Logging
- **Structured Logging**: JSON-formatted logs with proper levels
- **Daily Rotation**: Automatic log file rotation
- **Error Tracking**: Centralized error logging and tracking
- **Performance Metrics**: Response time and resource usage logging

### Security Monitoring
- **Authentication Events**: Login attempts, failures, and successes
- **Session Management**: Session creation, validation, and cleanup
- **Device Validation**: Device fingerprinting and validation events
- **Rate Limiting**: Rate limit violations and blocking events

### Performance Monitoring
- **Response Times**: API endpoint response time tracking
- **Database Performance**: Query execution time monitoring
- **Cache Performance**: Cache hit/miss ratios and performance
- **Error Rates**: Error frequency and pattern analysis