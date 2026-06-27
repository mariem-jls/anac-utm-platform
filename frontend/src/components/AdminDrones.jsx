import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Loader2
} from 'lucide-react'

const AdminDrones = () => {
  const [drones, setDrones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchDrones()
  }, [filter])

  const fetchDrones = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('registered_drones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur:', error)
        setError(error.message)
        throw error
      }
      
      console.log('Drones récupérés:', data)
      setDrones(data || [])
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (droneId, action) => {
    setActionLoading(prev => ({ ...prev, [droneId]: true }))
    
    try {
      const status = action === 'approve' ? 'approved' : 'rejected'
      const { error } = await supabase
        .from('registered_drones')
        .update({ 
          status,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          rejected_at: action === 'reject' ? new Date().toISOString() : null
        })
        .eq('id', droneId)

      if (error) throw error
      await fetchDrones()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [droneId]: false }))
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'text-[#f5a623]', bg: 'bg-[#f5a623]/10', icon: Clock, label: 'En attente' },
      approved: { color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', icon: CheckCircle, label: 'Approuve' },
      rejected: { color: 'text-[#f04040]', bg: 'bg-[#f04040]/10', icon: XCircle, label: 'Rejete' },
      active: { color: 'text-[#4f8ef7]', bg: 'bg-[#4f8ef7]/10', icon: CheckCircle, label: 'Actif' },
      suspended: { color: 'text-[#f04040]', bg: 'bg-[#f04040]/10', icon: XCircle, label: 'Suspendu' },
    }
    return config[status] || config.pending
  }

  const filteredDrones = drones.filter(drone =>
    drone.model?.toLowerCase().includes(search.toLowerCase()) ||
    drone.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
    drone.serial_number?.toLowerCase().includes(search.toLowerCase())
  )

  if (error) {
    return (
      <div className="text-center py-12 text-[#f04040]">
        <p>Erreur: {error}</p>
        <button 
          onClick={fetchDrones}
          className="mt-2 px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm"
        >
          Reessayer
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Gestion des immatriculations</h2>
          <p className="text-sm text-[#64748b]">
            {drones.filter(d => d.status === 'pending').length} demande(s) en attente
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuves</option>
            <option value="rejected">Rejetes</option>
            <option value="active">Actifs</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#4f8ef7] animate-spin" />
        </div>
      ) : filteredDrones.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] border border-[#1f2937] rounded-xl">
          <p>Aucune demande d'immatriculation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrones.map((drone) => {
            const StatusBadge = getStatusBadge(drone.status)
            const isPending = drone.status === 'pending'
            
            return (
              <div 
                key={drone.id}
                className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex items-center justify-between hover:border-[#4f8ef7]/30 transition-colors flex-wrap gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-[#e2e8f0]">
                      {drone.registration_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${StatusBadge.bg} ${StatusBadge.color} flex items-center gap-1`}>
                      <StatusBadge.icon className="w-3 h-3" />
                      {StatusBadge.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-[#64748b]">Modele :</span>
                      <span className="text-[#e2e8f0] ml-1">{drone.model}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Serie :</span>
                      <span className="text-[#e2e8f0] ml-1">{drone.serial_number}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Proprietaire :</span>
                      <span className="text-[#e2e8f0] ml-1 text-xs font-mono">
                        {drone.owner_id ? drone.owner_id.slice(0, 8) + '...' : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#64748b] mt-1">
                    Soumis le {new Date(drone.created_at).toLocaleDateString('fr-FR')} a {new Date(drone.created_at).toLocaleTimeString('fr-FR')}
                  </div>
                </div>

                {isPending && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(drone.id, 'approve')}
                      disabled={actionLoading[drone.id]}
                      className="px-4 py-1.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-lg hover:bg-[#22c55e]/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm"
                    >
                      {actionLoading[drone.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approuver
                    </button>
                    <button
                      onClick={() => handleAction(drone.id, 'reject')}
                      disabled={actionLoading[drone.id]}
                      className="px-4 py-1.5 bg-[#f04040]/10 text-[#f04040] border border-[#f04040]/30 rounded-lg hover:bg-[#f04040]/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm"
                    >
                      {actionLoading[drone.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminDrones