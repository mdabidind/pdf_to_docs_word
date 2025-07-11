document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const statusArea = document.getElementById('status-area');
    const fileInfo = document.getElementById('file-info');
    const progressContainer = document.getElementById('progress-container');
    const resultContainer = document.getElementById('result-container');

    // State
    let selectedFile = null;

    // Debugging
    console.log('PDF Converter initialized');
    console.log('Elements:', {uploadArea, fileInput, statusArea});

    // Event Listeners
    uploadArea.addEventListener('click', function() {
        console.log('Upload area clicked');
        fileInput.value = ''; // Reset to allow same file re-selection
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        console.log('File input changed');
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag and Drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
        console.log('File dragged over');
    });

    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        console.log('File dropped');
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    // File Selection Handler
    function handleFileSelection(file) {
        console.log('Handling file:', file.name);
        
        // Validate file
        if (!validateFile(file)) return;

        // Store file
        selectedFile = file;
        
        // Update UI
        uploadArea.style.display = 'none';
        statusArea.style.display = 'block';
        
        fileInfo.innerHTML = `
            <i class="fas fa-file-pdf"></i>
            <div class="file-info-text">
                <p class="filename">${file.name}</p>
                <p class="filesize">${formatFileSize(file.size)}</p>
            </div>
            <button id="change-file" class="btn-change">Change</button>
        `;

        progressContainer.innerHTML = `
            <button id="convert-btn" class="btn-convert">Convert to Word</button>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <p class="progress-text">Ready to convert</p>
        `;

        // Add event listeners to new elements
        document.getElementById('change-file').addEventListener('click', resetUI);
        document.getElementById('convert-btn').addEventListener('click', function() {
            startConversion(selectedFile);
        });
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

        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size exceeds 5MB limit');
            return false;
        }

        return true;
    }

    // Start Conversion
    function startConversion(file) {
        console.log('Starting conversion for:', file.name);
        
        // Update UI
        const convertBtn = document.getElementById('convert-btn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        
        const progressBar = document.querySelector('.progress');
        const progressText = document.querySelector('.progress-text');
        progressBar.style.width = '0%';
        progressText.textContent = 'Starting conversion...';
        
        // Simulate conversion progress (replace with actual API call)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Converting... ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                conversionComplete(file.name.replace('.pdf', '.docx'));
            }
        }, 200);
    }

    // Conversion Complete
    function conversionComplete(outputFilename) {
        console.log('Conversion complete:', outputFilename);
        
        progressContainer.style.display = 'none';
        resultContainer.innerHTML = `
            <div class="result-message">
                <i class="fas fa-check-circle"></i>
                <h4>Conversion Successful!</h4>
                <a href="#" class="btn-download" download="${outputFilename}">Download ${outputFilename}</a>
                <button id="new-conversion" class="btn-new">Convert Another File</button>
            </div>
        `;
        
        document.getElementById('new-conversion').addEventListener('click', resetUI);
    }

    // Error Handling
    function showError(message) {
        console.error('Error:', message);
        statusArea.style.display = 'block';
        resultContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button id="try-again" class="btn-try-again">Try Again</button>
            </div>
        `;
        
        document.getElementById('try-again').addEventListener('click', resetUI);
    }

    // Reset UI
    function resetUI() {
        console.log('Resetting UI');
        fileInput.value = '';
        selectedFile = null;
        uploadArea.style.display = 'block';
        statusArea.style.display = 'none';
        fileInfo.innerHTML = '';
        progressContainer.innerHTML = '';
        resultContainer.innerHTML = '';
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
