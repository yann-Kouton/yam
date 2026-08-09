import { motion } from 'framer-motion'
import { MapPin, CreditCard, HelpCircle, ChevronRight, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'
import { AuthForm } from './AuthForm'

export function PageProfil() {
  const { user, userDoc, showToast, logout } = useApp()

  const handleLogout = async () => {
    await logout()
    showToast('Déconnecté', 'info')
  }

  if (!user) return (
    <motion.div {...fadeUp} key="profil-auth">
      <Header title="profil" />
      <div className="px-5 py-6">
        <AuthForm />
      </div>
    </motion.div>
  )

  // Utiliser d'abord le displayName stocké dans Firestore, puis celui de l'auth, puis un fallback
  const displayName = userDoc?.displayName || user?.displayName || 'Utilisateur'
  const firstLetter = displayName[0]?.toUpperCase() || '?'

  return (
    <motion.div {...fadeUp} key="profil-user">
      <Header title="profil" />
      <div className="px-4 py-6 flex flex-col gap-4">
        {/* Avatar */}
        <div className="card p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), #f5a623)' }}>
            {firstLetter}
          </div>
          <div>
            <p className="font-heading font-bold text-lg">{displayName}</p>
            <p className="text-sm text-[var(--muted-fg)]">{user.email}</p>
          </div>
        </div>

        {/* Paramètres */}
        {[
          { icon: MapPin,     label: 'Mes adresses',    desc: 'Gérer mes adresses' },
          { icon: CreditCard, label: 'Paiement',        desc: 'Méthodes sauvegardées' },
          { icon: HelpCircle, label: 'Aide & Support',  desc: 'FAQ et contact' },
        ].map(item => (
          <button key={item.label} className="card p-4 flex items-center gap-3 w-full text-left">
            <item.icon className="w-5 h-5 text-[var(--muted-fg)]" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-[var(--muted-fg)]">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}

        <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm py-3">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </motion.div>
  )
}