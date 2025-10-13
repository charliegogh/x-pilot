export function parseStreamChunk(
  chunk: Uint8Array,
  buffer = ''
): {
    contents: string[];
    isDone: boolean;
    buffer: string;
    sessionId?: string;
} {
  const decoder = new TextDecoder('utf-8')
  const text = buffer + decoder.decode(chunk, { stream: true })

  const lines = text.split('\n')
  const contents: string[] = []
  let remainingBuffer = ''
  let isDone = false
  let sessionId: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith(':HTTP_STATUS')) continue

    if (line === 'data: [DONE]') {
      isDone = true
      continue
    }

    if (!line.startsWith('data:')) continue

    const jsonStr = line.replace('data:', '').trim()
    const isLastLine = i === lines.length - 1

    if (isLastLine && !jsonStr.endsWith('}') && !jsonStr.endsWith(']')) {
      remainingBuffer = line
      continue
    }

    try {
      const json = JSON.parse(jsonStr)
      const text = json?.output?.text ?? ''
      const finish = json?.output?.finish_reason

      if (text) contents.push(text)

      // 提取 session_id（只取第一个）
      if (!sessionId && typeof json?.output?.session_id === 'string') {
        sessionId = json.output.session_id
      }

      if (finish === 'stop') isDone = true
    } catch (err) {
      console.warn('JSON 解析失败，跳过:', jsonStr)
    }
  }

  return {
    contents,
    isDone,
    buffer: remainingBuffer,
    sessionId
  }
}
