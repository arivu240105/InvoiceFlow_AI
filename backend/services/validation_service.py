from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total_price: float

class InvoiceData(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: str = "USD"
    total_amount: float = 0.0
    tax_amount: float = 0.0
    gst_vat_number: Optional[str] = None
    line_items: List[LineItem] = []

class ValidationCheck(BaseModel):
    field: str
    status: str  # "success", "warning", "error"
    message: str

class RiskCheck(BaseModel):
    risk_type: str
    severity: str  # "low", "medium", "high"
    message: str

class ValidationResponse(BaseModel):
    confidence_score: int
    validation_checks: List[ValidationCheck]
    risk_checks: List[RiskCheck]
    is_valid: bool

def validate_invoice(invoice: InvoiceData) -> ValidationResponse:
    checks = []
    risks = []
    errors_count = 0
    warnings_count = 0
    
    # 1. Mandatory Field Checks
    if not invoice.vendor_name or invoice.vendor_name.strip() == "":
        checks.append(ValidationCheck(
            field="vendor_name",
            status="error",
            message="Supplier/Vendor name is missing."
        ))
        risks.append(RiskCheck(
            risk_type="Missing Supplier Information",
            severity="high",
            message="No supplier name was identified, which makes auditing difficult."
        ))
        errors_count += 1
    else:
        checks.append(ValidationCheck(
            field="vendor_name",
            status="success",
            message=f"Supplier identified: {invoice.vendor_name}"
        ))

    if not invoice.invoice_number or invoice.invoice_number.strip() == "":
        checks.append(ValidationCheck(
            field="invoice_number",
            status="error",
            message="Invoice number is missing."
        ))
        risks.append(RiskCheck(
            risk_type="Missing Invoice Number",
            severity="high",
            message="An invoice must have a unique identifier to prevent duplicate entries."
        ))
        errors_count += 1
    else:
        checks.append(ValidationCheck(
            field="invoice_number",
            status="success",
            message=f"Invoice number identified: {invoice.invoice_number}"
        ))

    if not invoice.invoice_date or invoice.invoice_date.strip() == "":
        checks.append(ValidationCheck(
            field="invoice_date",
            status="error",
            message="Invoice date is missing."
        ))
        errors_count += 1
    else:
        checks.append(ValidationCheck(
            field="invoice_date",
            status="success",
            message=f"Invoice date identified: {invoice.invoice_date}"
        ))

    # 2. Date Logic Check
    if invoice.invoice_date and invoice.due_date:
        try:
            # Parse dates to verify chronological order
            # Handle common formats
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
                try:
                    inv_dt = datetime.strptime(invoice.invoice_date, fmt)
                    due_dt = datetime.strptime(invoice.due_date, fmt)
                    if due_dt < inv_dt:
                        checks.append(ValidationCheck(
                            field="due_date",
                            status="warning",
                            message="Due date is earlier than the invoice date."
                        ))
                        risks.append(RiskCheck(
                            risk_type="Chronological Inconsistency",
                            severity="medium",
                            message=f"Due date ({invoice.due_date}) occurs before invoice date ({invoice.invoice_date})."
                        ))
                        warnings_count += 1
                    else:
                        checks.append(ValidationCheck(
                            field="due_date",
                            status="success",
                            message="Due date check passed."
                        ))
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    # 3. Calculation Integrity Checks
    # Check 3a: Line item math (Quantity * Unit Price == Total Price)
    item_math_errors = 0
    for idx, item in enumerate(invoice.line_items):
        expected_total = round(item.quantity * item.unit_price, 2)
        actual_total = round(item.total_price, 2)
        if abs(expected_total - actual_total) > 0.02:
            item_math_errors += 1
            checks.append(ValidationCheck(
                field=f"line_items[{idx}].total_price",
                status="warning",
                message=f"Line item '{item.description}' quantity ({item.quantity}) * unit price ({item.unit_price}) = {expected_total}, but total is {actual_total}."
            ))
            
    if item_math_errors > 0:
        risks.append(RiskCheck(
            risk_type="Incorrect Line Item Calculation",
            severity="medium",
            message=f"Detected calculation discrepancy in {item_math_errors} line item(s)."
        ))
        warnings_count += item_math_errors

    # Check 3b: Subtotal + Tax == Total Amount
    line_items_sum = sum(item.total_price for item in invoice.line_items)
    
    if invoice.line_items:
        # Check if line items total matches the invoice total (within tax)
        expected_total_with_tax = round(line_items_sum + invoice.tax_amount, 2)
        diff = abs(expected_total_with_tax - round(invoice.total_amount, 2))
        
        if diff > 0.05:
            checks.append(ValidationCheck(
                field="total_amount",
                status="error",
                message=f"Sum of line items ({line_items_sum:.2f}) + tax ({invoice.tax_amount:.2f}) = {expected_total_with_tax:.2f}, but total is {invoice.total_amount:.2f}."
            ))
            risks.append(RiskCheck(
                risk_type="Total Amount Discrepancy",
                severity="high",
                message=f"The invoice total amount ({invoice.total_amount:.2f}) does not match the sum of line items + tax ({expected_total_with_tax:.2f})."
            ))
            errors_count += 1
        else:
            checks.append(ValidationCheck(
                field="total_amount",
                status="success",
                message="Subtotal + Tax matches total amount."
            ))
    else:
        # If no line items, verify amount is positive
        if invoice.total_amount <= 0:
            checks.append(ValidationCheck(
                field="total_amount",
                status="error",
                message="Total invoice amount must be greater than zero."
            ))
            errors_count += 1

    # 4. Tax / GST Checks
    if invoice.tax_amount > 0 and (not invoice.gst_vat_number or invoice.gst_vat_number.strip() == ""):
        checks.append(ValidationCheck(
            field="gst_vat_number",
            status="warning",
            message="Tax is charged but no GST/VAT ID is specified."
        ))
        risks.append(RiskCheck(
            risk_type="Missing GST/VAT Registration",
            severity="medium",
            message="Invoice contains tax charges but is missing the vendor's GST/VAT registration number, which could affect tax deductibility."
        ))
        warnings_count += 1
    elif invoice.gst_vat_number:
        checks.append(ValidationCheck(
            field="gst_vat_number",
            status="success",
            message=f"GST/VAT identifier found: {invoice.gst_vat_number}"
        ))

    # Calculate Confidence Score
    # Starting at 100
    confidence = 100
    confidence -= (errors_count * 20)
    confidence -= (warnings_count * 8)
    
    # Check if optional but important fields are missing
    if not invoice.due_date:
        confidence -= 5
    if not invoice.gst_vat_number:
        confidence -= 5

    confidence = max(0, min(100, confidence))
    is_valid = (errors_count == 0)

    return ValidationResponse(
        confidence_score=confidence,
        validation_checks=checks,
        risk_checks=risks,
        is_valid=is_valid
    )
