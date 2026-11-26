import { TranslatedText } from './site-language'

export function FeedStatus({ itemCount }: { itemCount: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      <TranslatedText id="common.itemCount" values={{ count: itemCount }} />
    </span>
  )
}
