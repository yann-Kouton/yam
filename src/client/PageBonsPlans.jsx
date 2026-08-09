import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Tag, Flame, Clock, MapPin, Check, ArrowUpDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp } from '../constants'
import { cloudImg } from '../lib/firebase'
import { Header } from '../ui/Header'
import { SurplusCardSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { StarRating } from '../ui/StarRating'

export function PageBonsPlans() {
  return (
    <motion.div {...fadeUp} key="bons-plans">
      <Header title="surplus" />
      <PanelSurplus />
    </motion.div>
  )
}

function PanelSurplus() {
  const { surplusDeals, loading } = useApp()
  const { addToCart, showToast } = useApp()
  const [filter, setFilter] = useState('Tous')
  const [sort, setSort]     = useState('discount')

  const types = ['Tous', ...new Set((surplusDeals||[]).map(d => d.vendorType).filter(Boolean))]
  const sorts = { discount:'Meilleures remises', price:'Prix croissant', time:'Collecte bientôt' }
  const sortKeys = Object.keys(sorts)

  const filtered = (surplusDeals||[])
    .filter(d => filter === 'Tous' || d.vendorType === filter)
    .sort((a,b) => sort === 'discount' ? b.discount - a.discount : sort === 'price' ? a.surplusPrice - b.surplusPrice : (a.pickupStart||'').localeCompare(b.pickupStart||''))

  const reserve = (deal) => {
    if (!deal.remainingCount) { showToast('Plus de disponibilités !', 'error'); return }
    addToCart({ id:'surplus_'+deal.id, name:'Surplus '+deal.vendorName, price:deal.surplusPrice, imageUrl:deal.imageUrl, unit:'/panier' })
    showToast(`Réservé chez ${deal.vendorName} ! ${deal.pickupStart}–${deal.pickupEnd}`, 'success')
  }

  return (
    <motion.div {...fadeUp} className="px-4 py-4 flex flex-col gap-4 pb-8">
      <div className="bg-[var(--secondary-light)] border border-[var(--secondary)]/20 rounded-2xl p-3 flex gap-3">
        <Leaf className="w-6 h-6 text-[var(--secondary)] shrink-0" />
        <div>
          <p className="font-bold text-sm text-[var(--secondary)]">Anti-gaspillage alimentaire</p>
          <p className="text-xs text-[var(--muted-fg)]">Sauvez des repas délicieux à prix réduit à Abidjan</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {types.map(t => <button key={t} onClick={() => setFilter(t)} className={`pill flex-shrink-0 ${filter===t?'active-green':''}`}>{t}</button>)}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted-fg)]">{filtered.length} offre{filtered.length>1?'s':''}</p>
        <button onClick={() => setSort(sortKeys[(sortKeys.indexOf(sort)+1)%sortKeys.length])}
          className="flex items-center gap-1 text-xs font-bold text-[var(--secondary)]">
          <ArrowUpDown className="w-3 h-3" />
          {sorts[sort]}
        </button>
      </div>

      {loading ? <SurplusCardSkeleton count={3} /> : filtered.length === 0 ? (
        <EmptyState icon={Leaf} title="Aucune offre" desc="Aucune offre pour ce type" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((deal, i) => {
            const imgSrc = deal.cloudinaryId ? cloudImg(deal.cloudinaryId) : (deal.imageUrl || 'https://placehold.co/400x200/E8F7EF/2FA761?text=Surplus')
            return (
              <motion.div key={deal.id} className="surplus-card"
                initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay: i*.05}}>
                <div className="relative">
                  <img src={imgSrc} alt={deal.vendorName} className="w-full h-40 object-cover" loading="lazy" />
                  <span className="absolute top-2 left-2 bg-[var(--secondary)] text-white text-xs font-black px-2 py-1 rounded-full">-{deal.discount}%</span>
                  <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${deal.remainingCount<=2?'bg-red-500':'bg-black/50'}`}>
                    {deal.remainingCount<=2 && <Flame className="w-3 h-3" />}{deal.remainingCount} restant{deal.remainingCount>1?'s':''}
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-heading font-bold text-sm">{deal.vendorName}</p>
                      <p className="text-xs text-[var(--muted-fg)]">{deal.vendorType} · {deal.zone}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={deal.rating} />
                      <span className="text-xs text-[var(--muted-fg)]">{deal.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(deal.tags||[]).map(tag => (
                      <span key={tag} className="text-[.6rem] font-semibold bg-[var(--secondary-light)] text-[var(--secondary)] px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-fg)] mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {deal.pickupStart}–{deal.pickupEnd}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {deal.zone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="line-through text-xs text-gray-400 mr-2">{Number(deal.originalPrice).toLocaleString()} FCFA</span>
                      <span className="font-heading font-black text-[var(--secondary)] text-base">{Number(deal.surplusPrice).toLocaleString()} FCFA</span>
                    </div>
                    <motion.button whileTap={{scale:.92}} onClick={() => reserve(deal)}
                      className="bg-[var(--secondary)] text-white font-bold text-xs px-4 py-2 rounded-xl">
                      Réserver
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function PanelPromos() {
  const CODES = [
    { code:'BIENVENUE',  desc:'25% de réduction sur votre première commande', value:'-25%',  color:'var(--primary)' },
    { code:'YAMARCHE10', desc:'10% sur toute la boutique',                     value:'-10%',  color:'var(--secondary)' },
    { code:'SURPLUS500', desc:'500 FCFA de réduction sur le surplus',          value:'-500F', color:'#8B5CF6' },
    { code:'CADEAU1000', desc:'1 000 FCFA offerts dès 15 000 FCFA d\'achat',   value:'-1000F',color:'#EC4899' },
  ]
  const [copied, setCopied] = useState(null)
  const copy = (code) => {
    navigator.clipboard?.writeText(code).catch(()=>{})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }
  return (
    <motion.div {...fadeUp} className="px-4 py-4 flex flex-col gap-3 pb-8">
      {CODES.map((c, i) => (
        <motion.div key={c.code} className="card p-4 flex items-center gap-3"
          initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*.06}}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-white text-xs text-center leading-tight"
            style={{ background: c.color }}>{c.value}</div>
          <div className="flex-1">
            <p className="font-heading font-bold text-sm">{c.code}</p>
            <p className="text-xs text-[var(--muted-fg)]">{c.desc}</p>
          </div>
          <motion.button whileTap={{scale:.9}} onClick={() => copy(c.code)}
            className="text-xs font-bold border-2 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            style={{ borderColor: c.color, color: copied===c.code ? 'white' : c.color, background: copied===c.code ? c.color : 'transparent' }}>
            {copied === c.code ? <><Check className="w-3.5 h-3.5" /> Copié</> : 'Copier'}
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  )
}
