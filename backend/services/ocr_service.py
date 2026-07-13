import fitz  # PyMuPDF
import os
from typing import Dict, Any

def extract_document_content(file_path: str) -> Dict[str, Any]:
    """
    Extracts text content from a PDF or determines if it is an image / scanned document.
    """
    _, ext = os.path.splitext(file_path.lower())
    
    result = {
        "text": "",
        "file_type": "pdf" if ext == ".pdf" else "image",
        "is_scanned": False,
        "file_path": file_path
    }
    
    if ext == ".pdf":
        try:
            doc = fitz.open(file_path)
            extracted_text = []
            for page in doc:
                text_page = page.get_text()
                extracted_text.append(text_page)
            
            combined_text = "\n".join(extracted_text).strip()
            result["text"] = combined_text
            
            # If the PDF contains very little text (e.g., scanned page), mark it as scanned
            if len(combined_text) < 50:
                result["is_scanned"] = True
            
        except Exception as e:
            # If parsing fails, fall back to marking it as scanned
            result["is_scanned"] = True
            result["text"] = f"Error reading PDF text: {str(e)}"
    else:
        # Images are inherently scanned/non-searchable text
        result["is_scanned"] = True
        
    return result
