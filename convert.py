#!/usr/bin/env python3
import os
import sys
import base64
from pdf2docx import Converter

def convert_pdf_to_word(pdf_path, output_path):
    try:
        cv = Converter(pdf_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return True
    except Exception as e:
        print(f"Conversion error: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert.py input.pdf output.docx")
        sys.exit(1)
    
    if convert_pdf_to_word(sys.argv[1], sys.argv[2]):
        print("Conversion successful")
        sys.exit(0)
    else:
        print("Conversion failed")
        sys.exit(1)
