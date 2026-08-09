import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Store, Package, LogOut, ChevronRight,
  Phone, FileText, Tag, CheckCircle2, Clock, XCircle, ChevronDown, Download,
  Apple, Smartphone, Monitor, ArrowUpFromLine, PlusSquare, Check, MoreVertical,
  Hand, Plus, ArrowLeft
} from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
} from 'firebase/auth'
import { useApp } from '../context/AppContext'
import { VENDOR_REQUEST_STATUS } from '../constants'
import { auth, db } from '../lib/firebase'
import { notifyAdmins } from '../lib/notifications'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { StatusPill } from './StatusPill'

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
      approved: { Icon: CheckCircle2, color: '#2FA761', label: 'Demande approuvée' },
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
function MesCommandes() {
  const [tab, setTab] = useState('encours')
  const [open, setOpen] = useState(false)

  const tabs = [
    { id: 'encours', label: 'En cours' },
    { id: 'livre',   label: 'Livrée' },
    { id: 'annule',  label: 'Annulée' },
  ]

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
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-400'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Contenu vide — prêt pour intégration Firestore */}
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Package className="w-8 h-8" style={{ color: 'var(--border)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--muted-fg)' }}>
                  Aucune commande {tabs.find(t => t.id === tab)?.label.toLowerCase()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <button onClick={() => setMode('login')} className="text-center text-sm font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
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

  const [installModal, setInstallModal] = useState(false)
  const { canInstall, isInstalled, platform, install } = usePwaInstall()
  const [osTab, setOsTab] = useState(platform)

  const handleInstallClick = async () => {
    if (canInstall) {
      const outcome = await install()
      if (outcome === 'accepted') showToast('Application installée !', 'success')
      else if (outcome === 'dismissed') showToast('Installation annulée', 'info')
      return
    }
    setOsTab(platform)
    setInstallModal(true)
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

  const INSTALL_INSTRUCTIONS = {
    ios: [
      { icon: ArrowUpFromLine, title: 'Appuie sur Partager', desc: 'En bas de Safari' },
      { icon: PlusSquare, title: 'Sur l\'écran d\'accueil', desc: 'Dans la liste qui s\'affiche' },
      { icon: CheckCircle2, title: 'Appuie sur "Ajouter"', desc: 'En haut à droite' },
    ],
    android: [
      { icon: Smartphone, title: '3 points en haut à droite', desc: 'Dans Chrome / ton navigateur' },
      { icon: Smartphone, title: 'Ajouter à l\'écran d\'accueil', desc: 'Ou "Installer l\'application" dans le menu' },
      { icon: CheckCircle2, title: 'Confirmer', desc: 'Appuie sur "Ajouter" / "Installer"' },
    ],
    desktop: [
      { icon: MoreVertical, title: 'Icône d\'installation', desc: 'Dans la barre d\'adresse (Chrome / Edge)' },
      { icon: Monitor, title: 'Ou menu ⋮ → "Installer Yâmarché"', desc: 'Si l\'icône n\'est pas visible' },
      { icon: CheckCircle2, title: 'Confirmer l\'installation', desc: 'L\'app s\'ouvre alors dans sa propre fenêtre' },
    ],
  }
  const installInstructions = INSTALL_INSTRUCTIONS[osTab] || INSTALL_INSTRUCTIONS.desktop

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

                  {/* Bouton installer */}
                  {installButton}

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
                    <p className="font-heading font-bold text-base flex items-center gap-2">
                      <Hand className="w-5 h-5" />
                      Bonjour
                    </p>
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

      {/* Modal d'installation */}
      {installModal && (
        <motion.div 
          className="drawer-overlay" 
          style={{ zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          onClick={() => setInstallModal(false)}
        >
          <motion.div 
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <span className="font-heading font-bold text-base">Installer Yâmarché</span>
              <button onClick={() => setInstallModal(false)} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5">
                {[
                  { id: 'desktop', label: 'Ordinateur', icon: Monitor },
                  { id: 'android', label: 'Android', icon: Smartphone },
                  { id: 'ios', label: 'iPhone / iPad', icon: Apple },
                ].map(os => (
                  <button key={os.id} onClick={() => setOsTab(os.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${osTab===os.id ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
                    <os.icon className="w-3.5 h-3.5" />
                    {os.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {installInstructions.map((step, i) => {
                  // Ajout de l'icône Plus pour la première étape desktop (remplace ⊕)
                  const titleWithIcon = osTab === 'desktop' && i === 0 ? (
                    <span>
                      {step.title} <Plus className="w-4 h-4 inline" />
                    </span>
                  ) : step.title
                  return (
                    <div key={i} className="flex items-center bg-gray-50 rounded-2xl p-3 gap-3">
                      <div className="w-10 h-10 bg-[var(--primary-light)] rounded-xl flex items-center justify-center shrink-0">
                        <step.icon className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{titleWithIcon}</p>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setInstallModal(false)} className="btn-primary mt-5 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> OK, j'ai compris !
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}