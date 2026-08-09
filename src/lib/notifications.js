import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// ── Notifications Firestore ──────────────────────────────
// Chaque notification cible une "audience" :
//   - 'all'    → tous les utilisateurs (réservé aux admins, cf. firestore.rules)
//   - 'admins' → tous les comptes admin (utile pour les alertes système :
//                nouvelle commande, nouveau signalement, demande vendeur...)
//   - 'users'  → une liste précise de destinataires (recipientIds)
//
// On ne fait jamais échouer l'action principale (commande, modération...) à
// cause d'une notification : toute erreur est avalée et journalée.
async function notify({ audience, recipientIds = [], type = 'info', title, desc, createdBy = 'system', meta = {} }) {
  try {
    await addDoc(collection(db, 'notifications'), {
      audience,
      recipientIds,
      type,
      title,
      desc,
      createdBy,
      meta,
      readBy: [],
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.error('notify() a échoué :', e.message)
  }
}

// Notifie un seul utilisateur (ex : vendeur dont le produit est modéré)
export const notifyUser = (uid, opts) => notify({ audience: 'users', recipientIds: [uid], ...opts })

// Notifie plusieurs utilisateurs précis (ex : vendeurs d'une commande)
export const notifyUsers = (uids, opts) => {
  const ids = [...new Set((uids || []).filter(Boolean))]
  if (!ids.length) return Promise.resolve()
  return notify({ audience: 'users', recipientIds: ids, ...opts })
}

// Notifie tous les admins (alertes système : commande, signalement, demande vendeur)
export const notifyAdmins = (opts) => notify({ audience: 'admins', ...opts })

// Diffusion à tous les utilisateurs (réservé à l'espace admin)
export const notifyAll = (opts) => notify({ audience: 'all', ...opts })

// Libellé « il y a x min » à partir d'un Timestamp Firestore ou d'une Date
export function timeAgo(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null
  if (!date) return '...'
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `Il y a ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return diffDays === 1 ? 'Hier' : `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR')
}
