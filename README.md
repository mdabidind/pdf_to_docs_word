# PDF to Word Converter with OCR

A Flask application that converts PDF files to Word documents with OCR capabilities.

## Features
- Converts both text-based and scanned PDFs
- Preserves original formatting
- Drag-and-drop interface
- OCR processing for scanned documents

## Installation
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Install Tesseract OCR (see instructions below)
4. Run: `python app.py`

## Tesseract OCR Installation
- Windows: Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
- Mac: `brew install tesseract`
- Linux: `sudo apt install tesseract-ocr`
