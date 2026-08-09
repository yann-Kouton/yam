import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

const CONFIG = {
  pending:   { label: 'En attente',  icon: Clock,        cls: 'bg-amber-50 text-amber-600' },
  approved:  { label: 'Approuvé',    icon: CheckCircle2, cls: 'bg-[var(--secondary-light)] text-[var(--secondary)]' },
  rejected:  { label: 'Refusé',      icon: XCircle,      cls: 'bg-red-50 text-red-500' },
  active:    { label: 'Actif',       icon: CheckCircle2, cls: 'bg-[var(--secondary-light)] text-[var(--secondary)]' },
  suspended: { label: 'Suspendu',    icon: XCircle,      cls: 'bg-red-50 text-red-500' },
  open:      { label: 'Ouvert',      icon: AlertTriangle,cls: 'bg-amber-50 text-amber-600' },
  resolved:  { label: 'Résolu',      icon: CheckCircle2, cls: 'bg-[var(--secondary-light)] text-[var(--secondary)]' },
  none:      { label: 'Aucune',      icon: Clock,        cls: 'bg-gray-100 text-gray-400' },
}

export function StatusPill({ status }) {
  const cfg = CONFIG[status] || CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1 text-[.65rem] font-bold px-2 py-1 rounded-full ${cfg.cls}`}>
      <cfg.icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}
