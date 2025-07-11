// Configuration
const CONFIG = {
  GITHUB_REPO: 'mdabidind/pdf_to_docs_word',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  CHUNK_SIZE: 1 * 1024 * 1024, // 1MB chunks
  POLL_INTERVAL: 5000, // 5 seconds
  MAX_ATTEMPTS: 30 // 2.5 minute timeout
};

// State management
let state = {
  currentFile: null,
  isProcessing: false,
  uploadProgress: 0,
  githubToken: 'github_pat_11BSRXTTI0q8fLUKzWdH6q_...' // Replace with your token
};

// DOM Elements
const elements = {
  fileInput: document.getElementById('pdf-file'),
  selectBtn: document.getElementById('select-btn'),
  uploadArea: document.getElementById('upload-area'),
  processingArea: document.getElementById('processing-area'),
  resultArea: document.getElementById('result-area'),
  progressBar: document.getElementById('progress-bar'),
  statusMessage: document.getElementById('status-message'),
  statusDetails: document.getElementById('status-details'),
  uploadProgress: document.getElementById('upload-progress'),
  uploadProgressBar: document.getElementById('upload-progress-bar'),
  uploadSpeed: document.getElementById('upload-speed'),
  resultIcon: document.getElementById('result-icon'),
  resultMessage: document.getElementById('result-message'),
  resultContent: document.getElementById('result-content')
};

// Initialize the application
function init() {
  setupEventListeners();
  checkGitHubConnection();
}

// Set up all event listeners
function setupEventListeners() {
  // File selection
  elements.selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.isProcessing) elements.fileInput.click();
  });

  // File input change
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0 && !state.isProcessing) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Drag and drop
  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!state.isProcessing) elements.uploadArea.classList.add('drag-over');
  });

  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('drag-over');
  });

  elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
    if (!state.isProcessing && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });
}

// Check GitHub connection on startup
async function checkGitHubConnection() {
  try {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_REPO}`, {
      headers: {
        'Authorization': `Bearer ${state.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      addStatusLog('Warning: GitHub connection may be unstable', 'warning');
    } else {
      addStatusLog('Connected to GitHub repository', 'success');
    }
  } catch (error) {
    addStatusLog('GitHub connection check failed', 'error');
  }
}

// Handle file selection
async function handleFileSelect(file) {
  resetUI();
  state.currentFile = file;
  
  // Validate file
  if (!validateFile(file)) return;

  // Start processing
  state.isProcessing = true;
  showProcessingUI();

  try {
    // Read and prepare file
    addStatusLog('Preparing file for upload...');
    const fileData = await prepareFileForUpload(file);
    
    // Upload and convert
    addStatusLog('Starting file conversion...');
    const result = await uploadAndConvertFile(file.name, fileData);
    
    // Handle success
    handleConversionSuccess(result.downloadUrl, result.outputFilename);
  } catch (error) {
    handleConversionError(error);
  }
}

// Prepare file for upload (chunked reading)
async function prepareFileForUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      const base64Data = arrayBufferToBase64(arrayBuffer);
      resolve(base64Data);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Upload and convert file
async function uploadAndConvertFile(filename, fileData) {
  // Show upload progress
  elements.uploadProgress.style.display = 'block';
  const uploadStartTime = Date.now();
  
  try {
    // Start upload (simulated progress)
    updateUploadProgress(0, 'Starting upload...');
    
    // Simulate upload progress (in real app, use actual progress events)
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateUploadProgress(progress, `Uploading... ${progress}%`);
    }
    
    // Send to GitHub
    addStatusLog('Sending to GitHub for conversion...');
    const response = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.githubToken}`,
        'Accept': 'application/vnd.github.everest-preview+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'pdf_conversion',
        client_payload: {
          filename: filename,
          content: fileData
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'GitHub API request failed');
    }

    // Poll for results
    const outputFilename = filename.replace('.pdf', '.docx');
    const downloadUrl = `https://github.com/${CONFIG.GITHUB_REPO}/releases/download/conversion/${outputFilename}`;
    
    addStatusLog('Conversion started, waiting for results...');
    await pollForConversionResult(downloadUrl);
    
    return { downloadUrl, outputFilename };
  } finally {
    elements.uploadProgress.style.display = 'none';
  }
}

// Poll for conversion result
async function pollForConversionResult(downloadUrl) {
  let attempts = 0;
  
  while (attempts < CONFIG.MAX_ATTEMPTS) {
    attempts++;
    const progress = Math.min(90, 20 + (attempts * 2));
    updateProgress(progress, `Processing (attempt ${attempts}/${CONFIG.MAX_ATTEMPTS})`);
    
    try {
      // Check if file exists
      const fileExists = await checkFileExists(downloadUrl);
      if (fileExists) {
        addStatusLog('Conversion complete!', 'success');
        return;
      }
      
      // Check workflow status periodically
      if (attempts % 3 === 0) {
        const status = await checkWorkflowStatus();
        if (status === 'failed') throw new Error('Conversion failed on GitHub');
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL));
    } catch (error) {
      throw error;
    }
  }
  
  throw new Error('Conversion timeout - try again later');
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
  const response = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_REPO}/actions/runs`, {
    headers: {
      'Authorization': `Bearer ${state.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  const data = await response.json();
  return data.workflow_runs[0]?.conclusion || 'unknown';
}

// Validate file before upload
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
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    showError(`File size exceeds ${formatFileSize(CONFIG.MAX_FILE_SIZE)} limit`);
    return false;
  }

  return true;
}

// UI Updates
function showProcessingUI() {
  elements.uploadArea.style.display = 'none';
  elements.processingArea.style.display = 'block';
  elements.resultArea.style.display = 'none';
  updateProgress(0, 'Starting conversion...');
}

function updateProgress(percent, message) {
  elements.progressBar.style.width = `${percent}%`;
  elements.statusMessage.textContent = message;
}

function updateUploadProgress(percent, message) {
  elements.uploadProgressBar.style.width = `${percent}%`;
  elements.uploadSpeed.textContent = message;
}

function addStatusLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `status-entry ${type}`;
  logEntry.innerHTML = `<span class="text-muted">[${timestamp}]</span> ${message}`;
  elements.statusDetails.appendChild(logEntry);
  elements.statusDetails.scrollTop = elements.statusDetails.scrollHeight;
}

function handleConversionSuccess(downloadUrl, filename) {
  state.isProcessing = false;
  updateProgress(100, 'Conversion complete!');
  
  elements.processingArea.style.display = 'none';
  elements.resultArea.style.display = 'block';
  
  elements.resultIcon.className = 'fas fa-check-circle fa-5x mb-3 text-success';
  elements.resultMessage.textContent = 'Your Word file is ready!';
  elements.resultContent.innerHTML = `
    <p class="mb-3">${filename}</p>
    <a href="${downloadUrl}" class="btn btn-success btn-lg" download="${filename}">
      <i class="fas fa-download me-2"></i>Download Now
    </a>
  `;
}

function handleConversionError(error) {
  state.isProcessing = false;
  
  elements.processingArea.style.display = 'none';
  elements.resultArea.style.display = 'block';
  
  elements.resultIcon.className = 'fas fa-times-circle fa-5x mb-3 text-danger';
  elements.resultMessage.textContent = 'Conversion Failed';
  elements.resultContent.innerHTML = `
    <p class="text-danger mb-3">${error.message}</p>
    <div class="d-flex gap-2">
      <button class="btn btn-primary" onclick="location.reload()">
        <i class="fas fa-redo me-2"></i>Try Again
      </button>
      <button class="btn btn-outline-secondary" id="view-details-btn">
        <i class="fas fa-info-circle me-2"></i>Details
      </button>
    </div>
    <div id="error-details" class="mt-3 small text-muted" style="display: none;">
      ${error.stack || 'No additional details available'}
    </div>
  `;
  
  // Add details toggle
  document.getElementById('view-details-btn').addEventListener('click', () => {
    const details = document.getElementById('error-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  });
}

function resetUI() {
  state.isProcessing = false;
  state.currentFile = null;
  elements.fileInput.value = '';
  
  elements.uploadArea.style.display = 'block';
  elements.processingArea.style.display = 'none';
  elements.resultArea.style.display = 'none';
  elements.uploadProgress.style.display = 'none';
  
  elements.statusDetails.innerHTML = '';
  elements.uploadProgressBar.style.width = '0%';
}

// Helper functions
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
