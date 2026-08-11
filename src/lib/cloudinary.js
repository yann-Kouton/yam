import { CLOUDINARY_CLOUD } from './firebase'

// Nécessite un "upload preset" NON SIGNÉ créé dans Cloudinary
// (Dashboard > Settings > Upload > Upload presets > Add upload preset,
// Signing Mode = Unsigned), dont le nom est mis dans VITE_CLOUDINARY_UPLOAD_PRESET.
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo

/**
 * Upload une image vers Cloudinary depuis le navigateur (unsigned upload).
 * @param {File} file
 * @param {{ folder?: string, onProgress?: (percent:number)=>void }} opts
 * @returns {Promise<{ publicId: string, secureUrl: string }>}
 */
export function uploadToCloudinary(file, { folder, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Aucun fichier sélectionné')); return }
    if (!file.type.startsWith('image/')) { reject(new Error('Seules les images sont acceptées')); return }
    if (file.size > MAX_SIZE_BYTES) { reject(new Error('Image trop lourde (5 Mo max)')); return }
    if (!CLOUDINARY_CLOUD || !UPLOAD_PRESET) {
      reject(new Error("Upload d'image non configuré : VITE_CLOUDINARY_UPLOAD_PRESET manquant"))
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    if (folder) formData.append('folder', folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      let res = {}
      try { res = JSON.parse(xhr.responseText) } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && res.public_id) {
        resolve({ publicId: res.public_id, secureUrl: res.secure_url })
      } else {
        reject(new Error(res.error?.message || "Échec de l'envoi de l'image"))
      }
    }
    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'envoi de l'image"))
    xhr.send(formData)
  })
}
