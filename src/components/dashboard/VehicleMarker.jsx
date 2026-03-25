import React from 'react';
import { Marker } from 'react-map-gl/maplibre';

/**
 * VehicleMarker
 * Marcador del camión blindado en el mapa.
 * Soporta estados (online, signal_lost) con animaciones unificadas.
 */
export default function VehicleMarker({ longitude, latitude, label, signalStatus = 'online', criticalIncident, onClick, scale = 1 }) {
  const isOnline = signalStatus !== 'signal_lost';

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      style={{ zIndex: 50 }}
      onClick={e => {
        if (onClick) {
          e.originalEvent.stopPropagation();
          onClick();
        }
      }}
    >
      <div className="will-change-transform" style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}>
        <div className="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-[1.15]">

          {/* Alerta Crítica (Prioridad 1) */}
          {criticalIncident && (
            <div className="absolute bottom-full mb-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl animate-bounce whitespace-nowrap z-50 flex items-center gap-1 border-2 border-red-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {criticalIncident.relationships?.incident_type?.name || 'ALERTA'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-red-600 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
            </div>
          )}

          {/* Alerta de Pérdida de Señal (Icono flotante) */}
          {!criticalIncident && !isOnline && (
            <div className="absolute -top-4 -right-2 z-20 text-red-500 bg-white rounded-full shadow-lg border border-red-200 p-0.5" title="¡Señal Perdida!">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Animación Online de un solo pulso visible */}
          {isOnline && (
            <div className="absolute -inset-3 rounded-full z-[-1] bg-blue-500/40 animate-ping"></div>
          )}

          {/* Contenedor del Camión (Cambia de color según el estado) */}
          <div className={`
            p-2.5 rounded-full shadow-2xl border-2 flex items-center justify-center
            transition-colors duration-300
            ${criticalIncident ? 'bg-red-700 animate-ping border-red-400' :
              isOnline ? 'bg-slate-900 border-blue-400' : 'bg-red-700 border-red-400'
            }
          `}>
            {/* Armored Truck SVG Icon */}
            <svg className={`w-5 h-5 ${isOnline ? 'text-blue-400' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.15,8a2,2,0,0,0-1.72-1H15V5a2,2,0,0,0-2-2H4A2,2,0,0,0,2,5V16a1,1,0,0,0,1,1H4.22a2.84,2.84,0,0,0,5.56,0h4.44a2.84,2.84,0,0,0,5.56,0h1.22a1,1,0,0,0,1-1V11.23A3.08,3.08,0,0,0,19.15,8ZM7,17.5a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,7,17.5Zm10,0a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,17,17.5ZM15,9h2.43l1.8,3H15Z" />
            </svg>
          </div>

          {/* Label (Placa / Nombre de ruta) */}
          {label && (
            <div className={`mt-1.5 backdrop-blur px-2.5 py-0.5 rounded shadow-lg text-[10px] font-bold uppercase border 
              ${!isOnline ? 'bg-orange-100/90 text-orange-800 border-orange-300' : 'bg-slate-900/90 text-white border-slate-700'}
            `}>
              {label}
            </div>
          )}
        </div>
      </div>
    </Marker>
  );
}
