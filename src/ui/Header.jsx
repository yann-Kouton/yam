import { ChevronLeft } from 'lucide-react'

export function Header({ title, showBack, onBack, rightAction }) {
  return (
    <header 
      className="sticky top-0 z-30 w-full flex justify-center bg-[var(--bg)]"
    >
      <div className="flex items-center gap-3 w-full px-6 py-3" style={{ maxWidth: 1200 }}>
        {showBack && (
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[var(--muted)] flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
        <h1 className="flex-1 font-heading font-bold text-lg">
          <span className="text-[var(--primary)]">Yâ</span>{title}
        </h1>
        {rightAction}
      </div>
    </header>
  )
}
