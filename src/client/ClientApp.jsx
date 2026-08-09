import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Home, Store, CalendarDays, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BottomNav } from '../ui/BottomNav'
import { TopNavBar } from '../ui/TopNavBar'
import { HamburgerDrawer } from '../ui/HamburgerDrawer'
import { PwaBanner } from '../ui/PwaBanner'
import { Toast } from '../ui/Toast'
import { PageAccueil } from './PageAccueil'
import { PageMarche } from './PageMarche'
import { PagePlanning } from './PagePlanning'
import { PageBonsPlans } from './PageBonsPlans'
import { PagePanier } from './PagePanier'
import { PageProfil } from './PageProfil'
import { AuthGate } from './AuthGate'
import { AssistantYa } from './AssistantYa'

export function ClientApp() {
  const { user, cart, toast } = useApp()
  const [page, setPage] = useState('accueil')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0)

  // 4 onglets dans la navbar inférieure
  const navItems = [
    { id: 'accueil',    label: 'Accueil',    icon: Home },
    { id: 'marche',     label: 'Marché',     icon: Store },
    { id: 'planning',   label: 'Planning',   icon: CalendarDays },
    { id: 'bons-plans', label: 'Yâsurplus',  icon: Tag },
  ]

  // Seule la page d'accueil reste visible sans connexion — le reste de
  // l'app nécessite un compte.
  const pageComponents = {
    'accueil':    <PageAccueil setPage={setPage} />,
    'marche':     user ? <PageMarche /> : <AuthGate title="marché" message="Connectez-vous pour parcourir le marché et commander vos produits." />,
    'planning':   user ? <PagePlanning /> : <AuthGate title="planning" message="Connectez-vous pour générer votre planning de repas." />,
    'bons-plans': user ? <PageBonsPlans /> : <AuthGate title="surplus" message="Connectez-vous pour profiter des offres Yâsurplus." />,
    'panier':     user ? <PagePanier setPage={setPage} /> : <AuthGate title="panier" message="Connectez-vous pour accéder à votre panier et commander." />,
    'profil':     <PageProfil />,
  }

  return (
    <div className="app-shell">
      <PwaBanner />

      {/* Navbar supérieure — en flux (flex-shrink-0) */}
      <TopNavBar
        onMenuOpen={() => setDrawerOpen(true)}
        onCartOpen={() => setPage('panier')}
        cartCount={cartCount}
      />

      {/* Drawer hamburger — position absolute dans le shell */}
      <HamburgerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={setPage}
      />

      {/* Contenu scrollable */}
      <div className="page-content">
        <AnimatePresence mode="wait">
          <div key={page}>
            {pageComponents[page] || <PageAccueil setPage={setPage} />}
          </div>
        </AnimatePresence>
      </div>

      {/* Navbar inférieure liquid glass — wrapper en flux */}
      <BottomNav page={page} setPage={setPage} items={navItems} />

      <AssistantYa />
      <Toast toast={toast} />
    </div>
  )
}
