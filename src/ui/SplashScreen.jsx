import { motion } from 'framer-motion'

/**
 * Écran d'ouverture affiché pendant la vérification de la session
 * (remplace le spinner générique par une animation de marque Yâmarché).
 */
export function SplashScreen() {
  return (
    <div
      className="app-shell flex flex-col items-center justify-center gap-6"
      style={{ background: 'linear-gradient(160deg, var(--dark), #2d5a3d)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'white', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
        >
          <span className="font-heading font-black text-3xl" style={{ color: 'var(--primary)' }}>
            Yâ
          </span>
        </motion.div>

        <span className="font-heading font-black text-2xl tracking-tight select-none">
          <span style={{ color: 'var(--primary)' }}>Yâ</span>
          <span className="text-white">marché</span>
        </span>
      </motion.div>

      {/* Barre de chargement */}
      <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <motion.div
          className="h-full w-1/2 rounded-full"
          style={{ background: 'var(--primary)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
