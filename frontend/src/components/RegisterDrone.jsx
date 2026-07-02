import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Drone, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

// Liste des fabricants connus
const MANUFACTURERS = [
  { value: 'dji', label: 'DJI' },
  { value: 'parrot', label: 'Parrot' },
  { value: 'autel', label: 'Autel Robotics' },
  { value: 'skydio', label: 'Skydio' },
  { value: 'yuneec', label: 'Yuneec' },
  { value: 'other', label: 'Autre fabricant' }
]

// Modèles par fabricant
const MODELS_BY_MANUFACTURER = {
  dji: [
    { value: 'mavic-3-pro', label: 'Mavic 3 Pro' },
    { value: 'mavic-3', label: 'Mavic 3' },
    { value: 'mavic-2-pro', label: 'Mavic 2 Pro' },
    { value: 'mini-4-pro', label: 'Mini 4 Pro' },
    { value: 'mini-3', label: 'Mini 3' },
    { value: 'air-3', label: 'Air 3' },
    { value: 'phantom-4', label: 'Phantom 4' },
    { value: 'inspire-3', label: 'Inspire 3' },
    { value: 'agras-t30', label: 'Agras T30' }
  ],
  parrot: [
    { value: 'anafi-ai', label: 'Anafi Ai' },
    { value: 'anafi-usa', label: 'Anafi USA' },
    { value: 'anafi-thermal', label: 'Anafi Thermal' },
    { value: 'anafi-work', label: 'Anafi Work' }
  ],
  autel: [
    { value: 'evo-lite', label: 'EVO Lite' },
    { value: 'evo-nano', label: 'EVO Nano' },
    { value: 'evo-2-pro', label: 'EVO II Pro' },
    { value: 'evo-2-dual', label: 'EVO II Dual' }
  ],
  skydio: [
    { value: 'x2', label: 'X2' },
    { value: 'x2d', label: 'X2D' },
    { value: 's2', label: 'S2' }
  ],
  yuneec: [
    { value: 'h520', label: 'H520' },
    { value: 'h520e', label: 'H520E' },
    { value: 'h480', label: 'H480' }
  ],
  other: [
    { value: 'custom', label: 'Modèle personnalisé' }
  ]
}

const RegisterDrone = ({ user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [generatedRegistration, setGeneratedRegistration] = useState(null)
  const [userName, setUserName] = useState(null)
  const [form, setForm] = useState({
    manufacturer: '',
    model: '',
    customModel: '',
    serialNumber: '',
  })
  const [availableModels, setAvailableModels] = useState([])

  // Récupérer le nom de l'utilisateur
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        if (data?.full_name) {
          // Supprimer accents, mettre en majuscules, remplacer espaces par -
          const name = data.full_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/\s+/g, '-')
          setUserName(name)
        }
      } catch (err) {
        console.error('Erreur récupération nom:', err)
        // Fallback: utiliser l'email
        if (user?.email) {
          const fallbackName = user.email.split('@')[0].toUpperCase()
          setUserName(fallbackName)
        }
      }
    }
    fetchUserName()
  }, [user])

  // Mettre à jour les modèles disponibles quand le fabricant change
  useEffect(() => {
    if (form.manufacturer) {
      const models = MODELS_BY_MANUFACTURER[form.manufacturer] || []
      setAvailableModels(models)
      setForm(prev => ({ ...prev, model: '', customModel: '' }))
    } else {
      setAvailableModels([])
    }
  }, [form.manufacturer])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const generateRegistrationNumber = async () => {
    if (!userName) {
      throw new Error('Nom d\'utilisateur non disponible')
    }

    // Récupérer le dernier numéro de drone pour ce nom
    const { data, error } = await supabase
      .from('registered_drones')
      .select('registration_number')
      .like('registration_number', `${userName}-DRN-%`)
      .order('registration_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let lastNumber = 0
    if (data && data.length > 0) {
      const match = data[0].registration_number.match(/DRN-(\d+)/)
      if (match) lastNumber = parseInt(match[1])
    }

    const newNumber = lastNumber + 1
    return `${userName}-DRN-${String(newNumber).padStart(3, '0')}`
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

      if (!userName) {
        throw new Error('Nom d\'utilisateur non disponible')
      }

      let modelName = ''
      if (form.manufacturer === 'other' && form.customModel) {
        modelName = form.customModel
      } else if (form.model) {
        const selectedModel = availableModels.find(m => m.value === form.model)
        modelName = selectedModel ? selectedModel.label : form.model
      } else {
        throw new Error('Veuillez sélectionner un modèle')
      }

      const registrationNumber = await generateRegistrationNumber()
      setGeneratedRegistration(registrationNumber)

      const { error: insertError } = await supabase
        .from('registered_drones')
        .insert({
          registration_number: registrationNumber,
          owner_id: user.id,
          manufacturer: form.manufacturer,
          model: modelName,
          serial_number: form.serialNumber.trim() || null,
          status: 'pending',
        })

      if (insertError) throw insertError

      setSuccess(true)
      setForm({
        manufacturer: '',
        model: '',
        customModel: '',
        serialNumber: '',
      })

      setTimeout(() => {
        navigate('/operator/drones')
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
          <Drone className="w-5 h-5 text-[#4f8ef7]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Immatriculation d'un drone</h2>
          <p className="text-sm text-[#64748b]">Remplissez les informations du drone à immatriculer</p>
          {userName && (
            <p className="text-xs text-[#64748b] mt-1">
              Opérateur : <span className="text-[#4f8ef7] font-mono">{userName}</span>
            </p>
          )}
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
            Drone immatriculé avec succès ! Numéro : {generatedRegistration}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Fabricant <span className="text-[#f04040]">*</span>
          </label>
          <select
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
            required
          >
            <option value="">Sélectionner un fabricant</option>
            {MANUFACTURERS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {form.manufacturer && (
          <div>
            <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
              Modèle <span className="text-[#f04040]">*</span>
            </label>
            {form.manufacturer === 'other' ? (
              <input
                type="text"
                name="customModel"
                value={form.customModel}
                onChange={handleChange}
                placeholder="Ex: Drone personnalisé XYZ"
                className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
                required
              />
            ) : (
              <select
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
              >
                <option value="">Sélectionner un modèle</option>
                {availableModels.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#e2e8f0] mb-1.5">
            Numéro de série <span className="text-[#64748b] text-xs font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            name="serialNumber"
            value={form.serialNumber}
            onChange={handleChange}
            placeholder="Ex: 3JX7F9K2L4M8N6P (DJI Mavic 3)"
            className="w-full px-4 py-2.5 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4f8ef7]"
          />
          <p className="text-xs text-[#64748b] mt-1">
            Le numéro de série est généralement gravé sur le drone. Laissez vide si vous ne l'avez pas.
          </p>
        </div>

        <div className="p-3 bg-[#1a2332] rounded-lg border border-[#1f2937]">
          <p className="text-xs text-[#64748b]">
            <span className="text-[#4f8ef7] font-medium">À savoir :</span> 
            Le numéro d'immatriculation sera généré au format 
            <span className="text-[#e2e8f0] font-mono"> NOM-DRN-XXX</span>.
            Une fois validé par l'ANAC, ce numéro sera officiellement enregistré.
          </p>
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
            disabled={loading || !userName}
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
    </div>
  )
}

export default RegisterDrone