import { useState, useEffect } from 'react';
import echo from '../utils/echo';

export default function useRouteTracking(routeId) {
  const [vehiclePosition, setVehiclePosition] = useState({
    longitude: -74.0817,
    latitude: 4.6897,
  });
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [routeInfo, setRouteInfo] = useState({
    route_name: 'Cargando...',
    speed: 0,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const mapPoints = routeStops.map(stop => {
    const store = stop.relationships?.store?.attributes;
    return {
      id: stop.id,
      name: store?.name,
      // PostGIS/Magellan entrega [lng, lat], asegúrate de mapearlo bien
      position: {
        lat: store?.location?.coordinates[1],
        lng: store?.location?.coordinates[0]
      },
      state: stop.relationships?.route_stop_states?.attributes?.code,
      radius: store?.geofence_radius_meters
    };
  });
  // 1. CARGA INICIAL DE LA API
  useEffect(() => {
    const fetchRouteData = async () => {
      setIsLoading(true);
      try {
        const url = `http://localhost/api/v1/routes/${routeId}?include[]=vehicle&include[]=routeStops.store&include[]=routeStops.routeStopCollection&include[]=routeStops.routeStopState&include[]=routeCrews.crewPersonRole`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'X-User-Id': '1'
          }
        });

        const jsonResponse = await response.json();

        // REGLA DE ORO: En Laravel Resources, la data real está en .data
        const route = jsonResponse.data;

        if (route && route.attributes) {
          setRouteData(route);
          setRouteInfo(prev => ({
            ...prev,
            route_name: route.attributes.route_name || `Ruta #${routeId}`
          }));

          // Mapeo y ordenamiento de paradas
          const stops = route.relationships?.route_stops || [];
          const sortedStops = [...stops].sort((a, b) =>
            (a.attributes?.visit_order || 0) - (b.attributes?.visit_order || 0)
          );
          setRouteStops(sortedStops);

          const lastLocation = route.attributes?.last_known_location;

          if (lastLocation && lastLocation.lat && lastLocation.lng) {
            setVehiclePosition({
              latitude: lastLocation.lat,
              longitude: lastLocation.lng
            });
          }
          // 2. Fallback: Si no hay tracking previo, ubicamos el camión en la primera parada
          else if (sortedStops.length > 0) {
            const firstStopLocation = sortedStops[0].relationships?.store?.attributes?.location?.coordinates;
            if (firstStopLocation) {
              setVehiclePosition({
                latitude: firstStopLocation[1], // Recuerda: PostGIS es [Lng, Lat]
                longitude: firstStopLocation[0]
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouteData();
  }, [routeId]);

  // 2. SUBSCRIPCIÓN A WEBSOCKETS
  useEffect(() => {
    const channelName = `routes.${routeId}`;
    const channel = echo.private(channelName);

    channel.listen('.App\\Events\\RouteTracking\\VehicleLocationUpdated', (eventPayload) => {
      // Laravel a veces envía el evento con 'attributes' o directo
      const data = eventPayload.attributes || eventPayload;

      if (data && data.lat && data.lng) {
        setVehiclePosition({
          latitude: data.lat,
          longitude: data.lng,
        });

        setRouteInfo(prev => ({
          ...prev,
          // Usamos el operador ?. para evitar crashes si routeData aún es null
          route_name: data.route_name || routeData?.attributes?.route_name || `Ruta #${routeId}`,
          speed: data.speed || 0,
          isActive: true,
        }));
      }
    });

    channel.listen('.App\\Events\\RouteTracking\\RouteSignalLost', () => {
      setRouteInfo((prev) => ({ ...prev, isActive: false }));
    });

    return () => {
      echo.leave(channelName);
    };
  }, [routeId, routeData]); // Se re-suscribe si routeData cambia para tener el nombre actualizado

  const handleCheckIn = async (stopId) => {
    try {
      const response = await fetch(`http://localhost/api/v1/route-stops/${stopId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': '1' // Temporal, luego vía Auth
        },
        body: JSON.stringify({
          latitude: vehiclePosition.latitude,
          longitude: vehiclePosition.longitude
        })
      });

      if (response.ok) {
        // Refrescar datos o actualizar estado local
        console.log("Check-in exitoso");
      }
    } catch (error) {
      console.error("Error en Check-in:", error);
    }
  };
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const headers = { 'Accept': 'application/json', 'X-User-Id': '1' };

        // Carga paralela de Ruta y Tipos de Incidentes
        const [routeRes, typesRes] = await Promise.all([
          fetch(`http://localhost/api/v1/routes/${routeId}?include[]=vehicle&include[]=routeStops.store&include[]=routeStops.routeStopState`, { headers }),
          fetch(`http://localhost/api/v1/incident-types`, { headers })
        ]);

        const routeJson = await routeRes.json();
        const typesJson = await typesRes.json();

        // Procesar Ruta
        const route = routeJson.data;
        if (route) {
          setRouteStops(route.relationships?.route_stops || []);
          // ... lógica de posicion inicial que ya teníamos ...
        }

        // Procesar Tipos de Incidentes (Mapeo de códigos a IDs)
        setIncidentTypes(typesJson.data || []);

      } catch (error) {
        console.error('Error inicializando tracking:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [routeId]);

  // ... lógica de websockets igual ...

  // 2. NUEVA FUNCIÓN: Reportar Incidente
  const handleReportIncident = async (stopId, typeCode) => {
    // Buscar el ID del incidente según el código enviado (ej: 'CLOSE_STORE')
    const type = incidentTypes.find(t => t.attributes.code === typeCode);

    if (!type) {
      console.error(`Tipo de incidente ${typeCode} no encontrado en el sistema.`);
      return;
    }

    // Para el Sandbox, pedimos una descripción rápida
    const description = window.prompt(`Reportar incidente: ${type.attributes.display_name}. Ingrese descripción:`, "Punto de venta inaccesible.");

    if (description === null) return; // Cancelado por usuario

    try {
      const response = await fetch(`http://localhost/api/v1/routes/${routeId}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          route_stop_id: stopId,
          route_incident_type_id: type.id,
          description: description,
          // evidences: [] // Por ahora opcional en el sandbox si el type no lo exige
        })
      });

      if (response.ok) {
        alert("Incidente reportado exitosamente. La central ha sido notificada.");
        // Aquí podrías recargar los datos para ver la parada como 'FAILED'
      } else {
        const err = await response.json();
        alert(`Error: ${err.message || 'No se pudo reportar'}`);
      }
    } catch (error) {
      console.error("Error en reporte:", error);
    }
  };

  return { vehiclePosition, routeInfo, routeStops, mapPoints, isLoading, handleCheckIn, handleReportIncident };
}