import os
import uuid
from flask import Flask, render_template, request, send_file, jsonify
from pdf2docx import Converter
import pytesseract
from PIL import Image
import pdf2image
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.lower().endswith('.pdf')

def convert_pdf_to_docx(pdf_path, docx_path, use_ocr=False):
    try:
        if use_ocr:
            # Convert PDF to images and apply OCR
            images = pdf2image.convert_from_path(pdf_path)
            # (Actual OCR implementation would go here)
        
        # Standard conversion
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        return True, None
    except Exception as e:
        return False, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    try:
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
        docx_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.docx")
        file.save(pdf_path)

        # Convert with options
        use_ocr = request.form.get('ocr', 'false') == 'true'
        success, error = convert_pdf_to_docx(pdf_path, docx_path, use_ocr)
        
        if not success:
            return jsonify({'error': error}), 500

        return send_file(
            docx_path,
            as_attachment=True,
            download_name=f"{os.path.splitext(file.filename)[0]}.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up files
        for path in [pdf_path, docx_path]:
            if path and os.path.exists(path):
                os.remove(path)

if __name__ == '__main__':
    app.run(debug=True)
