#!/bin/bash

# Check OS and install Tesseract
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo apt update
    sudo apt install -y tesseract-ocr libtesseract-dev
    echo "TESSERACT_CMD=/usr/bin/tesseract" >> .env
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install tesseract
    echo "TESSERACT_CMD=$(which tesseract)" >> .env
    
elif [[ "$OSTYPE" == "msys"* ]]; then
    # Windows (Git Bash)
    echo "Downloading Tesseract for Windows..."
    curl -L -o tesseract-installer.exe https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.0.20221222.exe
    ./tesseract-installer.exe /SILENT /NORESTART
    echo "TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe" >> .env
    rm tesseract-installer.exe
fi

# Generate secret key if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" >> .env
fi

# Create required directories
mkdir -p uploads
