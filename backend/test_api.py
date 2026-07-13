import os
import io
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.services.validation_service import InvoiceData, LineItem

client = TestClient(app)

class TestInvoiceFlowAPI(unittest.TestCase):
    
    def setUp(self):
        from unittest.mock import patch
        self.patcher = patch('backend.services.llm_service.get_llm_client', return_value={"provider": "mock", "client": None})
        self.patcher.start()
        # Create a dummy PDF/text file for upload testing
        self.dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        self.dummy_text_content = b"Acme IT Solutions Ltd\nInvoice: INV-2026-042\nDate: 2026-07-01\nDue Date: 2026-07-31\nTotal: 1540.00\nTax: 140.00\nLine Item: Cloud Infrastructure Hosting (June 2026) - Qty 1 - Price 800.00\nLine Item: Database Clustering & Managed Support - Qty 1 - Price 600.00"
        
    def tearDown(self):
        self.patcher.stop()
        
    def test_root_endpoint(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("online", response.json()["message"].lower())

    def test_upload_invoice(self):
        # Test PDF upload
        files = {"file": ("test_invoice.pdf", io.BytesIO(self.dummy_text_content), "application/pdf")}
        response = client.post("/api/upload", files=files)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["filename"], "test_invoice.pdf")
        self.assertEqual(json_data["file_type"], "pdf")
        
    def test_extract_invoice(self):
        # Upload first to populate session
        files = {"file": ("acme_invoice.pdf", io.BytesIO(self.dummy_text_content), "application/pdf")}
        client.post("/api/upload", files=files)
        
        # Call extraction
        response = client.post("/api/extract")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["vendor_name"], "Acme IT Solutions Ltd")
        self.assertEqual(data["invoice_number"], "INV-2026-042")
        self.assertEqual(float(data["total_amount"]), 1540.0)
        self.assertEqual(len(data["line_items"]), 2)
        
    def test_validate_invoice(self):
        # 1. Test Valid Invoice
        valid_payload = {
            "vendor_name": "Acme IT Solutions Ltd",
            "invoice_number": "INV-2026-042",
            "invoice_date": "2026-07-01",
            "due_date": "2026-07-31",
            "currency": "USD",
            "total_amount": 1540.00,
            "tax_amount": 140.00,
            "gst_vat_number": "US987654321",
            "line_items": [
                {"description": "Cloud Hosting", "quantity": 1, "unit_price": 800.0, "total_price": 800.0},
                {"description": "Support", "quantity": 1, "unit_price": 600.0, "total_price": 600.0}
            ]
        }
        response = client.post("/api/validate", json=valid_payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["is_valid"])
        self.assertGreaterEqual(res["confidence_score"], 80)
        
        # 2. Test Invalid/Calculations Discrepancy Invoice
        invalid_payload = valid_payload.copy()
        invalid_payload["total_amount"] = 5000.00  # Total mismatch
        
        response = client.post("/api/validate", json=invalid_payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertFalse(res["is_valid"])
        self.assertLessEqual(res["confidence_score"], 80)
        self.assertTrue(any(check["status"] == "error" for check in res["validation_checks"]))
        
    def test_summary_and_chat(self):
        # Upload & Extract first
        files = {"file": ("acme_invoice.pdf", io.BytesIO(self.dummy_text_content), "application/pdf")}
        client.post("/api/upload", files=files)
        client.post("/api/extract")
        
        # Call Summary
        sum_response = client.post("/api/summary")
        self.assertEqual(sum_response.status_code, 200)
        self.assertIn("summary", sum_response.json())
        
        # Call Chat
        chat_payload = {
            "question": "What is the total amount?",
            "history": []
        }
        chat_response = client.post("/api/chat", json=chat_payload)
        self.assertEqual(chat_response.status_code, 200)
        res = chat_response.json()
        self.assertIn("answer", res)
        self.assertGreater(len(res["history"]), 0)

    def test_exports(self):
        # Upload & Extract first
        files = {"file": ("acme_invoice.pdf", io.BytesIO(self.dummy_text_content), "application/pdf")}
        client.post("/api/upload", files=files)
        client.post("/api/extract")
        
        # JSON
        r_json = client.get("/api/export/json")
        self.assertEqual(r_json.status_code, 200)
        self.assertEqual(r_json.headers["content-type"], "application/json")
        
        # CSV
        r_csv = client.get("/api/export/csv")
        self.assertEqual(r_csv.status_code, 200)
        self.assertIn("text/csv", r_csv.headers["content-type"])
        
        # Excel
        r_xlsx = client.get("/api/export/excel")
        self.assertEqual(r_xlsx.status_code, 200)
        self.assertIn("spreadsheet", r_xlsx.headers["content-type"])

if __name__ == "__main__":
    unittest.main()
