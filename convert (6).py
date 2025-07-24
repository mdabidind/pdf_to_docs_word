# convert.py
import os
import uuid
import shutil
import requests
from pdf2docx import Converter
from flask import Flask, request, jsonify

UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Your Convertio API Key (Optional)
CONVERTIO_API = "your_convertio_api_key"

app = Flask(__name__)

def convert_pdf_to_word(input_path, output_path):
    try:
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return True
    except Exception as e:
        print("Conversion failed:", e)
        return False

@app.route('/convert', methods=['POST'])
def convert():
    uploaded = request.files['file']
    file_id = str(uuid.uuid4())[:8]
    input_pdf = os.path.join(UPLOAD_FOLDER, f"{file_id}.pdf")
    output_docx = os.path.join(CONVERTED_FOLDER, f"{file_id}.docx")

    uploaded.save(input_pdf)
    success = convert_pdf_to_word(input_pdf, output_docx)

    if success:
        return jsonify({
            "status": "success",
            "id": file_id,
            "download_url": f"/download/{file_id}.docx"
        })
    else:
        return jsonify({"status": "fail", "error": "Conversion failed"})

@app.route('/download/<filename>')
def download(filename):
    return send_from_directory(CONVERTED_FOLDER, filename)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
