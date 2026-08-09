import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { fadeIn } from '../constants'

const TOAST_ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }

export function Toast({ toast }) {
  const Icon = toast ? (TOAST_ICONS[toast.type] || Info) : null
  return (
    <AnimatePresence>
      {toast && (
        <motion.div className="toast flex items-center gap-2" {...fadeIn}>
          <Icon className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
