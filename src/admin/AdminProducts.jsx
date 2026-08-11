import { useState } from 'react'
import { motion } from 'framer-motion'
import { updateDoc, doc } from 'firebase/firestore'
import { CheckCircle2, XCircle, Package, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { db, cloudImg } from '../lib/firebase'
import { notifyUser } from '../lib/notifications'
import { fadeUp, PRODUCT_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { StatusPill } from '../ui/StatusPill'
import { BottomSheet } from '../ui/BottomSheet'

const TABS = [
  { id: PRODUCT_STATUS.PENDING,  label: 'En attente' },
  { id: PRODUCT_STATUS.APPROVED, label: 'Approuvés' },
  { id: PRODUCT_STATUS.REJECTED, label: 'Refusés' },
]

export function AdminProducts() {
  const { showToast } = useApp()
  const { data: allProducts, loading } = useFirestoreCollection('products')
  const [tab, setTab] = useState(PRODUCT_STATUS.PENDING)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [viewing, setViewing] = useState(null)

  const filtered = allProducts.filter(p => (p.status || PRODUCT_STATUS.APPROVED) === tab)

  const approve = async (p) => {
    try {
      await updateDoc(doc(db, 'products', p.id), { status: PRODUCT_STATUS.APPROVED, rejectionReason: '' })
      showToast(`${p.name} approuvé`, 'success')
      if (p.vendorId) {
        notifyUser(p.vendorId, {
          type: 'product',
          title: 'Produit approuvé ✅',
          desc: `« ${p.name} » est désormais visible dans le catalogue.`,
          meta: { productId: p.id },
        })
      }
    } catch (e) { showToast(e.message, 'error') }
  }

  const openReject = (p) => { setRejecting(p); setReason('') }
  const confirmReject = async () => {
    try {
      await updateDoc(doc(db, 'products', rejecting.id), { status: PRODUCT_STATUS.REJECTED, rejectionReason: reason })
      showToast(`${rejecting.name} refusé`, 'info')
      if (rejecting.vendorId) {
        notifyUser(rejecting.vendorId, {
          type: 'product',
          title: 'Produit refusé',
          desc: `« ${rejecting.name} » : ${reason || 'non conforme aux règles.'}`,
          meta: { productId: rejecting.id },
        })
      }
      setRejecting(null)
    } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <motion.div {...fadeUp} key="admin-products">
      <Header title="modération produits" />
      <div className="flex gap-2 px-4 pt-2 pb-3 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`pill flex-shrink-0 ${tab===t.id ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {loading ? <RowListSkeleton count={4} withThumb lines={2} /> : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Rien ici" desc="Aucun produit dans cette catégorie" />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(p => (
              <div key={p.id} role="button" tabIndex={0} onClick={() => setViewing(p)}
                onKeyDown={e => { if (e.key === 'Enter') setViewing(p) }}
                className="card p-3 flex items-center gap-3 text-left w-full cursor-pointer">
                <img src={p.cloudinaryId ? cloudImg(p.cloudinaryId, 'w_128,q_auto,f_auto') : (p.imageUrl || 'https://placehold.co/64x64/F9F4ED/E77E23?text=P')} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-[var(--muted-fg)]">{p.vendorName} · {Number(p.price).toLocaleString()} FCFA / {p.unit || 'unité'}</p>
                  {p.category && <p className="text-[.65rem] text-[var(--muted-fg)]">{p.category}</p>}
                  <div className="mt-1"><StatusPill status={p.status || 'approved'} /></div>
                </div>
                <Info className="w-4 h-4 text-[var(--muted-fg)] flex-shrink-0" />
                {tab === PRODUCT_STATUS.PENDING && (
                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => approve(p)} className="w-8 h-8 rounded-lg bg-[var(--secondary-light)] text-[var(--secondary)] flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => openReject(p)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><XCircle className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!rejecting} onClose={() => setRejecting(null)} title={`Refuser « ${rejecting?.name} »`}>
        <div className="flex flex-col gap-3">
          <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none resize-none"
            placeholder="Motif du refus (visible par le vendeur)" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={confirmReject} className="btn-primary bg-red-500">Confirmer le refus</button>
        </div>
      </BottomSheet>

      <BottomSheet open={!!viewing} onClose={() => setViewing(null)} title="Détail du produit">
        {viewing && (
          <div className="flex flex-col gap-4">
            <img src={viewing.cloudinaryId ? cloudImg(viewing.cloudinaryId, 'w_800,q_auto,f_auto') : (viewing.imageUrl || 'https://placehold.co/400x300/F9F4ED/E77E23?text=Produit')} className="w-full h-48 rounded-2xl object-cover" alt={viewing.name} />
            <div>
              <p className="font-heading font-bold text-lg">{viewing.name}</p>
              <div className="mt-1"><StatusPill status={viewing.status || 'approved'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)]">Vendeur</p><p className="font-semibold">{viewing.vendorName || '—'}</p></div>
              <div><p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)]">Catégorie</p><p className="font-semibold">{viewing.category || '—'}</p></div>
              <div><p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)]">Prix</p><p className="font-semibold">{Number(viewing.price).toLocaleString()} FCFA</p></div>
              <div><p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)]">Unité</p><p className="font-semibold">{viewing.unit || '—'}</p></div>
            </div>
            <div>
              <p className="text-[.65rem] uppercase font-bold text-[var(--muted-fg)] mb-1">Description</p>
              <p className="text-sm text-[var(--muted-fg)]">{viewing.description || 'Aucune description fournie.'}</p>
            </div>
            {viewing.rejectionReason && (
              <div>
                <p className="text-[.65rem] uppercase font-bold text-red-500 mb-1">Motif du refus</p>
                <p className="text-sm text-[var(--muted-fg)]">{viewing.rejectionReason}</p>
              </div>
            )}
            {(viewing.status || PRODUCT_STATUS.PENDING) === PRODUCT_STATUS.PENDING && (
              <div className="flex gap-3">
                <button onClick={() => { approve(viewing); setViewing(null) }} className="btn-primary flex-1 bg-[var(--secondary)] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approuver
                </button>
                <button onClick={() => { openReject(viewing); setViewing(null) }} className="btn-primary flex-1 bg-red-500 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Refuser
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </motion.div>
  )
}
