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
  SiBun,
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
  'rust-blog': { Icon: SiRust, color: '#000000', bg: '#f2f0ea' },
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
  bun: { Icon: SiBun, color: '#000000', bg: '#f5f0e6' },
  ign: { Icon: SiIgn, color: '#bf1313', bg: '#fbe8e8' },
  'playstation-blog': { Icon: SiPlaystation, color: '#003791', bg: '#e6eefb' },
  'ars-gaming': { Icon: SiArstechnica, color: '#ff4e00', bg: '#ffece5' }
}

const fileIcons: Partial<Record<SignalSourceId, FileIcon>> = {
  chrome: { src: '/source-icons/chrome.svg' },
  geekpark: { src: '/source-icons/geekpark.svg' },
  ithome: { src: '/source-icons/ithome.png' },
  '36kr': { src: '/source-icons/36kr.svg' },
  'the-decoder': { src: '/source-icons/the-decoder.png' },
  'wheres-your-ed-at': { src: '/source-icons/wheres-your-ed-at.jpg' },
  chinatalk: { src: '/source-icons/chinatalk.jpg' },
  'trail-of-bits': { src: '/source-icons/trail-of-bits.png' },
  'big-technology': { src: '/source-icons/big-technology.png' },
  'pragmatic-engineer': { src: '/source-icons/pragmatic-engineer.png' },
  newcomer: { src: '/source-icons/newcomer.png' },
  voidzero: { src: '/source-icons/voidzero.svg' },
  'chips-and-cheese': { src: '/source-icons/chips-and-cheese.png' },
  '404-media': { src: '/source-icons/404-media.png' },
  'js-weekly': { src: '/source-icons/js-weekly.png' },
  'golang-weekly': { src: '/source-icons/golang-weekly.png' },
  'this-week-in-rust': { src: '/source-icons/this-week-in-rust.svg' },
  'krebs-security': { src: '/source-icons/krebs-security.ico' },
  'mit-tech-review': { src: '/source-icons/mit-tech-review.ico' },
  ruanyifeng: { src: '/source-icons/ruanyifeng.ico' },
  xinhua: { src: '/source-icons/xinhua.png' },
  cctv: { src: '/source-icons/cctv.svg' },
  chinanews: { src: '/source-icons/chinanews.png' },
  thepaper: { src: '/source-icons/thepaper.png' },
  jiemian: { src: '/source-icons/jiemian.png' },
  propublica: { src: '/source-icons/propublica.png' },
  grist: { src: '/source-icons/grist.png' },
  openai: { src: '/source-icons/openai.svg' },
  chatgpt: { src: '/source-icons/chatgpt.svg' },
  glm: { src: '/source-icons/glm.svg' },
  antigravity: { src: '/source-icons/antigravity.svg' },
  groq: { src: '/source-icons/groq.svg' },
  cohere: { src: '/source-icons/cohere.svg' },
  kimi: { src: '/source-icons/kimi.png' },
  vllm: { src: '/source-icons/vllm.svg' },
  modal: { src: '/source-icons/modal.svg' },
  sierra: { src: '/source-icons/sierra.svg' },
  together: { src: '/source-icons/together.svg' },
  'lilian-weng': { src: '/source-icons/lilian-weng.ico' },
  'simon-willison': { src: '/source-icons/simon-willison.ico' },
  metr: { src: '/source-icons/metr.png' },
  bair: { src: '/source-icons/bair.ico' },
  'ahead-of-ai': { src: '/source-icons/ahead-of-ai.png' },
  'aws-ml': { src: '/source-icons/aws-ml.png' },
  'redwood-research': { src: '/source-icons/redwood-research.png' },
  interconnects: { src: '/source-icons/interconnects.png' },
  'import-ai': { src: '/source-icons/import-ai.jpg' },
  'latent-space': { src: '/source-icons/latent-space.png' },
  dwarkesh: { src: '/source-icons/dwarkesh.jpg' },
  coolapk: { src: '/source-icons/coolapk.png' },
  hupu: { src: '/source-icons/hupu.png' },
  sspai: { src: '/source-icons/sspai.png' },
  ifanr: { src: '/source-icons/ifanr.ico' },
  appinn: { src: '/source-icons/appinn.jpg' },
  solidot: { src: '/source-icons/solidot.ico' },
  lifehacker: { src: '/source-icons/lifehacker.png' },
  torrentfreak: { src: '/source-icons/torrentfreak.svg' },
  'daring-fireball': { src: '/source-icons/daring-fireball.svg' },
  wallstreetcn: { src: '/source-icons/wallstreetcn.png' },
  cls: { src: '/source-icons/cls.svg' },
  jin10: { src: '/source-icons/jin10.png' },
  yicai: { src: '/source-icons/yicai.png' },
  stcn: { src: '/source-icons/stcn.png' },
  fortune: { src: '/source-icons/fortune.png' },
  'dl-news': { src: '/source-icons/dl-news.svg' },
  'marginal-revolution': { src: '/source-icons/marginal-revolution.png' },
  ritholtz: { src: '/source-icons/ritholtz.png' },
  'abnormal-returns': { src: '/source-icons/abnormal-returns.png' },
  'of-dollars-and-data': { src: '/source-icons/of-dollars-and-data.jpg' },
  unchained: { src: '/source-icons/unchained.png' },
  '3dmgame': { src: '/source-icons/3dmgame.svg' },
  gcores: { src: '/source-icons/gcores.png' },
  gamersky: { src: '/source-icons/gamersky.png' },
  ali213: { src: '/source-icons/ali213.png' },
  indienova: { src: '/source-icons/indienova.svg' },
  chuapp: { src: '/source-icons/chuapp.png' },
  '80lv': { src: '/source-icons/80lv.png' },
  'pc-gamer': { src: '/source-icons/pc-gamer.png' },
  'xbox-wire': { src: '/source-icons/xbox-wire.png' },
  gamelook: { src: '/source-icons/gamelook.png' },
  yystv: { src: '/source-icons/yystv.png' },
  aftermath: { src: '/source-icons/aftermath.png' },
  rpgfan: { src: '/source-icons/rpgfan.png' },
  'playstation-lifestyle': { src: '/source-icons/playstation-lifestyle.webp' },
  overkill: { src: '/source-icons/overkill.svg' }
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
