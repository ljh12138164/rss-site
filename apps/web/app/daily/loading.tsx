import { SiteShell } from '../../components/site-shell'

export default function DailyLoading() {
  return (
    <SiteShell>
      <div
        role="status"
        aria-label="正在加载日报"
        className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]"
      >
        <div className="hidden space-y-4 lg:block">
          {[1, 2, 3, 4, 5].map((id) => (
            <div key={id} className="h-16 bg-muted" />
          ))}
        </div>
        <div className="space-y-8">
          <div className="h-36 border-b border-border bg-muted/50" />
          <div className="h-24 bg-muted/50" />
          <div className="h-64 bg-muted/50" />
        </div>
      </div>
    </SiteShell>
  )
}
