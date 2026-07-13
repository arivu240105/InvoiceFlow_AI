import React from 'react';
import { AlertCircle, ChevronRight, ShieldAlert } from 'lucide-react';
import type { RiskCheck } from '../utils/api';

interface RiskDetectionPanelProps {
  score: number;
  risks: RiskCheck[];
}

export const RiskDetectionPanel: React.FC<RiskDetectionPanelProps> = ({ score, risks }) => {
  // SVG Configs for Circular Progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color matching score
  let scoreColor = 'text-green-400';
  let strokeColor = '#22c55e'; // Green-500
  if (score < 50) {
    scoreColor = 'text-red-400';
    strokeColor = '#ef4444'; // Red-500
  } else if (score < 80) {
    scoreColor = 'text-amber-400';
    strokeColor = '#f59e0b'; // Amber-500
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4 flex flex-col h-full justify-between">
      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldAlert className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-100">Risk Assessment</h2>
        </div>

        {/* Confidence Score Gauge Layout */}
        <div className="flex items-center gap-6 bg-slate-900/25 border border-slate-850 p-4 rounded-xl">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={strokeColor}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-xl font-bold font-mono ${scoreColor}`}>{score}%</span>
              <span className="text-[8px] text-slate-500 tracking-wider uppercase font-semibold">Confidence</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Integrity Rating</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Based on verification of supplier details, unique tracking ID, tax presence, and line-item totals calculations.
            </p>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Detected Vulnerabilities ({risks.length})
          </div>

          <div className="overflow-y-auto max-h-[160px] space-y-2 pr-1">
            {risks.map((risk, idx) => {
              let severityBg = 'bg-red-500/10 text-red-400 border-red-500/20';
              if (risk.severity === 'medium') {
                severityBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              } else if (risk.severity === 'low') {
                severityBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              }

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 bg-slate-950/30 border border-slate-900 rounded-xl hover:border-slate-800 transition"
                >
                  <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{risk.risk_type}</span>
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${severityBg}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{risk.message}</p>
                  </div>
                </div>
              );
            })}
            {risks.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-slate-950/20 rounded-xl text-xs text-green-400 font-medium">
                <ChevronRight className="w-4 h-4 text-green-400" />
                <span>Zero risks flagged. Financial document checks out clean!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
