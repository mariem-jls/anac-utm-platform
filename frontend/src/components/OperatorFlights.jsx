import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  PlusCircle
} from 'lucide-react'

const OperatorFlights = ({ user }) => {
  const navigate = useNavigate()
  const [flightPlans, setFlightPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    if (user) {
      fetchFlightPlans()
    }
  }, [user])

  const fetchFlightPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('flight_plans')
        .select(`
          *,
          registered_drones (
            registration_number,
            model
          )
        `)
        .eq('operator_id', user.id)
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

  const getStatusBadge = (status) => {
    const config = {
      pending: { 
        color: 'text-[#f5a623]', 
        bg: 'bg-[#f5a623]/10', 
        icon: Clock, 
        label: 'En attente',
        description: 'Votre demande est en cours d\'examen par l\'ANAC'
      },
      approved: { 
        color: 'text-[#22c55e]', 
        bg: 'bg-[#22c55e]/10', 
        icon: CheckCircle, 
        label: 'Approuve',
        description: 'Votre plan de vol a ete approuve'
      },
      rejected: { 
        color: 'text-[#f04040]', 
        bg: 'bg-[#f04040]/10', 
        icon: XCircle, 
        label: 'Rejete',
        description: 'Votre plan de vol a ete rejete'
      },
      in_progress: { 
        color: 'text-[#4f8ef7]', 
        bg: 'bg-[#4f8ef7]/10', 
        icon: Clock, 
        label: 'En cours',
        description: 'Le vol est en cours d\'execution'
      },
      completed: { 
        color: 'text-[#64748b]', 
        bg: 'bg-[#64748b]/10', 
        icon: CheckCircle, 
        label: 'Termine',
        description: 'Le vol est termine'
      },
      cancelled: { 
        color: 'text-[#64748b]', 
        bg: 'bg-[#64748b]/10', 
        icon: XCircle, 
        label: 'Annule',
        description: 'Le vol a ete annule'
      },
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

  const filteredPlans = useMemo(() => {
    let result = flightPlans

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(plan =>
        plan.registered_drones?.registration_number?.toLowerCase().includes(searchLower) ||
        plan.mission_type?.toLowerCase().includes(searchLower) ||
        plan.zone_name?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [flightPlans, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPlans = filteredPlans.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  const stats = {
    total: flightPlans.length,
    pending: flightPlans.filter(p => p.status === 'pending').length,
    approved: flightPlans.filter(p => p.status === 'approved' || p.status === 'in_progress').length,
    rejected: flightPlans.filter(p => p.status === 'rejected').length,
    completed: flightPlans.filter(p => p.status === 'completed').length
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-[#64748b]">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>Veuillez vous connecter pour voir vos plans de vol</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#111827] rounded-xl border border-[#1f2937]">
      {/* En-tête avec bouton Nouveau plan */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#4f8ef7]" />
            <h2 className="text-lg font-semibold text-white">Mes plans de vol</h2>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            {stats.pending} plan(s) de vol en attente de validation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/operator/flights/create')}
            className="px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#3b7de0] transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau plan
          </button>
          <button
            onClick={fetchFlightPlans}
            className="px-3 py-2 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm flex items-center gap-1.5"
          >
            <Loader2 className="w-4 h-4" />
            Rafraichir
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
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

      {/* Mini statistiques */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <span className="text-[#64748b]">Total: <span className="text-white">{stats.total}</span></span>
        <span className="text-[#f5a623]">En attente: <span className="text-[#f5a623]">{stats.pending}</span></span>
        <span className="text-[#22c55e]">Approuves: <span className="text-[#22c55e]">{stats.approved}</span></span>
        <span className="text-[#f04040]">Rejetes: <span className="text-[#f04040]">{stats.rejected}</span></span>
        <span className="text-[#64748b]">Termines: <span className="text-[#64748b]">{stats.completed}</span></span>
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
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucun plan de vol soumis</p>
          <button
            onClick={() => navigate('/operator/flights/create')}
            className="mt-3 px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#3b7de0] transition-colors flex items-center gap-2 mx-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Creer un plan de vol
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedPlans.map((plan) => {
              const StatusBadge = getStatusBadge(plan.status)
              const StatusIcon = StatusBadge.icon
              const isPending = plan.status === 'pending'
              
              return (
                <div 
                  key={plan.id}
                  className="bg-[#1a2332] border border-[#1f2937] rounded-lg p-4 hover:border-[#4f8ef7]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-sm text-[#e2e8f0]">
                          {plan.registered_drones?.registration_number || 'Drone inconnu'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${StatusBadge.bg} ${StatusBadge.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {StatusBadge.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#0a0e1a] rounded-full text-[#64748b] border border-[#1f2937]">
                          {getMissionLabel(plan.mission_type)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-[#64748b]">Modele :</span>
                          <span className="text-[#e2e8f0] ml-1">{plan.registered_drones?.model || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Zone :</span>
                          <span className="text-[#e2e8f0] ml-1">{plan.zone_name || 'Non specifiee'}</span>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Altitude max :</span>
                          <span className="text-[#e2e8f0] ml-1">{plan.altitude_max || 120} m</span>
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

                      {plan.admin_notes && (
                        <div className="mt-2 p-2 bg-[#0a0e1a] rounded-lg border border-[#1f2937]">
                          <span className="text-[#64748b] text-xs">Note de l'ANAC :</span>
                          <p className="text-[#e2e8f0] text-sm">{plan.admin_notes}</p>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-2 text-xs text-[#f5a623] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          En attente de validation par l'ANAC
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedPlan === plan.id 
                          ? 'bg-[#4f8ef7]/20 text-[#4f8ef7]' 
                          : 'text-[#64748b] hover:text-[#4f8ef7] hover:bg-[#4f8ef7]/10'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Détails étendus */}
                  {selectedPlan === plan.id && (
                    <div className="mt-3 p-4 bg-[#0a0e1a] rounded-lg border border-[#1f2937]">
                      <h4 className="text-sm font-medium text-white mb-3">Details complets</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[#64748b]">Statut :</span>
                          <span className={`ml-1 ${StatusBadge.color}`}>{StatusBadge.label}</span>
                          <p className="text-xs text-[#64748b] mt-1">{StatusBadge.description}</p>
                        </div>
                        <div>
                          <span className="text-[#64748b]">Soumis le :</span>
                          <span className="text-[#e2e8f0] ml-1">
                            {new Date(plan.created_at).toLocaleDateString('fr-FR')} a {new Date(plan.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        {plan.approved_at && (
                          <div>
                            <span className="text-[#64748b]">Approuve le :</span>
                            <span className="text-[#22c55e] ml-1">
                              {new Date(plan.approved_at).toLocaleDateString('fr-FR')} a {new Date(plan.approved_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                            </span>
                          </div>
                        )}
                        {plan.rejected_at && (
                          <div>
                            <span className="text-[#64748b]">Rejete le :</span>
                            <span className="text-[#f04040] ml-1">
                              {new Date(plan.rejected_at).toLocaleDateString('fr-FR')} a {new Date(plan.rejected_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

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

export default OperatorFlights