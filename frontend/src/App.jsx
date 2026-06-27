import { useEffect, useState, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Map from './components/Map'
import RegisterDrone from './components/RegisterDrone'
import AdminDrones from './components/AdminDrones'
import OperatorDrones from './components/OperatorDrones'
import PoliceScanner from './components/PoliceScanner'
import GeofenceManager from './components/GeofenceManager'
import { 
  Satellite, 
  Drone, 
  LogOut, 
  User, 
  Shield, 
  ClipboardCheck,
  PlusCircle,
  List,
  Home,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drones, setDrones] = useState([])
  const [selectedDrone, setSelectedDrone] = useState(null)
  const [logs, setLogs] = useState([])
  const mapRef = useRef(null)

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Erreur profil:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // ============================================================
  // DONNEES DES DRONES
  // ============================================================

  const fetchAllDrones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      
      const latestByDrone = {}
      data.forEach(tele => {
        if (!latestByDrone[tele.drone_id] || 
            new Date(tele.recorded_at) > new Date(latestByDrone[tele.drone_id].recorded_at)) {
          latestByDrone[tele.drone_id] = tele
        }
      })
      
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
      if (!selectedDrone && dronesList.length > 0) {
        setSelectedDrone(dronesList[0].id)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }, [selectedDrone])

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

  useEffect(() => {
    if (!user) return
    
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
  }, [user, fetchAllDrones, fetchLogs])

  const selectedDroneData = drones.find(d => d.id === selectedDrone)
  const activeDrones = drones.filter(d => d.status === 'active').length
  const alertDrones = drones.filter(d => d.status === 'alert').length
  const warningDrones = drones.filter(d => d.status === 'warning').length

  // ============================================================
  // RENDU — LOGIN
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#4f8ef7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#64748b] text-sm">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e1a]">
        <div className="bg-[#111827] p-8 rounded-xl border border-[#1f2937] w-96">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#4f8ef7]/10 p-2 rounded-lg">
              <Satellite className="w-6 h-6 text-[#4f8ef7]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ANAC UTM</h1>
              <p className="text-sm text-[#64748b]">Connexion requise</p>
            </div>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault()
            const form = e.target
            const email = form.email.value
            const password = form.password.value
            
            try {
              const { error } = await supabase.auth.signInWithPassword({ email, password })
              if (error) throw error
            } catch (error) {
              alert('Erreur: ' + error.message)
            }
          }}>
            <div className="mb-4">
              <label className="block text-sm text-[#e2e8f0] mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="votre@email.com"
                className="w-full px-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-[#e2e8f0] mb-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU — APPLICATION PRINCIPALE
  // ============================================================

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
        {/* BARRE SUPERIEURE — FIXE */}
        <header className="bg-[#111827] border-b border-[#1f2937] px-6 py-3 flex justify-between items-center flex-shrink-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-[#4f8ef7]/10 p-2 rounded-lg">
              <Satellite className="w-5 h-5 text-[#4f8ef7]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">UTM Platform</h1>
              <p className="text-xs text-[#64748b]">ANAC Tunisie</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation selon le role */}
            <nav className="flex items-center gap-1">
              <Link to="/" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                <Home className="w-4 h-4 inline mr-1" />
                Accueil
              </Link>

              {profile?.role === 'operator' && (
                <>
                  <Link to="/operator/register" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                    <PlusCircle className="w-4 h-4 inline mr-1" />
                    Immatriculer
                  </Link>
                  <Link to="/operator/drones" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                    <List className="w-4 h-4 inline mr-1" />
                    Mes drones
                  </Link>
                </>
              )}

              {profile?.role === 'admin' && (
                <>
                  <Link to="/admin/drones" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                    <ClipboardCheck className="w-4 h-4 inline mr-1" />
                    Valider
                  </Link>
                  <Link to="/admin/zones" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Zones
                  </Link>
                </>
              )}

              {profile?.role === 'police' && (
                <Link to="/police/scan" className="px-3 py-1.5 text-sm text-[#64748b] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Scanner
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3 text-sm border-l border-[#1f2937] pl-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#64748b]" />
                <span className="text-[#e2e8f0]">{user.email}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  profile?.role === 'admin' ? 'bg-[#4f8ef7]/20 text-[#4f8ef7]' :
                  profile?.role === 'police' ? 'bg-[#f5a623]/20 text-[#f5a623]' :
                  'bg-[#22c55e]/20 text-[#22c55e]'
                }`}>
                  {profile?.role || 'operator'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-[#1f2937] rounded-lg transition-colors text-[#64748b] hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* CONTENU PRINCIPAL — occupe tout l'espace restant */}
        <div className="flex-1 min-h-0 flex">
          <Routes>
            {/* Page d'accueil = carte + panneau droit */}
            <Route path="/" element={
              <>
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
                        <span className="text-[#94a3b8]">Attention</span>
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

                {/* Panneau de droite — fixe */}
                <div className="w-80 bg-[#111827] border-l border-[#1f2937] flex flex-col flex-shrink-0 h-full overflow-hidden">
                  {/* Partie fixe : Infos drone */}
                  <div className="flex-shrink-0 p-4 border-b border-[#1f2937]">
                    <div className="flex items-center gap-2 mb-3">
                      <Drone className="w-4 h-4 text-[#4f8ef7]" />
                      <h3 className="text-sm font-medium text-white">Details du drone</h3>
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
                            <div className="text-[#64748b] text-[10px] uppercase tracking-wider">Position</div>
                            <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                              {selectedDroneData.lat?.toFixed(4)}° / {selectedDroneData.lng?.toFixed(4)}°
                            </div>
                          </div>
                          <div className="bg-[#1a2332] rounded-lg p-2.5">
                            <div className="text-[#64748b] text-[10px] uppercase tracking-wider">Altitude</div>
                            <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                              {selectedDroneData.altitude || 0} m
                            </div>
                          </div>
                          <div className="bg-[#1a2332] rounded-lg p-2.5">
                            <div className="text-[#64748b] text-[10px] uppercase tracking-wider">Vitesse</div>
                            <div className="text-[#e2e8f0] font-mono text-xs mt-0.5">
                              {selectedDroneData.speed || 0} km/h
                            </div>
                          </div>
                          <div className="bg-[#1a2332] rounded-lg p-2.5">
                            <div className="text-[#64748b] text-[10px] uppercase tracking-wider">Batterie</div>
                            <div className={`font-mono text-xs mt-0.5 ${
                              selectedDroneData.battery < 25 ? 'text-[#f04040]' :
                              selectedDroneData.battery < 50 ? 'text-[#f5a623]' : 'text-[#22c55e]'
                            }`}>
                              {selectedDroneData.battery || 0} %
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#64748b] text-sm text-center py-6">
                        Aucun drone selectionne
                      </div>
                    )}
                  </div>

                  {/* Partie défilable : Logs */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-medium text-white mb-3">Journal d'evenements</h3>
                    <div className="space-y-1.5 pr-1">
                      {logs.length === 0 ? (
                        <div className="text-[#64748b] text-sm text-center py-8">
                          Aucun evenement
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

                  {/* Partie fixe : Bouton Recentrer en bas */}
                  <div className="flex-shrink-0 p-4 border-t border-[#1f2937] bg-[#111827]">
                    <button
                      onClick={() => {
                        if (selectedDroneData) {
                          setSelectedDrone(selectedDroneData.id)
                        }
                      }}
                      className="w-full bg-[#4f8ef7] hover:bg-[#3b7de0] text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-base">+</span>
                      Recentrer sur le drone
                    </button>
                  </div>
                </div>
              </>
            } />

            {/* Routes opérateur */}
            <Route path="/operator/register" element={
              <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0e1a] overflow-auto">
                <RegisterDrone user={user} />
              </div>
            } />
            
            <Route path="/operator/drones" element={
              <div className="flex-1 flex items-start justify-center p-6 bg-[#0a0e1a] overflow-auto">
                <OperatorDrones user={user} />
              </div>
            } />

            {/* Routes admin */}
            <Route path="/admin/drones" element={
              <div className="flex-1 p-6 bg-[#0a0e1a] overflow-auto">
                <AdminDrones />
              </div>
            } />

            <Route path="/admin/zones" element={
              <div className="flex-1 bg-[#0a0e1a] overflow-hidden">
                <GeofenceManager />
              </div>
            } />

            {/* Routes police */}
            <Route path="/police/scan" element={
              <div className="flex-1 bg-[#0a0e1a] overflow-auto">
                <PoliceScanner />
              </div>
            } />
            <Route path="/verify" element={
              <div className="flex-1 bg-[#0a0e1a] overflow-auto">
                <PoliceScanner />
              </div>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App