import os
import uuid
import logging
from flask import Flask, render_template, request, send_file, jsonify
from pdf2docx import Converter
import pytesseract
from pdf2image import convert_from_path
from werkzeug.utils import secure_filename
from config import Config

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = app.config['TESSERACT_CMD']

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def convert_with_ocr(pdf_path, docx_path):
    """Convert scanned PDF using OCR"""
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path)
        
        # Create temporary directory for OCR processing
        with tempfile.TemporaryDirectory() as temp_dir:
            text_content = []
            
            for i, image in enumerate(images):
                # Save each page as image
                image_path = f"{temp_dir}/page_{i}.png"
                image.save(image_path, 'PNG')
                
                # Perform OCR
                text = pytesseract.image_to_string(image_path)
                text_content.append(text)
            
            # Create a simple Word document with OCR text
            from docx import Document
            doc = Document()
            for text in text_content:
                doc.add_paragraph(text)
            doc.save(docx_path)
            
        return True, None
        
    except Exception as e:
        return False, str(e)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    # Check if file exists in request
    if 'file' not in request.files:
        logger.error("No file in request")
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    file = request.files['file']
    
    # Validate file
    if file.filename == '':
        logger.error("Empty filename")
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        logger.error(f"Invalid file type: {file.filename}")
        return jsonify({'success': False, 'error': 'Only PDF files are allowed'}), 400

    # Prepare file paths
    file_id = uuid.uuid4().hex
    original_name = secure_filename(file.filename)
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
    docx_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.docx")
    
    try:
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save uploaded file
        file.save(pdf_path)
        logger.info(f"File saved: {pdf_path}")
        
        # Get conversion options
        use_ocr = request.form.get('ocr', 'false').lower() == 'true'
        
        # Perform conversion
        if use_ocr:
            logger.info("Starting OCR conversion")
            success, error = convert_with_ocr(pdf_path, docx_path)
        else:
            logger.info("Starting standard conversion")
            cv = Converter(pdf_path)
            cv.convert(docx_path)
            cv.close()
            success, error = True, None
        
        if not success:
            logger.error(f"Conversion failed: {error}")
            return jsonify({'success': False, 'error': error}), 500
        
        logger.info("Conversion successful, sending file")
        return send_file(
            docx_path,
            as_attachment=True,
            download_name=f"{os.path.splitext(original_name)[0]}.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        logger.error(f"Server error: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        # Clean up files
        for path in [pdf_path, docx_path]:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    logger.info(f"Cleaned up: {path}")
            except Exception as e:
                logger.warning(f"Error cleaning up {path}: {str(e)}")

@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
