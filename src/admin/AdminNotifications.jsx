import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Users, User, Search, Check, Info, Tag, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { notifyAll, notifyUsers } from '../lib/notifications'
import { fadeUp, ROLES } from '../constants'
import { Header } from '../ui/Header'
import { FormSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

const MODES = [
  { id: 'all',      label: 'Tout le monde',   icon: Megaphone },
  { id: 'role',     label: 'Par rôle',        icon: Users },
  { id: 'specific', label: 'Utilisateurs',    icon: User },
]

const TYPES = [
  { id: 'admin', label: 'Annonce', icon: Megaphone },
  { id: 'promo', label: 'Bon plan', icon: Tag },
  { id: 'info',  label: 'Info',    icon: Info },
  { id: 'order', label: 'Commande', icon: Package },
]

const ROLE_OPTIONS = [
  { id: ROLES.CLIENT,  label: 'Clients' },
  { id: ROLES.VENDEUR, label: 'Vendeurs' },
  { id: ROLES.ADMIN,   label: 'Admins' },
]

export function AdminNotifications() {
  const { user: currentUser, showToast } = useApp()
  const { data: allUsers, loading } = useFirestoreCollection('users')

  const [mode, setMode] = useState('all')
  const [selectedRole, setSelectedRole] = useState(ROLES.CLIENT)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [type, setType] = useState('admin')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [sending, setSending] = useState(false)

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allUsers
    return allUsers.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    )
  }, [allUsers, search])

  const toggleUser = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const recipientCount = mode === 'all'
    ? allUsers.length
    : mode === 'role'
      ? allUsers.filter(u => u.role === selectedRole).length
      : selectedIds.length

  const reset = () => { setTitle(''); setDesc(''); setSelectedIds([]) }

  const handleSend = async () => {
    if (!title.trim() || !desc.trim()) { showToast('Titre et message requis', 'warning'); return }
    if (recipientCount === 0) { showToast('Aucun destinataire pour ces critères', 'warning'); return }

    setSending(true)
    try {
      const payload = { type, title: title.trim(), desc: desc.trim(), createdBy: currentUser?.uid || 'admin' }

      if (mode === 'all') {
        await notifyAll(payload)
      } else if (mode === 'role') {
        const ids = allUsers.filter(u => u.role === selectedRole).map(u => u.id)
        await notifyUsers(ids, payload)
      } else {
        await notifyUsers(selectedIds, payload)
      }

      showToast(`Notification envoyée à ${recipientCount} utilisateur${recipientCount > 1 ? 's' : ''}`, 'success')
      reset()
    } catch (e) {
      showToast(e.message, 'error')
    }
    setSending(false)
  }

  return (
    <motion.div {...fadeUp} key="admin-notifications">
      <Header title="diffuser une notification" />

      {loading ? <FormSkeleton /> : (
        <div className="px-4 pb-8 flex flex-col gap-5">
          {/* Destinataires */}
          <div>
            <p className="font-heading font-bold text-sm mb-2">Destinataires</p>
            <div className="flex gap-2">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`pill flex-1 justify-center flex items-center gap-1.5 ${mode === m.id ? 'active' : ''}`}>
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'role' && (
            <div className="flex gap-2">
              {ROLE_OPTIONS.map(r => (
                <button key={r.id} onClick={() => setSelectedRole(r.id)}
                  className={`pill flex-1 justify-center ${selectedRole === r.id ? 'active-green' : ''}`}
                  style={selectedRole === r.id ? { background: 'var(--secondary)', color: '#fff', borderColor: 'var(--secondary)' } : undefined}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {mode === 'specific' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
                <input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>

              {selectedIds.length > 0 && (
                <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </p>
              )}

              {filteredUsers.length === 0 ? (
                <EmptyState icon={User} title="Aucun résultat" desc="Aucun utilisateur ne correspond à la recherche" />
              ) : (
                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
                  {filteredUsers.map(u => {
                    const checked = selectedIds.includes(u.id)
                    return (
                      <button key={u.id} onClick={() => toggleUser(u.id)}
                        className={`card p-3 flex items-center gap-3 text-left border-2 ${checked ? 'border-[var(--primary)]' : 'border-transparent'}`}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--primary), #f5a623)' }}>
                          {(u.displayName || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{u.displayName || 'Sans nom'}</p>
                          <p className="text-xs text-[var(--muted-fg)] truncate">{u.email} · {u.role}</p>
                        </div>
                        {checked && (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
                            <Check className="w-3.5 h-3.5 text-white" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div>
            <p className="font-heading font-bold text-sm mb-2">Type</p>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`pill flex items-center gap-1.5 ${type === t.id ? 'active' : ''}`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-3">
            <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
            <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)] resize-none"
              placeholder="Message" rows={3} value={desc} onChange={e => setDesc(e.target.value)} maxLength={280} />
          </div>

          {/* Résumé + envoi */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-fg)]">Destinataires</p>
              <p className="font-heading font-black text-lg">{recipientCount}</p>
            </div>
            <motion.button whileTap={{ scale: .97 }} onClick={handleSend} disabled={sending}
              className="btn-primary w-auto px-6 flex items-center gap-2 disabled:opacity-70">
              {sending ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : <Megaphone className="w-4 h-4" />}
              Envoyer
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
