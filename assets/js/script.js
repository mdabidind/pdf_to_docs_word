async function pollForConversionResult(outputFilename) {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 5 seconds = 2.5 minute timeout
    const pollInterval = 5000;
    let downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/conversion/${outputFilename}`;

    const poll = async () => {
        attempts++;
        const progress = Math.min(90, 10 + (attempts * 3));
        updateProgress(progress, `Processing (attempt ${attempts}/${maxAttempts})`);

        try {
            // Check if file exists (simple HEAD request)
            const exists = await checkFileExists(downloadUrl);
            if (exists) {
                completeConversion(downloadUrl, outputFilename);
                return;
            }

            // Fallback: Check GitHub Actions status
            if (attempts % 3 === 0) { // Only check every 3 attempts
                const runStatus = await checkWorkflowStatus();
                if (runStatus === 'failed') {
                    throw new Error('Conversion failed on GitHub');
                }
            }

            if (attempts < maxAttempts) {
                setTimeout(poll, pollInterval);
            } else {
                throw new Error('Conversion timeout - try again later');
            }
        } catch (error) {
            showError(error.message);
        }
    };

    await poll();
}

async function checkFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

async function checkWorkflowStatus() {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    const data = await response.json();
    return data.workflow_runs[0]?.conclusion || 'unknown';
}

function updateProgress(percent, message) {
    progressBar.querySelector('.progress-bar').style.width = `${percent}%`;
    statusText.textContent = message;
}
