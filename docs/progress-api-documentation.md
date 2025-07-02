# Progress Tracking API Documentation

This document describes the new progress tracking API endpoints for the educational platform.

## Base URL
All endpoints are prefixed with `/api/progress`

## Authentication
All progress endpoints require student authentication. Include the session cookie in requests.

## Endpoints

### 1. Get Student Progress Overview
**GET** `/api/progress/overview`

Returns overall progress statistics for the authenticated student.

**Response:**
```json
{
  "success": true,
  "progress": {
    "percentage": 75,
    "completedCount": 15,
    "totalLessons": 20,
    "streak": 5,
    "lastIncompleteLesson": {
      "id": "lesson_16",
      "title": "Advanced Physics",
      "subject": "Physics",
      "grade": "12"
    },
    "mistakesCount": 8
  }
}
```

### 2. Get Detailed Progress by Topic
**GET** `/api/progress/detailed`

Returns progress broken down by subject/topic.

**Response:**
```json
{
  "success": true,
  "progressByTopic": {
    "Physics": {
      "total": 10,
      "completed": 8,
      "percentage": 80,
      "lessons": [
        {
          "id": "lesson_1",
          "title": "Newton's Laws",
          "completed": true,
          "grade": "11",
          "tags": ["mechanics", "forces"]
        }
      ]
    },
    "Mathematics": {
      "total": 8,
      "completed": 5,
      "percentage": 63,
      "lessons": [...]
    }
  }
}
```

### 3. Get Learning Statistics
**GET** `/api/progress/stats?period=week`

Returns learning statistics for a specified period.

**Query Parameters:**
- `period` (optional): `week`, `month`, or `all` (default: `week`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalLessons": 12,
    "totalScore": 95,
    "totalPossibleScore": 120,
    "averageScore": 7.92,
    "accuracy": 79,
    "activeDays": 5,
    "lessonsPerDay": 2.4
  }
}
```

### 4. Get Recommended Lessons
**GET** `/api/progress/recommendations`

Returns personalized lesson recommendations based on student's progress and preferences.

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "lesson_21",
      "title": "Quantum Mechanics Basics",
      "subject": "Physics",
      "grade": "12",
      "tags": ["quantum", "advanced"],
      "description": "Introduction to quantum mechanics",
      "lessonImage": "quantum.jpg",
      "recommendationScore": 8
    }
  ]
}
```

### 5. Get Mistakes to Review
**GET** `/api/progress/mistakes?limit=20`

Returns student's incorrect answers for review.

**Query Parameters:**
- `limit` (optional): Number of mistakes to return (default: 20)

**Response:**
```json
{
  "success": true,
  "mistakes": [
    {
      "lessonId": "lesson_5",
      "lessonTitle": "Thermodynamics",
      "question": "What is the first law of thermodynamics?",
      "userAnswer": "Energy cannot be created",
      "correctAnswer": "Energy cannot be created or destroyed",
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "multiple_choice"
    }
  ]
}
```

### 6. Get Student Achievements
**GET** `/api/progress/achievements`

Returns earned achievements/badges for the student.

**Response:**
```json
{
  "success": true,
  "achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first lesson",
      "icon": "🎯",
      "earned": true,
      "earnedAt": "2024-01-10T09:15:00Z"
    },
    {
      "id": "streak_7",
      "title": "Week Warrior",
      "description": "Maintain a 7-day learning streak",
      "icon": "⚡",
      "earned": true,
      "earnedAt": "2024-01-17T14:20:00Z"
    }
  ]
}
```

### 7. Update Student Streak
**POST** `/api/progress/streak`

Manually updates/recalculates the student's learning streak.

**Response:**
```json
{
  "success": true,
  "streak": 6
}
```

### 8. Mark Lesson as Completed
**POST** `/api/progress/lesson/:lessonId/complete`

Marks a specific lesson as completed (typically called after result submission).

**Request Body:**
```json
{
  "score": 8,
  "timeTaken": 300
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson marked as completed"
}
```

## Enhanced Lesson Endpoints

The existing lesson endpoints have been enhanced to include progress information when a student is authenticated:

### Get All Lessons (Enhanced)
**GET** `/api/lessons`

Now includes completion status for authenticated students:

```json
{
  "success": true,
  "lessons": [
    {
      "id": "lesson_1",
      "title": "Newton's Laws",
      "subject": "Physics",
      "completed": true,
      "completedAt": "2024-01-10T09:15:00Z"
    }
  ]
}
```

### Get Lesson by ID (Enhanced)
**GET** `/api/lessons/:id`

Now includes detailed completion information:

```json
{
  "success": true,
  "lesson": {
    "id": "lesson_1",
    "title": "Newton's Laws",
    "content": {...},
    "completed": true,
    "completedAt": "2024-01-10T09:15:00Z",
    "lastScore": 8,
    "lastTotalPoints": 10
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `401`: Unauthorized (not logged in)
- `404`: Resource not found
- `500`: Internal server error

## Caching

Progress endpoints use different caching strategies:
- Overview and detailed progress: 5 minutes
- Statistics and achievements: 10 minutes
- Recommendations: 15 minutes
- Mistakes: 5 minutes

## Usage Examples

### JavaScript/Frontend Usage

```javascript
// Get student progress overview
async function getStudentProgress() {
  const response = await fetch('/api/progress/overview');
  const data = await response.json();
  
  if (data.success) {
    updateProgressUI(data.progress);
  }
}

// Get recommendations
async function getRecommendations() {
  const response = await fetch('/api/progress/recommendations');
  const data = await response.json();
  
  if (data.success) {
    displayRecommendations(data.recommendations);
  }
}

// Mark lesson as completed
async function markLessonCompleted(lessonId, score, timeTaken) {
  const response = await fetch(`/api/progress/lesson/${lessonId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ score, timeTaken })
  });
  
  const data = await response.json();
  return data.success;
}
```

## Integration Notes

1. **Automatic Progress Tracking**: Progress is automatically updated when students submit lesson results through the existing `/api/results` endpoint.

2. **Real-time Updates**: The frontend should refresh progress data after lesson completion to show updated statistics.

3. **Offline Support**: Consider caching progress data locally for offline viewing.

4. **Performance**: All endpoints are optimized with appropriate caching and database indexing.

5. **Scalability**: The system is designed to handle thousands of concurrent students efficiently.
