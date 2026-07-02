import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { 
  Shield, 
  Loader2, 
  Copy, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw
} from 'lucide-react'

const AdminPolice = () => {
  const navigate = useNavigate()
  const [policeUsers, setPoliceUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    fetchPoliceUsers()
  }, [])

  const fetchPoliceUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'police')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('👮 Agents police récupérés:', data)
      setPoliceUsers(data || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAllCredentials = (user) => {
    const text = `Email: ${user.email}\nMot de passe: ${user.password || 'Non defini'}\nRole: Police`
    navigator.clipboard.writeText(text)
    setCopied(user.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const togglePassword = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const deleteUser = async (userId, userEmail) => {
    if (!confirm(`Supprimer l'agent ${userEmail} ?`)) return
    
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) throw authError

      await fetchPoliceUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#111827] rounded-xl border border-[#1f2937]">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#4f8ef7]" />
          <h2 className="text-lg font-semibold text-white">Agents de police</h2>
          <span className="text-xs px-2 py-1 bg-[#1a2332] rounded-full text-[#64748b] border border-[#1f2937]">
            {policeUsers.length} agent(s)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#3b7de0] transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel agent
          </button>
          <button
            onClick={fetchPoliceUsers}
            className="px-3 py-2 bg-[#1a2332] text-[#e2e8f0] rounded-lg hover:bg-[#1f2937] transition-colors text-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraichir
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#f04040]/10 border border-[#f04040]/30 rounded-lg flex items-start gap-2">
          <XCircle className="w-4 h-4 text-[#f04040] flex-shrink-0 mt-0.5" />
          <span className="text-sm text-[#f04040]">Erreur: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#4f8ef7] animate-spin" />
        </div>
      ) : policeUsers.length === 0 ? (
        <div className="text-center py-8 text-[#64748b]">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucun agent de police enregistre</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-3 px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#3b7de0] transition-colors"
          >
            Creer un agent
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {policeUsers.map((user) => (
            <div
              key={user.id}
              className="bg-[#1a2332] rounded-lg p-4 border border-[#1f2937] hover:border-[#4f8ef7]/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Nom et rôle */}
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-medium">{user.full_name || 'Nom non renseigne'}</p>
                    <span className="text-xs px-2 py-0.5 bg-[#4f8ef7]/20 text-[#4f8ef7] rounded-full">
                      Police
                    </span>
                  </div>

                  {/* Email avec bouton copier */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-[#64748b] font-mono">{user.email}</p>
                    <button
                      onClick={() => copyToClipboard(user.email, 'email')}
                      className="p-1 text-[#64748b] hover:text-[#4f8ef7] transition-colors"
                      title="Copier l'email"
                    >
                      {copied === 'email' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Mot de passe — affiché depuis profiles.password */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[#64748b]">Mot de passe:</span>
                    <span className="text-sm font-mono text-[#e2e8f0]">
                      {showPasswords[user.id] ? (
                        user.password || 'Non defini'
                      ) : (
                        '••••••••'
                      )}
                    </span>
                    <button
                      onClick={() => togglePassword(user.id)}
                      className="p-1 text-[#64748b] hover:text-[#4f8ef7] transition-colors"
                      title="Afficher/cacher le mot de passe"
                    >
                      {showPasswords[user.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(showPasswords[user.id] ? user.password || 'Non defini' : '••••••••', 'password')}
                      className="p-1 text-[#64748b] hover:text-[#4f8ef7] transition-colors"
                      title="Copier le mot de passe"
                    >
                      {copied === 'password' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Date de création */}
                  <p className="text-xs text-[#64748b]">
                    Cree le {new Date(user.created_at).toLocaleDateString('fr-FR')} a {new Date(user.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyAllCredentials(user)}
                    className="px-3 py-1.5 bg-[#4f8ef7]/20 text-[#4f8ef7] border border-[#4f8ef7]/30 rounded-lg text-xs hover:bg-[#4f8ef7]/30 transition-colors flex items-center gap-1.5"
                    title="Copier tous les identifiants"
                  >
                    {copied === user.id ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copier tout
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, user.email)}
                    className="p-1.5 text-[#64748b] hover:text-[#f04040] transition-colors"
                    title="Supprimer l'agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPolice