# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Credentials

- Admin Username: admin
- Admin Password: hoff
- Student Test Username: 0375931007
- Student Test Password: 140207

## Supabase Project
- Project ID: miojaflixmncmhsgyabd

## Project Overview
This is a Physics Learning Management System for Vietnamese Grade 12 students built with:
- Backend: Node.js + Express.js
- Database: PostgreSQL via Supabase
- AI: Google Gemini API for content generation
- Deployment: Vercel (serverless functions)

## Common Development Commands

### Running the Application
```bash
npm start              # Start the server (runs node api/index.js)
```

### Testing

#### Unit Tests
```bash
node test/shuffle-test.js      # Test shuffling algorithms
```

#### E2E Tests with Playwright
```bash
npm test                       # Run all Playwright tests
npm run test:ui                # Run tests in UI mode
npm run test:debug             # Run tests in debug mode
npm run test:headed            # Run tests with browser visible
npm run test:report            # View HTML test report
```

Before running Playwright tests:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

#### Test Authentication Bypass

Playwright tests can bypass authentication using test tokens. This speeds up tests significantly.

**Setup for local testing:**
1. Ensure `NODE_ENV=development` in your `.env` file
2. Tests will automatically use test authentication

**Example usage in tests:**
```javascript
const testAuth = require('./helpers/testAuth');

// For student authentication
await testAuth.applyAuthToPage(page, 'student');

// For admin authentication  
await testAuth.applyAuthToPage(page, 'admin');
```

Available test files:
- `landing-page.spec.js` - Tests for the landing page
- `lessons-page.spec.js` - Comprehensive tests for /lessons page including:
  - Real data fetching (stats, progress, tags, lessons)
  - Interactive features (search, sort, tag filtering, modals)
  - Pagination, responsive design, error handling
- `auth-test.spec.js` - Example of using test authentication bypass
## High-Level Architecture

### Core Structure
- **api/index.js** - Main Express entry point configured for Vercel deployment
- **routes/** - All API endpoints and view routes (32 route files)
- **lib/controllers/** - Request handlers implementing business logic (18 controllers)
- **lib/services/** - Core services handling database operations and business rules (19 services)
- **lib/middleware/** - Express middleware for auth, CSRF, rate limiting, encryption (9 modules)
- **lib/config/** - Database connections, session config, constants
- **playwright-test/** - Automated E2E tests using Playwright
- **playwright.config.js** - Playwright test configuration

### Key Architectural Decisions

1. **Session-Based Authentication**
   - Sessions stored in PostgreSQL via connect-pg-simple
   - Device tracking with fingerprinting for additional security
   - Admin and student roles with different permission levels

2. **End-to-End Encryption for Quiz Data**
   - Quiz questions and answers are encrypted at rest
   - Encryption/decryption happens in middleware layer
   - Encrypted endpoints: GET /api/quiz/, POST /api/quiz/submit

3. **Gamification System**
   - XP and points calculation with sophisticated distribution algorithms
   - Achievements, streaks, quests, and league systems
   - Real-time progress tracking and analytics

4. **AI Integration**
   - Google Gemini API for generating lesson content
   - AI-powered answer explanations and feedback
   - Content moderation and filtering

5. **Caching Strategy**
   - Response caching for static content
   - Database query result caching
   - Session-based caching for user data

### Important Services to Understand

- **authService.js** - Handles authentication, password hashing, device validation
- **lessonService.js** - Core lesson management and quiz operations
- **pointsService.js** - Complex points calculation and distribution logic
- **encryptionService.js** - AES encryption for sensitive data
- **achievementService.js** - Gamification features (XP, achievements, streaks)
- **aiService.js** - Google Gemini API integration

### Security Considerations

- All API routes require CSRF protection (csrfMiddleware)
- Rate limiting on sensitive endpoints
- Production logging sanitizes sensitive information
- Session keys rotate on authentication
- Device fingerprinting for session validation

### Database Schema Key Tables

- users - User accounts with roles
- lessons - Course lessons
- questions - Quiz questions (encrypted)
- user_progress - Progress tracking
- achievements, user_achievements - Gamification data
- user_sessions - Session management with device tracking

## Development Tips

- Always test encryption/decryption when modifying quiz-related endpoints
- Check rate limits when testing API endpoints repeatedly
- Use the logging service for debugging (it sanitizes sensitive data in production)
- Session management is critical - ensure device validation works correctly
- The points distribution algorithm in pointsService.js is complex - understand it before modifying

## Study Materials Guidelines

### Material HTML Format Requirements

When working with study materials in `/materials/grade{10,11,12}/`:

1. **Remove problematic scripts**:
   - Always remove `polyfill.io` scripts as they cause slow loading
   - MathJax should be loaded directly from CDN

2. **CSS Classes for Dark Theme Compatibility**:
   - `.definition-box` - Purple accent background for definitions
   - `.formula-box` - Green-tinted background for formulas
   - `.important-formula` - Yellow accent for important formulas
   - `.example-box` or `.vi-du` - Purple-tinted for examples
   - `.solution` or `.giai` - Green-tinted for solutions
   - `.note-box` - Blue accent for notes
   - `.warning-box` - Red accent for warnings
   - `.practice-problem` - Purple border with "Bài tập" label
   - `.experiment-box` - Green border with "Thí nghiệm" label for experiments
   - `.force-type` - Light red background for force type explanations
   - `.special-case` - Orange border with "Trường hợp đặc biệt" label
   - `.energy-type` - Light green background for energy type explanations
   - `.comparison-table` - Styled table container for comparisons

3. **Standardized Class Mappings** (for consistency):
   - `application-box` → `note-box`
   - `classification-box` → `definition-box`
   - `conservation-box` → `important-formula`
   - `law-box` → `important-formula`
   - `method-box` → `note-box`
   - `theorem-box` → `important-formula`
   - `transformation-box` → `formula-box`
   - `unit-box` → `definition-box`

4. **List Alignment**:
   - Ordered lists with `type="a"` need extra padding (2rem)
   - Regular ordered lists use 1.5rem padding
   - List items should have proper spacing (0.5rem margin)

5. **Color Contrast**:
   - All text in colored boxes must use `var(--text-primary)` for readability
   - Avoid light text on light backgrounds
   - Use semi-transparent backgrounds with solid text colors

6. **MathJax Compatibility**:
   - Ensure MathJax containers use `var(--text-primary)` color
   - Remove polyfill dependencies

### Implementation Location
These styles are applied in `routes/views.js` when serving individual material pages at `/materials/grade:gradeId/:chapterId/:topicId`.

## Important Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.