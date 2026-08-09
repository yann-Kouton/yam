import { useState, useEffect, useCallback } from 'react'

/** Gère l'installation de la PWA.
 *
 * - Sur Chrome / Edge (Android ET PC/Windows/Mac/Linux), le navigateur émet
 *   l'évènement `beforeinstallprompt`. On le capture et on peut ensuite
 *   déclencher `install()` pour ouvrir directement la boîte de dialogue
 *   native "Installer l'application" — l'app est alors téléchargée et
 *   installée sans quitter le site, en un seul clic.
 * - Sur iOS Safari, Apple ne permet pas de déclencher l'installation par
 *   code : `canInstall` reste `false` et l'appelant doit afficher les
 *   instructions manuelles ("Partager" → "Sur l'écran d'accueil").
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsInstalled(standalone)

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  /** Lance l'installation native si possible.
   * Retourne 'accepted' | 'dismissed' | 'unavailable'. */
  const install = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome // 'accepted' ou 'dismissed'
  }, [deferredPrompt])

  return {
    canInstall: !!deferredPrompt, // true = installation directe possible (Android / PC)
    isInstalled,
    install,
  }
}
