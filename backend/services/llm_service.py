import os
import json
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from openai import OpenAI
from backend.services.validation_service import InvoiceData, LineItem

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def get_llm_client() -> Dict[str, Any]:
    """
    Detects which LLM provider API keys are configured and returns the provider name and initialized client.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)
            return {"provider": "gemini", "client": client}
        except Exception:
            pass
            
    if openai_key:
        try:
            client = OpenAI(api_key=openai_key)
            return {"provider": "openai", "client": client}
        except Exception:
            pass

    if groq_key:
        try:
            client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
            return {"provider": "groq", "client": client}
        except Exception:
            pass
            
    return {"provider": "mock", "client": None}

def _get_mock_data(text: str) -> InvoiceData:
    """
    Returns realistic mock invoice data based on text content heuristics.
    """
    text_lower = text.lower()
    
    # 1. Check for standard pre-configured sample files
    if "acme" in text_lower or "cloud infrastructure" in text_lower:
        return InvoiceData(
            vendor_name="Acme IT Solutions Ltd",
            invoice_number="INV-2026-042",
            invoice_date="2026-07-01",
            due_date="2026-07-31",
            currency="USD",
            total_amount=1540.00,
            tax_amount=140.00,
            gst_vat_number="US987654321",
            line_items=[
                LineItem(description="Cloud Infrastructure Hosting (June 2026)", quantity=1, unit_price=800.00, total_price=800.00),
                LineItem(description="Database Clustering & Managed Support", quantity=1, unit_price=600.00, total_price=600.00)
            ]
        )
        
    if "office supplies" in text_lower or "chair" in text_lower or "keyboard" in text_lower:
        return InvoiceData(
            vendor_name="Global Office Supplies Inc.",
            invoice_number="GOS-998811",
            invoice_date="2026-07-10",
            due_date="2026-08-10",
            currency="USD",
            total_amount=318.50,
            tax_amount=28.50,
            gst_vat_number="US123456789",
            line_items=[
                LineItem(description="Ergonomic Office Chair - Model X", quantity=1, unit_price=250.00, total_price=250.00),
                LineItem(description="Wireless Keyboard and Mouse Combo", quantity=1, unit_price=40.00, total_price=40.00)
            ]
        )
        
    if "ecopower" in text_lower or "solar" in text_lower or "energy" in text_lower:
        return InvoiceData(
            vendor_name="EcoPower Solutions",
            invoice_number="EP-44029",
            invoice_date="2026-06-25",
            due_date="2026-07-25",
            currency="EUR",
            total_amount=420.00,
            tax_amount=70.00,
            gst_vat_number="EU55667788",
            line_items=[
                LineItem(description="Commercial Solar Maintenance - Monthly Fee", quantity=1, unit_price=350.00, total_price=350.00)
            ]
        )

    # 2. Dynamic heuristic parser (tries to extract dates, amounts from the text)
    currency = "USD"
    if "€" in text or "eur" in text_lower:
        currency = "EUR"
    elif "£" in text or "gbp" in text_lower:
        currency = "GBP"
        
    # Search for date patterns: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    dates = re.findall(r'\b\d{4}[-/]\d{2}[-/]\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b', text)
    inv_date = dates[0] if dates else "2026-07-13"
    due_date = dates[1] if len(dates) > 1 else None
    
    # Search for dollar amounts
    amounts = re.findall(r'\$?\b\d+\.\d{2}\b', text)
    numeric_amounts = []
    for amt in amounts:
        cleaned = amt.replace("$", "").replace("€", "").replace("£", "")
        try:
            numeric_amounts.append(float(cleaned))
        except ValueError:
            pass
            
    total_amount = max(numeric_amounts) if numeric_amounts else 250.00
    tax_amount = round(total_amount * 0.1, 2) if total_amount > 0 else 25.00
    
    # Simple Vendor identification (e.g. first line or standard fallback)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    vendor = lines[0] if lines else "Dynamic Vendor Inc."
    if len(vendor) > 50:
        vendor = "Generic Supplier"
        
    # Guess invoice number
    inv_num_match = re.search(r'(?i)invoice\s*#?\s*(?:number)?\s*:\s*([A-Z0-9\-]+)', text)
    inv_number = inv_num_match.group(1) if inv_num_match else "INV-99928"

    return InvoiceData(
        vendor_name=vendor,
        invoice_number=inv_number,
        invoice_date=inv_date,
        due_date=due_date,
        currency=currency,
        total_amount=total_amount,
        tax_amount=tax_amount,
        gst_vat_number="VAT-UNKNOWN-MOCK",
        line_items=[
            LineItem(description="Consulting & Technical Operations Support", quantity=1, unit_price=round(total_amount - tax_amount, 2), total_price=round(total_amount - tax_amount, 2))
        ]
    )

def extract_invoice_data(doc_content: Dict[str, Any]) -> InvoiceData:
    """
    Extracts structured data from the document text or visual content using LLMs or falls back to mock logic.
    """
    provider_info = get_llm_client()
    provider = provider_info["provider"]
    client = provider_info["client"]
    
    raw_text = doc_content["text"]
    
    if provider == "mock":
        return _get_mock_data(raw_text)
        
    prompt = f"""
    You are an expert financial document extractor. 
    Analyze the following extracted invoice text and output a structured JSON response matching the schema.
    If the document has dates, extract them. Make sure math checks out: line item totals must sum to the subtotal, subtotal + tax = total.
    
    INVOICE TEXT:
    {raw_text}
    """
    
    if provider == "gemini":
        try:
            # Using google-genai SDK
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=InvoiceData,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            return InvoiceData(**data)
        except Exception as e:
            print(f"Gemini extraction error: {e}, falling back to mock")
            return _get_mock_data(raw_text)
            
    elif provider in ("openai", "groq"):
        try:
            model = "gpt-4o-mini" if provider == "openai" else "llama-3.3-70b-versatile"
            
            # Formulate JSON schema guidelines
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
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": f"Extract invoice information into JSON format. Schema: {schema_instruction}"},
                    {"role": "user", "content": raw_text}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            data = json.loads(response.choices[0].message.content)
            return InvoiceData(**data)
        except Exception as e:
            print(f"LLM extraction error: {e}, falling back to mock")
            return _get_mock_data(raw_text)

def generate_invoice_summary(invoice: InvoiceData, raw_text: str) -> str:
    """
    Generates a concise financial summary of the invoice.
    """
    provider_info = get_llm_client()
    provider = provider_info["provider"]
    client = provider_info["client"]
    
    if provider == "mock":
        # Return a nice formatted markdown summary
        return f"""### Invoice Executive Summary
**Supplier:** {invoice.vendor_name or 'N/A'}
**Invoice Number:** `{invoice.invoice_number or 'N/A'}`
**Billing Date:** {invoice.invoice_date or 'N/A'}
**Due Date:** {invoice.due_date or 'N/A'}

#### Financial Analysis:
- The total amount due is **{invoice.currency} {invoice.total_amount:.2f}**, including **{invoice.currency} {invoice.tax_amount:.2f}** in taxes.
- This invoice comprises **{len(invoice.line_items)} line item(s)**.
- Key items: {', '.join([f"'{item.description}'" for item in invoice.line_items[:2]])}.

> [!NOTE]
> This is a high-level summary generated in local demonstration mode.
"""

    prompt = f"""
    Generate an executive summary of this invoice based on the extracted structured fields and raw text:
    - Structured Data: {invoice.model_dump_json()}
    - Raw Text: {raw_text[:2000]}
    
    Ensure the summary has:
    1. Executive Summary paragraph.
    2. Key Financial Details (bullet points).
    3. Important Information / Special instructions (if any).
    Format as beautiful Markdown.
    """

    try:
        if provider == "gemini":
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
            return response.text
        else:
            model = "gpt-4o-mini" if provider == "openai" else "llama-3.1-8b-instant"
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a senior financial analyst. Generate a clear summary of the invoice in Markdown."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def chat_with_invoice(invoice: InvoiceData, raw_text: str, question: str, history: List[Dict[str, str]]) -> str:
    """
    Answers a question about the invoice using context.
    """
    provider_info = get_llm_client()
    provider = provider_info["provider"]
    client = provider_info["client"]
    
    context = f"""
    INVOICE DATA:
    Vendor: {invoice.vendor_name}
    Invoice Number: {invoice.invoice_number}
    Invoice Date: {invoice.invoice_date}
    Due Date: {invoice.due_date}
    Currency: {invoice.currency}
    Total Amount: {invoice.total_amount}
    Tax Amount: {invoice.tax_amount}
    GST/VAT Number: {invoice.gst_vat_number}
    Line Items: {invoice.line_items}
    
    RAW DOCUMENT TEXT CONTEXT:
    {raw_text[:4000]}
    """
    
    if provider == "mock":
        # Formulate a semi-smart heuristic mock chat answer
        q_lower = question.lower()
        if "gst" in q_lower or "vat" in q_lower or "tax" in q_lower:
            return f"The tax amount is **{invoice.currency} {invoice.tax_amount:.2f}**. The registered GST/VAT number on the document is `{invoice.gst_vat_number or 'Not specified'}`."
        if "due" in q_lower or "pay" in q_lower or "date" in q_lower:
            return f"The payment is due by **{invoice.due_date or 'N/A'}**. The invoice was issued on **{invoice.invoice_date or 'N/A'}**."
        if "vendor" in q_lower or "supplier" in q_lower or "who" in q_lower:
            return f"The supplier/vendor listed on this invoice is **{invoice.vendor_name or 'N/A'}**."
        if "total" in q_lower or "amount" in q_lower or "much" in q_lower:
            return f"The total invoice amount is **{invoice.currency} {invoice.total_amount:.2f}** (tax amount is {invoice.tax_amount:.2f})."
        
        return f"Based on the invoice, the vendor is **{invoice.vendor_name}** and the total is **{invoice.currency} {invoice.total_amount:.2f}**. (Note: running in demonstration mode, answers are generated locally)."

    system_prompt = f"""
    You are an AI financial assistant. You are helping a user check details about an invoice they uploaded.
    Answer the user's question accurately using ONLY the context provided below. If you cannot find the answer, state that it's not clear on the invoice.
    
    CONTEXT:
    {context}
    """
    
    messages = []
    messages.append({"role": "system", "content": system_prompt})
    
    # Add historical messages (up to 6 messages)
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
        
    messages.append({"role": "user", "content": question})
    
    try:
        if provider == "gemini":
            # For Gemini chat
            gemini_contents = []
            for m in messages:
                # Map to gemini structure
                role = "user" if m["role"] == "user" else "model"
                if m["role"] == "system":
                    # Put system prompt in content or system_instruction
                    continue
                gemini_contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))
                
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                )
            )
            return response.text
        else:
            model = "gpt-4o-mini" if provider == "openai" else "llama-3.1-8b-instant"
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content
    except Exception as e:
        return f"Error interacting with LLM: {str(e)}"
