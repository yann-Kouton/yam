export function SectionHeader({ title, titleIcon: TitleIcon, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="section-title flex items-center gap-1.5">
        {title}{TitleIcon && <TitleIcon className="w-4 h-4 text-[var(--primary)]" />}
      </h2>
      {action && <button className="text-[var(--primary)] font-semibold text-sm" onClick={onAction}>{action}</button>}
    </div>
  )
}
