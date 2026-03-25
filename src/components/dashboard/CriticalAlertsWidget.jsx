import React from 'react';

/**
 * CriticalAlertsWidget
 * Métrica de "Alertas Críticas" que cambia de estilo basado en el conteo.
 */
export default function CriticalAlertsWidget({ count = 0 }) {
  const hasAlerts = count > 0;

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 flex flex-col items-center justify-center
        transition-colors duration-300
        ${hasAlerts 
          ? 'bg-slate-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
          : 'bg-slate-800 border-slate-700'
        }
      `}
    >
      {/* Animación de latido (pulso) si hay alertas */}
      {hasAlerts && (
        <React.Fragment>
          {/* Heartbeat decoration icon right */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
             <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10H10L13 3L19 18L26 5L29 10H40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          {/* Heartbeat decoration icon left */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none transform -scale-x-100">
             <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10H10L13 3L19 18L26 5L29 10H40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
        </React.Fragment>
      )}

      <span className={`text-xs uppercase font-bold tracking-wider ${hasAlerts ? 'text-red-400' : 'text-slate-400'}`}>
        Alertas Críticas
      </span>
      <span className={`text-4xl font-black mt-2 ${hasAlerts ? 'text-white animate-pulse' : 'text-slate-300'}`}>
        {count}
      </span>
    </div>
  );
}
