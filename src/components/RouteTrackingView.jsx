import React, { useState, useEffect, useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import useRouteTracking from '../hooks/useRouteTracking';
import RouteHeader from './RouteHeader';
import RouteTimeline from './RouteTimeline';
import RouteMap from './RouteMap';
import * as turf from '@turf/turf';

export default function RouteTrackingView() {
  const { vehiclePosition, routeInfo, routeStops, mapPoints, isLoading, handleCheckIn, handleCheckOut, handleReportIncident, activeStop, incidents } = useRouteTracking(1);

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

  // ==========================================
  // GENERADOR DE GEOCERCAS (PERÍMETROS REALES)
  // ==========================================
  const geofencesData = useMemo(() => {
    const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
    if (!mapPoints || mapPoints.length === 0) return emptyGeoJSON;

    // Filtramos los puntos que sí tienen coordenadas
    const validPoints = mapPoints.filter(p => p.position?.lng && p.position?.lat);
    if (validPoints.length === 0) return emptyGeoJSON;

    const features = validPoints.map(point => {
      // Turf.circle exige el radio en kilómetros. Si tu BD devuelve metros, dividimos por 1000.
      const radiusInKm = (point.radius || 50) / 1000;

      // Creamos el círculo exacto en la tierra
      const circle = turf.circle([point.position.lng, point.position.lat], radiusInKm, {
        units: 'kilometers',
        steps: 64 // Qué tan redondo queremos el polígono
      });

      // Le inyectamos las propiedades (estado) para poder colorearlo dinámicamente
      circle.properties = {
        id: point.id,
        state: point.state, // 'pending', 'in_progress', 'completed'
        name: point.name
      };

      return circle;
    });

    const rawFeatureCollection = turf.featureCollection(features);
    // We stringify and parse the turf output to ensure no reactive proxies or turf getters fail in the Web Worker
    return JSON.parse(JSON.stringify(rawFeatureCollection));
  }, [mapPoints]);

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

      {/* SECCIÓN 1: MAPA EXTRUIDO */}
      <main className="flex-1 w-full relative z-0">
        <RouteMap
          viewState={viewState}
          onMove={evt => setViewState(evt.viewState)}
          onDragStart={() => setIsUserInteracting(true)}
          mapPoints={mapPoints}
          vehiclePosition={vehiclePosition}
          geofencesData={geofencesData}
          isUserInteracting={isUserInteracting}
          onRecenter={() => setIsUserInteracting(false)}
          incidents={incidents}
        />

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
            mapPoints={mapPoints}
            activeStop={activeStop}
            isLoading={isLoading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onReportIncident={handleReportIncident}
          />
        </div>
      </section>
    </div>
  );
}