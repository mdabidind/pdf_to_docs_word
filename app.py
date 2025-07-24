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

# Configuration
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
OUTPUT_FOLDER = os.path.join(os.getcwd(), 'converted')
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
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
        
        # Save file
        file.save(pdf_path)
        
        # Verify file was saved
        if not os.path.exists(pdf_path):
            app.logger.error(f"File not saved at {pdf_path}")
            return jsonify({'status': 'error', 'message': 'Failed to save file'}), 500
        
        return jsonify({
            'status': 'success',
            'message': 'File uploaded successfully',
            'filename': filename,
            'unique_id': unique_id,
            'file_path': pdf_path
        })
        
    except Exception as e:
        app.logger.error(f'Error uploading file: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Error uploading file: {str(e)}'
        }), 500

@app.route('/convert', methods=['POST'])
def convert_file():
    try:
        data = request.get_json()
        if not data or 'unique_id' not in data or 'filename' not in data:
            return jsonify({'status': 'error', 'message': 'Invalid request data'}), 400
            
        unique_id = data['unique_id']
        filename = data['filename']
        ocr_mode = data.get('ocr_mode', 'auto')
        
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
        
        # Verify file exists
        if not os.path.exists(pdf_path):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
        docx_filename = f"{os.path.splitext(filename)[0]}_converted.docx"
        docx_path = os.path.join(OUTPUT_FOLDER, f"{unique_id}_{docx_filename}")
        
        # Convert PDF to Word
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        
        # Handle OCR if needed
        if ocr_mode == 'force' or (ocr_mode == 'auto' and not fitz.open(pdf_path).load_page(0).get_text().strip()):
            doc = fitz.open(pdf_path)
            full_text = []
            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text = pytesseract.image_to_string(img)
                full_text.append(text)
            # TODO: Add OCR text to Word document
        
        return jsonify({
            'status': 'success',
            'download_url': f'/download/{unique_id}_{docx_filename}',
            'filename': docx_filename
        })
        
    except Exception as e:
        app.logger.error(f'Conversion failed: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Conversion failed: {str(e)}'
        }), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)
    except Exception as e:
        app.logger.error(f'Download failed: {str(e)}')
        return jsonify({'status': 'error', 'message': 'File not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
