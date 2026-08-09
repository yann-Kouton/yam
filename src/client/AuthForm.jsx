import { useState } from 'react'
import { motion } from 'framer-motion'
// updateProfile a été ajouté ici
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile
} from 'firebase/auth'
// doc et setDoc ont été ajoutés ici pour Firestore
import { doc, setDoc } from 'firebase/firestore'
import { useApp } from '../context/AppContext'
import { auth, db } from '../lib/firebase'
// Assurez-vous que ces constantes existent bien dans votre fichier constants.js
import { ROLES, USER_STATUS, VENDOR_REQUEST_STATUS } from '../constants'

/** Formulaire connexion / inscription / mot de passe oublié (email + Google),
 * partagé entre la page Profil et l'écran de connexion requise (AuthGate). */
export function AuthForm() {
  const { showToast } = useApp()
  const [authMode, setAuthMode] = useState('login') // login | register | reset
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, form.email, form.password)
        showToast('Connecté !', 'success')
      } else {
        // 1. On crée le compte avec email et mot de passe
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
        
        // 2. On attache le nom entré dans le formulaire au profil Firebase
        if (form.name) {
          await updateProfile(userCredential.user, {
            displayName: form.name
          })
        }

        // 3. On force l'enregistrement du nom dans Firestore pour que l'AppContext le trouve
        // Le { merge: true } est magique : il fusionne ces infos sans écraser ce que l'AppContext aurait pu créer entre temps
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: form.name,
          email: form.email,
          role: ROLES.CLIENT,
          status: USER_STATUS.ACTIVE,
          vendorRequestStatus: VENDOR_REQUEST_STATUS.NONE
        }, { merge: true })

        showToast('Compte créé !', 'success')
      }
    } catch (err) {
      showToast(err.message, 'error')
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!form.email) { showToast('Entrez votre email pour réinitialiser', 'error'); return }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, form.email)
      showToast('Email de réinitialisation envoyé !', 'success')
      setAuthMode('login')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      showToast('Connecté avec Google !', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (authMode === 'reset') {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-center text-sm text-[var(--muted-fg)]">
          Recevez un lien par email pour choisir un nouveau mot de passe.
        </p>
        <form onSubmit={handleReset} className="flex flex-col gap-3">
          <input type="email" className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <motion.button type="submit" whileTap={{ scale: .97 }} disabled={loading} className="btn-primary disabled:opacity-70">
            {loading ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : 'Envoyer le lien'}
          </motion.button>
        </form>
        <button onClick={() => setAuthMode('login')} className="text-center text-sm font-semibold text-[var(--primary)]">
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
        {['login', 'register'].map(m => (
          <button key={m} onClick={() => setAuthMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === m ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
            {m === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        ))}
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-3">
        {authMode === 'register' && (
          <input className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Nom complet" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required={authMode === 'register'} />
        )}
        <input type="email" className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" className="border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          placeholder="Mot de passe" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        {authMode === 'login' && (
          <button type="button" onClick={() => setAuthMode('reset')}
            className="self-end text-xs font-semibold text-[var(--primary)] -mt-1">
            Mot de passe oublié ?
          </button>
        )}
        <motion.button type="submit" whileTap={{ scale: .97 }} disabled={loading} className="btn-primary disabled:opacity-70">
          {loading ? <div className="spinner w-4 h-4 border-white border-t-transparent" /> : authMode === 'login' ? 'Se connecter' : "S'inscrire"}
        </motion.button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-fg)]">ou</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <button onClick={handleGoogle} type="button"
        className="flex items-center justify-center gap-3 border-2 border-[var(--border)] rounded-xl py-3 font-semibold text-sm">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuer avec Google
      </button>
    </div>
  )
}