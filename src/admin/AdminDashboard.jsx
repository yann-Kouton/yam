import { motion } from 'framer-motion'
import { where } from 'firebase/firestore'
import { Clock, AlertTriangle, Users, Store, Megaphone } from 'lucide-react'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { fadeUp, PRODUCT_STATUS, REPORT_STATUS, ROLES, VENDOR_REQUEST_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { StatGridSkeleton } from '../ui/Skeleton'

export function AdminDashboard({ setPage }) {
  const { data: pendingProducts, loading: l1 } = useFirestoreCollection('products', [where('status', '==', PRODUCT_STATUS.PENDING)])
  const { data: openReports,     loading: l2 } = useFirestoreCollection('reports',  [where('status', '==', REPORT_STATUS.OPEN)])
  const { data: pendingVendors,  loading: l3 } = useFirestoreCollection('users',    [where('vendorRequestStatus', '==', VENDOR_REQUEST_STATUS.PENDING)])
  const { data: allUsers,        loading: l4 } = useFirestoreCollection('users')

  if (l1 || l2 || l3 || l4) return <><Header title="admin" /><div className="px-4 py-4"><StatGridSkeleton /></div></>

  const cards = [
    { label: 'Produits à valider', value: pendingProducts.length, icon: Clock,      color: 'var(--primary)',   go: 'produits' },
    { label: 'Signalements ouverts', value: openReports.length,   icon: AlertTriangle, color: '#EF4444',       go: 'signalements' },
    { label: 'Demandes vendeur',   value: pendingVendors.length,  icon: Store,       color: 'var(--secondary)', go: 'utilisateurs' },
    { label: 'Utilisateurs',       value: allUsers.length,        icon: Users,       color: '#8B5CF6',          go: 'utilisateurs' },
  ]

  return (
    <motion.div {...fadeUp} key="admin-dashboard">
      <Header title="administration" />
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {cards.map(c => (
          <button key={c.label} onClick={() => setPage(c.go)} className="card p-4 flex flex-col gap-2 text-left">
            <c.icon className="w-5 h-5" style={{ color: c.color }} />
            <p className="font-heading font-black text-2xl">{c.value}</p>
            <p className="text-xs text-[var(--muted-fg)]">{c.label}</p>
          </button>
        ))}
        <button onClick={() => setPage('notifications')}
          className="card p-4 flex items-center gap-3 text-left col-span-2"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(99,102,241,0.03))' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Megaphone className="w-5 h-5" style={{ color: '#6366F1' }} />
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-sm">Diffuser une notification</p>
            <p className="text-xs text-[var(--muted-fg)]">À un, plusieurs, ou tous les utilisateurs</p>
          </div>
        </button>
      </div>
    </motion.div>
  )
}
