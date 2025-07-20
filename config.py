import os
from werkzeug.security import generate_password_hash

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-very-secure-key-here'
    TEMP_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'temp')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ADMIN_USERNAME = 'admin'
    ADMIN_PASSWORD = generate_password_hash('your-secure-admin-password')
    
    @staticmethod
    def init_app(app):
        pass