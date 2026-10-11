import type { SignalSource } from './technology-sources'

export const AI_DESCRIPTION =
  '汇集 AI 官方动态、产品更新、大模型研究与技术博客，保留来源与原文链接。'

export function aiSourcePageText(source: Pick<SignalSource, 'id' | 'name' | 'description'>) {
  const title =
    source.id === 'openai'
      ? 'OpenAI 最新动态与官方文章'
      : source.id === 'chatgpt'
        ? 'ChatGPT 更新日志与新功能'
        : `${source.name} ${source.description}`
  return {
    title,
    description: `${source.name}：${source.description}。按发布时间浏览，保留文章来源与原文链接。`
  }
}
