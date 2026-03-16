import StopItem from './StopItem';

export default function RouteTimeline({ stops, isLoading, onCheckIn, onReportIncident }) {
  if (isLoading) {
    return (
      <div className="flex-1 px-6 py-6 text-center text-slate-500">
        <p>Cargando información de ruta...</p>
      </div>
    );
  }

  if (!stops || stops.length === 0) {
    return (
      <div className="flex-1 px-6 py-6 text-center text-slate-500">
        <p>No hay paradas programadas para esta ruta.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-4 mt-4 pb-12">
      {stops.map((stop) => {
        const store = stop.relationships?.store?.attributes;
        const state = stop.relationships?.route_stop_states?.attributes;

        // Verificamos el estado para saber si mostramos el botón
        const isPending = state?.code === 'pending';
        const isFailed = state?.code === 'failed';
        const isCompleted = state?.code === 'completed';

        return (
          <div key={`timeline-${stop.id}`} className="mb-6 ml-6 relative">
            {/* Indicador visual en la línea de tiempo */}
            <span className={`absolute -left-[33px] flex h-4 w-4 rounded-full ring-4 ring-white ${isCompleted ? 'bg-green-500' :
              isFailed ? 'bg-red-500' :
                isPending ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
              }`}></span>

            <div className={`p-4 rounded-xl border ${isPending ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {store?.name || 'Punto de Venta Desconocido'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{store?.adress}</p>
                </div>

                {/* Etiqueta de Estado */}
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide whitespace-nowrap ml-2 ${isCompleted ? 'bg-green-100 text-green-700' :
                  isFailed ? 'bg-red-100 text-red-700' :
                    isPending ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {state?.display_name || 'Desconocido'}
                </span>
              </div>

              {/* EL FAMOSO BOTÓN DE CHECK-IN */}
              {isPending && (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => onCheckIn(stop.id)}
                    className="mt-3 w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all text-sm flex justify-center items-center shadow-md active:scale-95"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Hacer Check-in
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onReportIncident(stop.id, 'close_store')}
                      className="text-[10px] font-bold border border-red-200 bg-red-50 text-red-600 py-1 rounded hover:bg-red-100 uppercase"
                    >
                      Tienda Cerrada
                    </button>
                    <button
                      onClick={() => onReportIncident(stop.id, 'no_cash_adjustment')}
                      className="text-[10px] font-bold border border-amber-200 bg-amber-50 text-amber-600 py-1 rounded hover:bg-amber-100 uppercase"
                    >
                      Sin Cuadre
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
