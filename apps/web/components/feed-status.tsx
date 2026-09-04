import { Badge } from './ui/badge'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export function FeedStatus({
  itemCount,
  lastSuccessAt
}: {
  itemCount: number
  lastSuccessAt: Date
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <Badge className="rounded-sm bg-accent text-accent-foreground" variant="secondary">
        {itemCount} 条
      </Badge>
      <span>
        更新于{' '}
        <time dateTime={lastSuccessAt.toISOString()}>{dateFormatter.format(lastSuccessAt)}</time>
      </span>
    </div>
  )
}
