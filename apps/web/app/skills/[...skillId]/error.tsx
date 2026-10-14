'use client'
import Link from 'next/link'
export default function SkillError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-3xl px-5 py-16">
      <p>暂时无法加载 Skill</p>
      <div className="mt-4 flex gap-5">
        <button type="button" className="min-h-11 text-primary" onClick={reset}>
          重试
        </button>
        <Link className="min-h-11 py-3 text-primary" href="/skills">
          返回 Skills
        </Link>
      </div>
    </div>
  )
}
