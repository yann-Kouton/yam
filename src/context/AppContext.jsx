import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, where, updateDoc, arrayUnion } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useToast } from '../hooks/useToast'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { ROLES, USER_STATUS, VENDOR_REQUEST_STATUS, PRODUCT_STATUS } from '../constants'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export function AppProvider({ children }) {
  const [authUser, setAuthUser]   = useState(null)
  const [userDoc, setUserDoc]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cart, setCart]           = useState({})
  const { toast, show: showToast } = useToast()

  // Écoute l'état de connexion Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u)
      if (!u) { setUserDoc(null); setAuthLoading(false) }
    })
    return unsub
  }, [])

  // Écoute le document Firestore users/{uid} (rôle, statut...) en direct.
  // Le crée avec le rôle "client" par défaut s'il n'existe pas encore.
  useEffect(() => {
    if (!authUser) return
    const ref = doc(db, 'users', authUser.uid)
    const unsub = onSnapshot(ref, async snap => {
      if (!snap.exists()) {
        await setDoc(ref, {
          displayName: authUser.displayName || '',
          email: authUser.email || '',
          role: ROLES.CLIENT,
          status: USER_STATUS.ACTIVE,
          vendorRequestStatus: VENDOR_REQUEST_STATUS.NONE,
          createdAt: serverTimestamp(),
        })
        return // le onSnapshot se redéclenchera avec le doc créé
      }
      setUserDoc({ id: snap.id, ...snap.data() })
      setAuthLoading(false)
    })
    return unsub
  }, [authUser])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev[product.id]
      return { ...prev, [product.id]: { ...product, qty: (existing?.qty || 0) + 1 } }
    })
  }, [])

  const updateCart = useCallback((id, delta) => {
    setCart(prev => {
      const item = prev[id]
      if (!item) return prev
      const qty = item.qty + delta
      if (qty <= 0) { const { [id]: _, ...rest } = prev; return rest }
      return { ...prev, [id]: { ...item, qty } }
    })
  }, [])

  const removeFromCart = useCallback((id) => {
    setCart(prev => { const { [id]: _, ...rest } = prev; return rest })
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setCart({})
  }, [])

  // Produits & offres surplus (temps réel). Le catalogue client ne montre
  // que les produits "approved" (ou sans champ status, pour compat des
  // données de démo) — vendeurs et admin interrogent leurs propres vues.
  const { data: allProducts, loading: productsLoading } = useFirestoreCollection('products')
  const { data: surplusDeals, loading: surplusLoading } = useFirestoreCollection('surplusDeals')
  const products = allProducts.filter(p => !p.status || p.status === PRODUCT_STATUS.APPROVED)

  // Notifications Firestore, liées aux actions réelles (commandes,
  // modération, demandes vendeur, signalements, diffusions admin...).
  // Deux abonnements sont fusionnés côté client pour éviter tout index
  // composite Firestore : les notifications qui me sont adressées
  // directement (recipientIds) et celles diffusées à mon audience
  // (tout le monde, ou tous les admins).
  const role = userDoc?.role || ROLES.CLIENT
  const [notifications, setNotifications] = useState([])
  const notifSeenIds = useRef(null) // null = pas encore initialisé (pas de toast au premier chargement)

  useEffect(() => {
    if (!authUser) { setNotifications([]); notifSeenIds.current = null; return }

    let mine = [], byAudience = []
    const audiences = role === ROLES.ADMIN ? ['all', 'admins'] : ['all']

    const applyMerge = () => {
      const map = new Map()
      ;[...mine, ...byAudience].forEach(n => map.set(n.id, n))
      const merged = Array.from(map.values()).sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return tb - ta
      }).slice(0, 50)

      // Toast pour toute notification apparue après le chargement initial
      if (notifSeenIds.current) {
        const fresh = merged.filter(n => !notifSeenIds.current.has(n.id))
        fresh.forEach(n => showToast(`Nouvelle notification : ${n.title}`, 'info'))
      }
      notifSeenIds.current = new Set(merged.map(n => n.id))

      setNotifications(merged.map(n => ({ ...n, unread: !(n.readBy || []).includes(authUser.uid) })))
    }

    const unsubMine = onSnapshot(
      query(collection(db, 'notifications'), where('recipientIds', 'array-contains', authUser.uid)),
      snap => { mine = snap.docs.map(d => ({ id: d.id, ...d.data() })); applyMerge() },
      err => console.error('notifications (mine) :', err.message)
    )
    const unsubAudience = onSnapshot(
      query(collection(db, 'notifications'), where('audience', 'in', audiences)),
      snap => { byAudience = snap.docs.map(d => ({ id: d.id, ...d.data() })); applyMerge() },
      err => console.error('notifications (audience) :', err.message)
    )

    return () => { unsubMine(); unsubAudience() }
  }, [authUser, role, showToast])

  const markAllNotificationsRead = useCallback(async () => {
    if (!authUser) return
    const unread = notifications.filter(n => n.unread)
    await Promise.all(unread.map(n =>
      updateDoc(doc(db, 'notifications', n.id), { readBy: arrayUnion(authUser.uid) }).catch(() => {})
    ))
  }, [authUser, notifications])

  const markNotificationRead = useCallback(async (id) => {
    if (!authUser) return
    try {
      await updateDoc(doc(db, 'notifications', id), { readBy: arrayUnion(authUser.uid) })
    } catch (e) { /* silencieux : lecture optimiste déjà reflétée par le prochain snapshot */ }
  }, [authUser])

  const value = {
    user: authUser,
    userDoc,
    role,
    isSuspended: userDoc?.status === USER_STATUS.SUSPENDED,
    authLoading,
    cart, addToCart, updateCart, removeFromCart,
    toast, showToast,
    logout,
    products, allProducts, loading: productsLoading,
    surplusDeals, surplusLoading,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

