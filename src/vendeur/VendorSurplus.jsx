import { useState } from 'react'
import { motion } from 'framer-motion'
import { where } from 'firebase/firestore'
import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp } from 'firebase/firestore'
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { db, cloudImg } from '../lib/firebase'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { BottomSheet } from '../ui/BottomSheet'
import { ImageUploadField } from '../ui/ImageUploadField'

const EMPTY_FORM = { vendorType:'', zone:'', originalPrice:'', surplusPrice:'', remainingCount:5, pickupStart:'18:00', pickupEnd:'20:00', description:'', imageUrl:'', cloudinaryId:'' }

export function VendorSurplus() {
  const { user, userDoc, showToast } = useApp()
  const { data: myDeals, loading } = useFirestoreCollection('surplusDeals', user ? [where('vendorId', '==', user.uid)] : [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setSheetOpen(true) }
  const openEdit = (d) => { setEditing(d); setForm({
    vendorType: d.vendorType||'', zone: d.zone||'', originalPrice: d.originalPrice||'', surplusPrice: d.surplusPrice||'',
    remainingCount: d.remainingCount||5, pickupStart: d.pickupStart||'18:00', pickupEnd: d.pickupEnd||'20:00',
    description: d.description||'', imageUrl: d.imageUrl||'', cloudinaryId: d.cloudinaryId||'',
  }); setSheetOpen(true) }

  const save = async () => {
    if (!form.zone || !form.originalPrice || !form.surplusPrice) { showToast('Zone et prix requis', 'warning'); return }
    setSaving(true)
    try {
      const original = Number(form.originalPrice), surplus = Number(form.surplusPrice)
      const discount = original > 0 ? Math.round((1 - surplus/original) * 100) : 0
      const payload = {
        ...form,
        originalPrice: original, surplusPrice: surplus, discount,
        remainingCount: Number(form.remainingCount),
        vendorId: user.uid,
        vendorName: userDoc?.displayName || 'Vendeur',
        active: true,
        rating: editing?.rating || 4.5,
        tags: editing?.tags || [],
      }
      if (editing) {
        await updateDoc(doc(db, 'surplusDeals', editing.id), payload)
        showToast('Offre mise à jour', 'success')
      } else {
        await addDoc(collection(db, 'surplusDeals'), { ...payload, createdAt: serverTimestamp() })
        showToast('Offre publiée', 'success')
      }
      setSheetOpen(false)
    } catch (e) {
      showToast(e.message, 'error')
    }
    setSaving(false)
  }

  const remove = async (d) => {
    try {
      await deleteDoc(doc(db, 'surplusDeals', d.id))
      showToast('Offre supprimée', 'info')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <motion.div {...fadeUp} key="vendor-surplus">
      <Header title="mes offres surplus" rightAction={
        <button onClick={openCreate} className="w-9 h-9 rounded-xl bg-[var(--secondary)] text-white flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      } />

      <div className="px-4 py-4">
        {loading ? <RowListSkeleton count={4} lines={3} /> : myDeals.length === 0 ? (
          <EmptyState icon={Leaf} title="Aucune offre" desc="Publiez vos surplus pour éviter le gaspillage" action="Créer une offre" onAction={openCreate} />
        ) : (
          <div className="flex flex-col gap-3">
            {myDeals.map(d => (
              <div key={d.id} className="card p-3 flex items-center gap-3">
                <img src={d.cloudinaryId ? cloudImg(d.cloudinaryId, 'w_128,q_auto,f_auto') : (d.imageUrl || 'https://placehold.co/64x64/E8F7EF/2FA761?text=S')} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt={d.zone} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.zone} · -{d.discount}%</p>
                  <p className="text-xs text-[var(--muted-fg)]">{Number(d.surplusPrice).toLocaleString()} FCFA · {d.remainingCount} restants</p>
                  <p className="text-xs text-[var(--muted-fg)]">{d.pickupStart}–{d.pickupEnd}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(d)} className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(d)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Modifier l\'offre' : 'Nouvelle offre surplus'}>
        <div className="flex flex-col gap-3">
          <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Type (restaurant, boulangerie...)" value={form.vendorType} onChange={e => setForm({...form, vendorType:e.target.value})} />
          <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Zone (ex: Cocody)" value={form.zone} onChange={e => setForm({...form, zone:e.target.value})} />
          <div className="flex gap-2">
            <input type="number" className="flex-1 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="Prix normal" value={form.originalPrice} onChange={e => setForm({...form, originalPrice:e.target.value})} />
            <input type="number" className="flex-1 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="Prix surplus" value={form.surplusPrice} onChange={e => setForm({...form, surplusPrice:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <input type="time" className="flex-1 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" value={form.pickupStart} onChange={e => setForm({...form, pickupStart:e.target.value})} />
            <input type="time" className="flex-1 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" value={form.pickupEnd} onChange={e => setForm({...form, pickupEnd:e.target.value})} />
          </div>
          <input type="number" className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Quantité disponible" value={form.remainingCount} onChange={e => setForm({...form, remainingCount:e.target.value})} />
          <ImageUploadField
            label="Photo de l'offre"
            cloudinaryId={form.cloudinaryId}
            imageUrl={form.imageUrl}
            folder="yamarche/surplus"
            onUploaded={(publicId) => setForm({ ...form, cloudinaryId: publicId, imageUrl: '' })}
            onRemove={() => setForm({ ...form, cloudinaryId: '', imageUrl: '' })}
          />
          <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)] resize-none"
            placeholder="Description" rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          <button onClick={save} disabled={saving} className="btn-primary btn-secondary disabled:opacity-70">
            {saving ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : 'Publier'}
          </button>
        </div>
      </BottomSheet>
    </motion.div>
  )
}
