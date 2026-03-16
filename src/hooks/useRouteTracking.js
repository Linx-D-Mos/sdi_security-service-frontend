import { useState, useEffect, useMemo, useCallback } from 'react';
import echo from '../utils/echo';
import * as turf from '@turf/turf';


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
  const fetchRouteData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const headers = { 'Accept': 'application/json', 'X-User-Id': '1' };

      const [routeRes, typesRes] = await Promise.all([
        fetch(`http://localhost/api/v1/routes/${routeId}?include[]=vehicle&include[]=routeStops.store&include[]=routeStops.routeStopState`, { headers }),
        fetch(`http://localhost/api/v1/incident-types`, { headers })
      ]);

      const routeJson = await routeRes.json();
      const typesJson = await typesRes.json();

      const route = routeJson.data;
      if (route) {
        setRouteData(route);
        setRouteInfo(prev => ({
          ...prev,
          route_name: route.attributes.route_name || `Ruta #${routeId}`
        }));

        const stops = route.relationships?.route_stops || [];
        const sortedStops = [...stops].sort((a, b) => (a.attributes?.visit_order || 0) - (b.attributes?.visit_order || 0));
        setRouteStops(sortedStops);

        // Actualización de posición inicial solo si no tenemos una
        if (showLoading) {
          const lastLocation = route.attributes?.last_known_location;
          if (lastLocation?.lat && lastLocation?.lng) {
            setVehiclePosition({ latitude: lastLocation.lat, longitude: lastLocation.lng });
          } else if (sortedStops.length > 0) {
            const firstLocation = sortedStops[0].relationships?.store?.attributes?.location?.coordinates;
            if (firstLocation) {
              setVehiclePosition({ latitude: firstLocation[1], longitude: firstLocation[0] });
            }
          }
        }
      }
      setIncidentTypes(typesJson.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [routeId]);

  // 2. EL USE EFFECT AHORA SOLO LLAMA A LA FUNCIÓN
  useEffect(() => {
    fetchRouteData(true);
  }, [fetchRouteData]);
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

  // 3. ACTUALIZAMOS HANDLE CHECK-IN PARA QUE REFRESQUE LA UI
  const handleCheckIn = async (stopId) => {
    try {
      const response = await fetch(`http://localhost/api/v1/route-stops/${stopId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          latitude: vehiclePosition.latitude,
          longitude: vehiclePosition.longitude
        })
      });

      if (response.ok) {
        console.log("Check-in exitoso");
        // ¡LA MAGIA! Refrescamos los datos en silencio (sin pantalla de carga completa)
        await fetchRouteData(false);
      } else {
        const err = await response.json();
        alert(`Error en Check-in: ${err.message || 'Fuera de rango'}`);
      }
    } catch (error) {
      console.error("Error en Check-in:", error);
    }
  };

  // 4. NUEVA FUNCIÓN: HANDLE CHECK-OUT
  const handleCheckOut = async (stopId, bagsAmount) => {
    try {
      const response = await fetch(`http://localhost/api/v1/route-stops/${stopId}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          bags_amount: parseInt(bagsAmount, 10)
        })
      });

      if (response.ok) {
        console.log("Check-out exitoso");
        alert(`Check-out exitoso. Se recolectaron ${bagsAmount} tulas.`);
        // ¡LA MAGIA OTRA VEZ! Refrescamos la ruta para que pase a "Completed" (Verde)
        await fetchRouteData(false);
      } else {
        const err = await response.json();
        alert(`Error en Check-out: ${err.message}`);
      }
    } catch (error) {
      console.error("Error en Check-out:", error);
    }
  };
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

  // Mapeo limpio para el mapa
  const mapPoints = useMemo(() => {
    return routeStops.map(stop => {
      const store = stop.relationships?.store?.attributes;
      return {
        id: stop.id,
        name: store?.name,
        position: store?.location?.coordinates ? {
          lat: store.location.coordinates[1],
          lng: store.location.coordinates[0]
        } : null,
        state: stop.relationships?.route_stop_states?.attributes?.code,
        radius: store?.geofence_radius_meters || 50 // Default a 50m si es null
      };
    });
  }, [routeStops]);
  const activeStop = mapPoints.find(p => p.state === 'pending');

  // Calcular distancia en tiempo real al objetivo
  let distanceToTarget = null;
  let isWithinGeofence = false;

  if (activeStop && activeStop.position && vehiclePosition.longitude) {
    const from = turf.point([vehiclePosition.longitude, vehiclePosition.latitude]);
    const to = turf.point([activeStop.position.lng, activeStop.position.lat]);

    // Turf nos da la distancia en metros
    distanceToTarget = Math.round(turf.distance(from, to, { units: 'meters' }));
    isWithinGeofence = distanceToTarget <= activeStop.radius;
  }

  return {
    vehiclePosition, routeInfo, routeStops, mapPoints, isLoading, handleCheckIn, handleReportIncident, handleCheckOut, activeStop,
    distanceToTarget,
    isWithinGeofence
  };
}