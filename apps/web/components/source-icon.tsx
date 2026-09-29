import Image from 'next/image'
import type { ComponentType } from 'react'
import {
  SiAnthropic,
  SiBaidu,
  SiBilibili,
  SiBytedance,
  SiDeepseek,
  SiGithub,
  SiGooglegemini,
  SiJuejin,
  SiQwen,
  SiYcombinator,
  SiZhihu
} from 'react-icons/si'
import type { SignalSource, SignalSourceId } from '../lib/technology-sources'
import { cn } from '../lib/utils'

/** Brand-colored icon from react-icons/simple-icons. */
interface BrandIcon {
  Icon: ComponentType<{ className?: string; style?: React.CSSProperties }>
  /** Official brand hex (simple-icons). */
  color: string
  /** Chip background — light tinted brand wash so the mark reads on both themes. */
  bg: string
}

/** Local file that is already in color (PNG or multi-color SVG). */
interface FileIcon {
  src: string
}

const brandIcons: Partial<Record<SignalSourceId, BrandIcon>> = {
  github: { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'github-blog': { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'skills-all-time': { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'skills-trending': { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'hacker-news': { Icon: SiYcombinator, color: '#ffffff', bg: '#f0652f' },
  juejin: { Icon: SiJuejin, color: '#ffffff', bg: '#1e80ff' },
  baidu: { Icon: SiBaidu, color: '#2932e1', bg: '#e9ebfe' },
  anthropic: { Icon: SiAnthropic, color: '#d97757', bg: '#fbe9e2' },
  deepseek: { Icon: SiDeepseek, color: '#4d6bfe', bg: '#e8edff' },
  'google-ai': { Icon: SiGooglegemini, color: '#1c72fb', bg: '#e6f0fe' },
  qwen: { Icon: SiQwen, color: '#615ced', bg: '#ecebfe' },
  bilibili: { Icon: SiBilibili, color: '#00a1d6', bg: '#e0f4fb' },
  zhihu: { Icon: SiZhihu, color: '#ffffff', bg: '#0084ff' },
  toutiao: { Icon: SiBytedance, color: '#325ab4', bg: '#e7edfb' }
}

const fileIcons: Partial<Record<SignalSourceId, FileIcon>> = {
  ithome: { src: '/source-icons/ithome.png' },
  '36kr': { src: '/source-icons/36kr.svg' },
  xinhua: { src: '/source-icons/xinhua.png' },
  cctv: { src: '/source-icons/cctv.svg' },
  chinanews: { src: '/source-icons/chinanews.png' },
  thepaper: { src: '/source-icons/thepaper.png' },
  jiemian: { src: '/source-icons/jiemian.png' },
  openai: { src: '/source-icons/openai.svg' },
  chatgpt: { src: '/source-icons/chatgpt.svg' },
  glm: { src: '/source-icons/glm.svg' },
  coolapk: { src: '/source-icons/coolapk.png' },
  hupu: { src: '/source-icons/hupu.png' },
  sspai: { src: '/source-icons/sspai.png' },
  wallstreetcn: { src: '/source-icons/wallstreetcn.png' },
  cls: { src: '/source-icons/cls.svg' },
  jin10: { src: '/source-icons/jin10.png' },
  yicai: { src: '/source-icons/yicai.png' },
  stcn: { src: '/source-icons/stcn.png' },
  '3dmgame': { src: '/source-icons/3dmgame.svg' },
  gcores: { src: '/source-icons/gcores.png' },
  gamersky: { src: '/source-icons/gamersky.png' },
  ali213: { src: '/source-icons/ali213.png' },
  indienova: { src: '/source-icons/indienova.svg' }
}

export function SourceIcon({
  className,
  source
}: {
  className?: string
  source: Pick<SignalSource, 'id'>
}) {
  const brand = brandIcons[source.id]
  if (brand) {
    const { Icon, color, bg } = brand
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-border/60',
          className
        )}
        style={{ backgroundColor: bg }}
      >
        <Icon className="size-3.5" style={{ color }} />
      </span>
    )
  }

  const file = fileIcons[source.id]
  if (!file) return null

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-border/60',
        className
      )}
    >
      <Image
        alt=""
        className="size-full object-contain"
        height={20}
        src={file.src}
        unoptimized
        width={20}
      />
    </span>
  )
}
