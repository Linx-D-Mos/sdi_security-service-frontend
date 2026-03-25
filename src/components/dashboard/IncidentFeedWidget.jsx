import React from 'react';

/**
 * IncidentFeedWidget
 * Esqueleto para una lista de incidentes.
 */
export default function IncidentFeedWidget({ incidents = [], onDismiss }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xs tracking-widest uppercase font-bold text-slate-400">Feed de Incidentes</h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {incidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <svg className="w-10 h-10 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">Bandeja despejada</p>
            <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">Sin alertas recientes</p>
          </div>
        ) : (
          incidents.map((inc, i) => (
            <div key={`feed-${inc.id}-${i}`} className={`p-3 rounded-lg border-l-2 bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer ${inc.severity === 'CRITICAL' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                  {inc.title || 'Alerta'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{inc.time || 'Hace 1 min'}</span>
                  {onDismiss && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(inc.id); }}
                      className="text-slate-500 hover:text-white transition-colors p-1 -m-1"
                      title="Cerrar alerta"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-200 leading-tight">{inc.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
