# Next.js Conversion Files

This folder contains all the files needed to convert the Express.js frontend to Next.js while keeping the Express.js backend.

## Folder Structure

### `/views` - HTML Templates to Convert
All HTML templates that need to be converted to Next.js pages/components:

- `landing.html` → Convert to Next.js home page (`pages/index.js` or `app/page.js`)
- `lessons.html` → Convert to lessons listing page (`pages/lessons.js`)
- `lesson.html` → Convert to individual lesson page (`pages/lesson/[id].js`)
- `login.html`, `student-login.html` → Convert to login pages
- `student-register.html` → Convert to registration page
- `admin-*.html` → Convert to admin dashboard pages
- `profile.html`, `settings.html`, etc. → Convert to user pages

### `/public` - Static Assets
All static assets to be moved to Next.js public folder:

- `/css` - Stylesheets (convert to CSS modules or styled-components)
- `/js` - Client-side JavaScript (convert to React components/hooks)
- `/images` - Images and icons
- `/audio` - Audio files
- `/lesson_handout` - Lesson materials

### `/routes/views.js` - Routing Reference
Express.js view routing logic to understand:
- Route patterns and authentication requirements
- How pages are protected (admin vs student)
- Redirect logic for authentication
- Cache headers and middleware usage

### `/lib` - Backend Logic Reference
Key backend files for understanding patterns:

#### `/lib/middleware/auth.js`
- Authentication middleware patterns
- Session validation logic
- Admin vs student authentication
- Convert to Next.js API middleware or client-side auth

#### `/lib/middleware/csrf.js`
- CSRF protection implementation
- Token generation and validation
- Convert to Next.js API protection

#### `/lib/services/sessionService.js`
- Session management patterns
- User state management
- Convert to client-side state management (Context API, Zustand, etc.)

#### `/lib/config/constants.js`
- Application constants
- Error messages
- Configuration values

#### `/lib/config/database.js`
- Database configuration (Supabase)
- Connection patterns
- Use for Next.js API routes

### `package.json` - Dependencies Reference
Current dependencies to understand what's needed for the backend vs frontend.

## Conversion Strategy

### 1. Next.js Setup
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
```

### 2. Convert HTML to React Components
- Convert each HTML file in `/views` to a React component
- Extract reusable components (navigation, forms, etc.)
- Convert inline styles to CSS modules or Tailwind classes

### 3. Convert Client-side JavaScript
- Convert `/public/js/*.js` files to React hooks and components
- Replace fetch calls with proper API integration
- Implement client-side routing with Next.js router

### 4. Authentication Implementation
- Implement client-side authentication using Next.js patterns
- Use JWT tokens or session cookies
- Create protected routes using Next.js middleware
- Implement login/logout flows

### 5. API Integration
- Keep existing Express.js API routes
- Update API calls in frontend to point to Express backend
- Handle CORS if frontend and backend are on different ports
- Implement proper error handling

### 6. State Management
- Convert session-based state to client-side state management
- Use React Context API or external library (Zustand, Redux)
- Manage user authentication state
- Handle loading states and error states

### 7. Styling
- Convert CSS files to CSS modules or styled-components
- Implement responsive design with Tailwind CSS
- Maintain existing design system and components

## Key Considerations

1. **Authentication Flow**: Convert from server-side sessions to client-side auth
2. **API Calls**: Update all fetch calls to point to Express backend
3. **Routing**: Convert Express routes to Next.js file-based routing
4. **State Management**: Replace server-side session with client-side state
5. **Security**: Implement CSRF protection and secure API calls
6. **Performance**: Implement proper caching and optimization
7. **SEO**: Use Next.js SSR/SSG for better SEO where needed

## Next Steps

1. Set up Next.js project
2. Start with converting the landing page (`views/landing.html`)
3. Implement authentication system
4. Convert main user flows (lessons, profile, etc.)
5. Convert admin pages
6. Test integration with Express backend
7. Deploy frontend and backend separately

## Backend Changes Needed

The Express.js backend will need minimal changes:
- Remove view serving routes (`routes/views.js`)
- Add CORS configuration for frontend
- Update session configuration if needed
- Ensure API routes work with client-side calls
