import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'https://invoiceflow-ai-5t0x.onrender.com';
const API_BASE_URL = `${VITE_API_URL}/api`;
export const PREVIEW_BASE_URL = `${VITE_API_URL}/previews`;

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceData {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  currency: string;
  total_amount: number;
  tax_amount: number;
  gst_vat_number: string | null;
  line_items: LineItem[];
}

export interface ValidationCheck {
  field: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export interface RiskCheck {
  risk_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ValidationResponse {
  confidence_score: number;
  validation_checks: ValidationCheck[];
  risk_checks: RiskCheck[];
  is_valid: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  uploadInvoice: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadSampleInvoice: async (sampleName: 'acme' | 'supplies' | 'energy') => {
    const response = await axios.post(`${API_BASE_URL}/upload-sample/${sampleName}`);
    return response.data;
  },


  extractInvoice: async (): Promise<InvoiceData> => {
    const response = await axios.post(`${API_BASE_URL}/extract`);
    return response.data;
  },

  validateInvoice: async (invoiceData: InvoiceData): Promise<ValidationResponse> => {
    const response = await axios.post(`${API_BASE_URL}/validate`, invoiceData);
    return response.data;
  },

  getSummary: async (): Promise<string> => {
    const response = await axios.post(`${API_BASE_URL}/summary`);
    return response.data.summary;
  },

  chatWithInvoice: async (question: string, history: ChatMessage[]): Promise<{ answer: string; history: ChatMessage[] }> => {
    const response = await axios.post(`${API_BASE_URL}/chat`, { question, history });
    return response.data;
  },

  getExportUrl: (format: 'excel' | 'csv' | 'json') => {
    return `${API_BASE_URL}/export/${format}`;
  },

  getPreviewUrl: (filename: string) => {
    return `${PREVIEW_BASE_URL}/${filename}`;
  }
};
