import StopItem from './StopItem';

export default function RouteTimeline({ stops, mapPoints, activeStop, isLoading, onCheckIn, onReportIncident, onCheckOut }) {
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
        const isInProgress = state?.code === 'in_progress';
        const isFailed = state?.code === 'failed';
        const isCompleted = state?.code === 'completed';

        // Extraemos los cálculos de distancia y turno de este punto en específico
        const pointData = mapPoints?.find(p => p.id === stop.id);
        const distanceToTarget = pointData?.distanceToTarget;
        const isWithinGeofence = pointData?.isWithinGeofence;
        const isNextToVisit = activeStop?.id === stop.id;

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
                  {store?.location?.coordinates && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      📍 Lng: {store.location.coordinates[0]?.toFixed(5)}, Lat: {store.location.coordinates[1]?.toFixed(5)}
                    </p>
                  )}
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
                  {!isNextToVisit ? (
                    <button
                      disabled
                      className="mt-3 w-full font-semibold py-3 px-4 rounded-lg text-sm flex justify-center items-center bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    >
                      Esperando turno anterior...
                    </button>
                  ) : (
                    <button
                      onClick={() => onCheckIn(stop.id)}
                      disabled={!isWithinGeofence}
                      className={`mt-3 w-full font-semibold py-3 px-4 rounded-lg transition-all text-sm flex justify-center items-center shadow-md ${isWithinGeofence
                        ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer animate-pulse'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isWithinGeofence ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        )}
                      </svg>
                      {isWithinGeofence
                        ? 'Confirmar Llegada'
                        : `Fuera del área (${distanceToTarget !== null ? distanceToTarget + 'm' : 'Calculando...'})`
                      }
                    </button>
                  )}
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

              {/* ACCIONES DURANTE LA PARADA (IN_PROGRESS) */}
              {isInProgress && (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const bags = prompt("¿Cuántas tulas recolectaste?", "1");
                      // Validamos que ingresó un número y no canceló
                      if (bags && !isNaN(bags)) {
                        onCheckOut(stop.id, bags); // <-- LLAMADA AL BACKEND REAL
                      } else if (bags) {
                        alert("Por favor ingrese un número válido.");
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95"
                  >
                    Finalizar y Check-Out
                  </button>
                  <button
                    onClick={() => onReportIncident(stop.id, 'suspicious_activity')} // O el código de incidente que aplique
                    className="w-full bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-all">
                    Reportar Novedad en Parada
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
