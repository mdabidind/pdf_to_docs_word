document.addEventListener('DOMContentLoaded', function() {
  // Debugging checkpoint 1
  console.log('Script loaded successfully');
  
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('pdf-file');
  const statusArea = document.getElementById('status-area');
  const fileInfo = document.getElementById('file-info');
  const progressContainer = document.getElementById('progress-container');
  const resultContainer = document.getElementById('result-container');

  // Debugging checkpoint 2
  console.log('DOM elements loaded:', {uploadArea, fileInput, statusArea});

  // Main event listeners
  uploadArea.addEventListener('click', function() {
    console.log('Upload area clicked');
    fileInput.click();
  });

  fileInput.addEventListener('change', function(e) {
    console.log('File selected:', e.target.files);
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
    console.log('File dragged over');
  });

  uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    console.log('File dropped');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  function handleFileSelection(file) {
    console.log('Handling file:', file.name);
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Please select a valid PDF file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5MB limit');
      return;
    }

    // Update UI
    uploadArea.style.display = 'none';
    statusArea.style.display = 'block';
    
    fileInfo.innerHTML = `
      <div class="file-display">
        <i class="fas fa-file-pdf"></i>
        <div>
          <p class="filename">${file.name}</p>
          <p class="filesize">${formatFileSize(file.size)}</p>
        </div>
        <button id="change-file" class="btn-change">Change</button>
      </div>
    `;

    progressContainer.innerHTML = `
      <button id="convert-btn" class="btn-convert">Convert to Word</button>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
    `;

    // Add event listeners to new elements
    document.getElementById('change-file').addEventListener('click', resetUI);
    document.getElementById('convert-btn').addEventListener('click', function() {
      startConversion(file);
    });
  }

  function startConversion(file) {
    console.log('Starting conversion for:', file.name);
    
    // Disable convert button
    const convertBtn = document.getElementById('convert-btn');
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    // Show progress bar
    const progressBar = document.querySelector('.progress');
    progressBar.style.width = '0%';
    
    // Simulate conversion progress (replace with actual conversion)
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      progressBar.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        conversionComplete(file.name.replace('.pdf', '.docx'));
      }
    }, 200);
  }

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

  function resetUI() {
    console.log('Resetting UI');
    fileInput.value = '';
    uploadArea.style.display = 'block';
    statusArea.style.display = 'none';
    fileInfo.innerHTML = '';
    progressContainer.innerHTML = '';
    resultContainer.innerHTML = '';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
});
