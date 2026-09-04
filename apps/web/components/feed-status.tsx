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
      <span className="inline-flex min-h-6 items-center bg-accent px-2 font-medium text-accent-foreground">
        {itemCount} 条
      </span>
      <span>
        更新于{' '}
        <time dateTime={lastSuccessAt.toISOString()}>{dateFormatter.format(lastSuccessAt)}</time>
      </span>
    </div>
  )
}
