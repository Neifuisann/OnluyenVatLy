const mockLesson = {
    id: "lesson1",
    questions: [
        { question: "Q1", points: 1 },
        { question: "Q2", points: 1 },
        { question: "Q3", points: 1 }
    ]
};

const mockResults = [
    {
        student_id: "s1",
        questions: [
            { question: "Q1", isCorrect: true },
            { question: "Q2", isCorrect: false },
            { question: "Q3", isCorrect: true }
        ]
    }, // All present, in order
    {
        student_id: "s2",
        questions: [
            { question: "Q2", isCorrect: true },
            { question: "Q1", isCorrect: true }
        ]
    }, // Shuffled, subset (Q3 missing)
    {
        student_id: "s3",
        questions: [
            { question: "Q3", correct: false },
            { question: "Q2", isCorrect: false }
        ]
    } // Shuffled, subset (Q1 missing), uses 'correct' field
];

function calculateStats(lesson, results) {
    const uniqueStudents = new Set(results.map(r => r.student_id)).size;
    const lessonQuestions = lesson.questions;

    const questionStats = lessonQuestions.map((lessonQ, index) => {
        let correct = 0;
        let incorrect = 0;
        let completedCount = 0;
        const lessonQText = (lessonQ.question || lessonQ.text || "").toString().trim();

        results?.forEach(result => {
            if (result.questions && Array.isArray(result.questions)) {
                // Find the matching question in this specific student result by text
                const studentQ = result.questions.find(sq => {
                    const sqText = (sq.question || sq.text || "").toString().trim();
                    return sqText === lessonQText;
                });

                if (studentQ) {
                    completedCount++;
                    // Support both property names
                    const isCorrectResult = studentQ.isCorrect !== undefined ? studentQ.isCorrect : studentQ.correct;
                    if (isCorrectResult) {
                        correct++;
                    } else {
                        incorrect++;
                    }
                }
            }
        });

        return {
            question: lessonQText || `Câu ${index + 1}`,
            totalStudents: uniqueStudents,
            completed: completedCount,
            notCompleted: Math.max(0, uniqueStudents - completedCount),
            correct,
            incorrect
        };
    });

    return questionStats;
}

const stats = calculateStats(mockLesson, mockResults);
console.log(JSON.stringify(stats, null, 2));

// Expected outcome:
// Q1: completed: 2 (s1, s2), correct: 2 (s1, s2)
// Q2: completed: 3 (s1, s2, s3), correct: 1 (s2)
// Q3: completed: 2 (s1, s3), correct: 1 (s1)
