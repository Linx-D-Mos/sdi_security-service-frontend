import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import useRouteTracking from '../hooks/useRouteTracking';
import RouteHeader from './RouteHeader';
import RouteTimeline from './RouteTimeline';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

export default function RouteTrackingView() {
  const { vehiclePosition, routeInfo, routeStops, mapPoints, isLoading, handleCheckIn } = useRouteTracking(1);

  // 1. ESTADO DE LA VISTA DEL MAPA
  const [viewState, setViewState] = useState({
    longitude: -74.0817,
    latitude: 4.6897,
    zoom: 14
  });

  // 2. BANDERA DE INTERACCIÓN: Para evitar que el GPS le quite el control al usuario
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // 3. SEGUIMIENTO AUTOMÁTICO
  useEffect(() => {
    // Solo centramos el mapa automáticamente si el usuario NO lo está arrastrando
    if (!isUserInteracting && vehiclePosition.longitude && vehiclePosition.latitude) {
      setViewState(prev => ({
        ...prev,
        longitude: vehiclePosition.longitude,
        latitude: vehiclePosition.latitude,
      }));
    }
  }, [vehiclePosition, isUserInteracting]);

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
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onDragStart={() => setIsUserInteracting(true)} // El usuario tomó el control
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          {/* RENDERIZAR PARADAS (Tiendas) en el Mapa */}
          {mapPoints && mapPoints.map(point => {
            if (!point.position?.lng || !point.position?.lat) return null;

            return (
              <Marker
                key={`stop-${point.id}`}
                longitude={point.position.lng}
                latitude={point.position.lat}
                anchor="bottom"
              >
                <div className="relative flex flex-col items-center group cursor-pointer">
                  {/* Icono de Tienda */}
                  <div className={`p-2 rounded-full border-2 border-white shadow-md ${point.state === 'completed' ? 'bg-green-500' : 'bg-slate-600'
                    }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  {/* Tooltip con nombre de la tienda (Aparece al hacer hover) */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                    {point.name}
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* MARCADOR DEL CAMIÓN BLINDADO */}
          <Marker
            longitude={vehiclePosition.longitude}
            latitude={vehiclePosition.latitude}
            anchor="center"
            style={{ zIndex: 50 }} // El camión siempre por encima de las tiendas
          >
            <div className="relative flex flex-col items-center">
              <div className="bg-slate-900 p-3 rounded-xl shadow-2xl border-2 border-white">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping z-[-1]"></div>
              <div className="mt-1 bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold text-slate-800 uppercase">
                Ud 402
              </div>
            </div>
          </Marker>
        </Map>

        {/* BOTÓN PARA RE-CENTRAR (Solo aparece si el usuario movió el mapa) */}
        {isUserInteracting && (
          <button
            onClick={() => setIsUserInteracting(false)}
            className="absolute top-24 right-4 z-20 bg-white p-3 rounded-full shadow-lg border-2 border-blue-500 text-blue-500 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* HEADER FLOTANTE */}
        <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">
          <RouteHeader routeInfo={routeInfo} />
        </div>

        {/* FAB INCIDENTE */}
        <div className="absolute bottom-6 right-4 z-20">
          <button className="flex flex-col items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full shadow-lg active:scale-95 transition-transform border-2 border-white pointer-events-auto">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </main>

      {/* SECCIÓN 2: BOTTOM SHEET TIMELINE (Con overflow-y-auto arreglado) */}
      <section className="bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 flex flex-col min-h-[40vh] max-h-[50vh] relative -mt-4">
        {/* Drag handle */}
        <div className="w-full flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Ruta Asignada</h2>
        </div>

        {/* CONTENEDOR CON SCROLL PARA EL TIMELINE */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <RouteTimeline
            stops={routeStops}
            isLoading={isLoading}
            onCheckIn={handleCheckIn}
          />
        </div>
      </section>
    </div>
  );
}