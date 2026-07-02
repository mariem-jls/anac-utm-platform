import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Satellite, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: ''
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
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })
      
      if (error) throw error
      navigate('/platform')
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
              <Satellite className="w-6 h-6 text-[#4f8ef7]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">ANAC UTM</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Plateforme de supervision de drones
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#f04040]/10 border border-[#f04040]/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#f04040] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-[#f04040]">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#64748b]">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-[#4f8ef7] hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login