import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Flag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { db } from '../lib/firebase'
import { notifyAdmins } from '../lib/notifications'
import { BottomSheet } from '../ui/BottomSheet'
import { REPORT_STATUS } from '../constants'

const REASONS = ['Produit non conforme', 'Prix trompeur', 'Contenu inapproprié', 'Suspicion de fraude', 'Autre']

export function ReportButton({ type, targetId, targetLabel, className }) {
  const { user, showToast } = useApp()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!user) { showToast('Connectez-vous pour signaler', 'warning'); setOpen(false); return }
    setSending(true)
    try {
      await addDoc(collection(db, 'reports'), {
        type, targetId, targetLabel, reason, details,
        reporterId: user.uid,
        status: REPORT_STATUS.OPEN,
        createdAt: serverTimestamp(),
      })
      showToast('Signalement envoyé, merci', 'success')
      notifyAdmins({
        type: 'report',
        title: 'Nouveau signalement 🚩',
        desc: `${reason} · ${targetLabel}`,
      })
      setOpen(false)
      setDetails('')
    } catch (e) {
      showToast(e.message, 'error')
    }
    setSending(false)
  }

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={className || 'w-7 h-7 bg-black/40 rounded-full flex items-center justify-center'}>
        <Flag className="w-3.5 h-3.5 text-white" />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Signaler">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--muted-fg)]">Pourquoi signalez-vous « {targetLabel} » ?</p>
          <div className="flex flex-col gap-2">
            {REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold ${reason===r ? 'border-red-400 bg-red-50 text-red-500' : 'border-[var(--border)]'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none resize-none"
            placeholder="Détails (optionnel)" rows={2} value={details} onChange={e => setDetails(e.target.value)} />
          <button onClick={submit} disabled={sending} className="btn-primary bg-red-500 disabled:opacity-70">
            {sending ? '...' : 'Envoyer le signalement'}
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
