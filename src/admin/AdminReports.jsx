import { useState } from 'react'
import { motion } from 'framer-motion'
import { updateDoc, doc } from 'firebase/firestore'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { db } from '../lib/firebase'
import { notifyUser } from '../lib/notifications'
import { fadeUp, REPORT_STATUS } from '../constants'
import { Header } from '../ui/Header'
import { RowListSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { StatusPill } from '../ui/StatusPill'

export function AdminReports() {
  const { showToast } = useApp()
  const { data: reports, loading } = useFirestoreCollection('reports')
  const [tab, setTab] = useState(REPORT_STATUS.OPEN)

  const filtered = reports.filter(r => (r.status || REPORT_STATUS.OPEN) === tab)

  const resolve = async (r) => {
    try {
      await updateDoc(doc(db, 'reports', r.id), { status: REPORT_STATUS.RESOLVED })
      showToast('Signalement marqué comme résolu', 'success')
      if (r.reporterId) {
        notifyUser(r.reporterId, {
          type: 'report',
          title: 'Signalement traité',
          desc: `Votre signalement concernant « ${r.targetLabel} » a été traité.`,
        })
      }
    } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <motion.div {...fadeUp} key="admin-reports">
      <Header title="signalements" />
      <div className="flex gap-2 px-4 pt-2 pb-3">
        {[REPORT_STATUS.OPEN, REPORT_STATUS.RESOLVED].map(s => (
          <button key={s} onClick={() => setTab(s)} className={`pill ${tab===s ? 'active' : ''}`}>{s === 'open' ? 'Ouverts' : 'Résolus'}</button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {loading ? <RowListSkeleton count={4} lines={3} /> : filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Rien à signaler" desc="Aucun signalement dans cette catégorie" />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-sm">{r.targetLabel}</p>
                  <StatusPill status={r.status || 'open'} />
                </div>
                <p className="text-xs font-bold text-red-500 mb-1">{r.reason}</p>
                {r.details && <p className="text-xs text-[var(--muted-fg)] mb-2">{r.details}</p>}
                <p className="text-[.65rem] text-gray-400 mb-2 capitalize">Type : {r.type}</p>
                {r.status === REPORT_STATUS.OPEN && (
                  <button onClick={() => resolve(r)} className="flex items-center gap-1.5 text-xs font-bold text-[var(--secondary)] bg-[var(--secondary-light)] px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marquer résolu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
