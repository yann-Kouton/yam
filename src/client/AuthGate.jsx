import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { fadeUp } from '../constants'
import { Header } from '../ui/Header'
import { AuthForm } from './AuthForm'

/** Affiché à la place d'une page protégée quand l'utilisateur n'est pas
 * connecté. Propose directement le formulaire de connexion / inscription. */
export function AuthGate({ title, message }) {
  return (
    <motion.div {...fadeUp} key="auth-gate">
      <Header title={title} />
      <div className="px-5 py-6 flex flex-col gap-5">
        <div className="card p-5 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
            <Lock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="font-heading font-bold text-base">Connexion requise</p>
          <p className="text-sm text-[var(--muted-fg)]">{message}</p>
        </div>

        <AuthForm />
      </div>
    </motion.div>
  )
}
