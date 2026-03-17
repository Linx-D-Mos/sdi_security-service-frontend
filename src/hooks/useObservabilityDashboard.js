import { useState, useEffect, useCallback } from 'react';
import echo from '../utils/echo';

export default function useObservabilityDashboard() {
  const [activeVehicles, setActiveVehicles] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [activeRouteIds, setActiveRouteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActive: 0,
    criticalIncidents: 0,
    warnings: 0
  });

  // Fetch initial active routes
  const fetchActiveRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = { 'Accept': 'application/json', 'X-User-Id': '1' };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/routes?paginate=true&include[]=routeStops.store&include[]=routeStops.routeStopState&filter[status]=in_progress&include[]=routeIncidents`, { headers });
      const json = await res.json();
      const routes = json.data || [];

      const initialVehicles = {};
      const initialIncidents = [];
      const ids = [];

      routes.forEach(route => {
        ids.push(route.id);
        const attrs = route.attributes;
        const lastLocation = attrs?.last_known_location;

        // Populate initial vehicle positions
        if (lastLocation?.lat && lastLocation?.lng) {
          initialVehicles[route.id] = {
            routeId: route.id,
            routeName: attrs?.route_name || `Ruta #${route.id}`,
            latitude: lastLocation.lat,
            longitude: lastLocation.lng,
            speed: 0,
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Try to find the first store's location if no last known location
          const stops = route.relationships?.route_stops || [];
          const sortedStops = [...stops].sort((a, b) => (a.attributes?.visit_order || 0) - (b.attributes?.visit_order || 0));
          if (sortedStops.length > 0) {
            const firstLocation = sortedStops[0].relationships?.store?.attributes?.location?.coordinates;
            if (firstLocation) {
              initialVehicles[route.id] = {
                routeId: route.id,
                routeName: attrs?.route_name || `Ruta #${route.id}`,
                latitude: firstLocation[1],
                longitude: firstLocation[0],
                speed: 0,
                lastUpdated: new Date().toISOString()
              };
            }
          }
        }

        // Extract existing incidents from relationships
        if (route.relationships?.route_incidents) {
          initialIncidents.push(...route.relationships.route_incidents);
        }
      });

      setActiveVehicles(initialVehicles);
      setIncidents(initialIncidents);
      setActiveRouteIds(ids);

    } catch (error) {
      console.error('Error fetching active routes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveRoutes();
  }, [fetchActiveRoutes]);


  // Calculate stats whenever vehicles or incidents change
  useEffect(() => {
    const critical = incidents.filter(i => i.relationships?.incident_type?.severity === 'CRITICAL' || i.relationships?.incident_type?.severity === 'HIGH').length;

    setStats({
      totalActive: Object.keys(activeVehicles).length,
      criticalIncidents: critical,
      warnings: incidents.length - critical
    });
  }, [activeVehicles, incidents]);

  // Connect to websockets for the dynamically fetched route IDs
  useEffect(() => {
    if (activeRouteIds.length === 0) return;

    const channels = [];

    activeRouteIds.forEach(routeId => {
      const channelName = `routes.${routeId}`;
      const channel = echo.private(channelName);
      channels.push(channel);

      // Listen to vehicle positions
      channel.listen('.vehicle.location.updated', (eventPayload) => {
        const data = eventPayload.attributes || eventPayload;

        if (data && data.lat && data.lng) {
          setActiveVehicles(prev => ({
            ...prev,
            [routeId]: {
              routeId,
              routeName: data.route_name || `Ruta #${routeId}`,
              latitude: data.lat,
              longitude: data.lng,
              speed: data.speed || 0,
              lastUpdated: new Date().toISOString()
            }
          }));
        }
      });

      // Listen to incidents
      channel.listen('.route.incident.reported', (eventPayload) => {
        const incidentData = eventPayload.attributes ? eventPayload : { attributes: eventPayload }; // Fallback struct
        setIncidents(prev => [incidentData, ...prev]);
      });

      channel.listen('.route.signal.lost', () => {
        // Mark vehicle as offline or remove it
        setActiveVehicles(prev => {
          const copy = { ...prev };
          if (copy[routeId]) {
            copy[routeId].speed = 0;
            copy[routeId].signalLost = true;
          }
          return copy;
        });
      });
    });

    return () => {
      channels.forEach(ch => {
        echo.leave(ch.name);
      });
    };
  }, [activeRouteIds]);

  return { activeVehicles, incidents, stats, isLoading, refetch: fetchActiveRoutes };
}
