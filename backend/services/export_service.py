import json
import io
import pandas as pd
from backend.services.validation_service import InvoiceData

def export_to_json(invoice: InvoiceData) -> bytes:
    """
    Exports structured invoice data as a JSON byte string.
    """
    data = invoice.model_dump()
    return json.dumps(data, indent=2).encode('utf-8')

def export_to_csv(invoice: InvoiceData) -> bytes:
    """
    Exports invoice data to a flat CSV format for spreadsheet integration.
    """
    rows = []
    if invoice.line_items:
        for item in invoice.line_items:
            rows.append({
                "Vendor": invoice.vendor_name,
                "Invoice Number": invoice.invoice_number,
                "Invoice Date": invoice.invoice_date,
                "Due Date": invoice.due_date,
                "Currency": invoice.currency,
                "Total Amount": invoice.total_amount,
                "Tax Amount": invoice.tax_amount,
                "GST VAT Number": invoice.gst_vat_number,
                "Item Description": item.description,
                "Item Quantity": item.quantity,
                "Item Unit Price": item.unit_price,
                "Item Total Price": item.total_price
            })
    else:
        # Fallback if no line items
        rows.append({
            "Vendor": invoice.vendor_name,
            "Invoice Number": invoice.invoice_number,
            "Invoice Date": invoice.invoice_date,
            "Due Date": invoice.due_date,
            "Currency": invoice.currency,
            "Total Amount": invoice.total_amount,
            "Tax Amount": invoice.tax_amount,
            "GST VAT Number": invoice.gst_vat_number,
            "Item Description": "",
            "Item Quantity": 0,
            "Item Unit Price": 0.0,
            "Item Total Price": 0.0
        })
        
    df = pd.DataFrame(rows)
    
    # Write to a CSV buffer
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue().encode('utf-8')

def export_to_excel(invoice: InvoiceData) -> bytes:
    """
    Generates a beautifully formatted Excel invoice summary sheet using openpyxl.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Invoice Summary"
    
    # Enable grid lines
    ws.views.sheetView[0].showGridLines = True
    
    # Styles
    font_title = Font(name="Calibri", size=16, bold=True, color="1F497D")
    font_subtitle = Font(name="Calibri", size=12, bold=True, color="1F497D")
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True)
    font_normal = Font(name="Calibri", size=11)
    
    fill_header = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
    fill_accent = PatternFill(start_color="DCE6F1", end_color="DCE6F1", fill_type="solid")
    
    border_thin = Side(border_style="thin", color="D3D3D3")
    border_double = Side(border_style="double", color="1F497D")
    border_medium = Side(border_style="medium", color="1F497D")
    
    box_border = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)
    bottom_double_border = Border(bottom=border_double, top=border_thin)
    header_border = Border(bottom=border_medium)
    
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")
    align_center = Alignment(horizontal="center", vertical="center")
    
    # Header block
    ws['A1'] = "InvoiceFlow AI - Structured Export"
    ws['A1'].font = font_title
    ws.merge_cells('A1:E1')
    
    # Meta Details (Row 3 to 7)
    meta_details = [
        ("Vendor Name:", invoice.vendor_name, "Invoice Number:", invoice.invoice_number),
        ("Invoice Date:", invoice.invoice_date, "Due Date:", invoice.due_date),
        ("Currency:", invoice.currency, "GST/VAT Registration:", invoice.gst_vat_number),
        ("Total Amount:", invoice.total_amount, "Tax Amount:", invoice.tax_amount)
    ]
    
    row_num = 3
    for m in meta_details:
        ws.cell(row=row_num, column=1, value=m[0]).font = font_bold
        ws.cell(row=row_num, column=1).alignment = align_left
        
        val_cell_1 = ws.cell(row=row_num, column=2, value=m[1])
        val_cell_1.font = font_normal
        val_cell_1.alignment = align_left
        
        ws.cell(row=row_num, column=4, value=m[2]).font = font_bold
        ws.cell(row=row_num, column=4).alignment = align_left
        
        val_cell_2 = ws.cell(row=row_num, column=5, value=m[3])
        val_cell_2.font = font_normal
        val_cell_2.alignment = align_left
        
        # Formatting total/tax values
        if "Amount" in m[0]:
            val_cell_1.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
        if "Amount" in m[2]:
            val_cell_2.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
            
        row_num += 1
        
    # Table Header for Line Items (Row 9)
    ws.cell(row=9, column=1, value="Line Items").font = font_subtitle
    ws.merge_cells('A9:E9')
    
    headers = ["#", "Description", "Quantity", "Unit Price", "Total Price"]
    for col_idx, text in enumerate(headers, 1):
        cell = ws.cell(row=10, column=col_idx, value=text)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center if col_idx in (1, 3) else (align_right if col_idx >= 4 else align_left)
        cell.border = header_border
        
    # Table Content
    item_start_row = 11
    current_row = item_start_row
    
    for idx, item in enumerate(invoice.line_items, 1):
        ws.cell(row=current_row, column=1, value=idx).alignment = align_center
        ws.cell(row=current_row, column=2, value=item.description).alignment = align_left
        ws.cell(row=current_row, column=3, value=item.quantity).alignment = align_center
        
        cell_unit = ws.cell(row=current_row, column=4, value=item.unit_price)
        cell_unit.alignment = align_right
        cell_unit.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
        
        cell_total = ws.cell(row=current_row, column=5, value=item.total_price)
        cell_total.alignment = align_right
        cell_total.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
        
        for col_idx in range(1, 6):
            c = ws.cell(row=current_row, column=col_idx)
            c.font = font_normal
            c.border = box_border
            
        current_row += 1
        
    # Total calculations block
    ws.cell(row=current_row, column=4, value="Subtotal:").font = font_bold
    ws.cell(row=current_row, column=4).alignment = align_right
    subtotal_cell = ws.cell(row=current_row, column=5, value=f"=SUM(E{item_start_row}:E{current_row-1})")
    subtotal_cell.font = font_bold
    subtotal_cell.alignment = align_right
    subtotal_cell.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
    ws.cell(row=current_row, column=5).border = box_border
    
    current_row += 1
    ws.cell(row=current_row, column=4, value="Tax Amount:").font = font_bold
    ws.cell(row=current_row, column=4).alignment = align_right
    tax_cell = ws.cell(row=current_row, column=5, value=invoice.tax_amount)
    tax_cell.font = font_bold
    tax_cell.alignment = align_right
    tax_cell.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
    ws.cell(row=current_row, column=5).border = box_border
    
    current_row += 1
    ws.cell(row=current_row, column=4, value="Grand Total:").font = font_bold
    ws.cell(row=current_row, column=4).alignment = align_right
    grand_total_cell = ws.cell(row=current_row, column=5, value=f"=E{current_row-2}+E{current_row-1}")
    grand_total_cell.font = font_bold
    grand_total_cell.alignment = align_right
    grand_total_cell.number_format = "$#,##0.00" if invoice.currency == "USD" else "#,##0.00"
    ws.cell(row=current_row, column=5).border = bottom_double_border
    ws.cell(row=current_row, column=5).fill = fill_accent
    
    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        
        # Don't auto-fit based on merged A1 cell
        for cell in col:
            val_str = str(cell.value or '')
            if cell.row != 1 and cell.row != 9:
                if len(val_str) > max_len:
                    max_len = len(val_str)
                    
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    ws.column_dimensions['B'].width = 45  # Keep description column wider
    
    # Save Workbook to buffer
    excel_buffer = io.BytesIO()
    wb.save(excel_buffer)
    excel_buffer.seek(0)
    return excel_buffer.getvalue()
