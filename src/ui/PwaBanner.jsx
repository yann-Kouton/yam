import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Apple, Smartphone, ArrowUpFromLine, PlusSquare, CheckCircle2, Wrench, Check
} from 'lucide-react'
import { fadeIn, scaleIn } from '../constants'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useApp } from '../context/AppContext'

export function PwaBanner() {
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [osTab, setOsTab] = useState('ios')
  const { canInstall, isInstalled, install } = usePwaInstall()
  const { showToast } = useApp() || {}

  useEffect(() => {
    if (isInstalled) { setVisible(false); return }
    setOsTab(/android/i.test(navigator.userAgent) ? 'android' : 'ios')
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [isInstalled])

  const handleInstallClick = async () => {
    // Chrome / Edge, Android et PC : téléchargement + installation directe,
    // sans quitter l'app, via la boîte de dialogue native du navigateur.
    if (canInstall) {
      const outcome = await install()
      if (outcome === 'accepted') {
        showToast?.('Application installée !', 'success')
        setVisible(false)
      }
      return
    }
    // iOS Safari (et navigateurs qui ne supportent pas l'install native) :
    // seule la procédure manuelle "Ajouter à l'écran d'accueil" existe.
    setModalOpen(true)
  }

  if (!visible) return null

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center py-2 px-4 bg-[#1a1a1a]"
            initial={{y:'-100%'}} animate={{y:0}} exit={{y:'-100%'}} transition={{type:'spring',damping:25}}>
            <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-full py-1.5 pl-4 pr-1.5 w-full max-w-xs">
              <span className="font-heading font-black text-white text-sm flex-1">
                <span className="text-[var(--primary)]">Yâ</span>marché
              </span>
              <button onClick={handleInstallClick} className="flex items-center gap-2 bg-[var(--primary)] text-white font-heading font-bold text-xs px-4 py-2 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Installer
              </button>
              <button onClick={() => setVisible(false)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" {...fadeIn} onClick={() => setModalOpen(false)}>
            <motion.div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" {...scaleIn} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.4.4-.1 1 .4 1H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                  </div>
                  <span className="font-heading font-bold">Installer Yâmarché</span>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="p-5">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5">
                  {['ios','android'].map(os => (
                    <button key={os} onClick={() => setOsTab(os)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${osTab===os ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
                      {os === 'ios' ? <Apple className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                      {os === 'ios' ? 'iPhone / iPad' : 'Android'}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {(osTab === 'ios' ? [
                    { icon: ArrowUpFromLine, title:'Appuie sur Partager', desc:'En bas de Safari' },
                    { icon: PlusSquare, title:'Sur l\'écran d\'accueil', desc:'Dans la liste qui s\'affiche' },
                    { icon: CheckCircle2, title:'Appuie sur "Ajouter"', desc:'En haut à droite' },
                  ] : [
                    { icon: Wrench,  title:'3 points en haut à droite', desc:'Dans Chrome' },
                    { icon: Smartphone, title:'Ajouter à l\'écran d\'accueil', desc:'Dans le menu' },
                    { icon: CheckCircle2, title:'Confirmer',  desc:'Appuie sur "Ajouter"' },
                  ]).map((step, i) => (
                    <div key={i} className="flex flex-col items-center bg-gray-50 rounded-2xl p-4 gap-2 text-center">
                      <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setModalOpen(false)} className="btn-primary mt-5 bg-[#1a1a1a] text-white flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> OK, j'ai compris !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
