import os
import uuid
import shutil
from flask import Flask, render_template, request, send_file, jsonify
from pdf2docx import Converter
import pytesseract
from PIL import Image
import pdf2image
import tempfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def convert_pdf_to_docx(pdf_path, docx_path, use_ocr=False):
    """Convert PDF to DOCX with optional OCR"""
    try:
        if use_ocr:
            # OCR processing for scanned PDFs
            with tempfile.TemporaryDirectory() as temp_dir:
                # Convert PDF to images
                images = pdf2image.convert_from_path(pdf_path, output_folder=temp_dir)
                
                # Create a temporary PDF with OCR text layer
                pdf_with_ocr = os.path.join(temp_dir, "ocr_output.pdf")
                
                # Process each page with Tesseract OCR
                for i, image in enumerate(images):
                    text = pytesseract.image_to_string(image)
                    # Here you would typically add the text layer to the PDF
                    # This is simplified - in production you'd use a proper PDF library
                
                # For demo purposes, we'll just use the original conversion
                cv = Converter(pdf_path)
                cv.convert(docx_path)
                cv.close()
        else:
            # Standard conversion for text-based PDFs
            cv = Converter(pdf_path)
            cv.convert(docx_path)
            cv.close()
        
        return True, None
    except Exception as e:
        return False, str(e)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400
    
    try:
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
        docx_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.docx")
        
        # Save uploaded file
        file.save(pdf_path)
        
        # Get conversion parameters
        use_ocr = request.form.get('ocr', 'false').lower() == 'true'
        preserve_formatting = request.form.get('formatting', 'true').lower() == 'true'
        
        # Convert the file
        success, error = convert_pdf_to_docx(pdf_path, docx_path, use_ocr)
        
        if not success:
            return jsonify({'error': error}), 500
        
        # Prepare the response
        output_filename = os.path.splitext(original_filename)[0] + '.docx'
        
        return send_file(
            docx_path,
            as_attachment=True,
            download_name=output_filename,
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
