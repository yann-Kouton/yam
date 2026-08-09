import { useState, useEffect, useCallback } from 'react'

/** Détecte la plateforme pour adapter le parcours d'installation :
 * - 'ios'     : iPhone / iPad (Safari, Chrome iOS...) — pas d'installation
 *               programmatique possible côté Apple.
 * - 'android' : téléphones/tablettes Android.
 * - 'desktop' : PC (Windows / Mac / Linux). */
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/.test(ua)
    // iPadOS 13+ se présente comme un Mac avec support tactile
    || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

/** Gère l'installation de la PWA.
 *
 * - Sur Chrome / Edge / la plupart des navigateurs Chromium (Android ET
 *   PC/Windows/Mac/Linux), le navigateur émet l'évènement
 *   `beforeinstallprompt`. On le capture et on peut ensuite déclencher
 *   `install()` pour ouvrir directement la boîte de dialogue native
 *   "Installer l'application" — l'app est alors téléchargée et installée
 *   sans quitter le site, en un seul clic, aussi bien sur PC que sur mobile.
 * - Sur iOS Safari, Apple ne permet pas de déclencher l'installation par
 *   code : `canInstall` reste `false` et l'appelant doit afficher les
 *   instructions manuelles ("Partager" → "Sur l'écran d'accueil").
 * - Sur les navigateurs qui ne supportent pas `beforeinstallprompt` (Safari
 *   macOS, Firefox...), `canInstall` reste également `false` : le
 *   téléchargement direct n'est pas possible côté navigateur dans ce cas. */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform] = useState(detectPlatform)

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

  /** Lance l'installation native si possible (téléchargement direct de
   * l'app, sur PC comme sur mobile). Retourne
   * 'accepted' | 'dismissed' | 'unavailable'. */
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
    platform, // 'ios' | 'android' | 'desktop'
    install,
  }
}
