import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Drone, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  XCircle
} from 'lucide-react'

const MISSION_TYPES = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'surveillance', label: 'Surveillance' },
  { value: 'livraison', label: 'Livraison' },
  { value: 'inspection', label: 'Inspection industrielle' },
  { value: 'cartographie', label: 'Cartographie' },
  { value: 'photographie', label: 'Photographie / Audiovisuel' },
  { value: 'secours', label: 'Secours / Recherche' },
  { value: 'loisir', label: 'Loisir / Sport' }
]

const FlightPlanForm = ({ user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [drones, setDrones] = useState([])
  const [loadingDrones, setLoadingDrones] = useState(true)
  const [form, setForm] = useState({
    drone_id: '',
    mission_type: '',
    start_time: '',
    end_time: '',
    zone_name: '',
    latitude_center: '',
    longitude_center: '',
    radius: '',
    altitude_max: 120
  })

  // Récupérer les drones approuvés de l'opérateur
  useEffect(() => {
    const fetchDrones = async () => {
      if (!user) return
      setLoadingDrones(true)
      try {
        const { data, error } = await supabase
          .from('registered_drones')
          .select('id, registration_number, model')
          .eq('owner_id', user.id)
          .in('status', ['approved', 'active'])

        if (error) throw error
        setDrones(data || [])
      } catch (err) {
        console.error('Erreur récupération drones:', err)
      } finally {
        setLoadingDrones(false)
      }
    }
    fetchDrones()
  }, [user])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!user) {
        throw new Error('Vous devez être connecté')
      }

      // Validation
      if (!form.drone_id) {
        throw new Error('Veuillez sélectionner un drone')
      }
      if (!form.mission_type) {
        throw new Error('Veuillez sélectionner un type de mission')
      }
      if (!form.start_time || !form.end_time) {
        throw new Error('Veuillez définir les dates et heures de vol')
      }
      if (new Date(form.start_time) >= new Date(form.end_time)) {
        throw new Error('La date de début doit être antérieure à la date de fin')
      }
      if (new Date(form.start_time) < new Date()) {
        throw new Error('La date de début ne peut pas être dans le passé')
      }

      // Vérifier que le drone existe et appartient à l'opérateur
      const drone = drones.find(d => d.id === form.drone_id)
      if (!drone) {
        throw new Error('Drone non trouvé ou non autorisé')
      }

      const { error: insertError } = await supabase
        .from('flight_plans')
        .insert({
          drone_id: form.drone_id,
          operator_id: user.id,
          mission_type: form.mission_type,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          zone_name: form.zone_name || null,
          latitude_center: form.latitude_center ? parseFloat(form.latitude_center) : null,
          longitude_center: form.longitude_center ? parseFloat(form.longitude_center) : null,
          radius: form.radius ? parseFloat(form.radius) : null,
          altitude_max: form.altitude_max ? parseFloat(form.altitude_max) : 120,
          status: 'pending'
        })

      if (insertError) throw insertError

      setSuccess(true)
      setForm({
        drone_id: '',
        mission_type: '',
        start_time: '',
        end_time: '',
        zone_name: '',
        latitude_center: '',
        longitude_center: '',
        radius: '',
        altitude_max: 120
      })

      setTimeout(() => {
        navigate('/operator/flights')
      }, 3000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-[#111827] rounded-xl border border-[#1f2937]">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#4f8ef7]/10 p-2 rounded-lg">
          <Calendar className="w-5 h-5 text-[#4f8ef7]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Soumettre un plan de vol</h2>
          <p className="text-sm text-[#64748b]">Remplissez les informations pour soumettre un plan de vol à l'ANAC</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#f04040]/10 border border-[#f04040]/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#f04040] flex-shrink-0 mt-0.5" />
          <span className="text-sm text-[#f04040]">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
          <span className="text-sm text-[#22c55e]">
            Plan de vol soumis avec succès ! En attente de validation par l'ANAC.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drone */}
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Drone <span className="text-[#f04040]">*</span>
          </label>
          <select
            name="drone_id"
            value={form.drone_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
            required
            disabled={loadingDrones}
          >
            <option value="">Sélectionner un drone</option>
            {drones.map(d => (
              <option key={d.id} value={d.id}>
                {d.registration_number} - {d.model}
              </option>
            ))}
          </select>
          {loadingDrones && (
            <p className="text-xs text-[#64748b] mt-1">Chargement des drones...</p>
          )}
          {!loadingDrones && drones.length === 0 && (
            <p className="text-xs text-[#f5a623] mt-1">
              Aucun drone approuvé. Veuillez immatriculer un drone et attendre la validation.
            </p>
          )}
        </div>

        {/* Type de mission */}
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Type de mission <span className="text-[#f04040]">*</span>
          </label>
          <select
            name="mission_type"
            value={form.mission_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
            required
          >
            <option value="">Sélectionner un type</option>
            {MISSION_TYPES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Date et heure */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Début <span className="text-[#f04040]">*</span>
            </label>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Fin <span className="text-[#f04040]">*</span>
            </label>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
              required
            />
          </div>
        </div>

        {/* Zone d'opération */}
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Zone d'opération <span className="text-[#64748b] text-xs font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            name="zone_name"
            value={form.zone_name}
            onChange={handleChange}
            placeholder="Ex: Zone industrielle El Ghazala, Ariana"
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
          />
        </div>

        {/* Coordonnées */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Latitude <span className="text-[#64748b] text-xs font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              step="0.000001"
              name="latitude_center"
              value={form.latitude_center}
              onChange={handleChange}
              placeholder="36.800000"
              className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Longitude <span className="text-[#64748b] text-xs font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              step="0.000001"
              name="longitude_center"
              value={form.longitude_center}
              onChange={handleChange}
              placeholder="10.180000"
              className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Rayon (m) <span className="text-[#64748b] text-xs font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              name="radius"
              value={form.radius}
              onChange={handleChange}
              placeholder="5000"
              className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
            />
          </div>
        </div>

        {/* Altitude max */}
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Altitude max (m) <span className="text-[#64748b] text-xs font-normal">(défaut: 120m)</span>
          </label>
          <input
            type="number"
            name="altitude_max"
            value={form.altitude_max}
            onChange={handleChange}
            min={0}
            max={500}
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
          />
        </div>

        <div className="pt-4 border-t border-[#1f2937] flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/operator/dashboard')}
            className="px-4 py-2 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || drones.length === 0}
            className="px-6 py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Soumettre le plan de vol'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FlightPlanForm