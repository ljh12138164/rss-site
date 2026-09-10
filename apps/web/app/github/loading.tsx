import { SectionLoading } from '../../components/section-loading'
import { SiteShell } from '../../components/site-shell'
import { GithubRankingHeader } from './page'

export default function GithubRankingLoading() {
  return (
    <SiteShell>
      <GithubRankingHeader />
      <SectionLoading />
    </SiteShell>
  )
}
