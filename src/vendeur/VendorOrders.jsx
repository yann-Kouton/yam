import { useState } from 'react'
import { where, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { ShoppingBag, ChevronRight, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { fadeUp, ORDER_STATUS, ORDER_STATUS_FLOW } from '../constants'
import { db } from '../lib/firebase'
import { notifyUsers } from '../lib/notifications'
import { Header } from '../ui/Header'
import { StatusPill } from '../ui/StatusPill'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

const NEXT_STEP_LABEL = {
  [ORDER_STATUS.PENDING]:   'Confirmer la commande',
  [ORDER_STATUS.CONFIRMED]: 'Marquer prête',
  [ORDER_STATUS.READY]:     'Marquer livrée',
}

const NOTIF_FOR_STATUS = {
  [ORDER_STATUS.CONFIRMED]: (shortId) => ({ title: 'Commande confirmée ✅', desc: `Votre commande #${shortId} a été confirmée par le vendeur.` }),
  [ORDER_STATUS.READY]:     (shortId) => ({ title: 'Commande prête 📦', desc: `Votre commande #${shortId} est prête pour la livraison.` }),
  [ORDER_STATUS.DELIVERED]: (shortId) => ({ title: 'Commande livrée 🎉', desc: `Votre commande #${shortId} a été livrée. Bon appétit !` }),
  [ORDER_STATUS.CANCELLED]: (shortId) => ({ title: 'Commande annulée', desc: `Votre commande #${shortId} a été annulée par le vendeur.` }),
}

export function VendorOrders() {
  const { user, showToast } = useApp()
  const { data: orders, loading } = useFirestoreCollection('orders', user ? [where('vendorIds', 'array-contains', user.uid)] : [])
  const [updatingId, setUpdatingId] = useState(null)

  const updateStatus = async (order, nextStatus) => {
    setUpdatingId(order.id)
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: user.uid,
      })
      const shortId = order.id.slice(0, 8).toUpperCase()
      // Prévient le client (et lui seul) de l'évolution de sa commande.
      const notif = NOTIF_FOR_STATUS[nextStatus]
      if (notif && order.userId && order.userId !== 'guest') {
        notifyUsers([order.userId], { type: 'order', ...notif(shortId), meta: { orderId: order.id } })
      }
      showToast('Statut mis à jour', 'success')
    } catch (e) {
      showToast('Erreur : ' + e.message, 'error')
    }
    setUpdatingId(null)
  }

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
              const flowIdx = ORDER_STATUS_FLOW.indexOf(o.status)
              const nextStatus = flowIdx >= 0 ? ORDER_STATUS_FLOW[flowIdx + 1] : null
              const isFinal = o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.CANCELLED
              const isUpdating = updatingId === o.id

              return (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-heading font-bold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                    <StatusPill status={o.status} />
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
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-bold mb-3">
                    <span>Total (vos produits)</span>
                    <span className="text-[var(--primary)]">{myTotal.toLocaleString()} FCFA</span>
                  </div>

                  {!isFinal && (
                    <div className="flex gap-2">
                      {nextStatus && (
                        <motion.button whileTap={{ scale: 0.97 }} disabled={isUpdating}
                          onClick={() => updateStatus(o, nextStatus)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                          style={{ background: 'var(--secondary)' }}>
                          {isUpdating ? <div className="spinner w-3.5 h-3.5 border-white border-t-transparent" /> : (
                            <>{NEXT_STEP_LABEL[o.status]}<ChevronRight className="w-3.5 h-3.5" /></>
                          )}
                        </motion.button>
                      )}
                      <motion.button whileTap={{ scale: 0.97 }} disabled={isUpdating}
                        onClick={() => updateStatus(o, ORDER_STATUS.CANCELLED)}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                        <XCircle className="w-3.5 h-3.5" /> Annuler
                      </motion.button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
