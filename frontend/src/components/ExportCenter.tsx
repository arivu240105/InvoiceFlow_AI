import React from 'react';
import { Download, FileSpreadsheet, FileText, Code, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

interface ExportCenterProps {
  filename: string;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ filename }) => {
  const baseName = filename.replace(/\.[^/.]+$/, "");

  const exportOptions = [
    {
      format: 'excel' as const,
      title: 'Microsoft Excel Ledger',
      extension: '.xlsx',
      description: 'Styled, gridline-enabled spreadsheet containing metadata tables, line item structures, and sum formulas.',
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'hover:border-emerald-500/30'
    },
    {
      format: 'csv' as const,
      title: 'Standard CSV Data',
      extension: '.csv',
      description: 'Flat ledger values ideal for importing directly into accounting tools like QuickBooks, Xero, or ERP engines.',
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'hover:border-blue-500/30'
    },
    {
      format: 'json' as const,
      title: 'Structured JSON Schema',
      extension: '.json',
      description: 'Developer-friendly structured key-value schema payloads, optimized for software hooks or database stores.',
      icon: Code,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'hover:border-purple-500/30'
    }
  ];

  return (
    <div className="glass rounded-2xl p-5 space-y-4 flex flex-col h-full justify-between">
      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <Download className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-100">Export Center</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Export the parsed and audited invoice records. All mathematical reconciliations are embedded in the output.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {exportOptions.map((opt, idx) => {
            const Icon = opt.icon;
            const downloadUrl = api.getExportUrl(opt.format);
            const downloadName = `${baseName}_export${opt.extension}`;

            return (
              <a
                key={idx}
                href={downloadUrl}
                download={downloadName}
                className={`flex gap-4 p-4 bg-slate-900/30 border border-slate-850 rounded-xl transition-all duration-300 group ${opt.borderColor}`}
              >
                <div className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${opt.bgColor} ${opt.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-brand-400 transition">
                      {opt.title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{opt.extension}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{opt.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-900/20 p-2.5 rounded-lg border border-slate-850">
        <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <span>Output sheets verify calculations (Quantity × Price = Item Total).</span>
      </div>
    </div>
  );
};
