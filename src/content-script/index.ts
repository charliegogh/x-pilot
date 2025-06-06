import eventBus from '~/eventBus'

eventBus.on('getPageData', (params, cb) => {
  // 第一优先级
  let elements = document.querySelectorAll('.js-studyAchievement')

  // 第二优先级
  if (!elements || elements.length === 0) {
    elements = document.querySelectorAll('.ChapterContainerWrap')
  }

  let content = ''

  if (elements && elements.length > 0) {
    content = Array.from(elements).map(el => el.textContent?.trim() || '').join('\n')
  } else {
    // 第三级：标准爬取策略（标题 + 段落）
    const titles = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    const paragraphs = Array.from(document.querySelectorAll('p'))

    const titleText = titles.map(el => `# ${el.textContent?.trim() || ''}`).join('\n')
    const paragraphText = paragraphs.map(el => el.textContent?.trim() || '').join('\n\n')

    content = `${titleText}\n\n${paragraphText}`
  }

  const meta = (name: string) => {
    const el = document.querySelector(`meta[name="${name}"]`)
    return el?.getAttribute('content') || ''
  }
  console.log(document.title, '开始获取网页数据')
  cb({
    title: document.title || '',
    content,
    keywords: meta('keywords'),
    description: meta('description'),
    url: location.href
  })
})
