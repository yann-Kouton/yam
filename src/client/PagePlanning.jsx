import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CalendarDays, Wallet, UtensilsCrossed, Coffee, Moon, Check, Wand2, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'

export function PagePlanning() {
  const { products, showToast } = useApp()
  const [step, setStep]           = useState(0) // 0=quiz 1=result
  const [people, setPeople]       = useState(4)
  const [days, setDays]           = useState(7)
  const [budget, setBudget]       = useState(50000)
  const [mealTypes, setMealTypes] = useState('full')
  const [menu, setMenu]           = useState(null)
  const [generating, setGenerating] = useState(false)

  const MEAL_CONFIG = {
    full:         { label:'3 repas complets', icons:[Coffee, UtensilsCrossed, Moon], types:['petit-dej','dejeuner','diner'] },
    'lunch-dinner': { label:'Déjeuner & Dîner', icons:[UtensilsCrossed, Moon],   types:['dejeuner','diner'] },
    'lunch-only': { label:'Déjeuner seulement', icons:[UtensilsCrossed],    types:['dejeuner'] },
    'dinner-only': { label:'Dîner seulement',   icons:[Moon],    types:['diner'] },
  }

  const generateMenu = () => {
    setGenerating(true)
    setTimeout(() => {
      const meals = products.filter(p => ['Céréales','Légumes','Viandes','Poissons','Tubercules'].includes(p.category))
      if (!meals.length) { showToast('Aucun produit disponible', 'warning'); setGenerating(false); return }

      const activeTypes = MEAL_CONFIG[mealTypes].types
      const result = {}
      const dayLabels = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

      Array.from({ length: days }).forEach((_, i) => {
        activeTypes.forEach(type => {
          const shuffled = [...meals].sort(() => Math.random() - .5)
          result[`${i}-${type}`] = shuffled[i % shuffled.length]
        })
      })

      setMenu({ days, people, budget, mealTypes, activeTypes, data: result, dayLabels })
      setGenerating(false)
      setStep(1)
    }, 1200)
  }

  if (step === 1 && menu) return <PlanningResult menu={menu} onReset={() => { setMenu(null); setStep(0) }} />

  return (
    <motion.div {...fadeUp} key="planning">
      <Header title="planning" />
      <div className="px-4 py-5 flex flex-col gap-5 pb-8">

        {/* Personnes */}
        <div className="card p-4">
          <p className="font-heading font-bold text-sm mb-3 flex items-center gap-1.5"><Users className="w-4 h-4" /> Nombre de personnes</p>
          <div className="flex items-center justify-center gap-5">
            <motion.button whileTap={{scale:.85}} onClick={() => setPeople(Math.max(1, people-1))}
              className="w-10 h-10 rounded-xl border-2 border-[var(--border)] flex items-center justify-center font-bold text-lg">−</motion.button>
            <span className="font-heading font-black text-3xl text-[var(--primary)] w-12 text-center">{people}</span>
            <motion.button whileTap={{scale:.85}} onClick={() => setPeople(Math.min(20, people+1))}
              className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center font-bold text-lg text-white">+</motion.button>
          </div>
        </div>

        {/* Jours */}
        <div className="card p-4">
          <p className="font-heading font-bold text-sm mb-3 flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Durée du planning</p>
          <div className="flex gap-2 flex-wrap">
            {[3,5,7,10,14].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`pill ${days === d ? 'active' : ''}`}>{d} jours</button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-heading font-bold text-sm flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Budget total</p>
            <span className="font-heading font-black text-[var(--primary)]">{budget.toLocaleString()} FCFA</span>
          </div>
          <input type="range" min="10000" max="500000" step="5000" value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-[var(--primary)]" />
          <div className="flex justify-between text-xs text-[var(--muted-fg)] mt-1">
            <span>10 000</span><span>500 000 FCFA</span>
          </div>
        </div>

        {/* Types de repas */}
        <div className="card p-4">
          <p className="font-heading font-bold text-sm mb-3 flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4" /> Repas à planifier</p>
          <div className="flex flex-col gap-2">
            {Object.entries(MEAL_CONFIG).map(([key, cfg]) => (
              <motion.button key={key} whileTap={{scale:.97}} onClick={() => setMealTypes(key)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${mealTypes === key ? 'border-[var(--secondary)] bg-[var(--secondary-light)]' : 'border-[var(--border)] bg-white'}`}>
                <span className="flex items-center gap-1">{cfg.icons.map((Ic, ix) => <Ic key={ix} className="w-4 h-4" />)}</span>
                <span className={`font-semibold text-sm flex-1 text-left ${mealTypes === key ? 'text-[var(--secondary)]' : ''}`}>{cfg.label}</span>
                {mealTypes === key && <span className="w-5 h-5 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Générer */}
        <motion.button whileTap={{scale:.97}} onClick={generateMenu} disabled={generating}
          className="btn-primary btn-secondary py-4 rounded-2xl disabled:opacity-70">
          {generating ? <><div className="spinner w-5 h-5 border-white border-t-transparent" />Génération en cours...</> : <>
            <Wand2 className="w-5 h-5" />
            Générer mon menu
          </>}
        </motion.button>
      </div>
    </motion.div>
  )
}

function PlanningResult({ menu, onReset }) {
  const { addToCart, showToast } = useApp()
  const cfg = { 'petit-dej': Coffee, 'dejeuner': UtensilsCrossed, 'diner': Moon }

  const addAllToCart = () => {
    const unique = [...new Set(Object.values(menu.data).map(p => p?.id).filter(Boolean))]
    unique.forEach(id => {
      const p = Object.values(menu.data).find(p => p?.id === id)
      if (p) addToCart(p)
    })
    showToast(`${unique.length} produits ajoutés au panier`, 'success')
  }

  return (
    <motion.div {...fadeUp} key="planning-result">
      <Header title="planning" showBack onBack={onReset} rightAction={
        <button onClick={addAllToCart} className="text-xs font-bold text-[var(--secondary)] bg-[var(--secondary-light)] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <ShoppingCart className="w-3.5 h-3.5" /> Acheter tout
        </button>
      } />

      <div className="px-4 py-4 pb-8">
        <div className="bg-[var(--secondary-light)] border border-[var(--secondary)]/20 rounded-2xl p-4 mb-4 flex gap-3">
          <CalendarDays className="w-6 h-6 text-[var(--secondary)]" />
          <div>
            <p className="font-heading font-bold text-[var(--secondary)] text-sm">{menu.days} jours · {menu.people} personnes</p>
            <p className="text-xs text-[var(--muted-fg)]">Budget : {menu.budget.toLocaleString()} FCFA</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: menu.days }).map((_, i) => (
            <motion.div key={i} className="card p-3"
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay: i * .04}}>
              <p className="font-heading font-bold text-sm mb-2 text-[var(--primary)]">
                {menu.dayLabels[i % 7]}
              </p>
              <div className="flex flex-col gap-1.5">
                {menu.activeTypes.map(type => {
                  const meal = menu.data[`${i}-${type}`]
                  const MealIcon = cfg[type]
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-6"><MealIcon className="w-4 h-4 text-[var(--muted-fg)]" /></span>
                      <span className="text-xs text-[var(--muted-fg)] w-16">{type === 'petit-dej' ? 'Petit déj.' : type === 'dejeuner' ? 'Déjeuner' : 'Dîner'}</span>
                      <span className="flex-1 text-xs font-semibold truncate">{meal?.name || '—'}</span>
                      <span className="text-xs text-[var(--primary)] font-bold">{meal ? Number(meal.price).toLocaleString() : '0'} F</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

