import Image from 'next/image'
import type { ComponentType } from 'react'
import {
  SiAmd,
  SiAnthropic,
  SiApple,
  SiArm,
  SiArstechnica,
  SiBaidu,
  SiBilibili,
  SiBytedance,
  SiCloudflare,
  SiDeepseek,
  SiElevenlabs,
  SiGithub,
  SiGo,
  SiGooglegemini,
  SiIgn,
  SiJuejin,
  SiKotlin,
  SiLinear,
  SiMeta,
  SiMinimax,
  SiNetflix,
  SiNvidia,
  SiPlaystation,
  SiQwen,
  SiRust,
  SiSmashingmagazine,
  SiSvelte,
  SiSwift,
  SiTypescript,
  SiVercel,
  SiYcombinator,
  SiZhihu
} from 'react-icons/si'
import { getSignalSource, type SignalSource, type SignalSourceId } from '../lib/technology-sources'
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
  'cloudflare-blog': { Icon: SiCloudflare, color: '#f38020', bg: '#fff3e6' },
  nvidia: { Icon: SiNvidia, color: '#76b900', bg: '#f0f8e4' },
  amd: { Icon: SiAmd, color: '#ed1c24', bg: '#fde8e9' },
  arm: { Icon: SiArm, color: '#0091bd', bg: '#e6f5fa' },
  'rust-blog': { Icon: SiRust, color: '#ce422b', bg: '#fcebe8' },
  'this-week-in-rust': { Icon: SiRust, color: '#ce422b', bg: '#fcebe8' },
  'go-blog': { Icon: SiGo, color: '#00add8', bg: '#e5f7fc' },
  'svelte-blog': { Icon: SiSvelte, color: '#ff3e00', bg: '#ffece5' },
  'typescript-blog': { Icon: SiTypescript, color: '#3178c6', bg: '#e8f1fb' },
  'swift-blog': { Icon: SiSwift, color: '#f05138', bg: '#fdece9' },
  'kotlin-blog': { Icon: SiKotlin, color: '#7f52ff', bg: '#f1ecff' },
  'netflix-tech': { Icon: SiNetflix, color: '#e50914', bg: '#fce6e7' },
  'meta-engineering': { Icon: SiMeta, color: '#0467df', bg: '#e6f0fe' },
  'smashing-magazine': { Icon: SiSmashingmagazine, color: '#d33a2c', bg: '#fbeae8' },
  'skills-all-time': { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'skills-trending': { Icon: SiGithub, color: '#181717', bg: '#f2f0ea' },
  'hacker-news': { Icon: SiYcombinator, color: '#ffffff', bg: '#f0652f' },
  juejin: { Icon: SiJuejin, color: '#ffffff', bg: '#1e80ff' },
  baidu: { Icon: SiBaidu, color: '#2932e1', bg: '#e9ebfe' },
  anthropic: { Icon: SiAnthropic, color: '#d97757', bg: '#fbe9e2' },
  deepseek: { Icon: SiDeepseek, color: '#4d6bfe', bg: '#e8edff' },
  'google-ai': { Icon: SiGooglegemini, color: '#1c72fb', bg: '#e6f0fe' },
  qwen: { Icon: SiQwen, color: '#615ced', bg: '#ecebfe' },
  minimax: { Icon: SiMinimax, color: '#e21f64', bg: '#fdebf1' },
  elevenlabs: { Icon: SiElevenlabs, color: '#000000', bg: '#f2f0ea' },
  'apple-ml': { Icon: SiApple, color: '#000000', bg: '#f2f0ea' },
  bilibili: { Icon: SiBilibili, color: '#00a1d6', bg: '#e0f4fb' },
  zhihu: { Icon: SiZhihu, color: '#ffffff', bg: '#0084ff' },
  toutiao: { Icon: SiBytedance, color: '#325ab4', bg: '#e7edfb' },
  vercel: { Icon: SiVercel, color: '#000000', bg: '#f2f0ea' },
  linear: { Icon: SiLinear, color: '#5e6ad2', bg: '#eef0fc' },
  'ars-technica': { Icon: SiArstechnica, color: '#ff4e00', bg: '#ffece5' },
  ign: { Icon: SiIgn, color: '#bf1313', bg: '#fbe8e8' },
  'playstation-blog': { Icon: SiPlaystation, color: '#003791', bg: '#e6eefb' },
  'ars-gaming': { Icon: SiArstechnica, color: '#ff4e00', bg: '#ffece5' }
}

const fileIcons: Partial<Record<SignalSourceId, FileIcon>> = {
  chrome: { src: '/source-icons/chrome.svg' },
  bun: { src: '/source-icons/bun.svg' },
  geekpark: { src: '/source-icons/geekpark.svg' },
  ithome: { src: '/source-icons/ithome.webp' },
  '36kr': { src: '/source-icons/36kr.svg' },
  'the-decoder': { src: '/source-icons/the-decoder.webp' },
  'wheres-your-ed-at': { src: '/source-icons/wheres-your-ed-at.jpg' },
  chinatalk: { src: '/source-icons/chinatalk.jpg' },
  'trail-of-bits': { src: '/source-icons/trail-of-bits.webp' },
  'big-technology': { src: '/source-icons/big-technology.webp' },
  'pragmatic-engineer': { src: '/source-icons/pragmatic-engineer.webp' },
  newcomer: { src: '/source-icons/newcomer.webp' },
  voidzero: { src: '/source-icons/voidzero.svg' },
  'chips-and-cheese': { src: '/source-icons/chips-and-cheese.webp' },
  '404-media': { src: '/source-icons/404-media.webp' },
  'js-weekly': { src: '/source-icons/js-weekly.webp' },
  'golang-weekly': { src: '/source-icons/golang-weekly.webp' },
  'krebs-security': { src: '/source-icons/krebs-security.ico' },
  'mit-tech-review': { src: '/source-icons/mit-tech-review.webp' },
  ruanyifeng: { src: '/source-icons/ruanyifeng.ico' },
  xinhua: { src: '/source-icons/xinhua.webp' },
  cctv: { src: '/source-icons/cctv.svg' },
  chinanews: { src: '/source-icons/chinanews.webp' },
  thepaper: { src: '/source-icons/thepaper.webp' },
  jiemian: { src: '/source-icons/jiemian.webp' },
  propublica: { src: '/source-icons/propublica.webp' },
  grist: { src: '/source-icons/grist.webp' },
  openai: { src: '/source-icons/openai.svg' },
  chatgpt: { src: '/source-icons/chatgpt.svg' },
  glm: { src: '/source-icons/glm.svg' },
  antigravity: { src: '/source-icons/antigravity.svg' },
  groq: { src: '/source-icons/groq.svg' },
  cohere: { src: '/source-icons/cohere.svg' },
  kimi: { src: '/source-icons/kimi.webp' },
  vllm: { src: '/source-icons/vllm.svg' },
  modal: { src: '/source-icons/modal.svg' },
  sierra: { src: '/source-icons/sierra.svg' },
  together: { src: '/source-icons/together.svg' },
  'lilian-weng': { src: '/source-icons/lilian-weng.ico' },
  'simon-willison': { src: '/source-icons/simon-willison.ico' },
  metr: { src: '/source-icons/metr.webp' },
  bair: { src: '/source-icons/bair.ico' },
  'ahead-of-ai': { src: '/source-icons/ahead-of-ai.webp' },
  'aws-ml': { src: '/source-icons/aws-ml.webp' },
  'redwood-research': { src: '/source-icons/redwood-research.webp' },
  interconnects: { src: '/source-icons/interconnects.webp' },
  'import-ai': { src: '/source-icons/import-ai.jpg' },
  'latent-space': { src: '/source-icons/latent-space.webp' },
  dwarkesh: { src: '/source-icons/dwarkesh.jpg' },
  coolapk: { src: '/source-icons/coolapk.webp' },
  hupu: { src: '/source-icons/hupu.webp' },
  sspai: { src: '/source-icons/sspai.webp' },
  ifanr: { src: '/source-icons/ifanr.webp' },
  appinn: { src: '/source-icons/appinn.jpg' },
  solidot: { src: '/source-icons/solidot.ico' },
  lifehacker: { src: '/source-icons/lifehacker.webp' },
  torrentfreak: { src: '/source-icons/torrentfreak.webp' },
  'daring-fireball': { src: '/source-icons/daring-fireball.webp' },
  wallstreetcn: { src: '/source-icons/wallstreetcn.webp' },
  cls: { src: '/source-icons/cls.svg' },
  jin10: { src: '/source-icons/jin10.webp' },
  yicai: { src: '/source-icons/yicai.webp' },
  stcn: { src: '/source-icons/stcn.webp' },
  fortune: { src: '/source-icons/fortune.webp' },
  'dl-news': { src: '/source-icons/dl-news.svg' },
  'marginal-revolution': { src: '/source-icons/marginal-revolution.webp' },
  ritholtz: { src: '/source-icons/ritholtz.webp' },
  'abnormal-returns': { src: '/source-icons/abnormal-returns.webp' },
  'of-dollars-and-data': { src: '/source-icons/of-dollars-and-data.jpg' },
  unchained: { src: '/source-icons/unchained.webp' },
  '3dmgame': { src: '/source-icons/3dmgame.svg' },
  gcores: { src: '/source-icons/gcores.webp' },
  gamersky: { src: '/source-icons/gamersky.webp' },
  ali213: { src: '/source-icons/ali213.webp' },
  indienova: { src: '/source-icons/indienova.svg' },
  chuapp: { src: '/source-icons/chuapp.webp' },
  '80lv': { src: '/source-icons/80lv.webp' },
  'pc-gamer': { src: '/source-icons/pc-gamer.webp' },
  'xbox-wire': { src: '/source-icons/xbox-wire.webp' },
  gamelook: { src: '/source-icons/gamelook.webp' },
  yystv: { src: '/source-icons/yystv.webp' },
  aftermath: { src: '/source-icons/aftermath.webp' },
  rpgfan: { src: '/source-icons/rpgfan.webp' },
  'playstation-lifestyle': { src: '/source-icons/playstation-lifestyle.webp' },
  overkill: { src: '/source-icons/overkill.webp' }
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
          'inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm ring-1 ring-border/60',
          className
        )}
        style={{ backgroundColor: bg }}
      >
        <Icon className="size-3.5" style={{ color }} />
      </span>
    )
  }

  const file = fileIcons[source.id]
  if (!file) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted font-mono text-[10px] leading-none font-semibold text-muted-foreground ring-1 ring-border/60',
          className
        )}
      >
        {getSignalSource(source.id).code}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white p-0.5 ring-1 ring-border/60',
        className
      )}
    >
      <Image
        alt=""
        loading="lazy"
        className="size-full object-contain"
        height={20}
        src={file.src}
        unoptimized
        width={20}
      />
    </span>
  )
}
