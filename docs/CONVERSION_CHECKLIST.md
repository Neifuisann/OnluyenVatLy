# Next.js Conversion Checklist

## Phase 1: Project Setup
- [x] Create Next.js project with TypeScript and Tailwind CSS
- [x] Set up project structure (pages/components/hooks/utils)
- [x] Configure environment variables
- [x] Set up API base URL configuration
- [x] Install additional dependencies (axios, react-query, etc.)

## Phase 2: Core Infrastructure
- [x] Create authentication context/hook
- [x] Implement API client with error handling
- [x] Set up global state management
- [x] Create protected route wrapper
- [x] Implement CSRF token handling
- [x] Set up loading and error components

## Phase 3: Convert Static Assets
- [x] Move CSS files to Next.js public or styles folder
- [x] Convert global styles to CSS modules/Tailwind
- [x] Move images, audio, and other assets
- [x] Update asset paths in components
- [x] Optimize images with Next.js Image component

## Phase 4: Convert Core Pages
### Public Pages
- [x] Convert `landing.html` to home page (`pages/index.js`)
- [ ] Convert `login.html` to login page
- [ ] Convert `student-login.html` to student login
- [ ] Convert `student-register.html` to registration
- [ ] Convert `gallery.html` to gallery page

### Student Pages
- [ ] Convert `lessons.html` to lessons listing
- [ ] Convert `lesson.html` to lesson detail page
- [ ] Convert `profile.html` to profile page
- [ ] Convert `settings.html` to settings page
- [ ] Convert `result.html` to results page
- [ ] Convert `quizgame.html` to quiz game
- [ ] Convert `practice.html` to practice page
- [ ] Convert `history.html` to history page
- [ ] Convert `leaderboard.html` to leaderboard

### Admin Pages
- [ ] Convert `admin-login.html` to admin login
- [ ] Convert `admin-list.html` to admin dashboard
- [ ] Convert `admin-new-v2.html` to lesson editor
- [ ] Convert `admin-configure.html` to lesson config
- [ ] Convert `admin-students.html` to student management
- [ ] Convert `admin-ai-tools.html` to AI tools
- [ ] Convert `admin-settings.html` to admin settings
- [ ] Convert `lesson-statistics.html` to lesson stats

## Phase 5: Convert JavaScript Functionality
### Authentication (`public/js/auth-utils.js`)
- [ ] Convert login/logout functions to React hooks
- [ ] Implement session management
- [ ] Create authentication context
- [ ] Handle authentication redirects

### Lessons (`public/js/lessons.js`)
- [ ] Convert lesson listing logic to React component
- [ ] Implement search and filtering
- [ ] Convert pagination logic
- [ ] Handle lesson navigation

### Lesson Detail (`public/js/lesson.js`)
- [ ] Convert lesson display logic
- [ ] Implement question answering
- [ ] Handle lesson completion
- [ ] Convert progress tracking

### Quiz Game (`public/js/quizgame.js`)
- [ ] Convert quiz game logic to React
- [ ] Implement timer functionality
- [ ] Handle answer submission
- [ ] Convert scoring system

### Admin Tools
- [ ] Convert `admin-new-v2.js` to lesson editor component
- [ ] Convert `admin-list.js` to admin dashboard
- [ ] Convert other admin JavaScript files

### Utilities
- [ ] Convert `csrf-utils.js` to API utility
- [ ] Convert `device-id.js` to React hook
- [ ] Convert `encryption-utils.js` if needed
- [ ] Convert navigation and mobile utilities

## Phase 6: API Integration
- [ ] Update all API calls to use proper base URL
- [ ] Implement proper error handling for API calls
- [ ] Add loading states for all API operations
- [ ] Implement retry logic where needed
- [ ] Add proper TypeScript types for API responses

## Phase 7: Authentication & Security
- [ ] Implement JWT token handling
- [ ] Create protected route middleware
- [ ] Handle token refresh
- [ ] Implement logout functionality
- [ ] Add CSRF protection to forms
- [ ] Secure sensitive operations

## Phase 8: State Management
- [ ] Implement user state management
- [ ] Add lesson progress state
- [ ] Handle form state management
- [ ] Implement caching for frequently used data
- [ ] Add optimistic updates where appropriate

## Phase 9: Styling & UI
- [ ] Convert all CSS to Tailwind/CSS modules
- [ ] Implement responsive design
- [ ] Add loading skeletons
- [ ] Implement proper error states
- [ ] Add animations and transitions
- [ ] Ensure accessibility compliance

## Phase 10: Testing & Optimization
- [ ] Test all user flows
- [ ] Test admin functionality
- [ ] Verify API integration
- [ ] Test authentication flows
- [ ] Optimize bundle size
- [ ] Implement proper SEO
- [ ] Add error boundaries

## Phase 11: Backend Updates
- [ ] Remove view routes from Express backend
- [ ] Add CORS configuration
- [ ] Update session configuration if needed
- [ ] Test API endpoints with new frontend
- [ ] Update deployment configuration

## Phase 12: Deployment
- [ ] Set up frontend deployment (Vercel/Netlify)
- [ ] Configure environment variables
- [ ] Test production build
- [ ] Set up CI/CD pipeline
- [ ] Monitor performance and errors

## Key Files to Reference During Conversion

### For Authentication Patterns:
- `lib/middleware/auth.js`
- `lib/services/sessionService.js`
- `public/js/auth-utils.js`

### For API Patterns:
- `routes/views.js` (for understanding route protection)
- `public/js/*.js` (for API call patterns)

### For Styling:
- `public/css/style.css` (main styles)
- Individual page styles in HTML files

### For Functionality:
- Each JavaScript file in `public/js/` corresponds to specific functionality
- HTML files show the structure and data flow

## Notes
- Keep the Express backend running during development for API calls
- Test each converted page thoroughly before moving to the next
- Maintain the same user experience and functionality
- Consider implementing progressive enhancement
- Document any changes or improvements made during conversion
