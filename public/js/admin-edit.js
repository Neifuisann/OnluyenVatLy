// Helper function to clean existing point markings from question text
function cleanQuestionText(questionText) {
    if (!questionText) return '';
    // Remove existing point markings like [0.6 pts], [1 pts], etc.
    // Use a more precise regex that preserves spacing
    return questionText.replace(/\s*\[\s*[\d.]+\s*pts?\s*\]/gi, '').replace(/\s+/g, ' ').trim();
}

function generateInitialText(questions) {
    let text = '';
    if (!Array.isArray(questions)) return '';

    questions.forEach((q, index) => {
        // Clean existing point markings from question text before adding new ones
        const cleanedQuestionText = cleanQuestionText(q.question || '');
        text += `Câu ${index + 1}: ${cleanedQuestionText}\n`;

        if (q.points && q.points !== 1) {
             text += `[${q.points} pts]\n`;
        }
        
        if (q.type === 'abcd') {
            (q.options || []).forEach((opt, optIndex) => {
                const letter = String.fromCharCode(65 + optIndex);
                const isCorrect = String(q.correct).toLowerCase() === letter.toLowerCase();
                const prefix = isCorrect ? '*' : '';
                text += `${prefix}${letter}. ${opt.text || ''}\n`; 
            });
        } else if (q.type === 'number') {
            text += `Answer: ${q.correct || ''}\n`;
        } else if (q.type === 'truefalse') {
            (q.options || []).forEach((opt, optIndex) => {
                const letter = String.fromCharCode(65 + optIndex);
                const isCorrect = Array.isArray(q.correct) ? q.correct[optIndex] : false; 
                text += `${letter}. ${opt.text || ''} [${isCorrect ? 'True' : 'False'}]\n`; 
            });
        }
        text += '\n';
    });
    return text.trim();
}