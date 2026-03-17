import { useState } from 'react'
import RouteTrackingView from './components/RouteTrackingView'
import ObservabilityDashboard from './components/ObservabilityDashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('operator'); // 'operator' | 'dashboard'

  return (
    <div className="relative w-full h-screen">
      {/* TABS DE ENTORNO SANDBOX */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-2xl border border-slate-700/50 pointer-events-auto">
        <button 
          onClick={() => setCurrentView('operator')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentView === 'operator' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Vista Operador (Ruta)
        </button>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Centro de Control (Dashboard)
        </button>
      </div>

      {currentView === 'operator' ? <RouteTrackingView /> : <ObservabilityDashboard />}
    </div>
  )
}

export default App
