import StopItem from './StopItem';

export default function RouteTimeline({ stops, isLoading, onCheckIn }) {
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
    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 pb-8">
      {stops.map((stop) => (
        <StopItem key={stop.id} stop={stop} onCheckIn={onCheckIn} />
      ))}
    </div>
  );
}
