# GitHub PDF to Word Converter

A complete solution for converting PDF files to Word documents (DOCX) directly from GitHub.

## Features
- 100% hosted on GitHub (Pages + Actions)
- Secure conversion process
- Preserves original formatting
- No server setup required

## How It Works
1. User uploads PDF file through the web interface
2. GitHub Action is triggered to process the file
3. Conversion happens on GitHub's servers
4. User downloads the converted Word file

## Setup
1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Create a personal access token with `repo` scope
4. Update the token in `script.js`

## Limitations
- Maximum file size: 10MB (GitHub API limit)
- Conversion may take 1-2 minutes
