import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import echo from '../utils/echo';

export default function useObservabilityDashboard() {
  const [activeVehicles, setActiveVehicles] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activeRouteIds, setActiveRouteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActive: 0,
    criticalIncidents: 0,
    warnings: 0
  });

  const vehicleBufferRef = useRef({});
  const User = 12;
  // Fetch initial state via Promise.all (State Hydration)
  const fetchInitialState = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = { 'Accept': 'application/json', 'X-User-Id': User };

      const [routesRes, notificationsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/active-routes`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications`, { headers })
      ]);

      const routesJson = await routesRes.json();
      const notifsJson = await notificationsRes.json();

      const routes = routesJson.data || [];
      const notifs = notifsJson.data || [];

      const initialVehicles = {};
      const ids = [];

      routes.forEach(route => {
        const attrs = route.attributes;
        if (!attrs) return;

        const routeId = attrs.route_id;
        ids.push(routeId);

        const tracking = attrs.tracking || {};
        const lastLocation = tracking.last_known_location || {};

        initialVehicles[routeId] = {
          routeId: routeId,
          routeName: attrs.route_name || `Ruta #${routeId}`,
          latitude: lastLocation.lat || 0,
          longitude: lastLocation.lng || 0,
          speed: 0,
          lastUpdated: new Date().toISOString(),
          signalLost: tracking.is_signal_lost || false
        };
      });

      setActiveVehicles(initialVehicles);
      vehicleBufferRef.current = initialVehicles;
      setNotifications(notifs);
      setActiveRouteIds(ids);

    } catch (error) {
      console.error('Error fetching initial state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  // Calculate stats whenever vehicles or notifications change
  useEffect(() => {
    const critical = notifications.filter(n => {
      const severity = n.attributes?.data?.severity;
      return severity === 'CRITICAL';
    }).length;

    setStats({
      totalActive: Object.keys(activeVehicles).length,
      criticalIncidents: critical,
      warnings: notifications.length - critical
    });
  }, [activeVehicles, notifications]);

  // Connect to websockets for the monitoring dashboard
  useEffect(() => {
    const globalChannelName = 'monitoring.dashboard';
    const globalChannel = echo.private(globalChannelName);

    const throttleInterval = setInterval(() => {
      // Solo actualizamos si hubo cambios reales en el buffer (optimización extra)
      setActiveVehicles(prev => {
        // Un chequeo superficial para no renderizar si no hay novedades
        if (JSON.stringify(prev) === JSON.stringify(vehicleBufferRef.current)) {
          return prev;
        }
        return { ...vehicleBufferRef.current };
      });
    }, 1500);
    globalChannel.listen('.vehicle.location.updated', (eventPayload) => {
      const data = eventPayload.data?.attributes || eventPayload.attributes || eventPayload.data || eventPayload;
      let lat = data.lat || data.latitude;
      let lng = data.lng || data.longitude;
      const routeId = data.route_id || data.routeId || eventPayload.route_id;

      if (data.coordinate && data.coordinate.coordinates) {
        lng = data.coordinate.coordinates[0];
        lat = data.coordinate.coordinates[1];
      }

      if (lat !== undefined && lng !== undefined && routeId) {
        // ⚠️ MAGIA: Escribimos en el REF, no en el State. Esto NO re-renderiza React.
        vehicleBufferRef.current = {
          ...vehicleBufferRef.current,
          [routeId]: {
            ...(vehicleBufferRef.current[routeId] || {}),
            routeId,
            routeName: data.route_name || vehicleBufferRef.current[routeId]?.routeName || `Ruta #${routeId}`,
            latitude: Number(lat),
            longitude: Number(lng),
            speed: data.speed || vehicleBufferRef.current[routeId]?.speed || 0,
            lastUpdated: new Date().toISOString(),
            signalLost: false // Recupera la señal si recibe tracking
          }
        };
      }
    });

    globalChannel.listen('.route.signal.lost', (payload) => {
      // Actualizamos el REF inmediatamente
      vehicleBufferRef.current = {
        ...vehicleBufferRef.current,
        [payload.route_id]: {
          ...vehicleBufferRef.current[payload.route_id],
          signalLost: true,
          speed: 0
        }
      };
      // Aquí SÍ podríamos querer un render inmediato para emergencias, 
      // forzamos la actualización del state saltándonos el throttle:
      setActiveVehicles({ ...vehicleBufferRef.current });
    });
    // 3. 🚨 NUEVO: Escuchar Notificaciones en el Canal Global
    // Como la Ruta es el Notifiable, Laravel manda la BroadcastNotificationCreated a este canal
    globalChannel.listen('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', (eventPayload) => {
      console.log(`[WebSocket Dashboard] Notificación Broadcast recibida en Canal Global:`, eventPayload);

      const type = eventPayload.type;
      const dataPayload = eventPayload.data || eventPayload;

      const newNotification = {
        id: eventPayload.id || Date.now().toString(),
        attributes: {
          type: type || dataPayload.type || 'Notification',
          data: dataPayload,
          created_at_human: 'Ahora'
        }
      };

      const isSignalLost = type === 'SIGNAL_LOST' ||
        dataPayload.type === 'SIGNAL_LOST' ||
        (type && type.includes('SignalLostNotification'));

      const routeId = dataPayload.route_id || dataPayload.routeId;

      setNotifications(prev => {
        let filtered = prev;
        if (isSignalLost && routeId) {
          filtered = prev.filter(n => {
            const nType = n.attributes?.type || n.attributes?.data?.type || '';
            const nIsSignalLost = nType === 'SIGNAL_LOST' || nType.includes('SignalLostNotification');
            const nRouteId = n.attributes?.data?.route_id || n.attributes?.data?.routeId;

            if (nIsSignalLost && nRouteId === routeId) {
              return false;
            }
            return true;
          });
        }
        return [newNotification, ...filtered];
      });
    });
    return () => {
      echo.leave(globalChannelName);
      clearInterval(throttleInterval);
    };
  }, []); // Only subscribe once on mount

  const formattedVehicles = useMemo(() => {
    return Object.values(activeVehicles).map(v => ({
      id: v.routeId,
      placa: v.routeName, // o lo que corresponda a la placa
      velocidad: v.speed || 0,
      estadoSignal: v.signalLost ? 'signal_lost' : 'online',
      longitude: v.longitude,
      latitude: v.latitude
    }));
  }, [activeVehicles]);

  const formattedIncidents = useMemo(() => {
    if (!notifications) return [];

    // Filtrar SIGNAL_LOST y dejar solo severidad CRITICAL o HIGH
    const filteredNotifications = notifications.filter(notif => {
      const type = notif.attributes?.type || notif.attributes?.data?.type || '';
      const isSignalLost = type === 'SIGNAL_LOST' || type.includes('SignalLostNotification');
      if (isSignalLost) return false;

      const severity = notif.attributes?.data?.severity;
      return severity === 'CRITICAL' || severity === 'HIGH';
    });

    return filteredNotifications.map((notif, i) => {
      const attrs = notif.attributes || {};
      const data = attrs.data || {};
      const severity = data.severity || 'LOW';
      return {
        id: notif.id || `notif-${i}`,
        title: data.title || attrs.type || 'Alerta',
        time: attrs.created_at_human || 'Ahora',
        description: data.message || 'Sin descripción',
        severity: severity
      };
    });
  }, [notifications]);

  return { activeVehicles, formattedVehicles, notifications, formattedIncidents, stats, isLoading, refetch: fetchInitialState, dismissNotification };
}
