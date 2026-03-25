import React from 'react';
import { motion } from 'framer-motion';

/**
 * VehicleListItem
 * Renderiza una unidad activa con estado de señal (online, signal_lost).
 */
export default function VehicleListItem({ placa, velocidad, estadoSignal, onClick }) {
  const isOnline = estadoSignal === 'online';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        px-4 py-3 border-b border-slate-700 flex justify-between items-center 
        cursor-pointer transition-colors bg-white hover:bg-slate-50
        first:rounded-t-none last:rounded-b-lg
      `}
    >
      <div className="flex items-center gap-3">
        {/* Truck Icon bg */}
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">{placa}</p>
          <p className="text-xs text-slate-500 font-medium">{velocidad} km/h</p>
        </div>
      </div>

      {/* Signal Status Dot */}
      <div className="flex items-center">
        {isOnline ? (
          <span className="flex h-3 w-3 relative" title="Señal Activa">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          </span>
        ) : (
          <span className="flex h-3 w-3 relative" title="Pérdida de Señal">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
