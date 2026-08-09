// Blocs de chargement "squelette" — remplacent le Spinner générique par une
// prévisualisation animée qui épouse la forme réelle du contenu à venir.

function Block({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--muted)] ${className}`} />
}

/** Grille de produits (Accueil / Marché) — imite ProductCard. */
export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card overflow-hidden">
          <Block className="w-full h-36 rounded-none" />
          <div className="p-3 flex flex-col gap-2">
            <Block className="h-3.5 w-4/5" />
            <Block className="h-3 w-1/3" />
            <div className="flex items-center justify-between mt-1">
              <Block className="h-4 w-16" />
              <Block className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Chips de catégories défilantes (Accueil). */
export function ChipsSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Block key={i} className="flex-shrink-0 w-[80px] h-[68px] rounded-2xl" />
      ))}
    </div>
  )
}

/** Cartes larges avec image (Yâsurplus / bons plans). */
export function SurplusCardSkeleton({ count = 2 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surplus-card overflow-hidden">
          <Block className="w-full h-40 rounded-none" />
          <div className="p-3 flex flex-col gap-2">
            <Block className="h-3.5 w-1/2" />
            <Block className="h-3 w-2/3" />
            <Block className="h-3 w-full" />
            <div className="flex items-center justify-between mt-1">
              <Block className="h-4 w-20" />
              <Block className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Ligne de carte générique (commandes, utilisateurs, signalements, produits
 * vendeur/admin...). `withThumb` ajoute un carré d'image à gauche.
 */
export function RowListSkeleton({ count = 4, withThumb = false, lines = 2 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-3 flex items-center gap-3">
          {withThumb && <Block className="w-14 h-14 rounded-xl flex-shrink-0" />}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Block className="h-3.5 w-2/3" />
            {Array.from({ length: lines - 1 }).map((_, j) => (
              <Block key={j} className="h-3 w-1/3" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Grille de statistiques 2x2 (tableaux de bord vendeur / admin). */
export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex flex-col gap-2">
          <Block className="h-5 w-5 rounded-md" />
          <Block className="h-6 w-12" />
          <Block className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

/** Quelques blocs de lignes génériques, pour les formulaires/écrans mixtes. */
export function FormSkeleton() {
  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Block className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Block className="h-9 flex-1 rounded-xl" />
          <Block className="h-9 flex-1 rounded-xl" />
          <Block className="h-9 flex-1 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Block className="h-3 w-1/4" />
        <Block className="h-10 w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-2">
        <Block className="h-3 w-1/4" />
        <Block className="h-20 w-full rounded-xl" />
      </div>
      <Block className="h-11 w-full rounded-xl" />
    </div>
  )
}
