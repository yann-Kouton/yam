import { motion } from 'framer-motion'
import { where } from 'firebase/firestore'
import { Package, ShoppingBag, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { fadeUp, PRODUCT_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { StatGridSkeleton } from '../ui/Skeleton'

export function VendorDashboard() {
  const { user, userDoc } = useApp()
  const { data: myProducts, loading: loadingP } = useFirestoreCollection('products', user ? [where('vendorId', '==', user.uid)] : [])
  const { data: myOrders, loading: loadingO } = useFirestoreCollection('orders', user ? [where('vendorIds', 'array-contains', user.uid)] : [])

  const pending  = myProducts.filter(p => p.status === PRODUCT_STATUS.PENDING).length
  const approved = myProducts.filter(p => !p.status || p.status === PRODUCT_STATUS.APPROVED).length
  const revenue  = myOrders.reduce((s, o) => s + (o.items || []).filter(i => i.vendorId === user?.uid).reduce((s2, i) => s2 + i.price * i.qty, 0), 0)

  const stats = [
    { label: 'Produits en ligne', value: approved, icon: CheckCircle2, color: 'var(--secondary)' },
    { label: 'En attente d\'approbation', value: pending, icon: Clock, color: 'var(--primary)' },
    { label: 'Commandes reçues', value: myOrders.length, icon: ShoppingBag, color: '#8B5CF6' },
    { label: 'Chiffre d\'affaires', value: revenue.toLocaleString() + ' F', icon: TrendingUp, color: '#EC4899' },
  ]

  if (loadingP || loadingO) return <><Header title="tableau de bord" /><div className="px-4 py-4"><StatGridSkeleton /></div></>

  return (
    <motion.div {...fadeUp} key="vendor-dashboard">
      <Header title="tableau de bord" />
      <div className="px-4 py-4">
        <div className="card p-4 mb-4">
          <p className="text-xs text-[var(--muted-fg)]">Bienvenue,</p>
          <p className="font-heading font-bold text-lg">{userDoc?.displayName || 'Vendeur'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className="card p-4 flex flex-col gap-2">
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
              <p className="font-heading font-black text-xl">{s.value}</p>
              <p className="text-xs text-[var(--muted-fg)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
