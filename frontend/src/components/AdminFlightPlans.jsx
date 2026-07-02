import { useState, useEffect, useMemo } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Drone,
  Eye
} from 'lucide-react'

const AdminFlightPlans = () => {
  const [flightPlans, setFlightPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    fetchFlightPlans()
  }, [])

  const fetchFlightPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabaseAdmin
        .from('flight_plans')
        .select(`
          *,
          registered_drones (
            registration_number,
            model,
            owner_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur:', error)
        setError(error.message)
        throw error
      }
      
      console.log('Plans de vol récupérés:', data)
      setFlightPlans(data || [])
      setCurrentPage(1)
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (planId, action) => {
    setActionLoading(prev => ({ ...prev, [planId]: true }))
    
    try {
      const status = action === 'approve' ? 'approved' : 'rejected'
      const updateData = { 
        status,
        admin_notes: adminNote || null,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        rejected_at: action === 'reject' ? new Date().toISOString() : null
      }

      const { error } = await supabaseAdmin
        .from('flight_plans')
        .update(updateData)
        .eq('id', planId)

      if (error) throw error
      
      setAdminNote('')
      setSelectedPlan(null)
      await fetchFlightPlans()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [planId]: false }))
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'text-[#f5a623]', bg: 'bg-[#f5a623]/10', icon: Clock, label: 'En attente' },
      approved: { color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', icon: CheckCircle, label: 'Approuve' },
      rejected: { color: 'text-[#f04040]', bg: 'bg-[#f04040]/10', icon: XCircle, label: 'Rejete' },
      in_progress: { color: 'text-[#4f8ef7]', bg: 'bg-[#4f8ef7]/10', icon: Clock, label: 'En cours' },
      completed: { color: 'text-[#64748b]', bg: 'bg-[#64748b]/10', icon: CheckCircle, label: 'Termine' },
      cancelled: { color: 'text-[#64748b]', bg: 'bg-[#64748b]/10', icon: XCircle, label: 'Annule' },
    }
    return config[status] || config.pending
  }

  const getMissionLabel = (type) => {
    const types = {
      agriculture: 'Agriculture',
      surveillance: 'Surveillance',
      livraison: 'Livraison',
      inspection: 'Inspection',
      cartographie: 'Cartographie',
      photographie: 'Photographie',
      secours: 'Secours',
      loisir: 'Loisir'
    }
    return types[type] || type
  }

  // Filtrer les plans de vol
  const filteredPlans = useMemo(() => {
    let result = flightPlans

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(plan =>
        plan.registered_drones?.registration_number?.toLowerCase().includes(searchLower) ||
        plan.registered_drones?.model?.toLowerCase().includes(searchLower) ||
        plan.mission_type?.toLowerCase().includes(searchLower) ||
        plan.zone_name?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [flightPlans, statusFilter, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPlans = filteredPlans.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  // Statistiques
  const stats = {
    total: flightPlans.length,
    pending: flightPlans.filter(p => p.status === 'pending').length,
    approved: flightPlans.filter(p => p.status === 'approved' || p.status === 'in_progress').length,
    rejected: flightPlans.filter(p => p.status === 'rejected').length,
    completed: flightPlans.filter(p => p.status === 'completed').length
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* En-tête avec statistiques */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Gestion des plans de vol</h2>
            <p className="text-sm text-[#64748b]">
              {stats.pending} plan(s) de vol en attente
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchFlightPlans}
              className="px-3 py-1.5 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm flex items-center gap-1.5"
            >
              <Loader2 className="w-4 h-4" />
              Rafraichir
            </button>
          </div>
        </div>

        {/* Barre de filtres */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par drone, mission, zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuves</option>
              <option value="rejected">Rejetes</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Termines</option>
            </select>
          </div>
        </div>

        {/* Mini statistiques */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <span className="text-[#64748b]">Total: <span className="text-white">{stats.total}</span></span>
          <span className="text-[#f5a623]">En attente: <span className="text-[#f5a623]">{stats.pending}</span></span>
          <span className="text-[#22c55e]">Approuves: <span className="text-[#22c55e]">{stats.approved}</span></span>
          <span className="text-[#f04040]">Rejetes: <span className="text-[#f04040]">{stats.rejected}</span></span>
          <span className="text-[#64748b]">Termines: <span className="text-[#64748b]">{stats.completed}</span></span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#f04040]/10 border border-[#f04040]/30 rounded-lg text-[#f04040] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#4f8ef7] animate-spin" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] border border-[#1f2937] rounded-xl">
          <p>Aucun plan de vol correspondant aux filtres</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedPlans.map((plan) => {
              const StatusBadge = getStatusBadge(plan.status)
              const isPending = plan.status === 'pending'
              
              return (
                <div 
                  key={plan.id}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 hover:border-[#4f8ef7]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* En-tête */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-sm text-[#e2e8f0]">
                          {plan.registered_drones?.registration_number || 'Drone inconnu'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${StatusBadge.bg} ${StatusBadge.color} flex items-center gap-1`}>
                          <StatusBadge.icon className="w-3 h-3" />
                          {StatusBadge.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#1a2332] rounded-full text-[#64748b] border border-[#1f2937]">
                          {getMissionLabel(plan.mission_type)}
                        </span>
                      </div>

                      {/* Détails */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-[#64748b]">Drone :</span>
                          <span className="text-[#e2e8f0] ml-1">{plan.registered_drones?.model || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Zone :</span>
                          <span className="text-[#e2e8f0] ml-1">{plan.zone_name || 'Non specifiee'}</span>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Debut :</span>
                          <span className="text-[#e2e8f0] ml-1">
                            {new Date(plan.start_time).toLocaleDateString('fr-FR')} {new Date(plan.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Fin :</span>
                          <span className="text-[#e2e8f0] ml-1">
                            {new Date(plan.end_time).toLocaleDateString('fr-FR')} {new Date(plan.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      </div>

                      {/* Notes admin */}
                      {plan.admin_notes && (
                        <div className="mt-2 p-2 bg-[#1a2332] rounded-lg border border-[#1f2937]">
                          <span className="text-[#64748b] text-xs">Note de l'admin :</span>
                          <p className="text-[#e2e8f0] text-sm">{plan.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedPlan(plan.id)
                            setAdminNote('')
                          }}
                          className="px-4 py-1.5 bg-[#4f8ef7]/10 text-[#4f8ef7] border border-[#4f8ef7]/30 rounded-lg hover:bg-[#4f8ef7]/20 transition-colors text-sm flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          Examiner
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Panneau d'examen (si sélectionné) */}
                  {selectedPlan === plan.id && isPending && (
                    <div className="mt-3 p-4 bg-[#1a2332] rounded-lg border border-[#1f2937]">
                      <h4 className="text-sm font-medium text-white mb-3">Examen du plan de vol</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[#64748b]">Drone</span>
                          <p className="text-[#e2e8f0]">{plan.registered_drones?.registration_number}</p>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Mission</span>
                          <p className="text-[#e2e8f0]">{getMissionLabel(plan.mission_type)}</p>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Zone</span>
                          <p className="text-[#e2e8f0]">{plan.zone_name || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Altitude max</span>
                          <p className="text-[#e2e8f0]">{plan.altitude_max || 120} m</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm text-[#64748b] mb-1">Note (optionnel)</label>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Ajouter un commentaire..."
                          className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f8ef7]"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAction(plan.id, 'approve')}
                          disabled={actionLoading[plan.id]}
                          className="px-6 py-2 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-lg hover:bg-[#22c55e]/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm"
                        >
                          {actionLoading[plan.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approuver
                        </button>
                        <button
                          onClick={() => handleAction(plan.id, 'reject')}
                          disabled={actionLoading[plan.id]}
                          className="px-6 py-2 bg-[#f04040]/10 text-[#f04040] border border-[#f04040]/30 rounded-lg hover:bg-[#f04040]/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm"
                        >
                          {actionLoading[plan.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Rejeter
                        </button>
                        <button
                          onClick={() => setSelectedPlan(null)}
                          className="px-4 py-2 bg-[#1a2332] text-[#64748b] rounded-lg hover:text-white transition-colors text-sm"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1f2937] mt-4">
              <span className="text-sm text-[#64748b]">
                {paginatedPlans.length} sur {filteredPlans.length} entree(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[#1f2937] text-[#64748b] bg-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-[#4f8ef7]/40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#64748b]">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[#1f2937] text-[#64748b] bg-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-[#4f8ef7]/40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminFlightPlans