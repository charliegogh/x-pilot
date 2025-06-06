import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const renderer = new marked.Renderer()

renderer.code = (rawCode: any, lang = '') => {
  let code = ''
  let resolvedLang = lang?.trim().split(' ')[0] || ''

  if (typeof rawCode === 'string') {
    code = rawCode
  } else if (typeof rawCode === 'object') {
    code = rawCode.text || ''
    resolvedLang = rawCode.lang || resolvedLang
  }

  let highlighted = ''
  try {
    if (resolvedLang && hljs.getLanguage(resolvedLang)) {
      highlighted = hljs.highlight(code, { language: resolvedLang }).value
    } else {
      resolvedLang = ''
      highlighted = hljs.highlightAuto(code).value
    }
  } catch (e) {
    console.warn('[Markdown Highlight Error]', e)
    highlighted = code.replace(/[<>&]/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!)
    )
  }

  return `
    <div class="code-block rounded-lg overflow-hidden bg-[#1e1e1e] text-white mb-4">
      <div class="code-toolbar flex justify-between items-center px-4 py-2 text-sm bg-[#2c2c2c] border-b border-gray-700">
        <span class="font-mono text-gray-400">${resolvedLang || ''}</span>
        <button class="code-copy text-gray-400 hover:text-white text-xs" data-copy>复制</button>
      </div>
      <pre class="m-0 overflow-x-auto"><code class="hljs ${resolvedLang}">${highlighted}</code></pre>
    </div>
  `
}

// 链接渲染，防止 href 为 undefined
renderer.link = ({ href, text, title }): string => {
  const safeHref = typeof href === 'string' && href !== 'undefined' ? href : ''
  const titleAttr = title ? ` title="${title}"` : ''

  if (!safeHref) {
    return `<span class="text-gray-400">${text}</span>`
  }

  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline"${titleAttr}>${text}</a>`
}

marked.setOptions({
  gfm: true,
  breaks: false,
  renderer
})

export const renderMarkdown = (markdown: string) =>
  typeof markdown === 'string' ? marked(markdown) : ''
