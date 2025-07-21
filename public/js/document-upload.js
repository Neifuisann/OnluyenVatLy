// document-upload.js - Document upload and processing functionality

let selectedFile = null;
let isProcessing = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only show modal on new lesson creation (not edit)
    const path = window.location.pathname;
    const isNewLesson = path === '/admin/new' || path.endsWith('/admin/new');

    console.log('Page loaded, path:', path, 'isNewLesson:', isNewLesson);

    if (isNewLesson) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            showUploadModal();
        }, 500);
    }

    // Always initialize dropzone and file input for when modal is shown
    initializeDropzone();
    initializeFileInput();
});

// Show the initial upload popup
function showUploadModal() {
    const popup = document.getElementById('document-upload-popup');
    if (popup) {
        popup.style.display = 'flex';
        showChoiceScreen();
    }
}

// Show choice screen
function showChoiceScreen() {
    const choiceScreen = document.getElementById('choice-screen');
    const uploadScreen = document.getElementById('upload-screen');

    if (choiceScreen) choiceScreen.style.display = 'block';
    if (uploadScreen) uploadScreen.style.display = 'none';
}

// Show upload screen
function showUploadScreen() {
    const choiceScreen = document.getElementById('choice-screen');
    const uploadScreen = document.getElementById('upload-screen');

    if (choiceScreen) choiceScreen.style.display = 'none';
    if (uploadScreen) uploadScreen.style.display = 'block';
}

// Choose manual creation
function chooseManualCreation() {
    const popup = document.getElementById('document-upload-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Choose document upload
function chooseDocumentUpload() {
    showUploadScreen();
}

// Close upload popup
function closeUploadPopup() {
    const popup = document.getElementById('document-upload-popup');
    if (popup) {
        popup.style.display = 'none';
        resetUploadInterface();
    }
}

// Close upload interface (legacy function name for compatibility)
function closeUploadInterface() {
    closeUploadPopup();
}

// Initialize dropzone functionality
function initializeDropzone() {
    const dropzone = document.getElementById('upload-dropzone');
    if (!dropzone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
        }, false);
    });
    
    // Handle dropped files
    dropzone.addEventListener('drop', handleDrop, false);
}

// Initialize file input
function initializeFileInput() {
    // Try both old and new file input IDs for compatibility
    const fileInput = document.getElementById('file-input') || document.getElementById('document-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle selected file
function handleFile(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
        alert('Vui lòng chọn file PDF hoặc DOCX');
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
    }
    
    // Store selected file
    selectedFile = file;
    
    // Update UI
    showFilePreview(file);
    enableProcessButton();
}

// Show file preview
function showFilePreview(file) {
    const dropzoneContent = document.querySelector('.dropzone-content');
    const filePreview = document.getElementById('file-preview');
    const fileIcon = filePreview.querySelector('.file-icon');
    const fileName = filePreview.querySelector('.file-name');
    const fileSize = filePreview.querySelector('.file-size');
    
    // Hide dropzone content, show preview
    if (dropzoneContent) dropzoneContent.style.display = 'none';
    if (filePreview) filePreview.style.display = 'block';
    
    // Set file icon
    if (file.name.toLowerCase().endsWith('.pdf')) {
        fileIcon.className = 'file-icon fas fa-file-pdf';
    } else {
        fileIcon.className = 'file-icon fas fa-file-word';
    }
    
    // Set file details
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove selected file
function removeSelectedFile() {
    selectedFile = null;
    resetFileSelection();
}

// Reset file selection UI
function resetFileSelection() {
    const dropzoneContent = document.querySelector('.dropzone-content');
    const filePreview = document.getElementById('file-preview');
    const fileInput = document.getElementById('document-file-input');
    
    if (dropzoneContent) dropzoneContent.style.display = 'block';
    if (filePreview) filePreview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    disableProcessButton();
}

// Enable process button
function enableProcessButton() {
    // Try both old and new button IDs for compatibility
    const processBtn = document.getElementById('process-btn') || document.getElementById('process-document-btn');
    if (processBtn) {
        processBtn.disabled = false;
    }
}

// Remove selected file (new popup structure)
function removeFile() {
    selectedFile = null;

    const dropzoneContent = document.querySelector('.dropzone-content');
    const filePreview = document.getElementById('file-preview');
    const processBtn = document.getElementById('process-btn') || document.getElementById('process-document-btn');

    if (dropzoneContent) dropzoneContent.style.display = 'block';
    if (filePreview) filePreview.style.display = 'none';
    if (processBtn) processBtn.disabled = true;

    hideUploadError();
}

// Legacy function name for compatibility
function removeSelectedFile() {
    removeFile();
}

// Show upload error
function showUploadError(message) {
    const errorDiv = document.getElementById('upload-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        // Fallback to alert if error div not found
        alert(message);
    }
}

// Hide upload error
function hideUploadError() {
    const errorDiv = document.getElementById('upload-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Handle file selection from input (new popup structure)
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Disable process button
function disableProcessButton() {
    const processBtn = document.getElementById('process-document-btn');
    if (processBtn) {
        processBtn.disabled = true;
    }
}

// Process document
async function processDocument() {
    if (!selectedFile || isProcessing) return;
    
    isProcessing = true;
    showProcessingStatus();
    
    try {
        // Step 1: Upload file
        updateProcessingStep('upload', 'active');

        // Get CSRF token before making the request
        const csrfResponse = await fetch('/api/csrf-token');
        if (!csrfResponse.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const csrfData = await csrfResponse.json();

        const formData = new FormData();
        formData.append('document', selectedFile);

        const response = await fetch('/api/admin/upload-document', {
            method: 'POST',
            headers: {
                'x-csrf-token': csrfData.csrfToken
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Lỗi xử lý tài liệu');
        }
        
        updateProcessingStep('upload', 'completed');
        updateProcessingStep('extract', 'active');
        
        // The server will handle extraction and AI processing
        const result = await response.json();
        
        updateProcessingStep('extract', 'completed');
        updateProcessingStep('ai', 'active');
        
        // Simulate AI processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateProcessingStep('ai', 'completed');
        updateProcessingStep('complete', 'completed');
        
        // Success - insert content into editor
        if (result.formattedContent) {
            await insertContentIntoEditor(result.formattedContent);
            
            // Show success message
            updateProcessingMessage('Xử lý thành công! Đang chuyển đến trình soạn thảo...');
            
            setTimeout(() => {
                closeUploadInterface();
                // Optionally show a success toast
                showSuccessToast('Nội dung đã được tải vào trình soạn thảo');
            }, 1500);
        } else {
            throw new Error('Không nhận được nội dung đã định dạng');
        }
        
    } catch (error) {
        console.error('Error processing document:', error);
        showProcessingError(error.message);
    } finally {
        isProcessing = false;
    }
}

// Show processing status
function showProcessingStatus() {
    const uploadActions = document.querySelector('.upload-actions');
    const processingStatus = document.getElementById('processing-status');
    const dropzone = document.getElementById('upload-dropzone');
    const filePreview = document.getElementById('file-preview');

    if (uploadActions) uploadActions.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    if (filePreview) filePreview.style.display = 'none';
    if (processingStatus) processingStatus.style.display = 'block';

    // Reset all steps for new popup structure
    const steps = document.querySelectorAll('.processing-step');
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
        const statusIcon = step.querySelector('.step-status');
        if (statusIcon) statusIcon.textContent = '⏳';
    });
}

// Update processing step
function updateProcessingStep(stepId, status) {
    // Try both old and new step selectors
    let step = document.getElementById(`step-${stepId}`) || document.querySelector(`[data-step="${stepId}"]`);

    if (step) {
        step.classList.remove('active', 'completed');
        if (status) {
            step.classList.add(status);
        }

        // Update status icon for new popup structure
        const statusIcon = step.querySelector('.step-status');
        if (statusIcon) {
            if (status === 'active') {
                statusIcon.textContent = '⚡';
            } else if (status === 'completed') {
                statusIcon.textContent = '✅';
            } else {
                statusIcon.textContent = '⏳';
            }
        }
    }
}

// Update processing message
function updateProcessingMessage(message) {
    const messageDiv = document.querySelector('.processing-message');
    if (messageDiv) {
        messageDiv.textContent = message;
    }
}

// Update processing message
function updateProcessingMessage(message) {
    const messageElement = document.querySelector('.processing-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// Show processing error
function showProcessingError(errorMessage) {
    const processingStatus = document.getElementById('processing-status');
    if (processingStatus) {
        processingStatus.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                <h3 style="color: #dc3545; margin-bottom: 10px;">Lỗi xử lý tài liệu</h3>
                <p style="color: #666; margin-bottom: 20px;">${errorMessage}</p>
                <button class="retry-btn" onclick="resetUploadInterface()">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </div>
        `;
    }
}

// Insert content into CodeMirror editor
async function insertContentIntoEditor(content) {
    console.log('🔄 Starting editor integration...');

    // First, close the popup to ensure editor is visible
    closeUploadPopup();

    // Wait for popup to close and editor to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    let editor = null;
    let attempts = 0;
    const maxAttempts = 30;
    const waitTime = 500;

    while (!editor && attempts < maxAttempts) {
        attempts++;
        console.log(`🔍 Editor search attempt ${attempts}/${maxAttempts}`);

        // Strategy 1: Check window.editor (most reliable)
        if (window.editor && typeof window.editor.setValue === 'function') {
            editor = window.editor;
            console.log('✅ Found editor via window.editor');
            break;
        }

        // Strategy 2: Check CodeMirror instances
        if (window.CodeMirror && window.CodeMirror.instances && window.CodeMirror.instances.length > 0) {
            for (let instance of window.CodeMirror.instances) {
                if (instance && typeof instance.setValue === 'function') {
                    editor = instance;
                    console.log('✅ Found editor via CodeMirror.instances');
                    break;
                }
            }
            if (editor) break;
        }

        // Strategy 3: Look for CodeMirror DOM elements
        const cmElements = document.querySelectorAll('.CodeMirror');
        for (let cmElement of cmElements) {
            if (cmElement.CodeMirror && typeof cmElement.CodeMirror.setValue === 'function') {
                editor = cmElement.CodeMirror;
                console.log('✅ Found editor via DOM CodeMirror element');
                break;
            }
        }
        if (editor) break;

        // Strategy 4: Check textarea and its siblings
        const textarea = document.getElementById('lesson-content');
        if (textarea) {
            // Check next sibling
            if (textarea.nextSibling && textarea.nextSibling.CodeMirror) {
                editor = textarea.nextSibling.CodeMirror;
                console.log('✅ Found editor via textarea nextSibling');
                break;
            }

            // Check parent's children for CodeMirror
            const parent = textarea.parentElement;
            if (parent) {
                const siblings = parent.querySelectorAll('.CodeMirror');
                for (let sibling of siblings) {
                    if (sibling.CodeMirror && typeof sibling.CodeMirror.setValue === 'function') {
                        editor = sibling.CodeMirror;
                        console.log('✅ Found editor via parent CodeMirror search');
                        break;
                    }
                }
            }
        }
        if (editor) break;

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    if (editor && typeof editor.setValue === 'function') {
        try {
            console.log('📝 Inserting content into editor...');

            // Set the content
            editor.setValue(content);

            // Focus and position cursor
            editor.focus();
            editor.setCursor(editor.lineCount(), 0);

            // Trigger events after a short delay
            setTimeout(() => {
                try {
                    // Trigger change event
                    if (editor.trigger) {
                        editor.trigger('change');
                    }

                    // Fire CodeMirror change event
                    const doc = editor.getDoc();
                    if (doc && doc.setValue) {
                        doc.setValue(content);
                    }

                    // Try to trigger preview update
                    if (typeof parseQuizText === 'function' && typeof updatePreview === 'function') {
                        const parsed = parseQuizText(content);
                        updatePreview(parsed);
                        console.log('✅ Preview updated');
                    }

                    // Refresh the editor
                    editor.refresh();

                    console.log('✅ Content successfully inserted and editor updated');
                } catch (eventError) {
                    console.warn('⚠️ Some events failed but content was inserted:', eventError);
                }
            }, 300);

            // Expose editor globally if not already done
            if (!window.editor) {
                window.editor = editor;
                console.log('✅ Editor exposed globally');
            }

            return true;

        } catch (error) {
            console.error('❌ Error inserting content into editor:', error);

            // Fallback: try to set content in textarea directly
            try {
                const textarea = document.getElementById('lesson-content');
                if (textarea) {
                    textarea.value = content;
                    console.log('✅ Fallback: Content set in textarea');

                    // Trigger input event
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);

                    return true;
                }
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
            }

            throw new Error('Không thể chèn nội dung vào trình soạn thảo. Vui lòng thử sao chép nội dung thủ công.');
        }
    } else {
        console.error('❌ Editor not found after all attempts');
        console.log('🔍 Debug info:', {
            windowEditor: !!window.editor,
            windowEditorType: typeof window.editor,
            codeMirror: !!window.CodeMirror,
            codeMirrorInstances: window.CodeMirror ? window.CodeMirror.instances?.length : 'N/A',
            cmElements: document.querySelectorAll('.CodeMirror').length,
            textarea: !!document.getElementById('lesson-content'),
            currentPath: window.location.pathname
        });

        throw new Error('Không thể tìm thấy trình soạn thảo. Vui lòng tải lại trang và thử lại.');
    }
}

// Reset upload interface
function resetUploadInterface() {
    const uploadActions = document.querySelector('.upload-actions');
    const processingStatus = document.getElementById('processing-status');
    const dropzone = document.getElementById('upload-dropzone');

    if (uploadActions) uploadActions.style.display = 'flex';
    if (processingStatus) {
        processingStatus.style.display = 'none';
        // Reset all steps
        ['upload', 'extract', 'ai', 'complete'].forEach(stepId => {
            updateProcessingStep(stepId, '');
        });
    }
    if (dropzone) dropzone.style.display = 'block';

    resetFileSelection();
    isProcessing = false;
}

// Show success toast
function showSuccessToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    // Add styles
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
    `;

    // Add to page
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Close upload modal
function closeUploadModal() {
    const modal = document.getElementById('document-upload-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    // Reset file selection
    resetFileSelection();
}

// Hide upload error
function hideUploadError() {
    const uploadError = document.getElementById('upload-error');
    if (uploadError) {
        uploadError.style.display = 'none';
    }

    // Reset to file selection state
    resetFileSelection();
}

// Show upload error
function showUploadError(message) {
    const uploadError = document.getElementById('upload-error');
    const errorMessage = document.getElementById('error-message');

    if (uploadError && errorMessage) {
        errorMessage.textContent = message;
        uploadError.style.display = 'flex';
    }

    // Hide processing status
    const processingStatus = document.getElementById('processing-status');
    if (processingStatus) {
        processingStatus.style.display = 'none';
    }
}

// Update processing step status
function updateProcessingStep(stepId, status) {
    const step = document.getElementById(`${stepId}-step`);
    if (!step) return;

    // Remove all status classes
    step.classList.remove('active', 'complete', 'error');

    // Add new status class
    if (status === 'active') {
        step.classList.add('active');

        // Update icon to spinner
        const icon = step.querySelector('.step-status i');
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }
    } else if (status === 'completed' || status === 'complete') {
        step.classList.add('complete');

        // Update icon to check
        const icon = step.querySelector('.step-status i');
        if (icon) {
            icon.className = 'fas fa-check';
        }
    } else if (status === 'error') {
        step.classList.add('error');

        // Update icon to error
        const icon = step.querySelector('.step-status i');
        if (icon) {
            icon.className = 'fas fa-times';
        }
    }
}

// Update progress bar
function updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
}

// Show processing error
function showProcessingError(message) {
    // Hide processing status
    const processingStatus = document.getElementById('processing-status');
    if (processingStatus) {
        processingStatus.style.display = 'none';
    }

    // Show error
    showUploadError(message);

    // Reset processing state
    isProcessing = false;
}

// Update processing message
function updateProcessingMessage(message) {
    console.log('Processing update:', message);
    // This could be used to show additional status messages if needed
}

// Close upload interface
function closeUploadInterface() {
    closeUploadModal();
}
