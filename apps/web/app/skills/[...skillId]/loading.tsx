import { SiteShell } from '../../../components/site-shell'
export default function Loading() {
  return (
    <SiteShell>
      <div role="status" aria-label="正在加载 Skill" aria-busy="true" className="space-y-6">
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-20 rounded bg-muted" />
        <div className="h-28 rounded bg-muted" />
        <div className="h-72 rounded bg-muted" />
      </div>
    </SiteShell>
  )
}
