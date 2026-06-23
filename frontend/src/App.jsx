import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Map from './components/Map'
import { 
  Satellite, 
  Drone, 
  Battery, 
  Gauge, 
  Compass, 
  MapPin, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

function App() {
  const [drones, setDrones] = useState([])
  const [selectedDrone, setSelectedDrone] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Récupérer les dernières données de tous les drones
  const fetchAllDrones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      
      // Grouper par drone_id et prendre le plus récent
      const latestByDrone = {}
      data.forEach(tele => {
        if (!latestByDrone[tele.drone_id] || 
            new Date(tele.recorded_at) > new Date(latestByDrone[tele.drone_id].recorded_at)) {
          latestByDrone[tele.drone_id] = tele
        }
      })
      
      // Convertir en tableau et ajouter un statut
      const dronesList = Object.values(latestByDrone).map(tele => ({
        id: tele.drone_id,
        lat: tele.lat,
        lng: tele.lng,
        altitude: tele.altitude,
        speed: tele.speed,
        battery: tele.battery,
        lastUpdate: tele.recorded_at,
        status: tele.battery < 25 ? 'warning' : 
                tele.altitude > 120 ? 'warning' : 
                tele.drone_id === 'TN-DRN-002' && tele.lat > 36.85 ? 'alert' : 'active'
      }))
      
      setDrones(dronesList)
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'))
      
      if (!selectedDrone && dronesList.length > 0) {
        setSelectedDrone(dronesList[0].id)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDrone])

  // Récupérer les logs
  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('drone_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Erreur logs:', error)
    }
  }, [])

  // Souscription en temps réel
  useEffect(() => {
    fetchAllDrones()
    fetchLogs()
    
    const telemetrySubscription = supabase
      .channel('telemetry')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'telemetry' },
        () => fetchAllDrones()
      )
      .subscribe()
    
    const logsSubscription = supabase
      .channel('logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drone_logs' },
        () => fetchLogs()
      )
      .subscribe()
    
    const interval = setInterval(() => {
      fetchAllDrones()
      fetchLogs()
    }, 5000)
    
    return () => {
      telemetrySubscription.unsubscribe()
      logsSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [fetchAllDrones, fetchLogs])

  const selectedDroneData = drones.find(d => d.id === selectedDrone)

  // Statistiques
  const activeDrones = drones.filter(d => d.status === 'active').length
  const alertDrones = drones.filter(d => d.status === 'alert').length
  const warningDrones = drones.filter(d => d.status === 'warning').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#4f8ef7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#64748b] text-sm">Chargement de la plateforme...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0e1a]">
      {/* Barre supérieure */}
      <header className="bg-[#111827] border-b border-[#1f2937] px-6 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#4f8ef7]/10 p-2 rounded-lg">
            <Satellite className="w-5 h-5 text-[#4f8ef7]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">UTM Platform</h1>
            <p className="text-xs text-[#64748b]">Unified Traffic Management — ANAC</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-[#1a2332] px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
              <span className="text-[#94a3b8]">Opérationnel</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1a2332] px-3 py-1.5 rounded-full">
              <Drone className="w-3.5 h-3.5 text-[#4f8ef7]" />
              <span className="text-[#e2e8f0] font-medium">{drones.length}</span>
              <span className="text-[#64748b]">drones</span>
            </div>
            {alertDrones > 0 && (
              <div className="flex items-center gap-1.5 bg-[#f04040]/10 px-3 py-1.5 rounded-full border border-[#f04040]/30">
                <AlertTriangle className="w-3.5 h-3.5 text-[#f04040]" />
                <span className="text-[#f04040] font-medium">{alertDrones}</span>
                <span className="text-[#f04040]/70">alerte</span>
              </div>
            )}
          </div>
          <div className="text-xs text-[#64748b] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastUpdate || '—'}</span>
          </div>
        </div>
      </header>
      
      {/* Contenu principal */}
      <div className="flex-1 flex min-h-0">
        {/* Carte */}
        <div className="flex-1 relative">
          <Map 
            drones={drones} 
            onSelectDrone={setSelectedDrone}
            selectedDrone={selectedDrone}
          />
          
          {/* Mini statistiques en overlay */}
          <div className="absolute top-4 left-4 flex gap-2 z-[500]">
            <div className="bg-[#111827]/90 backdrop-blur-sm border border-[#1f2937] rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-[#22c55e] rounded-full"></div>
              <span className="text-[#94a3b8]">Vol normal</span>
              <span className="text-white font-medium">{activeDrones}</span>
            </div>
            {warningDrones > 0 && (
              <div className="bg-[#111827]/90 backdrop-blur-sm border border-[#f5a623]/30 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-[#f5a623] rounded-full"></div>
                <span className="text-[#94a3b8]">Avertissement</span>
                <span className="text-[#f5a623] font-medium">{warningDrones}</span>
              </div>
            )}
            {alertDrones > 0 && (
              <div className="bg-[#111827]/90 backdrop-blur-sm border border-[#f04040]/30 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-[#f04040] rounded-full"></div>
                <span className="text-[#94a3b8]">Alerte</span>
                <span className="text-[#f04040] font-medium">{alertDrones}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Panneau de droite */}
        <div className="w-80 bg-[#111827] border-l border-[#1f2937] flex flex-col flex-shrink-0">
          {/* Infos drone sélectionné */}
          <div className="p-4 border-b border-[#1f2937]">
            <div className="flex items-center gap-2 mb-3">
              <Drone className="w-4 h-4 text-[#4f8ef7]" />
              <h3 className="text-sm font-medium text-white">Détails du drone</h3>
            </div>
            {selectedDroneData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Identifiant</span>
                  <span className="text-[#e2e8f0] font-mono text-xs bg-[#1a2332] px-2 py-0.5 rounded">
                    {selectedDroneData.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1a2332] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[#64748b] text-[10px] uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      <span>Position</span>
                    </div>
                    <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                      {selectedDroneData.lat?.toFixed(4)}° / {selectedDroneData.lng?.toFixed(4)}°
                    </div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[#64748b] text-[10px] uppercase tracking-wider">
                      <Gauge className="w-3 h-3" />
                      <span>Altitude</span>
                    </div>
                    <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                      {selectedDroneData.altitude || 0} m
                    </div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[#64748b] text-[10px] uppercase tracking-wider">
                      <Activity className="w-3 h-3" />
                      <span>Vitesse</span>
                    </div>
                    <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                      {selectedDroneData.speed || 0} km/h
                    </div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[#64748b] text-[10px] uppercase tracking-wider">
                      <Battery className="w-3 h-3" />
                      <span>Batterie</span>
                    </div>
                    <div className={`font-mono text-xs mt-0.5 ${
                      selectedDroneData.battery < 25 ? 'text-[#f04040]' :
                      selectedDroneData.battery < 50 ? 'text-[#f5a623]' : 'text-[#22c55e]'
                    }`}>
                      {selectedDroneData.battery || 0} %
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#1f2937]">
                  <span className="text-[#64748b] text-xs">Statut</span>
                  <span className={`text-xs font-medium flex items-center gap-1.5 ${
                    selectedDroneData.status === 'alert' ? 'text-[#f04040]' :
                    selectedDroneData.status === 'warning' ? 'text-[#f5a623]' : 'text-[#22c55e]'
                  }`}>
                    {selectedDroneData.status === 'alert' ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Zone interdite
                      </>
                    ) : selectedDroneData.status === 'warning' ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Attention
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Vol normal
                      </>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[#64748b] text-sm text-center py-6">
                Aucun drone sélectionné
              </div>
            )}
          </div>
          
          {/* Logs */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4f8ef7]" />
                <h3 className="text-sm font-medium text-white">Journal d'événements</h3>
              </div>
              <button 
                onClick={() => fetchLogs()}
                className="text-[#64748b] hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {logs.length === 0 ? (
                <div className="text-[#64748b] text-sm text-center py-8">
                  Aucun événement enregistré
                </div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-lg border-l-2 text-sm ${
                      log.severity === 'critical' ? 'border-[#f04040] bg-[#f04040]/5' :
                      log.severity === 'warning' ? 'border-[#f5a623] bg-[#f5a623]/5' :
                      'border-[#4f8ef7] bg-[#4f8ef7]/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b] text-xs">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                      </span>
                      <span className={`text-xs font-mono ${
                        log.severity === 'critical' ? 'text-[#f04040]' :
                        log.severity === 'warning' ? 'text-[#f5a623]' : 'text-[#4f8ef7]'
                      }`}>
                        [{log.drone_id}]
                      </span>
                    </div>
                    <div className="text-[#e2e8f0] text-xs mt-0.5">
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App