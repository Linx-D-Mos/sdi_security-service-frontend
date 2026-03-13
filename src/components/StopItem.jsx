export default function StopItem({ stop, onCheckIn }) {
  const store = stop.relationships?.store?.attributes;
  const state = stop.relationships?.route_stop_states?.attributes;

  if (!store || !state) return null;

  // Renderizado dinámico de Icono basado en state.icon (Ajustar según catálogo del backend)
  const renderIcon = () => {
    switch (state.icon) {
      case 'check':
        return (
          <svg className={`h-6 w-6 ${state.bg_text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'dot':
        return <div className="h-3 w-3 bg-white rounded-full"></div>;
      case 'pending':
      default:
        return <div className="h-3 w-3 bg-slate-300 rounded-full"></div>;
    }
  };

  const isActive = state.display_name === 'En Progreso'; // Condición basada en lógica de negocio
  const isCompleted = state.display_name === 'Completada';

  return (
    <div className={`relative flex ${isActive ? 'flex-col' : 'items-start'} group`} data-purpose="timeline-item">
      {/* Timeline conector línea */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6"></div>
      
      {/* Contenedor del Icono/Estado */}
      <div className={`flex items-start`}>
        <div className={`z-10 rounded-full border-4 border-white ${state.bg_color} ${isActive ? 'p-2.5 shadow-md bg-blue-600' : 'p-1'}`}>
          {renderIcon()}
        </div>
        
        <div className={`ml-4 ${isCompleted ? 'opacity-50' : ''}`}>
          <p className={`font-bold ${isActive ? 'text-base text-slate-900' : 'text-sm text-slate-900'} ${isCompleted ? 'line-through' : ''}`}>
             {store.name}
          </p>
          <p className={`text-xs ${isActive ? 'text-sm font-medium text-blue-600' : state.bg_text}`}>
            {state.display_name} • Estimado: {stop.attributes.arrival_time || 'Por definir'}
          </p>
        </div>
      </div>

      {/* Botones de acción solo si está activa */}
      {isActive && (
        <div className="ml-14 mt-4 space-y-3 w-full pr-6">
          <button
            onClick={() => onCheckIn(stop.id)}
            className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-lg active:bg-slate-800 transition-all flex items-center justify-center min-h-[44px]"
          >
            Check-In (Manual)
          </button>
          <button className="w-full bg-white text-slate-700 font-semibold py-3 px-6 rounded-2xl border-2 border-slate-200 active:bg-slate-50 transition-all flex items-center justify-center min-h-[44px]">
            Reportar Novedad en Parada
          </button>
        </div>
      )}
    </div>
  );
}
