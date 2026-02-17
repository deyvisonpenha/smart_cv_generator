import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file (bytes), removes excessive whitespace,
    and returns the cleaned text.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        
        # Clean text: remove excessive whitespace and special characters
        # Replace multiple spaces/newlines with a single space
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        
        return cleaned_text
    except Exception as e:
        raise ValueError(f"Error processing PDF: {str(e)}")
