import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Package, Leaf, ShoppingBag, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BottomNav } from '../ui/BottomNav'
import { AppHeader } from '../ui/AppHeader'
import { Toast } from '../ui/Toast'
import { RoleProfile } from '../ui/RoleProfile'
import { VendorDashboard } from './VendorDashboard'
import { VendorProducts } from './VendorProducts'
import { VendorSurplus } from './VendorSurplus'
import { VendorOrders } from './VendorOrders'

export function VendorApp() {
  const { toast } = useApp()
  const [page, setPage] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produits',  label: 'Produits',   icon: Package },
    { id: 'surplus',   label: 'Surplus',    icon: Leaf },
    { id: 'commandes', label: 'Commandes',  icon: ShoppingBag },
    { id: 'profil',    label: 'Profil',     icon: User },
  ]

  const pageComponents = {
    dashboard: <VendorDashboard />,
    produits:  <VendorProducts />,
    surplus:   <VendorSurplus />,
    commandes: <VendorOrders />,
    profil:    <RoleProfile />,
  }

  return (
    <div className="app-shell">
      {/* Navbar supérieure — logo + notifications (commandes, produits modérés...) */}
      <AppHeader />

      <div className="page-content">
        <AnimatePresence mode="wait">
          <div key={page}>{pageComponents[page]}</div>
        </AnimatePresence>
      </div>
      <BottomNav page={page} setPage={setPage} items={navItems} />
      <Toast toast={toast} />
    </div>
  )
}
