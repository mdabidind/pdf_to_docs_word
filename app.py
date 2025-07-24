import os
import uuid
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, flash, jsonify
from werkzeug.utils import secure_filename
from pdf2docx import Converter
import pytesseract
from PIL import Image
import fitz  # PyMuPDF

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Required for flash messages

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'converted'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Check if file exists in request
        if 'file' not in request.files:
            flash('No file part in the request', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        # Check file type and save
        if file and allowed_file(file.filename):
            try:
                # Generate unique filename
                unique_id = str(uuid.uuid4())
                filename = secure_filename(file.filename)
                pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
                
                # Save file
                file.save(pdf_path)
                
                # Return JSON response for AJAX handling
                return jsonify({
                    'status': 'success',
                    'message': 'File uploaded successfully',
                    'filename': filename,
                    'unique_id': unique_id
                })
                
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Error uploading file: {str(e)}'
                }), 500
        else:
            return jsonify({
                'status': 'error',
                'message': 'Only PDF files are allowed'
            }), 400
    
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    try:
        data = request.get_json()
        unique_id = data['unique_id']
        filename = data['filename']
        ocr_mode = data.get('ocr_mode', 'auto')
        
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
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
        return jsonify({
            'status': 'error',
            'message': f'Conversion failed: {str(e)}'
        }), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
