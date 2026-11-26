import { describe, expect, it } from 'vitest'
import { renderArticleContent } from './article-content'
import { isPlaceholderZhihuAuthor, parseZhihuQaContent } from './zhihu-qa'

describe('zhihu Q&A parser', () => {
  it('identifies placeholder zhihu hot-list author only for zhihu', () => {
    expect(isPlaceholderZhihuAuthor('zhihu', '用户')).toBe(true)
    expect(isPlaceholderZhihuAuthor('zhihu', ' 用户 ')).toBe(true)
    expect(isPlaceholderZhihuAuthor('zhihu', '赵泠')).toBe(false)
    expect(isPlaceholderZhihuAuthor('zhihu', null)).toBe(false)
    expect(isPlaceholderZhihuAuthor('hupu', '用户')).toBe(false)
  })

  it('extracts question context and multiple top answers with votes and outbound URLs', () => {
    const rawHtml =
      '<blockquote><p>刚刚，黎曼猜想证明代码暴砍了99.5%！</p></blockquote>' +
      '<div><h3><a href="https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214155">赵泠（1,026 赞同）</a></h3><p>我认为这是完全正常的推进。</p></div>' +
      '<div><hr /><h3><a href="https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214999">答主乙</a></h3><p>补充另一视角。</p></div>'
    const sanitized = renderArticleContent(
      rawHtml,
      'https://www.zhihu.com/question/2109221701389239407',
      'social'
    )
    const parsed = parseZhihuQaContent(sanitized)

    expect(parsed).not.toBeNull()
    expect(parsed?.questionContextHtml).toBe('<p>刚刚，黎曼猜想证明代码暴砍了99.5%！</p>')
    expect(parsed?.answers).toHaveLength(2)
    expect(parsed?.answers[0]).toEqual({
      id: '2109245710856214155',
      author: '赵泠',
      voteupCount: 1026,
      url: 'https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214155',
      bodyHtml: '<p>我认为这是完全正常的推进。</p>'
    })
    expect(parsed?.answers[1]).toEqual({
      id: '2109245710856214999',
      author: '答主乙',
      voteupCount: 0,
      url: 'https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214999',
      bodyHtml: '<p>补充另一视角。</p>'
    })
  })

  it('drops image-only placeholder question contexts, strips empty headings/paragraphs, and demotes inner h2 headings', () => {
    const rawHtml =
      '<blockquote><p>[5 张图片]</p></blockquote>' +
      '<div><h3><a href="https://www.zhihu.com/question/2109256447582266632/answer/2109267949890621542">猫样（800 赞同）</a></h3>' +
      '<h2></h2><p><br /></p><p><b>先说结论：</b></p><h2><b>1、落地 1 个月坏了</b></h2><p>正文段落。</p><p>&nbsp;</p></div>'
    const sanitized = renderArticleContent(
      rawHtml,
      'https://www.zhihu.com/question/2109256447582266632',
      'social'
    )
    const parsed = parseZhihuQaContent(sanitized)

    expect(parsed).not.toBeNull()
    expect(parsed?.questionContextHtml).toBeNull()
    expect(parsed?.answers).toHaveLength(1)
    expect(parsed?.answers[0].author).toBe('猫样')
    expect(parsed?.answers[0].voteupCount).toBe(800)
    expect(parsed?.answers[0].bodyHtml).toBe(
      '<p><b>先说结论：</b></p><h3><b>1、落地 1 个月坏了</b></h3><p>正文段落。</p>'
    )
  })

  it('supports h2 answer headers and questions without an excerpt blockquote', () => {
    const rawHtml =
      '<div><h2><a href="https://www.zhihu.com/question/1930259032301610887/answer/1931446580172551370">小呆呆（1307 赞同）</a></h2><p>回答内容。</p></div>'
    const sanitized = renderArticleContent(
      rawHtml,
      'https://www.zhihu.com/question/1930259032301610887',
      'social'
    )
    const parsed = parseZhihuQaContent(sanitized)

    expect(parsed).toEqual({
      questionContextHtml: null,
      answers: [
        {
          id: '1931446580172551370',
          author: '小呆呆',
          voteupCount: 1307,
          url: 'https://www.zhihu.com/question/1930259032301610887/answer/1931446580172551370',
          bodyHtml: '<p>回答内容。</p>'
        }
      ]
    })
  })

  it('returns null for legacy excerpt-only zhihu items or non-answer HTML', () => {
    expect(parseZhihuQaContent('<p>只是一段普通问题描述摘要。</p>')).toBeNull()
    expect(
      parseZhihuQaContent(
        '<h3><a href="https://www.zhihu.com/question/123">问题链接而非回答</a></h3><p>正文</p>'
      )
    ).toBeNull()
  })
})
