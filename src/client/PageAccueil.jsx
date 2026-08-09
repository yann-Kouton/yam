import { motion } from 'framer-motion'
import { Hand, Flame, Leaf, CalendarDays, Search, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp, catIcon } from '../constants'
import { ChipsSkeleton, ProductGridSkeleton } from '../ui/Skeleton'
import { SectionHeader } from '../ui/SectionHeader'
import { ProductCard } from './ProductCard'

export function PageAccueil({ setPage }) {
  const { user, products, loading } = useApp()

  const featured = products.filter(p => p.featured).slice(0, 5)
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <motion.div {...fadeUp} key="accueil" className="pb-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--dark)] to-[#2d5a3d] px-5 pt-12 pb-8">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}>
          <p className="text-white/70 text-sm mb-1 flex items-center gap-1.5">
            Bonjour {user?.displayName?.split(' ')[0] || 'chez vous'} <Hand className="w-4 h-4" />
          </p>
          <h1 className="font-heading font-black text-white text-2xl leading-tight">
            Votre marché africain<br/>
            <span className="text-[var(--primary)]">à portée de main</span>
          </h1>
          <p className="text-white/60 text-sm mt-2">Produits frais livrés à Abidjan</p>
        </motion.div>

        {/* Search bar */}
        <motion.button onClick={() => setPage('marche')}
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}}
          className="mt-5 w-full bg-white/15 backdrop-blur border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 text-white/60 text-sm">
          <Search className="w-4 h-4" />
          Rechercher des produits...
        </motion.button>

        {/* Déco */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[var(--primary)]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[var(--secondary)]/30 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Catégories */}
      <div className="px-4 mt-5">
        <SectionHeader title="Catégories" action="Tout voir" onAction={() => setPage('marche')} />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {loading ? <ChipsSkeleton /> : categories.map((cat, i) => {
            const CatIcon = catIcon(cat)
            return (
              <motion.button key={cat}
                initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay: i * .05}}
                onClick={() => setPage('marche')}
                className="flex-shrink-0 bg-white border border-[var(--border)] rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-[80px] shadow-sm">
                <CatIcon className="w-6 h-6 text-[var(--secondary)]" />
                <span className="text-[.65rem] font-semibold text-gray-600 whitespace-nowrap">{cat}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Produits vedettes */}
      <div className="px-4 mt-6">
        <SectionHeader title="Produits du moment" titleIcon={Flame} action="Voir tout" onAction={() => setPage('marche')} />
        {loading ? <ProductGridSkeleton count={4} /> : (
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>

      {/* Bannière Yâsurplus */}
      <motion.div className="mx-4 mt-6 bg-gradient-to-r from-[var(--secondary)] to-[#27945a] rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
        whileTap={{ scale: .97 }} onClick={() => setPage('bons-plans')}>
        <Leaf className="w-8 h-8 text-white" />
        <div className="flex-1">
          <p className="font-heading font-bold text-white text-sm">Yâsurplus</p>
          <p className="text-white/80 text-xs">Sauvez des repas · Jusqu'à -65%</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70" />
      </motion.div>

      {/* Bannière Planning */}
      <motion.div className="mx-4 mt-3 bg-gradient-to-r from-[var(--primary)] to-orange-500 rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
        whileTap={{ scale: .97 }} onClick={() => setPage('planning')}>
        <CalendarDays className="w-8 h-8 text-white" />
        <div className="flex-1">
          <p className="font-heading font-bold text-white text-sm">Yâplanning</p>
          <p className="text-white/80 text-xs">Planifiez vos repas · IA incluse</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70" />
      </motion.div>
    </motion.div>
  )
}
