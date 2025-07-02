// Add these methods to /api/services/databaseService.js

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