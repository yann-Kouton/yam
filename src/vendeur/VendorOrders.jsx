import { useState } from 'react'
import { where, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { ShoppingBag, ChevronRight, XCircle, MapPin, Phone, Banknote, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { fadeUp, ORDER_STATUS, ORDER_STATUS_FLOW } from '../constants'
import { db } from '../lib/firebase'
import { notifyUsers } from '../lib/notifications'
import { Header } from '../ui/Header'
import { StatusPill } from '../ui/StatusPill'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { BottomSheet } from '../ui/BottomSheet'

const PAYMENT_LABELS = {
  orange: 'Orange Money',
  mtn: 'MTN Mobile Money',
  moov: 'Moov Money',
  wave: 'Wave',
  cash: 'Paiement à la livraison',
}

function formatOrderDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ORDER_TABS = [
  { id: 'encours',    label: 'En cours',   statuses: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.READY] },
  { id: 'historique', label: 'Historique', statuses: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] },
]

// ── Détail complet d'une commande (BottomSheet) ───────────
function OrderDetailSheet({ order, vendorUid, onClose }) {
  const myItems = order ? (order.items || []).filter(i => i.vendorId === vendorUid) : []
  const myTotal = myItems.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <BottomSheet
      open={!!order}
      onClose={onClose}
      title={order ? `Commande #${order.id.slice(0, 8).toUpperCase()}` : ''}
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>{formatOrderDate(order.createdAt)}</span>
            <StatusPill status={order.status} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>Vos articles</p>
            {myItems.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{i.qty}× {i.name}</span>
                <span className="font-semibold">{(i.price * i.qty).toLocaleString()} F</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span>Total (vos produits)</span>
              <span style={{ color: 'var(--primary)' }}>{myTotal.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>Client</p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{order.zone}{order.address ? ` — ${order.address}` : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{order.customerName} · {order.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Banknote className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-fg)' }} />
              <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

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
  const [tab, setTab] = useState('encours')
  const [selected, setSelected] = useState(null)

  const sorted = [...orders].sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
    return tb - ta
  })
  const activeTab = ORDER_TABS.find(t => t.id === tab)
  const visibleOrders = sorted.filter(o => activeTab.statuses.includes(o.status))

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
        {/* Onglets En cours / Historique */}
        <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1 mb-4">
          {ORDER_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <RowListSkeleton count={4} lines={3} /> : visibleOrders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Aucune commande" desc={
            tab === 'encours'
              ? 'Les commandes contenant vos produits apparaîtront ici'
              : 'Vos commandes livrées ou annulées apparaîtront ici'
          } />
        ) : (
          <div className="flex flex-col gap-3">
            {visibleOrders.map(o => {
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
                  <button onClick={() => setSelected(o)}
                    className="flex items-center gap-1 text-xs text-[var(--muted-fg)] mb-2">
                    <span className="underline decoration-dotted">{o.customerName} · {o.zone}</span>
                    <Info className="w-3 h-3 flex-shrink-0" />
                  </button>
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

      <OrderDetailSheet order={selected} vendorUid={user?.uid} onClose={() => setSelected(null)} />
    </motion.div>
  )
}
