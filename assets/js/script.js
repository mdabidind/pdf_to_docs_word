document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('pdf-file');
    const selectBtn = document.getElementById('select-btn');
    const uploadArea = document.getElementById('upload-area');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress-bar');
    
    // Handle file selection
    selectBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async function(e) {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }
        
        // Show processing UI
        uploadArea.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x mb-3"></i><h4>Processing PDF...</h4>';
        resultArea.style.display = 'block';
        progressBar.style.display = 'block';
        
        try {
            // Create FormData and send to GitHub Action
            const formData = new FormData();
            formData.append('pdf', file);
            
            const response = await fetch('https://api.github.com/repos/yourusername/pdf_to_docs_word/dispatches', {
                method: 'POST',
                headers: {
                    'Authorization': 'token your_github_pat_token',
                    'Accept': 'application/vnd.github.everest-preview+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'pdf_conversion',
                    client_payload: {
                        filename: file.name,
                        content: await toBase64(file)
                    }
                })
            });
            
            if (!response.ok) throw new Error('Conversion failed');
            
            // Poll for results (simplified - in reality you'd need a backend)
            statusText.textContent = 'Conversion in progress...';
            progressBar.querySelector('.progress-bar').style.width = '50%';
            
            // Simulate success after delay
            setTimeout(() => {
                progressBar.querySelector('.progress-bar').style.width = '100%';
                statusText.textContent = 'Conversion complete!';
                downloadBtn.style.display = 'inline-block';
                downloadBtn.href = '#'; // Would be the URL to download the converted file
            }, 3000);
            
        } catch (error) {
            console.error(error);
            uploadArea.innerHTML = '<i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i><h4>Conversion Failed</h4>';
            statusText.textContent = 'Error: ' + error.message;
        }
    });
    
    // Helper function to convert file to base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }
});
