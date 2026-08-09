import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { where } from 'firebase/firestore'
import { LayoutDashboard, Package, AlertTriangle, Users, User, Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { BottomNav } from '../ui/BottomNav'
import { Toast } from '../ui/Toast'
import { RoleProfile } from '../ui/RoleProfile'
import { PRODUCT_STATUS, REPORT_STATUS } from '../constants'
import { AdminDashboard } from './AdminDashboard'
import { AdminProducts } from './AdminProducts'
import { AdminReports } from './AdminReports'
import { AdminUsers } from './AdminUsers'
import { AdminNotifications } from './AdminNotifications'

export function AdminApp() {
  const { toast } = useApp()
  const [page, setPage] = useState('dashboard')

  const { data: pendingProducts } = useFirestoreCollection('products', [where('status', '==', PRODUCT_STATUS.PENDING)])
  const { data: openReports }     = useFirestoreCollection('reports',  [where('status', '==', REPORT_STATUS.OPEN)])

  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'produits',      label: 'Produits',      icon: Package, badge: pendingProducts.length },
    { id: 'signalements',  label: 'Signalements',  icon: AlertTriangle, badge: openReports.length },
    { id: 'utilisateurs',  label: 'Utilisateurs',  icon: Users },
    { id: 'notifications', label: 'Diffusion',     icon: Megaphone },
    { id: 'profil',        label: 'Profil',        icon: User },
  ]

  const pageComponents = {
    dashboard:     <AdminDashboard setPage={setPage} />,
    produits:      <AdminProducts />,
    signalements:  <AdminReports />,
    utilisateurs:  <AdminUsers />,
    notifications: <AdminNotifications />,
    profil:        <RoleProfile />,
  }

  return (
    <div className="app-shell">
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
