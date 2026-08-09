import { motion } from 'framer-motion'

export function Badge({ count }) {
  if (!count) return null
  return (
    <motion.span
      key={count}
      initial={{ scale: 1.5 }} animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 bg-red-500 text-white text-[.55rem] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
    >{count > 99 ? '99+' : count}</motion.span>
  )
}
