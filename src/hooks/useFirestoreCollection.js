import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

// constraints: tableau de contraintes Firestore (where, orderBy...), recréé à
// chaque render — on le sérialise pour éviter les re-abonnements inutiles.
export function useFirestoreCollection(collectionName, constraints = []) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const key = JSON.stringify(constraints.map(c => c?._query || String(c)))

  useEffect(() => {
    if (!collectionName) return
    setLoading(true)
    const q = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName)
    const unsub = onSnapshot(q,
      snap => { setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      err  => { setError(err.message); setLoading(false) }
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, key])

  return { data, loading, error }
}
