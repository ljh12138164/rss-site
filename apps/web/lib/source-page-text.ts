import type { SignalSource } from './technology-sources'

export const AI_DESCRIPTION = '汇集 AI 官方动态、产品更新、大模型研究与技术博客。'

export function aiSourcePageText(
  source: Pick<SignalSource, 'id' | 'name' | 'description'>,
  translate?: (message: string, values?: Record<string, string>) => string
) {
  const description = translate?.(source.description) ?? source.description
  const title =
    source.id === 'openai'
      ? 'OpenAI 最新动态与官方文章'
      : source.id === 'chatgpt'
        ? 'ChatGPT 更新日志与新功能'
        : `${source.name} ${description}`
  return {
    title: translate?.(title) ?? title,
    description:
      translate?.('{name}：{description}。', { name: source.name, description }) ??
      `${source.name}：${description}。`
  }
}
