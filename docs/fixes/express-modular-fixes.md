# Express.js Modular Architecture Fixes

## Critical Issues and Solutions

### 1. Session Service Initialization Fix

**File: `/api/services/sessionService.js`**

The sessionService needs to be initialized with sessionStore properly:

```javascript
class SessionService {
  constructor() {
    this.sessionStore = null; // Initialize as null
  }

  // Initialize session service with session store
  initialize(sessionStore) {
    this.sessionStore = sessionStore;
  }
```

**File: `/api/index.js`**

Ensure sessionService is initialized AFTER sessionStore is created:

```javascript
// Import services that need initialization
const sessionService = require('./services/sessionService');

// After sessionStore is created
// Initialize session service with session store
sessionService.initialize(sessionStore);
```

### 2. Fix View Routes HTML File References

**File: `/api/routes/views.js`**

Fix incorrect HTML file references:

```javascript
// WRONG: serveHTML('register.html')
// CORRECT:
router.get('/register', 
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('student-register.html')
);

// Add missing gallery route
router.get('/gallery',
  optionalAuth,
  addSessionInfo,
  longCacheMiddleware(1800),
  serveHTML('gallery.html')
);

// Fix other incorrect references:
// student-dashboard.html -> lessons.html
// student-profile.html -> profile.html
// student-results.html -> result.html
// student-rating.html -> leaderboard.html
// admin.html -> admin-list.html
// admin-lessons.html -> admin-list.html
// admin-lesson-new.html -> admin-edit.html
// admin-lesson-edit.html -> admin-edit.html
// admin-results.html -> admin-list.html
// admin-ratings.html -> admin-list.html
// admin-uploads.html -> admin-list.html
// admin-statistics.html -> admin-list.html
// 500.html -> 404.html
// api-docs.html -> 404.html
```

### 3. Add Missing API Route Aliases

**File: `/api/index.js`**

Add route aliases for backward compatibility:

```javascript
// Setup API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/results', resultRoutes);

// Add route aliases for backward compatibility
app.use('/api', authRoutes); // This allows /api/student/login instead of /api/auth/student/login

// Add missing routes
app.post('/api/student-info', (req, res) => {
    req.session.studentInfo = req.body;
    res.json({ success: true });
});
```

### 4. Add Missing Endpoints

**File: `/api/routes/views.js`**

Add missing share lesson route:

```javascript
// Share lesson route (public)
router.get('/share/lesson/:lessonId', async (req, res) => {
    const lessonId = req.params.lessonId;
    const loggedInStudentId = req.session.studentId;
    
    try {
        // Implementation from one-file version
        // ... (copy the entire share lesson implementation)
    } catch (error) {
        console.error(`Error generating share page for lesson ${lessonId}:`, error.message);
        res.status(404).send(/* error HTML */);
    }
});
```

### 5. Create Missing Controllers/Routes

**File: `/api/controllers/explainController.js`** (NEW)

```javascript
const aiService = require('../services/aiService');
const { asyncHandler } = require('../middleware/errorHandler');

class ExplainController {
    generateExplanation = asyncHandler(async (req, res) => {
        const { question, correctAnswer, studentAnswer } = req.body;
        
        const explanation = await aiService.generateQuestionExplanation(
            question,
            correctAnswer,
            studentAnswer
        );
        
        res.json({
            success: true,
            explanation
        });
    });
}

module.exports = new ExplainController();
```

**File: `/api/routes/explain.js`** (NEW)

```javascript
const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explainController');
const { requireStudentAuth } = require('../middleware/auth');

router.post('/', requireStudentAuth, explainController.generateExplanation);

module.exports = router;
```

### 6. Fix Gallery Images Endpoint

**File: `/api/controllers/galleryController.js`** (NEW)

```javascript
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler } = require('../middleware/errorHandler');

class GalleryController {
    getGalleryImages = asyncHandler(async (req, res) => {
        const imagesDir = path.join(process.cwd(), 'public', 'lesson_images');
        
        try {
            await fs.access(imagesDir);
        } catch (dirError) {
            if (dirError.code === 'ENOENT') {
                await fs.mkdir(imagesDir, { recursive: true });
            } else {
                throw dirError;
            }
        }
        
        const dirents = await fs.readdir(imagesDir, { withFileTypes: true });
        const files = dirents
            .filter(dirent => dirent.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(dirent.name))
            .map(dirent => `/lesson_images/${dirent.name}`)
            .sort();
        
        res.json(files);
    });
}

module.exports = new GalleryController();
```

### 7. Fix Result Submission with Rating Update

**File: `/api/routes/results.js`**

Update the result submission to include rating update:

```javascript
// Import rating service
const ratingService = require('../services/ratingService');

// In the submit result route:
router.post('/',
  requireStudentAuth,
  requireStudentInfo,
  validateResult,
  noCacheMiddleware,
  asyncHandler(async (req, res) => {
    const { lessonId, answers, timeTaken, studentInfo, score, totalPoints, streak } = req.body;
    const sessionData = sessionService.getSessionData(req);
    
    // ... existing code to save result ...
    
    // Update rating if student is authenticated
    let ratingUpdate = null;
    if (sessionData.studentId && score > 0) {
      try {
        ratingUpdate = await ratingService.updateStudentRating(
          sessionData.studentId,
          lessonId,
          score,
          totalPoints,
          timeTaken,
          streak || 0
        );
      } catch (error) {
        console.error('Rating update failed:', error);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Result submitted successfully',
      resultId: savedResult.id,
      score,
      totalPoints,
      rating: ratingUpdate
    });
  })
);
```

### 8. Add Missing Database Methods

**File: `/api/services/databaseService.js`**

Add missing methods:

```javascript
// Add method to get student by ID
async getStudentById(studentId) {
    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
    
    if (error) throw error;
    return student;
}

// Add method to save raw lesson content
async saveRawLessonContent(id, content, userId) {
    const { data, error } = await supabaseAdmin
        .from('temp_lesson_content')
        .upsert({ 
            id: id,
            content: content,
            created_at: new Date().toISOString(),
            user_id: userId || 'unknown'
        });
    
    if (error) throw error;
    return data;
}

// Add method to get raw lesson content
async getRawLessonContent(id) {
    const { data, error } = await supabaseAdmin
        .from('temp_lesson_content')
        .select('content')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}
```

### 9. Fix Middleware Application

**File: `/api/index.js`**

Apply middleware to correct paths:

```javascript
// Apply student authentication middleware to relevant routes
app.use('/lythuyet', requireStudentAuth);
app.use('/multiplechoice', requireStudentAuth);
app.use('/quizgame', requireStudentAuth);
app.use('/truefalse', requireStudentAuth);
app.use('/lesson/:id', requireStudentAuth);
app.use('/result', requireStudentAuth);
app.use('/result/:id', requireStudentAuth);
app.use('/api/results', requireStudentAuth);
app.use('/api/explain', requireStudentAuth);

// Apply the student info middleware
app.use('/lesson/', requireStudentInfo);
```

### 10. Add All Missing Routes to Index

**File: `/api/index.js`**

```javascript
// Import all missing routes
const explainRoutes = require('./routes/explain');
const galleryRoutes = require('./routes/gallery');
const quizRoutes = require('./routes/quiz');
const tagsRoutes = require('./routes/tags');

// Setup all API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/explain', explainRoutes);
app.use('/api/gallery-images', galleryRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tags', tagsRoutes);

// Add backward compatibility routes
app.use('/api', authRoutes);

// Add session info endpoint
app.post('/api/student-info', (req, res) => {
    req.session.studentInfo = req.body;
    res.json({ success: true });
});
```

### 11. Fix Authentication Service

**File: `/api/services/authService.js`**

Update device checking logic:

```javascript
// In authenticateStudent method:
const approvedDevice = student.approved_device_id || student.approved_device_fingerprint;
const isDeviceCheckEnabled = process.env.STRICT_DEVICE_CHECK !== 'false';

if (approvedDevice && approvedDevice !== deviceIdentifier && isDeviceCheckEnabled) {
    console.log(`🔒 Device mismatch for student ${student.id}`);
    throw new Error('Bạn chỉ có thể đăng nhập từ thiết bị đã đăng ký trước đó.');
} else if (approvedDevice && approvedDevice !== deviceIdentifier) {
    console.log(`⚠️  Device mismatch detected but allowing login (strict check disabled)`);
}
```

### 12. Update Session Service

**File: `/api/services/sessionService.js`**

Fix terminateExistingSessions method:

```javascript
async terminateExistingSessions(studentId, currentSessionId) {
    try {
        const { data: studentData, error } = await require('../config/database').supabase
            .from('students')
            .select('current_session_id')
            .eq('id', studentId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching student session:', error);
            return;
        }

        if (studentData && studentData.current_session_id && 
            studentData.current_session_id !== currentSessionId) {
            console.log(`🔄 Single session enforcement: Terminating previous session`);
            
            this.sessionStore.destroy(studentData.current_session_id, (err) => {
                if (err) {
                    console.error('❌ Error destroying previous session:', err);
                } else {
                    console.log(`✅ Previous session terminated`);
                }
            });
        }
    } catch (error) {
        console.error('Error terminating existing sessions:', error);
    }
}
```

### 13. Create Missing Route Files

Create these missing route files:

- `/api/routes/gallery.js`
- `/api/routes/quiz.js`
- `/api/routes/tags.js`

Each following the pattern of other route files with proper controllers.

### 14. Environment Variables

Ensure all required environment variables are set:

```env
PORT=3003
NODE_ENV=production
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
STRICT_DEVICE_CHECK=false
```

### 15. Import Required Middleware in Index

**File: `/api/index.js`**

```javascript
// Import required middleware functions
const { 
    requireStudentAuth, 
    requireStudentInfo 
} = require('./middleware/auth');
```

## Testing Checklist

After applying these fixes, test:

1. ✓ Admin login/logout
2. ✓ Student registration/login/logout
3. ✓ Device fingerprint checking
4. ✓ Lesson listing and viewing
5. ✓ Result submission with rating update
6. ✓ Leaderboard functionality
7. ✓ Share lesson pages
8. ✓ Gallery images
9. ✓ Quiz functionality
10. ✓ Session management
11. ✓ File uploads
12. ✓ Student approval system
13. ✓ History page
14. ✓ Profile pages