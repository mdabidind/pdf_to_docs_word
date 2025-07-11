document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const convertBtn = document.getElementById('convert-btn');
    const statusDiv = document.getElementById('status');
    
    // Event listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async function(e) {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        
        // Validate file
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please select a PDF file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showError('File size exceeds 5MB limit');
            return;
        }
        
        // Show processing UI
        showProcessing(file.name);
        
        try {
            // Read file as base64
            const base64Content = await toBase64(file);
            
            // Trigger GitHub Action
            const response = await fetch(`https://api.github.com/repos/mdabidind/pdf_to_docs_word/dispatches`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.everest-preview+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'pdf_conversion',
                    client_payload: {
                        filename: file.name,
                        content: base64Content
                    }
                })
            });
            
            if (!response.ok) throw new Error('Conversion request failed');
            
            // Poll for result
            await pollForConversionResult(file.name.replace('.pdf', '.docx'));
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Helper functions
    async function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }
    
    async function pollForConversionResult(outputFilename) {
        const maxAttempts = 20;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            attempts++;
            updateStatus(`Processing... (attempt ${attempts}/${maxAttempts})`);
            
            try {
                const exists = await checkFileExists(
                    `https://github.com/mdabidind/pdf_to_docs_word/releases/download/conversion/${outputFilename}`
                );
                if (exists) {
                    showSuccess(outputFilename);
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                throw error;
            }
        }
        
        throw new Error('Conversion timeout');
    }
    
    async function checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    function showProcessing(filename) {
        uploadArea.style.display = 'none';
        statusDiv.innerHTML = `
            <div class="processing">
                <div class="spinner"></div>
                <p>Converting ${filename}...</p>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
        `;
    }
    
    function updateStatus(message) {
        const messageEl = statusDiv.querySelector('p');
        if (messageEl) messageEl.textContent = message;
    }
    
    function showSuccess(filename) {
        statusDiv.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i>
                <p>Conversion complete!</p>
                <a href="https://github.com/mdabidind/pdf_to_docs_word/releases/download/conversion/${filename}" 
                   class="download-btn" download="${filename}">
                    Download Word File
                </a>
            </div>
        `;
    }
    
    function showError(message) {
        statusDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-times-circle"></i>
                <p>Error: ${message}</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;
        
        statusDiv.querySelector('.retry-btn').addEventListener('click', () => {
            fileInput.value = '';
            statusDiv.innerHTML = '';
            uploadArea.style.display = 'block';
        });
    }
});
