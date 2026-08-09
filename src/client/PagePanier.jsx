import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp, PROMO_CODES } from '../constants'
import { cloudImg } from '../lib/firebase'
import { Header } from '../ui/Header'
import { EmptyState } from '../ui/EmptyState'
import { CheckoutModal } from './CheckoutModal'

export function PagePanier({ setPage }) {
  const { cart, updateCart, removeFromCart, showToast } = useApp()
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const items = Object.values(cart)
  const subtotal = items.reduce((s, item) => s + item.price * item.qty, 0)
  const packagingFee = 200
  const promoDiscount = promoApplied ? (promoApplied.type === 'percent' ? Math.round(subtotal * promoApplied.value / 100) : promoApplied.value) : 0
  const total = Math.max(0, subtotal + packagingFee - promoDiscount)

  const applyPromo = () => {
    const code = PROMO_CODES[promoCode.toUpperCase()]
    if (code) { setPromoApplied(code); showToast('Code promo appliqué !', 'success') }
    else showToast('Code promo invalide', 'error')
  }

  if (items.length === 0) return (
    <motion.div {...fadeUp} key="panier-empty">
      <Header title="panier" />
      <EmptyState icon={ShoppingCart} title="Panier vide" desc="Ajoutez des produits depuis le marché" action="Aller au marché" onAction={() => setPage('marche')} />
    </motion.div>
  )

  return (
    <motion.div {...fadeUp} key="panier">
      <Header title="panier" rightAction={
        <button onClick={() => { Object.keys(cart).forEach(k => removeFromCart(k)); showToast('Panier vidé', 'info') }} className="text-xs text-red-400 font-semibold">Vider</button>
      } />
      <div className="px-4 py-3 flex flex-col gap-3 pb-36">
        <AnimatePresence>
          {items.map(item => (
            <motion.div key={item.id} layout className="card p-3 flex gap-3"
              exit={{ opacity:0, x:-100, height:0 }} transition={{ duration:.25 }}>
              <img src={item.imageUrl || item.cloudinaryId ? cloudImg(item.cloudinaryId||'') : 'https://placehold.co/80x80/F9F4ED/E77E23?text=P'}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt={item.name} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-[var(--muted-fg)]">{item.unit}</p>
                <p className="font-heading font-black text-[var(--primary)] text-sm mt-1">{Number(item.price).toLocaleString()} FCFA</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCart(item.id, -1)} className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center font-bold">−</button>
                  <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateCart(item.id, 1)} className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Code promo */}
        <div className="card p-3 flex gap-2">
          <input className="flex-1 text-sm bg-transparent outline-none border-none" placeholder="Code promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
          <button onClick={applyPromo} className="bg-[var(--primary)] text-white text-xs font-bold px-4 py-2 rounded-xl">Appliquer</button>
        </div>

        {/* Récap */}
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm"><span className="text-[var(--muted-fg)]">Sous-total</span><span className="font-semibold">{subtotal.toLocaleString()} FCFA</span></div>
          <div className="flex justify-between text-sm"><span className="text-[var(--muted-fg)]">Emballage</span><span className="font-semibold">{packagingFee} FCFA</span></div>
          {promoDiscount > 0 && <div className="flex justify-between text-sm text-[var(--secondary)]"><span>Promo ({promoCode})</span><span>-{promoDiscount.toLocaleString()} FCFA</span></div>}
          <div className="border-t border-[var(--border)] pt-2 flex justify-between"><span className="font-heading font-bold">Total</span><span className="font-heading font-black text-[var(--primary)] text-lg">{total.toLocaleString()} FCFA</span></div>
        </div>
      </div>

      {/* CTA Commander */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 py-3 bg-[var(--bg)]/90 backdrop-blur">
        {total < 5000 ? (
          <p className="text-center text-xs text-[var(--muted-fg)] mb-2">Minimum de commande : 5 000 FCFA (manque {(5000-total).toLocaleString()} FCFA)</p>
        ) : null}
        <motion.button whileTap={{scale:.97}} onClick={() => setCheckoutOpen(true)} disabled={total < 5000}
          className="btn-primary disabled:opacity-50">
          Commander · {total.toLocaleString()} FCFA
        </motion.button>
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} total={total} />
    </motion.div>
  )
}
