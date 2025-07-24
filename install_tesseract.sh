#!/bin/bash

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    touch .env
fi

# Install Tesseract based on OS
case "$(uname -s)" in
    Linux*)
        echo "Installing Tesseract for Linux..."
        sudo apt update
        sudo apt install -y tesseract-ocr libtesseract-dev
        echo "TESSERACT_CMD=/usr/bin/tesseract" >> .env
        ;;
    Darwin*)
        echo "Installing Tesseract for macOS..."
        if ! command -v brew &> /dev/null; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install tesseract
        echo "TESSERACT_CMD=$(brew --prefix tesseract)/bin/tesseract" >> .env
        ;;
    MINGW*|CYGWIN*|MSYS*)
        echo "Installing Tesseract for Windows..."
        curl -L -o tesseract-installer.exe https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.0.20221222.exe
        ./tesseract-installer.exe /SILENT /NORESTART
        echo "TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe" >> .env
        rm -f tesseract-installer.exe
        ;;
    *)
        echo "Unsupported OS. Trying to use system Tesseract..."
        echo "TESSERACT_CMD=tesseract" >> .env
        ;;
esac

# Generate secret key if not exists
if ! grep -q "SECRET_KEY" .env; then
    echo "Generating secret key..."
    if command -v python3 &> /dev/null; then
        echo "SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" >> .env
    else
        echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
    fi
fi

# Create required directories
mkdir -p uploads
echo "Setup completed successfully!"
