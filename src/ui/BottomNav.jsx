import { motion } from 'framer-motion'

// items: [{ id, label, icon: LucideIcon }]
export function BottomNav({ page, setPage, items }) {
  return (
    // Wrapper flex-shrink-0 qui prend la hauteur de la barre flottante
    <div className="flex-shrink-0 relative" style={{ height: 84 }}>
      <nav
        className="glass-nav absolute left-1/2 flex items-center"
        style={{
          transform: 'translateX(-50%)',
          bottom: 12,
          width: 'calc(100% - 2.5rem)',
          maxWidth: 600,
          borderRadius: '100px',
          height: 68,
          zIndex: 90,
          padding: '0 8px',
        }}
      >
        {items.map(item => {
          const active = page === item.id
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setPage(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
              style={{ color: active ? 'var(--primary)' : 'var(--muted-fg)' }}
              aria-label={item.label}
            >
              {/* Bulle active bg */}
              {active && (
                <motion.div
                  layoutId="nav-blob-bg"
                  className="absolute inset-y-2 rounded-full"
                  style={{
                    left: '8%', right: '8%',
                    background: 'linear-gradient(135deg, rgba(231,126,35,0.15), rgba(231,126,35,0.06))',
                    border: '1px solid rgba(231,126,35,0.2)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}

              {/* Icône avec scale */}
              <motion.div
                animate={{ scale: active ? 1.18 : 1, y: active ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <item.icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ opacity: active ? 1 : 0.65 }}
                className="text-[.6rem] font-bold leading-none"
                style={{ position: 'relative', zIndex: 1 }}
              >
                {item.label}
              </motion.span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
