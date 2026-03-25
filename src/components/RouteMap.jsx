import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import VehicleMarker from './dashboard/VehicleMarker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

const RouteMap = ({
  mapPoints = [],
  vehiclePosition, // For single route tracking
  isVehicleActive = true,
  routeName,
  activeVehicles = [], // For dashboard multiple vehicles
  incidents = [], // array of incidents
}) => {
  const [viewState, setViewState] = useState({
    longitude: -74.0817,
    latitude: 4.6897,
    zoom: 12
  });

  const [isUserInteracting, setIsUserInteracting] = useState(false);

  useEffect(() => {
    if (!isUserInteracting && vehiclePosition?.longitude && vehiclePosition?.latitude) {
      setViewState(prev => ({
        ...prev,
        longitude: vehiclePosition.longitude,
        latitude: vehiclePosition.latitude,
      }));
    }
  }, [vehiclePosition, isUserInteracting]);

  const geofencesData = useMemo(() => {
    const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
    if (!mapPoints || mapPoints.length === 0) return emptyGeoJSON;

    const validPoints = mapPoints.filter(p => p.position?.lng && p.position?.lat);
    if (validPoints.length === 0) return emptyGeoJSON;

    const features = validPoints.map(point => {
      const radiusInKm = (point.radius || 50) / 1000;
      const circle = turf.circle([point.position.lng, point.position.lat], radiusInKm, {
        units: 'kilometers',
        steps: 64
      });
      circle.properties = { id: point.id, state: point.state, name: point.name };
      return circle;
    });

    return JSON.parse(JSON.stringify(turf.featureCollection(features)));
  }, [mapPoints]);

  const onRecenter = () => setIsUserInteracting(false);

  const markerScale = Math.max(0.4, Math.min(1.2, (viewState.zoom || 12) / 14));

  const mappedIncidents = useMemo(() => {
    return incidents.map((incident, idx) => {
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
        const matchingVehicle = activeVehicles.find(v => v.routeId === incident.attributes?.route_id);
        if (matchingVehicle) {
          lat = matchingVehicle.latitude;
          lng = matchingVehicle.longitude;
        } else {
          lat = vehiclePosition?.latitude;
          lng = vehiclePosition?.longitude;
        }
      }

      return { ...incident, _idx: idx, _lat: lat, _lng: lng };
    }).filter(inc => inc._lat && inc._lng);
  }, [incidents, mapPoints, activeVehicles, vehiclePosition]);
  const renderIncidents = () => {
    return mappedIncidents.map((incident) => {
      const lat = incident._lat;
      const lng = incident._lng;

      const severity = incident.relationships?.incident_type?.severity || 'LOW';
      const isCritical = severity === 'CRITICAL' || severity === 'HIGH';

      return (
        <Marker
          key={`incident-${incident.id || incident._idx}`}
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          style={{ zIndex: 60 }} // Above truck and stores
        >
          <div className="will-change-transform" style={{ transform: `scale(${markerScale})`, transformOrigin: 'bottom center' }}>
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
          </div>
        </Marker>
      );
    });
  };

  return (
    <div className="w-full h-full relative z-0">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={() => setIsUserInteracting(true)}
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
              <div
                className="relative flex flex-col items-center group cursor-pointer will-change-transform"
                style={{ transform: `scale(${markerScale})`, transformOrigin: 'bottom center' }}
              >
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
          <VehicleMarker
            longitude={vehiclePosition.longitude}
            latitude={vehiclePosition.latitude}
            label={routeName || 'Vehículo'}
            signalStatus={isVehicleActive ? 'online' : 'signal_lost'}
            scale={markerScale}
          />
        )}

        {/* MARCADORES DE MULTIPLES VEHÍCULOS (Dashboard) */}
        {activeVehicles && activeVehicles.map((vehicle, idx) => {
          // Buscamos incidentes
          const criticalIncident = incidents.find(
            inc => inc.attributes?.route_id === vehicle.id && // Ojo: en tu dashboard es vehicle.id, no vehicle.routeId
              (inc.relationships?.incident_type?.severity === 'CRITICAL' || inc.relationships?.incident_type?.severity === 'HIGH')
          );

          return (
            <VehicleMarker
              key={`vehicle-${vehicle.id || idx}`}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              label={vehicle.placa || `Ruta ${vehicle.id}`}
              signalStatus={vehicle.estadoSignal}
              criticalIncident={criticalIncident}
              scale={markerScale}
            />
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

export default RouteMap;
