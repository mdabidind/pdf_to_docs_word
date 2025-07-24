import os
from pdf2docx import Converter

def convert_pdf_to_word(pdf_file_path: str, word_output_path: str) -> None:
    """
    Converts a PDF file to a Word (.docx) document.

    Args:
        pdf_file_path (str): The full path to the input PDF file.
        word_output_path (str): The full path for the output Word (.docx) file.
                                 It should end with '.docx'.
    """
    # 1. Validate input PDF file existence
    if not os.path.exists(pdf_file_path):
        print(f"Error: PDF file not found at '{pdf_file_path}'")
        return

    # 2. Ensure the output path has the correct extension
    if not word_output_path.lower().endswith('.docx'):
        # If the user provides a path without .docx, append it.
        # This makes the function more robust.
        print(f"Warning: Word output path '{word_output_path}' does not end with '.docx'. Appending '.docx'.")
        word_output_path += '.docx'

    # 3. Get the directory for the output file and ensure it exists
    output_dir = os.path.dirname(word_output_path)
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
        except OSError as e:
            print(f"Error: Could not create directory '{output_dir}'. Reason: {e}")
            return

    # 4. Perform the conversion
    try:
        print(f"Attempting to convert '{pdf_file_path}' to '{word_output_path}'...")
        
        # Initialize the converter with the PDF file
        cv = Converter(pdf_file_path)
        
        # Convert the PDF to DOCX.
        # start=0 and end=None means convert all pages.
        cv.convert(word_output_path, start=0, end=None)
        
        # Close the converter to release resources
        cv.close()
        
        print(f"Successfully converted '{pdf_file_path}' to '{word_output_path}'")
    except Exception as e:
        print(f"An error occurred during conversion: {e}")
        print("Please ensure the PDF is not corrupted or password-protected (without providing password).")
        print("For password-protected PDFs, you might need to supply the password to the Converter.")

# --- Example Usage ---
if __name__ == "__main__":
    # IMPORTANT:
    # Replace 'path/to/your/sample.pdf' with the actual path to your PDF file.
    # Replace 'path/to/your/output_document.docx' with your desired output path.

    # Example 1: Basic conversion in the same directory
    # Create a dummy PDF for testing if you don't have one readily available.
    # In a real scenario, you would point to an existing PDF.
    
    # For demonstration, let's assume 'my_sample.pdf' exists in the same directory
    # as this script. If not, please create or place a PDF named 'my_sample.pdf'
    # for this example to work, or update the path.
    
    # Example PDF creation (requires PyPDF2, for demonstration only)
    # from PyPDF2 import PdfWriter
    # from reportlab.lib.pagesizes import letter
    # from reportlab.pdfgen import canvas
    # import io
    
    # def create_dummy_pdf(filename="my_sample.pdf"):
    #     packet = io.BytesIO()
    #     can = canvas.Canvas(packet, pagesize=letter)
    #     can.drawString(100, 750, "Hello, this is a sample PDF document.")
    #     can.drawString(100, 730, "It contains some sample text.")
    #     can.showPage()
    #     can.drawString(100, 750, "This is the second page.")
    #     can.save()
    #     packet.seek(0)
    #     with open(filename, "wb") as f:
    #         f.write(packet.getvalue())
    #     print(f"Dummy PDF '{filename}' created for testing.")

    # create_dummy_pdf("my_sample.pdf") # Uncomment to create a dummy PDF

    input_pdf_file = "my_sample.pdf" # Make sure this file exists for testing
    output_word_file = "converted_document.docx"
    
    print("--- Running Example 1 ---")
    convert_pdf_to_word(input_pdf_file, output_word_file)

    print("\n" + "="*50 + "\n")

    # Example 2: Conversion with specific input/output directories
    # Ensure these directories exist or are created by the script.
    # Let's assume 'input_pdfs' and 'output_docs' folders are relative to the script.
    
    # Create dummy directories for the example if they don't exist
    input_dir = "input_pdfs"
    output_dir = "output_docs"    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Place another dummy PDF in the 'input_pdfs' folder for this example
    # create_dummy_pdf(os.path.join(input_dir, "another_sample.pdf")) # Uncomment to create

    input_pdf_file_2 = os.path.join(input_dir, "another_sample.pdf") # Path to your second PDF
    output_word_file_2 = os.path.join(output_dir, "another_converted_doc.docx")

    print("--- Running Example 2 ---")
    convert_pdf_to_word(input_pdf_file_2, output_word_file_2)

    print("\nConversion process completed for all examples.")
    print("Check your directories for the generated Word
