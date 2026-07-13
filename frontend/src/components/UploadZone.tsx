import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

interface UploadZoneProps {
  onUploadSuccess: (filename: string, isScanned: boolean, fileType: 'pdf' | 'image') => void;
  onUploadStart: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess, onUploadStart }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Unsupported file format. Please upload a PDF or an Image (PNG/JPG).');
      return;
    }

    onUploadStart();
    setIsUploading(true);
    const toastId = toast.loading(`Uploading and reading ${file.name}...`);

    try {
      const data = await api.uploadInvoice(file);
      toast.success('Document parsed successfully!', { id: toastId });
      onUploadSuccess(data.filename, data.is_scanned, data.file_type);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to process document.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSampleClick = async (sampleName: 'acme' | 'supplies' | 'energy') => {
    onUploadStart();
    setIsUploading(true);
    const toastId = toast.loading(`Loading sample ${sampleName} invoice...`);

    try {
      const data = await api.uploadSampleInvoice(sampleName);
      toast.success(`Sample loaded! Filename: ${data.filename}`, { id: toastId });
      onUploadSuccess(data.filename, data.is_scanned, data.file_type);
    } catch (error: any) {
      toast.error('Failed to load sample invoice.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div
        className={`glass relative p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[300px] cursor-pointer ${
          isDragActive
            ? 'border-brand-500 bg-brand-950/20 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4 animate-pulse">
            <Loader className="w-16 h-16 text-brand-400 animate-spin mx-auto" />
            <h3 className="text-xl font-semibold text-slate-100">Processing Document</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Running text layout analysis and checking session store configuration. Please hold on.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/80 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-slate-700 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-brand-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Upload your invoice</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Drag and drop your document here, or click to browse. Supports PDF or Image formats (PNG, JPG) up to 10MB.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse-slow" />
          <span>Quick Testing Sandbox</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleSampleClick('acme')}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 p-3 glass hover:bg-brand-950/20 hover:border-brand-800/50 rounded-xl transition-all text-xs font-medium text-slate-200"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            <span>Acme IT Services (USD)</span>
          </button>
          <button
            onClick={() => handleSampleClick('supplies')}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 p-3 glass hover:bg-brand-950/20 hover:border-brand-800/50 rounded-xl transition-all text-xs font-medium text-slate-200"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            <span>Global Office Supplies (USD)</span>
          </button>
          <button
            onClick={() => handleSampleClick('energy')}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 p-3 glass hover:bg-brand-950/20 hover:border-brand-800/50 rounded-xl transition-all text-xs font-medium text-slate-200"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            <span>EcoPower Solar (EUR)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
