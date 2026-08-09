import { motion } from 'framer-motion'
import { fadeUp } from '../constants'

export function EmptyState({ icon: Icon, title, desc, action, onAction }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3" {...fadeUp}>
      {Icon && <Icon className="w-12 h-12 text-[var(--muted-fg)]" strokeWidth={1.5} />}
      <h3 className="font-heading font-bold text-base">{title}</h3>
      <p className="text-sm text-muted-fg">{desc}</p>
      {action && <button className="btn-primary mt-2" onClick={onAction}>{action}</button>}
    </motion.div>
  )
}
