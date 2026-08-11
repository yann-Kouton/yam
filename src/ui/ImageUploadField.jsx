import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cloudImg } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { useApp } from '../context/AppContext'

/**
 * Champ d'upload d'image direct vers Cloudinary.
 *
 * Props:
 * - label: libellé affiché au-dessus
 * - cloudinaryId: publicId Cloudinary actuel (prioritaire à l'affichage)
 * - imageUrl: ancienne URL brute (fallback, pour compat avec les données existantes)
 * - folder: dossier Cloudinary de destination (ex: 'yamarche/products')
 * - onUploaded(publicId): appelé après un upload réussi
 * - onRemove(): appelé quand l'utilisateur retire l'image
 */
export function ImageUploadField({ label = 'Photo', cloudinaryId, imageUrl, folder, onUploaded, onRemove }) {
  const { showToast } = useApp()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [localPreview, setLocalPreview] = useState(null)

  const preview = localPreview || (cloudinaryId ? cloudImg(cloudinaryId, 'w_500,q_auto,f_auto') : imageUrl)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setUploading(true)
    setProgress(0)
    try {
      const { publicId } = await uploadToCloudinary(file, { folder, onProgress: setProgress })
      onUploaded?.(publicId)
      showToast('Image envoyée', 'success')
    } catch (err) {
      showToast(err.message, 'error')
      setLocalPreview(null)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setLocalPreview(null)
    onRemove?.()
  }

  return (
    <div>
      {label && <p className="text-xs font-semibold text-[var(--muted-fg)] mb-1.5">{label}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative w-full h-36 rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] overflow-hidden flex items-center justify-center cursor-pointer"
      >
        {preview ? (
          <>
            <img src={preview} alt="aperçu" className="w-full h-full object-cover" />
            {!uploading && (
              <button type="button" onClick={handleRemove}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[var(--muted-fg)]">
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs font-medium">Ajouter une photo</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1.5 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-semibold">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
