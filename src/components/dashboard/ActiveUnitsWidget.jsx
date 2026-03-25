import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VehicleListItem from './VehicleListItem';

/**
 * ActiveUnitsWidget
 * Panel flotante derecho con botón de abrir/cerrar.
 */
export default function ActiveUnitsWidget({ vehicles = [], onVehicleClick }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute top-6 right-6 z-20 w-80 shadow-2xl rounded-xl">
      {/* Header/Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white px-5 py-3 rounded-t-xl flex justify-between items-center outline-none focus:outline-none"
      >
        <span className="text-xs font-black uppercase tracking-widest text-blue-50">Unidades Activas</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* List Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden bg-white rounded-b-xl border-x border-b border-slate-200 shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {vehicles.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 font-medium">
                  Buscando señal...
                </div>
              ) : (
                vehicles.map((v, i) => (
                  <VehicleListItem
                    key={v.id || i}
                    placa={v.placa}
                    velocidad={v.velocidad}
                    estadoSignal={v.estadoSignal}
                    onClick={() => onVehicleClick && onVehicleClick(v)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
