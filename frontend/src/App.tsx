import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  MessageSquare,
  Download,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  FileText,
  Bot
} from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { InvoiceViewer } from './components/InvoiceViewer';
import { ExtractionPanel } from './components/ExtractionPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { RiskDetectionPanel } from './components/RiskDetectionPanel';
import { ChatBot } from './components/ChatBot';
import { ExportCenter } from './components/ExportCenter';
import { api } from './utils/api';
import type { InvoiceData, ValidationResponse, ChatMessage } from './utils/api';

export const App: React.FC = () => {
  // Document state
  const [filename, setFilename] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);

  // Pipeline states
  const [isExtracting, setIsExtracting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'data' | 'risk' | 'chat' | 'export'>('data');

  const handleUploadStart = () => {
    // Reset states
    setFilename(null);
    setFileType(null);
    setInvoiceData(null);
    setValidation(null);
    setSummary('');
    setChatHistory([]);
  };

  const handleUploadSuccess = async (name: string, _scanned: boolean, type: 'pdf' | 'image') => {
    setFilename(name);
    setFileType(type);
    setIsExtracting(true);

    try {
      // 1. Trigger extraction
      const extracted = await api.extractInvoice();
      setInvoiceData(extracted);

      // 2. Trigger validation
      const audit = await api.validateInvoice(extracted);
      setValidation(audit);

      // 3. Trigger summary
      const summaryText = await api.getSummary();
      setSummary(summaryText);
    } catch (e: any) {
      console.error("Pipeline execution failed", e);
      toast.error(e.response?.data?.detail || "Automation pipeline failed to extract structured data.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveAndValidate = async (updatedData: InvoiceData) => {
    setIsExtracting(true);
    try {
      setInvoiceData(updatedData);
      const audit = await api.validateInvoice(updatedData);
      setValidation(audit);
      toast.success("Document audit validation re-computed!");
    } catch (e: any) {
      console.error("Sync validation failed", e);
      toast.error(e.response?.data?.detail || "Failed to update validation rules.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setFilename(null);
    setFileType(null);
    setInvoiceData(null);
    setValidation(null);
    setSummary('');
    setChatHistory([]);
    setActiveTab('data');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500/30">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#151e2e',
          color: '#f3f4f6',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }
      }} />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-brand-650 to-brand-500 rounded-xl shadow-lg shadow-brand-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white m-0 leading-none">InvoiceFlow AI</h1>
              <span className="text-[10px] text-slate-400 font-medium">Finance Automation & Auditing Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Local Engine Live
            </span>
            {filename && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload New
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        {!filename ? (
          /* Landing/Upload View */
          <div className="space-y-12 py-8 animate-slide-up">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Finance Automation
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 leading-tight">
                Audit and extract invoices with AI precision
              </h2>
              <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                InvoiceFlow AI processes documents, runs compliance arithmetic audits, scores financial integrity risks, and exports ledger sheets.
              </p>
            </div>

            <UploadZone onUploadSuccess={handleUploadSuccess} onUploadStart={handleUploadStart} />

            {/* Feature Cards Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6 border-t border-slate-900/80">
              <div className="glass p-5 rounded-2xl space-y-2.5">
                <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl w-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Smart Extraction & OCR</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Extracts metadata, currencies, registration codes, and line-item tables using layout-aware PyMuPDF and LLMs.
                </p>
              </div>

              <div className="glass p-5 rounded-2xl space-y-2.5">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Audit Compliance Rules</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Validates subtotals, tax figures, registration IDs, due dates chronological checks, and flags risks.
                </p>
              </div>

              <div className="glass p-5 rounded-2xl space-y-2.5">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl w-fit">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Interactive AI Agent</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Chat with the assistant to query terms, request invoice validation, or query fine-print details instantly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard/Details View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-slide-up flex-1">
            {/* Left side: Invoice Preview (Takes 5/12 on large screens) */}
            <div className="lg:col-span-5 h-full">
              <InvoiceViewer filename={filename} fileType={fileType || 'pdf'} />
            </div>

            {/* Right side: Interactive Tabs panel (Takes 7/12 on large screens) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Meta Quick Summary Header */}
              {invoiceData && (
                <div className="glass p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Active Vendor</span>
                    <h3 className="text-md font-bold text-slate-100 truncate">{invoiceData.vendor_name || 'Extracting...'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Grand Total</span>
                    <div className="text-md font-extrabold text-brand-400 font-mono">
                      {invoiceData.currency} {invoiceData.total_amount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  {validation && (
                    <div className="text-right border-l border-slate-900 pl-4">
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Confidence</span>
                      <div className="text-md font-bold text-slate-100 font-mono">{validation.confidence_score}%</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-900">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'data' ? 'bg-brand-600 text-white shadow-md shadow-brand-950/20' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Fields & Audit
                </button>
                <button
                  onClick={() => setActiveTab('risk')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'risk' ? 'bg-brand-600 text-white shadow-md shadow-brand-950/20' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Risk Gauge
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'chat' ? 'bg-brand-600 text-white shadow-md shadow-brand-950/20' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Chatbot
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'export' ? 'bg-brand-600 text-white shadow-md shadow-brand-950/20' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 min-h-[460px] flex flex-col">
                {isExtracting ? (
                  <div className="glass rounded-2xl flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <LoaderIcon className="w-12 h-12 text-brand-400 animate-spin" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Analyzing Document Layout</h3>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                        Executing OCR token extraction and calling semantic schemas parser...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'data' && invoiceData && (
                      <div className="grid grid-cols-1 gap-6 flex-1">
                        <ExtractionPanel
                          data={invoiceData}
                          onSaveAndValidate={handleSaveAndValidate}
                          isProcessing={isExtracting}
                        />
                        {validation && (
                          <ValidationPanel
                            checks={validation.validation_checks}
                            isValid={validation.is_valid}
                          />
                        )}
                      </div>
                    )}

                    {activeTab === 'risk' && validation && (
                      <div className="grid grid-cols-1 gap-6 flex-1">
                        <RiskDetectionPanel
                          score={validation.confidence_score}
                          risks={validation.risk_checks}
                        />
                        <ValidationPanel
                          checks={validation.validation_checks}
                          isValid={validation.is_valid}
                        />
                      </div>
                    )}

                    {activeTab === 'chat' && invoiceData && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        {summary && (
                          <div className="glass p-4 rounded-xl space-y-2 border border-brand-900/20 bg-brand-950/5">
                            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                              AI Document Summary
                            </span>
                            <div className="text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
                              {summary.split('\n').map((line, idx) => (
                                <p key={idx} className="mb-1">{line}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <ChatBot messages={chatHistory} setMessages={setChatHistory} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'export' && (
                      <div className="flex-1">
                        <ExportCenter filename={filename} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 InvoiceFlow AI. Designed for Intelligent Accounting Hackathon.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition cursor-pointer flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Documentation
            </span>
            <span className="hover:text-slate-400 transition cursor-pointer flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5" /> Session Cache: Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Simple loader helper icon
const LoaderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
export default App;
