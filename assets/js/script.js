document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const config = {
        GITHUB_REPO: 'mdabidind/pdf_to_docs_word',
        GITHUB_TOKEN: 'github_pat_11BSRXTTI0q8fLUKzWdH6q_...', // Replace with your token
        MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
    };

    // DOM Elements
    const elements = {
        fileInput: document.getElementById('pdf-file'),
        selectBtn: document.getElementById('select-btn'),
        uploadArea: document.getElementById('upload-area'),
        processingArea: document.getElementById('processing-area'),
        resultArea: document.getElementById('result-area'),
        statusMessage: document.getElementById('status-message'),
        progressBar: document.getElementById('progress-bar'),
        statusDetails: document.getElementById('status-details')
    };

    // State
    let state = {
        isProcessing: false,
        currentFile: null
    };

    // Initialize
    function init() {
        setupEventListeners();
        addStatusLog('System ready', 'success');
    }

    // Event Listeners
    function setupEventListeners() {
        // Clean up any existing listeners
        elements.selectBtn.removeEventListener('click', handleSelectClick);
        elements.fileInput.removeEventListener('change', handleFileChange);
        elements.uploadArea.removeEventListener('drop', handleFileDrop);
        elements.uploadArea.removeEventListener('dragover', handleDragOver);
        elements.uploadArea.removeEventListener('dragleave', handleDragLeave);

        // Add new listeners
        elements.selectBtn.addEventListener('click', handleSelectClick);
        elements.fileInput.addEventListener('change', handleFileChange);
        elements.uploadArea.addEventListener('drop', handleFileDrop);
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    }

    // Event Handlers
    function handleSelectClick(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!state.isProcessing) {
            elements.fileInput.value = ''; // Reset to allow same file re-selection
            elements.fileInput.click();
        }
    }

    function handleFileChange(e) {
        if (e.target.files.length > 0 && !state.isProcessing) {
            processFile(e.target.files[0]);
        }
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.uploadArea.classList.remove('drag-over');
        if (!state.isProcessing && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (!state.isProcessing) elements.uploadArea.classList.add('drag-over');
    }

    function handleDragLeave() {
        elements.uploadArea.classList.remove('drag-over');
    }

    // Main Processing Function
    async function processFile(file) {
        try {
            // Validate file
            if (!validateFile(file)) return;

            // Update state and UI
            state.isProcessing = true;
            state.currentFile = file;
            showProcessingUI();
            addStatusLog(`Processing file: ${file.name}`);

            // Read file content
            const fileContent = await readFileAsBase64(file);
            addStatusLog('File read successfully');

            // Trigger conversion
            await triggerConversion(file.name, fileContent);
            
        } catch (error) {
            handleError(error);
        }
    }

    // File Validation
    function validateFile(file) {
        // Check if file exists
        if (!file) {
            showError('No file selected');
            return false;
        }

        // Check if PDF
        const isPDF = file.type === 'application/pdf' || 
                     file.name.toLowerCase().endsWith('.pdf');
        if (!isPDF) {
            showError('Please select a valid PDF file');
            return false;
        }

        // Check file size
        if (file.size > config.MAX_FILE_SIZE) {
            showError(`File size exceeds ${formatFileSize(config.MAX_FILE_SIZE)} limit`);
            return false;
        }

        return true;
    }

    // File Reading
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // GitHub Conversion Trigger
    async function triggerConversion(filename, content) {
        updateProgress(10, 'Starting upload...');
        
        try {
            const response = await fetch(`https://api.github.com/repos/${config.GITHUB_REPO}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.everest-preview+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'pdf_conversion',
                    client_payload: {
                        filename: filename,
                        content: content
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'GitHub API request failed');
            }

            updateProgress(30, 'Upload complete, converting...');
            addStatusLog('File uploaded to GitHub');

            // Poll for results
            const outputFilename = filename.replace('.pdf', '.docx');
            await pollForConversionResult(outputFilename);

        } catch (error) {
            throw error;
        }
    }

    // Poll for Conversion Result
    async function pollForConversionResult(outputFilename) {
        let attempts = 0;
        const maxAttempts = 20;
        const pollInterval = 3000;
        const downloadUrl = `https://github.com/${config.GITHUB_REPO}/releases/download/conversion/${outputFilename}`;

        while (attempts < maxAttempts) {
            attempts++;
            updateProgress(30 + (attempts * 3), `Converting (${attempts}/${maxAttempts})`);
            
            try {
                const exists = await checkFileExists(downloadUrl);
                if (exists) {
                    completeConversion(downloadUrl, outputFilename);
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                throw error;
            }
        }

        throw new Error('Conversion timeout - try again later');
    }

    // Check if file exists
    async function checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // UI Updates
    function showProcessingUI() {
        elements.uploadArea.style.display = 'none';
        elements.processingArea.style.display = 'block';
        elements.resultArea.style.display = 'none';
        elements.statusDetails.innerHTML = '';
    }

    function updateProgress(percent, message) {
        elements.progressBar.style.width = `${percent}%`;
        elements.statusMessage.textContent = message;
    }

    function addStatusLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `status-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        elements.statusDetails.appendChild(logEntry);
        elements.statusDetails.scrollTop = elements.statusDetails.scrollHeight;
    }

    function completeConversion(downloadUrl, filename) {
        state.isProcessing = false;
        updateProgress(100, 'Conversion complete!');
        
        elements.processingArea.style.display = 'none';
        elements.resultArea.style.display = 'block';
        
        elements.resultArea.innerHTML = `
            <i class="fas fa-check-circle fa-5x mb-3 text-success"></i>
            <h4>Conversion Successful!</h4>
            <p class="mb-4">${filename}</p>
            <a href="${downloadUrl}" class="btn btn-success btn-lg" download="${filename}">
                <i class="fas fa-download me-2"></i>Download Word File
            </a>
            <button class="btn btn-outline-primary mt-3" id="new-conversion-btn">
                <i class="fas fa-redo me-2"></i>Convert Another File
            </button>
        `;
        
        document.getElementById('new-conversion-btn').addEventListener('click', resetUI);
    }

    function handleError(error) {
        state.isProcessing = false;
        console.error('Conversion error:', error);
        
        elements.processingArea.style.display = 'none';
        elements.resultArea.style.display = 'block';
        
        elements.resultArea.innerHTML = `
            <i class="fas fa-times-circle fa-5x mb-3 text-danger"></i>
            <h4>Conversion Failed</h4>
            <p class="text-danger mb-3">${error.message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>Try Again
            </button>
        `;
    }

    function resetUI() {
        state.isProcessing = false;
        state.currentFile = null;
        elements.fileInput.value = '';
        
        elements.uploadArea.style.display = 'block';
        elements.processingArea.style.display = 'none';
        elements.resultArea.style.display = 'none';
    }

    // Helper function
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize the application
    init();
});
