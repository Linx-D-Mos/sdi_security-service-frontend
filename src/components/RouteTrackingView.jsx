import React from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import useRouteTracking from '../hooks/useRouteTracking';
import RouteHeader from './RouteHeader';
import RouteTimeline from './RouteTimeline';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

export default function RouteTrackingView() {
  const { vehiclePosition, routeInfo, routeStops, isLoading, handleCheckIn } = useRouteTracking(1);

  // 🛡️ PROTECCIÓN: Si está cargando, mostramos un loader y evitamos que los hijos crasheen
  if (isLoading && !routeInfo.route_name) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <span className="ml-4 font-bold">Iniciando sistemas de rastreo...</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 relative overflow-hidden">

      {/* SECCIÓN 1: MAPA */}
      <main className="flex-1 w-full relative z-0">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          longitude={vehiclePosition.longitude}
          latitude={vehiclePosition.latitude}
          zoom={14}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Marcador del Camión Blindado */}
          <Marker
            longitude={vehiclePosition.longitude}
            latitude={vehiclePosition.latitude}
            anchor="center"
          >
            <div className="relative flex flex-col items-center">
              <div className="bg-slate-900 p-3 rounded-xl shadow-2xl border-2 border-white">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping z-[-1]"></div>
              <div className="mt-2 bg-white px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-800 uppercase tracking-tight">
                Unidad 402
              </div>
            </div>
          </Marker>
        </Map>

        {/* HEADER FLOTANTE (Componentizado) */}
        <RouteHeader routeInfo={routeInfo} />

        {/* FAB INCIDENTE (Sobre el mapa, justo arriba del bottom sheet) */}
        <div className="absolute bottom-6 right-4 z-20">
          <button className="flex flex-col items-center justify-center w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl active:scale-95 transition-transform border-4 border-white pointer-events-auto">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[8px] font-bold uppercase mt-0.5">Alert</span>
          </button>
        </div>
      </main>

      {/* SECCIÓN 2: BOTTOM SHEET TIMELINE */}
      <section className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 flex flex-col shrink-0 flex-basis-[40%] min-h-[40vh] max-h-[60vh] -mt-6">
        {/* Drag handle */}
        <div className="w-full flex justify-center py-4 shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Próximas Paradas</h2>
        </div>

        {/* Timeline Componentizado que scrollea */}
        <RouteTimeline
          stops={routeStops}
          isLoading={isLoading}
          onCheckIn={handleCheckIn}
        />
      </section>
    </div>
  );
}
