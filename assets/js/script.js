document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const statusDiv = document.getElementById('status');
    const convertBtn = document.getElementById('convert-btn');
    const fileNameDisplay = document.getElementById('file-name');
    
    // Event Listeners
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            handleFileSelection(file);
        }
    });
    
    convertBtn.addEventListener('click', startConversion);
    
    // File Handling
    function handleFileSelection(file) {
        // Validate file
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please select a valid PDF file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showError('File size exceeds 5MB limit');
            return;
        }
        
        // Update UI
        uploadArea.style.display = 'none';
        statusDiv.innerHTML = `
            <div class="file-selected">
                <i class="fas fa-file-pdf"></i>
                <div class="file-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${formatFileSize(file.size)}</p>
                </div>
                <button id="change-file" class="btn-change">Change</button>
            </div>
            <button id="convert-btn" class="btn-convert">Convert to Word</button>
        `;
        
        // Add event listener to change file button
        document.getElementById('change-file').addEventListener('click', function() {
            fileInput.value = '';
            resetUI();
        });
    }
    
    function startConversion() {
        const file = fileInput.files[0];
        if (!file) return;
        
        // Show processing UI
        statusDiv.innerHTML = `
            <div class="processing">
                <div class="spinner"></div>
                <p>Converting ${file.name}...</p>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
        `;
        
        // Here you would add your actual conversion logic
        // For now we'll simulate conversion
        simulateConversion(file.name);
    }
    
    function simulateConversion(filename) {
        let progress = 0;
        const progressBar = document.querySelector('.progress');
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                showConversionResult(filename.replace('.pdf', '.docx'));
            }
        }, 300);
    }
    
    function showConversionResult(outputFilename) {
        statusDiv.innerHTML = `
            <div class="result">
                <i class="fas fa-check-circle"></i>
                <p>Conversion complete!</p>
                <a href="#" class="btn-download" download="${outputFilename}">
                    Download ${outputFilename}
                </a>
                <button id="new-conversion" class="btn-new">Convert Another</button>
            </div>
        `;
        
        document.getElementById('new-conversion').addEventListener('click', resetUI);
    }
    
    function showError(message) {
        statusDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-times-circle"></i>
                <p>${message}</p>
                <button class="btn-retry">Try Again</button>
            </div>
        `;
        
        document.querySelector('.btn-retry').addEventListener('click', resetUI);
    }
    
    function resetUI() {
        fileInput.value = '';
        statusDiv.innerHTML = '';
        uploadArea.style.display = 'block';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
