import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { fadeIn, slideUp } from '../constants'

export function BottomSheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" {...fadeIn} onClick={onClose}>
          <motion.div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90dvh] overflow-y-auto"
            {...slideUp} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-white z-10">
              <h2 className="font-heading font-bold text-base">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-5 pb-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
