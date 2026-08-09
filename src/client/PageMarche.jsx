import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'
import { ProductGridSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { ProductCard } from './ProductCard'

export function PageMarche() {
  const { products, loading } = useApp()
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState('Tous')
  const [sort, setSort]       = useState('default')

  const categories = ['Tous', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products
    .filter(p => category === 'Tous' || p.category === category)
    .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort === 'price-asc' ? a.price-b.price : sort === 'price-desc' ? b.price-a.price : 0)

  return (
    <motion.div {...fadeUp} key="marche">
      <Header title="marché" rightAction={
        <button className="w-9 h-9 rounded-xl bg-[var(--muted)] flex items-center justify-center relative">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      } />

      <div className="px-4 py-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[var(--border)] rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-[var(--muted-fg)]" />
          <input className="flex-1 text-sm bg-transparent outline-none" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <select className="bg-white border border-[var(--border)] rounded-xl px-3 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="default">Trier</option>
          <option value="price-asc">Prix ↑</option>
          <option value="price-desc">Prix ↓</option>
        </select>
      </div>

      <div className="flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={`pill flex-shrink-0 ${category === cat ? 'active' : ''}`}>{cat}</button>
        ))}
      </div>

      <div className="px-4 pb-6">
        <p className="text-xs text-[var(--muted-fg)] mb-3">{filtered.length} produit{filtered.length > 1 ? 's' : ''}</p>
        {loading ? <ProductGridSkeleton count={6} /> : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Aucun produit" desc="Essaie un autre terme de recherche" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  )
}
