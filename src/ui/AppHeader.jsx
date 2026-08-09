import { motion } from 'framer-motion'
import { Menu, ShoppingCart } from 'lucide-react'
import { Badge } from './Badge'
import { NotificationBell } from './NotificationBell'

/** En-tête supérieure commune aux trois espaces de l'app (client, vendeur,
 * admin) : logo centré + cloche de notifications toujours présente.
 * Le bouton hamburger (onMenuOpen) et le bouton panier (onCartOpen) sont
 * optionnels et ne s'affichent que si l'espace en a besoin (client). */
export function AppHeader({ onMenuOpen, onCartOpen, cartCount = 0 }) {
  return (
    <header
      className="glass-top flex-shrink-0 flex items-center justify-center w-full"
      style={{ zIndex: 100, position: 'relative' }}
    >
      <div className="flex items-center px-6 gap-3 w-full h-[60px]" style={{ maxWidth: 1200 }}>
        {/* Hamburger (client uniquement) */}
        {onMenuOpen && (
          <motion.button
            id="top-nav-menu-btn"
            whileTap={{ scale: 0.88 }}
            onClick={onMenuOpen}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(231,126,35,0.10)' }}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </motion.button>
        )}

        {/* Logo centré */}
        <div className="flex-1 flex justify-center">
          <span className="font-heading font-black text-xl tracking-tight select-none">
            <span style={{ color: 'var(--primary)' }}>Yâ</span>
            <span style={{ color: 'var(--dark)' }}>marché</span>
          </span>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          <NotificationBell id="top-nav-notif-btn" />

          {/* Panier (client uniquement) */}
          {onCartOpen && (
            <motion.button
              id="top-nav-cart-btn"
              whileTap={{ scale: 0.88 }}
              onClick={onCartOpen}
              className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
              style={{ background: 'rgba(231,126,35,0.10)' }}
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {cartCount > 0 && <Badge count={cartCount} />}
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}
