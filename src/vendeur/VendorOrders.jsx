import { where } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

export function VendorOrders() {
  const { user } = useApp()
  const { data: orders, loading } = useFirestoreCollection('orders', user ? [where('vendorIds', 'array-contains', user.uid)] : [])

  return (
    <motion.div {...fadeUp} key="vendor-orders">
      <Header title="commandes reçues" />
      <div className="px-4 py-4">
        {loading ? <RowListSkeleton count={4} lines={3} /> : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Aucune commande" desc="Les commandes contenant vos produits apparaîtront ici" />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(o => {
              const myItems = (o.items || []).filter(i => i.vendorId === user.uid)
              const myTotal = myItems.reduce((s, i) => s + i.price * i.qty, 0)
              return (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-heading font-bold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                    <span className="text-[.65rem] font-bold uppercase px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-fg)]">{o.status}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-fg)] mb-2">{o.customerName} · {o.zone}</p>
                  <div className="flex flex-col gap-1 mb-2">
                    {myItems.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{i.qty}× {i.name}</span>
                        <span className="font-semibold">{(i.price*i.qty).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-bold">
                    <span>Total (vos produits)</span>
                    <span className="text-[var(--primary)]">{myTotal.toLocaleString()} FCFA</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
