import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Drone, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const RegisterDrone = ({ user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    model: '',
    serial_number: '',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
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
        throw new Error('Vous devez être connecté pour immatriculer un drone')
      }

      const timestamp = Date.now().toString().slice(-6)
      const registrationNumber = `TN-DRN-${timestamp}`

      const { data, error: insertError } = await supabase
        .from('registered_drones')
        .insert({
          registration_number: registrationNumber,
          owner_id: user.id,
          model: form.model,
          serial_number: form.serial_number,
          status: 'pending',
        })
        .select()

      if (insertError) throw insertError

      setSuccess(true)
      setForm({ model: '', serial_number: '' })

      setTimeout(() => {
        navigate('/operator/drones')
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#111827] rounded-xl border border-[#1f2937]">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#4f8ef7]/10 p-2 rounded-lg">
          <Drone className="w-5 h-5 text-[#4f8ef7]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Immatriculation d'un drone</h2>
          <p className="text-sm text-[#64748b]">Remplissez les informations du drone à immatriculer</p>
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
            Drone immatriculé avec succès ! En attente de validation par l'admin.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Modèle du drone <span className="text-[#f04040]">*</span>
          </label>
          <input
            type="text"
            name="model"
            value={form.model}
            onChange={handleChange}
            placeholder="Ex: DJI Mavic 3, Parrot Anafi, etc."
            required
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Numéro de série <span className="text-[#f04040]">*</span>
          </label>
          <input
            type="text"
            name="serial_number"
            value={form.serial_number}
            onChange={handleChange}
            placeholder="Numéro de série du drone"
            required
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7] transition-colors"
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
            disabled={loading}
            className="px-6 py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Immatriculer le drone'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-[#1a2332] rounded-lg border border-[#1f2937]">
        <p className="text-xs text-[#64748b]">
          <span className="font-medium text-[#4f8ef7]">Information :</span> 
          Après soumission, un administrateur ANAC validera votre demande. 
          Vous recevrez une notification par email.
        </p>
      </div>
    </div>
  )
}

export default RegisterDrone