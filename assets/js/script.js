document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('pdf-file');
    const selectBtn = document.getElementById('select-btn');
    const uploadArea = document.getElementById('upload-area');
    const processingArea = document.getElementById('processing-area');
    const resultArea = document.getElementById('result-area');
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const statusDetails = document.getElementById('status-details');
    const fileInfo = document.getElementById('file-info');
    const resultIcon = document.getElementById('result-icon');
    const resultMessage = document.getElementById('result-message');
    const resultContent = document.getElementById('result-content');
    const newConversionBtn = document.getElementById('new-conversion-btn');

    // GitHub Configuration
    const GITHUB_REPO = 'mdabidind/pdf_to_docs_word';
    const GITHUB_TOKEN = 'github_pat_11BSRXTTI0q8fLUKzWdH6q_...'; // Replace with your token
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // State variables
    let isProcessing = false;
    let currentFile = null;
    let conversionStartTime = null;

    // Initialize event listeners
    function initEventListeners() {
        // File selection via button
        selectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessing) fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0 && !isProcessing) {
                handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (!isProcessing) uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (!isProcessing && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // New conversion button
        newConversionBtn.addEventListener('click', resetConverter);
    }

    // Handle file selection
    async function handleFileSelect(file) {
        currentFile = file;
        
        // Validate file
        if (!validateFile(file)) return;

        // Start conversion process
        isProcessing = true;
        conversionStartTime = new Date();
        
        // Update UI
        showProcessingUI();
        addStatusLog(`File selected: ${file.name} (${formatFileSize(file.size)})`);
        addStatusLog('Starting conversion process...');

        try {
            // Convert file to base64
            addStatusLog('Encoding file for transfer...');
            const fileContent = await toBase64(file);
            
            // Trigger GitHub conversion
            addStatusLog('Sending to GitHub for processing...');
            await triggerConversion(file.name, fileContent);
            
        } catch (error) {
            showError(`Conversion failed: ${error.message}`);
            console.error('Conversion error:', error);
        }
    }

    // Validate file
    function validateFile(file) {
        // Check if PDF
        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPDF) {
            showError('Please select a valid PDF file');
            return false;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
            return false;
        }

        return true;
    }

    // Trigger GitHub conversion
    async function triggerConversion(filename, content) {
        updateProgress(10, 'Initializing conversion');
        
        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
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
                throw new Error(`GitHub API error: ${response.status}`);
            }

            addStatusLog('Conversion started on GitHub');
            updateProgress(20, 'Waiting for conversion...');
            
            // Start polling for results
            const outputFilename = filename.replace('.pdf', '.docx');
            await pollForConversionResult(outputFilename);
            
        } catch (error) {
            throw error;
        }
    }

    // Poll for conversion result
    async function pollForConversionResult(outputFilename) {
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts × 5s = 2.5 minutes timeout
        const pollInterval = 5000;
        const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/conversion/${outputFilename}`;

        const poll = async () => {
            attempts++;
            const progress = Math.min(90, 20 + (attempts * 2));
            updateProgress(progress, `Processing (attempt ${attempts}/${maxAttempts})`);
            addStatusLog(`Checking conversion status (Attempt ${attempts})`);

            try {
                // First try direct download
                const fileExists = await checkFileExists(downloadUrl);
                if (fileExists) {
                    addStatusLog('Conversion complete! File is ready');
                    completeConversion(downloadUrl, outputFilename);
                    return;
                }

                // Fallback: Check GitHub Actions status
                if (attempts % 3 === 0) {
                    addStatusLog('Checking GitHub Actions status...');
                    const runStatus = await checkWorkflowStatus();
                    
                    if (runStatus === 'failed') {
                        throw new Error('Conversion failed on GitHub server');
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    throw new Error('Conversion timeout - try again later');
                }
            } catch (error) {
                throw error;
            }
        };

        await poll();
    }

    // Check if file exists at URL
    async function checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Check GitHub Actions workflow status
    async function checkWorkflowStatus() {
        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to check workflow status');
            }
            
            const data = await response.json();
            return data.workflow_runs[0]?.conclusion || 'unknown';
            
        } catch (error) {
            console.error('Workflow status check failed:', error);
            return 'error';
        }
    }

    // Show processing UI
    function showProcessingUI() {
        uploadArea.style.display = 'none';
        processingArea.style.display = 'block';
        resultArea.style.display = 'none';
        
        // File info
        fileInfo.innerHTML = `
            <strong>File:</strong> ${currentFile.name}<br>
            <strong>Size:</strong> ${formatFileSize(currentFile.size)}
        `;
        
        // Reset status details
        statusDetails.innerHTML = '';
    }

    // Update progress bar
    function updateProgress(percent, message) {
        progressBar.style.width = `${percent}%`;
        statusMessage.textContent = message;
    }

    // Add status log entry
    function addStatusLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'status-entry';
        logEntry.innerHTML = `<span class="text-primary">[${timestamp}]</span> ${message}`;
        statusDetails.appendChild(logEntry);
        statusDetails.scrollTop = statusDetails.scrollHeight;
    }

    // Complete conversion
    function completeConversion(downloadUrl, filename) {
        isProcessing = false;
        updateProgress(100, 'Conversion complete!');
        
        // Calculate processing time
        const endTime = new Date();
        const processingTime = (endTime - conversionStartTime) / 1000;
        addStatusLog(`Total processing time: ${processingTime.toFixed(1)} seconds`);

        // Show result
        processingArea.style.display = 'none';
        resultArea.style.display = 'block';
        
        resultIcon.className = 'fas fa-check-circle fa-5x mb-3 text-success';
        resultMessage.textContent = 'Your Word file is ready!';
        resultContent.innerHTML = `
            <p class="mb-2">${filename}</p>
            <a href="${downloadUrl}" class="btn btn-success" download="${filename}">
                <i class="fas fa-download me-2"></i>Download Now
            </a>
        `;
    }

    // Show error
    function showError(message) {
        isProcessing = false;
        
        processingArea.style.display = 'none';
        resultArea.style.display = 'block';
        
        resultIcon.className = 'fas fa-times-circle fa-5x mb-3 text-danger';
        resultMessage.textContent = 'Conversion Failed';
        resultContent.innerHTML = `
            <p class="text-danger mb-3">${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>Try Again
            </button>
        `;
    }

    // Reset converter
    function resetConverter() {
        isProcessing = false;
        currentFile = null;
        fileInput.value = '';
        
        resultArea.style.display = 'none';
        processingArea.style.display = 'none';
        uploadArea.style.display = 'block';
    }

    // Helper: Convert file to base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // Helper: Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize the converter
    initEventListeners();
});
