import os
import shutil
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.services.ocr_service import extract_document_content
from backend.services.llm_service import extract_invoice_data, generate_invoice_summary, chat_with_invoice
from backend.services.validation_service import validate_invoice, InvoiceData, ValidationResponse
from backend.services.export_service import export_to_excel, export_to_csv, export_to_json

router = APIRouter()

# Temporary upload folder
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory single-session store for demo purposes
session_store = {
    "file_path": None,
    "filename": None,
    "file_type": None,
    "extracted_text": "",
    "is_scanned": False,
    "invoice_data": None,
    "summary": "",
    "chat_history": []
}

class ChatRequest(BaseModel):
    question: str
    history: List[Dict[str, str]]

@router.post("/upload")
async def upload_invoice(file: UploadFile = File(...)):
    """
    Upload an invoice (PDF or Image), extract raw text, and store in session.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in (".pdf", ".png", ".jpg", ".jpeg"):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, PNG, or JPG.")
        
    temp_file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file locally
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text/metadata
        ocr_result = extract_document_content(temp_file_path)
        
        # Save state
        session_store["file_path"] = temp_file_path
        session_store["filename"] = file.filename
        session_store["file_type"] = ocr_result["file_type"]
        session_store["extracted_text"] = ocr_result["text"]
        session_store["is_scanned"] = ocr_result["is_scanned"]
        # Reset downstream state
        session_store["invoice_data"] = None
        session_store["summary"] = ""
        session_store["chat_history"] = []
        
        # Copy file to a web-accessible static directory inside the backend or serve it directly
        # For simplicity, we return the path and basic info
        return {
            "filename": file.filename,
            "file_type": ocr_result["file_type"],
            "is_scanned": ocr_result["is_scanned"],
            "text_preview": ocr_result["text"][:500] if ocr_result["text"] else "Scanned document or image. Text will be extracted via LLM Vision."
        }
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@router.post("/upload-sample/{sample_name}")
async def upload_sample_invoice(sample_name: str):
    """
    Load a pre-configured sample invoice directly into the session for quick testing.
    """
    if sample_name not in ("acme", "supplies", "energy"):
        raise HTTPException(status_code=400, detail="Invalid sample name.")
        
    filename = f"sample_{sample_name}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            if sample_name == "acme":
                f.write("Acme IT Solutions Ltd\nInvoice: INV-2026-042\nDate: 2026-07-01\nDue Date: 2026-07-31\nTotal: 1540.00\nTax: 140.00\nLine Item: Cloud Infrastructure Hosting (June 2026) - Qty 1 - Price 800.00\nLine Item: Database Clustering & Managed Support - Qty 1 - Price 600.00")
            elif sample_name == "supplies":
                f.write("Global Office Supplies Inc.\nInvoice: GOS-998811\nDate: 2026-07-10\nDue Date: 2026-08-10\nTotal: 318.50\nTax: 28.50\nLine Item: Ergonomic Office Chair - Model X - Qty 1 - Price 250.00\nLine Item: Wireless Keyboard and Mouse Combo - Qty 1 - Price 40.00")
            elif sample_name == "energy":
                f.write("EcoPower Solutions\nInvoice: EP-44029\nDate: 2026-06-25\nDue Date: 2026-07-25\nTotal: 420.00\nTax: 70.00\nLine Item: Commercial Solar Maintenance - Monthly Fee - Qty 1 - Price 350.00")

    if sample_name == "acme":
        text = "Acme IT Solutions Ltd\nInvoice: INV-2026-042\nDate: 2026-07-01\nDue Date: 2026-07-31\nTotal: 1540.00\nTax: 140.00\nLine Item: Cloud Infrastructure Hosting (June 2026) - Qty 1 - Price 800.00\nLine Item: Database Clustering & Managed Support - Qty 1 - Price 600.00"
    elif sample_name == "supplies":
        text = "Global Office Supplies Inc.\nInvoice: GOS-998811\nDate: 2026-07-10\nDue Date: 2026-08-10\nTotal: 318.50\nTax: 28.50\nLine Item: Ergonomic Office Chair - Model X - Qty 1 - Price 250.00\nLine Item: Wireless Keyboard and Mouse Combo - Qty 1 - Price 40.00"
    else:
        text = "EcoPower Solutions\nInvoice: EP-44029\nDate: 2026-06-25\nDue Date: 2026-07-25\nTotal: 420.00\nTax: 70.00\nLine Item: Commercial Solar Maintenance - Monthly Fee - Qty 1 - Price 350.00"
        
    session_store["file_path"] = file_path
    session_store["filename"] = filename
    session_store["file_type"] = "pdf"
    session_store["extracted_text"] = text
    session_store["is_scanned"] = False
    session_store["invoice_data"] = None
    session_store["summary"] = ""
    session_store["chat_history"] = []
    
    return {
        "filename": filename,
        "file_type": "pdf",
        "is_scanned": False,
        "text_preview": text[:500]
    }

@router.post("/extract")
async def extract_invoice():
    """
    Run LLM structured extraction on the uploaded invoice raw text / image.
    """
    if not session_store["file_path"]:
        raise HTTPException(status_code=400, detail="No invoice uploaded. Please upload a file first.")
        
    try:
        doc_content = {
            "text": session_store["extracted_text"],
            "file_path": session_store["file_path"],
            "file_type": session_store["file_type"],
            "is_scanned": session_store["is_scanned"]
        }
        
        invoice_data = extract_invoice_data(doc_content)
        session_store["invoice_data"] = invoice_data
        
        return invoice_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data extraction failed: {str(e)}")

@router.post("/validate")
async def validate_invoice_data(invoice: InvoiceData):
    """
    Validate the provided invoice data (or updated data from frontend) and check rules.
    """
    try:
        # Cache updated data in session (if user edited fields on frontend)
        session_store["invoice_data"] = invoice
        
        validation_resp = validate_invoice(invoice)
        return validation_resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/summary")
async def get_invoice_summary():
    """
    Generate an AI summary of the uploaded invoice.
    """
    invoice = session_store["invoice_data"]
    if not invoice:
        raise HTTPException(status_code=400, detail="No structured invoice data available. Run extraction first.")
        
    try:
        summary_md = generate_invoice_summary(invoice, session_store["extracted_text"])
        session_store["summary"] = summary_md
        return {"summary": summary_md}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@router.post("/chat")
async def chat_invoice(request: ChatRequest):
    """
    Ask a question about the invoice.
    """
    invoice = session_store["invoice_data"]
    if not invoice:
        raise HTTPException(status_code=400, detail="No invoice data available. Please upload and extract first.")
        
    try:
        answer = chat_with_invoice(
            invoice=invoice,
            raw_text=session_store["extracted_text"],
            question=request.question,
            history=request.history
        )
        
        # Update history
        updated_history = list(request.history)
        updated_history.append({"role": "user", "content": request.question})
        updated_history.append({"role": "assistant", "content": answer})
        
        session_store["chat_history"] = updated_history
        
        return {
            "answer": answer,
            "history": updated_history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat query failed: {str(e)}")

@router.get("/export/json")
async def export_json():
    """
    Export structured invoice as JSON.
    """
    invoice = session_store["invoice_data"]
    if not invoice:
        raise HTTPException(status_code=400, detail="No structured data to export. Perform extraction first.")
    
    file_bytes = export_to_json(invoice)
    return StreamingResponse(
        io_bytes_stream(file_bytes),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={session_store['filename'] or 'invoice'}.json"}
    )

@router.get("/export/csv")
async def export_csv():
    """
    Export structured invoice as CSV.
    """
    invoice = session_store["invoice_data"]
    if not invoice:
        raise HTTPException(status_code=400, detail="No structured data to export. Perform extraction first.")
        
    file_bytes = export_to_csv(invoice)
    return StreamingResponse(
        io_bytes_stream(file_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={session_store['filename'] or 'invoice'}.csv"}
    )

@router.get("/export/excel")
async def export_excel():
    """
    Export structured invoice as Excel.
    """
    invoice = session_store["invoice_data"]
    if not invoice:
        raise HTTPException(status_code=400, detail="No structured data to export. Perform extraction first.")
        
    file_bytes = export_to_excel(invoice)
    return StreamingResponse(
        io_bytes_stream(file_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={session_store['filename'] or 'invoice'}.xlsx"}
    )

def io_bytes_stream(data: bytes):
    """
    Helper to yield byte stream for StreamingResponse.
    """
    yield data
