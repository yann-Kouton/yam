import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cloudImg } from '../lib/firebase'
import { ReportButton } from './ReportButton'

export function ProductCard({ product: p, index = 0 }) {
  const { addToCart, showToast } = useApp()
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    setAdding(true)
    addToCart(p)
    showToast(`${p.name} ajouté au panier`, 'success')
    setTimeout(() => setAdding(false), 600)
  }

  const imgSrc = p.cloudinaryId
    ? cloudImg(p.cloudinaryId)
    : (p.imageUrl || 'https://placehold.co/400x300/F9F4ED/E77E23?text=Produit')

  return (
    <motion.div className="product-card"
      initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay: index * .06}}
      whileTap={{ scale: .97 }}>
      <div className="relative overflow-hidden">
        <img src={imgSrc} alt={p.name} className="w-full h-36 object-cover" loading="lazy" />
        {p.badge && (
          <span className="absolute top-2 left-2 bg-[var(--primary)] text-white text-[.6rem] font-black px-2 py-0.5 rounded-full">{p.badge}</span>
        )}
        {p.isOrganic && (
          <span className="absolute top-2 right-2 bg-[var(--secondary)] text-white text-[.6rem] font-black px-2 py-0.5 rounded-full">BIO</span>
        )}
        <ReportButton type="product" targetId={p.id} targetLabel={p.name} className="absolute bottom-2 right-2 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center" />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight mb-0.5 line-clamp-1">{p.name}</p>
        <p className="text-xs text-[var(--muted-fg)] mb-2">{p.unit || 'kg'}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-heading font-black text-[var(--primary)] text-base">{Number(p.price).toLocaleString()}</span>
            <span className="text-xs text-[var(--muted-fg)]"> FCFA</span>
          </div>
          <motion.button onClick={handleAdd}
            animate={{ scale: adding ? 1.2 : 1 }}
            className="w-8 h-8 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
