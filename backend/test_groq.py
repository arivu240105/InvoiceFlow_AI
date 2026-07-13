import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from backend.services.validation_service import InvoiceData

load_dotenv()

dummy_text_content = """Acme IT Solutions Ltd
Invoice: INV-2026-042
Date: 2026-07-01
Due Date: 2026-07-31
Total: 1540.00
Tax: 140.00
Line Item: Cloud Infrastructure Hosting (June 2026) - Qty 1 - Price 800.00
Line Item: Database Clustering & Managed Support - Qty 1 - Price 600.00"""

groq_key = os.getenv("GROQ_API_KEY")
print("Key exists:", bool(groq_key))

client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
model = "llama-3.3-70b-versatile"

schema_instruction = """
You must return a JSON object with this structure:
{
  "vendor_name": "string",
  "invoice_number": "string",
  "invoice_date": "string (YYYY-MM-DD)",
  "due_date": "string (YYYY-MM-DD or null)",
  "currency": "string (e.g. USD, EUR)",
  "total_amount": float,
  "tax_amount": float,
  "gst_vat_number": "string or null",
  "line_items": [
    {
      "description": "string",
      "quantity": float,
      "unit_price": float,
      "total_price": float
    }
  ]
}
"""

try:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": f"Extract invoice information into JSON format. Schema: {schema_instruction}"},
            {"role": "user", "content": dummy_text_content}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    content = response.choices[0].message.content
    print("RAW CONTENT:", content)
    data = json.loads(content)
    inv = InvoiceData(**data)
    print("PARSED:", inv.model_dump())
except Exception as e:
    print("ERROR:", e)
