import React, { useMemo } from 'react';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

export default function RouteMap({
  viewState,
  onMove,
  onDragStart,
  mapPoints = [],
  vehiclePosition, // For single route tracking
  activeVehicles = [], // For dashboard multiple vehicles
  geofencesData,
  isUserInteracting,
  onRecenter,
  incidents = [], // array of incidents
}) {
  // Extract active incidents to show in the map
  const renderIncidents = () => {
    return incidents.map((incident, idx) => {
      // Intentar ubicar el incidente en el mapa
      const stopId = incident.attributes?.route_stop_id;
      let lat = null;
      let lng = null;

      if (stopId) {
        const stop = mapPoints.find(p => p.id === stopId);
        if (stop?.position) {
          lat = stop.position.lat;
          lng = stop.position.lng;
        }
      } else {
        // En Dashboard: intentar usar la posición del vehículo relacionado
        const matchingVehicle = activeVehicles.find(v => v.routeId === incident.attributes?.route_id);
        if (matchingVehicle) {
          lat = matchingVehicle.latitude;
          lng = matchingVehicle.longitude;
        } else {
           lat = vehiclePosition?.latitude;
           lng = vehiclePosition?.longitude;
        }
      }

      if (!lat || !lng) return null;
      
      const severity = incident.relationships?.incident_type?.severity || 'LOW';
      const isCritical = severity === 'CRITICAL' || severity === 'HIGH';

      return (
        <Marker
          key={`incident-${incident.id || idx}`}
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          style={{ zIndex: 60 }} // Above truck and stores
        >
          <div className="relative flex flex-col items-center group cursor-pointer animate-bounce">
            <div className={`p-1.5 rounded-md shadow-lg border-2 border-white ${isCritical ? 'bg-red-600' : 'bg-orange-500'}`}>
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            {/* Tooltip for Incident */}
            <div className="absolute bottom-full mb-1 flex-col items-center hidden group-hover:flex bg-red-900/90 text-white text-xs px-2 py-1.5 rounded z-50 shadow-xl whitespace-nowrap backdrop-blur-sm border border-red-500/50">
               <span className="font-bold">{incident.relationships?.incident_type?.name}</span>
               <span className="text-red-200 mt-0.5">{incident.attributes?.description || 'Sin descripción'}</span>
               {incident.relationships?.store && (
                 <span className="text-red-300 text-[10px] mt-1 border-t border-red-700/50 pt-1">
                   {incident.relationships.store.name}
                 </span>
               )}
            </div>
          </div>
        </Marker>
      );
    });
  };

  return (
    <div className="w-full h-full relative z-0">
      <Map
        {...viewState}
        onMove={onMove}
        onDragStart={onDragStart}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {geofencesData && geofencesData.features?.length > 0 && (
          <Source id="geofences-source" type="geojson" data={geofencesData}>
            <Layer
              id="geofences-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'state'],
                  'pending', '#3b82f6',
                  'in_progress', '#eab308',
                  'completed', '#22c55e',
                  '#94a3b8'
                ],
                'fill-opacity': 0.15
              }}
            />
            <Layer
              id="geofences-outline"
              type="line"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'state'],
                  'pending', '#2563eb',
                  'in_progress', '#ca8a04',
                  'completed', '#16a34a',
                  '#64748b'
                ],
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {mapPoints && mapPoints.map(point => {
          if (!point.position?.lng || !point.position?.lat) return null;

          return (
            <Marker
              key={`stop-${point.id}`}
              longitude={point.position.lng}
              latitude={point.position.lat}
              anchor="center"
            >
              <div className="relative flex flex-col items-center group cursor-pointer">
                <div className={`p-2 rounded-full border-2 border-white shadow-md transition-colors ${point.state === 'completed' ? 'bg-green-500' : 'bg-slate-600'
                  }`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="absolute bottom-full mb-1 flex-col items-center hidden group-hover:flex bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded whitespace-nowrap z-50 shadow-lg">
                  <span className="font-bold">{point.name}</span>
                  <span className="text-slate-300 text-[9px] mt-0.5 border-t border-slate-700 pt-0.5">
                    {point.position.lat.toFixed(5)}, {point.position.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}

        {vehiclePosition?.longitude && vehiclePosition?.latitude && (
          <Marker
            longitude={vehiclePosition.longitude}
            latitude={vehiclePosition.latitude}
            anchor="center"
            style={{ zIndex: 50 }}
          >
            <div className="relative flex flex-col items-center">
              <div className="bg-slate-900 p-3 rounded-xl shadow-2xl border-2 border-white">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping z-[-1]"></div>
            </div>
          </Marker>
        )}

        {/* MARCADORES DE MULTIPLES VEHÍCULOS (Dashboard) */}
        {activeVehicles && activeVehicles.map((vehicle, idx) => {
          // Check if this vehicle has a critical incident associated
          const criticalIncident = incidents.find(
            inc => inc.attributes?.route_id === vehicle.routeId &&
            (inc.relationships?.incident_type?.severity === 'CRITICAL' || inc.relationships?.incident_type?.severity === 'HIGH')
          );

          return (
            <Marker
              key={`vehicle-${vehicle.routeId || idx}`}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              anchor="center"
              style={{ zIndex: 50 }}
            >
              <div className="relative flex flex-col items-center">
                {/* Speech Bubble for Critical Incidents */}
                {criticalIncident && (
                  <div className="absolute bottom-full mb-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl animate-bounce whitespace-nowrap z-50 flex items-center gap-1 border-2 border-red-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    {criticalIncident.relationships?.incident_type?.name || 'ALERTA'}
                    {/* Triangulito del globo */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-red-600 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                  </div>
                )}

                <div className={`p-3 rounded-xl shadow-2xl border-2 border-white ${criticalIncident ? 'bg-red-700 animate-pulse' : 'bg-slate-900'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="mt-1 bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold text-slate-800 uppercase">
                  {vehicle.routeName || `Ruta ${vehicle.routeId}`}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Render Incidents */}
        {renderIncidents()}

      </Map>

      {/* Recenter Button */}
      {isUserInteracting && (
        <button
          onClick={onRecenter}
          className="absolute top-24 right-4 z-20 bg-white p-3 rounded-full shadow-lg border-2 border-blue-500 text-blue-500 active:scale-95 transition-transform"
          title="Centrar en vehículo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Floating minimalist incident list (top right) */}
      {incidents.length > 0 && (
         <div className="absolute top-24 left-4 z-20 flex flex-col gap-2 max-h-48 overflow-y-auto w-64">
           {incidents.map((inc, i) => (
             <div key={`toast-${inc.id || i}`} className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-lg border border-red-500/30 flex items-start gap-2 animate-fade-in">
                <div className="pt-0.5">
                  <span className="flex w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-400">{inc.relationships?.incident_type?.name}</p>
                  <p className="text-[10px] text-slate-300 leading-tight">{inc.attributes?.description}</p>
                </div>
             </div>
           ))}
         </div>
      )}
    </div>
  );
}
