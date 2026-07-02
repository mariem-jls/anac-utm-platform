import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

const SignUp = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (form.password !== form.confirmPassword) {
    setError('Les mots de passe ne correspondent pas')
    return
  }

  if (form.password.length < 6) {
    setError('Le mot de passe doit contenir au moins 6 caractères')
    return
  }

  setLoading(true)
  setError(null)

  try {
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: 'operator'
        }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // 2. Utiliser la fonction SQL pour créer le profil (contourne RLS)
      const { error: profileError } = await supabase
        .rpc('create_profile', {
          p_id: authData.user.id,
          p_email: form.email,
          p_full_name: form.fullName,
          p_role: 'operator'
        })

      if (profileError) {
        console.error('Erreur création profil:', profileError)
        // Essayer l'insertion directe comme fallback
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: form.email,
            full_name: form.fullName,
            role: 'operator'
          })
        
        if (insertError) throw insertError
      }
    }

    setSuccess(true)
    setTimeout(() => {
      navigate('/login')
    }, 3000)

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] p-4">
      <div className="bg-[#111827] p-8 rounded-xl border border-[#1f2937] w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-[#4f8ef7]/10 p-3 rounded-lg">
              <User className="w-6 h-6 text-[#4f8ef7]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Créez votre compte</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Inscription réservée aux opérateurs de drones
          </p>
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
              Compte créé avec succès ! Redirection vers la page de connexion...
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#e2e8f0] mb-1">
              Nom complet <span className="text-[#f04040]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Votre nom et prénom"
                className="w-full pl-10 pr-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#e2e8f0] mb-1">
              Email <span className="text-[#f04040]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="w-full pl-10 pr-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#e2e8f0] mb-1">
              Mot de passe <span className="text-[#f04040]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#e2e8f0] mb-1">
              Confirmer le mot de passe <span className="text-[#f04040]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748b] mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[#4f8ef7] hover:underline">
            Se connecter
          </Link>
        </p>
        
        <p className="text-center text-xs text-[#64748b] mt-4">
          Seuls les opérateurs peuvent créer un compte. Les agents de police et admins sont créés par l'ANAC.
        </p>
      </div>
    </div>
  )
}

export default SignUp