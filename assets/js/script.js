document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('pdf-file');
    const selectBtn = document.getElementById('select-btn');
    const uploadArea = document.getElementById('upload-area');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress-bar');
    const cancelBtn = document.getElementById('cancel-btn');

    // GitHub Configuration
    const GITHUB_REPO = 'mdabidind/pdf_to_docs_word';
    const GITHUB_TOKEN = 'github_pat_11BSRXTTI0q8fLUKzWdH6q_...'; // Replace with your token

    // State management
    let isProcessing = false;
    let currentFile = null;

    // Event Listeners
    selectBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!isProcessing) fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);
    
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
        if (!isProcessing && e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    });

    cancelBtn.addEventListener('click', function() {
        resetUI();
    });

    // File Selection Handler
    async function handleFileSelect(e) {
        if (isProcessing) return;
        
        const file = e.target.files[0];
        if (!file) return;

        // File Validation
        if (!validateFile(file)) return;

        currentFile = file;
        showProcessingUI();

        try {
            const fileContent = await toBase64(file);
            await triggerConversion(file.name, fileContent);
        } catch (error) {
            showError(`Conversion failed: ${error.message}`);
            console.error('Conversion error:', error);
        }
    }

    // File Validation
    function validateFile(file) {
        // Check if PDF
        const isPDF = file.type === 'application/pdf' || 
                      file.name.toLowerCase().endsWith('.pdf');
        
        if (!isPDF) {
            showError('Please select a valid PDF file');
            return false;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size exceeds 5MB limit');
            return false;
        }

        return true;
    }

    // Trigger GitHub Conversion
    async function triggerConversion(filename, content) {
        statusText.textContent = 'Starting conversion...';
        progressBar.querySelector('.progress-bar').style.width = '10%';

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

        // Start polling for results
        await pollForConversionResult(filename.replace('.pdf', '.docx'));
    }

    // Poll for Conversion Result
    async function pollForConversionResult(outputFilename) {
        let attempts = 0;
        const maxAttempts = 20;
        const pollInterval = 5000;

        const poll = async () => {
            attempts++;
            const progress = Math.min(90, 10 + (attempts * 4));
            progressBar.querySelector('.progress-bar').style.width = `${progress}%`;
            statusText.textContent = `Converting... (${attempts}/${maxAttempts})`;

            try {
                const runsResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs`, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!runsResponse.ok) throw new Error('Failed to check workflow status');

                const runsData = await runsResponse.json();
                const latestRun = runsData.workflow_runs[0];

                if (latestRun.status === 'completed') {
                    if (latestRun.conclusion === 'success') {
                        completeConversion(outputFilename);
                        return;
                    } else {
                        throw new Error('Conversion failed on GitHub');
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    throw new Error('Conversion timeout');
                }
            } catch (error) {
                throw error;
            }
        };

        await poll();
    }

    // Complete Conversion
    function completeConversion(outputFilename) {
        progressBar.querySelector('.progress-bar').style.width = '100%';
        statusText.textContent = 'Conversion complete!';
        isProcessing = false;

        // Create download link
        downloadBtn.style.display = 'inline-block';
        downloadBtn.href = `https://github.com/${GITHUB_REPO}/releases/download/conversion/${outputFilename}`;
        downloadBtn.download = outputFilename;
        downloadBtn.textContent = `Download ${outputFilename}`;

        // Reset file input
        fileInput.value = '';
    }

    // Helper Functions
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    function showProcessingUI() {
        isProcessing = true;
        uploadArea.innerHTML = `
            <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
            <h4>Processing PDF...</h4>
            <p class="small">${currentFile.name}</p>
        `;
        resultArea.style.display = 'block';
        progressBar.style.display = 'block';
        cancelBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'none';
    }

    function showError(message) {
        isProcessing = false;
        uploadArea.innerHTML = `
            <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
            <h4>Error</h4>
            <p>${message}</p>
            <button class="btn btn-primary mt-3" id="retry-btn">Try Again</button>
        `;
        statusText.textContent = message;
        progressBar.style.display = 'none';
        cancelBtn.style.display = 'none';

        // Add retry button handler
        document.getElementById('retry-btn').addEventListener('click', resetUI);
    }

    function resetUI() {
        isProcessing = false;
        currentFile = null;
        fileInput.value = '';
        uploadArea.innerHTML = `
            <i class="fas fa-file-pdf fa-5x mb-3 text-danger"></i>
            <h4>Select PDF File</h4>
            <button class="btn btn-primary mt-3" id="select-btn">Choose File</button>
        `;
        resultArea.style.display = 'none';
        
        // Reattach select button handler
        document.getElementById('select-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });
    }
});
