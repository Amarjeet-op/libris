export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] px-8 py-14 text-center">
      {Icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--ink-faint)]">
          <Icon size={20} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-[15px] font-medium text-[var(--ink-soft)]">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-[var(--ink-faint)]">{subtitle}</p>}
      {action}
    </div>
  );
}
