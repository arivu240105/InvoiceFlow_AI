import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { InvoiceData, LineItem } from '../utils/api';

interface ExtractionPanelProps {
  data: InvoiceData;
  onSaveAndValidate: (updatedData: InvoiceData) => void;
  isProcessing: boolean;
}

export const ExtractionPanel: React.FC<ExtractionPanelProps> = ({ data, onSaveAndValidate, isProcessing }) => {
  const [editedData, setEditedData] = useState<InvoiceData>({ ...data });

  // Update state if data from props changes
  useEffect(() => {
    setEditedData({ ...data });
  }, [data]);

  const handleChange = (field: keyof InvoiceData, value: any) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedLineItems = [...editedData.line_items];
    const item = { ...updatedLineItems[index] };

    if (field === 'quantity') {
      item.quantity = Number(value);
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
    } else if (field === 'unit_price') {
      item.unit_price = Number(value);
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
    } else if (field === 'total_price') {
      item.total_price = Number(value);
    } else {
      item[field] = value as never;
    }

    updatedLineItems[index] = item;
    
    // Automatically recalculate subtotal & grand total
    const newItemsSum = updatedLineItems.reduce((sum, it) => sum + it.total_price, 0);
    const newTotal = Number((newItemsSum + editedData.tax_amount).toFixed(2));

    setEditedData((prev) => ({
      ...prev,
      line_items: updatedLineItems,
      total_amount: newTotal
    }));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      description: 'New Line Item',
      quantity: 1,
      unit_price: 0.0,
      total_price: 0.0
    };
    setEditedData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, newItem]
    }));
  };

  const deleteLineItem = (index: number) => {
    const updatedLineItems = editedData.line_items.filter((_, i) => i !== index);
    const newItemsSum = updatedLineItems.reduce((sum, it) => sum + it.total_price, 0);
    const newTotal = Number((newItemsSum + editedData.tax_amount).toFixed(2));

    setEditedData((prev) => ({
      ...prev,
      line_items: updatedLineItems,
      total_amount: newTotal
    }));
  };

  const handleTaxChange = (value: string) => {
    const tax = Number(value);
    const itemsSum = editedData.line_items.reduce((sum, it) => sum + it.total_price, 0);
    const newTotal = Number((itemsSum + tax).toFixed(2));

    setEditedData((prev) => ({
      ...prev,
      tax_amount: tax,
      total_amount: newTotal
    }));
  };

  const handleTotalChange = (value: string) => {
    const total = Number(value);
    handleChange('total_amount', total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndValidate(editedData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6 h-full flex flex-col justify-between">
      <div className="space-y-6 flex-1">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-slate-100">Smart Invoice Fields</h2>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition text-xs font-semibold text-white shadow-lg shadow-brand-900/20"
          >
            {isProcessing ? 'Validating...' : 'Sync & Validate'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Meta Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Vendor / Supplier Name</label>
            <input
              type="text"
              value={editedData.vendor_name || ''}
              onChange={(e) => handleChange('vendor_name', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm"
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Invoice Number</label>
            <input
              type="text"
              value={editedData.invoice_number || ''}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm"
              placeholder="e.g. INV-001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Invoice Date</label>
            <input
              type="date"
              value={editedData.invoice_date || ''}
              onChange={(e) => handleChange('invoice_date', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Due Date</label>
            <input
              type="date"
              value={editedData.due_date || ''}
              onChange={(e) => handleChange('due_date', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Currency</label>
            <select
              value={editedData.currency || 'USD'}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">GST / VAT ID</label>
            <input
              type="text"
              value={editedData.gst_vat_number || ''}
              onChange={(e) => handleChange('gst_vat_number', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm"
              placeholder="e.g. EU12345678"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-350 font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[220px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Price</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {editedData.line_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20">
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        className="w-full bg-transparent focus:bg-slate-950/40 focus:ring-1 focus:ring-brand-500 rounded p-1"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        min="0"
                        step="any"
                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                        className="w-full bg-transparent text-center focus:bg-slate-950/40 focus:ring-1 focus:ring-brand-500 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={item.unit_price}
                        min="0"
                        step="any"
                        onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full bg-transparent text-right focus:bg-slate-950/40 focus:ring-1 focus:ring-brand-500 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-slate-300">
                      {editedData.currency} {item.total_price.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteLineItem(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {editedData.line_items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                      No line items added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Calculations Block */}
      <div className="border-t border-slate-800 pt-4 mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Tax Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-semibold text-slate-500">{editedData.currency}</span>
            <input
              type="number"
              value={editedData.tax_amount}
              min="0"
              step="any"
              onChange={(e) => handleTaxChange(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-3 py-1.5 text-xs font-mono text-right"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Total Invoice Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-semibold text-brand-500 font-bold">{editedData.currency}</span>
            <input
              type="number"
              value={editedData.total_amount}
              min="0"
              step="any"
              onChange={(e) => handleTotalChange(e.target.value)}
              className="w-full glass-input border-brand-850 focus:border-brand-500 rounded-xl pl-10 pr-3 py-1.5 text-xs font-mono text-right font-bold text-slate-100"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
