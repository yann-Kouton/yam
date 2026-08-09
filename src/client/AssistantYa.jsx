import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Hand, X, Send } from 'lucide-react'
import { fadeIn, fadeUp, slideUp } from '../constants'

export function AssistantYa() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [typing, setTyping]   = useState(false)
  const bottomRef             = useRef(null)

  const KB = [
    { keys:['livraison','délai','délais'], answer:'Nous livrons en 30 à 90 min selon votre zone à Abidjan. 4 zones disponibles de 500 à 1500 FCFA.' },
    { keys:['paiement','payer','mobile money'], answer:'Nous acceptons Orange Money, MTN MoMo, Wave et le paiement cash à la livraison (+200 FCFA).' },
    { keys:['minimum','commande minimum'], answer:'Le minimum de commande est de 5 000 FCFA.' },
    { keys:['surplus','gaspi','gaspillage'], answer:'Le Yâsurplus vous permet de sauver des repas à -60% ! Allez dans "Bons Plans" pour voir les offres disponibles.' },
    { keys:['planning','menu','repas'], answer:'Yâplanning génère votre menu de la semaine selon votre budget et vos préférences. Allez dans l\'onglet Planning !' },
    { keys:['promo','code','réduction'], answer:'Codes disponibles : BIENVENUE (-25%), YAMARCHE10 (-10%), SURPLUS500 (-500F), CADEAU1000 (-1000F).' },
    { keys:['bonjour','salut','hello'], answer:'Bonjour ! Je suis Yâ, votre assistante Yâmarché. Comment puis-je vous aider aujourd\'hui ?' },
  ]

  const sendMessage = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { role:'user', text:msg }])
    setTyping(true)
    setTimeout(() => {
      const lower = msg.toLowerCase()
      const found = KB.find(k => k.keys.some(key => lower.includes(key)))
      const answer = found?.answer || 'Je ne suis pas sûre de comprendre. Pouvez-vous reformuler ? Vous pouvez aussi nous contacter au +225 07 00 00 00 00'
      setMessages(m => [...m, { role:'ya', text:answer }])
      setTyping(false)
    }, 900)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const suggestions = ['Délais de livraison', 'Paiement Mobile Money', 'Code promo', 'Yâsurplus']

  return (
    <>
      {/* FAB */}
      <motion.button
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[#27945a] shadow-lg shadow-green-200 flex items-center justify-center"
        whileTap={{ scale: .9 }} onClick={() => setOpen(true)}
        animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
        <Leaf className="w-6 h-6 text-white" />
        {messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.button>

      {/* Panel — z-[150] : au-dessus de la TopNavBar (100) et de la BottomNav
          flottante (90), qui masquaient le champ de saisie tout en bas. */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[150]" {...fadeIn}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl h-[82dvh] flex flex-col" {...slideUp}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[#27945a] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm">Yâ · Assistante</p>
                  <p className="text-xs text-[var(--secondary)]">● En ligne</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {messages.length === 0 && (
                  <motion.div {...fadeUp} className="flex flex-col items-center gap-3 py-6 text-center">
                    <Hand className="w-12 h-12 text-[var(--secondary)]" />
                    <p className="font-heading font-bold">Bonjour ! Je suis Yâ</p>
                    <p className="text-sm text-[var(--muted-fg)]">Votre assistante Yâmarché. Comment puis-je vous aider ?</p>
                  </motion.div>
                )}

                {messages.map((m, i) => (
                  <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-br-sm' : 'bg-[var(--muted)] text-gray-800 rounded-bl-sm'}`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--muted)] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                      {[0,1,2].map(i => <motion.div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{y:[0,-4,0]}} transition={{delay:i*.15,repeat:Infinity,duration:.6}} />)}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => sendMessage(s)} className="pill text-xs">{s}</button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2">
                <input className="flex-1 bg-[var(--muted)] rounded-xl px-4 py-2.5 text-sm outline-none"
                  placeholder="Écrire un message..." value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <motion.button whileTap={{scale:.9}} onClick={() => sendMessage()}
                  className="w-10 h-10 bg-[var(--secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-white" strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
