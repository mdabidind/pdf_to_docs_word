document.getElementById('convertBtn').addEventListener('click', async function() {
    if (!currentFile) {
        showError('Please select a file first');
        return;
    }

    const convertBtn = this;
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const errorAlert = document.getElementById('errorAlert');

    // Prepare form data
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('ocr', document.getElementById('ocrOption').checked);

    // UI updates
    convertBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    hideError();

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        // Check content type to handle both JSON errors and file downloads
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            // Handle JSON error responses
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            } else {
                // Handle HTML error responses (fallback)
                const errorText = await response.text();
                throw new Error(errorText || 'Conversion failed');
            }
        }

        // Handle successful file download
        if (contentType && contentType.includes('application/vnd.openxmlformats')) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name.replace('.pdf', '.docx') || 'converted.docx';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Handle unexpected successful responses
            const result = await response.json();
            if (result && result.success === false) {
                throw new Error(result.error || 'Conversion failed');
            }
        }
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset UI
        progressContainer.style.display = 'none';
        convertBtn.disabled = false;
    }
});
