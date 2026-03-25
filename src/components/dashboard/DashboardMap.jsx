import React, { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import VehicleMarker from './VehicleMarker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

/**
 * DashboardMap
 * Contenedor del mapa principal. Limpio en el centro.
 */
export default function DashboardMap({
  focusLocation,
  vehicles = [],
  routesPolylines = [], // Array de { id, coordinates: [[lng, lat], ...], status: 'active' | 'stopped' | 'alert' }
}) {
  const [viewState, setViewState] = useState({
    longitude: -74.0817,
    latitude: 4.6897,
    zoom: 12
  });

  useEffect(() => {
    if (focusLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: focusLocation.longitude,
        latitude: focusLocation.latitude,
        zoom: focusLocation.zoom || 15
      }));
    }
  }, [focusLocation]);

  // Construir sources dinámicamente para las rutas
  const routeSources = useMemo(() => {
    if (!Array.isArray(routesPolylines)) return [];
    
    return routesPolylines.map(route => {
      // Determinar color de línea basado en estado
      const colorMap = {
        active: '#22c55e', // Verde
        stopped: '#f59e0b', // Ámbar
        alert: '#ef4444' // Rojo
      };
      
      const lineColor = colorMap[route.status] || '#94a3b8';

      const geojson = {
        type: 'Feature',
        properties: { color: lineColor },
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates
        }
      };

      return {
        id: route.id,
        geojson,
        color: lineColor
      };
    });
  }, [routesPolylines]);

  // Factor de escala dinámico basado en zoom
  const markerScale = Math.max(0.4, Math.min(1.2, (viewState.zoom || 12) / 14));

  return (
    <div className="w-full h-full relative z-0">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render Routes Polylines */}
        {routeSources.map(r => (
          <Source key={`source-${r.id}`} id={`route-${r.id}`} type="geojson" data={r.geojson}>
            <Layer
              id={`layer-${r.id}`}
              type="line"
              paint={{
                'line-color': r.color,
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        ))}

        {/* Render Vehicle Markers */}
        {vehicles.map((v, i) => (
          <VehicleMarker
            key={`vehicle-${v.id || i}`}
            longitude={v.longitude}
            latitude={v.latitude}
            label={v.placa}
            signalStatus={v.estadoSignal}
            scale={markerScale}
          />
        ))}
      </Map>
    </div>
  );
}
