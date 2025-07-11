/**
 * AI Chatzone - AI-powered lesson creation assistant
 * Provides real-time AI assistance for lesson creation with search, edit, and add tools
 */

class AIChatzone {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.isProcessing = false;
        this.messages = [];

        // Tool mode tracking
        this.currentToolMode = 'urlContext'; // Default to URL Context mode
        this.googleSearchActive = false; // Track Google Search state
        this.lastActivatedTool = null; // Track the last activated tool

        // DOM elements
        this.bubble = null;
        this.window = null;
        this.messagesContainer = null;
        this.input = null;
        this.sendBtn = null;
        this.status = null;

        // Tool buttons
        this.toolButtons = {};
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            this.initializeElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            console.log('AI Chatzone initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Chatzone:', error);
        }
    }

    initializeElements() {
        // Get DOM elements
        this.bubble = document.getElementById('ai-chat-bubble');
        this.window = document.getElementById('ai-chat-window');
        this.messagesContainer = document.getElementById('ai-chat-messages');
        this.input = document.getElementById('ai-chat-input');
        this.sendBtn = document.getElementById('ai-chat-send');
        this.status = document.getElementById('ai-chat-status');



        // Tool buttons
        this.toolButtons = {
            search: document.getElementById('ai-tool-search'),
            edit: document.getElementById('ai-tool-edit'),
            add: document.getElementById('ai-tool-add'),
            analyze: document.getElementById('ai-tool-analyze'),
            google: document.getElementById('ai-tool-google'),
            toggle: document.getElementById('ai-tool-toggle')
        };

        // Tool mode state
        this.toolMode = 'url'; // 'url' or 'code'
        this.lastActivatedTool = null; // Track last activated tool

        // Validate elements
        if (!this.bubble || !this.window || !this.messagesContainer) {
            throw new Error('Required AI Chatzone elements not found');
        }
    }

    setupEventListeners() {
        // Bubble click to toggle
        if (this.bubble) {
            this.bubble.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
        }

        // Window controls
        document.getElementById('ai-chat-close')?.addEventListener('click', () => this.close());
        
        // Send message
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // Input events
        this.input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.input?.addEventListener('input', () => this.updateSendButton());
        
        // Tool buttons
        Object.entries(this.toolButtons).forEach(([tool, button]) => {
            button?.addEventListener('click', () => this.activateTool(tool));
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.window?.contains(e.target) && !this.bubble?.contains(e.target)) {
                this.close();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Alt + A: Toggle AI Chatzone (changed from Ctrl+Shift+A to avoid Chrome conflict)
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'a') {
                e.preventDefault();
                this.toggle();
            }

            // Escape: Close if open
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }

            // Tab navigation within chat window
            if (e.key === 'Tab' && this.isOpen) {
                this.handleTabNavigation(e);
            }

            // Quick tool shortcuts when chat is open
            if (this.isOpen && (e.ctrlKey || e.metaKey)) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.activateTool('search');
                        break;
                    case '2':
                        e.preventDefault();
                        this.activateTool('edit');
                        break;
                    case '3':
                        e.preventDefault();
                        this.activateTool('add');
                        break;
                    case '4':
                        e.preventDefault();
                        this.activateTool('analyze');
                        break;
                    case '5':
                        e.preventDefault();
                        this.activateTool('google');
                        break;
                    case '6':
                        e.preventDefault();
                        this.toggleToolMode();
                        break;
                }
            }
        });
    }

    handleTabNavigation(e) {
        const focusableElements = this.window?.querySelectorAll(
            'button, input, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab: backward navigation
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: forward navigation
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.isMinimized = false;
        this.window?.classList.remove('hidden', 'minimized');

        // Update ARIA attributes
        this.window?.setAttribute('aria-hidden', 'false');
        this.bubble?.setAttribute('aria-expanded', 'true');

        // Focus input
        setTimeout(() => {
            this.input?.focus();
        }, 300);

        // Update status
        this.updateStatus('Sẵn sàng');

        // Announce to screen readers
        this.announceToScreenReader('AI Chatzone đã mở');
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.isMinimized = false;
        this.window?.classList.add('hidden');

        // Update ARIA attributes
        this.window?.setAttribute('aria-hidden', 'true');
        this.bubble?.setAttribute('aria-expanded', 'false');

        // Clear input focus
        this.input?.blur();

        // Announce to screen readers
        this.announceToScreenReader('AI Chatzone đã đóng');
    }



    async sendMessage() {
        const message = this.input?.value?.trim();
        if (!message || this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.updateSendButton();
            this.updateStatus('Đang xử lý...', 'processing');

            // Add user message
            this.addMessage('user', message);

            // Clear input
            this.input.value = '';

            // Check for URL detection and tool mode suggestions
            const suggestion = this.checkForToolSuggestion(message);
            if (suggestion) {
                this.addSuggestionMessage(suggestion);
                this.isProcessing = false;
                this.updateSendButton();
                this.updateStatus('Sẵn sàng');
                return;
            }

            // Get current lesson content
            const lessonContent = this.getCurrentLessonContent();

            // Send to AI with streaming (response is handled in streaming)
            await this.callAI(message, lessonContent, true);

            this.updateStatus('Sẵn sàng');

            // Announce response to screen readers
            this.announceToScreenReader('AI đã trả lời');

        } catch (error) {
            console.error('Error sending message:', error);

            this.addMessage('ai', 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', null, 'error');
            this.updateStatus('Lỗi');

            // Announce error to screen readers
            this.announceToScreenReader('Có lỗi xảy ra khi gửi tin nhắn');

        } finally {
            this.isProcessing = false;
            this.updateSendButton();
        }
    }

    addMessage(type, content, actions = null, messageType = 'normal') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (messageType === 'error') {
            messageText.style.background = 'var(--error-color)';
            messageText.style.color = 'var(--text-inverse)';
        }
        
        // Handle markdown-like formatting
        const formattedContent = this.formatMessage(content);
        messageText.innerHTML = formattedContent;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        // Add actions if provided
        if (actions && actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            actions.forEach(action => {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'action-btn';
                actionBtn.innerHTML = `<i class="${action.icon}"></i> ${action.label}`;
                actionBtn.onclick = () => this.executeAction(action);
                actionsDiv.appendChild(actionBtn);
            });
            
            messageContent.appendChild(actionsDiv);
        }
        
        this.messagesContainer?.appendChild(messageDiv);
        this.scrollToBottom();

        // Render LaTeX in the message
        this.renderLatex(messageText);

        // Store message
        this.messages.push({
            type,
            content,
            actions,
            timestamp: new Date()
        });
    }

    formatMessage(content) {
        // Enhanced markdown formatting with copyable code blocks
        let formatted = content;

        // Handle code blocks first (```code```)
        formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
            const codeId = 'code-' + Math.random().toString(36).substring(2, 11);
            const trimmedCode = code.trim();
            return `<div class="code-block-container">
                <div class="code-block-header">
                    <span class="code-block-label">Code</span>
                    <button class="copy-code-btn" onclick="aiChatzone.copyToClipboard('${codeId}', this)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre class="code-block" id="${codeId}"><code>${this.escapeHtml(trimmedCode)}</code></pre>
            </div>`;
        });

        // Handle headers (## Header)
        formatted = formatted.replace(/^## (.*$)/gm, '<h3 class="message-header">$1</h3>');
        formatted = formatted.replace(/^# (.*$)/gm, '<h2 class="message-header">$1</h2>');

        // Handle bold and italic
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle inline code (but not if already in code blocks)
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Handle bullet points
        formatted = formatted.replace(/^- (.*$)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Handle line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    copyToClipboard(elementId, button) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Visual feedback
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('copied');
                }, 2000);
            });
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    updateSendButton() {
        if (!this.sendBtn || !this.input) return;
        
        const hasContent = this.input.value.trim().length > 0;
        const canSend = hasContent && !this.isProcessing;
        
        this.sendBtn.disabled = !canSend;
    }

    updateStatus(text, type = 'normal') {
        if (!this.status) return;
        
        this.status.className = `chat-status ${type}`;
        this.status.querySelector('.status-text').textContent = text;
    }

    getCurrentLessonContent() {
        // Get content from the main editor
        if (window.adminEditor && window.adminEditor.editor) {
            return {
                rawText: window.adminEditor.editor.getValue(),
                questions: window.adminEditor.currentQuestions || [],
                metadata: {
                    editingId: window.adminEditor.editingId,
                    isEditing: !!window.adminEditor.editingId
                }
            };
        }
        
        return {
            rawText: '',
            questions: [],
            metadata: {}
        };
    }

    async activateTool(toolName) {
        const toolActions = {
            search: () => this.activateSearchTool(),
            edit: () => this.activateEditTool(),
            add: () => this.activateAddTool(),
            analyze: () => this.activateAnalyzeTool()
        };
        
        const action = toolActions[toolName];
        if (action) {
            await action();
        }
    }

    async activateSearchTool() {
        const lessonContent = this.getCurrentLessonContent();

        if (!lessonContent.rawText.trim()) {
            this.addMessage('ai', '🔍 **Công cụ tìm kiếm**\n\nBài học hiện tại chưa có nội dung để tìm kiếm. Hãy thêm một số câu hỏi trước!');
            return;
        }

        // Analyze content and provide search suggestions
        const searchSuggestions = this.generateSearchSuggestions(lessonContent);

        let message = '🔍 **Công cụ tìm kiếm đã được kích hoạt**\n\nTôi có thể giúp bạn tìm kiếm:\n';
        message += '- Câu hỏi theo chủ đề cụ thể\n';
        message += '- Câu hỏi theo độ khó\n';
        message += '- Công thức và khái niệm\n';
        message += '- Lỗi cần sửa\n\n';

        if (searchSuggestions.length > 0) {
            message += '**Gợi ý tìm kiếm dựa trên nội dung hiện tại:**\n';
            searchSuggestions.forEach(suggestion => {
                message += `- ${suggestion}\n`;
            });
        }

        message += '\nHãy cho tôi biết bạn muốn tìm gì!';

        this.addMessage('ai', message);
        this.input?.focus();
    }

    generateSearchSuggestions(lessonContent) {
        const suggestions = [];
        const text = lessonContent.rawText.toLowerCase();

        // Physics topics detection
        const topics = [
            { keyword: 'động lực', suggestion: 'Tìm câu hỏi về động lực học' },
            { keyword: 'nhiệt', suggestion: 'Tìm câu hỏi về nhiệt học' },
            { keyword: 'điện', suggestion: 'Tìm câu hỏi về điện học' },
            { keyword: 'quang', suggestion: 'Tìm câu hỏi về quang học' },
            { keyword: 'sóng', suggestion: 'Tìm câu hỏi về sóng' },
            { keyword: 'nguyên tử', suggestion: 'Tìm câu hỏi về vật lý nguyên tử' }
        ];

        topics.forEach(topic => {
            if (text.includes(topic.keyword)) {
                suggestions.push(topic.suggestion);
            }
        });

        // Question difficulty detection
        if (lessonContent.questions && lessonContent.questions.length > 5) {
            suggestions.push('Tìm câu hỏi khó nhất');
            suggestions.push('Tìm câu hỏi dễ nhất');
        }

        // Formula detection
        if (text.includes('=') || text.includes('\\frac') || text.includes('\\sqrt')) {
            suggestions.push('Tìm tất cả công thức');
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    async activateEditTool() {
        const lessonContent = this.getCurrentLessonContent();

        if (!lessonContent.rawText.trim()) {
            this.addMessage('ai', '✏️ **Công cụ chỉnh sửa**\n\nBài học hiện tại chưa có nội dung để chỉnh sửa. Hãy thêm một số câu hỏi trước!');
            return;
        }

        // Analyze content for potential improvements
        const improvements = this.analyzeForImprovements(lessonContent);

        let message = '✏️ **Công cụ chỉnh sửa đã được kích hoạt**\n\nTôi có thể giúp bạn:\n';
        message += '- Cải thiện câu hỏi hiện có\n';
        message += '- Sửa lỗi ngữ pháp và chính tả\n';
        message += '- Điều chỉnh độ khó câu hỏi\n';
        message += '- Thêm giải thích chi tiết\n';
        message += '- Cải thiện cấu trúc câu hỏi\n\n';

        if (improvements.length > 0) {
            message += '**Tôi phát hiện một số điểm có thể cải thiện:**\n';
            improvements.forEach((improvement, index) => {
                message += `${index + 1}. ${improvement}\n`;
            });
            message += '\n';
        }

        message += 'Hãy cho tôi biết bạn muốn chỉnh sửa gì cụ thể!';

        const actions = improvements.length > 0 ? [{
            type: 'highlight_text',
            label: 'Đánh dấu vấn đề đầu tiên',
            icon: 'fas fa-search',
            data: { text: improvements[0].split(':')[0] }
        }] : [];

        this.addMessage('ai', message, actions);
        this.input?.focus();
    }

    analyzeForImprovements(lessonContent) {
        const improvements = [];
        const text = lessonContent.rawText;

        // Check for common issues
        if (text.includes('??')) {
            improvements.push('Có dấu hỏi chưa hoàn thành (??)');
        }

        if (text.includes('TODO') || text.includes('todo')) {
            improvements.push('Có ghi chú TODO chưa hoàn thành');
        }

        // Check for incomplete questions
        const lines = text.split('\n');
        lines.forEach((line) => {
            if (line.match(/^\d+\./) && !line.includes('?') && line.length < 20) {
                improvements.push(`Câu hỏi ${line.split('.')[0]} có vẻ chưa hoàn thành`);
            }
        });

        // Check for missing answer explanations
        if (lessonContent.questions && lessonContent.questions.length > 0) {
            const questionsWithoutExplanation = lessonContent.questions.filter(q =>
                !q.explanation || q.explanation.trim().length < 10
            );

            if (questionsWithoutExplanation.length > 0) {
                improvements.push(`${questionsWithoutExplanation.length} câu hỏi chưa có giải thích chi tiết`);
            }
        }

        // Check for very short or very long questions
        if (lessonContent.questions) {
            const shortQuestions = lessonContent.questions.filter(q =>
                q.question && q.question.length < 20
            );
            const longQuestions = lessonContent.questions.filter(q =>
                q.question && q.question.length > 200
            );

            if (shortQuestions.length > 0) {
                improvements.push(`${shortQuestions.length} câu hỏi quá ngắn, nên mở rộng thêm`);
            }

            if (longQuestions.length > 0) {
                improvements.push(`${longQuestions.length} câu hỏi quá dài, nên rút gọn`);
            }
        }

        return improvements.slice(0, 5); // Limit to 5 improvements
    }

    async activateAddTool() {
        const lessonContent = this.getCurrentLessonContent();

        // Analyze current content to suggest what to add
        const suggestions = this.generateAddSuggestions(lessonContent);

        let message = '➕ **Công cụ thêm nội dung đã được kích hoạt**\n\nTôi có thể tạo:\n';
        message += '- Câu hỏi mới theo chủ đề cụ thể\n';
        message += '- Câu hỏi với độ khó phù hợp\n';
        message += '- Biến thể của câu hỏi hiện có\n';
        message += '- Câu hỏi thực tế ứng dụng\n';
        message += '- Câu hỏi lý thuyết cơ bản\n\n';

        if (suggestions.length > 0) {
            message += '**Dựa trên nội dung hiện tại, tôi đề xuất thêm:**\n';
            suggestions.forEach((suggestion, index) => {
                message += `${index + 1}. ${suggestion}\n`;
            });
            message += '\n';
        }

        message += 'Hãy cho tôi biết bạn muốn thêm loại câu hỏi nào!';

        // Create quick action buttons for common additions
        const actions = [
            {
                type: 'insert_text',
                label: 'Thêm câu hỏi trắc nghiệm',
                icon: 'fas fa-list',
                data: {
                    text: '\n\n// Câu hỏi mới\n1. [Nhập câu hỏi ở đây]\nA. [Đáp án A]\nB. [Đáp án B]\nC. [Đáp án C]\nD. [Đáp án D]\nĐáp án: A\nGiải thích: [Nhập giải thích]',
                    position: 'end'
                }
            }
        ];

        if (lessonContent.questions && lessonContent.questions.length > 0) {
            actions.push({
                type: 'insert_text',
                label: 'Thêm biến thể câu hỏi cuối',
                icon: 'fas fa-copy',
                data: {
                    text: '\n\n// Biến thể câu hỏi\n[Sẽ được tạo dựa trên câu hỏi cuối cùng]',
                    position: 'end'
                }
            });
        }

        this.addMessage('ai', message, actions);
        this.input?.focus();
    }

    generateAddSuggestions(lessonContent) {
        const suggestions = [];
        const questionCount = lessonContent.questions ? lessonContent.questions.length : 0;

        // Basic suggestions based on question count
        if (questionCount === 0) {
            suggestions.push('Câu hỏi cơ bản để bắt đầu bài học');
            suggestions.push('Câu hỏi kiểm tra kiến thức nền tảng');
        } else if (questionCount < 5) {
            suggestions.push('Thêm câu hỏi để đạt số lượng tối thiểu (5-10 câu)');
            suggestions.push('Câu hỏi với độ khó tăng dần');
        } else if (questionCount >= 10) {
            suggestions.push('Câu hỏi thách thức cho học sinh giỏi');
            suggestions.push('Câu hỏi ứng dụng thực tế');
        }

        // Content-based suggestions
        if (lessonContent.rawText) {
            const text = lessonContent.rawText.toLowerCase();

            // Detect physics topics and suggest related questions
            const topicSuggestions = {
                'động lực': 'Câu hỏi về định luật Newton và ứng dụng',
                'nhiệt': 'Câu hỏi về truyền nhiệt và nhiệt dung',
                'điện': 'Câu hỏi về mạch điện và định luật Ohm',
                'quang': 'Câu hỏi về khúc xạ và phản xạ ánh sáng',
                'sóng': 'Câu hỏi về tần số và bước sóng'
            };

            Object.entries(topicSuggestions).forEach(([keyword, suggestion]) => {
                if (text.includes(keyword)) {
                    suggestions.push(suggestion);
                }
            });
        }

        // Difficulty balance suggestions
        if (lessonContent.questions) {
            const easyQuestions = lessonContent.questions.filter(q =>
                q.difficulty === 'easy' || (q.question && q.question.length < 50)
            ).length;

            const hardQuestions = lessonContent.questions.filter(q =>
                q.difficulty === 'hard' || (q.question && q.question.includes('tính') && q.question.includes('biết'))
            ).length;

            if (easyQuestions > hardQuestions * 2) {
                suggestions.push('Câu hỏi khó hơn để cân bằng độ khó');
            } else if (hardQuestions > easyQuestions * 2) {
                suggestions.push('Câu hỏi dễ hơn để học sinh làm quen');
            }
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    async activateAnalyzeTool() {
        const lessonContent = this.getCurrentLessonContent();
        
        if (!lessonContent.rawText.trim()) {
            this.addMessage('ai', '📊 **Phân tích bài học**\n\nBài học hiện tại chưa có nội dung. Hãy thêm một số câu hỏi để tôi có thể phân tích!');
            return;
        }
        
        this.updateStatus('Đang phân tích...', 'processing');
        
        try {
            const analysis = await this.analyzeLesson(lessonContent);
            this.addMessage('ai', analysis);
        } catch (error) {
            this.addMessage('ai', 'Không thể phân tích bài học. Vui lòng thử lại.', null, 'error');
        } finally {
            this.updateStatus('Sẵn sàng');
        }
    }

    async activateGoogleTool() {
        // Toggle Google Search state
        this.googleSearchActive = !this.googleSearchActive;

        // Update button styling
        const googleBtn = this.toolButtons.google;
        if (googleBtn) {
            if (this.googleSearchActive) {
                googleBtn.classList.add('active');
                this.addMessage('ai', '🔍 **Công cụ tìm kiếm Google đã được kích hoạt**\n\nTôi có thể tìm kiếm thông tin trên Google để hỗ trợ bạn:\n\n- Tìm kiếm tài liệu tham khảo về vật lý\n- Tìm ví dụ câu hỏi tương tự\n- Tìm kiếm công thức và định lý\n- Tìm hình ảnh minh họa\n- Tìm video giải thích\n\nHãy cho tôi biết bạn muốn tìm kiếm gì trên Google!');
            } else {
                googleBtn.classList.remove('active');
                this.addMessage('ai', '🔍 **Công cụ tìm kiếm Google đã được tắt**\n\nTôi sẽ không sử dụng Google Search trong các phản hồi tiếp theo.');
            }
        }

        this.input?.focus();
    }

    toggleToolMode() {
        // Toggle between urlContext and codeExecution
        this.currentToolMode = this.currentToolMode === 'urlContext' ? 'codeExecution' : 'urlContext';

        const toggleBtn = this.toolButtons.toggle;
        if (toggleBtn) {
            toggleBtn.setAttribute('data-mode', this.currentToolMode);

            const icon = toggleBtn.querySelector('i');
            const span = toggleBtn.querySelector('span');

            if (this.currentToolMode === 'urlContext') {
                toggleBtn.title = 'Chuyển đổi: URL Context / Code Execution - Phím tắt: Ctrl+6';
                if (icon) icon.className = 'fas fa-link';
                if (span) span.textContent = 'URL Context';
                this.addMessage('ai', '🔗 **Chế độ URL Context đã được kích hoạt**\n\nTôi có thể:\n- Đọc và phân tích nội dung từ các URL\n- Tóm tắt bài viết và tài liệu trực tuyến\n- Trích xuất thông tin từ trang web\n- Phân tích nội dung giáo dục\n\nHãy cung cấp URL hoặc yêu cầu phân tích nội dung web!');
            } else {
                toggleBtn.title = 'Chuyển đổi: Code Execution / URL Context - Phím tắt: Ctrl+6';
                if (icon) icon.className = 'fas fa-code';
                if (span) span.textContent = 'Code Execution';
                this.addMessage('ai', '💻 **Chế độ Code Execution đã được kích hoạt**\n\nTôi có thể:\n- Thực thi code Python để tính toán\n- Vẽ đồ thị và biểu đồ\n- Giải phương trình toán học\n- Tạo mô phỏng vật lý\n- Xử lý dữ liệu và thống kê\n\nHãy cho tôi biết bạn cần tính toán hoặc thực thi code gì!');
            }
        }

        this.input?.focus();
    }

    async callAI(message, lessonContent, useStreaming = true) {
        try {
            // Get CSRF token
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();

            if (useStreaming) {
                return await this.callAIStreaming(message, lessonContent, csrfData.csrfToken);
            } else {
                const response = await fetch('/api/ai/chat-assist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message,
                        lessonContent,
                        csrfToken: csrfData.csrfToken,
                        stream: false,
                        useGoogleSearch: this.isGoogleSearchActive(),
                        toolMode: this.currentToolMode === 'codeExecution' ? 'code' : 'url'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();
                return result;
            }

        } catch (error) {
            console.error('AI API call failed:', error);
            throw error;
        }
    }

    async callAIStreaming(message, lessonContent, csrfToken) {
        return new Promise((resolve, reject) => {
            let fullMessage = '';
            let streamingMessageElement = null;

            // Create streaming message element
            streamingMessageElement = this.addStreamingMessage();

            // Send the request data via POST to start streaming
            fetch('/api/ai/chat-assist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    lessonContent,
                    csrfToken: csrfToken,
                    stream: true,
                    useGoogleSearch: this.isGoogleSearchActive(),
                    toolMode: this.currentToolMode === 'codeExecution' ? 'code' : 'url'
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                const readStream = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            // Finalize the message
                            this.finalizeStreamingMessage(streamingMessageElement, fullMessage);
                            resolve({ message: fullMessage, actions: [] });
                            return;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));

                                    if (data.type === 'chunk') {
                                        fullMessage += data.content;
                                        this.updateStreamingMessage(streamingMessageElement, fullMessage);
                                    } else if (data.type === 'done') {
                                        this.finalizeStreamingMessage(streamingMessageElement, fullMessage);
                                        resolve({ message: fullMessage, actions: [] });
                                        return;
                                    } else if (data.type === 'error') {
                                        this.removeStreamingMessage(streamingMessageElement);
                                        reject(new Error(data.error));
                                        return;
                                    }
                                } catch (parseError) {
                                    // Ignore parse errors for incomplete JSON
                                }
                            }
                        }

                        readStream();
                    }).catch(error => {
                        this.removeStreamingMessage(streamingMessageElement);
                        reject(error);
                    });
                };

                readStream();
            }).catch(error => {
                this.removeStreamingMessage(streamingMessageElement);
                reject(error);
            });
        });
    }

    async analyzeLesson(lessonContent) {
        try {
            // Get CSRF token
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();

            const response = await fetch('/api/ai/analyze-lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonContent,
                    csrfToken: csrfData.csrfToken
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.analysis;

        } catch (error) {
            console.error('Lesson analysis failed:', error);
            throw error;
        }
    }

    async executeAction(action) {
        try {
            this.updateStatus('Đang thực hiện...', 'processing');

            switch (action.type) {
                case 'insert_text':
                    this.insertTextToEditor(action.data.text, action.data.position);
                    break;
                case 'replace_text':
                    this.replaceTextInEditor(action.data.oldText, action.data.newText);
                    break;
                case 'highlight_text':
                    this.highlightTextInEditor(action.data.text);
                    break;
                case 'scroll_to':
                    this.scrollToLineInEditor(action.data.line);
                    break;
                default:
                    console.warn('Unknown action type:', action.type);
            }

            this.addMessage('ai', `✅ Đã thực hiện: ${action.label}`);
            this.updateStatus('Sẵn sàng');

        } catch (error) {
            console.error('Action execution failed:', error);
            this.addMessage('ai', `❌ Không thể thực hiện: ${action.label}`, null, 'error');
            this.updateStatus('Lỗi');
        }
    }

    insertTextToEditor(text, position = 'end') {
        if (!window.adminEditor || !window.adminEditor.editor) {
            throw new Error('Editor not available');
        }

        const editor = window.adminEditor.editor;
        const doc = editor.getDoc();

        if (position === 'end') {
            const lastLine = doc.lastLine();
            const lastLineLength = doc.getLine(lastLine).length;
            doc.replaceRange('\n' + text, { line: lastLine, ch: lastLineLength });
        } else if (position === 'cursor') {
            doc.replaceSelection(text);
        } else if (typeof position === 'object' && position.line !== undefined) {
            doc.replaceRange(text, position);
        }

        // Trigger content change
        window.adminEditor.handleContentChange();
    }

    replaceTextInEditor(oldText, newText) {
        if (!window.adminEditor || !window.adminEditor.editor) {
            throw new Error('Editor not available');
        }

        const editor = window.adminEditor.editor;
        const doc = editor.getDoc();
        const content = doc.getValue();

        if (content.includes(oldText)) {
            const newContent = content.replace(oldText, newText);
            doc.setValue(newContent);
            window.adminEditor.handleContentChange();
        } else {
            throw new Error('Text not found in editor');
        }
    }

    highlightTextInEditor(text) {
        if (!window.adminEditor || !window.adminEditor.editor) {
            throw new Error('Editor not available');
        }

        const editor = window.adminEditor.editor;
        const searchCursor = editor.getSearchCursor(text);

        if (searchCursor.findNext()) {
            editor.setSelection(searchCursor.from(), searchCursor.to());
            editor.scrollIntoView(searchCursor.from());
        }
    }

    scrollToLineInEditor(lineNumber) {
        if (!window.adminEditor || !window.adminEditor.editor) {
            throw new Error('Editor not available');
        }

        const editor = window.adminEditor.editor;
        const line = Math.max(0, lineNumber - 1); // Convert to 0-based

        editor.scrollIntoView({ line, ch: 0 });
        editor.setCursor(line, 0);
    }

    announceToScreenReader(message) {
        // Create a temporary element for screen reader announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    checkForToolSuggestion(message) {
        // Check if message contains URLs and code execution tool is active
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const hasUrls = urlRegex.test(message);

        if (hasUrls && this.currentToolMode === 'codeExecution') {
            return {
                type: 'tool-switch',
                from: 'Code Execution',
                to: 'URL Context',
                message: 'Tôi phát hiện bạn có URL trong tin nhắn. Bạn có muốn chuyển sang chế độ URL Context để phân tích nội dung web không?',
                action: 'switch-to-url-context'
            };
        }

        return null;
    }

    addSuggestionMessage(suggestion) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message suggestion-message';

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <div class="suggestion-content">
                        <p>${suggestion.message}</p>
                        <div class="suggestion-buttons">
                            <button class="suggestion-btn yes-btn" data-action="${suggestion.action}">
                                <i class="fas fa-check"></i> Có
                            </button>
                            <button class="suggestion-btn no-btn" data-action="dismiss">
                                <i class="fas fa-times"></i> Không
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer?.appendChild(messageElement);
        this.scrollToBottom();

        // Add event listeners to suggestion buttons
        const yesBtn = messageElement.querySelector('.yes-btn');
        const noBtn = messageElement.querySelector('.no-btn');

        yesBtn?.addEventListener('click', () => {
            if (suggestion.action === 'switch-to-url-context') {
                this.activateTool('toggle'); // Switch to URL context
                this.removeSuggestionMessage(messageElement);
                this.addMessage('ai', '✅ Đã chuyển sang chế độ URL Context. Bạn có thể gửi lại tin nhắn với URL để tôi phân tích nội dung.');
            }
        });

        noBtn?.addEventListener('click', () => {
            this.removeSuggestionMessage(messageElement);
        });
    }

    removeSuggestionMessage(messageElement) {
        messageElement.style.opacity = '0.5';
        messageElement.style.pointerEvents = 'none';
        const suggestionContent = messageElement.querySelector('.suggestion-content');
        if (suggestionContent) {
            suggestionContent.innerHTML = '<p><em>Đã bỏ qua gợi ý</em></p>';
        }
    }

    // Add visual feedback for tool activation
    activateToolVisually(toolName) {
        // Remove active class from all tools except Google Search (which has persistent state)
        Object.entries(this.toolButtons).forEach(([name, btn]) => {
            if (name !== 'google') {
                btn?.classList.remove('active');
            }
        });

        // Add active class to current tool (except Google which handles its own state)
        if (toolName !== 'google') {
            const toolBtn = this.toolButtons[toolName];
            if (toolBtn) {
                toolBtn.classList.add('active');

                // Remove active class after 3 seconds
                setTimeout(() => {
                    toolBtn.classList.remove('active');
                }, 3000);
            }
        }
    }

    // Enhanced tool activation with visual feedback
    async activateTool(toolName) {
        this.lastActivatedTool = toolName; // Track the activated tool
        this.activateToolVisually(toolName);

        const toolActions = {
            search: () => this.activateSearchTool(),
            edit: () => this.activateEditTool(),
            add: () => this.activateAddTool(),
            analyze: () => this.activateAnalyzeTool(),
            google: () => this.activateGoogleTool(),
            toggle: () => this.toggleToolMode()
        };

        const action = toolActions[toolName];
        if (action) {
            await action();
        }
    }

    // Add loading state for messages
    showMessageLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message ai-message message-loading';
        loadingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <span class="message-loading">AI đang suy nghĩ...</span>
                </div>
            </div>
        `;
        loadingDiv.id = 'ai-loading-message';

        this.messagesContainer?.appendChild(loadingDiv);
        this.scrollToBottom();

        return loadingDiv;
    }

    hideMessageLoading() {
        const loadingMessage = document.getElementById('ai-loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    // Streaming message methods
    addStreamingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai-message streaming-message';
        messageDiv.id = 'ai-streaming-message';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text streaming-text';
        messageText.innerHTML = '<span class="typing-indicator">AI đang trả lời...</span>';

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.messagesContainer?.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    updateStreamingMessage(messageElement, content) {
        const messageText = messageElement.querySelector('.message-text');
        if (messageText) {
            messageText.innerHTML = this.formatMessage(content);
            this.scrollToBottom();

            // Render LaTeX if available
            this.renderLatex(messageText);
        }
    }

    finalizeStreamingMessage(messageElement, content) {
        const messageText = messageElement.querySelector('.message-text');
        if (messageText) {
            messageText.innerHTML = this.formatMessage(content);
            messageElement.classList.remove('streaming-message');
            messageText.classList.remove('streaming-text'); // Fix pulsing animation

            // Render LaTeX if available
            this.renderLatex(messageText);
        }
    }

    removeStreamingMessage(messageElement) {
        if (messageElement && messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }

    renderLatex(element) {
        // Render LaTeX using KaTeX if available
        if (window.renderMathInElement) {
            try {
                window.renderMathInElement(element, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false},
                        {left: "\\[", right: "\\]", display: true},
                        {left: "\\(", right: "\\)", display: false}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.warn('LaTeX rendering failed:', error);
            }
        }
    }

    isGoogleSearchActive() {
        return this.googleSearchActive;
    }
}

// Initialize AI Chatzone
window.aiChatzone = new AIChatzone();
