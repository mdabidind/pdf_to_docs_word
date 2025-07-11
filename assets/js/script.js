async function triggerConversion(filename, content) {
    updateProgress(10, 'Initializing conversion');
    addStatusLog('Authenticating with GitHub...');

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.everest-preview+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'  // Specify API version
            },
            body: JSON.stringify({
                event_type: 'pdf_conversion',
                client_payload: {
                    filename: filename,
                    content: content
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API: ${errorData.message || response.status}`);
        }

        addStatusLog('GitHub authentication successful');
        // ... rest of your code ...
    } catch (error) {
        addStatusLog(`Authentication failed: ${error.message}`);
        throw error;
    }
}
