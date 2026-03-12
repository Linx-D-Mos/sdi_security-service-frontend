import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Pusher from 'pusher-js';

// Reemplaza con tu token real de Mapbox si usas react-map-gl con Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbGo3dHRpY28waDNnM2xzNm1ya2M2YnhxIn0.demo';

export default function RouteTrackingView() {
  // Fase 2: Estado del mapa y vehículo
  const [vehiclePosition, setVehiclePosition] = useState({
    longitude: -79.9, // Ejemplo Guayaquil / Quito
    latitude: -2.18,
  });

  // Estado mock para la parada activa
  const [isCheckInCompleted, setIsCheckInCompleted] = useState(false);

  // Fase 3: Integración WebSockets
  useEffect(() => {
    // Configuración estricta para entorno local Docker/Reverb
    const pusher = new Pusher('cashcontrol_local_key', {
      cluster: 'mt1',
      wsHost: '127.0.0.1',
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });

    const channel = pusher.subscribe('private-routes.1');
    channel.bind('VehicleLocationUpdated', (data) => {
      if (data && data.latitude && data.longitude) {
        setVehiclePosition({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    channel.bind('RouteSignalLost', () => {
      console.warn('Señal de ruta perdida');
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  // Fase 4: Botón Mock
  const handleCheckIn = () => {
    console.log('Check-in emitido');
    setIsCheckInCompleted(true);
  };

  return (
    // Fase 1: Estructura flexbox para móvil (h-screen, flex-col)
    <div className="flex flex-col h-screen w-full bg-slate-100 relative overflow-hidden">

      {/* MAPA: Ocupa el espacio restante dinámicamente con flex-1 */}
      <main className="flex-1 w-full relative z-0">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: vehiclePosition.longitude,
            latitude: vehiclePosition.latitude,
            zoom: 14,
          }}
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
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  ></path>
                </svg>
              </div>
              {/* Pulse radar effect */}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping z-[-1]"></div>
              <div className="mt-2 bg-white px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-800 uppercase tracking-tight">
                Unidad 402
              </div>
            </div>
          </Marker>
        </Map>

        {/* HEADER FLOTANTE (Sobre el mapa) - Padding Notch Safe con env() */}
        <header className="absolute top-0 left-0 right-0 z-10 pt-[max(env(safe-area-inset-top),1rem)] px-4 pb-4 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 flex items-center justify-between border border-white/50 pointer-events-auto mt-4">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 p-2 rounded-lg">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  ></path>
                </svg>
              </div>
              <div>
                <h1 className="text-slate-900 font-bold text-lg leading-tight">
                  Ruta #1042
                </h1>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">
                    GPS Activo
                  </span>
                </div>
              </div>
            </div>
            <button className="bg-slate-100 p-2.5 rounded-xl active:bg-slate-200 transition-colors">
              <svg
                className="h-6 w-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>
          </div>
        </header>

        {/* FAB INCIDENTE (Sobre el mapa, justo arriba del bottom sheet) */}
        <div className="absolute bottom-6 right-4 z-20">
          <button className="flex flex-col items-center justify-center w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl active:scale-95 transition-transform border-4 border-white pointer-events-auto">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <span className="text-[8px] font-bold uppercase mt-0.5">Alert</span>
          </button>
        </div>
      </main>

      {/* BOTTOM SHEET: Flex child para tamaño dinámico */}
      <section className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 flex flex-col shrink-0 flex-basis-[40%] min-h-[40vh] max-h-[60vh] -mt-6">
        {/* Drag handle */}
        <div className="w-full flex justify-center py-4 shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Próximas Paradas</h2>
        </div>

        {/* Timeline Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">

          {/* STOP 1: Completed */}
          <div className="relative flex items-start group">
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6"></div>
            <div className="z-10 bg-emerald-100 rounded-full p-1 border-4 border-white">
              <svg
                className="h-6 w-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <div className="ml-4 opacity-50">
              <p className="text-sm font-semibold text-slate-900 line-through">
                Banco Central - Sucursal Norte
              </p>
              <p className="text-xs text-slate-500">Completada 09:45 AM</p>
            </div>
          </div>

          {/* STOP 2: Active (cambia a completada tras Check-In) */}
          {isCheckInCompleted ? (
            <div className="relative flex items-start group">
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6"></div>
              <div className="z-10 bg-emerald-100 rounded-full p-1 border-4 border-white">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div className="ml-4 opacity-50 transition-opacity duration-500">
                <p className="text-sm font-semibold text-slate-900 line-through">
                  Cajero Automático Plaza Real
                </p>
                <p className="text-xs text-slate-500">Completada (Reciente)</p>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col">
              <div className="flex items-start">
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6"></div>
                <div className="z-10 bg-blue-600 rounded-full p-2.5 border-4 border-white shadow-md">
                  <div className="h-3 w-3 bg-white rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-base font-bold text-slate-900">
                    Cajero Automático Plaza Real
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    En Progreso • Estimado: 10:20 AM
                  </p>
                </div>
              </div>
              <div className="ml-14 mt-4 space-y-3">
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-lg active:bg-slate-800 transition-all flex items-center justify-center min-h-[44px]"
                >
                  Check-In (Manual)
                </button>
                <button className="w-full bg-white text-slate-700 font-semibold py-3 px-6 rounded-2xl border-2 border-slate-200 active:bg-slate-50 transition-all flex items-center justify-center min-h-[44px]">
                  Reportar Novedad en Parada
                </button>
              </div>
            </div>
          )}

          {/* STOP 3: Pending */}
          <div className="relative flex items-start">
            <div className="z-10 bg-slate-100 rounded-full p-2 border-4 border-white">
              <div className="h-3 w-3 bg-slate-300 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-400">
                Retail Mall - Recolección
              </p>
              <p className="text-xs text-slate-400">
                Pendiente • Estimado: 11:05 AM
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
