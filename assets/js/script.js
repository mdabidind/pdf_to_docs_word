document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const convertBtn = document.getElementById('convert-btn');

    // Debugging point
    console.log("Script loaded. Elements:", {uploadArea, fileInput, fileInfo});

    // Click handler for upload area
    uploadArea.addEventListener('click', function() {
        console.log("Upload area clicked");
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        console.log("File input changed");
        
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            console.log("File selected:", file.name);
            
            // Verify it's a PDF
            if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
                alert('Please select a PDF file');
                return;
            }
            
            // Show file info
            fileName.textContent = file.name;
            fileInfo.style.display = 'block';
            
            // Store the file for conversion
            window.selectedFile = file;
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#2ecc71';
        console.log("File dragged over");
    });

    uploadArea.addEventListener('dragleave', function() {
        this.style.borderColor = '#3498db';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#3498db';
        console.log("File dropped");
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    // Convert button handler
    convertBtn.addEventListener('click', function() {
        if (!window.selectedFile) {
            alert('Please select a file first');
            return;
        }
        
        console.log("Starting conversion for:", window.selectedFile.name);
        // Add your conversion logic here
    });
});
