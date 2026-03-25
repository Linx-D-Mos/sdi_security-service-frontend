import React, { useState, useMemo } from 'react';
import CriticalAlertsWidget from './dashboard/CriticalAlertsWidget';
import IncidentFeedWidget from './dashboard/IncidentFeedWidget';
import ActiveUnitsWidget from './dashboard/ActiveUnitsWidget';
import DashboardMap from './dashboard/DashboardMap';
import useObservabilityDashboard from '../hooks/useObservabilityDashboard';

export default function ObservabilityDashboard() {
  const { formattedVehicles: vehicles, formattedIncidents, notifications, stats, isLoading, dismissNotification } = useObservabilityDashboard();

  // Ubicación a enfocar en el mapa
  const [focusLocation, setFocusLocation] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle state para el Sidebar Izquierdo responsivo
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return true;
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const handleVehicleClick = (v) => {
    // Centrar mapa al hacer click en el sidebar
    setFocusLocation({
      longitude: v.longitude,
      latitude: v.latitude,
      zoom: 15
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <span className="font-bold text-slate-300 tracking-wider">Inicializando Centro de Control...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans">

      {/* Overlay para móviles */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR: Oscuro (bg-slate-950) con Animación Plegable */}
      <aside
        className={`bg-slate-950 border-r border-slate-900 flex flex-col shrink-0 text-slate-200 shadow-[5px_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out overflow-hidden
          fixed inset-y-0 left-0 z-30 md:relative md:flex
          ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 md:w-0 md:translate-x-0 md:border-r-0'}
        `}
      >
        <div className="w-80 h-full flex flex-col shrink-0">
          {/* Header App */}
          <div className="p-6">
            <h1 className="text-xl font-bold text-white tracking-wide">Centro de Control</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold opacity-80">
              Monitor de Operaciones
            </p>
          </div>

          {/* Stats Grid */}
          <div className="px-6 flex flex-col gap-4 mb-6">
            {/* Rutas Activas */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Rutas Activas</span>
              <span className="text-4xl font-black text-slate-800">{stats.totalActive}</span>
            </div>

            {/* Alertas Críticas (Dinámica) */}
            <CriticalAlertsWidget count={stats.criticalIncidents} />
          </div>

          {/* Feed de Incidentes */}
          <IncidentFeedWidget incidents={formattedIncidents} onDismiss={dismissNotification} />
        </div>
      </aside>

      {/* MAP AREA: Claro y central */}
      <main className="flex-1 relative bg-slate-200">

        {/* Toggle Sidebar Button / Hamburger FAB */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl shadow-lg border-2 border-slate-700/50 backdrop-blur transition-all active:scale-95 group
            ${isSidebarOpen ? 'left-[calc(20rem+1rem)] md:left-6' : 'left-6'}
          `}
          title={isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        >
          {!isSidebarOpen ? (
            <svg className="w-5 h-5 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 transition-transform duration-300 text-slate-300 group-hover:text-white md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>

        {/* Campana de Notificaciones */}
        <div className="absolute top-6 right-6 z-50">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg border-2 border-slate-700/50 backdrop-blur transition-all active:scale-95 group relative"
            >
              <svg className="w-5 h-5 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] font-bold items-center justify-center border-2 border-slate-900">
                    {notifications.length}
                  </span>
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-down origin-top-right">
                <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
                  <h3 className="text-white font-bold">Notificaciones</h3>
                  <span className="text-xs text-slate-400 font-medium">{notifications?.length || 0} nuevas</span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {!notifications?.length ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const data = notif.attributes?.data || {};
                      const isCritical = data.severity === 'CRITICAL';
                      return (
                        <div key={notif.id} className="relative group p-3 hover:bg-slate-800/60 rounded-lg mb-1 transition-colors border border-transparent hover:border-slate-700/50">
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="absolute top-2 right-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800 rounded-full"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>

                          <div className="pr-6">
                            <h4 className={`text-sm font-bold mb-1 ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                              {data.title || 'Alerta'}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {data.message || 'Sin detalles'}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                              {notif.attributes?.created_at_human || 'Ahora'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* El mapa ocupa todo el fondo */}
        <DashboardMap
          focusLocation={focusLocation}
          vehicles={vehicles}
          routesPolylines
        />

        {/* Floating Right Sidebar: Unidades Activas */}
        <ActiveUnitsWidget
          vehicles={vehicles}
          onVehicleClick={handleVehicleClick}
        />

      </main>
    </div>
  );
}
