# File Mapping: Express.js to Next.js

This document maps the current Express.js structure to the new Next.js structure.

## HTML Views → Next.js Pages

| Current File | Next.js Location | Description |
|--------------|------------------|-------------|
| `views/landing.html` | `pages/index.js` or `app/page.js` | Home/landing page |
| `views/login.html` | `pages/login.js` | General login page |
| `views/student-login.html` | `pages/student/login.js` | Student login |
| `views/student-register.html` | `pages/student/register.js` | Student registration |
| `views/lessons.html` | `pages/lessons.js` | Lessons listing |
| `views/lesson.html` | `pages/lesson/[id].js` | Individual lesson |
| `views/practice.html` | `pages/practice.js` | Practice mode |
| `views/quizgame.html` | `pages/quiz.js` | Quiz game |
| `views/profile.html` | `pages/profile.js` | User profile |
| `views/settings.html` | `pages/settings.js` | User settings |
| `views/result.html` | `pages/result/[id].js` | Quiz results |
| `views/history.html` | `pages/history.js` | User history |
| `views/leaderboard.html` | `pages/leaderboard.js` | Leaderboard |
| `views/gallery.html` | `pages/gallery.js` | Theory gallery |
| `views/review-mistakes.html` | `pages/review-mistakes.js` | Review mistakes |
| `views/share-lesson.html` | `pages/share/lesson/[id].js` | Shared lesson |
| `views/admin-login.html` | `pages/admin/login.js` | Admin login |
| `views/admin-list.html` | `pages/admin/index.js` | Admin dashboard |
| `views/admin-new-v2.html` | `pages/admin/lessons/new.js` | Create lesson |
| `views/admin-edit.html` | `pages/admin/lessons/[id]/edit.js` | Edit lesson |
| `views/admin-configure.html` | `pages/admin/lessons/[id]/configure.js` | Configure lesson |
| `views/admin-students.html` | `pages/admin/students.js` | Student management |
| `views/admin-ai-tools.html` | `pages/admin/ai-tools.js` | AI tools |
| `views/admin-settings.html` | `pages/admin/settings.js` | Admin settings |
| `views/lesson-statistics.html` | `pages/admin/lessons/[id]/statistics.js` | Lesson stats |
| `views/404.html` | `pages/404.js` | 404 error page |

## JavaScript Files → React Components/Hooks

| Current File | Next.js Location | Description |
|--------------|------------------|-------------|
| `public/js/auth-utils.js` | `hooks/useAuth.js` | Authentication hook |
| `public/js/lessons.js` | `components/LessonsList.js` | Lessons listing component |
| `public/js/lesson.js` | `components/LessonPlayer.js` | Lesson player component |
| `public/js/quizgame.js` | `components/QuizGame.js` | Quiz game component |
| `public/js/landing.js` | `components/Landing.js` | Landing page component |
| `public/js/profile.js` | `components/Profile.js` | Profile component |
| `public/js/settings.js` | `components/Settings.js` | Settings component |
| `public/js/history.js` | `components/History.js` | History component |
| `public/js/gallery.js` | `components/Gallery.js` | Gallery component |
| `public/js/result.js` | `components/Result.js` | Result component |
| `public/js/practice.js` | `components/Practice.js` | Practice component |
| `public/js/review-mistakes.js` | `components/ReviewMistakes.js` | Review component |
| `public/js/admin-new-v2.js` | `components/admin/LessonEditor.js` | Lesson editor |
| `public/js/admin-list.js` | `components/admin/Dashboard.js` | Admin dashboard |
| `public/js/admin-ai-tools.js` | `components/admin/AITools.js` | AI tools |
| `public/js/csrf-utils.js` | `utils/csrf.js` | CSRF utility |
| `public/js/device-id.js` | `hooks/useDeviceId.js` | Device ID hook |
| `public/js/encryption-utils.js` | `utils/encryption.js` | Encryption utility |
| `public/js/nav-mobile.js` | `components/Navigation.js` | Navigation component |
| `public/js/network-animation.js` | `components/NetworkAnimation.js` | Animation component |
| `public/js/social-leaderboard.js` | `components/Leaderboard.js` | Leaderboard component |
| `public/js/streak-widget.js` | `components/StreakWidget.js` | Streak widget |
| `public/js/league-widget.js` | `components/LeagueWidget.js` | League widget |
| `public/js/activity-feed.js` | `components/ActivityFeed.js` | Activity feed |

## CSS Files → Next.js Styles

| Current File | Next.js Location | Description |
|--------------|------------------|-------------|
| `public/css/style.css` | `styles/globals.css` | Global styles |
| `public/css/admin-enhanced.css` | `styles/admin.module.css` | Admin styles |
| `public/css/admin-new-v2.css` | `styles/lesson-editor.module.css` | Editor styles |
| `public/css/gallery.css` | `styles/gallery.module.css` | Gallery styles |
| `public/css/history.css` | `styles/history.module.css` | History styles |
| `public/css/landing-secondary.css` | `styles/landing.module.css` | Landing styles |
| `public/css/lesson-questions.css` | `styles/lesson.module.css` | Lesson styles |
| `public/css/settings.css` | `styles/settings.module.css` | Settings styles |

## Static Assets → Next.js Public

| Current Location | Next.js Location | Description |
|------------------|------------------|-------------|
| `public/images/*` | `public/images/*` | Images (same location) |
| `public/audio/*` | `public/audio/*` | Audio files (same location) |
| `public/lesson_handout/*` | `public/lesson_handout/*` | Lesson materials |

## Backend References → Next.js Utils/Hooks

| Current File | Next.js Location | Purpose |
|--------------|------------------|---------|
| `lib/middleware/auth.js` | `utils/auth.js` | Auth utilities |
| `lib/middleware/csrf.js` | `utils/csrf.js` | CSRF handling |
| `lib/services/sessionService.js` | `hooks/useSession.js` | Session management |
| `lib/config/constants.js` | `utils/constants.js` | App constants |
| `lib/config/database.js` | `utils/api.js` | API configuration |

## Route Mapping

| Express Route | Next.js Route | Protection |
|---------------|---------------|------------|
| `GET /` | `/` | Public |
| `GET /login` | `/login` | Public |
| `GET /student/login` | `/student/login` | Public |
| `GET /student/register` | `/student/register` | Public |
| `GET /lessons` | `/lessons` | Protected (Student) |
| `GET /lesson/:id` | `/lesson/[id]` | Protected (Student) |
| `GET /profile` | `/profile` | Protected (Student) |
| `GET /settings` | `/settings` | Protected (Student) |
| `GET /admin` | `/admin` | Protected (Admin) |
| `GET /admin/new` | `/admin/lessons/new` | Protected (Admin) |
| `GET /admin/edit/:id` | `/admin/lessons/[id]/edit` | Protected (Admin) |

## API Routes (Stay with Express Backend)

All API routes remain with the Express backend:
- `/api/auth/*` - Authentication endpoints
- `/api/lessons/*` - Lesson management
- `/api/students/*` - Student management
- `/api/admin/*` - Admin operations
- `/api/quiz/*` - Quiz operations
- etc.

## New Next.js Structure

```
frontend/
├── pages/
│   ├── index.js (landing)
│   ├── login.js
│   ├── lessons.js
│   ├── lesson/
│   │   └── [id].js
│   ├── student/
│   │   ├── login.js
│   │   └── register.js
│   ├── admin/
│   │   ├── index.js
│   │   ├── lessons/
│   │   └── students.js
│   └── api/ (if using Next.js API routes)
├── components/
│   ├── Layout.js
│   ├── Navigation.js
│   ├── LessonsList.js
│   └── admin/
├── hooks/
│   ├── useAuth.js
│   ├── useSession.js
│   └── useDeviceId.js
├── utils/
│   ├── api.js
│   ├── auth.js
│   ├── csrf.js
│   └── constants.js
├── styles/
│   ├── globals.css
│   └── *.module.css
└── public/
    ├── images/
    ├── audio/
    └── lesson_handout/
```

## Migration Priority

1. **High Priority** (Core user flows):
   - Landing page
   - Authentication pages
   - Lessons listing and detail
   - Quiz functionality

2. **Medium Priority** (User features):
   - Profile and settings
   - History and results
   - Leaderboard

3. **Low Priority** (Admin features):
   - Admin dashboard
   - Lesson editor
   - Student management

## Notes

- Keep Express backend running during migration
- Test each converted page before moving to next
- Maintain same functionality and user experience
- Consider implementing improvements during conversion
- Use TypeScript for better type safety
- Implement proper error handling and loading states
