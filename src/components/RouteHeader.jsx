export default function RouteHeader({ routeInfo }) {
  return (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-lg leading-tight">
              {routeInfo.route_name}
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${routeInfo.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${routeInfo.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                {routeInfo.isActive ? `GPS Activo • ${routeInfo.speed} km/h` : 'Esperando Señal...'}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
