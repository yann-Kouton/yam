import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Store, Package, LogOut, ChevronRight,
  Phone, FileText, Tag, CheckCircle2, Clock, XCircle, ChevronDown, Download,
  MapPin, Banknote,
} from 'lucide-react'
import { doc, updateDoc, where } from 'firebase/firestore'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
} from 'firebase/auth'
import { useApp } from '../context/AppContext'
import { VENDOR_REQUEST_STATUS, ORDER_STATUS } from '../constants'
import { auth, db } from '../lib/firebase'
import { notifyAdmins } from '../lib/notifications'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { StatusPill } from './StatusPill'
import { BottomSheet } from './BottomSheet'

const PAYMENT_LABELS = {
  orange: 'Orange Money',
  mtn: 'MTN Mobile Money',
  moov: 'Moov Money',
  wave: 'Wave',
  cash: 'Paiement à la livraison',
}

function formatOrderDate(ts, opts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString('fr-FR', opts)
}

// ── Détail d'une commande (BottomSheet) ───────────────────
function OrderDetailSheet({ order, onClose }) {
  const items = order?.items || []
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <BottomSheet
      open={!!order}
      onClose={onClose}
      title={order ? `Commande #${order.id.slice(0, 8).toUpperCase()}` : ''}
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>
              {formatOrderDate(order.createdAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <StatusPill status={order.status} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>Articles</p>
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{i.qty}× {i.name}</span>
                <span className="font-semibold">{(i.price * i.qty).toLocaleString()} F</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted-fg)' }}>
              <span>Sous-total</span><span>{itemsTotal.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted-fg)' }}>
              <span>Livraison</span><span>{(order.deliveryFee || 0).toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>{(order.total || 0).toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>Livraison</p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{order.zone}{order.address ? ` — ${order.address}` : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{order.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Banknote className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

// ── Formulaire Devenir Vendeur ────────────────────────────
function VendorForm({ onClose }) {
  const { user, userDoc, showToast } = useApp()
  const [step, setStep] = useState('idle') // idle | form | loading | done
  const [form, setForm] = useState({ boutique: '', description: '', phone: '', secteur: '' })

  const vendorStatus = userDoc?.vendorRequestStatus || VENDOR_REQUEST_STATUS.NONE

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStep('loading')
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        vendorRequestStatus: VENDOR_REQUEST_STATUS.PENDING,
        vendorInfo: { ...form, requestedAt: new Date().toISOString() },
      })
      showToast('Demande envoyée ! Un admin va l\'examiner.', 'success')
      notifyAdmins({
        type: 'vendor',
        title: 'Nouvelle demande vendeur',
        desc: `${userDoc?.displayName || user?.email || 'Un client'} souhaite devenir vendeur (${form.boutique || 'boutique'}).`,
      })
      setStep('done')
    } catch (err) {
      showToast(err.message, 'error')
      setStep('form')
    }
  }

  // Statut déjà envoyé
  if (vendorStatus !== VENDOR_REQUEST_STATUS.NONE) {
    const statusConfig = {
      pending: { Icon: Clock,         color: '#F59E0B', label: 'Demande en cours d\'examen' },
      approved: { Icon: CheckCircle2, color: '#2FA761', label: 'Demande approuvée ✓' },
      rejected: { Icon: XCircle,      color: '#EF4444', label: 'Demande refusée — réessayez plus tard' },
    }
    const cfg = statusConfig[vendorStatus] || statusConfig.pending
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
        <cfg.Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
          <StatusPill status={vendorStatus} />
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--secondary)' }} />
        <p className="font-semibold text-sm">Demande envoyée !</p>
        <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>Un administrateur examinera votre profil.</p>
      </div>
    )
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('form')}
        className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm"
        style={{ background: 'rgba(47,167,97,0.10)', color: 'var(--secondary)' }}
      >
        <Store className="w-4 h-4" />
        Devenir vendeur
        <ChevronRight className="w-4 h-4 ml-auto" />
      </button>
    )
  }

  // Formulaire
  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
        Informations de votre boutique
      </p>

      {[
        { icon: Store, name: 'boutique', placeholder: 'Nom de la boutique', required: true },
        { icon: Tag,   name: 'secteur',  placeholder: 'Secteur (ex: Fruits, Légumes…)', required: true },
        { icon: Phone, name: 'phone',    placeholder: 'Téléphone', required: true },
      ].map(({ icon: Icon, name, placeholder, required }) => (
        <div key={name} className="flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
          <input
            required={required}
            placeholder={placeholder}
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
      ))}

      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
        <textarea
          placeholder="Courte description de votre activité…"
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="flex-1 text-sm outline-none bg-transparent resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setStep('idle')}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}>
          Annuler
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={step === 'loading'}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'var(--secondary)' }}>
          {step === 'loading' ? (
            <div className="spinner w-4 h-4 mx-auto border-white border-t-transparent" />
          ) : 'Envoyer'}
        </motion.button>
      </div>
    </motion.form>
  )
}

// ── Section Mes Commandes ─────────────────────────────────
const COMMANDES_TABS = [
  { id: 'encours', label: 'En cours', statuses: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.READY] },
  { id: 'livre',   label: 'Livrée',   statuses: [ORDER_STATUS.DELIVERED] },
  { id: 'annule',  label: 'Annulée',  statuses: [ORDER_STATUS.CANCELLED] },
]

function MesCommandes() {
  const { user } = useApp()
  const [tab, setTab] = useState('encours')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const { data: orders, loading } = useFirestoreCollection(
    'orders', user ? [where('userId', '==', user.uid)] : []
  )

  const sorted = [...orders].sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
    return tb - ta
  })

  const activeTab = COMMANDES_TABS.find(t => t.id === tab)
  const filtered = sorted.filter(o => activeTab.statuses.includes(o.status))

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl"
        style={{ background: open ? 'rgba(231,126,35,0.08)' : 'transparent' }}
      >
        <Package className="w-5 h-5" style={{ color: 'var(--muted-fg)' }} />
        <span className="flex-1 font-semibold text-sm">Mes commandes</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ color: 'var(--muted-fg)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-2 pb-2 flex flex-col gap-2">
              {/* Tabs statuts */}
              <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
                {COMMANDES_TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-400'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex flex-col gap-2 py-1">
                  {[0, 1].map(i => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--muted)' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Package className="w-8 h-8" style={{ color: 'var(--border)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--muted-fg)' }}>
                    Aucune commande {activeTab.label.toLowerCase()}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map(o => {
                    const itemCount = (o.items || []).reduce((s, i) => s + i.qty, 0)
                    const dateLabel = formatOrderDate(o.createdAt, { day: '2-digit', month: 'short' })
                    return (
                      <button
                        key={o.id}
                        onClick={() => setSelected(o)}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                            <StatusPill status={o.status} />
                          </div>
                          <p className="text-[.7rem] mt-1" style={{ color: 'var(--muted-fg)' }}>
                            {itemCount} article{itemCount > 1 ? 's' : ''} · {dateLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                            {(o.total || 0).toLocaleString()} F
                          </span>
                          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--border)' }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Mini auth dans le drawer ─────────────────────────────
function DrawerAuthBlock() {
  const { showToast } = useApp()
  const [mode, setMode] = useState('login') // login | register | reset
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, form.email, form.password)
        showToast('Connecté !', 'success')
      } else {
        await createUserWithEmailAndPassword(auth, form.email, form.password)
        showToast('Compte créé !', 'success')
      }
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!form.email) { showToast('Entrez votre email pour réinitialiser', 'error'); return }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, form.email)
      showToast('Email de réinitialisation envoyé !', 'success')
      setMode('login')
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      showToast('Connecté avec Google !', 'success')
    } catch (err) { showToast(err.message, 'error') }
  }

  if (mode === 'reset') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-center text-sm font-semibold" style={{ color: 'var(--muted-fg)' }}>
          Recevez un lien par email pour choisir un nouveau mot de passe
        </p>
        <form onSubmit={handleReset} className="flex flex-col gap-2.5">
          <input type="email" className="border rounded-xl px-4 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--border)' }}
            placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading} className="btn-primary disabled:opacity-70">
            {loading ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : 'Envoyer le lien'}
          </motion.button>
        </form>
        <button onClick={() => setMode('login')} className="text-center text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-center text-sm font-semibold" style={{ color: 'var(--muted-fg)' }}>
        Connectez-vous pour accéder à votre compte
      </p>

      {/* Toggle login/register */}
      <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
        {['login', 'register'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
            {m === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        ))}
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-2.5">
        {mode === 'register' && (
          <input className="border rounded-xl px-4 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--border)' }}
            placeholder="Nom complet" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        )}
        <input type="email" className="border rounded-xl px-4 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--border)' }}
          placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" className="border rounded-xl px-4 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--border)' }}
          placeholder="Mot de passe" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {mode === 'login' && (
          <button type="button" onClick={() => setMode('reset')}
            className="self-end text-xs font-semibold -mt-1" style={{ color: 'var(--primary)' }}>
            Mot de passe oublié ?
          </button>
        )}
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading} className="btn-primary disabled:opacity-70">
          {loading ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </motion.button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <button onClick={handleGoogle}
        className="flex items-center justify-center gap-3 border-2 rounded-xl py-3 font-semibold text-sm"
        style={{ borderColor: 'var(--border)' }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuer avec Google
      </button>
    </div>
  )
}

// ── Composant principal HamburgerDrawer ───────────────────
export function HamburgerDrawer({ open, onClose, onNavigate }) {
  const { user, userDoc, logout, showToast } = useApp()

  const { canInstall, isInstalled, install } = usePwaInstall()

  const handleInstallClick = async () => {
    
    if (canInstall) {
      const outcome = await install()
      if (outcome === 'accepted') showToast('Application installée !', 'success')
      else if (outcome === 'dismissed') showToast('Installation annulée', 'info')
      return
    }
    
    showToast('Installation non disponible sur ce navigateur — ouvre ce site avec Chrome ou Edge pour l\'installer.', 'info')
  }

  const handleLogout = async () => {
    await logout()
    showToast('Déconnecté', 'info')
    onClose()
  }

  const handleProfileClick = () => {
    onNavigate('profil')
    onClose()
  }

  const installButton = isInstalled ? null : (
    <button onClick={handleInstallClick}
      className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl hover:bg-[var(--muted)] transition-colors mt-2">
      <Download className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
      <span className="flex-1 font-semibold text-sm">Installer l'application</span>
      <ChevronRight className="w-4 h-4" style={{ color: 'var(--border)' }} />
    </button>
  )

  const displayUsername = userDoc?.displayName || user?.displayName || 'Utilisateur'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="drawer-panel flex flex-col"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-heading font-black text-lg">
                <span style={{ color: 'var(--primary)' }}>Yâ</span>
                <span style={{ color: 'var(--dark)' }}>marché</span>
              </span>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--muted)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--muted-fg)' }} />
              </motion.button>
            </div>

            {/* Contenu */}
            {user ? (
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Avatar & infos utilisateur */}
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--primary), #f5a623)' }}>
                    {displayUsername[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-base truncate">
                      {displayUsername}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-fg)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-1 px-3 py-3">
                  {/* Profil */}
                  <button onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl hover:bg-[var(--muted)] transition-colors">
                    <User className="w-5 h-5" style={{ color: 'var(--muted-fg)' }} />
                    <span className="flex-1 font-semibold text-sm">Mon profil</span>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--border)' }} />
                  </button>

                  

                  {/* Devenir vendeur */}
                  <div className="px-1">
                    <p className="text-xs font-bold uppercase tracking-wider px-3 pt-3 pb-1.5"
                      style={{ color: 'var(--muted-fg)' }}>Ma boutique</p>
                    <VendorForm onClose={onClose} />
                  </div>

                  {/* Mes commandes */}
                  <div className="mt-2">
                    <p className="text-xs font-bold uppercase tracking-wider px-4 pb-1.5"
                      style={{ color: 'var(--muted-fg)' }}>Achats</p>
                    <MesCommandes />
                  </div>
                </div>

                {/* Bouton installer */}
                  {installButton}

                {/* Déconnexion */}
                <div className="mt-auto px-5 py-5" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: 'rgba(239,68,68,0.07)', color: '#EF4444' }}>
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            ) : (
              // Non connecté
              <div className="flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 px-5 py-5"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--muted)' }}>
                    <User className="w-7 h-7" style={{ color: 'var(--muted-fg)' }} />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base">Bonjour</p>
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      Connectez-vous pour continuer
                    </p>
                  </div>
                </div>
                <div className="px-3 pt-2">
                  {installButton}
                </div>
                <DrawerAuthBlock />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
