import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { CheckCircle2, PartyPopper, Check, Banknote, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeIn, slideUp, ZONES_LIVRAISON } from '../constants'
import { db } from '../lib/firebase'
import { notifyUsers, notifyAdmins } from '../lib/notifications'

export function CheckoutModal({ open, onClose, total }) {
  const { user, cart, removeFromCart, showToast } = useApp()
  const [step, setStep]     = useState(0)
  const [zone, setZone]     = useState(null)
  const [payment, setPayment] = useState('orange')
  const [form, setForm]     = useState({ name:'', phone:'', address:'' })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const deliveryFee = zone?.price || 0
  const grandTotal  = total + deliveryFee + (payment === 'cash' ? 200 : 0)

  const submitOrder = async () => {
    if (!form.name || !form.phone || !zone) { showToast('Remplis tous les champs', 'warning'); return }
    setLoading(true)
    try {
      const items = Object.values(cart)
      const vendorIds = [...new Set(items.map(i => i.vendorId).filter(Boolean))]
      const ref = await addDoc(collection(db, 'orders'), {
        userId:      user?.uid || 'guest',
        customerName: form.name,
        phone:        form.phone,
        address:      form.address,
        zone:         zone.label,
        deliveryFee,
        paymentMethod: payment,
        items,
        vendorIds,
        total:        grandTotal,
        status:       'pending',
        createdAt:    serverTimestamp(),
      })
      const shortId = ref.id.slice(0,8).toUpperCase()
      setOrderId(shortId)

      // Notifie les vendeurs concernés et les admins de la nouvelle commande
      notifyUsers(vendorIds, {
        type: 'order',
        title: 'Nouvelle commande reçue 🛒',
        desc: `Commande #${shortId} · ${form.name} · ${zone.label}`,
        meta: { orderId: ref.id },
      })
      notifyAdmins({
        type: 'order',
        title: 'Nouvelle commande 🛒',
        desc: `#${shortId} · ${grandTotal.toLocaleString()} FCFA · ${zone.label}`,
        meta: { orderId: ref.id },
      })

      Object.keys(cart).forEach(k => removeFromCart(k))
      setConfirmed(true)
    } catch (e) {
      showToast('Erreur : ' + e.message, 'error')
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" {...fadeIn}>
          <motion.div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90dvh] overflow-y-auto" {...slideUp}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-heading font-bold text-base flex items-center gap-1.5">
                {confirmed && <CheckCircle2 className="w-4 h-4 text-[var(--secondary)]" />}
                {confirmed ? 'Commande confirmée' : step === 0 ? 'Livraison' : 'Paiement'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {confirmed ? (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:300,damping:15}}>
                  <PartyPopper className="w-16 h-16 text-[var(--primary)]" />
                </motion.div>
                <h3 className="font-heading font-black text-xl">Merci !</h3>
                <p className="text-[var(--muted-fg)] text-sm">Votre commande <span className="font-bold text-[var(--primary)]">#{orderId}</span> a été reçue</p>
                <p className="text-xs text-[var(--muted-fg)]">Vous serez contacté pour la livraison</p>
                <button onClick={onClose} className="btn-primary mt-2">Retour à l'accueil</button>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4 pb-8">
                {step === 0 ? (
                  <>
                    <div className="flex flex-col gap-3">
                      <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                        placeholder="Nom complet *" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                      <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                        placeholder="Téléphone *" type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
                      <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)] resize-none"
                        placeholder="Adresse précise" rows={2} value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
                    </div>
                    <p className="font-heading font-bold text-sm">Zone de livraison</p>
                    <div className="flex flex-col gap-2">
                      {ZONES_LIVRAISON.map(z => (
                        <button key={z.label} onClick={() => setZone(z)}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${zone?.label===z.label ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)]'}`}>
                          <span className="text-sm font-semibold">{z.label}</span>
                          <span className="text-sm font-bold text-[var(--primary)]">{z.price} FCFA</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(1)} disabled={!zone || !form.name || !form.phone}
                      className="btn-primary disabled:opacity-50">Continuer</button>
                  </>
                ) : (
                  <>
                    <p className="font-heading font-bold text-sm">Mode de paiement</p>
                    <div className="flex flex-col gap-2">
                      {[
                        {id:'orange',label:'Orange Money',dot:'#FF7900'},
                        {id:'mtn',label:'MTN MoMo',dot:'#FFCC00'},
                        {id:'wave',label:'Wave',dot:'#1DC8E8'},
                        {id:'cash',label:'Cash à la livraison +200F',icon:Banknote},
                      ].map(m => (
                        <button key={m.id} onClick={() => setPayment(m.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${payment===m.id ? 'border-[var(--secondary)] bg-[var(--secondary-light)]' : 'border-[var(--border)]'}`}>
                          {m.icon
                            ? <m.icon className="w-5 h-5 text-[var(--muted-fg)]" />
                            : <span className="w-4 h-4 rounded-full" style={{ background: m.dot }} />}
                          <span className="font-semibold text-sm flex-1 text-left">{m.label}</span>
                          {payment === m.id && <span className="w-5 h-5 bg-[var(--secondary)] rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></span>}
                        </button>
                      ))}
                    </div>
                    <div className="card p-4 bg-[var(--muted)]">
                      <div className="flex justify-between text-sm mb-1"><span className="text-[var(--muted-fg)]">Produits</span><span>{total.toLocaleString()} FCFA</span></div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-[var(--muted-fg)]">Livraison</span><span>{deliveryFee} FCFA</span></div>
                      {payment==='cash' && <div className="flex justify-between text-sm mb-1 text-orange-500"><span>Supplément cash</span><span>+200 FCFA</span></div>}
                      <div className="flex justify-between font-heading font-black text-base pt-2 border-t border-[var(--border)] mt-2">
                        <span>Total</span><span className="text-[var(--primary)]">{grandTotal.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border-2 border-[var(--border)] font-bold text-sm">Retour</button>
                      <motion.button whileTap={{scale:.97}} onClick={submitOrder} disabled={loading}
                        className="flex-2 btn-primary flex-1 disabled:opacity-70">
                        {loading ? <><div className="spinner w-4 h-4 border-white border-t-transparent" />Envoi...</> : 'Confirmer'}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
