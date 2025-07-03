const { supabase, supabaseAdmin } = require('../config/database');

class DatabaseService {
  // Lesson operations
  async getLessons(options = {}) {
    const { page = 1, limit = 10, search = '', sort = 'order' } = options;
    const startIndex = (page - 1) * limit;

    // Determine sorting parameters
    let orderAscending = true;
    let orderColumn = 'order';
    switch (sort) {
      case 'newest': orderColumn = 'created'; orderAscending = false; break;
      case 'oldest': orderColumn = 'created'; orderAscending = true; break;
      case 'az': orderColumn = 'title'; orderAscending = true; break;
      case 'za': orderColumn = 'title'; orderAscending = false; break;
      case 'newest-changed': orderColumn = 'lastUpdated'; orderAscending = false; break;
      case 'popular': orderColumn = 'views'; orderAscending = false; break;
      case 'order': orderColumn = 'order'; orderAscending = true; break;
    }

    let lessons = [];
    let total = 0;

    if (search) {
      // Use RPC for search
      let rpcQuery = supabase
        .rpc('search_lessons', { search_term: search })
        .order(orderColumn, { ascending: orderAscending })
        .range(startIndex, startIndex + limit - 1);

      const { data: rpcData, error: rpcError } = await rpcQuery;
      if (rpcError) throw rpcError;

      lessons = rpcData || [];

      // Get total count for search results
      const { count, error: countError } = await supabase
        .rpc('search_lessons', { search_term: search }, { count: 'exact', head: true });

      if (countError) {
        console.warn('Could not get total count for search results:', countError);
        total = lessons.length + startIndex;
      } else {
        total = count || 0;
      }
    } else {
      // Regular query without search
      let query = supabase
        .from('lessons')
        .select('id, title, color, created, lastUpdated, views, order, subject, grade, tags, description, purpose, pricing, lessonImage, randomQuestions', { count: 'exact' })
        .order(orderColumn, { ascending: orderAscending })
        .range(startIndex, startIndex + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      lessons = data || [];
      total = count || 0;
    }

    return { lessons, total, page, limit, search, sort };
  }

  async getLessonById(id) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Lesson not found');
      }
      throw error;
    }

    return lesson;
  }

  async createLesson(lessonData) {
    // Get next order number
    const { data: maxOrderLesson, error: maxOrderError } = await supabase
      .from('lessons')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = 0;
    if (maxOrderError && maxOrderError.code !== 'PGRST116') {
      throw maxOrderError;
    }
    if (maxOrderLesson && typeof maxOrderLesson.order === 'number') {
      nextOrder = maxOrderLesson.order + 1;
    }

    const now = new Date().toISOString();
    const newLessonData = {
      ...lessonData,
      id: lessonData.id || Date.now().toString(),
      views: 0,
      lastUpdated: now,
      created: now,
      order: nextOrder
    };

    const { data, error } = await supabase
      .from('lessons')
      .insert(newLessonData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLesson(id, updateData) {
    const updatedData = {
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    // Remove fields that shouldn't be updated
    delete updatedData.id;
    delete updatedData.created;

    const { data, error } = await supabase
      .from('lessons')
      .update(updatedData)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Lesson not found');
      }
      throw error;
    }

    return data;
  }

  async deleteLesson(id) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async updateLessonOrder(orderedLessons) {
    const updates = orderedLessons.map((lesson, index) => 
      supabase
        .from('lessons')
        .update({ order: index })
        .eq('id', lesson.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Errors updating lesson order:', errors);
      throw new Error('One or more lessons failed to update order.');
    }

    return true;
  }

  async incrementLessonViews(lessonId, currentViews) {
    const { error } = await supabase
      .from('lessons')
      .update({ views: currentViews + 1 })
      .eq('id', lessonId);

    if (error) throw error;
    return true;
  }

  // Student operations
  async getStudentByPhone(phoneNumber) {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, full_name, password_hash, is_approved, approved_device_id, approved_device_fingerprint, current_session_id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) throw error;
    return student;
  }

  async createStudent(studentData) {
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        ...studentData,
        is_approved: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return newStudent;
  }

  async updateStudent(id, updateData) {
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getStudents(options = {}) {
    const { limit = 100, approved = null } = options;
    
    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (approved !== null) {
      query = query.eq('is_approved', approved);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: students, error } = await query;
    if (error) throw error;
    
    // Map database columns to expected frontend properties
    const mappedStudents = (students || []).map(student => ({
      ...student,
      // Map approved_device_id to device_identifier for frontend compatibility
      device_identifier: student.approved_device_id,
      // Add device_status based on whether device is linked
      device_status: student.approved_device_id ? 'Liên kết' : 'Chưa liên kết',
      // Add session_status based on whether there's an active session
      session_status: student.current_session_id ? 'Hoạt động' : 'Không có phiên'
    }));
    
    return mappedStudents;
  }

  // Results operations
  async createResult(resultData) {
    // Debug: Log the exact data being sent to Supabase
    console.log('🔍 databaseService.createResult - Data being sent to Supabase:', JSON.stringify(resultData, null, 2));
    console.log('🔍 databaseService.createResult - Data keys:', Object.keys(resultData));

    const { data: savedResult, error } = await supabase
      .from('results')
      .insert(resultData)
      .select('id')
      .single();

    if (error) {
      console.log('🚨 databaseService.createResult - Supabase error:', error);
      throw error;
    }
    return savedResult;
  }

  async getResultById(id) {
    const { data: result, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Result not found');
      }
      throw error;
    }

    return result;
  }

  async deleteResult(id) {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getLessonResults(lessonId) {
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('lessonId', lessonId);

    if (error) throw error;
    return results || [];
  }

  // Rating operations
  async getRatings(limit = 100, offset = 0) {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        students ( full_name )
      `)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return ratings || [];
  }

  async getStudentRating(studentId) {
    const { data: rating, error } = await supabase
      .from('ratings')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return rating;
  }

  async upsertRating(ratingData) {
    const { error } = await supabase
      .from('ratings')
      .upsert(ratingData);

    if (error) throw error;
    return true;
  }

  async createRatingHistory(historyData) {
    const { error } = await supabase
      .from('rating_history')
      .insert(historyData);

    if (error) throw error;
    return true;
  }

  async getStudentRatingHistory(studentId, limit = 50) {
    const { data: history, error } = await supabase
      .from('rating_history')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return history || [];
  }

  async getStudentProfile(studentId) {
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, created_at')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) throw new Error('Student not found');

    // Get current rating
    const { data: rating, error: ratingError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('student_id', studentId)
      .maybeSingle();

    if (ratingError) {
      console.warn(`Could not fetch rating for student ${studentId}:`, ratingError.message);
    }

    // Get rating history with lesson titles
    const { data: ratingHistory, error: historyError } = await supabase
      .from('rating_history')
      .select(`
        *,
        lessons ( title )
      `)
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (historyError) {
      console.error(`Error fetching rating history for student ${studentId}:`, historyError);
    }

    // Format history
    const formattedHistory = ratingHistory?.map(item => ({
      ...item,
      lesson_title: item.lessons?.title
    })) || [];

    return {
      student,
      rating,
      ratingHistory: formattedHistory
    };
  }

  // Get student by ID
  async getStudentById(studentId) {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Student not found');
      }
      throw error;
    }
    
    // Map database columns to expected frontend properties for consistency
    if (student) {
      student.device_identifier = student.approved_device_id;
      student.device_status = student.approved_device_id ? 'Liên kết' : 'Chưa liên kết';
      student.session_status = student.current_session_id ? 'Hoạt động' : 'Không có phiên';
    }
    
    return student;
  }

  // Save raw lesson content (for session storage fallback)
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

  // Get raw lesson content
  async getRawLessonContent(id) {
    const { data, error } = await supabaseAdmin
      .from('temp_lesson_content')
      .select('content')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Content not found');
      }
      throw error;
    }
    return data;
  }

  // Get quiz data
  async getQuizData() {
    const { data: quizConfig, error } = await supabase
      .from('quizzes')
      .select('quiz_data')
      .eq('id', 'main_quiz')
      .maybeSingle();

    if (error) throw error;
    return quizConfig?.quiz_data || { questions: [] };
  }

  // Save quiz result
  async saveQuizResult(resultData) {
    const { data, error } = await supabase
      .from('quiz_results')
      .insert(resultData)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }

  // Save quiz data (admin)
  async saveQuizData(quizData) {
    const { error } = await supabase
      .from('quizzes')
      .upsert({
        id: 'main_quiz',
        quiz_data: quizData
      });

    if (error) throw error;
    return true;
  }

  // Get all unique tags from lessons
  async getAllUniqueTags() {
    const { data, error } = await supabase
      .from('lessons')
      .select('tags');

    if (error) throw error;

    const allTags = new Set();
    if (data) {
      data.forEach(lesson => {
        if (Array.isArray(lesson.tags)) {
          lesson.tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              allTags.add(tag.trim());
            }
          });
        }
      });
    }

    return Array.from(allTags).sort();
  }

  // ===== PROGRESS TRACKING METHODS =====

  // Get student's completed lessons
  async getStudentCompletedLessons(studentId) {
    try {
      if (!studentId) {
        console.warn('getStudentCompletedLessons called without studentId');
        return [];
      }

      const { data, error } = await supabase
        .from('results')
        .select('lessonId, score, totalPoints, timestamp')
        .eq('student_id', studentId)
        .gte('score', 1); // Only count lessons with at least 1 point as completed

      if (error) {
        console.error('Database error in getStudentCompletedLessons:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudentCompletedLessons:', error);
      throw error;
    }
  }

  // Get student's current streak
  async getStudentStreak(studentId) {
    const { data, error } = await supabase
      .from('results')
      .select('timestamp')
      .eq('student_id', studentId)
      .gte('score', 1)
      .order('timestamp', { ascending: false })
      .limit(30); // Get last 30 results to calculate streak

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    // Calculate consecutive days with activity
    let streak = 0;
    const today = new Date();
    const dates = data.map(result => new Date(result.timestamp).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

      if (i === 0 && daysDiff <= 1) {
        streak = 1;
      } else if (daysDiff === i + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Get last incomplete lesson for student
  async getLastIncompleteLesson(studentId) {
    // Get all lessons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, subject, grade')
      .order('order', { ascending: true });

    if (lessonsError) throw lessonsError;

    // Get completed lesson IDs
    const completedLessons = await this.getStudentCompletedLessons(studentId);
    const completedIds = completedLessons.map(lesson => lesson.lessonId);

    // Find first incomplete lesson
    const incompleteLesson = allLessons.find(lesson => !completedIds.includes(lesson.id));
    return incompleteLesson || null;
  }

  // Get student's mistakes count for review
  async getStudentMistakesCount(studentId) {
    const { data, error } = await supabase
      .from('results')
      .select('questions')
      .eq('student_id', studentId);

    if (error) throw error;

    let mistakesCount = 0;
    if (data) {
      data.forEach(result => {
        if (result.questions && Array.isArray(result.questions)) {
          result.questions.forEach(question => {
            if (question.isCorrect === false) {
              mistakesCount++;
            }
          });
        }
      });
    }

    return mistakesCount;
  }

  // Get progress by topic/subject
  async getProgressByTopic(studentId) {
    // Get all lessons grouped by subject
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, subject, grade, tags');

    if (lessonsError) throw lessonsError;

    // Get completed lessons
    const completedLessons = await this.getStudentCompletedLessons(studentId);
    const completedIds = completedLessons.map(lesson => lesson.lessonId);

    // Group by subject
    const progressByTopic = {};
    allLessons.forEach(lesson => {
      const topic = lesson.subject || 'Other';
      if (!progressByTopic[topic]) {
        progressByTopic[topic] = {
          total: 0,
          completed: 0,
          lessons: []
        };
      }

      progressByTopic[topic].total++;
      progressByTopic[topic].lessons.push({
        id: lesson.id,
        title: lesson.title,
        completed: completedIds.includes(lesson.id),
        grade: lesson.grade,
        tags: lesson.tags
      });

      if (completedIds.includes(lesson.id)) {
        progressByTopic[topic].completed++;
      }
    });

    // Calculate percentages
    Object.keys(progressByTopic).forEach(topic => {
      const data = progressByTopic[topic];
      data.percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    });

    return progressByTopic;
  }

  // Update student streak
  async updateStudentStreak(studentId) {
    const currentStreak = await this.getStudentStreak(studentId);

    // For now, we'll just return the calculated streak
    // In a more complex system, you might want to store this in a separate table
    return currentStreak;
  }

  // Get student learning statistics
  async getStudentLearningStats(studentId, period = 'week') {
    let dateFilter;
    const now = new Date();

    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date('2020-01-01'); // All time
    }

    const { data, error } = await supabase
      .from('results')
      .select('score, totalPoints, timestamp, lessonId')
      .eq('student_id', studentId)
      .gte('timestamp', dateFilter.toISOString());

    if (error) throw error;

    const stats = {
      totalLessons: data.length,
      totalScore: data.reduce((sum, result) => sum + result.score, 0),
      totalPossibleScore: data.reduce((sum, result) => sum + result.totalPoints, 0),
      averageScore: 0,
      accuracy: 0,
      activeDays: 0,
      lessonsPerDay: 0
    };

    if (data.length > 0) {
      stats.averageScore = Math.round(stats.totalScore / data.length * 100) / 100;
      stats.accuracy = stats.totalPossibleScore > 0 ?
        Math.round((stats.totalScore / stats.totalPossibleScore) * 100) : 0;

      // Calculate active days
      const uniqueDates = [...new Set(data.map(result =>
        new Date(result.timestamp).toDateString()
      ))];
      stats.activeDays = uniqueDates.length;
      stats.lessonsPerDay = stats.activeDays > 0 ?
        Math.round((stats.totalLessons / stats.activeDays) * 100) / 100 : 0;
    }

    return stats;
  }

  // Get recommended lessons for student
  async getRecommendedLessons(studentId, limit = 5) {
    // Get completed lessons
    const completedLessons = await this.getStudentCompletedLessons(studentId);
    const completedIds = completedLessons.map(lesson => lesson.lessonId);

    // Get student's preferred subjects/tags from completed lessons
    const { data: completedLessonDetails, error: completedError } = await supabase
      .from('lessons')
      .select('subject, grade, tags')
      .in('id', completedIds);

    if (completedError) throw completedError;

    // Analyze preferences
    const subjectCounts = {};
    const tagCounts = {};
    let averageGrade = 0;

    completedLessonDetails.forEach(lesson => {
      if (lesson.subject) {
        subjectCounts[lesson.subject] = (subjectCounts[lesson.subject] || 0) + 1;
      }
      if (lesson.grade) {
        averageGrade += parseInt(lesson.grade) || 0;
      }
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    averageGrade = completedLessonDetails.length > 0 ?
      Math.round(averageGrade / completedLessonDetails.length) : 10;

    // Get preferred subjects and tags
    const preferredSubjects = Object.keys(subjectCounts)
      .sort((a, b) => subjectCounts[b] - subjectCounts[a])
      .slice(0, 3);

    const preferredTags = Object.keys(tagCounts)
      .sort((a, b) => tagCounts[b] - tagCounts[a])
      .slice(0, 5);

    // Find recommended lessons
    let query = supabase
      .from('lessons')
      .select('id, title, subject, grade, tags, description, lessonImage')
      .not('id', 'in', `(${completedIds.join(',')})`)
      .limit(limit * 2); // Get more to filter

    const { data: allLessons, error: lessonsError } = await query;
    if (lessonsError) throw lessonsError;

    // Score lessons based on preferences
    const scoredLessons = allLessons.map(lesson => {
      let score = 0;

      // Subject match
      if (preferredSubjects.includes(lesson.subject)) {
        score += 3;
      }

      // Grade proximity
      const gradeMatch = Math.abs((parseInt(lesson.grade) || 10) - averageGrade);
      score += Math.max(0, 2 - gradeMatch);

      // Tag matches
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach(tag => {
          if (preferredTags.includes(tag)) {
            score += 1;
          }
        });
      }

      return { ...lesson, recommendationScore: score };
    });

    // Sort by score and return top recommendations
    return scoredLessons
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  // Get student's mistakes for review
  async getStudentMistakes(studentId, limit = 20) {
    const { data, error } = await supabase
      .from('results')
      .select('lessonId, questions, timestamp, lessons(title)')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(50); // Get recent results

    if (error) throw error;

    const mistakes = [];
    if (data) {
      data.forEach(result => {
        if (result.questions && Array.isArray(result.questions)) {
          result.questions.forEach(question => {
            if (question.isCorrect === false && mistakes.length < limit) {
              mistakes.push({
                lessonId: result.lessonId,
                lessonTitle: result.lessons?.title || 'Unknown Lesson',
                question: question.question,
                userAnswer: question.userAnswer,
                correctAnswer: question.correctAnswer,
                timestamp: result.timestamp,
                type: question.type || 'multiple_choice'
              });
            }
          });
        }
      });
    }

    return mistakes;
  }

  // Mark lesson as completed
  async markLessonCompleted(studentId, lessonId, score, timeTaken) {
    // This is typically handled by the results submission
    // But we can add additional completion tracking here if needed

    // For now, we'll just verify the lesson exists and return success
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return {
      success: true,
      lessonId,
      studentId,
      completedAt: new Date().toISOString()
    };
  }

  // Get student achievements (placeholder for future implementation)
  async getStudentAchievements(studentId) {
    // Get student stats to calculate achievements
    const completedLessons = await this.getStudentCompletedLessons(studentId);
    const streak = await this.getStudentStreak(studentId);
    const stats = await this.getStudentLearningStats(studentId, 'all');

    const achievements = [];

    // First lesson achievement
    if (completedLessons.length >= 1) {
      achievements.push({
        id: 'first_lesson',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        earned: true,
        earnedAt: completedLessons[0]?.timestamp
      });
    }

    // Streak achievements
    if (streak >= 3) {
      achievements.push({
        id: 'streak_3',
        title: 'Getting Started',
        description: 'Maintain a 3-day learning streak',
        icon: '🔥',
        earned: true,
        earnedAt: new Date().toISOString()
      });
    }

    if (streak >= 7) {
      achievements.push({
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '⚡',
        earned: true,
        earnedAt: new Date().toISOString()
      });
    }

    // Lesson count achievements
    if (completedLessons.length >= 10) {
      achievements.push({
        id: 'lessons_10',
        title: 'Dedicated Learner',
        description: 'Complete 10 lessons',
        icon: '📚',
        earned: true,
        earnedAt: completedLessons[9]?.timestamp
      });
    }

    if (completedLessons.length >= 50) {
      achievements.push({
        id: 'lessons_50',
        title: 'Knowledge Seeker',
        description: 'Complete 50 lessons',
        icon: '🏆',
        earned: true,
        earnedAt: completedLessons[49]?.timestamp
      });
    }

    // Accuracy achievement
    if (stats.accuracy >= 90 && completedLessons.length >= 5) {
      achievements.push({
        id: 'accuracy_90',
        title: 'Precision Master',
        description: 'Maintain 90% accuracy over 5+ lessons',
        icon: '🎯',
        earned: true,
        earnedAt: new Date().toISOString()
      });
    }

    return achievements;
  }

  // Delete student and all associated data
  async deleteStudentAndData(studentId) {
    console.warn(`ADMIN ACTION: Attempting to permanently delete student ${studentId} and all related data.`);

    try {
      // Delete in order to avoid foreign key constraints

      // 1. Delete rating history
      console.log(`Deleting rating history for student ${studentId}...`);
      const { error: historyError } = await supabaseAdmin
        .from('rating_history')
        .delete()
        .eq('student_id', studentId);
      if (historyError) {
        console.error('Error deleting rating history:', historyError);
      }

      // 2. Delete ratings
      console.log(`Deleting ratings for student ${studentId}...`);
      const { error: ratingError } = await supabaseAdmin
        .from('ratings')
        .delete()
        .eq('student_id', studentId);
      if (ratingError) {
        console.error('Error deleting ratings:', ratingError);
      }

      // 3. Delete quiz results
      console.log(`Deleting quiz results for student ${studentId}...`);
      const { error: quizResultsError } = await supabaseAdmin
        .from('quiz_results')
        .delete()
        .eq('student_id', studentId);
      if (quizResultsError) {
        console.error('Error deleting quiz results:', quizResultsError);
      }

      // 4. Delete lesson results
      console.log(`Deleting lesson results for student ${studentId}...`);
      const { error: resultsError } = await supabaseAdmin
        .from('results')
        .delete()
        .eq('student_id', studentId);
      if (resultsError) {
        console.error('Error deleting lesson results:', resultsError);
      }

      // 5. Finally, delete the student record
      console.log(`Deleting student record ${studentId}...`);
      const { error: studentDeleteError } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', studentId);

      if (studentDeleteError) {
        console.error('Critical error deleting student record:', studentDeleteError);
        throw new Error(`Failed to delete student record: ${studentDeleteError.message}`);
      }

      console.log(`Successfully deleted student ${studentId} and associated data.`);
      return true;

    } catch (error) {
      console.error(`Error processing delete request for student ${studentId}:`, error);
      throw error;
    }
  }

  // Update device information for student
  async updateDeviceInfo(studentId, deviceId, deviceFingerprint) {
    const updateData = {};

    if (deviceId) {
      // Check if this is a device_id (new system) or device_fingerprint (legacy)
      if (deviceId.length > 20) { // Assume device_id is longer
        updateData.approved_device_id = deviceId;
        updateData.device_registered_at = new Date().toISOString();
      } else {
        // Legacy fingerprint support
        updateData.approved_device_fingerprint = deviceId;
      }
    }

    if (deviceFingerprint) {
      updateData.approved_device_fingerprint = deviceFingerprint;
    }

    await this.updateStudent(studentId, updateData);
    return true;
  }

  // Unbind device from student
  async unbindDevice(studentId) {
    const { data, error } = await supabase
      .from('students')
      .update({
        approved_device_fingerprint: null,
        approved_device_id: null
      })
      .eq('id', studentId)
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Student not found');
      }
      throw error;
    }

    return true;
  }

  // Get lesson results with student info
  async getLessonResultsWithStudents(lessonId) {
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('lessonId', lessonId);

    if (error) throw error;
    return results || [];
  }

  // Get history with pagination
  async getHistoryWithPagination(options = {}) {
    const { page = 1, limit = 15, search = '', sort = 'time-desc' } = options;
    const startIndex = (page - 1) * limit;

    // Determine sorting
    let orderAscending = false;
    let orderColumn = 'timestamp';

    const sortMap = {
      'time-asc': { column: 'timestamp', ascending: true },
      'time-desc': { column: 'timestamp', ascending: false },
      'score-asc': { column: 'score', ascending: true },
      'score-desc': { column: 'score', ascending: false },
    };

    if (sortMap[sort]) {
      orderColumn = sortMap[sort].column;
      orderAscending = sortMap[sort].ascending;
    }

    let query = supabase
      .from('results')
      .select(`
        id,
        student_id,
        timestamp,
        score,
        totalPoints,
        lessonId,
        students!inner ( full_name ),
        lessons ( title )
      `, { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      query = query.or(`students.full_name.ilike.%${search}%,lessons.title.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(orderColumn, { ascending: orderAscending });

    // Apply pagination
    query = query.range(startIndex, startIndex + limit - 1);

    const { data: historyData, error, count: totalCount } = await query;

    if (error) throw error;

    const history = historyData.map(result => ({
      resultId: result.id,
      studentName: result.students?.full_name || 'Unknown Student',
      lessonTitle: result.lessons?.title || (result.lessonId === 'quiz_game' ? 'Trò chơi chinh phục' : 'Unknown Lesson'),
      submittedAt: result.timestamp,
      score: result.score,
      totalPoints: result.totalPoints,
      scorePercentage: result.totalPoints ? ((result.score / result.totalPoints) * 100).toFixed(1) + '%' : 'N/A'
    }));

    return {
      history,
      total: totalCount || 0,
      page,
      limit
    };
  }
}

module.exports = new DatabaseService();
