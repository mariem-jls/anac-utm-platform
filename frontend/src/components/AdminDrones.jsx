import { useState, useEffect, useMemo } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Loader2,
  Archive,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const AdminDrones = () => {
  const [drones, setDrones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchDrones()
  }, [filter, showArchived])

  const fetchDrones = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabaseAdmin
        .from('registered_drones')
        .select('*')
        .order('created_at', { ascending: false })

      // Filtrer les drones archivés
      if (!showArchived) {
        query = query.is('archived_at', null)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erreur:', error)
        setError(error.message)
        throw error
      }
      
      console.log('Drones récupérés:', data)
      setDrones(data || [])
      setCurrentPage(1)
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
      const updateData = { 
        status,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        rejected_at: action === 'reject' ? new Date().toISOString() : null
      }

      const { error } = await supabaseAdmin
        .from('registered_drones')
        .update(updateData)
        .eq('id', droneId)

      if (error) throw error
      await fetchDrones()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [droneId]: false }))
    }
  }

  const handleArchive = async (droneId, archive) => {
    setActionLoading(prev => ({ ...prev, [droneId]: true }))
    
    try {
      const { error } = await supabaseAdmin
        .from('registered_drones')
        .update({ 
          archived_at: archive ? new Date().toISOString() : null
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
    }
    return config[status] || config.pending
  }

  // Filtrer et paginer les drones
  const filteredDrones = useMemo(() => {
    let result = drones

    // Filtre par statut
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter)
    }

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(drone =>
        drone.model?.toLowerCase().includes(searchLower) ||
        drone.registration_number?.toLowerCase().includes(searchLower) ||
        drone.serial_number?.toLowerCase().includes(searchLower) ||
        drone.manufacturer?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [drones, statusFilter, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDrones.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedDrones = filteredDrones.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  // Statistiques
  const stats = {
    total: drones.length,
    pending: drones.filter(d => d.status === 'pending').length,
    approved: drones.filter(d => d.status === 'approved' || d.status === 'active').length,
    rejected: drones.filter(d => d.status === 'rejected').length,
    archived: drones.filter(d => d.archived_at).length
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* En-tête avec statistiques */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Gestion des immatriculations</h2>
            <p className="text-sm text-[#64748b]">
              {stats.pending} demande(s) en attente
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                showArchived 
                  ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30' 
                  : 'bg-[#1a2332] text-[#64748b] border border-[#1f2937] hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4" />
              {showArchived ? 'Voir actifs' : 'Archives'}
              {stats.archived > 0 && (
                <span className="ml-1 text-xs bg-[#1a2332] px-1.5 py-0.5 rounded-full">
                  {stats.archived}
                </span>
              )}
            </button>
            <button
              onClick={fetchDrones}
              className="px-3 py-1.5 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
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
              placeholder="Rechercher par modele, immatriculation, serie..."
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
            </select>
          </div>
        </div>

        {/* Mini statistiques */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <span className="text-[#64748b]">Total: <span className="text-white">{stats.total}</span></span>
          <span className="text-[#f5a623]">En attente: <span className="text-[#f5a623]">{stats.pending}</span></span>
          <span className="text-[#22c55e]">Approuves: <span className="text-[#22c55e]">{stats.approved}</span></span>
          <span className="text-[#f04040]">Rejetes: <span className="text-[#f04040]">{stats.rejected}</span></span>
          {stats.archived > 0 && (
            <span className="text-[#64748b]">Archives: <span className="text-[#64748b]">{stats.archived}</span></span>
          )}
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
      ) : filteredDrones.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] border border-[#1f2937] rounded-xl">
          <p>Aucune demande d'immatriculation correspondant aux filtres</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedDrones.map((drone) => {
              const StatusBadge = getStatusBadge(drone.status)
              const isPending = drone.status === 'pending'
              const isArchived = !!drone.archived_at
              
              return (
                <div 
                  key={drone.id}
                  className={`bg-[#111827] border rounded-xl p-4 flex items-center justify-between hover:border-[#4f8ef7]/30 transition-colors flex-wrap gap-3 ${
                    isArchived ? 'border-[#1f2937] opacity-60' : 'border-[#1f2937]'
                  }`}
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
                      {isArchived && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#64748b]/20 text-[#64748b]">
                          Archive
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-[#64748b]">Fabricant :</span>
                        <span className="text-[#e2e8f0] ml-1">{drone.manufacturer || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">Modele :</span>
                        <span className="text-[#e2e8f0] ml-1">{drone.model}</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">Serie :</span>
                        <span className="text-[#e2e8f0] ml-1">{drone.serial_number || '—'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#64748b] mt-1">
                      Soumis le {new Date(drone.created_at).toLocaleDateString('fr-FR')} a {new Date(drone.created_at).toLocaleTimeString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isPending && (
                      <>
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
                      </>
                    )}
                    
                    {drone.status !== 'pending' && (
                      <button
                        onClick={() => handleArchive(drone.id, !isArchived)}
                        disabled={actionLoading[drone.id]}
                        className={`px-4 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                          isArchived
                            ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                            : 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30 hover:bg-[#f5a623]/20'
                        }`}
                      >
                        {actionLoading[drone.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isArchived ? (
                          <RotateCcw className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                        {isArchived ? 'Restaurer' : 'Archiver'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1f2937] mt-4">
              <span className="text-sm text-[#64748b]">
                {paginatedDrones.length} sur {filteredDrones.length} entree(s)
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

export default AdminDrones