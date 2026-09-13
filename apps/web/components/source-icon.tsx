import Image from 'next/image'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'

const sourceIconPaths: Record<SignalSourceId, string> = {
  github: '/source-icons/github.svg',
  'github-blog': '/source-icons/github.svg',
  'hacker-news': '/source-icons/hacker-news.svg',
  juejin: '/source-icons/juejin.svg',
  ithome: '/source-icons/ithome.png',
  '36kr': '/source-icons/36kr.svg',
  xinhua: '/source-icons/xinhua.png',
  cctv: '/source-icons/cctv.svg',
  chinanews: '/source-icons/chinanews.png',
  thepaper: '/source-icons/thepaper.png',
  jiemian: '/source-icons/jiemian.png',
  baidu: '/source-icons/baidu.svg',
  openai: '/source-icons/openai.svg',
  chatgpt: '/source-icons/openai.svg',
  anthropic: '/source-icons/anthropic.svg',
  deepseek: '/source-icons/deepseek.svg',
  glm: '/source-icons/glm.svg',
  'google-ai': '/source-icons/google-ai.svg',
  qwen: '/source-icons/qwen.svg',
  bilibili: '/source-icons/bilibili.svg',
  zhihu: '/source-icons/zhihu.svg',
  coolapk: '/source-icons/coolapk.png',
  hupu: '/source-icons/hupu.png',
  sspai: '/source-icons/sspai.png',
  toutiao: '/source-icons/toutiao.png',
  wallstreetcn: '/source-icons/wallstreetcn.png',
  cls: '/source-icons/cls.svg',
  jin10: '/source-icons/jin10.png',
  yicai: '/source-icons/yicai.png',
  stcn: '/source-icons/stcn.png',
  '3dmgame': '/source-icons/3dmgame.svg',
  gcores: '/source-icons/gcores.png',
  gamersky: '/source-icons/gamersky.png',
  ali213: '/source-icons/ali213.png',
  indienova: '/source-icons/indienova.svg'
}

export function SourceIcon({
  className,
  source
}: {
  className?: string
  source: Pick<SignalSource, 'id'>
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-border/70',
        className
      )}
    >
      <Image
        alt=""
        className="size-full object-contain"
        height={20}
        src={sourceIconPaths[source.id]}
        unoptimized
        width={20}
      />
    </span>
  )
}
