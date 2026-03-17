import React, { useState } from 'react';
import RouteMap from './RouteMap';
import useObservabilityDashboard from '../hooks/useObservabilityDashboard';

export default function ObservabilityDashboard() {
  const { activeVehicles, incidents, stats, isLoading } = useObservabilityDashboard();
  
  const [viewState, setViewState] = useState({
    longitude: -74.0817,
    latitude: 4.6897,
    zoom: 12
  });
  
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Convert dictionary to array
  const vehiclesList = Object.values(activeVehicles);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <span className="font-bold text-slate-300 tracking-wider">Inicializando Centro de Control...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR: Panel de Control */}
      <aside className="w-96 bg-slate-800 border-r border-slate-700 flex flex-col z-10 shadow-2xl shrink-0">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Centro de Control
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Monitor de Operaciones</p>
        </div>

        {/* STATS GRID */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-blue-400">{stats.totalActive}</span>
            <span className="text-xs text-slate-400 uppercase mt-1 text-center">Rutas Activas</span>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-xl border border-red-500/30 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-red-500">{stats.criticalIncidents}</span>
            <span className="text-xs text-slate-400 uppercase mt-1 text-center">Alertas Críticas</span>
          </div>
        </div>

        {/* FEED DE INCIDENTES */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-3 border-y border-slate-700 bg-slate-800/80 flex items-center justify-between sticky top-0">
            <h2 className="text-sm tracking-widest uppercase font-bold text-slate-300">Feed de Incidentes</h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {incidents.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">
                Sin incidentes reportados
              </div>
            ) : (
              incidents.map((inc, i) => {
                const isCritical = inc.relationships?.incident_type?.severity === 'CRITICAL' || inc.relationships?.incident_type?.severity === 'HIGH';
                return (
                  <div key={`feed-${inc.id || i}`} className={`p-4 rounded-lg border-l-4 shadow-sm bg-slate-700/30 ${isCritical ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                        {inc.relationships?.incident_type?.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{inc.attributes?.created_at_human || 'Ahora'}</span>
                    </div>
                    <p className="text-sm text-slate-200 mb-2">{inc.attributes?.description}</p>
                    {inc.relationships?.store && (
                      <div className="text-[11px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded inline-flex items-center gap-1 border border-slate-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {inc.relationships.store.name}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* MAP AREA */}
      <main className="flex-1 relative">
         <RouteMap
            viewState={viewState}
            onMove={evt => setViewState(evt.viewState)}
            onDragStart={() => setIsUserInteracting(true)}
            activeVehicles={vehiclesList}
            isUserInteracting={isUserInteracting}
            onRecenter={() => setIsUserInteracting(false)}
            incidents={incidents} // Para que también se dibujen en el mapa grande
         />

         {/* Overlay Listado Vehiculos Flotante */}
         <div className="absolute top-6 right-6 z-10 w-72 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Unidades Activas</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {vehiclesList.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-500">Buscando señal...</div>
              )}
              {vehiclesList.map(v => (
                <div key={v.routeId} className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setViewState(prev => ({ ...prev, latitude: v.latitude, longitude: v.longitude, zoom: 16 }));
                    setIsUserInteracting(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide">{v.routeName}</p>
                      <p className="text-[10px] text-slate-400">{v.speed} km/h</p>
                    </div>
                  </div>
                  {v.signalLost ? (
                    <span className="flex h-2 w-2 rounded-full bg-slate-500" title="Señal perdida"></span>
                  ) : (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Transmitiendo"></span>
                  )}
                </div>
              ))}
            </div>
         </div>
      </main>
    </div>
  );
}
