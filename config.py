import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'pdf'}
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-123')
    TESSERACT_CMD = os.getenv('TESSERACT_CMD', '/usr/bin/tesseract')
