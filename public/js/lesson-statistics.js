// Store chart instance globally
let scoreChartInstance = null;

// Sorting state for question statistics table
let sortState = {
    column: null,
    direction: 'asc' // 'asc' or 'desc'
};

// Helper to format question text
function formatQuestionContent(text) {
    if (!text) return '';
    // Replace [img src="..."] with actual img tags
    return text.replace(/\[img\s+src=["']([^"']+)["']\]/gi, '<br><img src="$1" alt="Question" style="max-width: 100%; max-height: 200px; display: block; margin-top: 10px; border-radius: 6px;">');
}

async function loadStatistics() {
    try {
        // Extract lesson ID from URL path like /admin/lessons/1744597118421/statistics
        const pathParts = window.location.pathname.split('/');
        const lessonId = pathParts[pathParts.length - 2]; // Get the ID before 'statistics'
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
        const scoreChart = document.getElementById('scoreChart');
        if (scoreChart) {
            // Destroy existing chart if it exists
            if (scoreChartInstance) {
                scoreChartInstance.destroy();
            }

            // Create new chart
            scoreChartInstance = new Chart(scoreChart, {
                type: 'bar',
                data: {
                    labels: defaultStats.scoreDistribution.labels,
                    datasets: [{
                        label: 'Số lượt làm bài',
                        data: defaultStats.scoreDistribution.data,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
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
                            display: true,
                            text: 'Phân bố điểm'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Number of attempts: ${context.raw}`;
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
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${t.name}</td>
                            <td>${t.dob || 'N/A'}</td>
                            <td>${t.score}%</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 20px; color: #888;">Chưa có dữ liệu</td>
                        </tr>
                    `}
                </tbody>
            `;
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
    const questionData = window.lessonStats.questionStats.map((q, idx) => ({
        'STT': idx + 1,
        'Câu hỏi': q.question,
        'Tổng số học sinh': q.totalStudents,
        'Đã làm': q.completed,
        'Chưa làm': q.notCompleted,
        'Làm đúng': q.correct,
        'Làm sai': q.incorrect,
        'Tỉ lệ làm đúng': `${q.completed > 0 ? (q.correct/q.completed * 100).toFixed(2) : "0.00"}%`
    }));
    const questionSheet = XLSX.utils.json_to_sheet(questionData);
    XLSX.utils.book_append_sheet(workbook, questionSheet, 'Phân tích câu hỏi');

    // Add Student Transcripts sheet
    const transcriptData = (window.lessonStats.transcripts || window.lessonStats.topScorers || []).map((t, idx) => ({
        'STT': idx + 1,
        'Tên': t.name,
        'Ngày sinh': t.dob || 'N/A',
        'Điểm': `${t.score}%`
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
    
    const tbody = questionTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = data.map((q, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${formatQuestionContent(q.question)}</td>
            <td>${q.totalStudents}</td>
            <td>${q.completed}</td>
            <td>${q.notCompleted}</td>
            <td>${q.correct}</td>
            <td>${q.incorrect}</td>
            <td>${q.completed > 0 ? (q.correct/q.completed * 100).toFixed(2) : "0.00"}%</td>
        </tr>
    `).join('');
    
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
});

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