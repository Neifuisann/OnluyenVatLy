// Store chart instances globally
let scoreChartInstance = null;
let cumulativeScoreChartInstance = null;
let passFailChartInstance = null;

// Sorting state for question statistics table
let sortState = {
    column: null,
    direction: 'asc' // 'asc' or 'desc'
};

// Track modal state
let currentModalQuestionIndex = null;
let currentModalQuestionText = null;
let currentModalOptionIndex = null;

// Helper to recursively extract string from object
function getOptionString(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        if (typeof val.text === 'string') return val.text;
        if (typeof val.content === 'string') return val.content;
        if (Array.isArray(val)) return val.map(getOptionString).join(' ');
        if (val.text && typeof val.text === 'object') return getOptionString(val.text);
        if (val.html && typeof val.html === 'string') return val.html.replace(/<[^>]*>?/gm, ''); // primitive strip HTML
        return JSON.stringify(val);
    }
    return String(val);
}

// Helper to format question text
function formatQuestionContent(q) {
    if (!q) return '';
    let text = q.question || '';
    // Replace [img src="..."] with actual img tags
    let formattedText = text.replace(/\[img\s+src=["']([^"']+)["']\]/gi, '<br><img src="$1" alt="Question" style="max-width: 100%; max-height: 200px; display: block; margin-top: 10px; border-radius: 6px;">');
    
    // Round decimal point values in pts notation (e.g., 0.47368421052631576 pts -> 0.47 pts)
    formattedText = formattedText.replace(/(\d+\.\d{3,})\s+pts/gi, (match, number) => {
        return parseFloat(number).toFixed(2) + ' pts';
    });
    
    // Add true/false options if present AND we don't have detailed sub-rows for them
    // Now that we have sub-rows (q.optionStats), we skip appending them into the main question text
    if (!q.optionStats && (q.type === 'true_false' || q.type === 'truefalse') && q.options && Array.isArray(q.options)) {
        let optionsHtml = '<ul style="margin-top: 10px; padding-left: 20px;">';
        q.options.forEach((opt, idx) => {
            const optText = getOptionString(opt);
            const letter = String.fromCharCode(65 + idx);
            optionsHtml += `<li><strong>${letter})</strong> ${optText}</li>`;
        });
        optionsHtml += '</ul>';
        formattedText += optionsHtml;
    }
    
    return formattedText;
}

async function loadStatistics() {
    try {
        // Extract lesson ID from URL path like /admin/lessons/1744597118421/statistics
        const pathParts = window.location.pathname.split('/');
        const lessonId = pathParts[pathParts.length - 2]; // Get the ID before 'statistics'
        window.currentLessonId = lessonId;
        const response = await fetch(`/api/lessons/${lessonId}/statistics`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle both old and new response structures
        const stats = data.statistics || data;
        
        // Ensure all required fields exist with defaults
        const defaultStats = {
            uniqueStudents: 0,
            totalAttempts: 0,
            averageScore: 0,
            lowScores: 0,
            highScores: 0,
            scoreDistribution: { labels: [], data: [] },
            topScorers: [],
            questionStats: [],
            views: 0,
            ...stats
        };
        
        // Store stats globally for export
        window.lessonStats = defaultStats;

        // Update basic stats - Add null checks
        safeUpdateText('total-students', defaultStats.uniqueStudents);
        safeUpdateText('total-attempts', defaultStats.totalAttempts);
        safeUpdateText('avg-score', (parseFloat(defaultStats.averageScore) || 0).toFixed(2));
        safeUpdateText('low-scores', defaultStats.lowScores);
        safeUpdateText('high-scores', defaultStats.highScores);

        // Update the stats card labels - Add null checks
        safeUpdateLabel('low-scores', 'Tỉ lệ đúng < 50%');
        safeUpdateLabel('high-scores', 'Tỉ lệ đúng ≥ 50%');

        // Modified score chart section
        const distributionLabels = Array.isArray(defaultStats.scoreDistribution?.labels)
            ? defaultStats.scoreDistribution.labels
            : [];
        const distributionData = Array.isArray(defaultStats.scoreDistribution?.data)
            ? defaultStats.scoreDistribution.data.map(value => Number(value) || 0)
            : [];
        const totalAttemptsCount = distributionData.reduce((sum, value) => sum + value, 0);

        const scoreChart = document.getElementById('scoreChart');
        if (scoreChart) {
            if (scoreChartInstance) {
                scoreChartInstance.destroy();
            }

            scoreChartInstance = new Chart(scoreChart, {
                type: 'bar',
                data: {
                    labels: distributionLabels,
                    datasets: [{
                        label: 'Số lượt làm bài',
                        data: distributionData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0
                            },
                            title: {
                                display: true,
                                text: 'Số lượt làm bài'
                            }
                        },
                        x: {
                            offset: false,
                            title: {
                                display: true,
                                text: 'Khoảng điểm'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Số lượt làm: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        const cumulativeScoreChart = document.getElementById('cumulativeScoreChart');
        if (cumulativeScoreChart) {
            if (cumulativeScoreChartInstance) {
                cumulativeScoreChartInstance.destroy();
            }

            const cumulativeData = [];
            let runningTotal = 0;
            distributionData.forEach(value => {
                runningTotal += value;
                const percent = totalAttemptsCount > 0
                    ? Math.round((runningTotal / totalAttemptsCount) * 1000) / 10
                    : 0;
                cumulativeData.push(percent);
            });

            cumulativeScoreChartInstance = new Chart(cumulativeScoreChart, {
                type: 'line',
                data: {
                    labels: distributionLabels,
                    datasets: [{
                        label: 'Tích lũy (%)',
                        data: cumulativeData,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        borderWidth: 2,
                        tension: 0.25,
                        fill: true,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            suggestedMax: 100,
                            ticks: {
                                callback: function(value) {
                                    return `${value}%`;
                                }
                            },
                            title: {
                                display: true,
                                text: 'Tỉ lệ tích lũy'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Khoảng điểm'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Tích lũy: ${context.raw}%`;
                                }
                            }
                        }
                    }
                }
            });
        }

        const passFailChart = document.getElementById('passFailChart');
        if (passFailChart) {
            if (passFailChartInstance) {
                passFailChartInstance.destroy();
            }

            const passCount = Number(defaultStats.highScores) || 0;
            const failCount = Number(defaultStats.lowScores) || 0;
            const passFailTotal = passCount + failCount;

            passFailChartInstance = new Chart(passFailChart, {
                type: 'doughnut',
                data: {
                    labels: ['Đạt (>=50%)', 'Chưa đạt (<50%)'],
                    datasets: [{
                        data: [passCount, failCount],
                        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(248, 113, 113, 0.7)'],
                        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(248, 113, 113, 1)'],
                        borderWidth: 1,
                        radius: '95%',
                        cutout: '60%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: 0
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw || 0;
                                    const percent = passFailTotal > 0
                                        ? Math.round((value / passFailTotal) * 1000) / 10
                                        : 0;
                                    return `${context.label}: ${value} lượt (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Add null checks for tables
        const questionTable = document.getElementById('question-stats');
        if (questionTable) {
            // Store original data for sorting
            window.questionStatsData = defaultStats.questionStats;
            
            // Render the table
            renderQuestionStatsTable(window.questionStatsData);
            
            // Add sorting event listeners
            addQuestionTableSortListeners();
        }

        const transcriptsTable = document.getElementById('transcripts');
        if (transcriptsTable) {
            const transcriptData = defaultStats.transcripts || defaultStats.topScorers || [];
            transcriptsTable.innerHTML = `
                <thead>
                    <tr>
                        <th>STT.</th>
                        <th>Tên</th>
                        <th>Ngày sinh</th>
                        <th>Điểm</th>
                    </tr>
                </thead>
                <tbody>
                    ${transcriptData.length > 0 ? transcriptData.map((t, idx) => `
                        <tr data-student-id="${t.studentId || ''}" data-student-name="${t.name || ''}" data-student-dob="${t.dob || ''}">
                            <td>${idx + 1}</td>
                            <td class="clickable-student">${t.name}</td>
                            <td>${t.dob || 'N/A'}</td>
                            <td>${(t.bestScore ?? t.score) || 0}%</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 20px; color: #888;">Chưa có dữ liệu</td>
                        </tr>
                    `}
                </tbody>
            `;

            addTranscriptRowHandlers();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        alert('Failed to load statistics. Please try again later.');
    }
}

function exportToExcel() {
    if (!window.lessonStats) return;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add Overview sheet
    const overviewData = [
        {
            'Chỉ số': 'Tổng số học sinh',
            'Giá trị': window.lessonStats.uniqueStudents
        },
        {
            'Chỉ số': 'Tổng số lần làm bài',
            'Giá trị': window.lessonStats.totalAttempts
        },
        {
            'Chỉ số': 'Điểm trung bình',
            'Giá trị': parseFloat(window.lessonStats.averageScore).toFixed(2)
        },
        {
            'Chỉ số': 'Tỉ lệ đúng < 50%',
            'Giá trị': window.lessonStats.lowScores
        },
        {
            'Chỉ số': 'Tỉ lệ đúng ≥ 50%',
            'Giá trị': window.lessonStats.highScores
        }
    ];
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');

    // Add Question Analysis sheet
    const questionData = [];
    window.lessonStats.questionStats.forEach((q, idx) => {
        let questionText = q.question;
        // Strip HTML for excel export if we manually injected some
        questionText = questionText.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '');
        // Round decimal point values in pts notation
        questionText = questionText.replace(/(\d+\.\d{3,})\s+pts/gi, (match, number) => {
            return parseFloat(number).toFixed(2) + ' pts';
        });
        
        // Push the main row
        questionData.push({
            'STT': idx + 1,
            'Câu hỏi': questionText,
            'Tổng số học sinh': q.totalStudents,
            'Đã làm': q.completed,
            'Chưa làm': q.notCompleted,
            'Làm đúng': q.correct,
            'Làm sai': q.incorrect,
            'Tỉ lệ làm đúng': `${q.completed > 0 ? (q.correct/q.completed * 100).toFixed(2) : "0.00"}%`
        });

        // Add sub-rows for optionStats
        if (q.optionStats && q.optionStats.length > 0) {
            q.optionStats.forEach((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                questionData.push({
                    'STT': '', // Blank to indicate it belongs to previous STT
                    'Câu hỏi': `  Ý ${letter}) ${opt.text}`,
                    'Tổng số học sinh': q.totalStudents,
                    'Đã làm': opt.completed,
                    'Chưa làm': opt.notCompleted,
                    'Làm đúng': opt.correct,
                    'Làm sai': opt.incorrect,
                    'Tỉ lệ làm đúng': `${opt.completed > 0 ? (opt.correct/opt.completed * 100).toFixed(2) : "0.00"}%`
                });
            });
        }
    });
    const questionSheet = XLSX.utils.json_to_sheet(questionData);
    XLSX.utils.book_append_sheet(workbook, questionSheet, 'Phân tích câu hỏi');

    // Add Student Transcripts sheet
    const transcriptData = (window.lessonStats.transcripts || window.lessonStats.topScorers || []).map((t, idx) => ({
        'STT': idx + 1,
        'Tên': t.name,
        'Ngày sinh': t.dob || 'N/A',
        'Điểm': `${(t.bestScore ?? t.score) || 0}%`
    }));
    const transcriptSheet = XLSX.utils.json_to_sheet(transcriptData);
    XLSX.utils.book_append_sheet(workbook, transcriptSheet, 'Bảng điểm');

    // Add Score Distribution sheet
    const distributionData = window.lessonStats.scoreDistribution.labels.map((label, idx) => ({
        'Khoảng điểm': label,
        'Số lượt làm bài': window.lessonStats.scoreDistribution.data[idx]
    }));
    const distributionSheet = XLSX.utils.json_to_sheet(distributionData);
    XLSX.utils.book_append_sheet(workbook, distributionSheet, 'Phân bố điểm');

    // Generate Excel file
    XLSX.writeFile(workbook, 'lesson_statistics.xlsx');
}

// Add helper functions to handle null elements
function safeUpdateText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value;
}

function safeUpdateLabel(elementId, text) {
    const parent = document.getElementById(elementId)?.parentElement;
    const label = parent?.querySelector('.stat-label');
    if (label) label.textContent = text;
}

// Render question stats table with current data
function renderQuestionStatsTable(data) {
    const questionTable = document.getElementById('question-stats');
    if (!questionTable) return;

    window.currentQuestionStatsTableData = data;
    
    const tbody = questionTable.querySelector('tbody');
    if (!tbody) return;
    
    let html = '';
    data.forEach((q, idx) => {
        html += `
        <tr>
            <td>${idx + 1}</td>
            <td>${formatQuestionContent(q)}</td>
            <td>${q.totalStudents}</td>
            <td>${q.completed}</td>
            <td>${q.notCompleted}</td>
            <td>${q.correct}</td>
            <td style="cursor: pointer; color: #3b82f6; text-decoration: underline;" class="incorrect-cell" data-question-index="${idx}" data-incorrect-count="${q.incorrect}">
                ${q.incorrect}
            </td>
            <td>${q.completed > 0 ? (q.correct/q.completed * 100).toFixed(2) : "0.00"}%</td>
        </tr>`;

        // Render sub-rows for true/false options if present
        if (q.optionStats && q.optionStats.length > 0) {
            q.optionStats.forEach((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                html += `
                <tr style="background-color: rgba(0,0,0,0.03);">
                    <td></td> <!-- Indent to show it belongs to the previous question -->
                    <td style="padding-left: 2rem;"><strong>Ý ${letter})</strong> ${opt.text}</td>
                    <td>${q.totalStudents}</td>
                    <td>${opt.completed}</td>
                    <td>${opt.notCompleted}</td>
                    <td>${opt.correct}</td>
                    <td style="cursor: pointer; color: #3b82f6; text-decoration: underline;" class="incorrect-cell-option" data-question-index="${idx}" data-option-index="${optIdx}" data-incorrect-count="${opt.incorrect}">
                        ${opt.incorrect}
                    </td>
                    <td>${opt.completed > 0 ? (opt.correct/opt.completed * 100).toFixed(2) : "0.00"}%</td>
                </tr>`;
            });
        }
    });

    tbody.innerHTML = html;
    
    // Add click handlers to incorrect cells
    addIncorrectCellClickHandlers(data);
    
    // Wait a moment for KaTeX to be fully loaded if deferred, then render math
    setTimeout(() => {
        if (window.renderMathInElement) {
            try {
                renderMathInElement(questionTable, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch (e) {
                console.error('KaTeX rendering error in statistics:', e);
            }
        }
    }, 500);
}

// Add sorting event listeners to question stats table headers
function addQuestionTableSortListeners() {
    const questionTable = document.getElementById('question-stats');
    if (!questionTable) return;
    
    const headers = questionTable.querySelectorAll('th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortQuestionStats(column);
        });
    });
}

// Sort question statistics by column
function sortQuestionStats(column) {
    // Get the current data from the DOM (either sorted or original)
    let dataToSort = JSON.parse(JSON.stringify(window.questionStatsData));
    
    // Determine sort direction
    if (sortState.column === column) {
        // Toggle direction if same column is clicked
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Default to ascending for new column
        sortState.column = column;
        sortState.direction = 'asc';
    }
    
    // Sort the data
    dataToSort.sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'totalStudents':
                aVal = a.totalStudents;
                bVal = b.totalStudents;
                break;
            case 'completed':
                aVal = a.completed;
                bVal = b.completed;
                break;
            case 'notCompleted':
                aVal = a.notCompleted;
                bVal = b.notCompleted;
                break;
            case 'correct':
                aVal = a.correct;
                bVal = b.correct;
                break;
            case 'incorrect':
                aVal = a.incorrect;
                bVal = b.incorrect;
                break;
            case 'correctRate':
                aVal = a.completed > 0 ? (a.correct / a.completed) : 0;
                bVal = b.completed > 0 ? (b.correct / b.completed) : 0;
                break;
            default:
                return 0;
        }
        
        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
    });
    
    // Update sort indicators on headers
    const questionTable = document.getElementById('question-stats');
    const headers = questionTable.querySelectorAll('th.sortable');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.getAttribute('data-column') === column) {
            header.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    // Re-render the table with sorted data
    renderQuestionStatsTable(dataToSort);
}

// Add click handlers to incorrect cells in the table
function addIncorrectCellClickHandlers(data) {
    const incorrectCells = document.querySelectorAll('.incorrect-cell');
    incorrectCells.forEach(cell => {
        cell.addEventListener('click', async function(e) {
            e.preventDefault();
            const questionIndex = parseInt(this.getAttribute('data-question-index'));
            const incorrectCount = parseInt(this.getAttribute('data-incorrect-count'));
            
            if (incorrectCount === 0) {
                alert('Không có học sinh nào làm sai câu hỏi này');
                return;
            }
            
            currentModalQuestionIndex = questionIndex;
            currentModalQuestionText = data[questionIndex].question;
            currentModalOptionIndex = null;
            await showWrongStudentsModal(questionIndex, incorrectCount, null);
        });
    });

    const incorrectOptionCells = document.querySelectorAll('.incorrect-cell-option');
    incorrectOptionCells.forEach(cell => {
        cell.addEventListener('click', async function(e) {
            e.preventDefault();
            const questionIndex = parseInt(this.getAttribute('data-question-index'));
            const optionIndex = parseInt(this.getAttribute('data-option-index'));
            const incorrectCount = parseInt(this.getAttribute('data-incorrect-count'));

            if (incorrectCount === 0) {
                alert('Không có học sinh nào làm sai câu hỏi này');
                return;
            }

            currentModalQuestionIndex = questionIndex;
            currentModalQuestionText = data[questionIndex].question;
            currentModalOptionIndex = optionIndex;
            await showWrongStudentsModal(questionIndex, incorrectCount, optionIndex);
        });
    });
}

// Show modal with list of students who got the question wrong
async function showWrongStudentsModal(questionIndex, incorrectCount, optionIndex = null) {
    const modal = document.getElementById('wrong-students-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) return;
    
    // Extract lesson ID from URL
    const pathParts = window.location.pathname.split('/');
    const lessonId = pathParts[pathParts.length - 2];
    
    // Show loading state
    const tbody = document.getElementById('wrong-students-table-body');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 30px; color: #999;">Đang tải...</td></tr>';
    
    // Show modal
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // Prevent event propagation
    modal.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Update question title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        const optionLabel = optionIndex !== null ? ` - Ý ${String.fromCharCode(65 + optionIndex)}` : '';
        modalTitle.textContent = `Học sinh làm sai câu hỏi${optionLabel} (${incorrectCount} học sinh)`;
    }
    
    // Show question preview
    const questionPreview = document.getElementById('question-preview');
    const questionTextElement = document.getElementById('question-text');
    if (questionPreview && questionTextElement && currentModalQuestionText) {
        let previewHtml = currentModalQuestionText;
        if (optionIndex !== null && window.currentQuestionStatsTableData && window.currentQuestionStatsTableData[questionIndex]) {
            const optionText = window.currentQuestionStatsTableData[questionIndex].optionStats?.[optionIndex]?.text;
            if (optionText) {
                previewHtml += `<br><strong>Ý ${String.fromCharCode(65 + optionIndex)})</strong> ${optionText}`;
            }
        }

        questionTextElement.innerHTML = previewHtml;
        questionPreview.style.display = 'block';
        
        // Render math in question preview
        setTimeout(() => {
            if (window.renderMathInElement) {
                try {
                    renderMathInElement(questionPreview, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error('KaTeX rendering error in modal:', e);
                }
            }
        }, 100);
    }
    
    try {
        // Fetch students who got the question wrong
        const optionParam = optionIndex !== null ? `&optionIndex=${optionIndex}` : '';
        const response = await fetch(`/api/lessons/${lessonId}/students-wrong-question?questionIndex=${questionIndex}${optionParam}`);
        
        if (!response.ok) {
            throw new Error('Failed to load students');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 30px; color: #e74c3c;">${data.message || 'Có lỗi khi tải dữ liệu'}</td></tr>`;
            return;
        }
        
        // Populate table with students
        if (data.students && data.students.length > 0) {
            let html = '';
            data.students.forEach((student, idx) => {
                html += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${student.name}</td>
                        <td>${student.dob}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 30px; color: #999;">Không có học sinh nào</td></tr>';
        }
        
        // Store students data for export
        window.wrongStudentsData = data.students;
        
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 30px; color: #e74c3c;">Lỗi: ${error.message}</td></tr>`;
    }
}

// Close modal
function closeWrongStudentsModal() {
    const modal = document.getElementById('wrong-students-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// Export wrong students list
function exportWrongStudentsList() {
    if (!window.wrongStudentsData || window.wrongStudentsData.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
    }
    
    if (!window.XLSX) {
        alert('Vui lòng tải lại trang để sử dụng tính năng này');
        return;
    }
    
    const exportData = window.wrongStudentsData.map((student, idx) => ({
        'STT': idx + 1,
        'Tên học sinh': student.name,
        'Ngày sinh': student.dob
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Học sinh làm sai');
    XLSX.writeFile(workbook, 'hoc-sinh-lam-sai.xlsx');
}

// Append student filter functionality for transcripts by student name
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    
    const studentFilterInput = document.getElementById('student-filter-input');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    if (studentFilterInput) {
        studentFilterInput.addEventListener('input', function() {
            filterTranscripts(this.value);
        });
    }
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            if (studentFilterInput) {
                studentFilterInput.value = '';
                filterTranscripts('');
            }
        });
    }
    
    // Add modal event listeners
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalFooterBtn = document.getElementById('close-modal-footer-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const exportWrongStudentsBtn = document.getElementById('export-wrong-students-btn');
    const closeAttemptsModalBtn = document.getElementById('close-attempts-modal-btn');
    const closeAttemptsModalFooterBtn = document.getElementById('close-attempts-modal-footer-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeWrongStudentsModal);
    }
    if (closeModalFooterBtn) {
        closeModalFooterBtn.addEventListener('click', closeWrongStudentsModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeWrongStudentsModal();
            closeStudentAttemptsModal();
        });
    }
    if (exportWrongStudentsBtn) {
        exportWrongStudentsBtn.addEventListener('click', exportWrongStudentsList);
    }
    if (closeAttemptsModalBtn) {
        closeAttemptsModalBtn.addEventListener('click', closeStudentAttemptsModal);
    }
    if (closeAttemptsModalFooterBtn) {
        closeAttemptsModalFooterBtn.addEventListener('click', closeStudentAttemptsModal);
    }
});

function addTranscriptRowHandlers() {
    const transcriptsTable = document.getElementById('transcripts');
    if (!transcriptsTable) return;

    const rows = transcriptsTable.querySelectorAll('tbody tr[data-student-id]');
    rows.forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        if (!studentId) return;

        row.style.cursor = 'pointer';
        row.addEventListener('click', async () => {
            const studentName = row.getAttribute('data-student-name') || 'Học sinh';
            const studentDob = row.getAttribute('data-student-dob') || '';
            await showStudentAttemptsModal(studentId, studentName, studentDob);
        });
    });
}

async function showStudentAttemptsModal(studentId, studentName, studentDob) {
    const modal = document.getElementById('student-attempts-modal');
    const overlay = document.getElementById('modal-overlay');
    const tbody = document.getElementById('student-attempts-table-body');
    const title = document.getElementById('student-attempts-title');

    if (!modal || !overlay || !tbody) return;

    if (title) {
        const dobText = studentDob ? ` - ${studentDob}` : '';
        title.textContent = `Lịch sử làm bài: ${studentName}${dobText}`;
    }

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;">Đang tải...</td></tr>';
    modal.style.display = 'block';
    overlay.style.display = 'block';

    try {
        const lessonId = window.currentLessonId || '';
        const response = await fetch(`/api/lessons/${lessonId}/student-attempts?studentId=${encodeURIComponent(studentId)}`);
        if (!response.ok) {
            throw new Error('Failed to load attempts');
        }

        const data = await response.json();
        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #e74c3c;">${data.message || 'Có lỗi khi tải dữ liệu'}</td></tr>`;
            return;
        }

        if (data.attempts && data.attempts.length > 0) {
            let html = '';
            data.attempts.forEach(attempt => {
                const timestamp = attempt.timestamp
                    ? new Date(attempt.timestamp).toLocaleString('vi-VN')
                    : 'N/A';
                const timeTakenMinutes = attempt.timeTaken ? Math.round(attempt.timeTaken / 60) : 0;
                const timeTakenText = attempt.timeTaken ? `${timeTakenMinutes} phút` : 'N/A';
                const scoreText = attempt.totalPoints > 0
                    ? `${attempt.scorePercentage}% (${attempt.score}/${attempt.totalPoints})`
                    : `${attempt.scorePercentage}%`;

                html += `
                    <tr>
                        <td>${attempt.attemptNumber}</td>
                        <td>${timestamp}</td>
                        <td>${scoreText}</td>
                        <td>${timeTakenText}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;">Không có dữ liệu</td></tr>';
        }
    } catch (error) {
        console.error('Error loading student attempts:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #e74c3c;">Lỗi: ${error.message}</td></tr>`;
    }
}

function closeStudentAttemptsModal() {
    const modal = document.getElementById('student-attempts-modal');
    const overlay = document.getElementById('modal-overlay');

    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function filterTranscripts(filterValue) {
    const transcriptsTable = document.getElementById('transcripts');
    if (!transcriptsTable) return;
    const tbody = transcriptsTable.querySelector('tbody');
    if (!tbody) return;
    const rows = tbody.getElementsByTagName('tr');
    for (let row of rows) {
        const nameCell = row.cells[1]; // Assuming Full Name is in the second column
        if (nameCell) {
            const nameText = nameCell.textContent.toLowerCase();
            if (nameText.includes(filterValue.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }
} 