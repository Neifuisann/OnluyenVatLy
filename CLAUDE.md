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