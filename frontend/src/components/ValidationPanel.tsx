import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { ValidationCheck } from '../utils/api';

interface ValidationPanelProps {
  checks: ValidationCheck[];
  isValid: boolean;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ checks, isValid }) => {
  const errors = checks.filter(c => c.status === 'error');
  const warnings = checks.filter(c => c.status === 'warning');
  const successes = checks.filter(c => c.status === 'success');

  return (
    <div className="glass rounded-2xl p-5 space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-100">Audit & Validation</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isValid ? (
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
              Audit Passed
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
              Discrepancies Found
            </span>
          )}
        </div>
      </div>

      {/* Validation Stats Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-xl">
          <div className="font-semibold text-green-400 font-mono text-base">{successes.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Passed</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-xl">
          <div className="font-semibold text-amber-400 font-mono text-base">{warnings.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Warnings</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-xl">
          <div className="font-semibold text-red-400 font-mono text-base">{errors.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Errors</div>
        </div>
      </div>

      {/* Checklist container */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
        {checks.map((check, idx) => {
          let Icon = CheckCircle2;
          let iconColor = 'text-green-400';
          let bgColor = 'bg-green-500/5';
          let borderColor = 'border-green-500/10';

          if (check.status === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
            bgColor = 'bg-amber-500/5';
            borderColor = 'border-amber-500/10';
          } else if (check.status === 'error') {
            Icon = XCircle;
            iconColor = 'text-red-400';
            bgColor = 'bg-red-500/5';
            borderColor = 'border-red-500/10';
          }

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border ${bgColor} ${borderColor} transition-all duration-200`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-mono">
                  {check.field.replace('_', ' ').replace(/\[\d+\]\./g, ' ')}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{check.message}</p>
              </div>
            </div>
          );
        })}
        {checks.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs py-8 italic">
            Run document extraction to see audit details.
          </div>
        )}
      </div>
    </div>
  );
};
