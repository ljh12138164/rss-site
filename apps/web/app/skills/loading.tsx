import { SectionLoading } from '../../components/section-loading'
import { SiteShell } from '../../components/site-shell'
import { SkillsHeader } from './page'

export default function SkillsLoading() {
  return (
    <SiteShell>
      <SkillsHeader />
      <div className="mb-6 h-11 w-48 border-b border-border" />
      <SectionLoading />
    </SiteShell>
  )
}
