import { AppProvider, useApp } from './context/AppContext'
import { SplashScreen } from './ui/SplashScreen'
import { ROLES } from './constants'
import { ClientApp } from './client/ClientApp'
import { VendorApp } from './vendeur/VendorApp'
import { AdminApp } from './admin/AdminApp'
import { Ban } from 'lucide-react'

function SuspendedScreen() {
  const { logout } = useApp()
  return (
    <div className="app-shell flex flex-col items-center justify-center gap-4 px-8 text-center">
      <Ban className="w-14 h-14 text-red-400" />
      <h1 className="font-heading font-bold text-lg">Compte suspendu</h1>
      <p className="text-sm text-[var(--muted-fg)]">
        Votre compte a été suspendu par un administrateur. Contactez le support si vous pensez qu'il s'agit d'une erreur.
      </p>
      <button onClick={logout} className="btn-primary">Se déconnecter</button>
    </div>
  )
}

function Root() {
  const { authLoading, isSuspended, role } = useApp()

  if (authLoading) return <SplashScreen />
  if (isSuspended) return <SuspendedScreen />

  if (role === ROLES.ADMIN)   return <AdminApp />
  if (role === ROLES.VENDEUR) return <VendorApp />
  return <ClientApp />
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}
