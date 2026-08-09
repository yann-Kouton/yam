import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp, ROLES } from '../constants'
import { Header } from './Header'
import { StatusPill } from './StatusPill'

const ROLE_LABEL = { [ROLES.VENDEUR]: 'Vendeur', [ROLES.ADMIN]: 'Administrateur' }

export function RoleProfile() {
  const { user, userDoc, role, showToast, logout } = useApp()

  const handleLogout = async () => {
    await logout()
    showToast('Déconnecté', 'info')
  }

  return (
    <motion.div {...fadeUp} key="role-profil">
      <Header title="profil" />
      <div className="px-4 py-6 flex flex-col gap-4">
        <div className="card p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-orange-400 flex items-center justify-center text-3xl font-black text-white">
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-heading font-bold text-lg">{user?.displayName || userDoc?.displayName || 'Utilisateur'}</p>
            <p className="text-sm text-[var(--muted-fg)]">{user?.email}</p>
          </div>
          <span className="text-xs font-bold text-white bg-[var(--dark)] px-3 py-1 rounded-full">{ROLE_LABEL[role] || role}</span>
          <StatusPill status={userDoc?.status || 'active'} />
        </div>

        <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm py-3">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </motion.div>
  )
}
