#!/usr/bin/env python3
import sys
import os
from pdf2docx import Converter
from github import Github
import traceback

def convert_pdf_to_word(pdf_path, output_path):
    """Convert PDF to Word document"""
    try:
        cv = Converter(pdf_path)
        cv.convert(output_path)
        cv.close()
        return True
    except Exception as e:
        print(f"Conversion error: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert.py input.pdf output.docx")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found", file=sys.stderr)
        sys.exit(1)
    
    if convert_pdf_to_word(input_file, output_file):
        print(f"Successfully converted {input_file} to {output_file}")
        
        # Optional: Create GitHub release with the converted file
        if 'GITHUB_TOKEN' in os.environ:
            try:
                g = Github(os.environ['GITHUB_TOKEN'])
                repo = g.get_repo("mdabidind/pdf_to_docs_word")
                release = repo.create_git_release(
                    tag="conversion",
                    name="PDF Conversion Result",
                    message="Automated conversion from PDF to Word",
                    draft=False,
                    prerelease=False
                )
                release.upload_asset(output_file)
                print("Uploaded result to GitHub releases")
            except Exception as e:
                print(f"GitHub upload error: {str(e)}", file=sys.stderr)
        
        sys.exit(0)
    else:
        print(f"Failed to convert {input_file}", file=sys.stderr)
        sys.exit(1)
