import { useState, useEffect, useCallback } from 'react'

// ── ASTUCE CLÉ : On capture l'événement globalement, en dehors de React ──
let globalDeferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

/** Détecte la plateforme pour adapter le parcours d'installation :
 * - 'ios'     : iPhone / iPad (Safari, Chrome iOS...)
 * - 'android' : téléphones/tablettes Android.
 * - 'desktop' : PC (Windows / Mac / Linux). */
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/.test(ua)
    || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function usePwaInstall() {
  // On initialise directement avec la variable globale au cas où l'événement soit déjà passé
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform] = useState(detectPlatform)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsInstalled(standalone)

    // On écoute aussi dans le hook au cas où l'événement se déclenche plus tard
    const onBeforeInstall = (e) => {
      e.preventDefault()
      globalDeferredPrompt = e // Mise à jour globale
      setDeferredPrompt(e)     // Mise à jour de l'état React
    }
    
    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      globalDeferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      globalDeferredPrompt = null
    }
    
    return outcome 
  }, [deferredPrompt])

  return {
    canInstall: !!deferredPrompt, 
    isInstalled,
    platform,
    install,
  }
}