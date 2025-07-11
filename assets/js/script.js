document.addEventListener('DOMContentLoaded', function() {
    // Get all elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const convertBtn = document.getElementById('convert-btn');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const resultDiv = document.getElementById('result');

    // Debugging
    console.log("Script loaded successfully");
    console.log("Elements found:", {uploadArea, fileInput, fileInfo, convertBtn});

    // Click on upload area
    uploadArea.addEventListener('click', function() {
        console.log("Upload area clicked");
        fileInput.click();
    });

    // File selection changed
    fileInput.addEventListener('change', function(e) {
        console.log("File input changed");
        
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            console.log("File selected:", file.name);
            
            // Validate file type
            if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
                showResult('Please select a PDF file', 'error');
                return;
            }
            
            // Update UI
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.style.display = 'block';
            convertBtn.style.display = 'inline-block';
            
            // Store the file for conversion
            window.selectedFile = file;
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#2ecc71';
        this.style.background = '#e8f8f5';
    });

    uploadArea.addEventListener('dragleave', function() {
        this.style.borderColor = '#3498db';
        this.style.background = '';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#3498db';
        this.style.background = '';
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    // Convert button click
    convertBtn.addEventListener('click', function() {
        if (!window.selectedFile) {
            showResult('No file selected', 'error');
            return;
        }
        
        console.log("Starting conversion for:", window.selectedFile.name);
        convertFile(window.selectedFile);
    });

    // File conversion function
    function convertFile(file) {
        // Show progress
        progressBar.style.display = 'block';
        convertBtn.disabled = true;
        
        // Simulate conversion progress (replace with actual conversion)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                conversionComplete(file.name.replace('.pdf', '.docx'));
            }
        }, 200);
    }

    // Conversion complete
    function conversionComplete(outputFilename) {
        showResult(`Conversion complete! <a href="#" id="download-link">Download ${outputFilename}</a>`, 'success');
        
        // Set up download link
        document.getElementById('download-link').addEventListener('click', function(e) {
            e.preventDefault();
            // In a real app, this would download the converted file
            alert('Download functionality would be implemented here');
        });
    }

    // Show result message
    function showResult(message, type) {
        resultDiv.innerHTML = message;
        resultDiv.className = type;
        resultDiv.style.display = 'block';
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
