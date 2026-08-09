import {
  ShoppingCart, Apple, Beef, Fish, Wheat, Flame, CupSoda, Milk, Carrot, Droplet,
} from 'lucide-react'

// ── PAGES CLIENT ─────────────────────────────────────────
export const PAGES = ['accueil', 'marche', 'planning', 'bons-plans', 'panier', 'profil']

// ── LIVRAISON ────────────────────────────────────────────
export const ZONES_LIVRAISON = [
  { label: 'Cocody / Plateau / Marcory', price: 500 },
  { label: 'Yopougon / Adjamé',          price: 800 },
  { label: 'Abobo / Anyama',             price: 1000 },
  { label: 'Grand-Bassam / Bingerville', price: 1500 },
]

// ── CODES PROMO ──────────────────────────────────────────
export const PROMO_CODES = {
  BIENVENUE:  { type: 'percent', value: 25 },
  YAMARCHE10: { type: 'percent', value: 10 },
  SURPLUS500: { type: 'fixed',   value: 500 },
  CADEAU1000: { type: 'fixed',   value: 1000 },
}

// ── RÔLES & STATUTS ──────────────────────────────────────
export const ROLES = { CLIENT: 'client', VENDEUR: 'vendeur', ADMIN: 'admin' }
export const USER_STATUS = { ACTIVE: 'active', SUSPENDED: 'suspended' }
export const PRODUCT_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }
export const VENDOR_REQUEST_STATUS = { NONE: 'none', PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }
export const REPORT_STATUS = { OPEN: 'open', RESOLVED: 'resolved' }

// ── ANIMATIONS FRAMER MOTION ─────────────────────────────
export const fadeUp  = { initial:{opacity:0,y:24}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-16}, transition:{duration:.35,ease:[.34,1.1,.64,1]} }
export const fadeIn  = { initial:{opacity:0},      animate:{opacity:1},     exit:{opacity:0},       transition:{duration:.22} }
export const slideUp = { initial:{y:'100%'},       animate:{y:0},           exit:{y:'100%'},         transition:{type:'spring',damping:28,stiffness:280} }
export const scaleIn = { initial:{scale:.88,opacity:0}, animate:{scale:1,opacity:1}, exit:{scale:.88,opacity:0}, transition:{duration:.25,ease:[.34,1.2,.64,1]} }

// ── ICÔNE PAR CATÉGORIE PRODUIT ──────────────────────────
export function catIcon(cat) {
  const map = {
    'Légumes': Carrot, 'Fruits': Apple, 'Viandes': Beef, 'Poissons': Fish,
    'Céréales': Wheat, 'Épices': Flame, 'Boissons': CupSoda,
    'Produits laitiers': Milk, 'Tubercules': Carrot, 'Huiles': Droplet,
  }
  return map[cat] || ShoppingCart
}
