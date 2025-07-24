import os
import uuid
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from pdf2docx import Converter
import pytesseract
from PIL import Image
import fitz  # PyMuPDF

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configuration - using absolute paths
UPLOAD_FOLDER = os.path.abspath('uploads')
OUTPUT_FOLDER = os.path.abspath('converted')
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure directories exist with proper permissions
os.makedirs(UPLOAD_FOLDER, mode=0o755, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, mode=0o755, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.after_request
def add_header(response):
    # Fix CORS issues that might cause network errors
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        # Handle preflight requests
        return jsonify({'status': 'success'}), 200
    
    # Check if file exists in request
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    file = request.files['file']
    
    # Check if file was selected
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No file selected'}), 400
    
    # Check file type
    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'message': 'Only PDF files are allowed'}), 400
    
    try:
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
        
        # Save file in chunks to handle large files
        chunk_size = 4096
        with open(pdf_path, 'wb') as f:
            while True:
                chunk = file.stream.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
        
        # Verify file was saved
        if not os.path.exists(pdf_path):
            app.logger.error(f"File not saved at {pdf_path}")
            return jsonify({'status': 'error', 'message': 'Failed to save file'}), 500
        
        return jsonify({
            'status': 'success',
            'message': 'File uploaded successfully',
            'filename': filename,
            'unique_id': unique_id
        })
        
    except Exception as e:
        app.logger.error(f'Error uploading file: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Error uploading file: {str(e)}'
        }), 500

# ... [rest of your backend code remains the same] ...

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
