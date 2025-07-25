# Advanced PDF to Word Converter with OCR

A Flask-based web application that converts PDF files to Word documents with OCR capabilities for scanned documents.

## Features
- Drag and drop PDF uploads
- OCR processing for scanned documents
- Preserves original formatting
- Responsive web interface
- Secure file handling (auto-deletes after processing)

## Installation
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Install Tesseract OCR:
   - Windows: Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
   - Mac: `brew install tesseract`
   - Linux: `sudo apt install tesseract-ocr`
4. Create a `.env` file with configuration (optional)
5. Run: `python app.py`

## Configuration
Create a `.env` file to override defaults:
## Automatic Installation


