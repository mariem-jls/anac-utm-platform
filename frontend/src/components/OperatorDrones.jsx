import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Drone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import DroneQRCode from './DroneQRCode'

const OperatorDrones = ({ user }) => {
  const [drones, setDrones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMyDrones()
    }
  }, [user])

  const fetchMyDrones = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('registered_drones')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrones(data || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const config = {
      pending: { 
        label: 'En attente', 
        color: 'text-[#f5a623]', 
        bg: 'bg-[#f5a623]/10',
        icon: Clock,
        description: 'Votre demande est en cours d\'examen par l\'ANAC'
      },
      approved: { 
        label: 'Approuve', 
        color: 'text-[#22c55e]', 
        bg: 'bg-[#22c55e]/10',
        icon: CheckCircle,
        description: 'Votre drone est officiellement immatricule'
      },
      rejected: { 
        label: 'Rejete', 
        color: 'text-[#f04040]', 
        bg: 'bg-[#f04040]/10',
        icon: XCircle,
        description: 'Votre demande a ete rejetee par l\'ANAC'
      },
      active: { 
        label: 'Actif', 
        color: 'text-[#4f8ef7]', 
        bg: 'bg-[#4f8ef7]/10',
        icon: CheckCircle,
        description: 'Drone en service'
      },
      suspended: { 
        label: 'Suspendu', 
        color: 'text-[#f04040]', 
        bg: 'bg-[#f04040]/10',
        icon: XCircle,
        description: 'Drone suspendu par l\'ANAC'
      },
    }
    return config[status] || config.pending
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-[#64748b]">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Veuillez vous connecter pour voir vos drones</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Mes drones immatricules</h2>
          <p className="text-sm text-[#64748b]">
            {drones.length} drone(s) enregistre(s)
          </p>
        </div>
        <button
          onClick={fetchMyDrones}
          className="px-3 py-1.5 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rafraichir
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#4f8ef7] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-[#f04040]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Erreur: {error}</p>
          <button 
            onClick={fetchMyDrones}
            className="mt-2 px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm"
          >
            Reessayer
          </button>
        </div>
      ) : drones.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] border border-[#1f2937] rounded-xl">
          <Drone className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">Aucun drone immatricule</p>
          <p className="text-sm mt-1">
            Rendez-vous dans la section <span className="text-[#4f8ef7]">Immatriculer</span> pour enregistrer votre premier drone
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drones.map((drone) => {
            const status = getStatusInfo(drone.status)
            const StatusIcon = status.icon
            
            return (
              <div 
                key={drone.id}
                className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 hover:border-[#4f8ef7]/30 transition-colors"
              >
                {/* En-tête */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Drone className="w-5 h-5 text-[#4f8ef7]" />
                  <span className="font-mono text-lg font-semibold text-white">
                    {drone.registration_number}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${status.bg} ${status.color} flex items-center gap-1.5`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>
                
                {/* Informations du drone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-[#64748b]">Modele</span>
                    <p className="text-[#e2e8f0]">{drone.model}</p>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Numero de serie</span>
                    <p className="text-[#e2e8f0] font-mono text-xs">{drone.serial_number}</p>
                  </div>
                  <div>
                    <span className="text-[#64748b]">Soumis le</span>
                    <p className="text-[#e2e8f0]">
                      {new Date(drone.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                {/* QR Code pour les drones approuves */}
                {drone.status === 'approved' && (
                  <div className="mt-4 p-4 bg-[#1a2332] rounded-lg border border-[#1f2937]">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="text-sm text-[#64748b] sm:w-48 flex-shrink-0 text-center sm:text-left">
                        QR Code d'immatriculation
                        <p className="text-xs text-[#64748b] mt-1">
                          Scannez ce code pour verifier l'autorisation du drone
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <DroneQRCode 
                          droneId={drone.id} 
                          registrationNumber={drone.registration_number} 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Notes de l'admin */}
                {drone.admin_notes && (
                  <div className="mt-3 p-2 bg-[#1a2332] rounded-lg border border-[#1f2937]">
                    <span className="text-[#64748b] text-xs">Note de l'administrateur :</span>
                    <p className="text-[#e2e8f0] text-sm">{drone.admin_notes}</p>
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

export default OperatorDrones