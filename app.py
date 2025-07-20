import os
import logging
from logging.handlers import RotatingFileHandler
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, render_template, redirect, url_for, session, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from functools import wraps
from pdf_converter import PDFToWordConverter  # Our conversion class

app = Flask(__name__)
app.config.from_pyfile('config.py')

# Configure logging
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)

# Rate limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Initialize converter
converter = PDFToWordConverter()

# Database setup
def get_db():
    db = sqlite3.connect(os.path.join(app.instance_path, 'database.db'))
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS conversions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                original_filename TEXT,
                converted_filename TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        db.commit()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('username') != app.config['ADMIN_USERNAME']:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('converter.html')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        
        if user and check_password_hash(user['password'], password):
            session.clear()
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('index'))
        
        return render_template('auth.html', error='Invalid username or password')
    
    return render_template('auth.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/convert', methods=['POST'])
@login_required
@limiter.limit("10 per hour")
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    try:
        # Secure filename and save temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['TEMP_FOLDER'], filename)
        file.save(temp_path)
        
        # Convert the file
        success, output_path = converter.convert_pdf_to_word(temp_path)
        
        if not success:
            return jsonify({'error': output_path}), 500
        
        # Save conversion record
        db = get_db()
        db.execute(
            'INSERT INTO conversions (user_id, original_filename, converted_filename) VALUES (?, ?, ?)',
            (session['user_id'], filename, os.path.basename(output_path))
        )
        db.commit()
        
        return jsonify({
            'filename': os.path.basename(output_path),
            'original': filename
        })
        
    except Exception as e:
        app.logger.error(f"Conversion error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/download/<filename>')
@login_required
def download_file(filename):
    try:
        # Verify user has access to this file
        db = get_db()
        conversion = db.execute(
            'SELECT * FROM conversions WHERE converted_filename = ? AND user_id = ?',
            (filename, session['user_id'])
        ).fetchone()
        
        if not conversion:
            return jsonify({'error': 'File not found or access denied'}), 404
        
        return send_from_directory(
            app.config['TEMP_FOLDER'],
            filename,
            as_attachment=True,
            download_name=f"converted_{conversion['original_filename'].replace('.pdf', '.docx')"
        )
        
    except Exception as e:
        app.logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/admin')
@admin_required
def admin_panel():
    return render_template('updater.html')

@app.route('/admin/tools', methods=['GET'])
@admin_required
def get_tools_status():
    try:
        missing = converter.check_requirements()
        return jsonify({
            'tools': [
                {'name': 'Tesseract OCR', 'installed': 'tesseract' not in missing},
                {'name': 'PDF2DOCX', 'installed': True},
                {'name': 'PyMuPDF', 'installed': True}
            ],
            'missing': missing
        })
    except Exception as e:
        app.logger.error(f"Tools status error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/update', methods=['POST'])
@admin_required
def update_tools():
    try:
        tool = request.json.get('tool')
        if tool == 'tesseract':
            success = converter.install_tesseract()
            return jsonify({'success': success})
        return jsonify({'error': 'Invalid tool'}), 400
    except Exception as e:
        app.logger.error(f"Update error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config['TEMP_FOLDER'], exist_ok=True)
    init_db()
    app.run(debug=True)