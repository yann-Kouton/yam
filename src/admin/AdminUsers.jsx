import { useState } from 'react'
import { motion } from 'framer-motion'
import { updateDoc, doc } from 'firebase/firestore'
import { Users, Ban, RotateCcw, Store, CheckCircle2, XCircle, Phone, MapPin, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { db } from '../lib/firebase'
import { notifyUser } from '../lib/notifications'
import { fadeUp, ROLES, USER_STATUS, VENDOR_REQUEST_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { StatusPill } from '../ui/StatusPill'

const FILTERS = [
  { id: 'requests', label: 'Demandes vendeur' },
  { id: 'all',      label: 'Tous' },
  { id: ROLES.VENDEUR, label: 'Vendeurs' },
  { id: ROLES.ADMIN,   label: 'Admins' },
]

export function AdminUsers() {
  const { user: currentUser, showToast } = useApp()
  const { data: users, loading } = useFirestoreCollection('users')
  const [filter, setFilter] = useState('requests')

  const filtered = users.filter(u => {
    if (filter === 'all') return true
    if (filter === 'requests') return u.vendorRequestStatus === VENDOR_REQUEST_STATUS.PENDING
    return u.role === filter
  })

  const approveVendor = async (u) => {
    try {
      await updateDoc(doc(db, 'users', u.id), { role: ROLES.VENDEUR, vendorRequestStatus: VENDOR_REQUEST_STATUS.APPROVED })
      showToast(`${u.displayName || u.email} est désormais vendeur`, 'success')
      notifyUser(u.id, {
        type: 'vendor',
        title: 'Demande vendeur approuvée 🎉',
        desc: 'Vous pouvez désormais publier vos produits et offres surplus sur Yâmarché.',
      })
    } catch (e) { showToast(e.message, 'error') }
  }

  const rejectVendor = async (u) => {
    try {
      await updateDoc(doc(db, 'users', u.id), { vendorRequestStatus: VENDOR_REQUEST_STATUS.REJECTED })
      showToast('Demande refusée', 'info')
      notifyUser(u.id, {
        type: 'vendor',
        title: 'Demande vendeur refusée',
        desc: 'Votre demande pour devenir vendeur n\'a pas été retenue cette fois-ci.',
      })
    } catch (e) { showToast(e.message, 'error') }
  }

  const toggleSuspend = async (u) => {
    if (u.id === currentUser?.uid) { showToast('Vous ne pouvez pas vous suspendre vous-même', 'warning'); return }
    const next = u.status === USER_STATUS.SUSPENDED ? USER_STATUS.ACTIVE : USER_STATUS.SUSPENDED
    try {
      await updateDoc(doc(db, 'users', u.id), { status: next })
      showToast(next === USER_STATUS.SUSPENDED ? 'Compte suspendu' : 'Compte réactivé', next === USER_STATUS.SUSPENDED ? 'warning' : 'success')
      notifyUser(u.id, next === USER_STATUS.SUSPENDED
        ? { type: 'admin', title: 'Compte suspendu', desc: 'Votre compte a été suspendu par un administrateur.' }
        : { type: 'admin', title: 'Compte réactivé', desc: 'Votre compte a été réactivé, bon retour !' })
    } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <motion.div {...fadeUp} key="admin-users">
      <Header title="utilisateurs" />
      <div className="flex gap-2 px-4 pt-2 pb-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`pill flex-shrink-0 ${filter===f.id ? 'active' : ''}`}>{f.label}</button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {loading ? <RowListSkeleton count={4} lines={3} /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Aucun utilisateur" desc="Rien dans cette catégorie" />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(u => (
              <div key={u.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.displayName || 'Sans nom'}</p>
                    <p className="text-xs text-[var(--muted-fg)]">{u.email}</p>
                  </div>
                  <StatusPill status={u.status || 'active'} />
                </div>
                <p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)] mb-3">{u.role}</p>

                {u.vendorRequestStatus === VENDOR_REQUEST_STATUS.PENDING && (
                  <div className="mb-2 bg-[var(--secondary-light)] rounded-xl p-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-[var(--secondary)] shrink-0" />
                      <p className="text-xs font-bold text-[var(--secondary)] flex-1">{u.vendorInfo?.boutique || 'Demande vendeur'}</p>
                      <button onClick={() => approveVendor(u)} className="w-7 h-7 rounded-lg bg-[var(--secondary)] text-white flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => rejectVendor(u)} className="w-7 h-7 rounded-lg bg-white text-red-500 flex items-center justify-center"><XCircle className="w-4 h-4" /></button>
                    </div>
                    {u.vendorInfo ? (
                      <div className="flex flex-col gap-1 pl-6">
                        {u.vendorInfo.secteur && (
                          <p className="text-xs text-[var(--secondary)] flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0" /> {u.vendorInfo.secteur}</p>
                        )}
                        {u.vendorInfo.phone && (
                          <p className="text-xs text-[var(--secondary)] flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" /> {u.vendorInfo.phone}</p>
                        )}
                        {u.vendorInfo.description && (
                          <p className="text-xs text-[var(--secondary)]/80">{u.vendorInfo.description}</p>
                        )}
                        {u.vendorInfo.requestedAt && (
                          <p className="text-[.65rem] text-[var(--secondary)]/70 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 shrink-0" /> Demande envoyée le {new Date(u.vendorInfo.requestedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--secondary)] pl-6">Aucun détail fourni.</p>
                    )}
                  </div>
                )}

                {u.role !== ROLES.ADMIN && (
                  <button onClick={() => toggleSuspend(u)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${u.status===USER_STATUS.SUSPENDED ? 'bg-[var(--secondary-light)] text-[var(--secondary)]' : 'bg-red-50 text-red-500'}`}>
                    {u.status === USER_STATUS.SUSPENDED ? <><RotateCcw className="w-3.5 h-3.5" /> Réactiver</> : <><Ban className="w-3.5 h-3.5" /> Suspendre</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
