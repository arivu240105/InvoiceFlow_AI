import React, { useState } from 'react';
import { Eye, FileText, Loader } from 'lucide-react';
import { PREVIEW_BASE_URL } from '../utils/api';

interface InvoiceViewerProps {
  filename: string;
  fileType: 'pdf' | 'image';
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ filename, fileType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const fileUrl = `${PREVIEW_BASE_URL}/${filename}`;

  return (
    <div className="glass rounded-2xl p-4 flex flex-col h-full min-h-[550px] relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-100">Document Preview</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 py-1 px-3 rounded-full border border-slate-700 font-mono max-w-[200px] truncate">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{filename}</span>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-950/40 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 z-10 space-y-2">
            <Loader className="w-8 h-8 text-brand-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading preview...</span>
          </div>
        )}

        {fileType === 'pdf' ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-none rounded-xl"
            onLoad={() => setIsLoading(false)}
            title="PDF Document Invoice Preview"
          />
        ) : (
          <div className="w-full h-full p-4 overflow-auto flex items-center justify-center">
            <img
              src={fileUrl}
              alt="Uploaded Invoice Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
