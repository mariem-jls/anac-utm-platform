import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabase'
import { UserPlus, Mail, Shield, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

const AdminUsers = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('police')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Créer l'utilisateur dans Auth avec la clé service_role
      const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
        full_name: fullName,
        role: role
    }
    })
    setCreatedUser({
    email: email,
    password: password,
    role: role,
    fullName: fullName
    })

      if (authError) throw authError

      // Créer le profil dans la table profiles
      if (data.user) {
        const { error: profileError } = supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            password: password
          })

        if (profileError) throw profileError
      }

      setSuccess(`Utilisateur ${role} créé avec succès : ${email}`)
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-[#111827] rounded-xl border border-[#1f2937]">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="w-5 h-5 text-[#4f8ef7]" />
        <h2 className="text-lg font-semibold text-white">Créer un compte utilisateur</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#f04040]/10 border border-[#f04040]/30 rounded-lg flex items-start gap-2">
          <XCircle className="w-4 h-4 text-[#f04040] flex-shrink-0 mt-0.5" />
          <span className="text-sm text-[#f04040]">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
          <span className="text-sm text-[#22c55e]">{success}</span>
        </div>
        
      )}
      {createdUser && (
  <div className="mb-4 p-4 bg-[#1a2332] border border-[#22c55e]/30 rounded-lg">
    <h4 className="text-sm font-semibold text-white mb-2">Identifiants de connexion</h4>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-[#64748b]">Email</span>
        <span className="text-[#e2e8f0] font-mono">{createdUser.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#64748b]">Mot de passe</span>
        <span className="text-[#e2e8f0] font-mono">{createdUser.password}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#64748b]">Role</span>
        <span className="text-[#4f8ef7] font-medium">{createdUser.role}</span>
      </div>
    </div>
    <button
      onClick={() => {
        navigator.clipboard.writeText(
          `Email: ${createdUser.email}\nMot de passe: ${createdUser.password}\nRole: ${createdUser.role}`
        )
        alert('Identifiants copies dans le presse-papier')
      }}
      className="mt-3 w-full py-2 bg-[#4f8ef7]/20 text-[#4f8ef7] border border-[#4f8ef7]/30 rounded-lg text-sm hover:bg-[#4f8ef7]/30 transition-colors"
    >
      Copier les identifiants
    </button>
  </div>
)}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#e2e8f0] mb-1">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nom de l'utilisateur"
            className="w-full px-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#e2e8f0] mb-1">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="utilisateur@email.com"
              className="w-full pl-10 pr-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#e2e8f0] mb-1">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#1a2332] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#4f8ef7]"
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
          <label className="block text-sm text-[#e2e8f0] mb-1">Rôle</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="police"
                checked={role === 'police'}
                onChange={() => setRole('police')}
                className="w-4 h-4 text-[#4f8ef7]"
              />
              <span className="text-sm text-[#e2e8f0]">Police</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="operator"
                checked={role === 'operator'}
                onChange={() => setRole('operator')}
                className="w-4 h-4 text-[#4f8ef7]"
              />
              <span className="text-sm text-[#e2e8f0]">Opérateur</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="admin"
                checked={role === 'admin'}
                onChange={() => setRole('admin')}
                className="w-4 h-4 text-[#4f8ef7]"
              />
              <span className="text-sm text-[#e2e8f0]">Admin</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[#4f8ef7] text-white rounded-lg font-medium hover:bg-[#3b7de0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
    </div>
  )
}

export default AdminUsers