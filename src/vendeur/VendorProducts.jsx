import { useState } from 'react'
import { motion } from 'framer-motion'
import { where } from 'firebase/firestore'
import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp } from 'firebase/firestore'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { db, cloudImg } from '../lib/firebase'
import { fadeUp, PRODUCT_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { StatusPill } from '../ui/StatusPill'
import { BottomSheet } from '../ui/BottomSheet'
import { ImageUploadField } from '../ui/ImageUploadField'

const CATEGORIES = ['Légumes','Fruits','Viandes','Poissons','Céréales','Épices','Boissons','Produits laitiers','Tubercules','Huiles']
const EMPTY_FORM = { name:'', price:'', unit:'kg', category: CATEGORIES[0], description:'', imageUrl:'', cloudinaryId:'' }

export function VendorProducts() {
  const { user, userDoc, showToast } = useApp()
  const { data: myProducts, loading } = useFirestoreCollection('products', user ? [where('vendorId', '==', user.uid)] : [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setSheetOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name:p.name||'', price:p.price||'', unit:p.unit||'kg', category:p.category||CATEGORIES[0], description:p.description||'', imageUrl:p.imageUrl||'', cloudinaryId:p.cloudinaryId||'' }); setSheetOpen(true) }

  const save = async () => {
    if (!form.name || !form.price) { showToast('Nom et prix requis', 'warning'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        vendorId: user.uid,
        vendorName: userDoc?.displayName || 'Vendeur',
        status: PRODUCT_STATUS.PENDING, // toute création/modification repasse en modération
      }
      if (editing) {
        await updateDoc(doc(db, 'products', editing.id), payload)
        showToast('Produit mis à jour, en attente de validation', 'success')
      } else {
        await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() })
        showToast('Produit envoyé pour validation', 'success')
      }
      setSheetOpen(false)
    } catch (e) {
      showToast(e.message, 'error')
    }
    setSaving(false)
  }

  const remove = async (p) => {
    try {
      await deleteDoc(doc(db, 'products', p.id))
      showToast('Produit supprimé', 'info')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <motion.div {...fadeUp} key="vendor-products">
      <Header title="mes produits" rightAction={
        <button onClick={openCreate} className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      } />

      <div className="px-4 py-4">
        {loading ? <RowListSkeleton count={4} withThumb lines={2} /> : myProducts.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" desc="Ajoutez votre premier produit" action="Ajouter un produit" onAction={openCreate} />
        ) : (
          <div className="flex flex-col gap-3">
            {myProducts.map(p => (
              <div key={p.id} className="card p-3 flex items-center gap-3">
                <img src={p.cloudinaryId ? cloudImg(p.cloudinaryId, 'w_128,q_auto,f_auto') : (p.imageUrl || 'https://placehold.co/64x64/F9F4ED/E77E23?text=P')} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-[var(--muted-fg)]">{Number(p.price).toLocaleString()} FCFA / {p.unit}</p>
                  <div className="mt-1"><StatusPill status={p.status || 'approved'} /></div>
                  {p.status === 'rejected' && p.rejectionReason && (
                    <p className="text-[.65rem] text-red-500 mt-1">{p.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(p)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Modifier le produit' : 'Nouveau produit'}>
        <div className="flex flex-col gap-3">
          <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Nom du produit" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          <div className="flex gap-2">
            <input type="number" className="flex-1 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="Prix (FCFA)" value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
            <input className="w-24 border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="Unité" value={form.unit} onChange={e => setForm({...form, unit:e.target.value})} />
          </div>
          <select className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ImageUploadField
            label="Photo du produit"
            cloudinaryId={form.cloudinaryId}
            imageUrl={form.imageUrl}
            folder="yamarche/products"
            onUploaded={(publicId) => setForm({ ...form, cloudinaryId: publicId, imageUrl: '' })}
            onRemove={() => setForm({ ...form, cloudinaryId: '', imageUrl: '' })}
          />
          <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)] resize-none"
            placeholder="Description" rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          <p className="text-xs text-[var(--muted-fg)]">Chaque ajout ou modification repasse par une validation admin avant d'être visible des clients.</p>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-70">
            {saving ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : 'Enregistrer'}
          </button>
        </div>
      </BottomSheet>
    </motion.div>
  )
}
