export function FeedStatus({ itemCount }: { itemCount: number }) {
  return <span className="text-xs tabular-nums text-muted-foreground">{itemCount} 条内容</span>
}
