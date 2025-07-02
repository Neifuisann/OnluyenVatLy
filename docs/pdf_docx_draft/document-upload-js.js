// document-upload.js - Document upload and processing functionality

let selectedFile = null;
let isProcessing = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only show modal on new lesson creation (not edit)
    const pathParts = window.location.pathname.split('/');
    const isNewLesson = pathParts.includes('new') && !pathParts.includes('edit');
    
    if (isNewLesson) {
        showUploadModal();
        initializeDropzone();
        initializeFileInput();
    }
});

// Show the initial upload modal
function showUploadModal() {
    const modal = document.getElementById('document-upload-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Choose manual creation
function chooseManualCreation() {
    const modal = document.getElementById('document-upload-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Choose document upload
function chooseDocumentUpload() {
    const modal = document.getElementById('document-upload-modal');
    const uploadInterface = document.getElementById('document-upload-interface');
    
    if (modal) modal.style.display = 'none';
    if (uploadInterface) uploadInterface.style.display = 'flex';
}

// Close upload interface
function closeUploadInterface() {
    const uploadInterface = document.getElementById('document-upload-interface');
    if (uploadInterface) {
        uploadInterface.style.display = 'none';
        resetUploadInterface();
    }
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
    const fileInput = document.getElementById('document-file-input');
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
    const processBtn = document.getElementById('process-document-btn');
    if (processBtn) {
        processBtn.disabled = false;
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
        
        const formData = new FormData();
        formData.append('document', selectedFile);
        
        const response = await fetch('/api/admin/process-document', {
            method: 'POST',
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
    
    if (uploadActions) uploadActions.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    if (processingStatus) processingStatus.style.display = 'block';
}

// Update processing step
function updateProcessingStep(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    if (step) {
        step.classList.remove('active', 'completed');
        if (status) {
            step.classList.add(status);
        }
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
    // Wait for editor to be available
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!window.editor && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (window.editor) {
        // Set the content in the editor
        window.editor.setValue(content);
        
        // Trigger change event to update preview
        window.editor.trigger('change');
        
        // Save to ensure content is synced
        window.editor.save();
        
        console.log('Content successfully inserted into editor');
    } else {
        console.error('Editor not found after waiting');
        throw new Error('Không thể tìm thấy trình soạn thảo');
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .retry-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: background 0.3s;
    }
    
    .retry-btn:hover {
        background: #0056b3;
    }
    
    .error-container {
        text-align: center;
        padding: 20px;
    }
`;
document.head.appendChild(style);